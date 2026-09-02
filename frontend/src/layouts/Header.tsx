import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, LogOut, User as UserIcon, Settings, Shield, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { ProjectSwitcher } from "../components/ProjectSwitcher.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-200/90 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-4 sm:px-6 transition-colors duration-150 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 focus:outline-none lg:hidden transition-colors touch-target flex items-center justify-center"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Context Switcher */}
        <div className="hidden sm:flex items-center pl-2 border-l border-zinc-200/90 dark:border-zinc-800">
          <ProjectSwitcher />
        </div>
      </div>

      {/* User & Global Actions */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all focus:outline-none shadow-2xs active:scale-[0.98]"
              aria-expanded={isUserMenuOpen}
              aria-haspopup="true"
            >
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-display leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-brand-700 dark:text-brand-300 font-bold uppercase tracking-wider font-mono">
                  {user.primaryRole.replace(/_/g, " ")}
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-brand-700 text-white flex items-center justify-center font-bold text-xs shadow-xs font-display">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-zinc-900 py-2 shadow-dropdown border border-zinc-200 dark:border-zinc-800 z-50 animate-scale-in">
                <div className="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate font-display">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 rounded-md border border-brand-200/60 dark:border-brand-800 font-mono">
                      {user.primaryRole.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800">
                      Active
                    </span>
                  </div>
                </div>

                <div className="py-1.5">
                  <Link
                    to="/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-zinc-400" />
                    Account Profile
                  </Link>

                  {user.primaryRole === "ADMIN" && (
                    <Link
                      to="/admin/users"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-zinc-400" />
                      User Management
                    </Link>
                  )}

                  <Link
                    to="/settings"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-zinc-400" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Not authenticated</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
