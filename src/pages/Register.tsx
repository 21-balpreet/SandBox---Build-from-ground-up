import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "motion/react";
import { Sparkles, User, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/jobs");
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Failed to register. Please try another email."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center px-4 bg-[#020617] py-16">
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-indigo-950/10 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-[#0f172a] border border-slate-855 p-6 sm:p-8 rounded-2xl shadow-xl shadow-black/40 z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-indigo-400 font-extrabold text-2xl tracking-normal">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>Job<span className="text-white">Genie</span></span>
          </Link>
          <h2 className="text-xl font-bold text-white mt-4">Create Your Profile</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Start tracking and optimizing your Indian job hunts</p>
        </div>

        {error && (
          <div className="bg-red-950/20 border border-red-500/20 text-red-300 text-xs rounded-xl p-3.5 flex items-start space-x-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2">FullName</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Rohit Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-2">Password (Min 6 chars)</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 text-slate-500 w-4 h-4" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 outline-none transition-all placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md mt-6 flex items-center justify-center space-x-2 border border-indigo-500/10 cursor-pointer disabled:opacity-55"
          >
            <span>{loading ? "Creating Account..." : "Register"}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs sm:text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4">
            Login here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
