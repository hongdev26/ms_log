import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from("issue_logs")
      .select("category, supported_by, business_service, type_of_issue, score, status");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const logs = rows || [];
    const total_logs = logs.length;
    const total_score = logs.reduce((acc, r) => acc + (Number(r.score) || 0), 0);
    const done_count = logs.filter((r) => r.status === "Done").length;
    const pending_count = logs.filter((r) => r.status === "Pending").length;

    const catCounts = new Map<string, number>();
    const staffScores = new Map<string, number>();
    const serviceCounts = new Map<string, number>();
    const issueCounts = new Map<string, number>();

    for (const r of logs) {
      const cat = r.category || "Other";
      catCounts.set(cat, (catCounts.get(cat) || 0) + 1);

      if (r.supported_by) {
        staffScores.set(r.supported_by, (staffScores.get(r.supported_by) || 0) + (Number(r.score) || 0));
      }

      const srv = r.business_service || "OTHER";
      serviceCounts.set(srv, (serviceCounts.get(srv) || 0) + 1);

      const iss = r.type_of_issue || "Other";
      issueCounts.set(iss, (issueCounts.get(iss) || 0) + 1);
    }

    return NextResponse.json({
      kpis: { total_logs, total_score, done_count, pending_count },
      by_category: Array.from(catCounts.entries()).map(([category, count]) => ({ category, count })),
      by_staff: Array.from(staffScores.entries())
        .map(([supported_by, total_score]) => ({ supported_by, total_score }))
        .sort((a, b) => b.total_score - a.total_score)
        .slice(0, 8),
      by_service: Array.from(serviceCounts.entries()).map(([business_service, count]) => ({
        business_service,
        count,
      })),
      top_issues: Array.from(issueCounts.entries())
        .map(([type_of_issue, count]) => ({ type_of_issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
