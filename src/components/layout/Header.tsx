import { useState } from "react";

import {
  Bell,
  Check,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notificationsOpen, setNotificationsOpen] =
    useState<boolean>(false);

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);

    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }

    return (
      parts[0].charAt(0) +
      parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  const roleName =
    user.role.charAt(0).toUpperCase() +
    user.role.slice(1);

  const handleLogout = () => {
    setNotificationsOpen(false);
    logout();
  };

  return (
    <header
      className={`
        sticky top-0 z-40
        h-[72px] w-full
        border-b
        ${
          theme === "dark"
            ? "border-[#333333] bg-[#0D0D0D]"
            : "border-[#E1E5EA] bg-white"
        }
      `}
    >
      <div className="flex h-full items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* LEFT SECTION */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar"
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl transition-colors
              lg:hidden
              ${
                theme === "dark"
                  ? "text-[#D1D1D1] hover:bg-[#1F1F1F] hover:text-white"
                  : "text-[#475467] hover:bg-[#F1F5F9]"
              }
            `}
          >
            <Menu size={21} />
          </button>

          {/* Company Logo */}
          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-xl
              bg-[#0066FF]
              text-white
              shadow-sm
              dark:bg-[#1E90FF]
            "
          >
            <CalendarLogo />
          </div>

          {/* Company Name */}
          <div className="min-w-0">
            <h1
              className={`
                truncate text-sm font-bold sm:text-base
                ${
                  theme === "dark"
                    ? "text-white"
                    : "text-[#1A1A2E]"
                }
              `}
            >
              Leave & Attendance
            </h1>

            <p
              className={`
                hidden truncate text-[11px] sm:block
                ${
                  theme === "dark"
                    ? "text-[#B3B3B3]"
                    : "text-[#667085]"
                }
              `}
            >
              Management System
            </p>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 lg:gap-4">
          {/* Search */}
          <div className="hidden md:block">
            <div
              className={`
                flex h-10 w-[220px]
                items-center gap-2
                rounded-xl border px-3
                lg:w-[280px]
                ${
                  theme === "dark"
                    ? "border-[#333333] bg-[#181818]"
                    : "border-[#E1E5EA] bg-[#F8F9FA]"
                }
              `}
            >
              <Search
                size={17}
                className={
                  theme === "dark"
                    ? "text-[#B3B3B3]"
                    : "text-[#667085]"
                }
              />

              <input
                type="text"
                placeholder="Search..."
                className={`
                  w-full bg-transparent
                  text-sm outline-none
                  placeholder:text-[#98A2B3]
                  ${
                    theme === "dark"
                      ? "text-white"
                      : "text-[#1A1A2E]"
                  }
                `}
              />

              <span
                className={`
                  hidden rounded-md border px-1.5
                  py-0.5 text-[10px]
                  lg:inline-block
                  ${
                    theme === "dark"
                      ? "border-[#444444] text-[#888888]"
                      : "border-[#D0D5DD] text-[#98A2B3]"
                  }
                `}
              >
                /
              </span>
            </div>
          </div>

          {/* Notification */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setNotificationsOpen(
                  (current: boolean) => !current,
                )
              }
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              className={`
                relative flex h-10 w-10
                items-center justify-center
                rounded-xl transition-colors
                ${
                  theme === "dark"
                    ? "text-[#D1D1D1] hover:bg-[#1F1F1F] hover:text-white"
                    : "text-[#475467] hover:bg-[#F1F5F9] hover:text-[#1A1A2E]"
                }
              `}
            >
              <Bell size={20} />

              {/* Notification dot */}
              <span
                className="
                  absolute right-2 top-2
                  h-2 w-2 rounded-full
                  bg-red-500
                  ring-2 ring-white
                  dark:ring-[#0D0D0D]
                "
              />
            </button>

            {/* Notification Dropdown */}
            {notificationsOpen && (
              <div
                className="
                  absolute right-0 top-12 z-[100]
                  w-[320px]
                  max-w-[calc(100vw-24px)]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-gray-200
                  bg-white
                  shadow-xl
                  dark:border-white/10
                  dark:bg-[#151515]
                "
              >
                {/* Header */}
                <div
                  className="
                    flex items-center justify-between
                    border-b border-gray-200
                    px-4 py-3
                    dark:border-white/10
                  "
                >
                  <div>
                    <h3 className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                      Notifications
                    </h3>

                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      Recent updates
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationsOpen(false)
                    }
                    aria-label="Close notifications"
                    className="
                      flex h-8 w-8 items-center
                      justify-center rounded-lg
                      text-gray-500
                      transition
                      hover:bg-gray-100
                      hover:text-gray-900
                      dark:text-gray-400
                      dark:hover:bg-white/10
                      dark:hover:text-white
                    "
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Notification List */}
                <div className="max-h-[360px] overflow-y-auto hide-scrollbar">
                  {/* Notification 1 */}
                  <div
                    className="
                      flex gap-3
                      border-b border-gray-100
                      p-4
                      dark:border-white/5
                    "
                  >
                    <div
                      className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-blue-50
                        text-blue-600
                        dark:bg-blue-500/10
                        dark:text-blue-400
                      "
                    >
                      <Bell className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        Welcome to the Employee Portal
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        You can manage your attendance and
                        leave requests from your dashboard.
                      </p>

                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Just now
                      </p>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div
                    className="
                      flex gap-3
                      border-b border-gray-100
                      p-4
                      dark:border-white/5
                    "
                  >
                    <div
                      className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-emerald-50
                        text-emerald-600
                        dark:bg-emerald-500/10
                        dark:text-emerald-400
                      "
                    >
                      <Check className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        Leave balance updated
                      </p>

                      <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Your latest leave balance information
                        is available.
                      </p>

                      <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                        Today
                      </p>
                    </div>
                  </div>

                  {/* Empty message */}
                  <div className="p-4 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      No more notifications
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              theme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            className={`
              flex h-10 w-10
              items-center justify-center
              rounded-xl transition-colors
              ${
                theme === "dark"
                  ? "text-[#D1D1D1] hover:bg-[#1F1F1F] hover:text-white"
                  : "text-[#475467] hover:bg-[#F1F5F9] hover:text-[#1A1A2E]"
              }
            `}
          >
            {theme === "dark" ? (
              <Sun size={19} />
            ) : (
              <Moon size={19} />
            )}
          </button>

          {/* Divider */}
          <div
            className={`
              hidden h-8 w-px sm:block
              ${
                theme === "dark"
                  ? "bg-[#333333]"
                  : "bg-[#E1E5EA]"
              }
            `}
          />

          {/* Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Name */}
            <div className="hidden text-right lg:block">
              <p
                className={`
                  max-w-[140px] truncate
                  text-sm font-semibold
                  ${
                    theme === "dark"
                      ? "text-white"
                      : "text-[#1A1A2E]"
                  }
                `}
              >
                {user.name}
              </p>

              <p
                className={`
                  text-[11px]
                  ${
                    theme === "dark"
                      ? "text-[#B3B3B3]"
                      : "text-[#667085]"
                  }
                `}
              >
                {roleName}
              </p>
            </div>

            {/* Profile Avatar */}
            <div
              className={`
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-full
                text-sm font-bold
                ${
                  theme === "dark"
                    ? "bg-[#292929] text-white ring-1 ring-[#444444]"
                    : "bg-[#E5F0FF] text-[#0066FF]"
                }
              `}
            >
              {getInitials(user.name)}
            </div>
          </div>

          {/* Mobile Logout */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Logout"
            title="Logout"
            className={`
              flex h-10 w-10
              items-center justify-center
              rounded-xl
              transition-colors
              sm:hidden
              ${
                theme === "dark"
                  ? "text-[#D1D1D1] hover:bg-[#1F1F1F] hover:text-white"
                  : "text-[#475467] hover:bg-[#F1F5F9] hover:text-[#1A1A2E]"
              }
            `}
          >
            <LogOut size={19} />
          </button>
        </div>
      </div>
    </header>
  );
}

/* Simple company logo mark */
function CalendarLogo() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M16 3V7M8 3V7M3 10H21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <path
        d="M8 14H8.01M12 14H12.01M16 14H16.01M8 17H8.01M12 17H12.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}