import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ArrowLeftRight,
  ClipboardList,
  FileMinus,
  ScrollText,
  Users,
  ShieldHalf,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart, roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
  { to: "/transfers", label: "Transfers", icon: ArrowLeftRight, roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
  { to: "/assignments", label: "Assignments", icon: ClipboardList, roles: ["ADMIN", "BASE_COMMANDER"] },
  { to: "/expenditures", label: "Expenditures", icon: FileMinus, roles: ["ADMIN", "BASE_COMMANDER"] },
  { to: "/audit-logs", label: "Audit Logs", icon: ScrollText, roles: ["ADMIN", "BASE_COMMANDER"] },
  { to: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-navy-900 border-r border-navy-700 h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-navy-700">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
          <ShieldHalf size={18} className="text-accent-light" />
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-slate-100 tracking-tight">MilAsset</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Ops Command</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/15 text-accent-light border border-accent/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-navy-800 border border-transparent"
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-navy-700 text-[11px] text-slate-600">
        Military Asset Management System
      </div>
    </aside>
  );
}
