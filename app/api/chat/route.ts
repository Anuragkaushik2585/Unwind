import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// ✅ FIX 2: Only real, currently available Gemini models
const MODELS = [
  "gemini-3.1-flash-lite",  // fastest, 15 RPM
  "gemini-2.5-flash-lite",  // fast, 15 RPM  
  "gemini-2.5-flash",       // smarter, 10 RPM
  "gemini-3.5-flash",       // best quality, last resort
];

// ─────────────────────────────────────────────
// Extract keywords from the conversation so far
// to filter events before sending to the model
// ─────────────────────────────────────────────
function extractFilters(messages: { role: string; text: string }[]) {
  const fullText = messages.map((m) => m.text).join(" ").toLowerCase();

  // Mood detection
  const moodMap: Record<string, string[]> = {
    relaxing: ["relax", "chill", "calm", "peaceful", "quiet", "unwind"],
    social: ["social", "friends", "group", "people", "party", "meet"],
    adventurous: ["adventure", "thrill", "exciting", "outdoor", "active", "sport"],
    romantic: ["romantic", "date", "couple", "partner", "intimate"],
    creative: ["creative", "art", "paint", "craft", "music", "workshop"],
    cultural: ["culture", "history", "museum", "heritage", "art", "walk"],
  };

  let detectedMood: string | null = null;
  for (const [mood, keywords] of Object.entries(moodMap)) {
    if (keywords.some((kw) => fullText.includes(kw))) {
      detectedMood = mood;
      break;
    }
  }

  // Budget detection
  let maxPrice: number | null = null;
  if (fullText.includes("free") || fullText.includes("₹0")) maxPrice = 0;
  else if (fullText.match(/under ₹?500|₹?500|cheap|budget/)) maxPrice = 500;
  else if (fullText.match(/₹?1[,.]?000|₹?1200|moderate/)) maxPrice = 1200;

  return { detectedMood, maxPrice };
}

// ─────────────────────────────────────────────
// Fetch events — filtered when possible,
// full list as fallback
// ─────────────────────────────────────────────
async function getEventsForPrompt(
  messages: { role: string; text: string }[]
): Promise<string> {
  const { detectedMood, maxPrice } = extractFilters(messages);

  let query = supabase
    .from("events")
    .select("name, location, duration, price_display, category, mood, booking_link")
    .eq("active", true);

  // ✅ FIX 3: Filter in Supabase before AI sees the data
  if (detectedMood) {
    query = query.ilike("mood", `%${detectedMood}%`);
  }

  const { data, error } = await query.limit(15);

  if (error) {
    console.error("Supabase Error:", error);
    return "";
  }

  // If filtered results are too few, fall back to full list
  if (!data || data.length < 3) {
    const { data: allData, error: allError } = await supabase
      .from("events")
      .select("name, location, duration, price_display, category, mood, booking_link")
      .eq("active", true)
      .limit(30);

    if (allError || !allData || allData.length === 0) return "";

    return allData
      .map(
        (event, index) => `
${index + 1}. ${event.name}
   Location: ${event.location}
   Duration: ${event.duration}
   Price: ${event.price_display}
   Category: ${event.category}
   Mood: ${event.mood}
   Booking: ${event.booking_link ?? "Available on request"}
`
      )
      .join("\n");
  }

  return data
    .map(
      (event, index) => `
${index + 1}. ${event.name}
   Location: ${event.location}
   Duration: ${event.duration}
   Price: ${event.price_display}
   Category: ${event.category}
   Mood: ${event.mood}
   Booking: ${event.booking_link ?? "Available on request"}
`
    )
    .join("\n");
}

// ─────────────────────────────────────────────
// System prompt — kept separate and clean
// ─────────────────────────────────────────────
function buildSystemPrompt(events: string): string {
  return `
# ROLE

You are "Unwind" — a premium AI weekend planner for Delhi NCR.

You are NOT a generic AI assistant.

You are a local friend who always knows the best experiences happening around the city.

Your goal is to help users discover experiences they'll genuinely enjoy.

Whenever you ask a question where the user can choose from discrete options (like mood, budget, or time), you MUST append options at the very end of your response in this exact format:

Options: [Option 1] [Option 2] [Option 3]

Examples:
- "Would you prefer something social or relaxing? Options: [Social] [Relaxing]"
- "What's your budget like? Options: [Free] [Under ₹500] [₹500–₹1200] [Above ₹1200]"

Keep options short (1–3 words). Only use this format for questions with clear choices. Never use it when recommending activities.

After 3–4 messages, recommend specific activities from the DATABASE below.

--------------------------------------------------
PERSONALITY
--------------------------------------------------

Friendly. Smart. Modern. Fun. Helpful. Confident. Concise.

Never sound robotic. Never sound like ChatGPT.

Never say "Based on your preferences..."

Instead say things like:
"Love that."
"Nice choice."
"I've got a few ideas."
"This looks perfect for your weekend."
"Here's what I'd pick."
"These match the vibe you're going for."

--------------------------------------------------
CONVERSATION RULES
--------------------------------------------------

Ask ONLY ONE question at a time.
Keep responses to 2 short sentences before recommendations.
Do not ask again for info the user already gave.

Collect naturally: Budget · Time · Mood · Area

Example:
User: "I have ₹1000 and 3 hours."
→ Do NOT ask budget or time again. Ask: "What kind of vibe are you in the mood for?"

--------------------------------------------------
WHEN RECOMMENDING EVENTS
--------------------------------------------------

CRITICAL: Recommend ONLY events listed in the DATABASE section below.
NEVER invent an activity, location, price, or booking link.
If an event's booking link is missing, write: "Booking available on request."

Recommend ONLY 3 options. Sort from BEST to GOOD.
Always explain briefly why each one matches the user's mood.
Never write huge paragraphs.
Always use Markdown. Add a blank line between every section.

--------------------------------------------------
OUTPUT FORMAT FOR RECOMMENDATIONS
--------------------------------------------------

Start with:
✨ I found a few experiences that match your vibe.

Then for EVERY recommendation use EXACTLY this format:

## 🎨 **1. Activity Name**

📍 **Location**
[location here]

⏱️ **Duration**
[duration here]

💰 **Price**
[price here]

⭐ **Why you'll love it**
[One or two short sentences matching the user's mood]

🔗 **Booking**
[booking link or "Booking available on request"]

---

Repeat for all 3 recommendations.

End with one of:
"Which one sounds the most exciting?"
or
"Want something more adventurous, cheaper, or romantic? I can find better matches."

--------------------------------------------------
IMPORTANT
--------------------------------------------------

If fewer than 3 matching activities exist in the DATABASE, recommend whatever is available.

NEVER hallucinate events. NEVER make up booking links.
If the DATABASE is empty, say: "I'm loading up the best experiences for you — check back in a moment!"

--------------------------------------------------
DATABASE — ONLY RECOMMEND FROM THIS LIST
--------------------------------------------------

${events}
`;
}

// ─────────────────────────────────────────────
// POST handler
// ─────────────────────────────────────────────
export async function POST(req: Request) {
  const { messages } = await req.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "No messages provided" }, { status: 400 });
  }

  // Fetch events (filtered where possible)
  const events = await getEventsForPrompt(messages);

  // ✅ FIX 4: Hard guard — don't let model run with no data
  if (!events) {
    return NextResponse.json(
      { error: "Could not load events from database." },
      { status: 500 }
    );
  }

  const systemPrompt = buildSystemPrompt(events);
  const lastMessage = messages[messages.length - 1].text;

// Always start with empty history — send previous turns as context in the first message
const conversationContext = messages.slice(0, -1)
  .map((m: { role: string; text: string }) => 
    `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`
  )
  .join("\n");

const messageToSend = conversationContext
  ? `Previous conversation:\n${conversationContext}\n\nUser: ${lastMessage}`
  : lastMessage;

  for (const modelName of MODELS) {
    try {
      // ✅ FIX 1: systemInstruction is the correct place for the system prompt
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

     const chat = model.startChat({ history: [] });

const result = await chat.sendMessageStream(messageToSend);

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    } catch (error: unknown) {
      console.error(`Model ${modelName} failed:`, error);

      const status = (error as { status?: number })?.status;

      // Keep trying fallback models on rate limit / unavailable errors
      if (status === 503 || status === 429 || status === 404) {
        continue;
      }

      // Break on other errors (bad API key, invalid request, etc.)
      break;
    }
  }

  return NextResponse.json(
    { error: "All models unavailable. Please try again shortly." },
    { status: 503 }
  );
}