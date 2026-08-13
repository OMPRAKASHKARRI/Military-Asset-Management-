import { Loader2, Inbox, AlertTriangle } from "lucide-react";

export function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function EmptyState({ label = "No records found", sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
      <Inbox size={28} className="text-slate-600" />
      <span className="text-sm font-medium text-slate-400">{label}</span>
      {sub && <span className="text-xs text-slate-600">{sub}</span>}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-red-400 gap-3">
      <AlertTriangle size={28} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
