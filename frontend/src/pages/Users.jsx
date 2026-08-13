import { useEffect, useState, useCallback } from "react";
import { Plus, Users as UsersIcon } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import { Button } from "../components/ui";
import Badge from "../components/Badge";
import { LoadingState, EmptyState, ErrorState } from "../components/States";

const ROLES = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"];

export default function Users() {
  const toast = useToast();
  const [bases, setBases] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", role: "LOGISTICS_OFFICER", baseId: "" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    api.get("/bases").then((r) => setBases(r.data)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    api
      .get("/users")
      .then((r) => setRows(r.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openModal() {
    setForm({ username: "", password: "", role: "LOGISTICS_OFFICER", baseId: "" });
    setFormError("");
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    if (!form.username.trim() || !form.password || !form.role) {
      setFormError("Please fill in all required fields.");
      return;
    }
    if (form.role !== "ADMIN" && !form.baseId) {
      setFormError("Base is required for this role.");
      return;
    }
    if (form.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/users", { ...form, baseId: form.role === "ADMIN" ? null : form.baseId });
      toast.success("User created successfully.");
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
      <div className="bg-navy-850 border border-navy-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <UsersIcon size={16} className="text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">System Users</h3>
          </div>
          <Button onClick={openModal}>
            <Plus size={15} /> New User
          </Button>
        </div>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : rows.length === 0 ? (
          <EmptyState label="No users found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-navy-700">
                  <th className="px-5 py-3 font-medium">Username</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Base</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-navy-700/60 hover:bg-navy-800/50 transition-colors">
                    <td className="px-5 py-3 text-slate-200 font-medium">{r.username}</td>
                    <td className="px-5 py-3">
                      <Badge variant={r.role}>{r.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{r.base?.name || "—"}</td>
                    <td className="px-5 py-3 text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
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
        title="Create New User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Creating..." : "Create User"}
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
          <FormField label="Username">
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="input"
              placeholder="e.g. commander_bravo"
            />
          </FormField>
          <FormField label="Password">
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              placeholder="Minimum 8 characters"
            />
          </FormField>
          <FormField label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </FormField>
          {form.role !== "ADMIN" && (
            <FormField label="Base">
              <select value={form.baseId} onChange={(e) => setForm({ ...form, baseId: e.target.value })} className="input">
                <option value="">Select base</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
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
