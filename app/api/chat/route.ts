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
async function extractFilters(messages: { role: string; text: string }[]) {
  // ✅ FIX: scan the FULL conversation, not just the last 2 messages.
  // Previously, budget/area/mood mentioned early got "forgotten" a
  // couple turns later once the window moved past them.
  const fullText = messages.map((m) => m.text).join(" ").toLowerCase();

  // Mapped to match exact mood values in your Supabase database
  const moodMap: Record<string, string[]> = {
    Chill: ["chill", "relax", "calm", "peaceful", "quiet", "unwind", "lazy", "cool", "easy", "slow", "chill out", "laid back", "lowkey", "cozy", "lounge", "rest", "breather", "de-stress"],
    Active: ["active", "sport", "outdoor", "physical", "energy", "run", "cycle", "trek", "walk", "adventure", "thrill", "exciting", "fitness", "workout", "hike", "climb", "swim", "game", "play", "rush", "adrenaline"],
    Exploratory: ["explore", "discovery", "new", "adventure", "different", "unique", "hidden", "offbeat", "wander", "roam", "discover", "tour", "trail", "unusual", "secret", "underrated", "gems"],
    Romantic: ["romantic", "date", "couple", "partner", "intimate", "bae", "girlfriend", "boyfriend", "anniversary", "love", "special", "together", "candlelight", "dinner", "evening", "propose", "valentine", "wife", "husband"],
    Creative: ["creative", "art", "paint", "craft", "music", "workshop", "make", "diy", "draw", "sketch", "pottery", "design", "photography", "write", "create", "build", "sculpt", "dance", "perform"],
    Intellectual: ["intellectual", "learn", "culture", "history", "museum", "talk", "discussion", "book", "heritage", "lecture", "exhibit", "gallery", "documentary", "debate", "science", "knowledge", "educational", "study"],
    Fun: ["fun", "party", "social", "friends", "group", "people", "meet", "laugh", "comedy", "game night", "hangout", "gang", "crew", "squad", "celebration", "enjoy", "entertainment", "lively", "happening", "vibe"],
    Spiritual: ["spiritual", "meditation", "temple", "peace", "mindful", "yoga", "soul", "prayer", "retreat", "divine", "sacred", "worship", "inner", "zen", "healing", "chakra", "mantra", "ashram"],
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

  // ── NEW: Area detection ──
  // Pull real area names from the DB instead of hardcoding a list,
  // so this stays in sync automatically as new areas get added.
  let detectedAreaId: string | null = null;
  let detectedAreaName: string | null = null;
  const { data: areas } = await supabase.from("areas").select("id, name");
  if (areas) {
    const match = areas.find((a) => fullText.includes(a.name.toLowerCase()));
    if (match) {
      detectedAreaId = match.id;
      detectedAreaName = match.name;
    }
  }

  return { detectedMood, maxPrice, detectedAreaId, detectedAreaName };
}

// ─────────────────────────────────────────────
// Fetch events — exact matches first, and if not
// enough, separately-labeled alternatives so the
// bot can be upfront instead of silently swapping
// in a different mood.
// ─────────────────────────────────────────────
async function getEventsForPrompt(
  messages: { role: string; text: string }[]
): Promise<{ eventsText: string; knownFiltersText: string }> {
  const { detectedMood, maxPrice, detectedAreaId, detectedAreaName } = await extractFilters(messages);

  // ── NEW: build a plain-English summary of what's already known,
  // so we can tell Gemini directly instead of hoping it infers this
  // from re-reading the raw conversation (which it was doing unreliably).
  const knownParts: string[] = [];
  if (detectedMood) knownParts.push(`- Mood: ${detectedMood}`);
  if (maxPrice !== null) knownParts.push(`- Budget: Under ₹${maxPrice}`);
  if (detectedAreaName) knownParts.push(`- Area: ${detectedAreaName}`);
  const knownFiltersText = knownParts.length > 0
    ? knownParts.join("\n")
    : "(Nothing detected yet — ask naturally.)";

  const hasSpecificAsk = !!(detectedMood || maxPrice !== null || detectedAreaId);

  const SELECT_FIELDS = "name, location, duration, price_display, category, mood, booking_link";

  const formatEvents = (events: { name: string; location: string; duration: string; price_display: string; category: string; mood: string; booking_link: string | null }[]) =>
    events.map((event, index) => `
${index + 1}. ${event.name}
   Location: ${event.location}
   Duration: ${event.duration}
   Price: ${event.price_display}
   Category: ${event.category}
   Mood: ${event.mood}
   Booking: ${event.booking_link ?? "Available on request"}
`).join("\n");

  // Resolve area -> event ids ONCE, reused across all queries below.
  let areaEventIds: string[] | null = null;
  if (detectedAreaId) {
    const { data: areaEvents } = await supabase
      .from("event_areas")
      .select("event_id")
      .eq("area_id", detectedAreaId);
    areaEventIds = areaEvents?.map((e) => e.event_id) ?? [];
  }

  // ── CASE 1: nothing specific asked yet (fresh conversation) ──
  // Keep the original "mixed sample across all moods" behavior —
  // there's nothing to be "transparent" about yet since the user
  // hasn't stated a specific mood/area/budget combo.
  if (!hasSpecificAsk) {
    const moods = ["Chill", "Active", "Romantic", "Exploratory", "Creative", "Fun", "Intellectual"];
    const mixedResults = await Promise.all(
      moods.map(mood =>
        supabase
          .from("events")
          .select(SELECT_FIELDS)
          .eq("active", true)
          .ilike("mood", `%${mood}%`)
          .limit(3)
          .then(({ data }) => data ?? [])
      )
    );
    const allMixed = mixedResults.flat().sort(() => Math.random() - 0.5).slice(0, 15);
    return { eventsText: formatEvents(allMixed), knownFiltersText };
  }

  // ── CASE 2: something specific was asked — check for EXACT matches ──
  let exactQuery = supabase.from("events").select(SELECT_FIELDS).eq("active", true);
  if (detectedMood) exactQuery = exactQuery.ilike("mood", `%${detectedMood}%`);
  if (maxPrice !== null) exactQuery = exactQuery.lte("price_max", maxPrice);
  if (areaEventIds && areaEventIds.length > 0) exactQuery = exactQuery.in("id", areaEventIds);

  const { data: exactData, error: exactError } = await exactQuery.limit(15);
  if (exactError) {
    console.error("Supabase Error:", exactError);
    return { eventsText: "", knownFiltersText };
  }
  const exactEvents = exactData ?? [];

  // Enough exact matches — no need for alternatives, done.
  if (exactEvents.length >= 3) {
    const shuffled = [...exactEvents].sort(() => Math.random() - 0.5).slice(0, 15);
    return {
      eventsText: `EXACT MATCHES (meet every stated criteria):\n${formatEvents(shuffled)}`,
      knownFiltersText,
    };
  }

  // ── CASE 3: not enough exact matches — fetch labeled alternatives ──
  // Alternative A: relax AREA only (same mood + budget, any area)
  let areaAltEvents: typeof exactEvents = [];
  if (detectedAreaId) {
    let q = supabase.from("events").select(SELECT_FIELDS).eq("active", true);
    if (detectedMood) q = q.ilike("mood", `%${detectedMood}%`);
    if (maxPrice !== null) q = q.lte("price_max", maxPrice);
    const { data } = await q.limit(6);
    areaAltEvents = (data ?? []).filter(e => !exactEvents.some(x => x.name === e.name));
  }

  // Alternative B: relax BUDGET only (same mood + area, any price)
  let budgetAltEvents: typeof exactEvents = [];
  if (maxPrice !== null) {
    let q = supabase.from("events").select(SELECT_FIELDS).eq("active", true);
    if (detectedMood) q = q.ilike("mood", `%${detectedMood}%`);
    if (areaEventIds && areaEventIds.length > 0) q = q.in("id", areaEventIds);
    const { data } = await q.limit(6);
    budgetAltEvents = (data ?? []).filter(e => !exactEvents.some(x => x.name === e.name));
  }

  const sections: string[] = [];
  sections.push(
    exactEvents.length > 0
      ? `EXACT MATCHES (meet every stated criteria — only ${exactEvents.length} found):\n${formatEvents(exactEvents)}`
      : `EXACT MATCHES (meet every stated criteria): None found.`
  );
  if (areaAltEvents.length > 0) {
    sections.push(`OTHER AREAS (same mood${maxPrice !== null ? " + same budget" : ""}, different area from what the user asked for):\n${formatEvents(areaAltEvents)}`);
  }
  if (budgetAltEvents.length > 0) {
    sections.push(`HIGHER BUDGET (same mood${detectedAreaId ? " + same area" : ""}, but above the budget the user stated):\n${formatEvents(budgetAltEvents)}`);
  }

  // If truly nothing at all was found in any bucket, fall back to
  // a small mixed sample so the bot isn't left with a totally empty database.
  if (exactEvents.length === 0 && areaAltEvents.length === 0 && budgetAltEvents.length === 0) {
    const { data } = await supabase
      .from("events")
      .select(SELECT_FIELDS)
      .eq("active", true)
      .limit(6);
    if (data && data.length > 0) {
      sections.push(`OTHER OPTIONS (do not match the stated mood/area/budget at all — only offer these if the user says they're open to anything):\n${formatEvents(data)}`);
    }
  }

  return { eventsText: sections.join("\n\n"), knownFiltersText };
}

// ─────────────────────────────────────────────
// System prompt — kept separate and clean
// ─────────────────────────────────────────────
function buildSystemPrompt(events: string, knownFilters: string): string {
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
ALREADY KNOWN ABOUT THIS USER — DO NOT ASK ABOUT THESE AGAIN
--------------------------------------------------

${knownFilters}

Anything listed above was already detected from what the user said. Never ask a question about something already listed here — treat it as settled and move on to whatever is still missing.

--------------------------------------------------
CONVERSATION RULES
--------------------------------------------------

Ask ONLY ONE question at a time.
Keep responses to 2 short sentences before recommendations.
Do not ask again for info the user already gave, and especially never ask about anything listed in ALREADY KNOWN above.

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

The DATABASE below may contain multiple labeled sections:
- "EXACT MATCHES" — events that meet everything the user asked for (mood, area, budget). Always prefer these.
- "OTHER AREAS" — events matching mood/budget but NOT the area the user asked for.
- "HIGHER BUDGET" — events matching mood/area but priced ABOVE what the user asked for.
- "OTHER OPTIONS" — events that don't match any stated criteria, only used as a last resort.

BE HONEST when EXACT MATCHES has fewer than 3 events (or none):
1. Briefly and plainly tell the user you couldn't find enough options matching everything they asked for (name which part fell short — e.g. "couldn't find spiritual spots in Hauz Khas under ₹200").
2. Then, ONLY if OTHER AREAS or HIGHER BUDGET sections have events, offer them as an explicit CHOICE — do not just show them as if they matched. E.g. "I can show you spiritual spots in other areas, or ones in Hauz Khas above your budget — which would you prefer?"
3. Do NOT recommend from OTHER AREAS or HIGHER BUDGET until the user tells you which direction they're open to. Wait for their answer first.
4. Only use "OTHER OPTIONS" (unrelated mood) if the user explicitly says they're open to anything, or if literally nothing else exists.
5. If EXACT MATCHES has 3 or more events, just recommend normally — no need to mention alternatives at all.

Recommend ONLY 3 options at a time. Sort from BEST to GOOD.
Always explain briefly why each one matches the user's mood.
Never write huge paragraphs.
Always use Markdown. Add a blank line between every section.

--------------------------------------------------
OUTPUT FORMAT FOR RECOMMENDATIONS
--------------------------------------------------

When you DO have enough matches to recommend (either EXACT MATCHES has 3+, or the user has chosen a direction after being asked), start with:
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
or (when offering the OTHER AREAS / HIGHER BUDGET choice) end with the direct question asking which direction they'd prefer, using the Options format described above (e.g. "Options: [Other areas] [Higher budget]").

--------------------------------------------------
IMPORTANT
--------------------------------------------------

If EXACT MATCHES has fewer than 3 events, do not silently pad the list with unrelated moods — follow the BE HONEST steps above instead.

NEVER hallucinate events. NEVER make up booking links.
If the DATABASE is completely empty, say: "I'm loading up the best experiences for you — check back in a moment!"

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
  const { eventsText, knownFiltersText } = await getEventsForPrompt(messages);

  // ✅ FIX 4: Hard guard — don't let model run with no data
  if (!eventsText) {
    return NextResponse.json(
      { error: "Could not load events from database." },
      { status: 500 }
    );
  }

  const systemPrompt = buildSystemPrompt(eventsText, knownFiltersText);
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
