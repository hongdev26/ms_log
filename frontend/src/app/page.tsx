"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  PlusCircle,
  Search,
  BarChart3,
  ClipboardList,
  Trash2,
  Download,
  CheckCircle2,
} from "lucide-react";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

interface IssueTemplate {
  id: string;
  type_of_issue: string;
  category: string;
  business_service: string;
  reported_by: string;
  score: number;
  solutions: string[];
}

interface Merchant {
  id: string;
  merchant_name: string;
  tid_mid: string;
  right_8_digits: string;
  business_service: string;
}

interface IssueLog {
  id: string;
  date: string;
  merchant_name: string;
  tid_mid: string;
  business_service: string;
  task_originated: string;
  type_of_issue: string;
  category: string;
  score: number;
  reported_by: string;
  contact_number: string;
  solution: string;
  remarks: string;
  status: string;
  date_solved: string;
  supported_by: string;
  mmm_yyyy: string;
  yyyy: string;
}

const STAFF_LIST = [
  "",
  "CHEA SAMOEURN",
  "SUON POLEAK",
  "KOSAL KOEMHONG",
  "CHAKK Narom",
  "SINA Sovannrith",
  "CHREK Channtha",
  "CHON SOPHEARATH",
  "LOUENG Hokly",
  "YAV Sovann",
  "RONG Ras",
  "BUN Thearith",
  "Sin Vichet",
  "LOT SOTHARVATH",
  "MON Senghong",
  "RITH SOMNANG",
  "YEOUN VIRAK",
];

const SERVICES = ["POS", "CBY", "Soundbox", "PAYWAY", "ABA Merchant App", "STATIC QR", "OTHER"];
const CATEGORIES = ["Request", "Issues", "Inquiries", "Other"];
const ORIGINATED = [
  "Merchants",
  "Daily Task",
  "Daily Report",
  "Weekly Report",
  "Monthly Report",
  "Telegram Channel",
  "Other ABA Departments",
  "Other Banks",
  "Other Customers",
  "Cases From",
];
const REPORTED_BY = [
  "Merchant Staff",
  "Customer Call",
  "Daily Task",
  "E-mail",
  "Merchant Support",
  "Ameyo",
  "Merchant Sale",
  "Other Customers",
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"logger" | "dashboard">("logger");
  const [activeStaff, setActiveStaff] = useState<string>("");
  const [templates, setTemplates] = useState<IssueTemplate[]>([]);
  const [logs, setLogs] = useState<IssueLog[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  const [tplSearch, setTplSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [merchantSuggestions, setMerchantSuggestions] = useState<Merchant[]>([]);
  const [optionalSolutions, setOptionalSolutions] = useState<string[]>([]);

  const [merchantUploadMsg, setMerchantUploadMsg] = useState("");
  const [issueUploadMsg, setIssueUploadMsg] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    date: today,
    business_service: "POS",
    task_originated: "Merchants",
    type_of_issue: "",
    category: "Request",
    merchant_name: "",
    tid_mid: "",
    contact_number: "",
    reported_by: "Merchant Staff",
    status: "Done",
    date_solved: today,
    score: 1,
    solution: "",
    supported_by: "",
    remarks: "",
  });

  const loadTemplates = async () => {
    const res = await fetch("/api/templates");
    if (res.ok) setTemplates(await res.json());
  };

  const loadLogs = async () => {
    const res = await fetch("/api/logs");
    if (res.ok) setLogs(await res.json());
  };

  const loadDashboard = async () => {
    const res = await fetch("/api/dashboard");
    if (res.ok) setDashboardStats(await res.json());
  };

  useEffect(() => {
    loadTemplates();
    loadLogs();
    loadDashboard();
  }, []);

  const searchMerchants = async (q: string) => {
    if (q.trim().length < 2) {
      setMerchantSuggestions([]);
      return;
    }
    const res = await fetch(`/api/merchants?q=${encodeURIComponent(q.trim())}`);
    if (res.ok) setMerchantSuggestions(await res.json());
  };

  const selectTemplate = (tpl: IssueTemplate) => {
    setOptionalSolutions(tpl.solutions || []);
    setFormData((prev) => ({
      ...prev,
      type_of_issue: tpl.type_of_issue,
      category: tpl.category,
      business_service: tpl.business_service,
      reported_by: tpl.reported_by,
      score: tpl.score,
      solution: tpl.solutions && tpl.solutions.length > 0 ? tpl.solutions[0] : "",
    }));
  };

  const uploadMerchantFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setMerchantUploadMsg("Importing...");
    const res = await fetch("/api/import/merchants", { method: "POST", body: fd });
    const data = await res.json();
    setMerchantUploadMsg(res.ok ? `✓ ${data.message}` : `Error: ${data.error}`);
  };

  const uploadIssueFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setIssueUploadMsg("Importing...");
    const res = await fetch("/api/import/issues", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setIssueUploadMsg(`✓ ${data.message}`);
      loadTemplates();
    } else {
      setIssueUploadMsg(`Error: ${data.error}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setToastMsg("✓ Saved to Supabase!");
      setTimeout(() => setToastMsg(""), 2500);
      setFormData((prev) => ({ ...prev, merchant_name: "", tid_mid: "", remarks: "" }));
      await Promise.all([loadLogs(), loadTemplates(), loadDashboard()]);
    }
  };

  const deleteLog = async (id: string) => {
    const res = await fetch(`/api/logs/${id}`, { method: "DELETE" });
    if (res.ok) {
      await Promise.all([loadLogs(), loadDashboard()]);
    }
  };

  const exportCsv = () => {
    const headers = [
      "No",
      "Date",
      "Merchant Name",
      "TID/MID",
      "Business Services",
      "Task Originated",
      "Type of Issue",
      "Category",
      "Score",
      "Reported By",
      "Contact Number",
      "Solution",
      "Remarks",
      "Status",
      "Date Solved",
      "Supported by",
      "MMM-YYYY",
      "YYYY",
    ];
    const csvRows = logs.map((r, i) =>
      [
        i + 1,
        r.date,
        r.merchant_name,
        r.tid_mid,
        r.business_service,
        r.task_originated,
        r.type_of_issue,
        r.category,
        r.score,
        r.reported_by,
        r.contact_number,
        r.solution,
        r.remarks,
        r.status,
        r.date_solved,
        r.supported_by,
        r.mmm_yyyy,
        r.yyyy,
      ]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
   const blob = new Blob(["\uFEFF" + [headers.join(","), ...csvRows].join("\n")], {
  type: "text/csv;charset=utf-8;",
});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Issue_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredTemplates = templates.filter((t) => {
    if (catFilter !== "ALL" && t.category.toLowerCase() !== catFilter.toLowerCase()) return false;
    if (tplSearch && !t.type_of_issue.toLowerCase().includes(tplSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-brand text-white px-4 sm:px-6 py-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Merchant Support — Daily Task, Issue Log & Score PWA
          </h1>
          <p className="text-xs sm:text-sm text-sky-100">
            Next.js PWA + Supabase Postgres on Vercel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-sky-100">Active Staff:</label>
          <select
            value={activeStaff}
            onChange={(e) => {
              setActiveStaff(e.target.value);
              setFormData((prev) => ({ ...prev, supported_by: e.target.value }));
            }}
            className="text-slate-800 text-xs sm:text-sm rounded-md px-2.5 py-1.5 bg-white font-medium"
          >
            {STAFF_LIST.map((s) => (
              <option key={s} value={s}>
                {s || "(Select Staff)"}
              </option>
            ))}
          </select>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 flex gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("logger")}
          className={`flex items-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 whitespace-nowrap ${
            activeTab === "logger"
              ? "border-brand text-brand"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Task & Issue Logger
        </button>
        <button
          onClick={() => {
            setActiveTab("dashboard");
            loadDashboard();
          }}
          className={`flex items-center gap-2 py-3 px-2 text-sm font-semibold border-b-2 whitespace-nowrap ${
            activeTab === "dashboard"
              ? "border-brand text-brand"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Analytics Dashboard & Scores
        </button>
      </nav>

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        {activeTab === "dashboard" ? (
          <AnalyticsDashboard stats={dashboardStats} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-brand flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                  <FileSpreadsheet className="w-4 h-4" />
                  1. Import Merchant Master
                </h2>
                <p className="text-xs text-slate-500 mb-2">
                  Default merchants are pre-seeded in Supabase. Upload Excel/CSV to add or update more.
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={uploadMerchantFile}
                  className="text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand"
                />
                {merchantUploadMsg && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2">{merchantUploadMsg}</p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-brand flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                  <FileSpreadsheet className="w-4 h-4" />
                  2. Import Issue Master & Scores
                </h2>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={uploadIssueFile}
                  className="text-xs w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-light file:text-brand"
                />
                {issueUploadMsg && (
                  <p className="text-xs font-semibold text-emerald-700 mt-2">{issueUploadMsg}</p>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-sm font-bold text-brand pb-2 mb-3 border-b border-slate-100">
                  Select Issue Template ({filteredTemplates.length})
                </h2>
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search issue type..."
                    value={tplSearch}
                    onChange={(e) => setTplSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {["ALL", ...CATEGORIES].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setCatFilter(cat)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                        catFilter === cat
                          ? "bg-brand text-white border-brand"
                          : "bg-white text-slate-600 border-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {filteredTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      onClick={() => selectTemplate(tpl)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        formData.type_of_issue === tpl.type_of_issue
                          ? "border-brand bg-brand-light"
                          : "border-slate-200 hover:border-brand bg-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-800 mb-1.5">
                        {tpl.type_of_issue}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold mr-1">
                            {tpl.category}
                          </span>
                          {tpl.business_service}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Score: {tpl.score} • {tpl.solutions?.length || 0} sol
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-base font-bold text-brand pb-3 mb-4 border-b border-slate-100">
                  Log Entry Form
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Business Services *
                      </label>
                      <select
                        value={formData.business_service}
                        onChange={(e) =>
                          setFormData({ ...formData, business_service: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Task Originated *
                      </label>
                      <select
                        value={formData.task_originated}
                        onChange={(e) =>
                          setFormData({ ...formData, task_originated: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        {ORIGINATED.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Type of Issue *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.type_of_issue}
                        onChange={(e) =>
                          setFormData({ ...formData, type_of_issue: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Merchant Name (Pre-seeded in DB)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SUPER DUPER or BROWN COFFEE"
                        value={formData.merchant_name}
                        onChange={(e) => {
                          setFormData({ ...formData, merchant_name: e.target.value });
                          searchMerchants(e.target.value);
                        }}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                      {merchantSuggestions.length > 0 && (
                        <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {merchantSuggestions.map((m) => (
                            <div
                              key={m.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  merchant_name: m.merchant_name,
                                  tid_mid: m.tid_mid,
                                  business_service: m.business_service || formData.business_service,
                                });
                                setMerchantSuggestions([]);
                              }}
                              className="px-3 py-2 text-xs hover:bg-brand-light cursor-pointer border-b border-slate-100"
                            >
                              <div className="font-bold text-slate-800">{m.merchant_name}</div>
                              <div className="text-slate-500">
                                MID/TID: {m.tid_mid} (Right 8: {m.right_8_digits})
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        MID / TID (Type right 8 digits)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4110063"
                        value={formData.tid_mid}
                        onChange={(e) => {
                          setFormData({ ...formData, tid_mid: e.target.value });
                          searchMerchants(e.target.value);
                        }}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Contact Number / Channel
                      </label>
                      <input
                        type="text"
                        value={formData.contact_number}
                        onChange={(e) =>
                          setFormData({ ...formData, contact_number: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Reported By *
                      </label>
                      <select
                        value={formData.reported_by}
                        onChange={(e) =>
                          setFormData({ ...formData, reported_by: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        {REPORTED_BY.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Status *
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        <option value="Done">Done</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Date Solved
                      </label>
                      <input
                        type="date"
                        value={formData.date_solved}
                        onChange={(e) =>
                          setFormData({ ...formData, date_solved: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Score (Points) *
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        required
                        value={formData.score}
                        onChange={(e) =>
                          setFormData({ ...formData, score: parseInt(e.target.value, 10) || 1 })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-bold text-emerald-700"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Solution *
                      </label>
                      {optionalSolutions.length > 0 && (
                        <select
                          value={formData.solution}
                          onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                          className="w-full text-xs border border-brand bg-brand-light rounded-lg px-3 py-2 mb-1.5 font-medium text-brand-dark"
                        >
                          <option value="">
                            -- Choose optional solution ({optionalSolutions.length}) --
                          </option>
                          {optionalSolutions.map((sol, i) => (
                            <option key={i} value={sol}>
                              {sol}
                            </option>
                          ))}
                        </select>
                      )}
                      <input
                        type="text"
                        required
                        value={formData.solution}
                        onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Supported By
                      </label>
                      <select
                        value={formData.supported_by}
                        onChange={(e) =>
                          setFormData({ ...formData, supported_by: e.target.value })
                        }
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      >
                        {STAFF_LIST.map((s) => (
                          <option key={s} value={s}>
                            {s || "(Blank)"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={formData.remarks}
                        onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex items-center justify-center gap-2 bg-brand hover:bg-brand-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add Log Entry
                    </button>
                    {toastMsg && (
                      <span className="flex items-center gap-1 text-sm font-semibold text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" />
                        {toastMsg}
                      </span>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-brand">
                    Captured Issue Logs ({logs.length} rows)
                  </h2>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 sticky top-0">
                        <th className="p-2.5 border border-slate-200">No</th>
                        <th className="p-2.5 border border-slate-200">Date</th>
                        <th className="p-2.5 border border-slate-200">Merchant</th>
                        <th className="p-2.5 border border-slate-200">MID/TID</th>
                        <th className="p-2.5 border border-slate-200">Service</th>
                        <th className="p-2.5 border border-slate-200">Type of Issue</th>
                        <th className="p-2.5 border border-slate-200">Category</th>
                        <th className="p-2.5 border border-slate-200">Score</th>
                        <th className="p-2.5 border border-slate-200">Solution</th>
                        <th className="p-2.5 border border-slate-200">Status</th>
                        <th className="p-2.5 border border-slate-200">Supported By</th>
                        <th className="p-2.5 border border-slate-200">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-200">{logs.length - idx}</td>
                          <td className="p-2 border border-slate-200 whitespace-nowrap">{row.date}</td>
                          <td className="p-2 border border-slate-200 whitespace-nowrap">
                            {row.merchant_name}
                          </td>
                          <td className="p-2 border border-slate-200 whitespace-nowrap">
                            {row.tid_mid}
                          </td>
                          <td className="p-2 border border-slate-200">{row.business_service}</td>
                          <td className="p-2 border border-slate-200 font-semibold">
                            {row.type_of_issue}
                          </td>
                          <td className="p-2 border border-slate-200">{row.category}</td>
                          <td className="p-2 border border-slate-200 font-bold text-emerald-700">
                            {row.score}
                          </td>
                          <td className="p-2 border border-slate-200">{row.solution}</td>
                          <td className="p-2 border border-slate-200">{row.status}</td>
                          <td className="p-2 border border-slate-200 whitespace-nowrap">
                            {row.supported_by}
                          </td>
                          <td className="p-2 border border-slate-200">
                            <button
                              type="button"
                              onClick={() => deleteLog(row.id)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
