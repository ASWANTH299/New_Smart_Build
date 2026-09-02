import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Building2,
  Menu,
} from "lucide-react";
import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";
import { ToastContainer } from "../components/ui/Toast.js";
import { ArchitecturalBackground } from "../components/ui/ArchitecturalBackground.js";
import { cn } from "../utils/cn.js";

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen app-canvas-bg text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans transition-colors duration-150 relative">
      {/* Subtle Architectural Blueprint Background */}
      <ArchitecturalBackground />

      {/* Sidebar Navigation (Desktop & Mobile Slide-Out) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 z-10 relative">
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative pb-20 md:pb-8">
          <div className="mx-auto max-w-7xl space-y-6 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Viewports < 768px) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/90 dark:border-zinc-800 md:hidden flex items-center justify-around px-2 py-2 pb-safe shadow-lg"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium touch-target transition-colors",
              isActive
                ? "text-brand-600 dark:text-brand-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            )
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium touch-target transition-colors",
              isActive
                ? "text-brand-600 dark:text-brand-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            )
          }
        >
          <FolderKanban className="w-5 h-5 mb-0.5" />
          <span>Projects</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium touch-target transition-colors",
              isActive
                ? "text-brand-600 dark:text-brand-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            )
          }
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span>Inventory</span>
        </NavLink>

        <NavLink
          to="/materials"
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium touch-target transition-colors",
              isActive
                ? "text-brand-600 dark:text-brand-400 font-bold"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            )
          }
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Catalog</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 touch-target transition-colors"
          aria-label="Open Full Navigation Menu"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
