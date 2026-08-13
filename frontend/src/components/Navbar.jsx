import { LogOut, MapPin } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Badge from "./Badge";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  BASE_COMMANDER: "Base Commander",
  LOGISTICS_OFFICER: "Logistics Officer",
};

export default function Navbar({ title }) {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 shrink-0 border-b border-navy-700 bg-navy-900/80 backdrop-blur px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-base md:text-lg font-semibold text-slate-100">{title}</h1>
      </div>
      <div className="flex items-center gap-3 md:gap-4">
        {user?.base?.name && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-navy-800 px-2.5 py-1.5 rounded-lg border border-navy-700">
            <MapPin size={13} />
            {user.base.name}
          </div>
        )}
        <div className="hidden sm:block text-right">
          <div className="text-sm font-medium text-slate-200">{user?.username}</div>
          <Badge variant={user?.role}>{ROLE_LABELS[user?.role] || user?.role}</Badge>
        </div>
        <button
          onClick={logout}
          title="Log out"
          className="w-9 h-9 rounded-lg bg-navy-800 hover:bg-navy-700 border border-navy-700 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
