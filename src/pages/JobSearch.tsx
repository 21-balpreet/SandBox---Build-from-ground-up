import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, MapPin, Building2, ExternalLink, Heart, CheckCircle2, 
  Sliders, Check, AlertCircle, Sparkles, X, Globe
} from "lucide-react";
import { INDIAN_CITIES, APPLICATION_SOURCES } from "../utils/constants";
import { formatIndianSalary } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { ENRICHED_JOBS, Job, getLivePlatformJobs } from "../utils/searchEngine";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

export default function JobSearch() {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const STORAGE_KEY = `jobgenie_tracked_applications_${userEmail}`;
  const SAVED_JOBS_KEY = `jobgenie_saved_jobs_${userEmail}`;

  // Core Search State
  const [rawQuery, setRawQuery] = useState("");
  const [location, setLocation] = useState("all");

  // Filter States
  const [selectedSource, setSelectedSource] = useState("all");
  const [worksiteType, setWorksiteType] = useState<string>("all");
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [companySize, setCompanySize] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [maxSalarySelector, setMaxSalarySelector] = useState<number>(2000000);

  // Saved & Applied Job IDs
  const [savedJobs, setSavedJobs] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_JOBS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [appliedJobs, setAppliedJobs] = useState<string[]>(() => {
    const listStr = localStorage.getItem(STORAGE_KEY);
    if (listStr) {
      try {
        const apps = JSON.parse(listStr);
        return apps.map((a: any) => a.id);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Strict search filter logic: shows exact matches + real-time portal search feeds
  const filteredJobs = useMemo(() => {
    // 1. Combine curated jobs with live real-time platform search cards
    const livePortalJobs = getLivePlatformJobs(rawQuery, location);
    const combinedPool = [...ENRICHED_JOBS, ...livePortalJobs];

    // 2. Deduplicate jobs list
    const uniqueMap = new Map<string, Job>();
    for (const job of combinedPool) {
      const key = `${job.company.toLowerCase()}_${job.title.toLowerCase()}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, job);
      }
    }
    const allJobs = Array.from(uniqueMap.values());

    const searchQuery = rawQuery.trim().toLowerCase();

    return allJobs.filter(job => {
      // Strict keyword / role matching
      if (searchQuery) {
        const terms = searchQuery.split(/\s+/).filter(Boolean);
        const corpus = `${job.title} ${job.company} ${job.skills.join(" ")} ${job.location} ${job.description}`.toLowerCase();
        
        // Every term must be present in title, company, skills, or description
        const matchesAllTerms = terms.every(term => corpus.includes(term));
        if (!matchesAllTerms) return false;
      }

      // Location filter (Strict check against selected major city)
      if (location !== "all") {
        const targetLoc = location.toLowerCase();
        const jobLoc = job.location.toLowerCase();
        if (targetLoc === "remote") {
          if (job.worklocationType !== "remote" && jobLoc !== "remote") return false;
        } else {
          if (!jobLoc.includes(targetLoc)) return false;
        }
      }

      // Platform Source filter (LinkedIn, Naukri, Internshala, Wellfound, Shine, Indeed)
      if (selectedSource !== "all" && job.source !== selectedSource) return false;

      // Workplace type filter
      if (worksiteType !== "all" && job.worklocationType !== worksiteType) return false;

      // Experience level filter
      if (experienceLevel !== "all" && job.experienceLevel !== experienceLevel) return false;

      // Company scale filter
      if (companySize !== "all" && job.companySize !== companySize) return false;

      // Industry filter
      if (industryFilter !== "all" && job.industry !== industryFilter) return false;

      // Max salary filter
      const salaryInt = parseInt(job.salary);
      if (salaryInt > maxSalarySelector) return false;

      return true;
    });
  }, [rawQuery, location, selectedSource, worksiteType, experienceLevel, companySize, industryFilter, maxSalarySelector]);

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "linkedin": return "bg-blue-950/40 text-blue-300 border-blue-800/60";
      case "naukri": return "bg-sky-950/40 text-sky-300 border-sky-800/60";
      case "internshala": return "bg-pink-950/40 text-pink-300 border-pink-800/60";
      case "wellfound": return "bg-purple-950/40 text-purple-300 border-purple-800/60";
      case "shine": return "bg-amber-950/40 text-amber-300 border-amber-800/60";
      case "indeed": return "bg-emerald-950/40 text-emerald-300 border-emerald-800/60";
      default: return "bg-indigo-950/40 text-indigo-300 border-indigo-800/60";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "linkedin": return "LinkedIn Jobs";
      case "naukri": return "Naukri.com";
      case "internshala": return "Internshala";
      case "wellfound": return "Wellfound";
      case "shine": return "Shine.com";
      case "indeed": return "Indeed";
      case "company": return "Official Careers";
      default: return source;
    }
  };

  const toggleSaveJob = (id: string) => {
    let nextSaved: string[];
    if (savedJobs.includes(id)) {
      nextSaved = savedJobs.filter(jId => jId !== id);
      toast.success("Job removed from saved list");
    } else {
      nextSaved = [...savedJobs, id];
      toast.success("Job saved to your bookmarks!");
    }
    setSavedJobs(nextSaved);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(nextSaved));
  };

  const handleMarkApplied = async (job: Job) => {
    if (appliedJobs.includes(job.id)) return;
    
    const listStr = localStorage.getItem(STORAGE_KEY);
    let apps = [];
    if (listStr) {
      try {
        apps = JSON.parse(listStr);
      } catch {
        apps = [];
      }
    }
    
    const appliedDateStr = new Date().toISOString().split("T")[0];
    const notesStr = `Applied for ${job.title} at ${job.company} via ${getSourceLabel(job.source)} (${formatIndianSalary(job.salary, job.jobType)})`;
    const newApp = {
      id: job.id,
      company: job.company,
      role: job.title,
      status: "applied",
      type: "off-campus",
      appliedDate: appliedDateStr,
      notes: notesStr
    };

    const updated = [newApp, ...apps];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAppliedJobs(prev => [...prev, job.id]);
    toast.success(`Sent "${job.title}" to your Kanban Application Tracker!`);

    // Sync to Supabase if configured
    if (isSupabaseConfigured) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const realUserId = authData?.user?.id || (user?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user.id) ? user.id : null);

        const { error: insertErr } = await supabase.from("job_applications").insert({
          user_id: realUserId,
          job_id: job.id,
          company: job.company,
          role: job.title,
          salary: formatIndianSalary(job.salary, job.jobType),
          location: job.location
        });

        if (insertErr) {
          console.error("Supabase insert error into job_applications:", insertErr);
          toast.error(`Supabase Error: ${insertErr.message}`);
        }

        const { error: trackedErr } = await supabase.from("tracked_applications").upsert({
          id: job.id,
          user_id: realUserId,
          company: job.company,
          role: job.title,
          status: "applied",
          type: "off-campus",
          applied_date: appliedDateStr,
          notes: notesStr
        });

        if (trackedErr) {
          console.error("Supabase upsert error into tracked_applications:", trackedErr);
        }
      } catch (err: any) {
        console.error("Failed to log job application to Supabase:", err);
      }
    }

  };

  const handleResetFilters = () => {
    setRawQuery("");
    setLocation("all");
    setSelectedSource("all");
    setWorksiteType("all");
    setExperienceLevel("all");
    setCompanySize("all");
    setIndustryFilter("all");
    setMaxSalarySelector(2000000);
    toast.success("Filters cleared!");
  };

  return (
    <div className="bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Search className="w-7 h-7 text-indigo-500" />
          <span>Real-Time Job Search</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 mt-1 max-w-xl">
          Search live job opportunities across major platforms: LinkedIn, Naukri, Internshala, Wellfound, Shine, and Indeed.
        </p>
      </div>

      {/* Main Search Bar & Major City Location Filter */}
      <div className="mb-8">
        <form 
          onSubmit={(e) => e.preventDefault()} 
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3"
        >
          <div className="flex-grow relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search in real-time by role or keyword (e.g. 'React', 'Frontend', 'Data Analyst', 'SDE-1', 'Python')..."
              value={rawQuery}
              onChange={(e) => setRawQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-850 dark:text-slate-100 outline-none transition-all"
            />
          </div>
          
          <div className="w-full md:w-56 relative">
            <MapPin className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 w-5 h-5 pointer-events-none" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-8 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none transition-all appearance-none cursor-pointer font-semibold"
            >
              <option value="all">All Major Cities</option>
              {INDIAN_CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {(rawQuery || location !== "all" || selectedSource !== "all" || worksiteType !== "all" || experienceLevel !== "all") && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all flex items-center justify-center gap-1 text-xs font-semibold"
              title="Clear Search & Filters"
            >
              <X className="w-4 h-4" />
              <span>Clear</span>
            </button>
          )}
        </form>
      </div>

      {/* Main Grid: Sidebar Filters + Uniform Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Filters */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl h-fit space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>Filter Options</span>
            </h3>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-indigo-500 hover:text-indigo-600 font-semibold cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Job Platform Source */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Job Platform</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              {APPLICATION_SOURCES.map(src => (
                <option key={src.value} value={src.value}>{src.label}</option>
              ))}
            </select>
          </div>

          {/* Workplace Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Workplace Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {["all", "remote", "hybrid", "on-site"].map(ws => (
                <button
                  key={ws}
                  onClick={() => setWorksiteType(ws)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all text-center cursor-pointer ${
                    worksiteType === ws
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {ws === "all" ? "Any" : ws}
                </button>
              ))}
            </div>
          </div>

          {/* Career Bracket */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Career Level</label>
            <div className="space-y-1.5">
              {["all", "internship", "fresher", "experienced"].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setExperienceLevel(lvl)}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all flex items-center justify-between cursor-pointer ${
                    experienceLevel === lvl
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-extrabold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span>{lvl === "all" ? "All Levels" : lvl}</span>
                  {experienceLevel === lvl && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                </button>
              ))}
            </div>
          </div>

          {/* Industry Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Industry</label>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="all">All Industries</option>
              <option value="SaaS">SaaS & Products</option>
              <option value="FinTech">FinTech</option>
              <option value="EdTech">EdTech</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Services">Services</option>
              <option value="AI / DeepTech">AI / DeepTech</option>
            </select>
          </div>

          {/* Max Salary */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Max Salary</label>
              <span className="text-[10px] font-mono text-indigo-500 font-extrabold">
                {maxSalarySelector >= 2000000 ? "No Limit" : `${maxSalarySelector / 100000} LPA`}
              </span>
            </div>
            <input
              type="range"
              min="200000"
              max="2000000"
              step="100000"
              value={maxSalarySelector}
              onChange={(e) => setMaxSalarySelector(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        {/* Job Listings Column */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Real-time search header count indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
              {filteredJobs.length} real-time posting{filteredJobs.length === 1 ? "" : "s"} {rawQuery ? `for "${rawQuery}"` : ""} {location !== "all" ? `in ${location}` : ""}
            </h4>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-16 px-6 rounded-3xl shadow-sm">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No jobs found</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                {rawQuery ? `No active openings matched "${rawQuery}" in ${location === "all" ? "India" : location}. Try searching for terms like "React", "Python", "Data Analyst", "SDE-1", or "Fullstack".` : "Try clearing or relaxing your filter constraints."}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredJobs.map((job) => {
                  const isSaved = savedJobs.includes(job.id);
                  const isApplied = appliedJobs.includes(job.id);
                  
                  return (
                    <motion.div
                      layoutId={job.id}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      key={job.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 p-5 sm:p-6 rounded-3xl shadow-sm transition-all flex flex-col justify-between group"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-400 transition-colors">
                              {job.title}
                            </h3>

                            {/* Source Platform Badge */}
                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${getSourceBadgeStyle(job.source)}`}>
                              {getSourceLabel(job.source)}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 font-semibold">
                            <span className="flex items-center space-x-1.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-800 dark:text-slate-200">{job.company}</span>
                            </span>
                            <span className="flex items-center space-x-1.5">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-bold text-indigo-400">{job.location}</span>
                              <span className="bg-slate-100 dark:bg-slate-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-slate-500 ml-1.5">
                                {job.worklocationType}
                              </span>
                            </span>
                            <span className="text-indigo-500 font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded text-[11px]">
                              {formatIndianSalary(job.salary, job.jobType)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Job Description & Required Skills */}
                      <div className="py-4 space-y-3">
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5">
                          {job.skills.map(skill => (
                            <span 
                              key={skill} 
                              className="text-[10px] sm:text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b0f19] text-slate-600 dark:text-slate-300 font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-500">
                        <div className="flex items-center space-x-3">
                          <span className="text-slate-400 font-medium">{job.posted_date}</span>
                          <span>•</span>
                          <span className="uppercase font-mono text-[10px]">{job.industry}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* Save Bookmark */}
                          <button
                            type="button"
                            onClick={() => toggleSaveJob(job.id)}
                            className={`p-2 border rounded-xl transition-all cursor-pointer ${
                              isSaved
                                ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500 border-rose-200 dark:border-rose-900/30"
                                : "border-slate-200 dark:border-slate-800 text-slate-400 hover:text-rose-500"
                            }`}
                            title={isSaved ? "Remove Bookmark" : "Save Bookmark"}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500" : ""}`} />
                          </button>

                          {/* Mark Applied / Applied Status */}
                          {isApplied ? (
                            <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1 font-bold">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>Applied</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMarkApplied(job)}
                              className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                            >
                              Mark Applied
                            </button>
                          )}

                          {/* Direct External Apply Link */}
                          <a
                            href={job.apply_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => handleMarkApplied(job)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                          >
                            <span>Apply on {getSourceLabel(job.source).split(" ")[0]}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
