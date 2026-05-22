import { ResumeData } from "../types/resume";

export const DEFAULT_RESUME_DATA: ResumeData = {
  contact: {
    name: "Test Drive",
    email: "amit.sharma.cse26@dtu.ac.in",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/amit-sharma",
    github: "github.com/amitsharma-dev",
    photoUrl: "" // Empty by default, user-uploaded Base64 sits here
  },
  education: [
    {
      id: "edu-1",
      institution: "Delhi Technological University (DTU)",
      degree: "B.Tech in Computer Science & Engineering",
      score: "8.8",
      period: "Aug 2022 - May 2026",
      location: "New Delhi, Delhi"
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Languages",
      items: "Java, C++, Python, JavaScript, TypeScript, SQL"
    },
    {
      id: "skill-2",
      category: "Frameworks & Systems",
      items: "React, Node.js, Express, Spring Boot, TailwindCSS, Next.js"
    },
    {
      id: "skill-3",
      category: "Developer Tools",
      items: "Git, GitHub, Docker, AWS, GCP, Redis, Linux"
    },
    {
      id: "skill-4",
      category: "Libraries & Utilities",
      items: "Redux, Mongoose, Jest, React Router, Axios"
    }
  ],
  experience: [
    {
      id: "exp-1",
      company: "Tech Mahindra",
      role: "Software Engineering Intern",
      duration: "Jan 2026 - Present",
      location: "Noida, India",
      bullets: [
        "Developed and optimized responsive user interface dashboards in React 18, accelerating cold-start loading times by 24%.",
        "Collaborated in an agile team to design and deploy robust REST API controllers yielding high throughput.",
        "Integrated robust JWT authorization middlewares across system routes to prevent unauthorized privilege access."
      ]
    },
    {
      id: "exp-2",
      company: "SDE Labs India",
      role: "Frontend Developer Trainee",
      duration: "May 2025 - Dec 2025",
      location: "Bangalore, India",
      bullets: [
        "Built complex administrative user portals in Vue.js with responsive state charts to monitor service status.",
        "Refactored legacy DOM manipulation cycles to React Hooks, shrinking bundle footprint sizes by 12%.",
        "Constructed comprehensive unit tests utilizing Jest, elevating backend coverage indicators past 88%."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      title: "SandBox SDE Dashboard Application",
      technologies: "React, TailwindCSS, TypeScript, Node.js, Express",
      duration: "Oct 2025 - Dec 2025",
      bullets: [
        "Built an intelligent off-campus SDE portal using React, featuring custom Kanban state tracker and LaTeX export compiler.",
        "Developed responsive layout systems utilizing generous negative space, sleek slate-colored dark modes, and crisp typography.",
        "Implemented custom client-side file readers utilizing PDF.js and Mammoth library streams to extract resume text locally."
      ]
    },
    {
      id: "proj-2",
      title: "Cloud-Scale Distributed Task Monitor",
      technologies: "Docker, Express, MongoDB, AWS EC2, Redis",
      duration: "Aug 2025 - Sep 2025",
      bullets: [
        "Engineered high-available background message workers with Redis clusters to handle high throughput event notifications.",
        "Deployed isolated microservice tasks in Docker containers to load-balance system requests in real-time.",
        "Configured automated data replication policies within MongoDB to guarantee high integrity backup recovery."
      ]
    }
  ],
  customSections: [
    {
      id: "custom-1",
      title: "Achievements & Certifications",
      bullets: [
        "Secured Global Rank 452 out of 15,000+ programmers in Google Kickstart Round F.",
        "Ranked top 1% among all computer engineering students in university engineering placement mocks.",
        "Certified AWS Certified Solutions Architect - Associate (Validation Code: AWS-ASA-4392)."
      ]
    }
  ]
};

// Generates LaTeX source string dynamically based on standard SDE format
export function generateLatexCode(data: ResumeData): string {
  const { contact, education, skills, experience, projects, customSections } = data;
  
  let code = `% LaTeX Resume Generated on SandBox SDE Suite
\\documentclass[letterpaper,11in]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\input{glyphtounicode}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1.0in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\pdfgentounicode=1

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape ${contact.name || "YOUR NAME"}} \\\\ \\vspace{1pt}
    \\small ${contact.phone || ""} $|$ \\href{mailto:${contact.email || ""}}{${contact.email || ""}} $|$ 
    \\href{https://${contact.linkedin || ""}}{${contact.linkedin || "linkedin.com"}} $|$
    \\href{https://${contact.github || ""}}{${contact.github || "github.com"}}
\\end{center}
`;

  // 1. Education
  if (education.length > 0) {
    code += `\n\\section{Education}\n  \\begin{itemize}[leftmargin=0.15in, label={}]\n`;
    education.forEach(edu => {
      code += `    \\resumeSubheading\n      {${edu.institution}}{${edu.location}}\n      {${edu.degree} (Score: ${edu.score})}{${edu.period}}\n`;
    });
    code += `  \\end{itemize}\n`;
  }

  // 2. Skills
  if (skills.length > 0) {
    code += `\n\\section{Technical Skills}\n \\begin{itemize}[leftmargin=0.15in, label={}]\n    \\small{\\item{\n`;
    skills.forEach(skill => {
      code += `     \\textbf{${skill.category}}{: ${skill.items}} \\\\\n`;
    });
    // Remove the trailing "\\"
    code = code.replace(/\\\\\n$/, "\n");
    code += `    }}\n \\end{itemize}\n`;
  }

  // 3. Experience
  if (experience.length > 0) {
    code += `\n\\section{Experience}\n  \\begin{itemize}[leftmargin=0.15in]\n`;
    experience.forEach(exp => {
      code += `    \\resumeSubheading\n      {${exp.company}}{${exp.location}}\n      {${exp.role}}{${exp.duration}}\n`;
      exp.bullets.forEach(bullet => {
        if (bullet.trim()) {
          code += `      \\resumeItem{${bullet}}\n`;
        }
      });
    });
    code += `  \\end{itemize}\n`;
  }

  // 4. Projects
  if (projects.length > 0) {
    code += `\n\\section{Projects}\n  \\begin{itemize}[leftmargin=0.15in]\n`;
    projects.forEach(proj => {
      code += `    \\resumeSubheading\n      {${proj.title}}{${proj.duration}}\n      {Technologies Used: ${proj.technologies}}{}\n`;
      proj.bullets.forEach(bullet => {
        if (bullet.trim()) {
          code += `      \\resumeItem{${bullet}}\n`;
        }
      });
    });
    code += `  \\end{itemize}\n`;
  }

  // 5. Custom Sections
  if (customSections.length > 0) {
    customSections.forEach(section => {
      if (section.bullets.length > 0) {
        code += `\n\\section{${section.title}}\n  \\begin{itemize}[leftmargin=0.15in]\n`;
        section.bullets.forEach(bullet => {
          if (bullet.trim()) {
            code += `    \\resumeItem{${bullet}}\n`;
          }
        });
        code += `  \\end{itemize}\n`;
      }
    });
  }

  code += `\n\\end{document}`;
  return code;
}
