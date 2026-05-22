import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Sparkles, Search, KanbanIcon, BarChart3, FileText, User as UserIcon, LogOut, Menu, X, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark";
    if (saved === "light" || saved === "dark") return saved;
    return "dark"; // Defaulting to dark as the app is dark by default
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/jobs", label: "Find Jobs", icon: Search },
    { path: "/tracker", label: "My Tracker", icon: KanbanIcon },
    { path: "/insights", label: "AI Insights", icon: BarChart3 },
    { path: "/resume", label: "Resume Builder", icon: FileText },
  ];

  return (
    <nav className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-indigo-505 dark:text-indigo-400 font-extrabold text-xl lg:text-2xl tracking-normal">
              <Sparkles className="w-6 h-6 animate-pulse text-indigo-505 dark:text-indigo-400" />
              <span>Sand<span className="text-zinc-900 dark:text-white">Box</span></span>
            </Link>
            
            {user && (
              <div className="hidden md:ml-10 md:flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? "bg-indigo-650 text-white border border-indigo-505/30 shadow-md shadow-indigo-500/10"
                          : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive("/profile")
                        ? "bg-indigo-650 text-white border border-indigo-505/30 shadow-md shadow-indigo-500/10"
                        : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>{user.name}</span>
                  </Link>

                  <button
                    onClick={logout}
                    className="flex items-center space-x-1.5 px-3.5 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold tracking-wide text-zinc-605 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-455 hover:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-855 dark:hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md"
                  >
                    Register
                  </Link>
                </div>
              )}

              {/* Theme Toggle Button next to Logout / Auth links */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-all cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            </div>
          </div>

          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? <X className="block h-5 w-5" /> : <Menu className="block h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            <>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 block px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? "bg-indigo-600/35 text-indigo-805 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="border-t border-zinc-200 dark:border-zinc-800 my-2 pt-2">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 block px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive("/profile") ? "bg-indigo-600/35 text-indigo-805 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <UserIcon className="w-5 h-5" />
                  <span>Profile - {user.name}</span>
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-3 block px-3 py-2 mt-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
                
                {/* Mobile theme toggle beside / below log out */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setTheme(theme === "dark" ? "light" : "dark");
                  }}
                  className="w-full flex items-center space-x-3 block px-3 py-2.5 mt-2 rounded-xl text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-5 h-5 text-amber-500" />
                      <span>Switch to Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5 text-indigo-600" />
                      <span>Switch to Dark Mode</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-2 px-3 py-2">
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="text-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white py-2.5 text-sm font-medium transition-colors border-b border-zinc-100 dark:border-zinc-900"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setIsOpen(false)}
                className="text-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md"
              >
                Register
              </Link>
              
              {/* Mobile theme toggle for guest view */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  setTheme(theme === "dark" ? "light" : "dark");
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 mt-2 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-605 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                {theme === "dark" ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-500" />
                    <span>Switch to Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span>Switch to Dark Mode</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
