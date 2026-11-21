import { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_MERCHANTS = [
  { merchant_name: "SUPER DUPER 4 (PP)", tid_mid: "219020454110063", business_service: "POS" },
  { merchant_name: "BROWN COFFEE BKK1", tid_mid: "219020454889912", business_service: "STATIC QR" },
  { merchant_name: "LUCKY SUPERMARKET TK", tid_mid: "219020454332211", business_service: "POS" },
  { merchant_name: "AMAZON CAFE NORODOM", tid_mid: "219020454776655", business_service: "Soundbox" },
  { merchant_name: "CALTEX BK P1 MAIN", tid_mid: "219020454100101", business_service: "POS" },
  { merchant_name: "CALTEX BK P2 EXPRESS", tid_mid: "219020454100102", business_service: "POS" },
  { merchant_name: "MINI MART TOUL KORK", tid_mid: "219020454554433", business_service: "STATIC QR" },
  { merchant_name: "PAYWAY MERCHANT HUB 01", tid_mid: "219020454998877", business_service: "PAYWAY" },
];

export const DEFAULT_TEMPLATES = [
  {
    type_of_issue: "Paper Rolls",
    category: "Request",
    business_service: "POS",
    reported_by: "Merchant Staff",
    score: 1,
    solutions: [
      "Drop to team for support",
      "Done provided paper rolls and maintenance",
      "Check and drop to team for support",
    ],
  },
  {
    type_of_issue: "ABA Merchant REQUEST CHANGE NAME (REJECT OR APPROVE)",
    category: "Request",
    business_service: "ABA Merchant App",
    reported_by: "E-mail",
    score: 2,
    solutions: ["Check and verify with MMP"],
  },
  {
    type_of_issue: "Check Transaction",
    category: "Inquiries",
    business_service: "STATIC QR",
    reported_by: "Merchant Staff",
    score: 1,
    solutions: ["Check and inform to merchant accordingly"],
  },
  {
    type_of_issue: "Check KHQR payment",
    category: "Inquiries",
    business_service: "STATIC QR",
    reported_by: "Merchant Staff",
    score: 1,
    solutions: ["Check and inform to merchant accordingly"],
  },
  {
    type_of_issue: "ADD TELEGRAM ALERT",
    category: "Request",
    business_service: "STATIC QR",
    reported_by: "Merchant Staff",
    score: 2,
    solutions: ["Check and process add in MMP"],
  },
  {
    type_of_issue: "Dispute case",
    category: "Issues",
    business_service: "STATIC QR",
    reported_by: "E-mail",
    score: 3,
    solutions: ["Check and contact to merchant for checking"],
  },
  {
    type_of_issue: "POS CONFIGURATION",
    category: "Issues",
    business_service: "POS",
    reported_by: "Merchant Support",
    score: 3,
    solutions: ["Check and process replace new POS", "Check and re-configure POS terminal"],
  },
  {
    type_of_issue: "TOP UP ISSUE",
    category: "Issues",
    business_service: "PAYWAY",
    reported_by: "E-mail",
    score: 2,
    solutions: ["Check and drop to merchant for processing re-top up"],
  },
  {
    type_of_issue: "Unsuccessul KHQR payment",
    category: "Issues",
    business_service: "STATIC QR",
    reported_by: "Merchant Staff",
    score: 2,
    solutions: ["Check and inform to merchant accordingly"],
  },
  {
    type_of_issue: "TRANSACTION REFUND REQUEST",
    category: "Request",
    business_service: "POS",
    reported_by: "E-mail",
    score: 3,
    solutions: ["prepare refund form and send to merchant for further process"],
  },
];

export async function ensureDefaultSeedData(supabase: SupabaseClient) {
  const { count: merchantCount, error: mErr } = await supabase
    .from("merchants")
    .select("*", { count: "exact", head: true });

  if (!mErr && (merchantCount === null || merchantCount === 0)) {
    await supabase.from("merchants").upsert(DEFAULT_MERCHANTS, { onConflict: "tid_mid" });
  }

  const { count: tplCount, error: tErr } = await supabase
    .from("issue_templates")
    .select("*", { count: "exact", head: true });

  if (!tErr && (tplCount === null || tplCount === 0)) {
    for (const tpl of DEFAULT_TEMPLATES) {
      const { data: inserted } = await supabase
        .from("issue_templates")
        .upsert(
          {
            type_of_issue: tpl.type_of_issue,
            category: tpl.category,
            business_service: tpl.business_service,
            reported_by: tpl.reported_by,
            score: tpl.score,
          },
          { onConflict: "type_of_issue" }
        )
        .select("id")
        .single();

      if (inserted?.id && tpl.solutions.length > 0) {
        const solRows = tpl.solutions.map((solution_text) => ({
          template_id: inserted.id,
          solution_text,
        }));
        await supabase.from("issue_solutions").upsert(solRows, {
          onConflict: "template_id,solution_text",
        });
      }
    }
  }
}
