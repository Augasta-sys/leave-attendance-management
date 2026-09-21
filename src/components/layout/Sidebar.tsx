import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { theme } = useTheme();

  if (!user) {
    return null;
  }

  const commonDashboard: MenuItem = {
    label: "Dashboard",
    path: `/${user.role}/dashboard`,
    icon: LayoutDashboard,
  };

  const menuItems: Record<string, MenuItem[]> = {
    admin: [
      commonDashboard,
      {
        label: "Employees",
        path: "/admin/employees",
        icon: Users,
      },
      {
        label: "Departments",
        path: "/admin/departments",
        icon: Building2,
      },
      {
        label: "Attendance",
        path: "/admin/attendance",
        icon: CalendarCheck,
      },
      {
        label: "Leave Requests",
        path: "/admin/leave-requests",
        icon: ClipboardList,
      },
      {
        label: "Leave Balances",
        path: "/admin/leave-balances",
        icon: CalendarDays,
      },
      {
        label: "Reports",
        path: "/admin/reports",
        icon: BarChart3,
      },
      {
        label: "Activity History",
        path: "/admin/activity-history",
        icon: Activity,
      },
      {
        label: "Settings",
        path: "/admin/settings",
        icon: Settings,
      },
    ],

    hr: [
      commonDashboard,
      {
        label: "Employees",
        path: "/hr/employees",
        icon: Users,
      },
      {
        label: "Attendance",
        path: "/hr/attendance",
        icon: CalendarCheck,
      },
      {
        label: "Leave Requests",
        path: "/hr/leave-requests",
        icon: ClipboardList,
      },
      {
        label: "Leave Types",
        path: "/hr/leave-types",
        icon: FileText,
      },
      {
        label: "Leave Balances",
        path: "/hr/leave-balances",
        icon: CalendarDays,
      },
      {
        label: "Reports",
        path: "/hr/reports",
        icon: BarChart3,
      },
      {
        label: "Activity History",
        path: "/hr/activity-history",
        icon: Activity,
      },
    ],

    manager: [
      commonDashboard,
      {
        label: "My Team",
        path: "/manager/team",
        icon: Users,
      },
      {
        label: "Attendance",
        path: "/manager/attendance",
        icon: CalendarCheck,
      },
      {
        label: "Leave Requests",
        path: "/manager/leave-requests",
        icon: ClipboardList,
      },
      {
        label: "Leave Balances",
        path: "/manager/leave-balances",
        icon: CalendarDays,
      },
    ],

    employee: [
      commonDashboard,
      {
        label: "My Attendance",
        path: "/employee/attendance",
        icon: CalendarCheck,
      },
      {
        label: "Apply Leave",
        path: "/employee/apply-leave",
        icon: ClipboardList,
      },
      {
        label: "My Leave Requests",
        path: "/employee/leave-requests",
        icon: CalendarDays,
      },
      {
        label: "Leave Balance",
        path: "/employee/leave-balance",
        icon: FileText,
      },
      {
        label: "My Profile",
        path: "/employee/profile",
        icon: UserCircle,
      },
    ],
  };

  const items = menuItems[user.role] ?? [];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
   <aside
  className={`fixed left-0 top-[72px] z-50 flex h-[calc(100dvh-72px)] w-[260px] flex-col border-r transition-transform duration-300
    ${
      isOpen
        ? "translate-x-0"
        : "-translate-x-full lg:translate-x-0"
    }
    ${
      theme === "dark"
        ? "border-[#333333] bg-[#111111] text-white"
        : "border-[#E1E5EA] bg-white text-[#1A1A2E]"
    }`}
>
        {/* Mobile Close Button */}
        <div className="flex justify-end px-4 pt-4 lg:hidden">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition
              ${
                theme === "dark"
                  ? "text-[#B3B3B3] hover:bg-[#222222] hover:text-white"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Only */}
        <nav className="hide-scrollbar mt-6 flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-1.5">
            {items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? theme === "dark"
                          ? "bg-[#1E90FF] text-white shadow-[0_0_15px_rgba(30,144,255,0.25)]"
                          : "bg-[#0066FF] text-white shadow-[0_0_15px_rgba(0,102,255,0.18)]"
                        : theme === "dark"
                          ? "text-[#B3B3B3] hover:bg-[#222222] hover:text-white"
                          : "text-[#667085] hover:bg-[#F3F7FC] hover:text-[#0066FF]"
                    }`
                  }
                >
                  <Icon size={19} strokeWidth={2} />

                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Logout Only */}
        <div
          className={`border-t p-4 ${
            theme === "dark"
              ? "border-[#333333]"
              : "border-[#E1E5EA]"
          }`}
        >
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition
              ${
                theme === "dark"
                  ? "text-[#B3B3B3] hover:bg-[#222222] hover:text-white"
                  : "text-[#667085] hover:bg-[#F3F7FC] hover:text-[#1A1A2E]"
              }`}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}