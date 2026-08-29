import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "./Header.js";
import { Sidebar } from "./Sidebar.js";
import { ToastContainer } from "../components/ui/Toast.js";
import { ArchitecturalBackground } from "../components/ui/ArchitecturalBackground.js";

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen app-canvas-bg text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-150 relative">
      {/* Subtle Architectural Blueprint & Structural Elevation Background */}
      <ArchitecturalBackground />

      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 z-10 relative">
        <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative">
          <div className="mx-auto max-w-7xl space-y-6 relative z-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <ToastContainer />
    </div>
  );
};

export default AppLayout;
