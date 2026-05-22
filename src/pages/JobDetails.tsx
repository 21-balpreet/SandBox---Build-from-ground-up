import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, BadgeIndianRupee, Calendar, ExternalLink, Bookmark } from "lucide-react";

export default function JobDetails() {
  const { id } = useParams();

  return (
    <div className="bg-[#020617] text-slate-100 flex-grow py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <Link to="/jobs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Search Index</span>
        </Link>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Fullstack Developer Intern</h1>
            <p className="text-indigo-400 font-semibold mt-1">Zomato India</p>
            <div className="flex flex-wrap items-center mt-3 gap-x-3 gap-y-1.5 text-xs text-slate-400">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Gurugram, HR</span>
              </span>
              <span className="flex items-center space-x-1">
                <BadgeIndianRupee className="w-3.5 h-3.5" />
                <span>₹40,000 / month</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Duration: 6 Months</span>
              </span>
            </div>
          </div>

          <div className="flex space-x-2 w-full sm:w-auto">
            <button className="flex-grow sm:flex-none flex items-center justify-center space-x-1.5 border border-slate-700 bg-slate-800 text-slate-300 px-4 py-2 text-sm rounded-xl hover:bg-slate-75 * transition-all cursor-pointer">
              <Bookmark className="w-4 h-4" />
              <span>Save</span>
            </button>
            <a
              href="https://zomato.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-grow sm:flex-none flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 text-sm rounded-xl transition-colors whitespace-nowrap"
            >
              <span>Apply Externally</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-md sm:text-lg font-bold text-white uppercase tracking-wider text-xs border-l-2 border-indigo-500 pl-2">Job Description</h2>
          <p>
            We are looking for a Software Developer Intern to join our Engineering team in Gurugram. 
            You will help construct clean web features using React, integrate backend Express APIs under Mongoose, 
            and work in a agile setting.
          </p>

          <h2 className="text-md sm:text-lg font-bold text-white uppercase tracking-wider text-xs border-l-2 border-indigo-500 pl-2 pt-4">Skills Demanded</h2>
          <div className="flex flex-wrap gap-2 pt-1">
            {["React", "Node.js", "Express", "Mongoose", "TypeScript", "Tailwind"].map(sk => (
              <span key={sk} className="bg-slate-900 border border-slate-800 text-indigo-300 text-xs px-3 py-1.5 rounded-xl font-medium">
                {sk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
