import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, MapPin, Building2, ExternalLink, Heart, CheckCircle2, 
  Sliders, RefreshCw, Send, Check, AlertCircle, Sparkles, TrendingUp, 
  BarChart2, Award, ArrowUpRight, Code2, AlertTriangle, FileCheck, X,
  Shield, Network, Loader2, Play, CheckCircle
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from "recharts";
import { INDIAN_CITIES } from "../utils/constants";
import { formatIndianSalary } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";
import { 
  ENRICHED_JOBS, Job, parseNLPQuery, computeATSScore, 
  getAIResumeBoosterAdvice, getTypoTolerantQuery, AUTOCOMPLETE_SUGGESTIONS, getRecommendedJobs,
  SYNONYM_MAP
} from "../utils/searchEngine";

export default function JobSearch() {
  const { user } = useAuth();
  const userEmail = user?.email || "guest";
  const STORAGE_KEY = `jobgenie_tracked_applications_${userEmail}`;
  const SAVED_JOBS_KEY = `jobgenie_saved_jobs_${userEmail}`;
  const RECENT_SEARCHES_KEY = `jobgenie_recent_searches_${userEmail}`;

  // Tab navigation: Explore Jobs, Recommendations, Salary Analytics, and Crawler Diagnostic panel
  const [activeTab, setActiveTab] = useState<"explore" | "recommendations" | "analytics" | "crawlers">("explore");

  // Search input & recommendation filters
  const [rawQuery, setRawQuery] = useState("");
  const [location, setLocation] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Advanced filters state
  const [worksiteType, setWorksiteType] = useState<string>("all");             // all, remote, hybrid, on-site
  const [experienceLevel, setExperienceLevel] = useState<string>("all");       // all, fresher, internship, experienced
  const [companySize, setCompanySize] = useState<string>("all");               // all, startup, mid-market, enterprise
  const [industryFilter, setIndustryFilter] = useState<string>("all");         // all, SaaS, FinTech, EdTech, E-commerce, Services, AI / DeepTech
  const [postedDaysRange, setPostedDaysRange] = useState<string>("all");       // all, 1, 3, 7 days
  const [maxSalarySelector, setMaxSalarySelector] = useState<number>(2000000); // INR slider up to 20LPA

  // Autocomplete dropdown and spell correction suggestion flags
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedCorrection, setSuggestedCorrection] = useState<string | null>(null);

  // Crawler Diagnostic panel telemetry states
  const [crawlerProgress, setCrawlerProgress] = useState(100);
  const [isCrawlerScraping, setIsCrawlerScraping] = useState(false);
  const [scannedListingCount, setScannedListingCount] = useState(14821);
  const [dupRemovedCount, setDupRemovedCount] = useState(3142);
  const [activeProxiesCount, setActiveProxiesCount] = useState(80);
  const [crawlerLogs, setCrawlerLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] All crawlers online. Shared index sync verified.`,
    `[${new Date().toLocaleTimeString()}] [PROXY] Activated residential proxy pool. Pool status: 80 active nodes in Bengaluru, Pune, Delhi NCR clusters.`,
    `[${new Date().toLocaleTimeString()}] [Naukri] Query pipelines resolved. 35 live postings currently indexed.`
  ]);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  // Recommendations state
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Saved jobs state
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

  // Selected job for Resume Booster popup
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  // User Skills fallback
  const userSkills = useMemo(() => {
    return user?.profile?.skills && user.profile.skills.length > 0 
      ? user.profile.skills 
      : ["React", "TypeScript", "Node.js", "JavaScript"];
  }, [user]);

  // Alert system for high-profile matches
  const [matchedAlertCount, setMatchedAlertCount] = useState(0);

  useEffect(() => {
    const highMatchCount = ENRICHED_JOBS.filter(job => {
      const scoreReport = computeATSScore(job, userSkills);
      return scoreReport.score >= 80;
    }).length;
    setMatchedAlertCount(highMatchCount);
  }, [userSkills]);

  // Handle Typo checking
  useEffect(() => {
    if (rawQuery.trim().length > 2) {
      const corrected = getTypoTolerantQuery(rawQuery);
      if (corrected.toLowerCase() !== rawQuery.toLowerCase()) {
        setSuggestedCorrection(corrected);
      } else {
        setSuggestedCorrection(null);
      }
    } else {
      setSuggestedCorrection(null);
    }
  }, [rawQuery]);

  // Scroll terminal logs container to the bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [crawlerLogs]);

  // Save Heart action
  const toggleSaveJob = (id: string) => {
    let nextSaved: string[];
    if (savedJobs.includes(id)) {
      nextSaved = savedJobs.filter(jId => jId !== id);
      toast.success("Job removed from saved list");
    } else {
      nextSaved = [...savedJobs, id];
      toast.success("Job saved! Influencing your recommended matches.");
    }
    setSavedJobs(nextSaved);
    localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(nextSaved));
  };

  const handleApplyCorrection = () => {
    if (suggestedCorrection) {
      setRawQuery(suggestedCorrection);
      setSuggestedCorrection(null);
      toast.info(`Adjusted search to correction: "${suggestedCorrection}"`);
    }
  };

  // Add search entry
  const recordSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim().toLowerCase();
    const updated = [cleanTerm, ...recentSearches.filter(t => t !== cleanTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // NLP parameters query extractor
  const nlpDetails = useMemo(() => {
    return parseNLPQuery(rawQuery);
  }, [rawQuery]);

  // Search Submission trigger with beautiful mock latency
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordSearchTerm(rawQuery);
    setIsScraping(true);
    setTimeout(() => {
      setIsScraping(false);
      toast.success("NLP search and synonym expansion complete!");
    }, 600);
  };

  const handleMarkApplied = (job: Job) => {
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
    
    const newApp = {
      id: job.id,
      company: job.company,
      role: job.title,
      status: "applied",
      type: "off-campus",
      appliedDate: new Date().toISOString().split("T")[0],
      notes: `Applied from Sandbox explorer (Source: ${job.source}). Annual/Stipend: ${formatIndianSalary(job.salary, job.jobType)}`
    };

    const updated = [newApp, ...apps];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setAppliedJobs(prev => [...prev, job.id]);
    toast.success(`Sent "${job.title}" to My Applications list!`);
  };

  const handleResetFilters = () => {
    setRawQuery("");
    setLocation("all");
    setSelectedSource("all");
    setSelectedType("all");
    setWorksiteType("all");
    setExperienceLevel("all");
    setCompanySize("all");
    setIndustryFilter("all");
    setPostedDaysRange("all");
    setMaxSalarySelector(2000000);
    setSuggestedCorrection(null);
    toast.success("All filtering constraints cleared!");
  };

  // ----------------------------------------------------------------------------
  // ADVANCED INTELLIGENT FILTERING + AUTOMATIC SYNONYM EXPANSION + FALLBACK ENGINE
  // ----------------------------------------------------------------------------
  const { jobs: filteredJobs, isFallbackMatched } = useMemo(() => {
    // 1. Remove duplicate postings automatically
    const uniqueMap = new Map<string, Job>();
    for (const job of ENRICHED_JOBS) {
      const uniqueKey = `${job.company.toLowerCase()}_${job.title.toLowerCase()}`;
      if (job.postedDaysAgo <= 30) {
        if (!uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, job);
        } else {
          // If duplicates exist, keep the one with higher view metrics
          const existing = uniqueMap.get(uniqueKey)!;
          if (job.views > existing.views) {
            uniqueMap.set(uniqueKey, job);
          }
        }
      }
    }
    
    let list = Array.from(uniqueMap.values());

    // 2. Perform main search pass
    let passedList = list.filter(job => {
      // NLP overrides matching
      if (nlpDetails.extractedLocation) {
        const queryLoc = nlpDetails.extractedLocation.toLowerCase();
        const jobLoc = job.location.toLowerCase();
        if (queryLoc === "remote" && job.worklocationType !== "remote") return false;
        if (queryLoc !== "remote" && !jobLoc.includes(queryLoc)) return false;
      }

      if (nlpDetails.extractedWorksite && job.worklocationType !== nlpDetails.extractedWorksite) {
        return false;
      }

      if (nlpDetails.extractedJobType && job.jobType !== nlpDetails.extractedJobType) {
        return false;
      }

      if (nlpDetails.extractedExperience && job.experienceLevel !== nlpDetails.extractedExperience) {
        return false;
      }

      if (nlpDetails.extractedCompany && !job.company.toLowerCase().includes(nlpDetails.extractedCompany.toLowerCase())) {
        return false;
      }

      // Explicit Filters constraints
      if (location !== "all") {
        const targetLoc = location.toLowerCase();
        const jobLoc = job.location.toLowerCase();
        if (targetLoc === "remote" && job.worklocationType !== "remote") return false;
        if (targetLoc !== "remote" && !jobLoc.includes(targetLoc)) return false;
      }

      if (selectedSource !== "all" && job.source !== selectedSource) {
        return false;
      }

      if (selectedType !== "all" && job.jobType !== selectedType) {
        return false;
      }

      if (worksiteType !== "all" && job.worklocationType !== worksiteType) {
        return false;
      }

      if (experienceLevel !== "all" && job.experienceLevel !== experienceLevel) {
        return false;
      }

      if (companySize !== "all" && job.companySize !== companySize) {
        return false;
      }

      if (industryFilter !== "all" && job.industry !== industryFilter) {
        return false;
      }

      if (postedDaysRange !== "all") {
        const days = parseInt(postedDaysRange);
        if (job.postedDaysAgo > days) return false;
      }

      const salaryInt = parseInt(job.salary);
      if (salaryInt > maxSalarySelector) {
        return false;
      }

      // Search Query evaluation with synonyms mapping and parsing skills from description separately
      if (rawQuery.trim()) {
        const fillerSet = new Set(["in", "on", "at", "for", "with", "and", "or", "to", "of", "a", "an", "the", "job", "jobs", "vacancy", "vacancies", "position", "positions", "role", "roles", "hiring", "need", "chahiye", "search", "required", "wanted", "please", "me", "show", "find", "get", "milega", "batao"]);
        let terms = rawQuery.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0 && !fillerSet.has(t));
        if (terms.length === 0) {
          terms = rawQuery.toLowerCase().trim().split(/\s+/).filter(t => t.length > 0);
        }
        // Build thorough corpus: title, company, description, skills collection, location
        const searchCorpus = `${job.title} ${job.company} ${job.description} ${job.skills.join(" ")} ${job.location}`.toLowerCase();
        
        const hasMatch = terms.every(term => {
          if (searchCorpus.includes(term)) return true;
          
          // Check Synonym mappings for expanded terms
          for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
            if (term.includes(key) || key.includes(term)) {
              if (synonyms.some(syn => searchCorpus.includes(syn.toLowerCase()))) {
                return true;
              }
            }
          }
          return false;
        });

        if (!hasMatch) return false;
      }

      return true;
    });

    // 3. Fallback Engine Check: If no results exist, expand to relevant alternatives automatically
    // Satisfies: "Always return a minimum set of relevant results if possible" and "Never show only exact matches"
    let fallbackMatched = false;
    let evaluatedList: any[] = [];

    if (passedList.length === 0 && rawQuery.trim()) {
      fallbackMatched = true;
      // Gather top 4 highest scoring general jobs matched to profile skills or adjacent parameters
      evaluatedList = Array.from(uniqueMap.values())
        .map(job => {
          // Calculate score based on synonym skill-overlap
          const report = computeATSScore(job, userSkills, {
            targetRoles: user?.profile?.target_roles,
            targetLocations: user?.profile?.target_locations,
            preferredJobType: user?.profile?.preferred_job_type
          });
          return {
            ...job,
            matchScore: report.score,
            matchReport: report
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 4); // return top 4 similar listings
    } else {
      // Map score parameters to normal outputs
      evaluatedList = passedList.map(job => {
        const report = computeATSScore(job, userSkills, {
          targetRoles: user?.profile?.target_roles,
          targetLocations: user?.profile?.target_locations,
          preferredJobType: user?.profile?.preferred_job_type
        });
        return {
          ...job,
          matchScore: report.score,
          matchReport: report
        };
      });
    }

    // Sort ranked jobs - Verified status gets slight boost, then score descending
    const sortedJobs = evaluatedList.sort((a, b) => {
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;
      return b.matchScore - a.matchScore;
    });

    return {
      jobs: sortedJobs,
      isFallbackMatched: fallbackMatched
    };
  }, [rawQuery, location, selectedSource, selectedType, worksiteType, experienceLevel, companySize, industryFilter, postedDaysRange, maxSalarySelector, userSkills, nlpDetails, user]);

  // Rec recommended matches feed
  const recommendedJobsList = useMemo(() => {
    const rawRecs = getRecommendedJobs(ENRICHED_JOBS, userSkills, savedJobs, recentSearches);
    return rawRecs.map(job => {
      const report = computeATSScore(job, userSkills, {
        targetRoles: user?.profile?.target_roles,
        targetLocations: user?.profile?.target_locations,
        preferredJobType: user?.profile?.preferred_job_type
      });
      return {
        ...job,
        matchScore: report.score,
        matchReport: report
      };
    });
  }, [userSkills, savedJobs, recentSearches, user]);

  // Market demand metrics
  const analyticsData = useMemo(() => {
    const skillCounts: Record<string, number> = {};
    let totalJobs = 0;
    
    filteredJobs.forEach(j => {
      totalJobs++;
      j.skills.forEach(s => {
        skillCounts[s] = (skillCounts[s] || 0) + 1;
      });
    });

    const frequencyChart = Object.entries(skillCounts)
      .map(([name, count]) => ({
        name,
        Percentage: totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0,
        Jobs: count
      }))
      .sort((a, b) => b.Jobs - a.Jobs)
      .slice(0, 6);

    const industrySalaries: Record<string, number[]> = {};
    filteredJobs.forEach(j => {
      const sal = parseInt(j.salary);
      const annualEquivalent = j.jobType === "internship" ? sal * 12 : sal;
      if (!industrySalaries[j.industry]) {
        industrySalaries[j.industry] = [];
      }
      industrySalaries[j.industry].push(annualEquivalent);
    });

    const averageSalaryChart = Object.entries(industrySalaries).map(([ind, list]) => {
      const total = list.reduce((sum, curr) => sum + curr, 0);
      const avgLpa = (total / list.length) / 100000;
      return {
        industry: ind,
        "Avg Salary (LPA)": parseFloat(avgLpa.toFixed(1))
      };
    });

    return {
      skillDemand: frequencyChart,
      industrySalaries: averageSalaryChart,
      totalCount: totalJobs
    };
  }, [filteredJobs]);

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case "internshala": return "bg-pink-100/30 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-850";
      case "naukri": return "bg-amber-100/30 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-850";
      case "indeed": return "bg-sky-100/30 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-850";
      case "linkedin": return "bg-indigo-100/30 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-850";
      case "shine": return "bg-rose-100/30 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-850";
      case "foundit": return "bg-purple-100/35 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-850";
      case "glassdoor": return "bg-emerald-100/30 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850";
      case "company": return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
      case "startup_portal": return "bg-orange-100/30 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-850";
      case "remote_board": return "bg-teal-100/30 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-850";
      case "hiring_site": return "bg-cyan-100/30 dark:bg-cyan-900/30 text-cyan-755 dark:text-cyan-300 border-cyan-200 dark:border-cyan-850";
      default: return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "naukri": return "Naukri.com";
      case "linkedin": return "LinkedIn";
      case "internshala": return "Internshala";
      case "shine": return "Shine.com";
      case "foundit": return "Foundit";
      case "indeed": return "Indeed";
      case "glassdoor": return "Glassdoor";
      case "company": return "Company Careers";
      case "startup_portal": return "Startup Portal";
      case "remote_board": return "Remote Board";
      case "hiring_site": return "Hiring Web";
      default: return source;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-850/30";
    if (score >= 65) return "text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850/30";
    return "text-slate-500 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800";
  };

  // ----------------------------------------------------------------------------
  // SIMULATE DISTRIBUTED CRAWLER & INDEX SYNCHRONIZATION RUN
  // ----------------------------------------------------------------------------
  const startScraperRun = () => {
    if (isCrawlerScraping) return;
    setIsCrawlerScraping(true);
    setCrawlerProgress(0);
    setCrawlerLogs([
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Spawned high-velocity scraper master thread.`,
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Requesting concurrency pools on 11 distinct target portals...`
    ]);

    const runSteps = [
      {
        progress: 15,
        log: `[${new Date().toLocaleTimeString()}] [PROXY] Recycled residential proxy pool. Selected Mumbai IP: 103.4.155.82 for Naukri parser bypass.`
      },
      {
        progress: 30,
        log: `[${new Date().toLocaleTimeString()}] [Naukri.com] Accessing DOM structure. Loaded dynamic content block (7500px scroll height reached via smooth-scroll scrollEvents). Extracted 12 live SDE roles.`
      },
      {
        progress: 45,
        log: `[${new Date().toLocaleTimeString()}] [LinkedIn] Anti-bot 429 trigger encountered. Rotating instantly to secondary residential fallback (Pune block 112.44.15.22). Exp-backoff retry: SUCCESS.`
      },
      {
        progress: 60,
        log: `[${new Date().toLocaleTimeString()}] [Internshala] Downloading internships. Normalizing INR stipends metrics. 12 fresh listings found.`
      },
      {
        progress: 75,
        log: `[${new Date().toLocaleTimeString()}] [Parser] Parsing description vectors. Extracted 427 key-skills patterns (Zustand, Next.js, FastAPI).`
      },
      {
        progress: 90,
        log: `[${new Date().toLocaleTimeString()}] [Deduplicator] Cross-checking postings. Purged 8 overlapping duplicate listings from Shine and Foundit indexes to maintain high-quality data.`
      },
      {
        progress: 100,
        log: `[${new Date().toLocaleTimeString()}] [SYSTEM] Index sync finished. Persisted 35 high-fidelity listings inside local search schema. Total database scan pool updated.`
      }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < runSteps.length) {
        const step = runSteps[currentStep];
        setCrawlerProgress(step.progress);
        setCrawlerLogs(prev => [...prev, step.log]);
        
        if (step.progress === 100) {
          setIsCrawlerScraping(false);
          setScannedListingCount(prev => prev + 14);
          setDupRemovedCount(prev => prev + 8);
          clearInterval(interval);
          toast.success("Distributed crawler crawl complete! Synced 35 live positions.");
        }
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 600);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-200 flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full transition-colors duration-300">
      
      {/* ⚠️ Interactive Matches Alert Banner */}
      {matchedAlertCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-150 dark:border-indigo-850/40 rounded-2xl flex items-center justify-between"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-950 dark:text-white">Profile Alert Matches Online</p>
              <p className="text-[10px] sm:text-xs text-slate-550 dark:text-slate-400 font-medium">
                Our scan matched <span className="text-indigo-650 dark:text-indigo-350 font-bold">{matchedAlertCount} high-matching SDE roles</span> based on your CV profile skills!
              </p>
            </div>
          </div>
          <button 
            onClick={() => { setActiveTab("recommendations"); toast.info("Showing custom recommendation engine matches!"); }}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer whitespace-nowrap"
          >
            <span>View Matches</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Header Block with sandbox metrics info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Code2 className="w-7 h-7 text-indigo-550 dark:text-indigo-450" />
            <span>SandBox Job Search</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-550 dark:text-slate-400 mt-1 max-w-xl">
            Find and apply to matching software, tech, and data roles across India. Integrated synonym search, smart filters, and real-time updates.
          </p>
        </div>

        {/* Tab Selection Navigation simplified */}
        <div className="flex bg-slate-200/60 dark:bg-slate-900/60 p-1 rounded-xl w-fit border border-slate-300/40 dark:border-slate-800/40 flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("explore")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === "explore" 
                ? "bg-white dark:bg-slate-800 text-indigo-605 dark:text-white shadow-sm"
                : "text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Explore Jobs</span>
          </button>
          <button
            onClick={() => setActiveTab("recommendations")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === "recommendations" 
                ? "bg-white dark:bg-slate-800 text-indigo-605 dark:text-white shadow-sm"
                : "text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Matching Jobs</span>
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === "analytics" 
                ? "bg-white dark:bg-slate-800 text-indigo-605 dark:text-white shadow-sm"
                : "text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Salary Trends</span>
          </button>
        </div>
      </div>

      {activeTab === "explore" && (
        <>
          {/* Main Search Panel Bar */}
          <div className="relative z-20 mb-6">
            <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
              <div className="flex-grow relative">
                <Search className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Try: 'remote python jobs for freshers' or 'stipend node jobs in Bangalore'..."
                  value={rawQuery}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => setRawQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-850 dark:text-slate-100 outline-none transition-all"
                />
                
                {/* Autocomplete Dropdown Panel */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto p-2">
                    <div className="flex items-center justify-between px-2 pb-1.5 border-b border-slate-100 dark:border-slate-850">
                      <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 font-mono tracking-wider">Indexed Search Suggestions</span>
                      <button 
                        type="button" 
                        onClick={() => setShowSuggestions(false)}
                        className="text-[10px] text-indigo-500 hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-2">
                      {AUTOCOMPLETE_SUGGESTIONS.map(term => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setRawQuery(term);
                            setShowSuggestions(false);
                            recordSearchTerm(term);
                          }}
                          className="text-left px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg text-xs font-medium text-slate-705 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        >
                          🔍 {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="w-full md:w-56 relative">
                <MapPin className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500 w-5 h-5 pointer-events-none" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-11 pr-8 py-3 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Everywhere in India</option>
                  <option value="Remote">Remote Roles Only</option>
                  {INDIAN_CITIES.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                  <option value="Jaipur">Jaipur (Tier-2)</option>
                  <option value="Coimbatore">Coimbatore (Tier-2)</option>
                  <option value="Lucknow">Lucknow (Tier-2)</option>
                  <option value="Indore">Indore (Tier-2)</option>
                  <option value="Kochi">Kochi (Tier-2)</option>
                  <option value="Bhubaneswar">Bhubaneswar (Tier-2)</option>
                  <option value="Nagpur">Nagpur (Tier-3)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="w-full md:w-32 bg-indigo-600 hover:bg-indigo-505 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </button>
                { (rawQuery || location!=="all" || selectedSource!=="all" || selectedType!=="all") && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="p-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl transition-all"
                    title="Clear All Constraint Matches"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>

            {/* Smart Search Filter Highlights Banner */}
            {rawQuery.trim().length > 0 && (
              <div className="mt-2.5 px-3 py-2 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-850/40 rounded-xl flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center space-x-2 text-xs text-indigo-755 dark:text-indigo-400 font-semibold font-sans">
                  <Sparkles className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span>Detected filters:</span>
                  <div className="flex flex-wrap gap-1.5 ml-1 select-none pointer-events-none">
                    {nlpDetails.extractedSkills.map(s => (
                      <span key={s} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded text-[10px]">🛠️ {s}</span>
                    ))}
                    {nlpDetails.extractedLocation && (
                      <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-1.5 py-0.5 rounded text-[10px]">📍 {nlpDetails.extractedLocation}</span>
                    )}
                    {nlpDetails.extractedWorksite && (
                      <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded text-[10px]">💻 {nlpDetails.extractedWorksite}</span>
                    )}
                    {nlpDetails.extractedExperience && (
                      <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px]">🎓 {nlpDetails.extractedExperience}</span>
                    )}
                    {nlpDetails.maxSalaryLimit && (
                      <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px]">💰 Under {nlpDetails.maxSalaryLimit >= 100000 ? `${nlpDetails.maxSalaryLimit / 100000}LPA` : `${nlpDetails.maxSalaryLimit / 1000}k`}</span>
                    )}
                    {nlpDetails.hasHindiChahiyeIntent && (
                      <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded text-[10px]">🗣️ Hindi preference</span>
                    )}
                  </div>
                </div>
                <span className="text-[9px] text-indigo-450 dark:text-indigo-405 font-medium tracking-wide hidden sm:inline uppercase">Smart Synonym Search Active</span>
              </div>
            )}

            {/* Spelling Correction Banner */}
            {suggestedCorrection && (
              <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/25 border border-amber-200/45 dark:border-amber-900/40 text-amber-800 dark:text-amber-350 p-2.5 rounded-xl flex items-center justify-between transition-all">
                <span>
                  Did you mean: <strong className="italic underline cursor-pointer hover:text-indigo-500" onClick={handleApplyCorrection}>"{suggestedCorrection}"</strong>? We detected a minor spelling variation.
                </span>
                <button 
                  onClick={handleApplyCorrection}
                  className="px-2 py-1 bg-amber-600 text-white rounded font-bold text-[10px]"
                >
                  Apply
                </button>
              </div>
            )}
          </div>

          {/* Unified Scanner Source count indicator */}
          <div className="mb-6 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-550 dark:text-slate-400">
            <div className="flex items-center space-x-2 font-semibold">
              <Network className="w-4 h-4 text-emerald-500 animate-pulse pointer-events-none" />
              <span>Job postings aggregated from:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["naukri", "linkedin", "internshala", "shine", "foundit", "indeed", "glassdoor", "company", "startup_portal", "remote_board", "hiring_site"].map(src => (
                <span key={src} className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSourceBadgeColor(src)}`}>
                  {src.replace("_", " ")}
                </span>
              ))}
            </div>
          </div>

          {/* Fallback matched system warning */}
          {isFallbackMatched && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4.5 bg-amber-50/70 dark:bg-amber-950/15 border border-amber-200 dark:border-amber-800/35 rounded-2xl flex items-start space-x-3.5 text-xs text-amber-800 dark:text-amber-350"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">No exact matches found for your active filters</p>
                <p className="mt-1 leading-relaxed">
                  We've automatically relaxed your search filters to show similar software engineering and adjacent positions that align well with your skillset.
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar rails */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-5 rounded-3xl h-fit space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2 animate-pulse">
                  <Sliders className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  <span>Configure Filters</span>
                </h3>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-indigo-500 dark:text-indigo-405 hover:text-indigo-650 dark:hover:text-indigo-305 font-semibold cursor-pointer"
                >
                  Reset All
                </button>
              </div>

              {/* Source select dropdown inside sidebar */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Unified Platform Source</label>
                <select
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-750 dark:text-slate-300 outline-none"
                >
                  <option value="all">All 11 Channels (Unified)</option>
                  <option value="naukri">Naukri.com</option>
                  <option value="linkedin">LinkedIn Jobs</option>
                  <option value="internshala">Internshala</option>
                  <option value="shine">Shine.com</option>
                  <option value="foundit">Foundit</option>
                  <option value="indeed">Indeed</option>
                  <option value="glassdoor">Glassdoor</option>
                  <option value="company">Company Careers</option>
                  <option value="startup_portal">Startup Portals</option>
                  <option value="remote_board">Remote Job Boards</option>
                  <option value="hiring_site">Startup Hiring Sites</option>
                </select>
              </div>

              {/* Work-site Setup */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Workplace Type</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {["all", "remote", "hybrid", "on-site"].map(ws => (
                    <button
                      key={ws}
                      onClick={() => setWorksiteType(ws)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all text-center cursor-pointer ${
                        worksiteType === ws
                          ? "bg-indigo-650/10 border-indigo-500 text-indigo-605 dark:text-indigo-400 font-extrabold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-550 dark:text-slate-400"
                      }`}
                    >
                      {ws === "all" ? "Any workplace" : ws}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Brackets */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Career Bracket</label>
                <div className="space-y-1.5">
                  {["all", "internship", "fresher", "experienced"].map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setExperienceLevel(lvl)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all flex items-center justify-between cursor-pointer ${
                        experienceLevel === lvl
                          ? "bg-indigo-650/10 border-indigo-500 text-indigo-605 dark:text-indigo-400 font-extrabold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-655 dark:text-slate-400"
                      }`}
                    >
                      <span>{lvl === "all" ? "All Career Levels" : lvl}</span>
                      {experienceLevel === lvl && <Check className="w-3.5 h-3.5 text-indigo-550 dark:text-indigo-405" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Scale values */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Company Scale</label>
                <div className="space-y-1.5">
                  {[
                    { value: "all", label: "All Scale Companies" },
                    { value: "startup", label: "Scaleups & Startups" },
                    { value: "mid-market", label: "Product Mid-Market" },
                    { value: "enterprise", label: "MAANG & Conglomerate" }
                  ].map(scale => (
                    <button
                      key={scale.value}
                      onClick={() => setCompanySize(scale.value)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-between cursor-pointer ${
                        companySize === scale.value
                          ? "bg-indigo-650/10 border-indigo-500 text-indigo-605 dark:text-indigo-400 font-extrabold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span>{scale.label}</span>
                      {companySize === scale.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry filters */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Primary Industry</label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-95 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-750 dark:text-slate-300 outline-none"
                >
                  <option value="all">All Industries</option>
                  <option value="SaaS">SaaS & Products</option>
                  <option value="FinTech">FinTech & Brokerages</option>
                  <option value="EdTech">EdTech & Training</option>
                  <option value="E-commerce">E-commerce Delivery</option>
                  <option value="Services">Services & Advisory</option>
                  <option value="AI / DeepTech">AI & Web3 Robotics</option>
                </select>
              </div>

              {/* Salary bracket */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">Max Desired Salary</label>
                  <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-extrabold">{maxSalarySelector >= 2000000 ? "No Limit" : `${maxSalarySelector / 100000} LPA`}</span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="2000000"
                  step="100000"
                  value={maxSalarySelector}
                  onChange={(e) => setMaxSalarySelector(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Recency posting filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400 mb-2">Recency Days</label>
                <select
                  value={postedDaysRange}
                  onChange={(e) => setPostedDaysRange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-755 dark:text-slate-300 outline-none"
                >
                  <option value="all">Anytime Postings</option>
                  <option value="0">Added Today</option>
                  <option value="1">Yesterday & Newer</option>
                  <option value="3">Within Past 3 Days</option>
                  <option value="7">Within Past Week</option>
                </select>
              </div>
            </div>

            {/* Core Job Lists */}
            <div className="lg:col-span-3 space-y-4">
              
              <div className="flex items-center justify-between pb-2 border-b border-indigo-150/10 dark:border-slate-800/10">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-405 uppercase tracking-widest font-mono">
                  {filteredJobs.length} normalized listing{filteredJobs.length === 1 ? "" : "s"} weighted by ATS score
                </h4>
                
                <span className="text-[10px] text-indigo-605 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 leading-none select-none">
                  <span className="w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"></span>
                  Synonym Match Active
                </span>
              </div>

              {isScraping ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(ind => (
                    <div key={ind} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-44 rounded-3xl animate-pulse p-6" />
                  ))}
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-16 px-6 rounded-3xl shadow-sm">
                  <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/35 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Empty results index</h3>
                  <p className="text-slate-550 dark:text-slate-400 text-xs mt-1.5 max-w-sm mx-auto">
                    Try wiping search queries or choosing fewer advanced filters to yield wider results.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Reset Query Constraints
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
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500/35 p-5 sm:p-6 rounded-3xl shadow-sm dark:shadow-none transition-all flex flex-col justify-between group relative"
                        >
                          {/* Top Verified badge */}
                          {job.verified && (
                            <span className="absolute top-0 right-1/4 -translate-y-1/2 bg-indigo-650 dark:bg-indigo-550 text-white text-[9px] font-mono font-bold tracking-widest px-3 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-md">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Verified Recipient Direct URL</span>
                            </span>
                          )}

                          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-605 dark:group-hover:text-indigo-400 transition-colors">
                                  {job.title}
                                </h3>
                                {job.views > 900 && (
                                  <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-150 dark:border-amber-900/10 text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded flex items-center gap-1">
                                    🔥 Hot Placement
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-550 dark:text-slate-400 font-semibold">
                                <span className="flex items-center space-x-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{job.company}</span>
                                </span>
                                <span className="flex items-center space-x-1.5">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{job.location}</span>
                                  <span className="bg-slate-100 dark:bg-slate-800 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold text-slate-500 ml-1.5">{job.worklocationType}</span>
                                </span>
                                <span className="text-indigo-650 dark:text-indigo-405 bg-indigo-50/40 dark:bg-indigo-950/20 px-2 py-0.5 rounded-md text-[10px] sm:text-xs border border-indigo-100/40 dark:border-indigo-850/10">
                                  {formatIndianSalary(job.salary, job.jobType)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                              <span className={`px-2.5 py-1 text-xs font-bold rounded-xl border flex items-center gap-1.5 shadow-sm ${getScoreColor(job.matchScore)}`}>
                                <Award className="w-3.5 h-3.5" />
                                <span>{job.matchScore}% Score</span>
                              </span>
                            </div>
                          </div>

                          {/* Skills display */}
                          <div className="py-4 space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-400 font-mono">Skill alignment status</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {job.matchReport.matchedSkills.length} of {job.skills.length} skills matched
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {job.skills.map(skill => {
                                const hasSkill = job.matchReport.matchedSkills.includes(skill);
                                return (
                                  <span 
                                    key={skill} 
                                    className={`text-[10px] sm:text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 ${
                                      hasSkill 
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-150 dark:border-emerald-950/10" 
                                        : "bg-slate-50 dark:bg-[#0b0f19] text-slate-550 dark:text-slate-450 border-slate-200 dark:border-slate-800"
                                    }`}
                                  >
                                    <span>{skill}</span>
                                    {hasSkill ? <Check className="w-3 h-3 text-emerald-555" /> : <X className="w-3 h-3 text-slate-400" />}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer options */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-455">
                            <div className="flex items-center space-x-4">
                              <span>Posted {job.posted_date}</span>
                              <span className="text-slate-300 dark:text-slate-700">|</span>
                              <span className="text-slate-505 font-mono uppercase tracking-wider text-[10px]">{job.industry} · {job.companySize}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {/* Resume Optimization */}
                              <button
                                onClick={() => setSelectedJob(job)}
                                className="px-3 py-2 border border-indigo-200 dark:border-indigo-850 bg-indigo-50 dark:bg-indigo-950/10 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                                <span>CV Tuner</span>
                              </button>

                              {/* Save Job */}
                              <button
                                type="button"
                                onClick={() => toggleSaveJob(job.id)}
                                className={`p-2 border rounded-xl transition-all cursor-pointer ${
                                  isSaved
                                    ? "bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 border-rose-200 dark:border-rose-900/30 shadow-sm"
                                    : "border-slate-200 dark:border-slate-855 text-slate-400 dark:text-slate-550 hover:text-rose-550"
                                  }`}
                              >
                                <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 dark:fill-rose-400" : ""}`} />
                              </button>

                              {/* Source label */}
                              <span className={`px-2.5 py-1 text-[10px] md:text-xs font-bold uppercase rounded-xl border ${getSourceBadgeColor(job.source)}`}>
                                {getSourceLabel(job.source)}
                              </span>

                              {isApplied ? (
                                <span className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-850/10 text-emerald-600 dark:text-emerald-450 text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1 font-bold">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                  <span>Applied</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleMarkApplied(job)}
                                  className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                                >
                                  Mark Applied
                                </button>
                              )}

                              <a
                                href={job.apply_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-indigo-605 hover:bg-indigo-505 dark:bg-indigo-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all shadow-sm"
                              >
                                <span>Apply</span>
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
        </>
      )}

      {/* Recommended handpicked placements list */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl font-mono font-black select-none pointer-events-none">
              98%
            </div>
            
            <div className="relative z-10 space-y-3 max-w-2xl">
              <span className="bg-white/10 border border-white/20 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest uppercase inline-block">
                SandBox Custom Recommendation Engine V1
              </span>
              <h2 className="text-xl sm:text-3xl font-black">Curated placements suited to your profile</h2>
              <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
                Calculated by scoring CV credentials (<span className="text-amber-300 font-bold">{userSkills.join(", ")}</span>) alongside your historical query contexts.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendedJobsList.map((job) => {
              const isSaved = savedJobs.includes(job.id);
              const isApplied = appliedJobs.includes(job.id);
              
              return (
                <div 
                  key={job.id}
                  className="bg-white dark:bg-slate-900 border border-slate-202 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between hover:border-indigo-500/30 transition-all shadow-sm dark:shadow-none"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-md mb-1.5 border ${getSourceBadgeColor(job.source)}`}>
                          {getSourceLabel(job.source)}
                        </span>
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">{job.title}</h3>
                        <p className="text-xs text-slate-500 font-semibold">{job.company} · {job.location}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getScoreColor(job.matchScore)}`}>
                        {job.matchScore}% Score
                      </span>
                    </div>

                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.map(s => (
                        <span key={s} className="bg-slate-50 dark:bg-slate-950 text-slate-505 border border-slate-205 dark:border-slate-800 text-[10px] sm:text-xs px-2 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] text-slate-400 font-mono">Posted {job.posted_date}</span>
                    
                    <div className="flex items-center space-x-2">
                       <button
                          onClick={() => setSelectedJob(job)}
                          className="p-2 border border-indigo-250 dark:border-indigo-850 bg-indigo-50/50 dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 rounded-xl transition-all"
                          title="CV optimizations suggestions"
                        >
                          <Sparkles className="w-4 h-4 text-indigo-550 animate-bounce" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleSaveJob(job.id)}
                          className={`p-2 border rounded-xl transition-all cursor-pointer ${
                            isSaved
                              ? "bg-rose-50 dark:bg-rose-955/20 text-rose-500 dark:text-rose-400 border-rose-150 dark:border-rose-900/10"
                              : "border-slate-200 dark:border-slate-850 text-slate-505"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isSaved ? "fill-rose-500 dark:fill-rose-400" : ""}`} />
                        </button>

                        {isApplied ? (
                           <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-850 text-xs px-3 py-2 rounded-xl text-[11px]">In Tracker</span>
                        ) : (
                           <button
                             type="button"
                             onClick={() => handleMarkApplied(job)}
                             className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer"
                           >
                             Add
                           </button>
                        )}
                        <a href={job.apply_link} className="bg-indigo-605 dark:bg-indigo-600 hover:bg-indigo-505 text-white text-xs px-3 py-2 rounded-xl font-bold flex items-center space-x-1">
                           <span>Apply</span>
                           <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Salary analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
              <div>
                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-750 dark:text-indigo-400 text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border border-indigo-150 border-dashed inline-block">
                  Live Market Analysis
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-950 dark:text-white mt-2">Active SDE Skill Demands</h3>
                <p className="text-slate-555 dark:text-slate-400 text-xs mt-1">
                  Technology request distribution based on current filters query range.
                </p>
              </div>

              {analyticsData.skillDemand.length > 0 ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.skillDemand} layout="vertical" margin={{ left: 10, right: 10 }}>
                      <XAxis type="number" unit="%" stroke="#94a3b8" fontSize={11} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                      <RechartsTooltip 
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "11px", color: "#fff" }}
                        formatter={(value) => [`${value}% Demand`, "Percentage"]}
                      />
                      <Bar dataKey="Percentage" barSize={14} radius={[0, 4, 4, 0]}>
                        {analyticsData.skillDemand.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#6366f1" : index % 2 === 0 ? "#818cf8" : "#a5b4fc"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">Apply filters to populate analytics index records.</div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-none space-y-4">
              <div>
                <span className="bg-emerald-50 dark:bg-emerald-950/45 text-emerald-700 dark:text-emerald-405 text-[10px] font-mono font-black uppercase px-2.5 py-1 rounded-full border border-emerald-150 border-dashed inline-block">
                  Salary Range Benchmarks
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-955 dark:text-white mt-2">Industry Sector Placement Averages</h3>
                <p className="text-slate-555 dark:text-slate-400 text-xs mt-1">
                  Average annual equivalent salary offerings mapped to active verticals.
                </p>
              </div>

              {analyticsData.industrySalaries.length > 0 ? (
                <div className="h-64 sm:h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.industrySalaries}>
                      <XAxis dataKey="industry" stroke="#94a3b8" fontSize={10} />
                      <YAxis stroke="#94a3b8" unit="L" fontSize={11} />
                      <RechartsTooltip 
                        contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: "10px", fontSize: "11px", color: "#fff" }}
                        formatter={(value) => [`${value} LPA`, "Average Equivalent"]}
                      />
                      <Bar dataKey="Avg Salary (LPA)" fill="#10b981" radius={[4, 4, 0, 0]} barSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">No industry salary outputs mapped. Clear parameters.</div>
              )}
            </div>
          </div>
          
          <div className="bg-indigo-600 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
            <div className="space-y-2">
              <h4 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-300 animate-bounce" />
                <span>Demand Resiliency: React + TypeScript developer profiles is extremely robust</span>
              </h4>
              <p className="text-xs text-indigo-100 max-w-xl leading-relaxed font-medium">
                Indian off-campus screening assessments favor candidate credentials showing comprehensive microservices structures. Ensure MongoDB and Docker cache techniques are written in project outlines.
              </p>
            </div>
            <button 
              onClick={() => { setActiveTab("explore"); setRawQuery("TypeScript"); toast.success("Filtered by: 'TypeScript' focus!"); }}
              className="bg-white hover:bg-slate-50 text-indigo-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              Analyze TypeScript Roles
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------------------
          CRAWLER LOGS & PROXY STATUS MONITOR PANEL (Fourth Tab)
          ---------------------------------------------------------------------------- */}
      {activeTab === "crawlers" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Scrapers Status Sidebar */}
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="text-indigo-500 w-4 h-4 animate-pulse" />
                  <span>Aggregator Channels</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-1">Live status of continuous Indian scraping crawlers today.</p>
              </div>

              {/* Status List for all platforms */}
              <div className="space-y-3">
                {[
                  { name: "Naukri.com", status: "Active", logs: "342pg analyzed" },
                  { name: "LinkedIn Jobs", status: "Active", logs: "Proxy rotate (120 retries)" },
                  { name: "Internshala", status: "Active", logs: "Stipend normalization" },
                  { name: "Shine.com", status: "Active", logs: "Deduplicated" },
                  { name: "Foundit", status: "Active", logs: "Continuous scan" },
                  { name: "Indeed", status: "Active", logs: "Scroll lazyLoad" },
                  { name: "Glassdoor", status: "Active", logs: "Verified filter" },
                  { name: "Company Careers", status: "Active", logs: "API parser" },
                  { name: "Startup Portals", status: "Active", logs: "Active scraper" },
                  { name: "Remote Boards", status: "Active", logs: "Remote only filter" },
                  { name: "Startup Hiring", status: "Active", logs: "Bypass antiBot" }
                ].map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
                    <span className="font-bold text-slate-700 dark:text-slate-350">{item.name}</span>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded font-bold font-mono">
                        ● {item.status}
                      </span>
                      <span className="block text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">{item.logs}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal View and Live Trigger */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Aggregated Live Scraping Statistics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Scanned Listings Today</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{scannedListingCount}</span>
                  </div>
                  <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Overlaps Removed</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{dupRemovedCount}</span>
                  </div>
                  <div className="p-3 bg-rose-50/70 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-xl">
                    <X className="w-5 h-5 animate-pulse" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block font-mono">Residential Proxy Ips</span>
                    <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">{activeProxiesCount} Active</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-xl">
                    <Network className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Crawlers terminal interface */}
              <div className="bg-slate-950 text-slate-100 rounded-3xl border border-slate-800 shadow-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-500 block"></span>
                    <span className="text-xs text-slate-400 font-mono pl-2">SandBox-Indian-Distributed-Crawling-Terminal - v1.0.4</span>
                  </div>
                  <span className="text-[9px] text-indigo-400 font-mono tracking-widest uppercase">Proxy secure tunnel active</span>
                </div>

                {/* Simulated Logs Stream */}
                <div className="h-96 overflow-y-auto px-2 space-y-2.5 font-mono text-xs scrollbar-thin scrollbar-thumb-slate-800">
                  {crawlerLogs.map((log, idx) => (
                    <div key={idx} className="leading-relaxed hover:bg-slate-900 px-1 py-0.5 rounded transition-all">
                      {log.includes("[SYSTEM]") && <span className="text-indigo-400 font-extrabold">{log}</span>}
                      {log.includes("[PROXY]") && <span className="text-cyan-400 font-semibold">{log}</span>}
                      {log.includes("[Naukri]") && <span className="text-amber-450 dark:text-amber-405">{log}</span>}
                      {log.includes("[LinkedIn]") && <span className="text-rose-400">{log}</span>}
                      {log.includes("[Internshala]") && <span className="text-pink-400">{log}</span>}
                      {!log.includes("[SYSTEM]") && !log.includes("[PROXY]") && !log.includes("[Naukri]") && !log.includes("[LinkedIn]") && !log.includes("[Internshala]") && <span className="text-slate-300">{log}</span>}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>

                {/* Progress bar and execution buttons */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="w-full sm:w-1/2 flex items-center space-x-3 text-slate-400 text-xs">
                    <span className="font-mono">Crawl Task:</span>
                    <div className="flex-grow bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-850">
                      <div 
                        className="bg-indigo-505 h-full transition-all duration-300 rounded-full" 
                        style={{ width: `${crawlerProgress}%` }}
                      />
                    </div>
                    <span className="font-mono text-indigo-400 font-bold">{crawlerProgress}%</span>
                  </div>

                  <button
                    onClick={startScraperRun}
                    disabled={isCrawlerScraping}
                    className={`px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-md`}
                  >
                    {isCrawlerScraping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Running Scrape Synced Pipelines...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Trigger Indian Crawlers Scan & Sync</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔮 Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-205 dark:border-slate-800 shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100"
            >
              <div className="p-6 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-650 dark:text-indigo-400 text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    AI Resume Parser Feedback
                  </span>
                  <h3 className="text-lg font-black text-slate-950 dark:text-white mt-1">CV Tuning suggestions for:</h3>
                  <p className="text-xs text-slate-500 font-bold">{selectedJob.title} at {selectedJob.company}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-505 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="col-span-1 border border-slate-200 dark:border-indigo-900/20 bg-indigo-50/10 dark:bg-indigo-950/10 p-4 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">CV Alignment Grade</span>
                    <div className="text-3xl font-extrabold text-indigo-605 dark:text-indigo-400 font-mono">{selectedJob.matchScore}%</div>
                    <span className="text-[10px] text-zinc-505 dark:text-slate-455 font-bold block mt-1">
                      {selectedJob.matchScore >= 80 ? "🔥 Shortlist Ready" : "⚠️ Optimize Keywords"}
                    </span>
                  </div>

                  <div className="col-span-2 border border-slate-200 dark:border-slate-850 bg-slate-100/30 dark:bg-slate-950/40 p-4 rounded-2xl flex flex-col justify-center space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">ATS Recruiter Checkpoint</span>
                    <ul className="text-xs text-slate-655 dark:text-slate-300 space-y-1.5 pr-2">
                      {selectedJob.matchReport.feedbackList.map((fb, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 font-medium leading-normal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-455 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Discrepancies details */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest font-mono">Key CV Keywords Overlap</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="border border-emerald-150 dark:border-emerald-900/20 bg-emerald-50/20 dark:bg-emerald-950/10 p-4.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                        <Check className="w-4 h-4" /> Matched Core Skills
                      </span>
                      {selectedJob.matchReport.matchedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {selectedJob.matchReport.matchedSkills.map(s => (
                            <span key={s} className="bg-emerald-150/15 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs mt-2 italic font-mono">No matching skills identified.</p>
                      )}
                    </div>

                    <div className="border border-amber-202/60 dark:border-amber-900/20 bg-amber-50/20 dark:bg-amber-950/10 p-4.5 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                        <AlertTriangle className="w-3.5 h-3.5" /> Missing Match Keywords
                      </span>
                      {selectedJob.matchReport.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {selectedJob.matchReport.missingSkills.map(s => (
                            <span key={s} className="bg-amber-150/15 dark:bg-amber-955 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-bold font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-405 text-xs mt-2 italic font-mono">Skill overlap is perfectly complete!</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Advice */}
                <div className="border border-purple-150 dark:border-purple-900/20 bg-gradient-to-tr from-purple-50/10 to-indigo-50/10 dark:from-purple-950/10 dark:to-indigo-950/10 p-5 rounded-3xl space-y-3.5">
                  <div className="flex items-center space-x-2 text-purple-650 dark:text-purple-400 font-semibold text-xs font-mono uppercase tracking-widest shadow-sm">
                    <Sparkles className="w-5 h-5 animate-pulse text-indigo-500" />
                    <span>Dynamic AI Resume Customizer</span>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Quantitative bullets re-write recommendation</span>
                      <blockquote className="text-xs bg-white dark:bg-slate-950 border-l-4 border-purple-500 dark:border-purple-450 p-2.5 rounded-lg text-slate-750 dark:text-slate-300 italic font-medium leading-relaxed mt-1.5 shadow-xs">
                        {getAIResumeBoosterAdvice(selectedJob, userSkills).bulletPointIdea}
                      </blockquote>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Technical Projects Alignment advice</span>
                      <p className="text-xs text-slate-655 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                        {getAIResumeBoosterAdvice(selectedJob, userSkills).missingSkillsSuggestion}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Strategic CV Header Subtitle Tip</span>
                      <p className="text-xs text-slate-655 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                        {getAIResumeBoosterAdvice(selectedJob, userSkills).structuralTip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-right flex items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-mono">SandBox ATS Grade Monitor</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedJob(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Close panel
                  </button>
                  <a
                    href={selectedJob.apply_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-indigo-605 hover:bg-indigo-505 dark:bg-indigo-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Apply on {getSourceLabel(selectedJob.source)}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
