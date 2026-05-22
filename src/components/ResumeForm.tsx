import React, { useRef } from "react";
import { ResumeData, EducationEntry, ExperienceEntry, ProjectEntry, SkillCategory, CustomSection, TemplateType } from "../types/resume";
import { 
  Plus, Trash2, Copy, MoveUp, MoveDown, Image, Sparkles, User, GraduationCap, Code, Briefcase, FileText 
} from "lucide-react";
import { toast } from "sonner";

interface ResumeFormProps {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  templateType: TemplateType;
  setTemplateType: (tmpl: TemplateType) => void;
}

export default function ResumeForm({ data, setData, templateType, setTemplateType }: ResumeFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper routines to update deeply-nested state safely
  const updateContact = (fields: Partial<ResumeData["contact"]>) => {
    setData(prev => ({
      ...prev,
      contact: { ...prev.contact, ...fields }
    }));
  };

  // 1. Photo File Converter
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG/JPEG)!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      updateContact({ photoUrl: base64 });
      toast.success("Passport photo uploaded successfully!");
    };
    reader.onerror = () => {
      toast.error("Failed to read image data.");
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    updateContact({ photoUrl: "" });
    toast.success("Passport photo removed!");
  };

  // 2. Generic list manipulation helper
  const addListEntry = <K extends "education" | "experience" | "projects" | "skills" | "customSections">(
    key: K,
    defaultVal: any
  ) => {
    setData(prev => ({
      ...prev,
      [key]: [...(prev[key] as any[]), defaultVal]
    }));
    toast.success(`Position added inside section.`);
  };

  const duplicateEntry = <K extends "education" | "experience" | "projects" | "skills" | "customSections">(
    key: K,
    index: number
  ) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      const copy = { ...list[index], id: `${key}-${Date.now()}` };
      list.splice(index + 1, 0, copy);
      return { ...prev, [key]: list };
    });
    toast.success("Entry duplicated!");
  };

  const deleteEntry = <K extends "education" | "experience" | "projects" | "skills" | "customSections">(
    key: K,
    index: number
  ) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      list.splice(index, 1);
      return { ...prev, [key]: list };
    });
    toast.success("Entry removed.");
  };

  const moveOrder = <K extends "education" | "experience" | "projects" | "skills" | "customSections">(
    key: K,
    index: number,
    direction: "up" | "down"
  ) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      const target = index + (direction === "up" ? -1 : 1);
      if (target >= 0 && target < list.length) {
        const temp = list[index];
        list[index] = list[target];
        list[target] = temp;
      }
      return { ...prev, [key]: list };
    });
  };

  // Bullet items editors within subblocks (experience, projects, custom sections)
  const addBulletPoint = (key: "experience" | "projects" | "customSections", index: number) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      list[index] = { ...list[index], bullets: [...list[index].bullets, ""] };
      return { ...prev, [key]: list };
    });
  };

  const updateBulletPoint = (
    key: "experience" | "projects" | "customSections",
    entryIndex: number,
    bulletIndex: number,
    val: string
  ) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      const bullets = [...list[entryIndex].bullets];
      bullets[bulletIndex] = val;
      list[entryIndex] = { ...list[entryIndex], bullets };
      return { ...prev, [key]: list };
    });
  };

  const deleteBulletPoint = (
    key: "experience" | "projects" | "customSections",
    entryIndex: number,
    bulletIndex: number
  ) => {
    setData(prev => {
      const list = [...(prev[key] as any[])];
      const bullets = [...list[entryIndex].bullets];
      bullets.splice(bulletIndex, 1);
      list[entryIndex] = { ...list[entryIndex], bullets };
      return { ...prev, [key]: list };
    });
  };

  return (
    <div className="space-y-6 text-xs">
      
      {/* Template selection tool dropdown box */}
      <div className="bg-zinc-950 border border-zinc-850 p-4 rounded-2xl space-y-2.5">
        <label className="text-zinc-400 font-bold tracking-wider uppercase text-[10px] block">
          Select Visual Resume Template Layout
        </label>
        <select 
          value={templateType} 
          onChange={(e) => {
            setTemplateType(e.target.value as TemplateType);
            toast.success(`Selected Layout Preset: ${e.target.value.toUpperCase()}`);
          }}
          className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-white text-xs font-bold outline-none ring-1 ring-zinc-805 cursor-pointer hover:bg-zinc-850 transition-all"
        >
          <option value="bvimit">📋 BVIMIT Template Format (With Passport Photo Slot)</option>
          <option value="classic">🏛️ Classic SDE Format (Centered / Symmetric Jake's style)</option>
          <option value="minimalist font-sans">⚡ Modern Minimalist Layout (Sleek Typography &amp; Space)</option>
        </select>
        <p className="text-[10px] text-zinc-500 italic leading-relaxed">
          {templateType === "bvimit" 
            ? "💡 BVIMIT is highly requested for Indian engineering colleges. Upload your passport photo below to sit elegantly in the top-right head!"
            : "🏛️ Jake's classic serif format is perfectly suited for ATS automated scan pipelines without photos."
          }
        </p>
      </div>

      {/* 1. Contact & Coordinate fields */}
      <div className="space-y-3.5 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <span className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
          <User className="w-3.5 h-3.5" />
          <span>1. Contact Channels &amp; Avatar</span>
        </span>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-zinc-500 font-sans">Full Name</label>
            <input
              type="text"
              value={data.contact.name}
              onChange={(e) => updateContact({ name: e.target.value.toUpperCase() })}
              placeholder="e.g. AMIT SHARMA"
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-white mt-1 outline-none focus:border-zinc-700 font-bold"
            />
          </div>
          <div>
            <label className="text-zinc-500">Email Address</label>
            <input
              type="email"
              value={data.contact.email}
              onChange={(e) => updateContact({ email: e.target.value })}
              placeholder="amit.sharma.cse26@dtu.co.in"
              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-white mt-1 outline-none focus:border-zinc-700"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div>
            <label className="text-zinc-500 text-[10px]">Phone Number</label>
            <input
              type="text"
              value={data.contact.phone}
              onChange={(e) => updateContact({ phone: e.target.value })}
              placeholder="+91 98765 43210"
              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white mt-1 outline-none focus:border-zinc-700 font-semibold"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-[10px]">LinkedIn URL</label>
            <input
              type="text"
              value={data.contact.linkedin}
              onChange={(e) => updateContact({ linkedin: e.target.value })}
              placeholder="linkedin.com/in/amit"
              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white mt-1 outline-none text-xs"
            />
          </div>
          <div>
            <label className="text-zinc-500 text-[10px]">GitHub Username</label>
            <input
              type="text"
              value={data.contact.github}
              onChange={(e) => updateContact({ github: e.target.value })}
              placeholder="github.com/amit-dev"
              className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white mt-1 outline-none text-xs"
            />
          </div>
        </div>

        {/* Dynamic Image Upload Widget */}
        <div className="border border-zinc-800/80 bg-zinc-950 p-3.5 rounded-xl flex items-center justify-between mt-2.5 gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-300 block flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-indigo-400" />
              <span>Passport Photo Box</span>
            </span>
            <p className="text-[10px] text-zinc-500 leading-normal">
              Highly recommended for the loaded BVIMIT template. Supported files: JPG, PNG.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
            />
            {data.contact.photoUrl ? (
              <div className="flex items-center gap-2">
                <img 
                  src={data.contact.photoUrl} 
                  alt="Review upload" 
                  className="w-10 h-10 object-cover rounded border border-zinc-750" 
                  referrerPolicy="no-referrer"
                />
                <button 
                  type="button" 
                  onClick={removePhoto}
                  className="bg-zinc-900 border border-zinc-800 hover:border-rose-900 hover:text-rose-450 p-2 rounded text-[10px] font-bold text-zinc-400 cursor-pointer"
                >
                  Clear Photo
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-900/20 text-indigo-300 px-3 py-2 rounded-lg text-[10px] font-bold cursor-pointer font-sans"
              >
                Upload Profile Photo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Education section - FULLY UNRESTRICTED */}
      <div className="space-y-4 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>2. Academic Records</span>
          </span>
          <button
            type="button"
            onClick={() => addListEntry("education", {
              id: `edu-${Date.now()}`,
              institution: "New College Name",
              degree: "Degree / Course Title",
              score: "9.0",
              period: "Aug 2024 - May 2028",
              location: "City, Country"
            })}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-400 px-2.5 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Institution
          </button>
        </div>

        {data.education.map((edu, idx) => (
          <div key={edu.id} className="p-3 bg-zinc-950 rounded-xl space-y-3 relative border border-zinc-850/50">
            {/* Control Actions bar */}
            <div className="absolute top-2 right-2 flex items-center space-x-1.5 no-print">
              <button type="button" onClick={() => moveOrder("education", idx, "up")} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => moveOrder("education", idx, "down")} disabled={idx === data.education.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
              <button type="button" onClick={() => duplicateEntry("education", idx)} className="text-zinc-400 hover:text-white"><Copy className="w-3 h-3" /></button>
              <button type="button" onClick={() => deleteEntry("education", idx)} className="text-zinc-500 hover:text-rose-450"><Trash2 className="w-3 h-3" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-zinc-500">Institution Name</label>
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => {
                    const list = [...data.education];
                    list[idx].institution = e.target.value;
                    setData({ ...data, education: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-500">Location</label>
                <input
                  type="text"
                  value={edu.location}
                  onChange={(e) => {
                    const list = [...data.education];
                    list[idx].location = e.target.value;
                    setData({ ...data, education: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-zinc-500 text-[10px]">Degree, Stream &amp; Classification</label>
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => {
                    const list = [...data.education];
                    list[idx].degree = e.target.value;
                    setData({ ...data, education: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none text-xs"
                />
              </div>
              <div>
                <label className="text-zinc-500 text-[10px]">CGPA / Score</label>
                <input
                  type="text"
                  value={edu.score}
                  onChange={(e) => {
                    const list = [...data.education];
                    list[idx].score = e.target.value;
                    setData({ ...data, education: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1">
              <div>
                <label className="text-zinc-500 text-[10px]">Academic Duration / Completion Period</label>
                <input
                  type="text"
                  value={edu.period}
                  onChange={(e) => {
                    const list = [...data.education];
                    list[idx].period = e.target.value;
                    setData({ ...data, education: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none text-xs"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Skill categories section - FULLY UNRESTRICTED */}
      <div className="space-y-4 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Code className="w-3.5 h-3.5" />
            <span>3. Technical Skill Sets</span>
          </span>
          <button
            type="button"
            onClick={() => addListEntry("skills", {
              id: `skill-${Date.now()}`,
              category: "Cloud platforms",
              items: "AWS, Docker, Jenkins"
            })}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-400 px-2.5 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Category
          </button>
        </div>

        {data.skills.map((skill, idx) => (
          <div key={skill.id} className="p-3 bg-zinc-950 rounded-xl space-y-2 relative border border-zinc-850/50">
            <div className="absolute top-2 right-2 flex items-center space-x-1.5 no-print">
              <button type="button" onClick={() => moveOrder("skills", idx, "up")} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => moveOrder("skills", idx, "down")} disabled={idx === data.skills.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
              <button type="button" onClick={() => deleteEntry("skills", idx)} className="text-zinc-500 hover:text-rose-450"><Trash2 className="w-3 h-3" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2">
              <div className="md:col-span-4">
                <label className="text-zinc-500 text-[10px]">Category Title</label>
                <input
                  type="text"
                  value={skill.category}
                  onChange={(e) => {
                    const list = [...data.skills];
                    list[idx].category = e.target.value;
                    setData({ ...data, skills: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-0.5 outline-none font-bold"
                />
              </div>
              <div className="md:col-span-8">
                <label className="text-zinc-500 text-[10px]">Keywords (comma separated)</label>
                <input
                  type="text"
                  value={skill.items}
                  onChange={(e) => {
                    const list = [...data.skills];
                    list[idx].items = e.target.value;
                    setData({ ...data, skills: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-0.5 outline-none font-mono text-[10.5px]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Experience block - UNRESTRICTED COUNT & BULLETS */}
      <div className="space-y-4 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>4. Works Experience</span>
          </span>
          <button
            type="button"
            onClick={() => addListEntry("experience", {
              id: `exp-${Date.now()}`,
              company: "Innovations Inc",
              role: "SDE Advocate",
              duration: "May 2024 - Present",
              location: "Remote, India",
              bullets: ["Created responsive REST routing microservices under express clusters.", "Authored automated systems test workflows."]
            })}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-400 px-2.5 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Employer
          </button>
        </div>

        {data.experience.map((exp, idx) => (
          <div key={exp.id} className="p-3.5 bg-zinc-950 rounded-xl space-y-3 relative border border-zinc-855">
            <div className="absolute top-2 right-2 flex items-center space-x-1.5 no-print">
              <button type="button" onClick={() => moveOrder("experience", idx, "up")} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => moveOrder("experience", idx, "down")} disabled={idx === data.experience.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
              <button type="button" onClick={() => duplicateEntry("experience", idx)} className="text-zinc-450 hover:text-white"><Copy className="w-3 h-3" /></button>
              <button type="button" onClick={() => deleteEntry("experience", idx)} className="text-zinc-500 hover:text-rose-450"><Trash2 className="w-3 h-3" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-zinc-500">Company / Employer Name</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => {
                    const list = [...data.experience];
                    list[idx].company = e.target.value;
                    setData({ ...data, experience: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-zinc-500">Role / Job Title</label>
                <input
                  type="text"
                  value={exp.role}
                  onChange={(e) => {
                    const list = [...data.experience];
                    list[idx].role = e.target.value;
                    setData({ ...data, experience: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-zinc-500">Duration Period</label>
                <input
                  type="text"
                  value={exp.duration}
                  onChange={(e) => {
                    const list = [...data.experience];
                    list[idx].duration = e.target.value;
                    setData({ ...data, experience: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none"
                />
              </div>
              <div>
                <label className="text-zinc-500">Office Location</label>
                <input
                  type="text"
                  value={exp.location}
                  onChange={(e) => {
                    const list = [...data.experience];
                    list[idx].location = e.target.value;
                    setData({ ...data, experience: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none"
                />
              </div>
            </div>

            {/* Bullets lists - completely expandable */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex justify-between items-center text-[10px]">
                <label className="text-zinc-400 font-bold">Bullet Metrics Achievements</label>
                <button
                  type="button"
                  onClick={() => addBulletPoint("experience", idx)}
                  className="text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" /> Add Bullet Achievement
                </button>
              </div>
              <div className="space-y-1.5">
                {exp.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-1 items-start">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBulletPoint("experience", idx, bulletIdx, e.target.value)}
                      placeholder="e.g. Developed and optimized responsive user interface components."
                      className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteBulletPoint("experience", idx, bulletIdx)}
                      className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 p-2 rounded text-zinc-500 hover:text-rose-450 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Projects section - UNRESTRICTED COUNT & BULLETS */}
      <div className="space-y-4 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" />
            <span>5. Technical Projects</span>
          </span>
          <button
            type="button"
            onClick={() => addListEntry("projects", {
              id: `proj-${Date.now()}`,
              title: "Social Decentralized App",
              technologies: "Solidity, React, Ethers.js",
              duration: "Nov 2025 - Dec 2025",
              bullets: ["Constructed smart contract validations for transaction limits.", "Integrated user meta wallet connections."]
            })}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-400 px-2.5 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> Add Project
          </button>
        </div>

        {data.projects.map((proj, idx) => (
          <div key={proj.id} className="p-3.5 bg-zinc-950 rounded-xl space-y-3 relative border border-zinc-855">
            <div className="absolute top-2 right-2 flex items-center space-x-1.5 no-print">
              <button type="button" onClick={() => moveOrder("projects", idx, "up")} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => moveOrder("projects", idx, "down")} disabled={idx === data.projects.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
              <button type="button" onClick={() => duplicateEntry("projects", idx)} className="text-zinc-450 hover:text-white"><Copy className="w-3 h-3" /></button>
              <button type="button" onClick={() => deleteEntry("projects", idx)} className="text-zinc-500 hover:text-rose-450"><Trash2 className="w-3 h-3" /></button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-zinc-500">Project Title</label>
                <input
                  type="text"
                  value={proj.title}
                  onChange={(e) => {
                    const list = [...data.projects];
                    list[idx].title = e.target.value;
                    setData({ ...data, projects: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none font-bold"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-zinc-500">Duration Period</label>
                <input
                  type="text"
                  value={proj.duration}
                  onChange={(e) => {
                    const list = [...data.projects];
                    list[idx].duration = e.target.value;
                    setData({ ...data, projects: list });
                  }}
                  className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-zinc-500 block text-[10px]">Technologies Used (e.g. AWS, Node, React)</label>
              <input
                type="text"
                value={proj.technologies}
                onChange={(e) => {
                  const list = [...data.projects];
                  list[idx].technologies = e.target.value;
                  setData({ ...data, projects: list });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1 outline-none font-mono text-indigo-300 font-bold"
              />
            </div>

            {/* Bullets lists - completely expandable */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <div className="flex justify-between items-center text-[10px]">
                <label className="text-zinc-400 font-bold">Bullet Metrics Tech Achievements</label>
                <button
                  type="button"
                  onClick={() => addBulletPoint("projects", idx)}
                  className="text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer font-bold"
                >
                  <Plus className="w-3 h-3" /> Add Project Bullet
                </button>
              </div>
              <div className="space-y-1.5">
                {proj.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-1 items-start">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBulletPoint("projects", idx, bulletIdx, e.target.value)}
                      placeholder="e.g. Engineered asynchronous task managers which routed API requests."
                      className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteBulletPoint("projects", idx, bulletIdx)}
                      className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 p-2 rounded text-zinc-500 hover:text-rose-450 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 6. Dynamic Custom sections section - ADD & DELETE ACTIVE */}
      <div className="space-y-4 bg-zinc-900/10 border border-zinc-850 p-4.5 rounded-2xl">
        <div className="flex justify-between items-center pb-1 border-b border-zinc-850">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>6. Add custom Sections</span>
          </span>
          <button
            type="button"
            onClick={() => addListEntry("customSections", {
              id: `custom-${Date.now()}`,
              title: "Achievements & Leadership",
              bullets: ["Elected class representative.", "Stated core values as leader."]
            })}
            className="bg-zinc-950 border border-zinc-800 hover:border-zinc-750 text-indigo-400 px-2.5 py-1 text-[10px] rounded-lg font-bold flex items-center gap-1 cursor-pointer font-sans"
          >
            <Plus className="w-3 h-3" /> Add Section
          </button>
        </div>

        {data.customSections.map((section, idx) => (
          <div key={section.id} className="p-3.5 bg-zinc-950 rounded-xl space-y-3 relative border border-indigo-900/10">
            <div className="absolute top-2 right-2 flex items-center space-x-1.5 no-print">
              <button type="button" onClick={() => moveOrder("customSections", idx, "up")} disabled={idx === 0} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
              <button type="button" onClick={() => moveOrder("customSections", idx, "down")} disabled={idx === data.customSections.length - 1} className="text-zinc-500 hover:text-white disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
              <button type="button" onClick={() => deleteEntry("customSections", idx)} className="text-zinc-500 hover:text-rose-450"><Trash2 className="w-3 h-3" /></button>
            </div>

            <div>
              <label className="text-zinc-500 text-[10px]">Custom Section Title (e.g. Certifications, Awards, Activities)</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => {
                  const list = [...data.customSections];
                  list[idx].title = e.target.value;
                  setData({ ...data, customSections: list });
                }}
                className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white mt-1.5 outline-none font-bold"
              />
            </div>

            {/* Expandable bullet list inside custom section */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[10px]">
                <label className="text-zinc-400">Custom Section Items / Bullet points</label>
                <button
                  type="button"
                  onClick={() => addBulletPoint("customSections", idx)}
                  className="text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add custom Bullet point
                </button>
              </div>
              <div className="space-y-1.5">
                {section.bullets.map((bullet, bulletIdx) => (
                  <div key={bulletIdx} className="flex gap-1 items-start">
                    <input
                      type="text"
                      value={bullet}
                      onChange={(e) => updateBulletPoint("customSections", idx, bulletIdx, e.target.value)}
                      placeholder="e.g. Secured rank #1 in intra-college engineering algorithms."
                      className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded text-white text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => deleteBulletPoint("customSections", idx, bulletIdx)}
                      className="border border-zinc-800 hover:border-zinc-700 bg-zinc-900 p-2 rounded text-zinc-500 hover:text-rose-450 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
