import { Filter } from "lucide-react";

export default function FilterBar({ bases, equipmentTypes, filters, onChange, showBase = true, showDates = true }) {
  return (
    <div className="bg-navy-850 border border-navy-700 rounded-xl p-4 mb-5 flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
        <Filter size={14} />
        Filters
      </div>

      {showBase && (
        <div>
          <label className="block text-[11px] text-slate-500 mb-1">Base</label>
          <select
            value={filters.baseId || ""}
            onChange={(e) => onChange({ ...filters, baseId: e.target.value })}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent min-w-[140px]"
          >
            <option value="">All Bases</option>
            {bases?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-[11px] text-slate-500 mb-1">Equipment Type</label>
        <select
          value={filters.equipmentTypeId || ""}
          onChange={(e) => onChange({ ...filters, equipmentTypeId: e.target.value })}
          className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent min-w-[140px]"
        >
          <option value="">All Equipment</option>
          {equipmentTypes?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {showDates && (
        <>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ""}
              onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
              className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ""}
              onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
              className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {(filters.baseId || filters.equipmentTypeId || filters.startDate || filters.endDate) && (
        <button
          onClick={() => onChange({})}
          className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 ml-1"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
