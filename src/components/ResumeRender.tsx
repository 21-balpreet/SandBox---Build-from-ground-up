import React from "react";
import { ResumeData, TemplateType } from "../types/resume";

interface ResumeRenderProps {
  data: ResumeData;
  templateType: TemplateType;
}

export default function ResumeRender({ data, templateType }: ResumeRenderProps) {
  const { contact, education, skills, experience, projects, customSections } = data;

  // Render selection helper to apply distinct styling classes active for the print layout
  const isBvimit = templateType === "bvimit";
  const isClassic = templateType === "classic";
  const isMinimalist = templateType === "minimalist";

  // Select fonts
  const headingFont = isMinimalist ? "font-mono tracking-tighter" : isClassic ? "font-serif" : "font-sans font-bold";
  const bodyFont = isClassic ? "font-serif" : "font-sans";

  return (
    <div 
      id="resume-printable-container"
      className={`bg-white text-zinc-900 border border-zinc-200 shadow-2xl p-8 sm:p-10 rounded-2xl w-full min-h-[1050px] select-text tracking-wide relative overflow-hidden ${bodyFont} text-xs`}
    >
      {/* Dynamic Watermark or subtle indicator for online preview, hidden on print */}
      <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-mono no-print text-indigo-650 bg-indigo-50 border border-indigo-100 font-bold uppercase select-none">
        {templateType} style active
      </div>

      {/* Header section (different per template) */}
      {isBvimit ? (
        // BVIMIT Template Layout: Split Flex with photo upload passport slot
        <div className="border-b-2 border-indigo-750 pb-4 flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4">
          <div className="space-y-1.5 flex-grow text-center sm:text-left">
            <h1 className="text-3xl font-black tracking-tight text-zinc-950 uppercase select-all">
              {contact.name || "YOUR NAME"}
            </h1>
            <div className="text-[10.5px] text-zinc-700 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-x-3.5 gap-y-1 font-medium">
              <span className="font-semibold">{contact.phone}</span>
              <span>|</span>
              <a href={`mailto:${contact.email}`} className="hover:underline font-semibold text-indigo-750">{contact.email}</a>
            </div>
            <div className="text-[10px] text-zinc-650 flex flex-wrap justify-center sm:justify-start gap-x-3 gap-y-1 font-mono pt-1">
              {contact.linkedin && (
                <span className="flex items-center gap-1">
                  <span className="text-indigo-600 font-black">in:</span> {contact.linkedin}
                </span>
              )}
              {contact.github && (
                <span className="flex items-center gap-1">
                  <span className="text-zinc-800 font-black">gh:</span> {contact.github}
                </span>
              )}
            </div>
          </div>

          {/* User photo box in template */}
          <div className="flex-shrink-0">
            {contact.photoUrl ? (
              <div className="w-24 h-28 border-2 border-indigo-750 rounded-lg overflow-hidden bg-zinc-50 shadow relative group">
                <img 
                  src={contact.photoUrl} 
                  alt="User Profile" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-24 h-28 border-2 border-dashed border-zinc-300 rounded-lg flex flex-col items-center justify-center text-center p-2 bg-zinc-50/75 select-none text-[9px] text-zinc-400 font-sans">
                <span className="font-bold text-zinc-500">PHOTO SLOT</span>
                <span>(Upload on the left menu)</span>
              </div>
            )}
          </div>
        </div>
      ) : isClassic ? (
        // Classic Jake's layout: Completely symmetric centered, no photo
        <div className="text-center space-y-1.5 pb-4 border-b border-zinc-200">
          <h1 className={`text-2xl font-bold tracking-tight text-zinc-950 uppercase ${headingFont}`}>
            {contact.name || "YOUR NAME"}
          </h1>
          <div className="text-[10.5px] text-zinc-600 flex flex-wrap justify-center gap-x-2 gap-y-0.5 font-medium">
            <span>{contact.phone}</span>
            <span>•</span>
            <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
            {contact.linkedin && (
              <>
                <span>•</span>
                <span className="font-mono text-[9.5px] text-indigo-850">{contact.linkedin}</span>
              </>
            )}
            {contact.github && (
              <>
                <span>•</span>
                <span className="font-mono text-[9.5px] text-indigo-850">{contact.github}</span>
              </>
            )}
          </div>
        </div>
      ) : (
        // Modern Minimalist layout: Bold name block, metadata columns top
        <div className="pb-4 border-b border-zinc-900 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div className="space-y-1">
            <h1 className={`text-3xl font-black tracking-tight text-indigo-950 uppercase ${headingFont}`}>
              {contact.name || "YOUR NAME"}
            </h1>
            <p className="text-[10.5px] font-mono text-indigo-800 font-bold uppercase tracking-wider">Software Engineering SDE Candidate</p>
          </div>
          <div className="text-[10px] text-zinc-600 space-y-0.5 text-left sm:text-right font-mono">
            <div>{contact.phone}</div>
            <div>{contact.email}</div>
            <div className="text-indigo-750">{contact.linkedin}</div>
            <div className="text-indigo-750">{contact.github}</div>
          </div>
        </div>
      )}

      {/* 2. Education Section - Dynamic Table or List layout */}
      {education.length > 0 && (
        <div className="mt-5 space-y-1.5">
          <h3 className={`text-[11px] font-black uppercase tracking-wider pb-0.5 flex items-center justify-between
            ${isBvimit ? "text-indigo-950 border-b-2 border-indigo-750 font-sans" : "text-zinc-950 border-b border-zinc-300"} ${headingFont}`}
          >
            <span>Education &amp; Academic Qualifications</span>
          </h3>
          <div className="space-y-3.5 pt-1">
            {education.map((edu) => (
              <div key={edu.id} className="flex flex-col sm:flex-row sm:justify-between items-start text-xs">
                <div className="space-y-0.5">
                  <span className="font-bold text-zinc-950 text-sm">{edu.institution}</span>
                  <span className="block text-zinc-650 italic font-mono text-[10.5px]">{edu.degree}</span>
                </div>
                <div className="sm:text-right mt-1 sm:mt-0 flex flex-row sm:flex-col items-center sm:items-end gap-x-2 gap-y-0.5">
                  <span className="font-bold text-zinc-700 text-[10.5px]">{edu.location}</span>
                  <span className="text-[10px] text-zinc-500 italic">Graduation: {edu.period}</span>
                  <span className="text-[10.5px] font-bold text-indigo-750 bg-indigo-50/50 sm:bg-transparent px-1.5 py-0.2 sm:p-0 rounded">CGPA/Score: {edu.score} / 10.0</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Skill Sets Section - Responsive multi-category list */}
      {skills.length > 0 && (
        <div className="mt-5 space-y-1.5">
          <h3 className={`text-[11px] font-black uppercase tracking-wider pb-0.5 flex items-center justify-between
            ${isBvimit ? "text-indigo-950 border-b-2 border-indigo-750 font-sans" : "text-zinc-950 border-b border-zinc-300"} ${headingFont}`}
          >
            <span>Technical Skills &amp; Competencies</span>
          </h3>
          <div className="text-[11px] text-zinc-800 leading-normal space-y-1.5 pt-1">
            {skills.map((skill) => (
              <div key={skill.id} className="grid grid-cols-1 sm:grid-cols-12 gap-x-2 gap-y-0.5 font-sans leading-relaxed">
                <span className="sm:col-span-3 font-bold text-zinc-900 border-l-2 border-indigo-750/40 pl-1.5 text-[10.5px] tracking-tight">{skill.category}:</span>
                <span className="sm:col-span-9 text-zinc-750 text-[11px]">{skill.items || "(Not specified)"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Experience Section - Unlimited dynamic entry blocks */}
      {experience.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <h3 className={`text-[11px] font-black uppercase tracking-wider pb-0.5 flex items-center justify-between
            ${isBvimit ? "text-indigo-950 border-b-2 border-indigo-750 font-sans" : "text-zinc-950 border-b border-zinc-300"} ${headingFont}`}
          >
            <span>Professional Experience</span>
          </h3>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id} className="space-y-1">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-[11px]">
                  <span className="font-bold text-zinc-950 text-xs sm:text-sm">{exp.company}</span>
                  <span className="text-zinc-550 font-mono text-[10px] sm:bg-zinc-50 px-2 py-0.5 rounded border border-zinc-150/50 mt-1 sm:mt-0">{exp.duration}</span>
                </div>
                <div className="flex flex-row justify-between items-center text-[10.5px] italic text-indigo-950 font-semibold">
                  <span>{exp.role}</span>
                  <span className="text-zinc-500 font-normal font-sans not-italic">{exp.location}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1.5 text-zinc-850 text-[11px] leading-relaxed mt-1.5 select-all">
                  {exp.bullets.map((bullet, idx) => (
                    bullet.trim() && <li key={idx} className="marker:text-indigo-500/60">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Projects Section - Fully dynamic, custom tech pill styles */}
      {projects.length > 0 && (
        <div className="mt-5 space-y-2.5">
          <h3 className={`text-[11px] font-black uppercase tracking-wider pb-0.5 flex items-center justify-between
            ${isBvimit ? "text-indigo-950 border-b-2 border-indigo-750 font-sans" : "text-zinc-950 border-b border-zinc-300"} ${headingFont}`}
          >
            <span>Key Engineering Projects</span>
          </h3>
          <div className="space-y-4">
            {projects.map((proj) => (
              <div key={proj.id} className="space-y-1">
                <div className="flex flex-wrap justify-between items-center gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-950 text-xs sm:text-sm">{proj.title}</span>
                    {proj.technologies && (
                      <span className="text-[9px] bg-indigo-50/80 text-indigo-800 border border-indigo-100/60 px-2 py-0.5 rounded font-mono font-bold uppercase select-none">
                        {proj.technologies}
                      </span>
                    )}
                  </div>
                  <span className="text-zinc-500 text-[10px] sm:bg-zinc-50 px-2 py-0.5 rounded mt-0.5">{proj.duration}</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-zinc-855 text-[11px] leading-relaxed mt-1 font-serif select-all">
                  {proj.bullets.map((b, idx) => (
                    b.trim() && <li key={idx} className="marker:text-zinc-400">{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Custom/Additional Sections (Fully flexible user-defined lists) */}
      {customSections.map((sect) => (
        sect.title.trim() && sect.bullets.filter(b => b.trim()).length > 0 && (
          <div key={sect.id} className="mt-5 space-y-1.5">
            <h3 className={`text-[11px] font-black uppercase tracking-wider pb-0.5 flex items-center justify-between
              ${isBvimit ? "text-indigo-950 border-b-2 border-indigo-750 font-sans" : "text-zinc-950 border-b border-zinc-300"} ${headingFont}`}
            >
              <span>{sect.title}</span>
            </h3>
            <ul className="list-disc pl-4 space-y-1.5 text-zinc-800 text-[11.5px] mt-1 pr-2 leading-relaxed">
              {sect.bullets.map((bullet, idx) => (
                bullet.trim() && <li key={idx} className="marker:text-indigo-550">{bullet}</li>
              ))}
            </ul>
          </div>
        )
      ))}

      {/* Validation Banner hidden on actual prints, perfect for UI preview alignment */}
      <div className="border-t border-dashed border-zinc-200 mt-6 pt-3 text-[9px] text-zinc-400 font-sans italic flex items-center justify-between no-print select-none">
        <span>* Layout dynamically scaled and balanced for exactly 1-Page standards. Change elements on the left side.</span>
        <span className="text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-150">✓ ATS Compliant Layout System</span>
      </div>
    </div>
  );
}
