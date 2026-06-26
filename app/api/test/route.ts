import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("events")
    .select("*");

  return NextResponse.json({
    success: !error,
    data,
    error,
  });
}