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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold shadow-xs">
              SB
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-slate-900 block leading-tight">
                Smart Build
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Construction ERP
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Main Navigation
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer / Build Version */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-100">
            <p className="font-semibold text-slate-700">Phase 3 — Shell v1.0.0</p>
            <p className="mt-0.5 text-slate-400">Construction Operations</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
