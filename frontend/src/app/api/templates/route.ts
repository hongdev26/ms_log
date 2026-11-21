import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { ensureDefaultSeedData } from "@/lib/seed";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    await ensureDefaultSeedData(supabase);

    const { data: templates, error: tplErr } = await supabase
      .from("issue_templates")
      .select("id, type_of_issue, category, business_service, reported_by, score")
      .order("type_of_issue", { ascending: true });

    if (tplErr) return NextResponse.json({ error: tplErr.message }, { status: 500 });

    const { data: solutions, error: solErr } = await supabase
      .from("issue_solutions")
      .select("template_id, solution_text");

    if (solErr) return NextResponse.json({ error: solErr.message }, { status: 500 });

    const solMap = new Map<string, string[]>();
    for (const s of solutions || []) {
      const list = solMap.get(s.template_id) || [];
      if (!list.includes(s.solution_text)) list.push(s.solution_text);
      solMap.set(s.template_id, list);
    }

    const enriched = (templates || []).map((t) => ({
      ...t,
      solutions: solMap.get(t.id) || [],
    }));

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
