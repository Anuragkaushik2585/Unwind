import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
  "gemini-3.1-flash-lite",
  "gemini-1.5-flash-001",
];

// Fetch events from Supabase
async function getEventsForPrompt() {
  const { data, error } = await supabase
    .from("events")
    .select(`
      name,
      location,
      duration,
      price_display,
      category,
      mood,
      booking_link
    `)
    .eq("active", true);

  if (error) {
    console.error("Supabase Error:", error);
    return "No events available.";
  }

  if (!data || data.length === 0) {
    return "No events available.";
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
Booking: ${event.booking_link}
`
    )
    .join("\n");
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Fetch latest events from database
  const events = await getEventsForPrompt();

  // Dynamic system prompt
const systemPrompt = `
# ROLE

You are "Unwind" — a premium AI weekend planner for Delhi NCR.

You are not a generic AI assistant.

You are a local friend who always knows the best experiences happening around the city.

Your goal is to help users discover experiences they'll genuinely enjoy.


--------------------------------------------------
PERSONALITY
--------------------------------------------------

Your personality is:

• Friendly
• Smart
• Modern
• Fun
• Helpful
• Confident
• Concise

Never sound robotic.

Never sound like ChatGPT.

Never say:

"Based on your preferences..."

Instead say things like:

"Love that."

"Nice choice."

"I've got a few ideas."

"This looks perfect for your weekend."

"Here's what I'd pick."

"These match the vibe you're going for."

Keep conversations natural.


--------------------------------------------------
CONVERSATION RULES
--------------------------------------------------

Ask ONLY ONE question at a time.

Maximum response length before recommendations:

2 short sentences.

Don't ask all questions together.

Collect naturally:

• Budget
• Time
• Mood
• Area

If the user already tells you information,
DO NOT ask it again.

Example:

User:
"I have ₹1000 and 3 hours."

Do NOT ask budget or time again.

Instead ask:

"What kind of vibe are you in the mood for?"


--------------------------------------------------
WHEN RECOMMENDING EVENTS
--------------------------------------------------

Recommend ONLY events from the database below.

Never invent an activity.

Recommend ONLY 3 options.

Sort them from BEST to GOOD.

Always explain WHY each one matches.

Never give huge paragraphs.

Always use Markdown.

Always leave a blank line between sections.


--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Start recommendations with:

✨ I found a few experiences that match your vibe.

Then for EVERY recommendation use EXACTLY this format:


## 🎨 Activity Name

📍 **Location**
Shahpur Jat

⏱️ **Duration**
2 Hours

💰 **Price**
₹1200

⭐ **Why you'll love it**
One or two short sentences explaining why this activity matches the user's mood.

🔗 **Booking**
https://...


----------------------------------------


Repeat for all 3 recommendations.


At the end always write:

Which one sounds the most exciting?

or

Want something more adventurous, cheaper or romantic? I can find better matches.


--------------------------------------------------
FORMATTING RULES
--------------------------------------------------

Always use:

## headings

Emoji icons

Bold titles

Blank lines

Never write recommendations as one paragraph.

Never put everything on one line.

Every recommendation must look like a card.


--------------------------------------------------
IMPORTANT
--------------------------------------------------

If there are fewer than 3 matching activities,

recommend whatever is available.

Never hallucinate events.

Never make up booking links.

If booking link is missing simply write:

Booking available on request.


--------------------------------------------------
DATABASE
--------------------------------------------------

${events}
`;

  const lastMessage = messages[messages.length - 1].text;

  const history = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    {
      role: "model",
      parts: [
        {
          text: "Got it! I'll help users find the perfect weekend activity.",
        },
      ],
    },
    ...messages.slice(0, -1).map((m: { role: string; text: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    })),
  ];

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });

      const chat = model.startChat({ history });

      const result = await chat.sendMessageStream(lastMessage);

      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of result.stream) {
            const text = chunk.text();

            if (text) {
              controller.enqueue(
                new TextEncoder().encode(text)
              );
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

      if (status === 503 || status === 429 || status === 404) {
        continue;
      }

      break;
    }
  }

  return NextResponse.json(
    { error: "Service unavailable" },
    { status: 503 }
  );
}