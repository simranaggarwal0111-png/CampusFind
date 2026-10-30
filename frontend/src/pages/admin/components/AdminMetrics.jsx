import React from "react";
import { Clock, FileCheck2, CheckCircle2, Package } from "lucide-react";

const AdminMetrics = ({
  pendingCount,
  approvedCount,
  resolvedCount,
  totalItemsCount,
  activeItemsCount,
}) => {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Pending Review</span>
          <Clock className="h-4 w-4 text-amber-500" />
        </div>
        <p className="mt-2 text-2xl font-black text-amber-500">{pendingCount}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Claims awaiting verification</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Approved Passes</span>
          <FileCheck2 className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="mt-2 text-2xl font-black text-emerald-500">{approvedCount}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Awaiting physical pickup</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Items Handed Over</span>
          <CheckCircle2 className="h-4 w-4 text-cyan-500" />
        </div>
        <p className="mt-2 text-2xl font-black text-cyan-500">{resolvedCount}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Reunited & resolved</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>Total Catalog</span>
          <Package className="h-4 w-4 text-slate-500" />
        </div>
        <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">
          {totalItemsCount}{" "}
          <span className="text-xs font-normal text-slate-400">({activeItemsCount} active)</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">Catalogued property</p>
      </div>
    </div>
  );
};

export default AdminMetrics;
