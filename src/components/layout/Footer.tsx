import React from "react";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0b0f19] border-t border-slate-800 text-slate-500 text-xs py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 text-center md:text-left">
          <div className="flex items-center space-x-2 text-indigo-400/80 font-semibold text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Sand<span className="text-slate-300">Box</span></span>
            <span className="text-slate-600">| Custom Indian Tracker</span>
          </div>

          <div className="text-slate-500">
            &copy; {new Date().getFullYear()} SandBox. Built for College Engineering Portfolio. All rights reserved.
          </div>

          <div className="flex space-x-4">
            <span className="text-slate-600 hover:text-slate-400 transition-colors">No Paid APIs</span>
            <span className="text-slate-600 font-semibold animate-pulse text-indigo-500/85">Local Offline First</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
