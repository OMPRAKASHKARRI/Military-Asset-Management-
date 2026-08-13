const VARIANTS = {
  weapon: "bg-red-500/10 text-red-400 border-red-500/20",
  vehicle: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  ammunition: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  admin: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  base_commander: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  logistics_officer: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
  default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function Badge({ children, variant }) {
  const key = (variant || String(children)).toLowerCase();
  const cls = VARIANTS[key] || VARIANTS.default;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
