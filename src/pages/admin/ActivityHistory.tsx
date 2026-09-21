import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Search,
  User,
  X,
} from "lucide-react";

import { api } from "../../services/api";

type ActivityType =
  | "Login"
  | "Logout"
  | "Create"
  | "Update"
  | "Delete"
  | "Approve"
  | "Reject"
  | "Apply"
  | "Other";

interface ActivityRecord {
  id: string;
  activityId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  action?: string;
  activityType?: ActivityType | string;
  module?: string;
  description?: string;
  timestamp?: string;
  date?: string;
  createdDate?: string;
  status?: string;
  targetId?: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  employeeId: string;
  status?: string;
}

const DEFAULT_ACTIVITIES: ActivityRecord[] = [
  {
    id: "ACT001",
    activityId: "ACT001",
    userId: "USR001",
    userName: "Arun Kumar",
    userRole: "Admin",
    action: "Login",
    activityType: "Login",
    module: "Authentication",
    description: "Admin logged into the system.",
    timestamp: "2026-09-18T09:15:00",
  },
  {
    id: "ACT002",
    activityId: "ACT002",
    userId: "USR001",
    userName: "Arun Kumar",
    userRole: "Admin",
    action: "Update",
    activityType: "Update",
    module: "Employees",
    description: "Employee information was updated.",
    timestamp: "2026-09-18T09:30:00",
  },
  {
    id: "ACT003",
    activityId: "ACT003",
    userId: "USR002",
    userName: "Priya Sharma",
    userRole: "HR",
    action: "Create",
    activityType: "Create",
    module: "Employees",
    description: "A new employee record was created.",
    timestamp: "2026-09-18T10:00:00",
  },
  {
    id: "ACT004",
    activityId: "ACT004",
    userId: "USR003",
    userName: "Rahul Menon",
    userRole: "Manager",
    action: "Approve",
    activityType: "Approve",
    module: "Leave Requests",
    description: "A leave request was approved.",
    timestamp: "2026-09-18T10:30:00",
  },
];

function getActivityDate(activity: ActivityRecord) {
  return (
    activity.timestamp ||
    activity.createdDate ||
    activity.date ||
    ""
  );
}

function getActivityAction(activity: ActivityRecord) {
  return (
    activity.activityType ||
    activity.action ||
    "Other"
  );
}

function getActivityUser(activity: ActivityRecord) {
  return activity.userName || "System User";
}

function getActivityModule(activity: ActivityRecord) {
  return activity.module || "System";
}

function getActivityDescription(activity: ActivityRecord) {
  return (
    activity.description ||
    activity.action ||
    "System activity recorded."
  );
}

function formatDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateOnly(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toISOString().split("T")[0];
}

function getActionClasses(action: string) {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("login") ||
    normalized.includes("approve") ||
    normalized.includes("create")
  ) {
    return "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400";
  }

  if (
    normalized.includes("delete") ||
    normalized.includes("reject") ||
    normalized.includes("logout")
  ) {
    return "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("edit")
  ) {
    return "bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]";
  }

  if (normalized.includes("apply")) {
    return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400";
  }

  return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
}

export default function ActivityHistory() {
  const [activities, setActivities] = useState<ActivityRecord[]>(
    [],
  );

  const [users, setUsers] = useState<UserRecord[]>([]);

  const [search, setSearch] = useState("");

  const [actionFilter, setActionFilter] = useState("all");

  const [moduleFilter, setModuleFilter] = useState("all");

  const [userFilter, setUserFilter] = useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedActivity, setSelectedActivity] =
    useState<ActivityRecord | null>(null);

  /*
   * Fetch activity history.
   *
   * IMPORTANT:
   * This function is declared before useEffect so that
   * ESLint does not report "accessed before declared".
   */
  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        activitiesResponse,
        usersResponse,
      ] = await Promise.all([
        api.get<ActivityRecord[]>("/activities"),
        api.get<UserRecord[]>("/users"),
      ]);

      setActivities(
        activitiesResponse.data?.length
          ? activitiesResponse.data
          : DEFAULT_ACTIVITIES,
      );

      setUsers(usersResponse.data || []);
    } catch (err) {
      console.error(
        "Failed to load activity history:",
        err,
      );

      setActivities(DEFAULT_ACTIVITIES);

      setError(
        "Unable to load activity history. Please make sure JSON Server is running.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadActivities = async () => {
      await fetchActivities();
    };

    void loadActivities();
  }, []);

  const availableActions = useMemo(() => {
    return Array.from(
      new Set(
        activities.map((activity) =>
          getActivityAction(activity),
        ),
      ),
    ).sort();
  }, [activities]);

  const availableModules = useMemo(() => {
    return Array.from(
      new Set(
        activities.map((activity) =>
          getActivityModule(activity),
        ),
      ),
    ).sort();
  }, [activities]);

  const availableUsers = useMemo(() => {
    const names = activities
      .map((activity) =>
        getActivityUser(activity),
      )
      .filter(Boolean);

    return Array.from(new Set(names)).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return [...activities]
      .sort((a, b) => {
        const dateA = new Date(
          getActivityDate(a),
        ).getTime();

        const dateB = new Date(
          getActivityDate(b),
        ).getTime();

        return dateB - dateA;
      })
      .filter((activity) => {
        const action =
          getActivityAction(activity);

        const module =
          getActivityModule(activity);

        const user =
          getActivityUser(activity);

        const description =
          getActivityDescription(activity);

        const activityDate = getDateOnly(
          getActivityDate(activity),
        );

        const matchesSearch =
          !searchValue ||
          user
            .toLowerCase()
            .includes(searchValue) ||
          action
            .toLowerCase()
            .includes(searchValue) ||
          module
            .toLowerCase()
            .includes(searchValue) ||
          description
            .toLowerCase()
            .includes(searchValue) ||
          String(
            activity.targetId || "",
          )
            .toLowerCase()
            .includes(searchValue);

        const matchesAction =
          actionFilter === "all" ||
          action === actionFilter;

        const matchesModule =
          moduleFilter === "all" ||
          module === moduleFilter;

        const matchesUser =
          userFilter === "all" ||
          user === userFilter;

        const matchesFromDate =
          !fromDate ||
          activityDate >= fromDate;

        const matchesToDate =
          !toDate ||
          activityDate <= toDate;

        return (
          matchesSearch &&
          matchesAction &&
          matchesModule &&
          matchesUser &&
          matchesFromDate &&
          matchesToDate
        );
      });
  }, [
    activities,
    search,
    actionFilter,
    moduleFilter,
    userFilter,
    fromDate,
    toDate,
  ]);

  const stats = useMemo(() => {
    const today = new Date()
      .toISOString()
      .split("T")[0];

    const todayActivities =
      activities.filter(
        (activity) =>
          getDateOnly(
            getActivityDate(activity),
          ) === today,
      ).length;

    const logins = activities.filter(
      (activity) =>
        getActivityAction(activity)
          .toLowerCase()
          .includes("login"),
    ).length;

    const updates = activities.filter(
      (activity) =>
        getActivityAction(activity)
          .toLowerCase()
          .includes("update"),
    ).length;

    const approvals = activities.filter(
      (activity) =>
        getActivityAction(activity)
          .toLowerCase()
          .includes("approve"),
    ).length;

    return {
      total: activities.length,
      today: todayActivities,
      logins,
      updates,
      approvals,
    };
  }, [activities]);

  const clearFilters = () => {
    setSearch("");
    setActionFilter("all");
    setModuleFilter("all");
    setUserFilter("all");
    setFromDate("");
    setToDate("");
  };

  const getUserRole = (
    activity: ActivityRecord,
  ) => {
    if (activity.userRole) {
      return activity.userRole;
    }

    const matchedUser = users.find(
      (user) =>
        user.id === activity.userId ||
        user.employeeId === activity.userId ||
        user.name === activity.userName,
    );

    if (!matchedUser) {
      return "User";
    }

    return (
      matchedUser.role.charAt(0).toUpperCase() +
      matchedUser.role.slice(1)
    );
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div>
        <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Activity History
        </h1>

        <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
          Track important actions and system activity.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <ActivityStat
          title="Total Activities"
          value={stats.total}
          icon={<Activity size={19} />}
          iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
        />

        <ActivityStat
          title="Today"
          value={stats.today}
          icon={<CalendarDays size={19} />}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />

        <ActivityStat
          title="Logins"
          value={stats.logins}
          icon={<User size={19} />}
          iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />

        <ActivityStat
          title="Updates"
          value={stats.updates}
          icon={<FileText size={19} />}
          iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
        />

        <ActivityStat
          title="Approvals"
          value={stats.approvals}
          icon={<Clock3 size={19} />}
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
        />
      </div>

      {/* FILTERS */}
      <div
        className="
          rounded-2xl border p-4 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* SEARCH */}
          <div className="relative xl:col-span-2">
            <Search
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-[#98A2B3]
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search activity, user or module..."
              className="
                h-11 w-full rounded-xl border
                border-[#D0D5DD] bg-white
                pl-10 pr-4 text-sm
                text-[#1A1A2E] outline-none
                focus:border-[#0066FF]
                focus:ring-2 focus:ring-[#0066FF]/10
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:placeholder:text-[#777777]
                dark:focus:border-[#1E90FF]
              "
            />
          </div>

          {/* ACTION */}
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(event) =>
                setActionFilter(
                  event.target.value,
                )
              }
              className="
                h-11 w-full appearance-none
                rounded-xl border
                border-[#D0D5DD] bg-white
                px-3 pr-9 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
            >
              <option value="all">
                All Actions
              </option>

              {availableActions.map((action) => (
                <option
                  key={action}
                  value={action}
                >
                  {action}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-[#667085]
              "
            />
          </div>

          {/* MODULE */}
          <div className="relative">
            <select
              value={moduleFilter}
              onChange={(event) =>
                setModuleFilter(
                  event.target.value,
                )
              }
              className="
                h-11 w-full appearance-none
                rounded-xl border
                border-[#D0D5DD] bg-white
                px-3 pr-9 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
            >
              <option value="all">
                All Modules
              </option>

              {availableModules.map((module) => (
                <option
                  key={module}
                  value={module}
                >
                  {module}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-[#667085]
              "
            />
          </div>

          {/* USER */}
          <div className="relative">
            <select
              value={userFilter}
              onChange={(event) =>
                setUserFilter(
                  event.target.value,
                )
              }
              className="
                h-11 w-full appearance-none
                rounded-xl border
                border-[#D0D5DD] bg-white
                px-3 pr-9 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
            >
              <option value="all">
                All Users
              </option>

              {availableUsers.map((user) => (
                <option
                  key={user}
                  value={user}
                >
                  {user}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-[#667085]
              "
            />
          </div>

          {/* FROM DATE */}
          <input
            type="date"
            value={fromDate}
            onChange={(event) =>
              setFromDate(event.target.value)
            }
            className="
              h-11 w-full rounded-xl border
              border-[#D0D5DD] bg-white
              px-3 text-sm outline-none
              focus:border-[#0066FF]
              dark:border-[#3A3A3A]
              dark:bg-[#101010]
              dark:text-white
              dark:focus:border-[#1E90FF]
            "
          />

          {/* TO DATE */}
          <input
            type="date"
            value={toDate}
            onChange={(event) =>
              setToDate(event.target.value)
            }
            className="
              h-11 w-full rounded-xl border
              border-[#D0D5DD] bg-white
              px-3 text-sm outline-none
              focus:border-[#0066FF]
              dark:border-[#3A3A3A]
              dark:bg-[#101010]
              dark:text-white
              dark:focus:border-[#1E90FF]
            "
          />

          {/* CLEAR */}
          <button
            type="button"
            onClick={clearFilters}
            className="
              h-11 rounded-xl border
              border-[#D0D5DD] px-4
              text-sm font-semibold
              text-[#667085]
              transition hover:bg-[#F2F4F7]
              dark:border-[#3A3A3A]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* ACTIVITY LIST */}
      <div
        className="
          rounded-2xl border shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div className="flex items-center justify-between border-b border-[#E1E5EA] p-5 dark:border-[#333333]">
          <div>
            <h2 className="text-lg font-bold">
              Recent Activity
            </h2>

            <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
              {filteredActivities.length} activity
              records found.
            </p>
          </div>

          <Activity
            size={20}
            className="text-[#0066FF] dark:text-[#1E90FF]"
          />
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredActivities.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] dark:border-[#333333] dark:bg-[#202020]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      User
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Action
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Module
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Description
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Date & Time
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredActivities.map(
                    (activity) => (
                      <ActivityTableRow
                        key={activity.id}
                        activity={activity}
                        userRole={getUserRole(
                          activity,
                        )}
                        onView={() =>
                          setSelectedActivity(
                            activity,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {filteredActivities.map(
                (activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    userRole={getUserRole(
                      activity,
                    )}
                    onView={() =>
                      setSelectedActivity(
                        activity,
                      )
                    }
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>

      {/* RESULT COUNT */}
      {!loading && (
        <p className="text-xs text-[#667085] dark:text-[#888888]">
          Showing {filteredActivities.length} of{" "}
          {activities.length} activity records
        </p>
      )}

      {/* DETAILS MODAL */}
      {selectedActivity && (
        <ActivityDetailsModal
          activity={selectedActivity}
          userRole={getUserRole(
            selectedActivity,
          )}
          onClose={() =>
            setSelectedActivity(null)
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT */
/* -------------------------------------------------- */

function ActivityStat({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div
      className="
        rounded-2xl border p-4 shadow-sm
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-[#667085] dark:text-[#B3B3B3]">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* TABLE ROW */
/* -------------------------------------------------- */

function ActivityTableRow({
  activity,
  userRole,
  onView,
}: {
  activity: ActivityRecord;
  userRole: string;
  onView: () => void;
}) {
  const action = getActivityAction(activity);

  return (
    <tr
      className="
        border-b border-[#E1E5EA]
        last:border-0
        hover:bg-[#F8F9FA]
        dark:border-[#333333]
        dark:hover:bg-[#202020]
      "
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full
              bg-[#EAF2FF]
              text-sm font-bold
              text-[#0066FF]
              dark:bg-[#10233F]
              dark:text-[#1E90FF]
            "
          >
            {getActivityUser(activity)
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {getActivityUser(activity)}
            </p>

            <p className="text-xs text-[#667085] dark:text-[#888888]">
              {userRole}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <span
          className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${getActionClasses(action)}`}
        >
          {action}
        </span>
      </td>

      <td className="px-5 py-4 text-sm">
        {getActivityModule(activity)}
      </td>

      <td className="max-w-[280px] px-5 py-4">
        <p className="truncate text-sm text-[#667085] dark:text-[#B3B3B3]">
          {getActivityDescription(activity)}
        </p>
      </td>

      <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
        {formatDateTime(
          getActivityDate(activity),
        )}
      </td>

      <td className="px-5 py-4 text-center">
        <button
          type="button"
          onClick={onView}
          className="
            inline-flex h-9 w-9
            items-center justify-center
            rounded-lg
            text-[#0066FF]
            transition hover:bg-[#EEF4FF]
            dark:text-[#1E90FF]
            dark:hover:bg-[#10233F]
          "
          title="View activity"
        >
          <Eye size={18} />
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------- */
/* MOBILE CARD */
/* -------------------------------------------------- */

function ActivityCard({
  activity,
  userRole,
  onView,
}: {
  activity: ActivityRecord;
  userRole: string;
  onView: () => void;
}) {
  const action = getActivityAction(activity);

  return (
    <div
      className="
        rounded-xl border p-4
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex h-10 w-10 shrink-0
              items-center justify-center
              rounded-full
              bg-[#EAF2FF]
              text-sm font-bold
              text-[#0066FF]
              dark:bg-[#10233F]
              dark:text-[#1E90FF]
            "
          >
            {getActivityUser(activity)
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {getActivityUser(activity)}
            </p>

            <p className="text-xs text-[#667085] dark:text-[#888888]">
              {userRole}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg
            text-[#0066FF]
            hover:bg-[#EEF4FF]
            dark:text-[#1E90FF]
            dark:hover:bg-[#10233F]
          "
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${getActionClasses(action)}`}
        >
          {action}
        </span>

        <span className="rounded-lg bg-[#F2F4F7] px-2.5 py-1.5 text-xs text-[#667085] dark:bg-[#303030] dark:text-[#B3B3B3]">
          {getActivityModule(activity)}
        </span>
      </div>

      <p className="mt-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
        {getActivityDescription(activity)}
      </p>

      <div className="mt-3 flex items-center gap-2 text-xs text-[#98A2B3]">
        <Clock3 size={14} />

        {formatDateTime(
          getActivityDate(activity),
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* DETAILS MODAL */
/* -------------------------------------------------- */

function ActivityDetailsModal({
  activity,
  userRole,
  onClose,
}: {
  activity: ActivityRecord;
  userRole: string;
  onClose: () => void;
}) {
  const action = getActivityAction(activity);

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50 p-4
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl border
          border-[#E1E5EA]
          bg-white p-5 shadow-2xl
          dark:border-[#333333]
          dark:bg-[#181818]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Activity Details
            </p>

            <h2 className="mt-1 text-xl font-bold">
              System Activity
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-lg
              text-[#667085]
              hover:bg-[#F2F4F7]
              dark:hover:bg-[#303030]
            "
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <div
            className="
              flex h-12 w-12
              items-center justify-center
              rounded-full
              bg-[#EAF2FF]
              text-lg font-bold
              text-[#0066FF]
              dark:bg-[#10233F]
              dark:text-[#1E90FF]
            "
          >
            {getActivityUser(activity)
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate font-semibold">
              {getActivityUser(activity)}
            </p>

            <p className="text-sm text-[#667085] dark:text-[#888888]">
              {userRole}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <ActivityDetail
            label="Action"
            value={action}
            badge
          />

          <ActivityDetail
            label="Module"
            value={getActivityModule(
              activity,
            )}
          />

          <ActivityDetail
            label="Date & Time"
            value={formatDateTime(
              getActivityDate(activity),
            )}
          />

          {activity.targetId && (
            <ActivityDetail
              label="Target ID"
              value={activity.targetId}
            />
          )}

          <div
            className="
              rounded-xl border p-4
              border-[#E1E5EA]
              bg-[#F8F9FA]
              dark:border-[#333333]
              dark:bg-[#202020]
            "
          >
            <p className="text-xs text-[#667085] dark:text-[#888888]">
              Description
            </p>

            <p className="mt-1 text-sm font-medium">
              {getActivityDescription(
                activity,
              )}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            mt-6 h-10 w-full rounded-xl
            bg-[#0066FF] px-4
            text-sm font-semibold text-white
            transition hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1878D1]
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* DETAIL */
/* -------------------------------------------------- */

function ActivityDetail({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div
      className="
        flex items-center justify-between
        gap-4 rounded-xl border px-4 py-3
        border-[#E1E5EA]
        bg-[#F8F9FA]
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <span className="shrink-0 text-sm text-[#667085] dark:text-[#999999]">
        {label}
      </span>

      {badge ? (
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${getActionClasses(value)}`}
        >
          {value}
        </span>
      ) : (
        <span className="max-w-[65%] truncate text-right text-sm font-semibold">
          {value}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* LOADING */
/* -------------------------------------------------- */

function LoadingState() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

      <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
        Loading activity history...
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* EMPTY */
/* -------------------------------------------------- */

function EmptyState() {
  return (
    <div className="px-5 py-14 text-center">
      <Activity
        size={34}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        No activity records found
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        Try changing your search or filters.
      </p>
    </div>
  );
}