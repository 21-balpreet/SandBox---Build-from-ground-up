import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { User, UserProfile, UserExperience, UserEducation } from "../types/user";
import { motion } from "motion/react";
import { User as UserIcon, Mail, Laptop, GraduationCap, MapPin, Tag, Plus, Trash2, Save, Sparkles, Building2, Calendar } from "lucide-react";
import { INDIAN_CITIES } from "../utils/constants";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateProfile } = useAuth();
  
  // Local profile states, pre-initialised with user data or placeholder defaults
  const [summary, setSummary] = useState(user?.profile?.summary || "Pre-final computer science undergrad exploring fullstack opportunities across Tier 1 startups.");
  const [skills, setSkills] = useState<string[]>(user?.profile?.skills || ["React", "TypeScript", "Node.js", "Express", "MongoDB", "TailwindCSS"]);
  const [newSkill, setNewSkill] = useState("");
  
  const [experience, setExperience] = useState<UserExperience[]>(user?.profile?.experience || [
    {
      company: "Tech Mahindra",
      role: "Software Engineering Intern",
      duration: "3 Months",
      description: "Implemented custom React dashboard views and streamlined backend mongoose database queries."
    }
  ]);
  const [edu, setEdu] = useState<UserEducation[]>(user?.profile?.education || [
    {
      institution: "Delhi Technological University (DTU)",
      degree: "B.Tech Computer Science",
      year: "2026",
      cgpa: "8.5"
    }
  ]);

  const [targetRoles, setTargetRoles] = useState<string[]>(user?.profile?.target_roles || ["SDE-1", "Frontend Engineer", "Fullstack Intern"]);
  const [newRole, setNewRole] = useState("");
  
  const [preferredJobType, setPreferredJobType] = useState<"full-time" | "internship" | "remote" | "contract" | "any">(user?.profile?.preferred_job_type || "internship");

  // Local state for adding experience
  const [expCompany, setExpCompany] = useState("");
  const [expRole, setExpRole] = useState("");
  const [expDuration, setExpDuration] = useState("");
  const [expDesc, setExpDesc] = useState("");

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.trim() || skills.includes(newSkill.trim())) return;
    setSkills(prev => [...prev, newSkill.trim()]);
    setNewSkill("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRole.trim() || targetRoles.includes(newRole.trim())) return;
    setTargetRoles(prev => [...prev, newRole.trim()]);
    setNewRole("");
  };

  const handleRemoveRole = (role: string) => {
    setTargetRoles(prev => prev.filter(r => r !== role));
  };

  const handleSaveProfile = async () => {
    const profilePayload: UserProfile = {
      summary,
      skills,
      experience,
      education: edu,
      target_roles: targetRoles,
      preferred_job_type: preferredJobType
    };

    try {
      await updateProfile(profilePayload);
      toast.success("Profile records saved offline successfully!");
    } catch (err) {
      toast.error("Cloud synchronisation failed. Fallback to local disk storage.");
    }
  };

  const handleAddExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCompany || !expRole) return;
    const newExp: UserExperience = {
      company: expCompany,
      role: expRole,
      duration: expDuration || "Not Specified",
      description: expDesc
    };
    setExperience(prev => [...prev, newExp]);
    setExpCompany("");
    setExpRole("");
    setExpDuration("");
    setExpDesc("");
  };

  const handleDeleteExp = (index: number) => {
    setExperience(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-zinc-950 text-zinc-100 flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Candidate Profile</h1>
          <p className="text-sm text-zinc-400 mt-1">Configure your skillset, academics, and target metrics to train the AI Insights agent.</p>
        </div>

        <button
          onClick={handleSaveProfile}
          className="bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: general card info */}
        <div className="space-y-6">
          <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-650/15 border border-indigo-500/25 p-4 rounded-full">
                <UserIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-md font-bold text-white">{user?.name || "Student Candidate"}</h2>
                <div className="text-xs text-zinc-400 flex items-center mt-1 space-x-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-zinc-650" />
                  <span>{user?.email || "candidate@example.com"}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-850 pt-4 space-y-4">
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-widest font-mono font-bold mb-2">Preferred Job Type</label>
                <select
                  value={preferredJobType}
                  onChange={(e) => setPreferredJobType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none focus:border-zinc-705 cursor-pointer"
                >
                  <option value="any">Any Engagement Type</option>
                  <option value="full-time">Full-Time Placement</option>
                  <option value="internship">Paid Internship</option>
                  <option value="remote">Remote-only</option>
                  <option value="contract">Contractual Work</option>
                </select>
              </div>
            </div>
          </div>

          {/* Core tech skills list */}
          <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2 font-mono">
              Technical Core Skills
            </h3>
            
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Docker, Redis"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-grow pl-3 pr-2 py-2 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 outline-none"
              />
              <button
                type="submit"
                className="bg-indigo-650/15 border border-indigo-505/20 text-indigo-300 p-2.5 rounded-xl hover:bg-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {skills.map(sk => (
                <span
                  key={sk}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono pl-3 pr-2 py-1 rounded-full flex items-center space-x-1.5 transition-colors"
                >
                  <span>{sk}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(sk)}
                    className="text-zinc-500 hover:text-rose-450 p-0.5 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Education + Experience blocks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary textarea */}
          <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
              Personal Profile Summary
            </h3>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full p-3.5 bg-zinc-950 border border-zinc-850 focus:border-zinc-700 rounded-xl text-xs sm:text-sm text-zinc-200 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Education list */}
          <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
              Academic Qualifications (Indian Form)
            </h3>
            
            {edu.map((ed, idx) => (
              <div key={idx} className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <GraduationCap className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white">{ed.institution}</h4>
                    <span className="text-xs text-zinc-400 block">{ed.degree} • Passed out {ed.year}</span>
                    <span className="text-[10px] bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 px-2 py-0.5 rounded inline-block mt-1.5 font-bold font-mono">
                      Grade: {ed.cgpa} CGPA / Percentage
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Experience list and dynamic experiences adding */}
          <div className="bg-zinc-900/30 border border-zinc-850 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider border-l-2 border-indigo-500 pl-2">
              Experience Logs &amp; Internships
            </h3>

            <div className="space-y-3.5 pb-4 border-b border-zinc-850">
              {experience.map((exp, idx) => (
                <div key={idx} className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      <span>{exp.company}</span>
                    </h4>
                    <span className="text-xs text-indigo-200 font-medium block mt-1">{exp.role}</span>
                    <span className="text-[10px] text-zinc-500 font-mono flex items-center mt-1">
                      <Calendar className="w-3.5 h-3.5 mr-1 animate-pulse" /> Term: {exp.duration}
                    </span>
                    <p className="text-zinc-400 text-xs leading-normal mt-2">{exp.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteExp(idx)}
                    className="text-zinc-500 hover:text-rose-400 p-1.5 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddExp} className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl space-y-4">
              <span className="text-xs font-bold text-indigo-300 block">Record New Internship / Job</span>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Company Name"
                  value={expCompany}
                  onChange={(e) => setExpCompany(e.target.value)}
                  className="p-2.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 outline-none"
                />
                <input
                  type="text"
                  placeholder="Role Designation"
                  value={expRole}
                  onChange={(e) => setExpRole(e.target.value)}
                  className="p-2.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Duration (e.g., 3 Months, Jan-Mar 2026)"
                value={expDuration}
                onChange={(e) => setExpDuration(e.target.value)}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 outline-none"
              />

              <textarea
                placeholder="Highlight SDE features built, databases scaled, or frameworks integrated..."
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 focus:border-zinc-700 rounded-xl text-xs text-zinc-200 outline-none resize-none leading-relaxed"
              />

              <button
                type="submit"
                className="w-full bg-zinc-100 hover:bg-zinc-200 transition-all text-xs text-zinc-950 font-bold py-2.5 rounded-xl cursor-pointer shadow-md"
              >
                Log Experience
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
