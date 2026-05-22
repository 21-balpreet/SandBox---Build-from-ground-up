import { formatIndianSalary } from "./formatters";

export interface Job {
  id: string;
  _id: string;
  title: string;
  company: string;
  location: string;
  salary: string; // stipend per month for internships (e.g. "35000"), or annual salary in INR (e.g. "1200000")
  skills: string[];
  apply_link: string;
  posted_date: string; // e.g., "2 hours ago", "Yesterday", "3 days ago"
  source: 
    | "naukri" 
    | "linkedin" 
    | "internshala" 
    | "shine" 
    | "foundit" 
    | "indeed" 
    | "glassdoor" 
    | "company" 
    | "startup_portal" 
    | "remote_board" 
    | "hiring_site";
  jobType: "full-time" | "internship" | "remote" | "contract";
  experienceLevel: "fresher" | "internship" | "experienced";
  worklocationType: "remote" | "hybrid" | "on-site";
  companySize: "startup" | "mid-market" | "enterprise";
  industry: "SaaS" | "FinTech" | "EdTech" | "E-commerce" | "Services" | "AI / DeepTech";
  verified: boolean;
  description: string;
  views: number;
  applyCount: number;
  postedDaysAgo: number;
}

// Comprehensive Synonym mapping for Indian recruit terminology and cross-skilling
export const SYNONYM_MAP: Record<string, string[]> = {
  "software engineer": ["sde", "software developer", "developer", "systems engineer", "programmer", "application engineer", "tech associate"],
  "developer": ["sde", "sde-1", "sde-2", "software developer", "developer", "engineer", "software engineer", "programmer"],
  "engineer": ["sde", "sde-1", "sde-2", "software developer", "developer", "engineer", "software engineer", "programmer"],
  "sde": ["software engineer", "software developer", "developer", "sde-1", "sde-2", "graduate engineer", "application engineer", "systems analyst"],
  "sde-1": ["sde", "software developer", "developer", "fresher sde", "associate engineer", "junior developer"],
  "fresher": ["fresher", "junior", "trainee", "graduate", "0 years experience", "entry level", "associate"],
  "internship": ["intern", "stipend", "trainee", "summer intern", "placement intern"],
  "data analyst": ["business analyst", "sql analyst", "data scientist", "business intelligence analyst", "bi analyst", "product analyst", "data engineer", "analytics specialist"],
  "business analyst": ["data analyst", "product analyst", "operation analyst", "consultant", "bi developer"],
  "frontend": ["react", "web developer", "ui developer", "javascript developer", "frontend engineer", "angular developer", "html", "css", "next.js", "vue"],
  "backend": ["node", "java", "python developer", "django developer", "spring boot", "database developer", "backend engineer", "golang", "postgreSQL"],
  "fullstack": ["web developer", "javascript developer", "frontend", "backend", "mern developer", "full stack developer", "fullstack engineer", "node and react"],
  "react": ["next.js", "frontend", "javascript", "tailwind", "typescript", "single page app", "react.js", "reactjs", "react native"],
  "python": ["django", "flask", "machine learning", "data science", "fastapi", "pandas", "numpy", "data engineer"],
  "node.js": ["express", "mongodb", "backend", "javascript", "api", "node", "nodejs"],
  "java": ["spring boot", "spring", "hibernate", "microservices", "java developer", "springboot", "j2ee"],
  "aws": ["gcp", "azure", "docker", "kubernetes", "cloud", "devops", "ci/cd", "terraform"],
  "devops": ["docker", "kubernetes", "aws", "ci/cd", "terraform", "cloud engineer", "jenkins", "sysops"]
};

// Autocomplete recommendations pool representing major platforms and terms
export const AUTOCOMPLETE_SUGGESTIONS = [
  "React Developer",
  "Software Engineer",
  "SDE-1 Intern",
  "Data Analyst",
  "Fullstack Developer",
  "Python Developer",
  "Spring Boot Engineer",
  "Node.js Backend",
  "Java SDE-1",
  "Business Analyst",
  "UI Developer",
  "DevOps Engineer",
  "AWS Cloud Associate",
  "Google India",
  "Microsoft Careers",
  "Swiggy Careers",
  "Zomato SDE",
  "Flipkart SDE-1",
  "CRED Developer",
  "Razorpay SDE",
  "Bangalore SDE",
  "Pune Freshers",
  "Mumbai WFH",
  "Delhi NCR Internship",
  "Remote python",
  "Hyderabad freshers"
];

// Fuzzy Spelling Correction mapping with Indian user multi-lingual context tolerance
export function getTypoTolerantQuery(query: string): string {
  const words = query.toLowerCase().trim().split(/\s+/);
  
  const corrections: Record<string, string> = {
    // Technical spelling typos
    "pythn": "python",
    "pyton": "python",
    "ract": "react",
    "reac": "react",
    "ndjs": "node.js",
    "nod": "node",
    "java script": "javascript",
    "javascrip": "javascript",
    "tpscript": "typescript",
    "typsecrip": "typescript",
    "docer": "docker",
    "kubernets": "kubernetes",
    "bngalore": "bangalore",
    "mubai": "mumbai",
    "hydrabad": "hyderabad",
    "noida-ncr": "noida",
    "internshp": "internship",
    "intrn": "intern",
    "softwer": "software",
    "softwar": "software",
    "enginer": "engineer",
    "devloper": "developer",
    "fresher": "fresher",
    "freshers": "fresher",
    "experince": "experienced",
    "remot": "remote",
    "daat": "data",
    "bussiness": "business",
    "salar": "salary",

    // Multilingual tolerance and colloquial Indian career search queries
    "chahiye": "", // helper word "want" in Hindi context
    "job chahiye": "vacancy",
    "wfh": "remote",
    "wfo": "on-site",
    "stipend": "internship",
    "stipend kitna hai": "salary", 
    "home se": "remote",
    "ghar se": "remote"
  };

  const corrected = words.map(w => corrections[w] !== undefined ? corrections[w] : w).filter(Boolean);
  return corrected.join(" ");
}

// NLP Engine: Parses descriptive conversational queries into parameter filters
export interface ParsedNLPQuery {
  extractedLocation: string | null;
  extractedSkills: string[];
  extractedJobType: string | null;
  extractedExperience: string | null;
  extractedWorksite: "remote" | "hybrid" | "on-site" | null;
  maxSalaryLimit: number | null;
  extractedCompany: string | null;
  hasHindiChahiyeIntent: boolean;
}

export function parseNLPQuery(rawQuery: string): ParsedNLPQuery {
  const text = rawQuery.toLowerCase().trim();
  const result: ParsedNLPQuery = {
    extractedLocation: null,
    extractedSkills: [],
    extractedJobType: null,
    extractedExperience: null,
    extractedWorksite: null,
    maxSalaryLimit: null,
    extractedCompany: null,
    hasHindiChahiyeIntent: false
  };

  if (!text) return result;

  // Track if user used a friendly Hindi tone
  if (text.includes("chahiye") || text.includes("milega") || text.includes("batao")) {
    result.hasHindiChahiyeIntent = true;
  }

  // 1. Geography Locations
  const cities = ["bangalore", "bengaluru", "mumbai", "pune", "hyderabad", "chennai", "kolkata", "delhi", "gurugram", "gurgaon", "noida", "jaipur", "kochi", "coimbatore", "indore", "lucknow", "ahmedabad", "chandigarh", "surat", "bhubaneswar", "coimbatore"];
  for (const city of cities) {
    if (text.includes(city)) {
      if (city === "bengaluru") {
        result.extractedLocation = "Bangalore";
      } else if (city === "gurgaon" || city === "gurugram") {
        result.extractedLocation = "Delhi NCR";
      } else if (city === "delhi" || city === "noida") {
        result.extractedLocation = "Delhi NCR";
      } else {
        result.extractedLocation = city.charAt(0).toUpperCase() + city.slice(1);
      }
      break;
    }
  }

  // 2. Tech Skills Extraction
  const techStacks = [
    "react", "node", "typescript", "javascript", "python", "django", "flask", 
    "java", "spring boot", "springboot", "docker", "kubernetes", "aws", "gcp", 
    "mongodb", "sql", "postgresql", "redis", "kotlin", "swift", "figma", "html", "css",
    "flutter", "angular", "vue", "golang", "ruby", "next.js", "solidity", "rust"
  ];
  for (const tech of techStacks) {
    if (text.includes(tech)) {
      let pretty = tech === "aws" || tech === "gcp" || tech === "sql" ? tech.toUpperCase() : tech;
      if (pretty === "node") pretty = "Node.js";
      if (pretty === "springboot" || pretty === "spring boot") pretty = "Spring Boot";
      if (pretty === "next.js") pretty = "Next.js";
      result.extractedSkills.push(pretty.charAt(0).toUpperCase() + pretty.slice(1));
    }
  }

  // 3. Work-Site Constraints
  if (text.includes("remote") || text.includes("work from home") || text.includes("wfh") || text.includes("ghar se")) {
    result.extractedWorksite = "remote";
  } else if (text.includes("hybrid") || text.includes("flexible office")) {
    result.extractedWorksite = "hybrid";
  } else if (text.includes("on site") || text.includes("on-site") || text.includes("office") || text.includes("wfo")) {
    result.extractedWorksite = "on-site";
  }

  // 4. Job Types / Engagements
  if (text.includes("intern") || text.includes("internship") || text.includes("stipend") || text.includes("trainee")) {
    result.extractedJobType = "internship";
  } else if (text.includes("contract") || text.includes("freelance") || text.includes("contractual")) {
    result.extractedJobType = "contract";
  } else if (text.includes("full time") || text.includes("fulltime") || text.includes("full-time") || text.includes("regular")) {
    result.extractedJobType = "full-time";
  }

  // 5. Experience Bracket
  if (text.includes("fresher") || text.includes("graduate") || text.includes("btech") || text.includes("2026") || text.includes("2025") || text.includes("entry level") || text.includes("fresher jobs")) {
    result.extractedExperience = "fresher";
  } else if (text.includes("intern") || text.includes("stipend")) {
    result.extractedExperience = "internship";
  } else if (text.includes("experienced") || text.includes("senior") || text.includes("lead") || text.includes("sde-2") || text.includes("sde-3") || text.includes("mid level")) {
    result.extractedExperience = "experienced";
  }

  // 6. Indian Salary parsing (e.g. 15 lpa, 8lpa, under 40k)
  const lpaMatch = text.match(/under\s*(\d+)\s*lpa/) || text.match(/(\d+)\s*lpa/);
  if (lpaMatch && lpaMatch[1]) {
    result.maxSalaryLimit = parseInt(lpaMatch[1]) * 100000;
  } else {
    const stipendMatch = text.match(/under\s*(\d+)\s*k/) || text.match(/(\d+)\s*k/);
    if (stipendMatch && stipendMatch[1]) {
      result.maxSalaryLimit = parseInt(stipendMatch[1]) * 1000;
    }
  }

  // 7. Company Extraction
  const companies = ["google", "amazon", "microsoft", "swiggy", "zomato", "razorpay", "flipkart", "phonepe", "tcs", "infosys", "wipro", "cred", "paytm", "ola", "jio", "airtel", "zepto", "tata", "groww"];
  for (const comp of companies) {
    if (text.includes(comp)) {
      result.extractedCompany = comp === "tcs" ? "TCS" : comp.charAt(0).toUpperCase() + comp.slice(1);
      break;
    }
  }

  return result;
}

// ----------------------------------------------------------------------------
// EXHAUSTIVE AND DETAILED INDIAN JOBS REGISTRY
// Built to ensure highly robust, diverse, and realistic search results (35 items)
// ----------------------------------------------------------------------------
export const ENRICHED_JOBS: Job[] = [
  {
    id: "ej_1",
    _id: "ej_1",
    title: "Software Engineering Intern (React/Node)",
    company: "Zomato",
    location: "Delhi NCR",
    salary: "45000",
    skills: ["React", "Node.js", "Express", "TailwindCSS"],
    apply_link: "https://zomato.com/careers",
    posted_date: "2 hours ago",
    source: "internshala",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "E-commerce",
    verified: true,
    description: "Looking for SDE Interns passionate about building beautiful delivery dashboards and optimizing rapid food delivery trackers. Experience with REST APIs, React component composition, and Tailwind CSS is highly preferred. High stipend performance can lead to pre-placement offers (PPO). Required: Node, Express, backend rest routes execution.",
    views: 420,
    applyCount: 154,
    postedDaysAgo: 0
  },
  {
    id: "ej_2",
    _id: "ej_2",
    title: "Graduate SDE-1 / Software Developer",
    company: "Razorpay",
    location: "Bangalore",
    salary: "1500000",
    skills: ["TypeScript", "MongoDB", "Node.js", "AWS"],
    apply_link: "https://razorpay.com/jobs",
    posted_date: "Yesterday",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "FinTech",
    verified: true,
    description: "Join our core payments SDE engineering guild. Focus closely on building secure, reliable, and high-throughput transaction microservices. You will work with Node, Express API design, transactional caching in MongoDB, and automated pipeline scripts in AWS Docker workflows. Open to B.Tech/M.Tech freshers from 2025/2026 graduation years.",
    views: 980,
    applyCount: 412,
    postedDaysAgo: 1
  },
  {
    id: "ej_3",
    _id: "ej_3",
    title: "AWS Cloud Support Engineer",
    company: "Tata Consultancy Services (TCS)",
    location: "Pune",
    salary: "450000",
    skills: ["Linux", "AWS", "SQL", "Networking"],
    apply_link: "https://tcs.com/careers",
    posted_date: "3 days ago",
    source: "indeed",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: false,
    description: "Help enterprise clients safely migrate legacy workloads onto contemporary AWS and hybrid cloud setups. Deep fundamental knowledge of Unix/Linux command-line interfaces, basic database statements in SQL, S3 bucket permissions, EC2 virtual networks, security configurations, and dynamic routing protocols is mandatory.",
    views: 1250,
    applyCount: 890,
    postedDaysAgo: 3
  },
  {
    id: "ej_4",
    _id: "ej_4",
    title: "Remote Fullstack Engineering Associate",
    company: "HackerEarth India",
    location: "Remote",
    salary: "850000",
    skills: ["Python", "Django", "React", "Docker"],
    apply_link: "https://hackerearth.com",
    posted_date: "4 days ago",
    source: "remote_board",
    jobType: "remote",
    experienceLevel: "fresher",
    worklocationType: "remote",
    companySize: "mid-market",
    industry: "SaaS",
    verified: true,
    description: "Build cutting-edge technical evaluation pipelines allowing millions of developers to take coding screens. Working with Python, Django REST frameworks, Redis cache broker systems, React frontend dashboards, and sandboxed Docker containers is heavily leveraged in this role.",
    views: 520,
    applyCount: 231,
    postedDaysAgo: 4
  },
  {
    id: "ej_5",
    _id: "ej_5",
    title: "Backend Core SDE-1 (Java)",
    company: "PhonePe",
    location: "Bangalore",
    salary: "1800000",
    skills: ["Java", "Spring Boot", "PostgreSQL", "Kafka"],
    apply_link: "https://www.phonepe.com/careers",
    posted_date: "5 days ago",
    source: "linkedin",
    jobType: "full-time",
    experienceLevel: "experienced",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "FinTech",
    verified: true,
    description: "Scale high-performance payment gateways processing in excess of 15,000 requests per second. Work closely with robust transactional architectures on PostgreSQL, write reactive streaming consumers on Kafka pipelines, and configure Spring Boot microservices.",
    views: 1100,
    applyCount: 450,
    postedDaysAgo: 5
  },
  {
    id: "ej_6",
    _id: "ej_6",
    title: "Frontend React Developer",
    company: "Swiggy",
    location: "Bangalore",
    salary: "1400000",
    skills: ["React", "JavaScript", "Redux", "SASS", "TailwindCSS"],
    apply_link: "https://careers.swiggy.com",
    posted_date: "2 hours ago",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "E-commerce",
    verified: true,
    description: "Seeking a SDE Frontend Developer to build highly interactive, eye-catching merchant portals using React, state managers like Redux or Zustand, and custom SASS utilities. Excellent chance for 2024/2025 graduates with solid grip on modern CSS layouts and JS closures.",
    views: 890,
    applyCount: 301,
    postedDaysAgo: 0
  },
  {
    id: "ej_7",
    _id: "ej_7",
    title: "SDE-1 (Quick-Commerce Web Team)",
    company: "Zepto",
    location: "Mumbai",
    salary: "1600500",
    skills: ["React", "Node.js", "MongoDB", "Python"],
    apply_link: "https://www.zepto.co/careers",
    posted_date: "Yesterday",
    source: "linkedin",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "AI / DeepTech",
    verified: true,
    description: "Build robust logistics panels and order aggregators to satisfy 10-minute grocery shipments across tier 1 cities. Your responsibilities include developing highly responsive React screens and integrating REST lines with deep python routing mechanisms and Node data clusters.",
    views: 1450,
    applyCount: 610,
    postedDaysAgo: 1
  },
  {
    id: "ej_8",
    _id: "ej_8",
    title: "DevOps Integration Associate",
    company: "Infosys",
    location: "Pune",
    salary: "500000",
    skills: ["AWS", "Docker", "CI/CD", "Linux", "Kubernetes"],
    apply_link: "https://www.infosys.com",
    posted_date: "1 week ago",
    source: "indeed",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "Services",
    verified: false,
    description: "Deliver high-quality deployment scripts, automate continuous integration blocks with GitHub actions, maintain configurations inside Kubernetes clusters, and support production instances on Linux systems across Amazon Web Services.",
    views: 450,
    applyCount: 180,
    postedDaysAgo: 7
  },
  {
    id: "ej_9",
    _id: "ej_9",
    title: "Business Intelligence Analyst",
    company: "CRED",
    location: "Bangalore",
    salary: "1100000",
    skills: ["SQL", "Python", "Tableau", "Analytics"],
    apply_link: "https://cred.club",
    posted_date: "Today",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "experienced",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "FinTech",
    verified: true,
    description: "Formulate analytical paradigms covering credit card usage benchmarks. Responsibilities include building highly performant PostgreSQL tables, configuring visual dashboard elements on Tableau, and providing predictive model guidance in Python to product owners.",
    views: 650,
    applyCount: 220,
    postedDaysAgo: 0
  },
  {
    id: "ej_10",
    _id: "ej_10",
    title: "Android Kotlin Developer",
    company: "Jio Labs",
    location: "Mumbai",
    salary: "1350000",
    skills: ["Kotlin", "Android SDK", "Jetpack Compose", "Coroutines"],
    apply_link: "https://careers.jio.com",
    posted_date: "Yesterday",
    source: "linkedin",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: true,
    description: "Design reactive mobile tools supporting millions of concurrent streaming and cellular users. Write elegant, stable application screens in Kotlin with Jetpack Compose views, implement concurrency with Coroutines, and establish local cache lines with room DB.",
    views: 920,
    applyCount: 388,
    postedDaysAgo: 1
  },
  {
    id: "ej_11",
    _id: "ej_11",
    title: "Full Stack Engineer (MERN)",
    company: "Groww",
    location: "Bangalore",
    salary: "1700000",
    skills: ["React", "Node.js", "Express", "MongoDB", "Redux"],
    apply_link: "https://groww.in",
    posted_date: "4 days ago",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "experienced",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "FinTech",
    verified: true,
    description: "Build user-facing stock brokerage charts and transaction processing channels. Responsibilities include migrating client frameworks to React Redux and refining the micro-service architecture using Node with Express, backed by MongoDB replica datasets.",
    views: 740,
    applyCount: 198,
    postedDaysAgo: 4
  },
  {
    id: "ej_12",
    _id: "ej_12",
    title: "SDE Technical Intern",
    company: "Microsoft India",
    location: "Hyderabad",
    salary: "80000",
    skills: ["C#", ".NET", "TypeScript", "SQL"],
    apply_link: "https://careers.microsoft.com",
    posted_date: "Today",
    source: "linkedin",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "SaaS",
    verified: true,
    description: "Opportunity to build robust telemetry and analytics features supporting Azure DevOps tools. Ideal candidates will demonstrate high academic outcomes alongside fundamental projects written using C#/.NET structures or TypeScript web routes.",
    views: 2200,
    applyCount: 940,
    postedDaysAgo: 0
  },
  // --- ADDITIONAL INDIAN OPPORTUNITIES (To solve "zero results" and expand platforms context) ---
  {
    id: "ej_13",
    _id: "ej_13",
    title: "Frontend Engineer (SDE-1)",
    company: "Flipkart",
    location: "Bangalore",
    salary: "1450000",
    skills: ["React", "JavaScript", "HTML", "CSS", "TypeScript"],
    apply_link: "https://www.flipkartcareers.com",
    posted_date: "2 days ago",
    source: "shine",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "E-commerce",
    verified: true,
    description: "Join the Web Platform group at Flipkart. Develop high performance mobile-first browser templates for festive season sale banners. Extensive experience working with Javascript ES6 arrays, layout standards using HTML/CSS, React hooks lifecycle state management.",
    views: 1120,
    applyCount: 520,
    postedDaysAgo: 2
  },
  {
    id: "ej_14",
    _id: "ej_14",
    title: "Backend SDE-1 (Python / Django)",
    company: "Paytm",
    location: "Noida",
    salary: "1200000",
    skills: ["Python", "Django", "PostgreSQL", "Redis"],
    apply_link: "https://paytm.com/careers",
    posted_date: "3 days ago",
    source: "foundit",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "FinTech",
    verified: true,
    description: "Contribute to building secure, scalable QR payment logs. Ideal freshers with Python backend coding experience, REST frameworks using Django, relational queries in PostgreSQL, and fast caching in Redis.",
    views: 890,
    applyCount: 410,
    postedDaysAgo: 3
  },
  {
    id: "ej_15",
    _id: "ej_15",
    title: "Junior Flutter App Intern",
    company: "Ola Electric",
    location: "Bangalore",
    salary: "30000",
    skills: ["Flutter", "Dart", "REST APIs", "Git"],
    apply_link: "https://www.olaelectric.com/careers",
    posted_date: "Yesterday",
    source: "internshala",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "AI / DeepTech",
    verified: true,
    description: "Work directly on scooter firmware visualization Dashboards. Code in Dart language utilizing the cross-platform Flutter SDK, parse JSON payloads from HTTP REST APIs, and manage visual widget hierarchies.",
    views: 450,
    applyCount: 195,
    postedDaysAgo: 1
  },
  {
    id: "ej_16",
    _id: "ej_16",
    title: "Remote Frontend Developer (Vue.js)",
    company: "KoinX India",
    location: "Remote",
    salary: "700000",
    skills: ["Vue", "JavaScript", "CSS", "TailwindCSS"],
    apply_link: "https://koinx.com/careers",
    posted_date: "Yesterday",
    source: "hiring_site",
    jobType: "remote",
    experienceLevel: "fresher",
    worklocationType: "remote",
    companySize: "startup",
    industry: "FinTech",
    verified: true,
    description: "Startup-focused recruitment for crypto taxation calculators. Highly collaborative environment building lightweight components in Vue 3, integrating decentralized state parameters, and styling responsive views with Tailwind.",
    views: 610,
    applyCount: 220,
    postedDaysAgo: 1
  },
  {
    id: "ej_17",
    _id: "ej_17",
    title: "Systems Software Engineer (SDE-1)",
    company: "Airtel Xstream",
    location: "Delhi NCR",
    salary: "1300000",
    skills: ["Go", "Docker", "Linux", "MongoDB"],
    apply_link: "https://airtel.in/careers",
    posted_date: "5 days ago",
    source: "indeed",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: true,
    description: "Develop APIs powering over 10 million telemetry triggers on smart streaming setups. Code robust network routers using Go programming pipelines, maintain services in sandboxed Docker containers, and query high write databases on MongoDB.",
    views: 740,
    applyCount: 330,
    postedDaysAgo: 5
  },
  {
    id: "ej_18",
    _id: "ej_18",
    title: "SDE Internship - Backend Python",
    company: "Swiggy Instamart",
    location: "Bangalore",
    salary: "40000",
    skills: ["Python", "Flask", "SQL", "Git"],
    apply_link: "https://swiggy.com/careers",
    posted_date: "4 days ago",
    source: "internshala",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "E-commerce",
    verified: true,
    description: "Excellent back-end optimization track. Write micro-services in Flask/Python, debug performance limits in relational SQL engines, and merge collaborative commits with Git workflows.",
    views: 890,
    applyCount: 245,
    postedDaysAgo: 4
  },
  {
    id: "ej_19",
    _id: "ej_19",
    title: "Systems & Network Intern",
    company: "Wipro Tech",
    location: "Kochi",
    salary: "20000",
    skills: ["Linux", "Networking", "Bash", "Shell Scripting"],
    apply_link: "https://wipro.com/careers",
    posted_date: "1 week ago",
    source: "glassdoor",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: false,
    description: "Understand Unix automation principles. Create system diagnostic tools with Linux shell scripting (Bash), troubleshoot enterprise load routers, and maintain active infrastructure reports.",
    views: 520,
    applyCount: 110,
    postedDaysAgo: 7
  },
  {
    id: "ej_20",
    _id: "ej_20",
    title: "SDE Graduate Associate - Next.js/React",
    company: "Lenskart Tech",
    location: "Delhi NCR",
    salary: "1100000",
    skills: ["Next.js", "React", "TypeScript", "TailwindCSS"],
    apply_link: "https://lenskart.com/careers",
    posted_date: "Today",
    source: "startup_portal",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "E-commerce",
    verified: true,
    description: "Build immersive virtual 3D eyewear fittings. Seeking freshers with excellent TypeScript capability, familiarity with Next.js router conventions, React custom hooks, and Tailwind utility implementations.",
    views: 720,
    applyCount: 195,
    postedDaysAgo: 0
  },
  // --- TIER 2 & TIER 3 METRO OPPORTUNITIES (Requested specifically) ---
  {
    id: "ej_21",
    _id: "ej_21",
    title: "Junior Backend Developer - Python/Postgres",
    company: "Cognizant India",
    location: "Coimbatore",
    salary: "400000",
    skills: ["Python", "PostgreSQL", "SQL", "Git"],
    apply_link: "https://cognizant.com/careers",
    posted_date: "2 days ago",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: true,
    description: "Provide development assistance on legacy enterprise ERP frameworks. Involves continuous integration patches in Python, composing queries on PostgreSQL, and organizing source tracks with Git.",
    views: 450,
    applyCount: 220,
    postedDaysAgo: 2
  },
  {
    id: "ej_22",
    _id: "ej_22",
    title: "React Web Development Trainee",
    company: "Appointy Technologies",
    location: "Indore",
    salary: "350000",
    skills: ["React", "JavaScript", "HTML", "CSS"],
    apply_link: "https://appointy.com/careers",
    posted_date: "4 days ago",
    source: "hiring_site",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "startup",
    industry: "SaaS",
    verified: true,
    description: "Great startup foundation in Central India. Learn from experienced architects how to build clean SaaS scheduling modules. High learning curve using React, CSS animations, and JS modularity.",
    views: 590,
    applyCount: 180,
    postedDaysAgo: 4
  },
  {
    id: "ej_23",
    _id: "ej_23",
    title: "Associate React Native Developer",
    company: "Deqode",
    location: "Jaipur",
    salary: "550000",
    skills: ["React Native", "TypeScript", "JavaScript", "API Integration"],
    apply_link: "https://deqode.com/careers",
    posted_date: "3 days ago",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "AI / DeepTech",
    verified: true,
    description: "Excellent hybrid mobile opportunity in Pink City. Work with cross-platform React Native bindings, script types safely with TypeScript, and resolve user telemetry APIs.",
    views: 310,
    applyCount: 95,
    postedDaysAgo: 3
  },
  {
    id: "ej_24",
    _id: "ej_24",
    title: "Python Web & Scraping Associate",
    company: "InnoEye Technologies",
    location: "Indore",
    salary: "420000",
    skills: ["Python", "Flask", "SQL", "BeautifulSoup"],
    apply_link: "https://innoeye.com/careers",
    posted_date: "Yesterday",
    source: "foundit",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "Services",
    verified: false,
    description: "Write automated crawlers and schedulers for indexing market pricing variables. Requires high expertise with Python scripting, scraping libraries like BeautifulSoup or Scrapy, and tabular relational writes.",
    views: 380,
    applyCount: 124,
    postedDaysAgo: 1
  },
  {
    id: "ej_25",
    _id: "ej_25",
    title: "Mobile App Development Intern",
    company: "SigTuple Solutions",
    location: "Lucknow",
    salary: "25000",
    skills: ["Flutter", "Dart", "Firebase", "Git"],
    apply_link: "https://sigtuple.com",
    posted_date: "Yesterday",
    source: "internshala",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "hybrid",
    companySize: "startup",
    industry: "AI / DeepTech",
    verified: true,
    description: "Medical imaging tools UI assistance. Configure modern state paths in Flutter, map visual outputs to cloud databases using Firebase Firestore, and manage git checkpoints.",
    views: 450,
    applyCount: 160,
    postedDaysAgo: 1
  },
  {
    id: "ej_26",
    _id: "ej_26",
    title: "AWS Cloud Operations Trainee",
    company: "Speridian Technologies",
    location: "Kochi",
    salary: "360000",
    skills: ["Linux", "AWS", "Bash", "Shell Scripting"],
    apply_link: "https://speridian.com",
    posted_date: "1 week ago",
    source: "shine",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "Services",
    verified: false,
    description: "Ideal gateway into Unix administration. Provide backup checks on live Amazon Web Services setups, configure simple network gates, and trigger deployment scripts in Bash.",
    views: 290,
    applyCount: 75,
    postedDaysAgo: 7
  },
  {
    id: "ej_27",
    _id: "ej_27",
    title: "Fullstack PHP Development SDE-1",
    company: "Webkul Software",
    location: "Noida",
    salary: "600000",
    skills: ["PHP", "JavaScript", "HTML", "SQL"],
    apply_link: "https://webkul.com/careers",
    posted_date: "3 days ago",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "E-commerce",
    verified: true,
    description: "Build robust modular plugins for global checkout architectures. Working with core PHP setups, creating queries in MySQL, and layout composition using HTML/JS is mandate.",
    views: 480,
    applyCount: 210,
    postedDaysAgo: 3
  },
  {
    id: "ej_28",
    _id: "ej_28",
    title: "Web Frontend SDE Intern",
    company: "Fiserv India",
    location: "Chennai",
    salary: "30000",
    skills: ["React", "JavaScript", "HTML", "CSS"],
    apply_link: "https://fiserv.com",
    posted_date: "2 days ago",
    source: "linkedin",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "FinTech",
    verified: true,
    description: "Refactor ledger transaction grids inside fintech pipelines. Create responsive styling sheets matching Tailwind conventions, implement React component loops, and parse endpoints.",
    views: 670,
    applyCount: 310,
    postedDaysAgo: 2
  },
  {
    id: "ej_29",
    _id: "ej_29",
    title: "Node.js Backend Developer",
    company: "Postman India",
    location: "Bangalore",
    salary: "2000000",
    skills: ["Node.js", "Express", "TypeScript", "Redis", "AWS"],
    apply_link: "https://postman.com/careers",
    posted_date: "1 day ago",
    source: "company",
    jobType: "full-time",
    experienceLevel: "experienced",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "SaaS",
    verified: true,
    description: "Build high-speed API mock servers and routing meshes used by twenty million developers globally. Write safe, multi-threaded typescript interfaces in Node, implement Redis structures, and scale Cloud instances.",
    views: 1800,
    applyCount: 790,
    postedDaysAgo: 1
  },
  {
    id: "ej_30",
    _id: "ej_30",
    title: "Junior Blockchain Software Developer",
    company: "Polygon Labs",
    location: "Remote",
    salary: "1400000",
    skills: ["Solidity", "Go", "Docker", "Cryptography"],
    apply_link: "https://polygon.technology/careers",
    posted_date: "4 days ago",
    source: "startup_portal",
    jobType: "remote",
    experienceLevel: "experienced",
    worklocationType: "remote",
    companySize: "mid-market",
    industry: "AI / DeepTech",
    verified: true,
    description: "Write decentralised protocol algorithms and transaction bundles. Involves Solidity EVM interactions, writing low latency helper scripts in Go, and deploying node frameworks inside Docker containers.",
    views: 1100,
    applyCount: 320,
    postedDaysAgo: 4
  },
  {
    id: "ej_31",
    _id: "ej_31",
    title: "SDE Trainee (Java Core)",
    company: "Persistent Systems",
    location: "Nagpur",
    salary: "480000",
    skills: ["Java", "SQL", "HTML", "Git"],
    apply_link: "https://persistent.com",
    posted_date: "Yesterday",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: true,
    description: "Join our Java trainee cohort in Central India. Learn to build enterprise solutions using Java programming standards, write clean SQL database entries, and collaborate via Git.",
    views: 310,
    applyCount: 154,
    postedDaysAgo: 1
  },
  {
    id: "ej_32",
    _id: "ej_32",
    title: "Data Science SDE Intern",
    company: "InMobi India",
    location: "Bangalore",
    salary: "50000",
    skills: ["Python", "Pandas", "SQL", "Machine Learning"],
    apply_link: "https://inmobi.com",
    posted_date: "Today",
    source: "linkedin",
    jobType: "internship",
    experienceLevel: "internship",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "SaaS",
    verified: true,
    description: "Tune click through conversions across digital ad boards. Write high volume data aggregation blocks in Python, manipulate structures with Pandas, and construct SQL analytical grids.",
    views: 920,
    applyCount: 410,
    postedDaysAgo: 0
  },
  {
    id: "ej_33",
    _id: "ej_33",
    title: "SDE Technical Specialist",
    company: "Zoho Corporation",
    location: "Chennai",
    salary: "850000",
    skills: ["Java", "JavaScript", "SQL", "HTML"],
    apply_link: "https://zoho.com/careers",
    posted_date: "Today",
    source: "company",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "SaaS",
    verified: true,
    description: "Formulate modules powering Zoho CRM. Code robust backends with Java, establish reliable web screens with Javascript/HTML, and optimize SQL cluster outputs.",
    views: 1200,
    applyCount: 540,
    postedDaysAgo: 0
  },
  {
    id: "ej_34",
    _id: "ej_34",
    title: "Cloud Infrastructure Engineer",
    company: "Akaike Technologies",
    location: "Coimbatore",
    salary: "720000",
    skills: ["AWS", "Docker", "Node.js", "CI/CD"],
    apply_link: "https://akaike.ai",
    posted_date: "3 days ago",
    source: "hiring_site",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "startup",
    industry: "AI / DeepTech",
    verified: true,
    description: "Manage deployment configurations for specialized medical imaging and AI services. Configure AWS pipelines, bundle backend APIs in Docker, and automate server test scripts.",
    views: 290,
    applyCount: 88,
    postedDaysAgo: 3
  },
  {
    id: "ej_35",
    _id: "ej_35",
    title: "Associate DevOps Consultant",
    company: "Mindtree Ltd",
    location: "Bhubaneswar",
    salary: "500000",
    skills: ["AWS", "Linux", "Docker", "Jenkins"],
    apply_link: "https://mindtree.com",
    posted_date: "Today",
    source: "shine",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "enterprise",
    industry: "Services",
    verified: false,
    description: "Provide deployment and operations assistance on major cloud migrations. Setup Jenkins automated build triggers, write continuous shell schedules, and spin containers.",
    views: 310,
    applyCount: 65,
    postedDaysAgo: 0
  },
  {
    id: "ej_36",
    _id: "ej_36",
    title: "Junior Data Analyst",
    company: "Swiggy",
    location: "Bangalore",
    salary: "700000",
    skills: ["SQL", "Python", "Excel", "Tableau"],
    apply_link: "https://careers.swiggy.com",
    posted_date: "Today",
    source: "linkedin",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "hybrid",
    companySize: "enterprise",
    industry: "E-commerce",
    verified: true,
    description: "Analyze food ordering trends, delivery routing efficiencies, and customer feedback metrics. Create complex SQL queries and tables, construct stunning interactive dashboards in Tableau, and build Python scripts for statistical analysis.",
    views: 480,
    applyCount: 195,
    postedDaysAgo: 0
  },
  {
    id: "ej_37",
    _id: "ej_37",
    title: "Product Analyst (Growth)",
    company: "Razorpay",
    location: "Mumbai",
    salary: "1100000",
    skills: ["SQL", "Python", "Analytics", "Mixpanel"],
    apply_link: "https://razorpay.com/jobs",
    posted_date: "Yesterday",
    source: "naukri",
    jobType: "full-time",
    experienceLevel: "experienced",
    worklocationType: "hybrid",
    companySize: "mid-market",
    industry: "FinTech",
    verified: true,
    description: "Support growth engineering and checkout funnel optimization teams across our payment gateways. Deep dive into user drop-off points, analyze transaction conversion funnels with SQL and Mixpanel APIs, and design data-backed validation tests in Python.",
    views: 520,
    applyCount: 140,
    postedDaysAgo: 1
  },
  {
    id: "ej_38",
    _id: "ej_38",
    title: "Data Analyst - Operations",
    company: "Zepto",
    location: "Mumbai",
    salary: "650000",
    skills: ["SQL", "Excel", "PowerBI", "Analytics"],
    apply_link: "https://www.zepto.co/careers",
    posted_date: "Yesterday",
    source: "company",
    jobType: "full-time",
    experienceLevel: "fresher",
    worklocationType: "on-site",
    companySize: "mid-market",
    industry: "AI / DeepTech",
    verified: true,
    description: "Optimize last-mile delivery wait times, driver transit times, and micro-warehouse storage capacity. Write robust analytical PostgreSQL scripts, design beautiful delivery density trackers on PowerBI, and manipulate logistics dataset metrics.",
    views: 390,
    applyCount: 112,
    postedDaysAgo: 1
  }
];

// ----------------------------------------------------------------------------
// ATS SCORE + FEEDBACK ENGINE
// ----------------------------------------------------------------------------
export interface MatchReport {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedPreferences: string[];
  missingPreferences: string[];
  feedbackList: string[];
}

export function computeATSScore(job: Job, userSkills: string[], userPrefs?: {
  targetRoles?: string[];
  targetLocations?: string[];
  preferredJobType?: string;
}): MatchReport {
  const normalizedUserSkills = userSkills.map(s => s.toLowerCase());
  const jobSkills = job.skills;

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  // Match skills with synonym support
  for (const skill of jobSkills) {
    const sl = skill.toLowerCase();
    
    // Exact or partial check
    const hasExact = normalizedUserSkills.some(us => us.includes(sl) || sl.includes(us));
    
    // Synonym check
    let hasSynonym = false;
    for (const key of Object.keys(SYNONYM_MAP)) {
      if (sl.includes(key) || key.includes(sl)) {
        const syns = SYNONYM_MAP[key];
        if (syns.some(syn => normalizedUserSkills.includes(syn))) {
          hasSynonym = true;
          break;
        }
      }
    }

    if (hasExact || hasSynonym) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Basic skill math
  const skillWeight = jobSkills.length > 0 ? (matchedSkills.length / jobSkills.length) * 60 : 60;

  // Align Preferences
  const matchedPreferences: string[] = [];
  const missingPreferences: string[] = [];
  let prefWeight = 0;

  if (userPrefs) {
    // 1. Job Type
    if (userPrefs.preferredJobType) {
      if (userPrefs.preferredJobType === "any" || job.jobType === userPrefs.preferredJobType) {
        matchedPreferences.push(`Engagement: ${job.jobType}`);
        prefWeight += 15;
      } else {
        missingPreferences.push(`Desired engagement: ${userPrefs.preferredJobType}`);
      }
    }

    // 2. Location
    if (userPrefs.targetLocations && userPrefs.targetLocations.length > 0) {
      const isLocMatch = userPrefs.targetLocations.some(
        loc => loc.toLowerCase() === "remote" || 
               job.location.toLowerCase() === loc.toLowerCase() ||
               job.worklocationType === "remote"
      );
      if (isLocMatch) {
         matchedPreferences.push(`Location: ${job.location}`);
         prefWeight += 15;
      } else {
         missingPreferences.push(`Locations desired: ${userPrefs.targetLocations.join(", ")}`);
      }
    } else {
      prefWeight += 15;
    }

    // 3. User Target Role alignment
    if (userPrefs.targetRoles && userPrefs.targetRoles.length > 0) {
      const isRoleMatch = userPrefs.targetRoles.some(
        role => job.title.toLowerCase().includes(role.toLowerCase()) || 
               role.toLowerCase().includes(job.title.toLowerCase())
      );
      if (isRoleMatch) {
         matchedPreferences.push(`Role context matched`);
         prefWeight += 10;
      } else {
         missingPreferences.push(`Target role mismatch`);
      }
    } else {
      prefWeight += 10;
    }
  } else {
    prefWeight = 40;
  }

  const finalScore = Math.round(skillWeight + prefWeight);
  
  // Dynamic Recruiter feedback
  const feedbackList: string[] = [];
  if (missingSkills.length > 0) {
    feedbackList.push(`Inject ${missingSkills.slice(0, 2).join(" and ")} prominently in your projects summary to clear ATS filters.`);
  } else {
    feedbackList.push("Stellar CV overlap! This resume is 100% compliant for immediate technical routing.");
  }

  if (job.verified) {
    feedbackList.push("Verified recruitment pipeline. Direct referrals available via on-campus coordination sheets.");
  }

  if (job.postedDaysAgo === 0) {
    feedbackList.push("Hot post! Applying inside 12 hours improves contact rates by near 4x on Indian platforms.");
  }

  return {
    score: Math.min(100, Math.max(25, finalScore)),
    matchedSkills,
    missingSkills,
    matchedPreferences,
    missingPreferences,
    feedbackList
  };
}

// Advice card details generator
export function getAIResumeBoosterAdvice(job: Job, userSkills: string[]): {
  bulletPointIdea: string;
  missingSkillsSuggestion: string;
  structuralTip: string;
} {
  const missing = job.skills.filter(s => !userSkills.map(us => us.toLowerCase()).some(us => us.includes(s.toLowerCase()) || s.toLowerCase().includes(us)));
  
  const bulletPointIdea = `
    "Streamlined ${job.company}'s transaction and service pipeline by deploying customized ${job.skills[0] || "React"} APIs, improving performance benchmarks by ~22% other metrics."
  `.trim();

  const missingSkillsSuggestion = missing.length > 0 
    ? `Implement a short mock project highlighting: "${missing.join(", ")}" and call it out in your core Experience card.` 
    : "Your skill alignment is complete. Focus on highlighting quantitative metrics to boost interviews.";

  const structuralTip = `Tailor your CV header explicitly to "${job.title.replace(/\(.*\)/, "").trim()}" instead of general terms so automated parsers trigger higher initial screening priority.`;

  return {
    bulletPointIdea,
    missingSkillsSuggestion,
    structuralTip
  };
}

export function getRecommendedJobs(
  allJobs: Job[], 
  userSkills: string[], 
  savedJobIds: string[], 
  recentSearches: string[]
): Job[] {
  const scored = allJobs.map(job => {
    const scoreReport = computeATSScore(job, userSkills);
    
    let bonus = 0;
    if (savedJobIds.includes(job.id)) {
      bonus += 20;
    }

    const queryRelevance = recentSearches.some(term => 
      job.title.toLowerCase().includes(term.toLowerCase()) ||
      job.company.toLowerCase().includes(term.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(term.toLowerCase()))
    );

    if (queryRelevance) {
      bonus += 15;
    }

    return {
      job,
      totalScore: scoreReport.score + bonus
    };
  });

  return scored
    .sort((a, b) => b.totalScore - a.totalScore)
    .map(obj => obj.job)
    .slice(0, 4);
}
