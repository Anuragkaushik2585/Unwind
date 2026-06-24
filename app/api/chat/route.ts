import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash",
  "gemini-3.1-flash-lite",
  "gemini-1.5-flash-001",
]

const events = `
Here are the available events in Delhi NCR:
1. Improv Comedy Night - Hauz Khas - 2hrs - ₹500-800 - Fun, Social
2. Pottery Workshop - Shahpur Jat - 2hrs - ₹1200 - Creative, Calm
3. Lodhi Art District Walk - Lodhi Colony - 1.5hrs - Free - Explore, Creative
4. Stand Up Comedy - CP - 2hrs - ₹400-600 - Fun, Social
5. Sanjay Van Nature Walk - Vasant Kunj - 2hrs - Free - Peaceful, Active
6. Rooftop Café Crawl - Hauz Khas - 3hrs - ₹800-1200 - Chill, Social
7. Open Mic Night - Hauz Khas - 2hrs - ₹300-500 - Fun, Music
8. Bike Ride Yamuna Trail - East Delhi - 3hrs - ₹200 - Active, Explore
9. Street Food Walk Chandni Chowk - Old Delhi - 2hrs - ₹500 - Food, Explore
10. Escape Room - Saket - 1.5hrs - ₹600-800 - Fun, Social
11. Golf Driving Range - Lado Sarai - 1hr - ₹500 - Active, Fun
12. Karaoke Night - Cyber Hub - 3hrs - ₹500 - Fun, Social
13. Photography Walk - Old Delhi - 3hrs - ₹800 - Creative, Explore
14. Sunset at India Gate - Central Delhi - 1hr - Free - Peaceful, Romantic
15. Terrarium Workshop - Lajpat Nagar - 2hrs - ₹1000 - Creative, Calm
`

const systemPrompt = `You are Unwind's friendly weekend planning assistant for Delhi NCR. 
Your job is to have a short conversation with the user to understand their mood, budget, time available, and interests — then recommend 2-3 activities from the list below that best match.
Keep responses short, warm and conversational. Ask one question at a time. 
After 3-4 messages recommend specific activities from this list:
${events}
Always mention the location, duration and price when recommending.`

export async function POST(req: Request) {
  const { messages } = await req.json()

  const lastMessage = messages[messages.length - 1].text

  const history = [
    {
      role: "user",
      parts: [{ text: systemPrompt }]
    },
    {
      role: "model",
      parts: [{ text: "Got it! I'll help users find the perfect weekend activity." }]
    },
    ...messages.slice(0, -1).map((m: {role: string, text: string}) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }))
  ]

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const chat = model.startChat({ history })
      const result = await chat.sendMessage(lastMessage)
      const response = result.response.text()
      return NextResponse.json({ reply: response })
    } catch (error: unknown) {
      const status = (error as {status?: number})?.status
      if (status === 503 || status === 429 || status === 404) {
        continue
      }
      break
    }
  }

  return NextResponse.json({ reply: "I'm having trouble right now. Please try again in a moment!" })
}