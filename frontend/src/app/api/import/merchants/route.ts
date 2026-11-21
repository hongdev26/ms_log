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
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    const records: { merchant_name: string; tid_mid: string; business_service: string }[] = [];

    for (const row of rows) {
      const entries = Object.entries(row);
      const nameEntry = entries.find(([k]) => /merchant|name/i.test(k));
      const tidEntry = entries.find(([k]) => /tid|mid|terminal/i.test(k));
      const servEntry = entries.find(([k]) => /service/i.test(k));

      const merchant_name = String(nameEntry ? nameEntry[1] : entries[0]?.[1] || "").trim();
      let tid_mid = String(tidEntry ? tidEntry[1] : entries[1]?.[1] || "").trim();
      if (tid_mid.endsWith(".0")) tid_mid = tid_mid.slice(0, -2);
      const business_service = String(servEntry ? servEntry[1] : "POS").trim() || "POS";

      if (merchant_name && tid_mid) {
        records.push({ merchant_name, tid_mid, business_service });
      }
    }

    if (records.length === 0) {
      return NextResponse.json({ error: "No valid Merchant Name and MID/TID rows found." }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from("merchants").upsert(records, { onConflict: "tid_mid" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: `Imported ${records.length} merchants into Supabase.`, count: records.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
