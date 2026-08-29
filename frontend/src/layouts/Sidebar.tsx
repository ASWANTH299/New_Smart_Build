import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  Package,
  ShieldCheck,
  Building2,
  Settings,
  Users,
  X,
} from "lucide-react";
import { usePermissions } from "../hooks/useAuth.js";
import { cn } from "../utils/cn.js";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItemConfig {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  exact?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userRole, isAdmin, isClient } = usePermissions();

  const allNavigation: NavItemConfig[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <FolderKanban className="w-4 h-4 shrink-0" />,
    },
    {
      name: "Site Operations",
      href: "/operations",
      icon: <HardHat className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
    },
    {
      name: "Inventory & Materials",
      href: "/inventory",
      icon: <Package className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"],
    },
    {
      name: "Quality & Safety",
      href: "/quality-safety",
      icon: <ShieldCheck className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"],
    },
    ...(isClient
      ? [
          {
            name: "Client Portal",
            href: "/client-portal",
            icon: <Building2 className="w-4 h-4 shrink-0" />,
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: "User Management",
            href: "/admin/users",
            icon: <Users className="w-4 h-4 shrink-0" />,
          },
          {
            name: "System Settings",
            href: "/settings",
            icon: <Settings className="w-4 h-4 shrink-0" />,
          },
        ]
      : []),
  ];

  const navigation = allNavigation.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (isAdmin) return true;
    return userRole && item.roles.includes(userRole);
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/95 backdrop-blur-md transition-all duration-200 ease-in-out lg:static lg:translate-x-0 shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200/80 dark:border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-700 text-white font-bold font-display shadow-sm shadow-brand-500/20 tracking-wider text-sm">
              SB
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 font-display block leading-tight">
                  Smart Build
                </span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800 tracking-wider">
                  ERP
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Construction OS
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 lg:hidden transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Workspace Modules
          </div>
          {navigation.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) =>
                cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs sm:text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-brand-50/90 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-semibold shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-brand-600 dark:bg-brand-400" />
                  )}
                  <span className={cn(
                    "transition-colors",
                    isActive ? "text-brand-600 dark:text-brand-400" : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                  )}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Footer / Build Version & Status */}
        <div className="border-t border-slate-200/80 dark:border-slate-800 p-3.5">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-display">System Active</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
              Role: <span className="font-medium text-slate-600 dark:text-slate-300">{userRole ? userRole.replace(/_/g, " ") : "User"}</span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
