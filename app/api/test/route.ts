import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
];

export async function GET() {
  // Supabase test
  const { data, error } = await supabase.from("events").select("*");

  // Gemini models test
  const modelResults = await Promise.all(
    MODELS.map(async (modelName) => {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say OK");
        const text = result.response.text();
        return { model: modelName, status: "✅ alive", response: text };
      } catch (error: unknown) {
        const status = (error as { status?: number })?.status;
        const message = (error as { message?: string })?.message ?? "Unknown error";
        return { model: modelName, status: `❌ failed (${status})`, error: message };
      }
    })
  );

  return NextResponse.json({
    supabase: { success: !error, eventCount: data?.length ?? 0, error },
    models: modelResults,
  });
}