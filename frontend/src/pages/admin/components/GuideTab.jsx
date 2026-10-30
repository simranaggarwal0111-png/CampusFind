import React from "react";
import { Building } from "lucide-react";

const GuideTab = () => {
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-sm">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="h-5 w-5 text-emerald-500" />
          Campus Desk Standard Operating Procedures (SOP)
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Official protocol guidelines for desk officers managing misplaced and returned property.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 text-xs">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px]">
                1
              </span>
              Claim Verification Protocol
            </h4>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              Compare private markers submitted by the student (lock screen wallpaper, sticker placements, internal engraved initials, device model/serial) against the physical item in safe custody before clicking <strong>Approve Claim & Issue Pass</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px]">
                2
              </span>
              Physical Handover Execution
            </h4>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              Request physical student ID card. Confirm the Claim Code presented on the student's digital handover pass matches the record. Hand over property and enter audit remarks before confirming return.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px]">
                3
              </span>
              Custody & Holding Windows
            </h4>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              All deposited property is retained at Central Security Station for 90 days. High-value electronic devices (laptops, phones) are kept in Vault Locker #4. Unclaimed items after 90 days transition to university surplus.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[11px]">
                4
              </span>
              Station Hours & Contact
            </h4>
            <p className="mt-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              Campus Security Desk (Building B, Room 102). Regular hours: Monday – Friday 08:00 – 18:00; Saturday 10:00 – 14:00. Internal extension: ext. 4102. Emergency: ext. 911.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GuideTab;
