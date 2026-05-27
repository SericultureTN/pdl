import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  LineChart,
  Users,
  Settings,
  Leaf,
  ChevronRight,
} from "lucide-react";
import { useDashboardUiStore } from "@/stores/ui/dashboardUi.store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Data Entry",
    icon: ClipboardList,
    children: [
      { to: "/app/data-entry/plantation-overall", label: "Plantation Overall" },
      { to: "/app/data-entry/plantation-scheme-2024-25", label: "Plantation Scheme 2024-25" },
      { to: "/app/data-entry/plantation-scheme-2025-26", label: "Plantation Scheme 2025-26" },
      { to: "/app/data-entry/dfls-distribution", label: "DFLs Distribution" },
      { to: "/app/data-entry/dfls-consumption", label: "DFLs Consumption" },
      { to: "/app/data-entry/cocoon-production", label: "Cocoon Production" },
    ],
  },
  { to: "/app/reports", label: "Reports", icon: BarChart3 },
  { to: "/app/mis-analytics", label: "MIS Analytics", icon: LineChart },
  { to: "/app/user-management", label: "User Management", icon: Users },
  { to: "/app/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const dataEntryOpen = useDashboardUiStore((s) => s.dataEntryOpen);
  const toggleDataEntry = useDashboardUiStore((s) => s.toggleDataEntry);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 px-4 border-b">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <Leaf className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-extrabold leading-none tracking-wide">SILK SAMAGRA</div>
          <div className="text-[11px] text-muted-foreground leading-none mt-1">MIS PORTAL</div>
        </div>
      </div>

      <nav className="flex-1 overflow-auto p-2">
        <ul className="space-y-1">
          {nav.map((item) => {
            if ("children" in item) {
              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={toggleDataEntry}
                    className="w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronRight className={cn("h-4 w-4 transition-transform", dataEntryOpen && "rotate-90")} />
                  </button>
                  {dataEntryOpen && (
                    <ul className="mt-1 space-y-1 pl-2">
                      {item.children.map((c) => (
                        <li key={c.to}>
                          <NavLink
                            to={c.to}
                            className={({ isActive }) =>
                              cn(
                                "block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                              )
                            }
                          >
                            {c.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            }

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        Government Monthly MIS Reporting System
      </div>
    </div>
  );
}

