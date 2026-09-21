import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  UserCheck,
  UserX,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Late"
  | "On Leave"
  | "Holiday"
  | "Week Off";

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: AttendanceStatus;
  remarks?: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  departmentId: string;
  designation: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClassName: string;
}

function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-[#171717] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status: AttendanceStatus) {
  switch (status) {
    case "Present":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "Late":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

    case "Absent":
      return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";

    case "Half Day":
      return "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400";

    case "On Leave":
      return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400";

    case "Holiday":
      return "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400";

    case "Week Off":
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
  }
}

function formatDate(dateString: string) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EmployeeAttendance() {
  const { user } = useAuth();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | AttendanceStatus
  >("All");

  const [selectedDate, setSelectedDate] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAttendance = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          attendanceResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Attendance[]>("/attendance"),
        ]);

        if (cancelled) {
          return;
        }

        const currentEmployee =
          employeesResponse.data.find(
            (item) =>
              item.employeeId === user.employeeId ||
              item.id === user.employeeId,
          ) || null;

        setEmployee(currentEmployee);

        const employeeIds = new Set(
          [
            user.employeeId,
            currentEmployee?.employeeId,
            currentEmployee?.id,
          ].filter(Boolean),
        );

        const employeeAttendance =
          attendanceResponse.data.filter((item) =>
            employeeIds.has(item.employeeId),
          );

        setAttendance(employeeAttendance);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load employee attendance:",
          err,
        );

        setError(
          "Unable to load your attendance. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAttendance();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const todayAttendance = useMemo(
    () =>
      attendance.find(
        (record) => record.date === today,
      ) || null,
    [attendance, today],
  );

  const presentCount = useMemo(
    () =>
      attendance.filter(
        (record) => record.status === "Present",
      ).length,
    [attendance],
  );

  const lateCount = useMemo(
    () =>
      attendance.filter(
        (record) => record.status === "Late",
      ).length,
    [attendance],
  );

  const absentCount = useMemo(
    () =>
      attendance.filter(
        (record) => record.status === "Absent",
      ).length,
    [attendance],
  );

  const halfDayCount = useMemo(
    () =>
      attendance.filter(
        (record) => record.status === "Half Day",
      ).length,
    [attendance],
  );

  const onLeaveCount = useMemo(
    () =>
      attendance.filter(
        (record) => record.status === "On Leave",
      ).length,
    [attendance],
  );

  const filteredAttendance = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...attendance]
      .filter((record) => {
        const matchesSearch =
          !search ||
          record.date.toLowerCase().includes(search) ||
          record.status.toLowerCase().includes(search) ||
          record.checkIn.toLowerCase().includes(search) ||
          record.checkOut.toLowerCase().includes(search) ||
          (record.remarks || "")
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          statusFilter === "All" ||
          record.status === statusFilter;

        const matchesDate =
          !selectedDate ||
          record.date === selectedDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesDate
        );
      })
      .sort((a, b) =>
        b.date.localeCompare(a.date),
      );
  }, [
    attendance,
    searchTerm,
    statusFilter,
    selectedDate,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0066FF] dark:border-gray-700 dark:border-t-[#1E90FF]" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading attendance...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-[#171717]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
            Unable to load attendance
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-[#0066FF] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full space-y-6 overflow-x-hidden bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <CalendarDays className="h-5 w-5 text-[#0066FF] dark:text-[#1E90FF]" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
                My Attendance
              </h1>

              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {employee?.fullName || user?.name}
                {employee?.designation
                  ? ` • ${employee.designation}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        <Link
          to="/employee/dashboard"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:bg-[#171717] dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
        >
          Dashboard
        </Link>
      </div>

      {/* Today's Attendance */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#171717] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-white">
              Today's Attendance
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatDate(today)}
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
              todayAttendance
                ? getStatusClass(todayAttendance.status)
                : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
            }`}
          >
            {todayAttendance?.status || "Not Marked"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check In
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.checkIn || "--"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check Out
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.checkOut || "--"}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Working Hours
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.workingHours || "--"}
            </p>
          </div>
        </div>

        {todayAttendance?.remarks && (
          <div className="mt-4 rounded-xl bg-gray-50 p-4 dark:bg-[#202020]">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              Remarks
            </p>

            <p className="mt-1 text-sm text-[#1A1A2E] dark:text-gray-200">
              {todayAttendance.remarks}
            </p>
          </div>
        )}
      </section>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Present"
          value={presentCount}
          icon={
            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          }
          iconClassName="bg-emerald-100 dark:bg-emerald-500/10"
        />

        <StatCard
          title="Late"
          value={lateCount}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          }
          iconClassName="bg-amber-100 dark:bg-amber-500/10"
        />

        <StatCard
          title="Absent"
          value={absentCount}
          icon={
            <UserX className="h-5 w-5 text-red-600 dark:text-red-300" />
          }
          iconClassName="bg-red-100 dark:bg-red-500/10"
        />

        <StatCard
          title="Half Day"
          value={halfDayCount}
          icon={
            <Clock3 className="h-5 w-5 text-orange-600 dark:text-orange-300" />
          }
          iconClassName="bg-orange-100 dark:bg-orange-500/10"
        />

        <StatCard
          title="On Leave"
          value={onLeaveCount}
          icon={
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          }
          iconClassName="bg-blue-100 dark:bg-blue-500/10"
        />
      </div>

      {/* Filters */}
      <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-[1fr_200px_200px]">
          {/* Search */}
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search attendance..."
              className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | AttendanceStatus,
              )
            }
            className="h-11 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF]"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Absent">Absent</option>
            <option value="Half Day">Half Day</option>
            <option value="On Leave">On Leave</option>
            <option value="Holiday">Holiday</option>
            <option value="Week Off">Week Off</option>
          </select>

          {/* Date */}
          <input
            type="date"
            value={selectedDate}
            onChange={(event) =>
              setSelectedDate(event.target.value)
            }
            className="h-11 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF]"
          />
        </div>
      </section>

      {/* Attendance History */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
              Attendance History
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filteredAttendance.length} record
              {filteredAttendance.length === 1
                ? ""
                : "s"} found
            </p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden w-full md:block">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#202020]">
                <th className="w-[18%] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:px-4">
                  Date
                </th>

                <th className="w-[17%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Check In
                </th>

                <th className="w-[17%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Check Out
                </th>

                <th className="w-[16%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Hours
                </th>

                <th className="w-[16%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>

                <th className="w-[16%] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:px-4">
                  Remarks
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.map((record) => (
                <tr
                  key={record.id}
                  className="group border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                >
                  <td className="px-3 py-4 text-sm font-medium text-[#1A1A2E] dark:text-white lg:px-4">
                    {formatDate(record.date)}
                  </td>

                  <td className="px-2 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                    {record.checkIn || "--"}
                  </td>

                  <td className="px-2 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                    {record.checkOut || "--"}
                  </td>

                  <td className="px-2 py-4 text-center text-sm font-semibold text-[#1A1A2E] dark:text-white">
                    {record.workingHours || "--"}
                  </td>

                  <td className="px-2 py-4 text-center">
                    <span
                      className={`inline-flex max-w-full truncate rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                        record.status,
                      )}`}
                    >
                      {record.status}
                    </span>
                  </td>

                  <td className="min-w-0 px-3 py-4 lg:px-4">
                    <p
                      title={record.remarks || ""}
                      className="truncate text-xs text-gray-500 dark:text-gray-400"
                    >
                      {record.remarks || "-"}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 p-4 md:hidden">
          {filteredAttendance.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:shadow-md dark:border-gray-700 dark:bg-[#202020]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                    {formatDate(record.date)}
                  </p>

                  <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                    {record.remarks || "No remarks"}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                    record.status,
                  )}`}
                >
                  {record.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Check In
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#1A1A2E] dark:text-white">
                    {record.checkIn || "--"}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Check Out
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#1A1A2E] dark:text-white">
                    {record.checkOut || "--"}
                  </p>
                </div>

                <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    Hours
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#1A1A2E] dark:text-white">
                    {record.workingHours || "--"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredAttendance.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <CalendarDays className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#1A1A2E] dark:text-white">
              No attendance records found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Try changing the search, status, or date
              filter.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}