import React, { useState, useEffect } from "react";
import { Search, ArrowUpRight, ShieldCheck, QrCode, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl, getItemImageUrl } from "../utils/api";

const quickLinks = [
  { title: "Lost Items", text: "Browse items lost around campus", icon: "🧳", path: "/lost" },
  { title: "Found Items", text: "Discover items waiting to be claimed", icon: "📦", path: "/found" },
  { title: "Report Lost", text: "Tell the campus what you lost", icon: "📝", path: "/report-lost" },
  { title: "Report Found", text: "Help someone recover their item", icon: "📍", path: "/report-found" },
];


const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl("/api/items"))
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const availableItems = Array.isArray(data)
          ? data.filter((item) => item.status?.toLowerCase() !== "resolved")
          : [];
        setItems(availableItems.slice(0, 8));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const searchText = search.trim().toLowerCase();
  const displayedItems = items.filter(
    (item) =>
      (category === "All" || item.category?.toLowerCase() === category.toLowerCase()) &&
      [item.title, item.type, item.category, item.location, item.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(searchText)
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080d1a] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Navbar />

      <main className="px-4 pb-12 md:px-6 lg:px-10">
        {/* Hero Section */}
        <section
          className="mx-auto mt-2 max-w-[1280px] overflow-hidden rounded-[26px] border border-slate-200/90 dark:border-slate-800/80 bg-cover bg-center shadow-2xl shadow-slate-200/50 dark:shadow-black/40 relative"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(8, 13, 26, 0.94) 0%, rgba(13, 31, 24, 0.88) 60%, rgba(8, 13, 26, 0.96) 100%), url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80')",
          }}
        >
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-1/4 -z-0 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -z-0 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 px-6 py-12 md:px-10 md:py-16 lg:px-14 lg:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-md shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Smart Campus Recovery Network
            </div>

            <div className="pt-6 md:pt-8">
              <h1 className="max-w-[660px] text-3xl font-black leading-tight text-white md:text-5xl lg:text-6xl tracking-tight">
                Lost Something?
                <span className="mt-2 block bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Found Something?
                </span>
              </h1>

              <p className="mt-4 max-w-[560px] text-sm md:text-base text-slate-300 leading-relaxed">
                CampusFind connects students across the university to report, claim, and securely complete physical item handovers at official campus stations.
              </p>

              {/* Search bar */}
              <div className="mt-8 flex max-w-[760px] flex-col gap-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-slate-700/80 bg-slate-900/90 p-2 shadow-2xl backdrop-blur-xl transition-all focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <Search className="ml-3 h-5 w-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by item, location, category, tag..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="ml-3 w-full border-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    aria-label="Search items"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30 hover:from-emerald-400 hover:to-teal-400 hover:scale-105 transition-all"
                  >
                    <Search className="h-4.5 w-4.5" />
                  </button>
                </div>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-4 py-2 text-sm text-slate-300 shadow-xl backdrop-blur-xl focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span className="whitespace-nowrap">Category</span>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full cursor-pointer border-0 bg-transparent text-white outline-none sm:w-36"
                  >
                    <option value="All" className="text-slate-900">All categories</option>
                    <option value="Bags" className="text-slate-900">Bags</option>
                    <option value="Electronics" className="text-slate-900">Electronics</option>
                    <option value="Books" className="text-slate-900">Books</option>
                    <option value="Clothing" className="text-slate-900">Clothing</option>
                    <option value="Keys" className="text-slate-900">Keys</option>
                    <option value="Documents" className="text-slate-900">Documents</option>
                    <option value="Accessories" className="text-slate-900">Accessories</option>
                    <option value="Other" className="text-slate-900">Other</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 items-center justify-between pb-2">
              <Link
                to="/handover"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-4 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition-all"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Explore 4-Step Handover Protocol
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <div className="rounded-full border border-slate-700/80 bg-slate-900/70 px-4 py-1.5 text-xs font-medium text-slate-300 shadow-md backdrop-blur-md">
                Misplaced an item? <span className="font-bold text-emerald-400">We're here to help.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mx-auto mt-8 grid max-w-[1280px] gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickLinks.map((item) => (
            <Link
              key={item.title}
              to={item.path}
              className="flex items-center gap-4 rounded-[22px] border border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 p-4 shadow-lg shadow-slate-200/40 dark:shadow-black/20 backdrop-blur-md transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-500/10 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-2xl shadow-inner transition-transform group-hover:scale-110">
                {item.icon}
              </div>
              <div>
                <h3 data-no-translate className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            </Link>
          ))}
        </section>

        {/* Handover Feature Banner */}
        <section className="mx-auto mt-8 max-w-[1280px] rounded-[24px] border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-cyan-500/10 dark:from-emerald-950/30 dark:via-slate-900/60 dark:to-teal-950/20 p-6 md:p-8 backdrop-blur-xl shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">
                <QrCode className="h-3.5 w-3.5" />
                Verified Campus Handover Desk
              </span>
              <h2 className="mt-2 text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Found An Item Or Awaiting Return?
              </h2>
              <p className="mt-1 text-xs md:text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                Every claimed item is verified by staff at Central Security Desk (Building B, Room 102). Check live handover status with your Claim Code.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/handover"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/40 hover:from-emerald-500 hover:to-teal-500 transition-all hover:-translate-y-0.5"
              >
                Track Handover Status
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/my-activity"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all"
              >
                My Handover Passes
              </Link>
            </div>
          </div>
        </section>

        {/* Recent Items Section */}
        <section className="mx-auto mt-10 max-w-[1280px] rounded-[26px] border border-slate-200/90 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/50 p-5 md:p-8 backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Recent Campus Items
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Check out the latest lost and found reports from across the campus.
              </p>
            </div>

            <Link
              to="/lost"
              className="flex w-fit items-center gap-2 rounded-full border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all hover:border-emerald-500/40 hover:text-emerald-500"
            >
              View All Items
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {displayedItems.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-slate-500">
                No items match these filters. Try another search or category.
              </p>
            ) : (
              displayedItems.map((item, idx) => (
                <div
                  key={item._id || idx}
                  role={item._id ? "link" : undefined}
                  tabIndex={item._id ? 0 : undefined}
                  aria-label={item._id ? `View details for ${item.title}` : undefined}
                  onClick={(event) => {
                    if (item._id && !event.target.closest("a, button")) {
                      navigate(`/items/${item._id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (item._id && event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      navigate(`/items/${item._id}`);
                    }
                  }}
                  className={`overflow-hidden rounded-[22px] border border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-slate-900/90 shadow-lg shadow-slate-200/50 dark:shadow-black/25 transition-all hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-500/10 group ${
                    item._id ? "cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500" : ""
                  }`}
                >
                {item.imageUrl && (
                  <img
                    src={getItemImageUrl(item.imageUrl)}
                    alt={item.title || "Reported item"}
                    className="h-44 w-full object-cover"
                  />
                )}
                <div className="flex items-center justify-between p-4 pb-0">
                  <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        item.type === "Lost"
                          ? "border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                          : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      }`}
                    >
                      {item.type}
                    </span>
                    {item.status && (
                      <span className="rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:text-slate-200">
                        {item.status}
                      </span>
                    )}
                  </div>

                  <div className="p-4 pt-3">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>
                    {item._id && (
                      <Link
                        to={`/items/${item._id}`}
                        className="mt-1 inline-flex text-xs font-semibold text-emerald-600 hover:text-emerald-500 dark:text-emerald-400"
                      >
                        View details
                      </Link>
                    )}

                    <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <p>📍 <span data-no-translate>{item.location || "Campus"}</span></p>
                      <p>🏷️ <span data-no-translate>{item.category || "General"}</span></p>
                      <p>📅 <span data-no-translate>{item.date || "Recent"}</span></p>
                    </div>

                    <Link
                      to={item.type === "Lost" ? "/lost" : "/found"}
                      className="mt-4 inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-300"
                    >
                      {item.type === "Found" ? "Claim Item" : "I Found This"}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#060a14] py-8 text-slate-500 dark:text-slate-400 transition-colors duration-300">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20">
              ⌕
            </div>
            <div>
              <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                Campus<span className="text-emerald-500 dark:text-emerald-400">Find</span>
              </div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-medium">
                Lost & Found Network
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-6 text-xs md:text-sm text-slate-600 dark:text-slate-400">
            <Link to="/" className="hover:text-emerald-500 transition-colors">Home</Link>
            <Link to="/lost" className="hover:text-emerald-500 transition-colors">Lost Items</Link>
            <Link to="/found" className="hover:text-emerald-500 transition-colors">Found Items</Link>
            <Link to="/handover" className="hover:text-emerald-500 transition-colors">Handover Flow</Link>
            <Link to="/my-activity" className="hover:text-emerald-500 transition-colors">My Activity</Link>
          </div>

          <div className="text-xs text-slate-400">
            © {new Date().getFullYear()} CampusFind. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;