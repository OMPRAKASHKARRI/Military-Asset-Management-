import { useEffect, useState, useCallback } from "react";
import {
  PackageOpen,
  TrendingUp,
  UserCheck,
  FlameKindling,
  PackageCheck,
  ArrowRightLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import FilterBar from "../components/FilterBar";
import StatCard from "../components/StatCard";
import Modal from "../components/Modal";
import { LoadingState, ErrorState, EmptyState } from "../components/States";

const CATEGORY_COLORS = { WEAPON: "#f87171", VEHICLE: "#60a5fa", AMMUNITION: "#d4a54c" };

export default function Dashboard() {
  const toast = useToast();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNetModal, setShowNetModal] = useState(false);

  useEffect(() => {
    api.get("/bases").then((r) => setBases(r.data)).catch(() => {});
    api.get("/equipment-types").then((r) => setEquipmentTypes(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    const params = {};
    if (filters.baseId) params.baseId = filters.baseId;
    if (filters.equipmentTypeId) params.equipmentTypeId = filters.equipmentTypeId;
    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;

    api
      .get("/dashboard/metrics", { params })
      .then((r) => setData(r.data))
      .catch((err) => {
        setError(getErrorMessage(err));
        toast.error(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [filters, toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) return <LoadingState label="Loading dashboard metrics..." />;
  if (error && !data) return <ErrorState message={error} />;

  const m = data?.metrics || {};
  const categoryData = Object.entries(data?.categoryBreakdown || {}).map(([name, value]) => ({
    name,
    value: Math.max(value, 0),
  }));

  const movementData = [
    { name: "Purchases", value: m.purchases || 0 },
    { name: "Transfers In", value: m.transfersIn || 0 },
    { name: "Transfers Out", value: -(m.transfersOut || 0) },
    { name: "Assigned", value: -(m.assigned || 0) },
    { name: "Expended", value: -(m.expended || 0) },
  ];

  const transferChartData = (data?.recentTransfers || [])
    .slice()
    .reverse()
    .map((t) => ({
      name: `${t.equipmentType?.name?.split(" ")[0] || ""}`,
      quantity: t.quantity,
      label: `${t.sourceBase?.name} → ${t.destinationBase?.name}`,
    }));

  const expenditureChartData = (data?.recentExpenditures || [])
    .slice()
    .reverse()
    .map((e) => ({
      name: e.equipmentType?.name?.split(" ")[0] || "",
      quantity: e.quantity,
    }));

  return (
    <div className="space-y-5">
      <FilterBar bases={bases} equipmentTypes={equipmentTypes} filters={filters} onChange={setFilters} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Opening Balance" value={m.openingBalance ?? 0} icon={PackageOpen} />
        <StatCard
          label="Net Movement"
          value={(m.netMovement ?? 0) >= 0 ? `+${m.netMovement}` : m.netMovement}
          icon={TrendingUp}
          tone={m.netMovement >= 0 ? "positive" : "negative"}
          onClick={() => setShowNetModal(true)}
          sub="Click for breakdown"
        />
        <StatCard label="Assigned" value={m.assigned ?? 0} icon={UserCheck} tone="accent" />
        <StatCard label="Expended" value={m.expended ?? 0} icon={FlameKindling} tone="negative" />
        <StatCard label="Closing Balance" value={m.closingBalance ?? 0} icon={PackageCheck} tone="positive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Asset Movement</h3>
          {movementData.every((d) => d.value === 0) ? (
            <EmptyState label="No movement in this range" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={movementData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212e46" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#131a2a", border: "1px solid #212e46", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#e2e8f0" }}
                />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                  {movementData.map((d, i) => (
                    <Cell key={i} fill={d.value >= 0 ? "#3b82f6" : "#f87171"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-4">Assets by Category</h3>
          {categoryData.every((d) => d.value === 0) ? (
            <EmptyState label="No inventory to show" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {categoryData.map((d, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[d.name] || "#64748b"} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ background: "#131a2a", border: "1px solid #212e46", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowRightLeft size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Recent Transfer Activity</h3>
          </div>
          {transferChartData.length === 0 ? (
            <EmptyState label="No recent transfers" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={transferChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212e46" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#131a2a", border: "1px solid #212e46", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="quantity" fill="#60a5fa" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-navy-850 border border-navy-700 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <FlameKindling size={15} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Expenditure Trend</h3>
          </div>
          {expenditureChartData.length === 0 ? (
            <EmptyState label="No recent expenditures" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenditureChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#212e46" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#131a2a", border: "1px solid #212e46", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="quantity" fill="#d4a54c" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <Modal open={showNetModal} onClose={() => setShowNetModal(false)} title="Net Movement Breakdown">
        <div className="space-y-3">
          <Row label="Purchases" value={`+${m.purchases ?? 0}`} tone="positive" />
          <Row label="Transfers In" value={`+${m.transfersIn ?? 0}`} tone="positive" />
          <Row label="Transfers Out" value={`-${m.transfersOut ?? 0}`} tone="negative" />
          <div className="border-t border-navy-700 pt-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200">Total Net Movement</span>
            <span className={`text-sm font-bold ${m.netMovement >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {m.netMovement >= 0 ? `+${m.netMovement}` : m.netMovement}
            </span>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value, tone }) {
  const colors = { positive: "text-emerald-400", negative: "text-red-400" };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={`font-medium tabular-nums ${colors[tone] || "text-slate-200"}`}>{value}</span>
    </div>
  );
}
