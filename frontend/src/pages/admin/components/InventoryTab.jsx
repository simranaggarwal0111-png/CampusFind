import React from "react";
import { Search, Filter, Edit3, Trash2 } from "lucide-react";

const InventoryTab = ({
  filteredItems,
  inventorySearch,
  setInventorySearch,
  inventoryTypeFilter,
  setInventoryTypeFilter,
  inventoryStatusFilter,
  setInventoryStatusFilter,
  onStartEditItem,
  onDeleteItem,
  onUpdateItemStatus,
}) => {
  return (
    <section className="mt-6 space-y-4">
      {/* Search and filters bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 flex-1 max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search items by Title, Location, Description..."
            value={inventorySearch}
            onChange={(e) => setInventorySearch(e.target.value)}
            className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={inventoryTypeFilter}
            onChange={(e) => setInventoryTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Types</option>
            <option value="Lost">Lost Items</option>
            <option value="Found">Found Items</option>
          </select>

          <select
            value={inventoryStatusFilter}
            onChange={(e) => setInventoryStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Found">Found (Matched)</option>
            <option value="Claimed">Claimed</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 text-center text-slate-400">
          No items match your inventory criteria.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-5 shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.type === "Lost"
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {item.status}
                    </span>
                  </div>
                  <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                    <span data-no-translate>{item.title}</span>
                  </h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onStartEditItem(item)}
                    title="Edit item details"
                    className="rounded-lg p-2 text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors cursor-pointer"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item._id)}
                    title="Delete item permanently"
                    className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p>
                  Category:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    <span data-no-translate>{item.category}</span>
                  </strong>
                </p>
                <p>
                  Location:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    <span data-no-translate>{item.location}</span>
                  </strong>
                </p>
                <p>
                  Date:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    {item.date}
                  </strong>
                </p>
                <p>
                  Contact:{" "}
                  <strong className="text-slate-700 dark:text-slate-300">
                    <span data-no-translate>{item.contact}</span>
                  </strong>
                </p>
              </div>

              <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                <span data-no-translate>{item.description}</span>
              </p>

              {/* Status switcher for admin */}
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                <span className="text-slate-400 font-medium">Quick Status:</span>
                <select
                  value={item.status}
                  onChange={(e) => onUpdateItemStatus(item._id, e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Found">Found (Matched)</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Resolved">Resolved (Handed Over)</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default InventoryTab;
