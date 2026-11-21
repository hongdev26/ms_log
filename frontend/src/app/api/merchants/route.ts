import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { ensureDefaultSeedData } from "@/lib/seed";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    await ensureDefaultSeedData(supabase);

    const q = (req.nextUrl.searchParams.get("q") || "").trim();
    if (!q) {
      const { data, error } = await supabase
        .from("merchants")
        .select("id, merchant_name, tid_mid, right_8_digits, business_service")
        .order("merchant_name", { ascending: true })
        .limit(50);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data || []);
    }

    const sanitized = q.replace(/[%_,]/g, "");
    const { data, error } = await supabase
      .from("merchants")
      .select("id, merchant_name, tid_mid, right_8_digits, business_service")
      .or(`merchant_name.ilike.%${sanitized}%,right_8_digits.ilike.%${sanitized}%,tid_mid.ilike.%${sanitized}%`)
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
