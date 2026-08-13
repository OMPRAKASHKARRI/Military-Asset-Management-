import { useEffect, useState, useCallback } from "react";
import { ScrollText } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import Badge from "../components/Badge";
import { LoadingState, EmptyState, ErrorState } from "../components/States";

const ACTIONS = ["PURCHASE", "TRANSFER", "ASSIGNMENT", "EXPENDITURE", "USER_CREATED"];

export default function AuditLogs() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({});

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (filters.action) params.action = filters.action;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    api
      .get("/audit-logs", { params })
      .then((r) => setRows(r.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="bg-navy-850 border border-navy-700 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Action</label>
          <select
            value={filters.action || ""}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent min-w-[160px]"
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ""}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate || ""}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent"
          />
        </div>
        {(filters.action || filters.startDate || filters.endDate) && (
          <button onClick={() => setFilters({})} className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-navy-850 border border-navy-700 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-navy-700">
          <ScrollText size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200">System Audit Trail</h3>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState label="No audit entries found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-navy-700">
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Details</th>
                  <th className="px-5 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-navy-700/60 hover:bg-navy-800/50 transition-colors">
                    <td className="px-5 py-3">
                      <Badge>{r.action}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-300 whitespace-nowrap">{r.user?.username}</td>
                    <td className="px-5 py-3 text-slate-400 max-w-md">{r.details}</td>
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
