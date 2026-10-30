import React from "react";
import { CheckCircle2 } from "lucide-react";

const AuditTab = ({ claims }) => {
  const resolvedClaims = claims.filter(
    (c) => c.status === "Resolved" || c.item?.status === "Resolved"
  );

  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Handover Resolution Audit Trail
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Official audit log of verified item returns executed at the Campus Security Station.
        </p>

        {resolvedClaims.length === 0 ? (
          <div className="mt-6 py-8 text-center text-xs text-slate-400">
            No items have been marked returned yet.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {resolvedClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {claim.item?.title || "Item"} ({claim.item?.category || "General"})
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold">
                    Claim Code: {claim.claimCode || "N/A"}
                  </span>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-3 text-slate-500 dark:text-slate-400">
                  <p>
                    Recipient:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {claim.studentName}
                    </strong>
                  </p>
                  <p>
                    Contact:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {claim.contact}
                    </strong>
                  </p>
                  <p>
                    Date Returned:{" "}
                    <strong className="text-slate-700 dark:text-slate-300">
                      {claim.handoverDate
                        ? new Date(claim.handoverDate).toLocaleString()
                        : "Recorded"}
                    </strong>
                  </p>
                </div>

                {claim.handoverNotes && (
                  <div className="mt-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <strong>Desk Notes:</strong> {claim.handoverNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AuditTab;
