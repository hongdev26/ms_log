"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

interface DashboardProps {
  stats: {
    kpis: {
      total_logs: number;
      total_score: number;
      done_count: number;
      pending_count: number;
    };
    by_category: { category: string; count: number }[];
    by_staff: { supported_by: string; total_score: number }[];
    by_service: { business_service: string; count: number }[];
    top_issues: { type_of_issue: string; count: number }[];
  } | null;
}

const COLORS = ["#005b7f", "#e63946", "#d97706", "#15803d", "#6366f1", "#475569"];

export default function AnalyticsDashboard({ stats }: DashboardProps) {
  if (!stats) {
    return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
  }

  const { kpis, by_category, by_staff, by_service, top_issues } = stats;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Total Logs</p>
          <p className="text-3xl font-extrabold text-brand mt-1">{kpis.total_logs}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Total Score Accumulated</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-1">{kpis.total_score} pts</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Completed (Done)</p>
          <p className="text-3xl font-extrabold text-sky-700 mt-1">{kpis.done_count}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Pending Cases</p>
          <p className="text-3xl font-extrabold text-rose-600 mt-1">{kpis.pending_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4">Logs by Category</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={by_category}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {by_category.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4">Staff Performance by Total Score</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={by_staff}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="supported_by" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total_score" name="Score Points" fill="#005b7f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4">Logs by Business Service</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={by_service}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="business_service" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Logs" fill="#15803d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4">Top Issue Types</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top_issues} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" />
                <YAxis dataKey="type_of_issue" type="category" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Cases" fill="#e63946" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
