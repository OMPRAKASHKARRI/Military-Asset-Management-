import { useEffect, useState, useCallback } from "react";
import { Plus, FlameKindling } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import FilterBar from "../components/FilterBar";
import Modal from "../components/Modal";
import { Button } from "../components/ui";
import { LoadingState, EmptyState, ErrorState } from "../components/States";

export default function Expenditures() {
  const { user } = useAuth();
  const toast = useToast();
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({});
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ baseId: "", equipmentTypeId: "", quantity: "", reason: "" });
  const [formError, setFormError] = useState("");

  const isCommander = user?.role === "BASE_COMMANDER";

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
    api
      .get("/expenditures", { params })
      .then((r) => setRows(r.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  function openModal() {
    setForm({ baseId: isCommander ? user.baseId : "", equipmentTypeId: "", quantity: "", reason: "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const qty = Number(form.quantity);
    if (!form.baseId || !form.equipmentTypeId || !form.reason.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Quantity must be a positive whole number.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/expenditures", { ...form, quantity: qty });
      toast.success("Expenditure recorded successfully.");
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <FilterBar bases={bases} equipmentTypes={equipmentTypes} filters={filters} onChange={setFilters} showDates={false} showBase={!isCommander} />

      <div className="bg-navy-850 border border-navy-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <FlameKindling size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Expenditure History</h3>
          </div>
          <Button onClick={openModal}>
            <Plus size={15} /> New Expenditure
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState label="No expenditures recorded yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-navy-700">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Base</th>
                  <th className="px-5 py-3 font-medium">Equipment</th>
                  <th className="px-5 py-3 font-medium text-right">Quantity</th>
                  <th className="px-5 py-3 font-medium">Reason</th>
                  <th className="px-5 py-3 font-medium">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-navy-700/60 hover:bg-navy-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-300">{new Date(r.recordedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-slate-300">{r.base?.name}</td>
                    <td className="px-5 py-3 text-slate-200 font-medium">{r.equipmentType?.name}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-red-400 font-medium">-{r.quantity}</td>
                    <td className="px-5 py-3 text-slate-400">{r.reason}</td>
                    <td className="px-5 py-3 text-slate-400">{r.recordedBy?.username}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Expenditure"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save Expenditure"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-3 py-2">
              {formError}
            </div>
          )}
          <FormField label="Base">
            <select
              disabled={isCommander}
              value={form.baseId}
              onChange={(e) => setForm({ ...form, baseId: e.target.value })}
              className="input"
            >
              <option value="">Select base</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Equipment">
            <select
              value={form.equipmentTypeId}
              onChange={(e) => setForm({ ...form, equipmentTypeId: e.target.value })}
              className="input"
            >
              <option value="">Select equipment</option>
              {equipmentTypes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity">
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              className="input"
              placeholder="e.g. 500"
            />
          </FormField>
          <FormField label="Reason">
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="input"
              placeholder="e.g. Live-fire training exercise"
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
