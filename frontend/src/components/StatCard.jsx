export default function StatCard({ label, value, icon: Icon, tone = "default", onClick, sub }) {
  const tones = {
    default: "text-slate-100",
    positive: "text-emerald-400",
    negative: "text-red-400",
    accent: "text-accent-light",
  };

  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`bg-navy-850 border border-navy-700 rounded-xl p-5 flex flex-col gap-3 text-left w-full ${
        onClick ? "hover:border-navy-500 hover:bg-navy-800 transition-colors cursor-pointer" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-navy-700/60 flex items-center justify-center">
            <Icon size={16} className="text-slate-400" />
          </div>
        )}
      </div>
      <div className={`text-2xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </Wrapper>
  );
}
