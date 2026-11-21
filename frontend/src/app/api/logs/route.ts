import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, formatMonthYear } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("issue_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = getSupabaseServerClient();

    const dateStr = String(body.date || new Date().toISOString().slice(0, 10));
    const { mmm_yyyy, yyyy } = formatMonthYear(dateStr);
    const score = Math.max(0, Math.min(100, parseInt(String(body.score ?? 1), 10) || 1));
    const typeOfIssue = String(body.type_of_issue || "").trim();
    const solution = String(body.solution || "").trim();

    if (!typeOfIssue || !solution) {
      return NextResponse.json(
        { error: "Type of Issue and Solution are required." },
        { status: 400 }
      );
    }

    const payload = {
      date: dateStr,
      merchant_name: String(body.merchant_name || "").trim(),
      tid_mid: String(body.tid_mid || "").trim(),
      business_service: String(body.business_service || "POS").trim(),
      task_originated: String(body.task_originated || "Merchants").trim(),
      type_of_issue: typeOfIssue,
      category: String(body.category || "Request").trim(),
      score,
      reported_by: String(body.reported_by || "Merchant Staff").trim(),
      contact_number: String(body.contact_number || "").trim(),
      solution,
      remarks: String(body.remarks || "").trim(),
      status: String(body.status || "Done").trim(),
      date_solved: body.date_solved ? String(body.date_solved) : null,
      supported_by: String(body.supported_by || "").trim(),
      mmm_yyyy,
      yyyy,
    };

    const { data: created, error } = await supabase
      .from("issue_logs")
      .insert(payload)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Upsert issue template & optional solution
    const { data: tpl } = await supabase
      .from("issue_templates")
      .upsert(
        {
          type_of_issue: typeOfIssue,
          category: payload.category,
          business_service: payload.business_service,
          reported_by: payload.reported_by,
          score,
        },
        { onConflict: "type_of_issue" }
      )
      .select("id")
      .single();

    if (tpl?.id) {
      await supabase
        .from("issue_solutions")
        .upsert({ template_id: tpl.id, solution_text: solution }, { onConflict: "template_id,solution_text" });
    }

    // Upsert merchant if both name and MID/TID are entered
    if (payload.merchant_name && payload.tid_mid) {
      await supabase.from("merchants").upsert(
        {
          merchant_name: payload.merchant_name,
          tid_mid: payload.tid_mid,
          business_service: payload.business_service,
        },
        { onConflict: "tid_mid" }
      );
    }

    return NextResponse.json(created, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
