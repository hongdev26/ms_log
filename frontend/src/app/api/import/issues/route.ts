import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const targetSheetName =
      workbook.SheetNames.find((s) => /issue|score/i.test(s)) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const supabase = getSupabaseServerClient();
    let processed = 0;

    for (const row of rows) {
      const entries = Object.entries(row);
      const typeEntry = entries.find(([k]) => /type of issue|issue|type/i.test(k));
      const scoreEntry = entries.find(([k]) => /score|point|weight/i.test(k));
      const solEntry = entries.find(([k]) => /solution|resolution/i.test(k));
      const catEntry = entries.find(([k]) => /category/i.test(k));
      const servEntry = entries.find(([k]) => /service/i.test(k));
      const repEntry = entries.find(([k]) => /reported/i.test(k));

      const type_of_issue = String(typeEntry ? typeEntry[1] : "").trim();
      if (!type_of_issue) continue;

      const parsedScore = scoreEntry ? parseInt(String(scoreEntry[1]), 10) : 1;
      const score = Number.isNaN(parsedScore) ? 1 : Math.max(0, Math.min(100, parsedScore));
      const category = String(catEntry ? catEntry[1] : "Request").trim() || "Request";
      const business_service = String(servEntry ? servEntry[1] : "POS").trim() || "POS";
      const reported_by = String(repEntry ? repEntry[1] : "Merchant Staff").trim() || "Merchant Staff";
      const solution = solEntry ? String(solEntry[1]).trim() : "";

      const { data: tpl } = await supabase
        .from("issue_templates")
        .upsert(
          { type_of_issue, category, business_service, reported_by, score },
          { onConflict: "type_of_issue" }
        )
        .select("id")
        .single();

      if (tpl?.id && solution) {
        await supabase
          .from("issue_solutions")
          .upsert(
            { template_id: tpl.id, solution_text: solution },
            { onConflict: "template_id,solution_text" }
          );
      }
      processed++;
    }

    return NextResponse.json({
      message: `Imported ${processed} issue/score rows into Supabase.`,
      count: processed,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
