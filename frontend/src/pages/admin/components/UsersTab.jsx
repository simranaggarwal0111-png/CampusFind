import React from "react";
import { Users, Search } from "lucide-react";

const UsersTab = ({
  filteredUsers,
  userSearch,
  setUserSearch,
  currentUser,
  onToggleUserRole,
}) => {
  return (
    <section className="mt-6 space-y-4">
      <div className="rounded-[24px] border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Campus Staff & User Directory
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage campus accounts, view registered students, and promote staff officers to Admin status.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs w-full sm:w-64">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full bg-transparent outline-none text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No registered users match your search.
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Email Address</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Registered On</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const isTargetAdmin = u.role === "admin";
                  const isSelf =
                    u._id === currentUser?.id || u._id === currentUser?._id;

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                        <span data-no-translate>{u.name}</span>{" "}
                        {isSelf && (
                          <span className="text-[10px] text-emerald-500">
                            (You)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 text-slate-600 dark:text-slate-300 font-mono">
                        <span data-no-translate>{u.email}</span>
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isTargetAdmin
                              ? "bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString()
                          : "Recent"}
                      </td>
                      <td className="py-3.5 text-right">
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => onToggleUserRole(u._id, u.role)}
                            className={`rounded-lg px-3 py-1 font-bold text-[11px] transition-all cursor-pointer ${
                              isTargetAdmin
                                ? "border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                            }`}
                          >
                            {isTargetAdmin ? "Revoke Admin" : "Make Admin"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default UsersTab;
