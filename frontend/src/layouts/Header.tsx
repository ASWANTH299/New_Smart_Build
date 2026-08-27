import React from "react";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth.js";
import { Button } from "../components/ui/Button.js";
import { ProjectSwitcher } from "../components/ProjectSwitcher.js";

export interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Project Context Switcher */}
        <div className="hidden sm:flex items-center pl-2 border-l border-slate-200">
          <ProjectSwitcher />
        </div>
      </div>

      {/* User & Global Actions */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-900">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase">{user.primaryRole.replace(/_/g, " ")}</span>
            </div>
            <div className="p-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
              <User className="w-4 h-4" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-slate-500 hover:text-red-600 px-2"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Not authenticated</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
