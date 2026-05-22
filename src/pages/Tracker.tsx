import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { KanbanSquare, List, Calendar, Plus, Kanban, Trash2, Edit3, MessageSquare, Briefcase, CalendarClock, ChevronRight, ClipboardList } from "lucide-react";
import { APPLICATION_STATUSES, APPLICATION_TYPES } from "../utils/constants";
import { formatDateIndian } from "../utils/formatters";

interface TrackedApp {
  id: string;
  company: string;
  role: string;
  status: string;
  type: string;
  appliedDate: string;
  notes?: string;
  referralName?: string;
  driveDate?: string;
}

const INITIAL_TRACKED: TrackedApp[] = [
  {
    id: "app_1",
    company: "Zomato India",
    role: "Fullstack Developer Intern",
    status: "applied",
    type: "off-campus",
    appliedDate: "2026-05-18",
    notes: "Applied via referral"
  },
  {
    id: "app_2",
    company: "Tata Consultancy Services",
    role: "Graduate Engineer Trainee",
    status: "assessment",
    type: "campus-placement",
    appliedDate: "2026-05-10",
    driveDate: "2026-05-24",
    notes: "NQT cleared with high criteria"
  },
  {
    id: "app_3",
    company: "Razorpay",
    role: "Frontend Engineer (SDE I)",
    status: "interview-1",
    type: "referral",
    appliedDate: "2026-05-01",
    referralName: "Alumni Sarthak Roy"
  },
  {
    id: "app_4",
    company: "Wipro",
    role: "System Engineer Junior",
    status: "rejected",
    type: "off-campus",
    appliedDate: "2026-04-12",
    notes: "Got standard rejection auto-mail"
  }
];

export default function Tracker() {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const STORAGE_KEY = `jobgenie_tracked_applications_${userEmail}`;

  const [view, setView] = useState<"kanban" | "list">("kanban");
  
  const [apps, setApps] = useState<TrackedApp[]>(() => {
    const listStr = localStorage.getItem(STORAGE_KEY);
    if (listStr) {
      try {
        return JSON.parse(listStr);
      } catch (e) {
        return INITIAL_TRACKED;
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_TRACKED));
      return INITIAL_TRACKED;
    }
  });

  // Sync state changes with localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
  }, [apps, STORAGE_KEY]);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCompany, setManualCompany] = useState("");
  const [manualLocation, setManualLocation] = useState("");
  const [appType, setAppType] = useState("off-campus");
  const [appStatus, setAppStatus] = useState("saved");
  
  // Stats
  const totalCount = apps.length;
  const appliedCount = apps.filter(a => a.status === "applied").length;
  const progressCount = apps.filter(a => ["assessment", "interview-1", "interview-2", "interview-3"].includes(a.status)).length;
  const offeredCount = apps.filter(a => a.status === "offered").length;
  const rejectedCount = apps.filter(a => a.status === "rejected").length;
  
  const rejectionRate = totalCount > 0 ? Math.round((rejectedCount / totalCount) * 100) : 0;
  const offerRate = totalCount > 0 ? Math.round((offeredCount / totalCount) * 100) : 0;

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCompany || !manualTitle) return;
    
    const newApp: TrackedApp = {
      id: `app_${Date.now()}`,
      company: manualCompany,
      role: manualTitle,
      status: appStatus,
      type: appType,
      appliedDate: new Date().toISOString().split("T")[0],
      notes: manualLocation ? `Location: ${manualLocation}` : ""
    };

    setApps(prev => [newApp, ...prev]);
    setShowAddModal(false);
    setManualCompany("");
    setManualTitle("");
    setManualLocation("");
  };

  const handleDeleteApp = (id: string) => {
    setApps(prev => prev.filter(a => a.id !== id));
  };

  const handleMoveStatus = (id: string, newStatus: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Application Tracker</h1>
          <p className="text-sm text-zinc-400 mt-1">Keep track of all your job applications, interviews, test assessments, and placement rounds in one clean space.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-md cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Application</span>
        </button>
      </div>

      {/* Top Stats Band styled as exquisite Bento modules */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-mono">Total tracked</span>
          <span className="text-3xl font-black text-white mt-2 font-mono">{totalCount}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-mono">In Progress</span>
          <span className="text-3xl font-black text-amber-400 mt-2 font-mono">{progressCount}</span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-mono font-serif italic text-indigo-400">Offers Recieved</span>
          <span className="text-3xl font-black text-emerald-400 mt-2 font-mono">{offeredCount} <span className="text-xs text-zinc-500">({offerRate}%)</span></span>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest font-mono">Rejections</span>
          <span className="text-3xl font-black text-rose-400 mt-2 font-mono">{rejectedCount} <span className="text-xs text-zinc-500">({rejectionRate}%)</span></span>
        </div>
        <div className="col-span-2 md:col-span-1 bg-indigo-950/25 border border-indigo-505/20 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <span className="text-[10px] text-indigo-300 uppercase font-bold tracking-widest font-mono">ATS Gap Assessment</span>
          <span className="text-sm font-extrabold text-indigo-200 mt-2 flex items-center gap-1">
            <span>{rejectionRate > 30 ? "⚠️ High Gap" : "🟢 Optimal Profile"}</span>
          </span>
        </div>
      </div>

      {/* View Toggles & Filters */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div className="flex bg-zinc-900 border border-zinc-850 p-1 rounded-xl">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              view === "kanban" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            <KanbanSquare className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              view === "list" ? "bg-zinc-100 text-zinc-950" : "text-zinc-400 hover:text-white"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List Table</span>
          </button>
        </div>
      </div>

      {/* Main Board View */}
      {view === "kanban" ? (
        <div className="flex space-x-4 overflow-x-auto pb-6 select-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {APPLICATION_STATUSES.map((col) => {
            const colApps = apps.filter(a => a.status === col.value);
            return (
              <div key={col.value} className="flex-shrink-0 w-80 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-5 flex flex-col h-[550px]">
                {/* Column Title */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-4 flex-shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">{col.label}</span>
                  <span className="text-xs bg-zinc-850 px-2.5 py-0.5 rounded-full font-bold text-indigo-400 font-mono">
                    {colApps.length}
                  </span>
                </div>

                {/* Column List */}
                <div className="flex-grow overflow-y-auto space-y-3.5 pr-1">
                  {colApps.map((item) => (
                    <div
                      key={item.id}
                      className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex flex-col justify-between hover:border-zinc-700 transition-all cursor-pointer shadow-md group"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">{item.company}</h4>
                          <span className="text-[9px] font-mono bg-zinc-950 border border-zinc-800 px-1.5 py-0.5 rounded text-zinc-500">
                            {item.type}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1.5">{item.role}</h3>
                        {item.notes && <p className="text-zinc-500 text-[11px] mt-1.5 max-w-[95%] truncate leading-normal">{item.notes}</p>}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-850 flex-shrink-0">
                        <span className="text-[10px] text-zinc-500 font-mono">{formatDateIndian(item.appliedDate)}</span>
                        
                        <div className="flex items-center space-x-1.5 opacity-80 group-hover:opacity-100">
                          {/* Quick status cycle helper for step 1 demo */}
                          <select
                            value={item.status}
                            onChange={(e) => handleMoveStatus(item.id, e.target.value)}
                            className="bg-zinc-950 border border-zinc-805 text-[10px] rounded px-1.5 py-0.5 text-zinc-300"
                          >
                            {APPLICATION_STATUSES.map(st => (
                              <option key={st.value} value={st.value}>{st.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteApp(item.id)}
                            className="text-zinc-500 hover:text-rose-400 rounded p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="h-full border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-zinc-600">
                      <ClipboardList className="w-8 h-8 text-zinc-800 mb-1" />
                      <span className="text-[11px]">Edit or move items here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-zinc-300 text-sm">
              <thead className="bg-zinc-950/60 text-xs font-bold uppercase text-zinc-400 border-b border-zinc-900">
                <tr>
                  <th className="p-4">Company</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Track Type</th>
                  <th className="p-4">Column Status</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {apps.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-900/40">
                    <td className="p-4 font-bold text-white">{item.company}</td>
                    <td className="p-4 text-zinc-200">{item.role}</td>
                    <td className="p-4">
                      <span className="bg-zinc-950 border border-zinc-800 px-2 py-1 text-[10px] font-mono rounded text-zinc-400">
                        {item.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleMoveStatus(item.id, e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2 py-1.5 text-zinc-300 cursor-pointer focus:border-zinc-700"
                      >
                        {APPLICATION_STATUSES.map(st => (
                          <option key={st.value} value={st.value}>{st.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-zinc-500 font-mono">{formatDateIndian(item.appliedDate)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteApp(item.id)}
                        className="text-zinc-500 hover:text-rose-400 p-2 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Modal Dialogue */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <h2 className="text-xl font-black text-white mb-6">Track New Opportunity</h2>
            
            <form onSubmit={handleAddApplication} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. TCS, Capgemini, Zomato"
                  value={manualCompany}
                  onChange={(e) => setManualCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-650"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">Profile / Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. SDE-1, Tech Consultant, Intern"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-650"
                  required
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-semibold mb-2">Target Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Pune, Bangalore, Remote"
                  value={manualLocation}
                  onChange={(e) => setManualLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-sm text-zinc-100 outline-none transition-all placeholder:text-zinc-650"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">Track Type</label>
                  <select
                    value={appType}
                    onChange={(e) => setAppType(e.target.value)}
                    className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    {APPLICATION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 text-xs font-semibold mb-2">Initial Column</label>
                  <select
                    value={appStatus}
                    onChange={(e) => setAppStatus(e.target.value)}
                    className="w-full px-3 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-300 outline-none focus:border-zinc-700 cursor-pointer"
                  >
                    {APPLICATION_STATUSES.map(st => (
                      <option key={st.value} value={st.value}>{st.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-zinc-400 hover:text-white text-xs font-bold border border-transparent hover:border-zinc-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Save to Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
