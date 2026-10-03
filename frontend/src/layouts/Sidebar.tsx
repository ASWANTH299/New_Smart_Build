import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  HardHat,
  Package,
  Building2,
  Truck,
  Settings,
  Users,
  Wrench,
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
  group?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userRole, isAdmin, isClient } = usePermissions();

  const allNavigation: NavItemConfig[] = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
      group: "OVERVIEW",
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <FolderKanban className="w-4 h-4 shrink-0" />,
      group: "OVERVIEW",
    },
    {
      name: "Site Operations",
      href: "/operations",
      icon: <HardHat className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "CONTRACTOR"],
      group: "FIELD EXECUTION",
    },
    {
      name: "Workforce & Labor",
      href: "/workforce",
      icon: <Users className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"],
      group: "FIELD EXECUTION",
    },
    {
      name: "Materials Catalog",
      href: "/materials",
      icon: <Package className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "STORE_MANAGER", "SITE_ENGINEER"],
      group: "RESOURCES & ASSETS",
    },
    {
      name: "Equipment & Assets",
      href: "/equipment",
      icon: <Wrench className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER"],
      group: "RESOURCES & ASSETS",
    },
    {
      name: "Vendors & Suppliers",
      href: "/vendors",
      icon: <Truck className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"],
      group: "RESOURCES & ASSETS",
    },
    {
      name: "Inventory & Materials",
      href: "/inventory",
      icon: <Building2 className="w-4 h-4 shrink-0" />,
      roles: ["ADMIN", "PROJECT_MANAGER", "STORE_MANAGER"],
      group: "RESOURCES & ASSETS",
    },

    ...(isClient
      ? [
          {
            name: "Client Portal",
            href: "/client-portal",
            icon: <Building2 className="w-4 h-4 shrink-0" />,
            group: "CLIENT PORTAL",
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            name: "User Management",
            href: "/admin/users",
            icon: <Users className="w-4 h-4 shrink-0" />,
            group: "SYSTEM",
          },
          {
            name: "System Settings",
            href: "/settings",
            icon: <Settings className="w-4 h-4 shrink-0" />,
            group: "SYSTEM",
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
          className="fixed inset-0 z-40 bg-zinc-950/60 dark:bg-black/80 backdrop-blur-xs lg:hidden transition-opacity animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 backdrop-blur-md transition-transform duration-200 ease-spring lg:static lg:translate-x-0 shadow-sm",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200/90 dark:border-zinc-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100 text-amber-500 shadow-sm border border-zinc-800 dark:border-zinc-200">
              <HardHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 block leading-tight">
                  SMART BUILD
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                  v1.0 ERP
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 lg:hidden transition-colors touch-target flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {["OVERVIEW", "FIELD EXECUTION", "RESOURCES & ASSETS", "CLIENT PORTAL", "SYSTEM"].map((groupName) => {
            const items = navigation.filter((item) => item.group === groupName);
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="mb-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-3 pt-3 pb-1">
                  {groupName}
                </div>
                {items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-xs"
                          : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/50"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "transition-colors",
                            isActive
                              ? "text-amber-400 dark:text-amber-600"
                              : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                          )}
                        >
                          {item.icon}
                        </span>
                        <span>{item.name}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer / System Status */}
        <div className="border-t border-zinc-200/90 dark:border-zinc-800 p-3.5">
          <div className="rounded-xl bg-zinc-50 dark:bg-zinc-850 p-3 text-[11px] text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-display">
                System Active
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
              Role:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300 font-display">
                {userRole ? userRole.replace(/_/g, " ") : "User"}
              </span>
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
