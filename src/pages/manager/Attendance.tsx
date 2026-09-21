import {
  CalendarDays,
  Clock3,
  Search,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  managerId: string | null;
  joiningDate: string;
  employmentStatus:
    | "Active"
    | "Inactive"
    | "On Notice"
    | "Resigned";
  profileImage: string;
  createdDate: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: AttendanceStatus;
  remarks: string;
}

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(
    `${date.split("T")[0]}T00:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time: string) {
  if (!time) return "—";

  const date = new Date(`1970-01-01T${time}`);

  if (Number.isNaN(date.getTime())) {
    return time;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatusClass(status: AttendanceStatus) {
  switch (status) {
    case "Present":
      return `
        bg-[#E8F8EF] text-[#16834B]
        dark:bg-[#183A2A] dark:text-[#00FF85]
      `;

    case "Late":
      return `
        bg-[#FFF5D9] text-[#A16207]
        dark:bg-[#3A321A] dark:text-[#FFD166]
      `;

    case "Absent":
      return `
        bg-[#FDECEC] text-[#C53030]
        dark:bg-[#3A2020] dark:text-[#FF8A8A]
      `;

    case "Half Day":
      return `
        bg-[#EAF2FF] text-[#0066FF]
        dark:bg-[#10233F] dark:text-[#4D9AFF]
      `;

    case "On Leave":
      return `
        bg-[#F3E8FF] text-[#7E22CE]
        dark:bg-[#302044] dark:text-[#D8B4FE]
      `;

    case "Holiday":
      return `
        bg-[#F1F5F9] text-[#475467]
        dark:bg-[#292929] dark:text-[#C7C7C7]
      `;

    case "Week Off":
      return `
        bg-[#F1F5F9] text-[#64748B]
        dark:bg-[#292929] dark:text-[#B3B3B3]
      `;

    default:
      return `
        bg-[#F1F5F9] text-[#64748B]
        dark:bg-[#292929] dark:text-[#B3B3B3]
      `;
  }
}

export default function Attendance() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>(
    [],
  );

  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split("T")[0],
  );

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    AttendanceStatus | "All"
  >("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
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

        if (cancelled) return;

        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );

        setAttendance(
          Array.isArray(attendanceResponse.data)
            ? attendanceResponse.data
            : [],
        );
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load manager attendance:",
          err,
        );

        setError(
          "Unable to load attendance. Please make sure JSON Server is running.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const managerEmployee = useMemo(() => {
    if (!user) return undefined;

    return employees.find(
      (employee) =>
        employee.employeeId === user.employeeId ||
        employee.id === user.employeeId,
    );
  }, [employees, user]);

  const managerIds = useMemo(() => {
    const ids = new Set<string>();

    if (user?.employeeId) {
      ids.add(user.employeeId);
    }

    if (managerEmployee?.id) {
      ids.add(managerEmployee.id);
    }

    if (managerEmployee?.employeeId) {
      ids.add(managerEmployee.employeeId);
    }

    return ids;
  }, [managerEmployee, user]);

  const teamMembers = useMemo(() => {
    return employees.filter(
      (employee) =>
        employee.employmentStatus === "Active" &&
        employee.managerId !== null &&
        managerIds.has(employee.managerId),
    );
  }, [employees, managerIds]);

  const teamEmployeeIds = useMemo(() => {
    const ids = new Set<string>();

    teamMembers.forEach((employee) => {
      ids.add(employee.id);
      ids.add(employee.employeeId);
    });

    return ids;
  }, [teamMembers]);

  const employeeMap = useMemo(() => {
    const map = new Map<string, Employee>();

    employees.forEach((employee) => {
      map.set(employee.id, employee);
      map.set(employee.employeeId, employee);
    });

    return map;
  }, [employees]);

  const teamAttendance = useMemo(() => {
    return attendance
      .filter(
        (record) =>
          teamEmployeeIds.has(record.employeeId),
      )
      .filter(
        (record) =>
          !selectedDate ||
          record.date === selectedDate,
      );
  }, [
    attendance,
    teamEmployeeIds,
    selectedDate,
  ]);

  const filteredAttendance = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return teamAttendance
      .filter((record) => {
        const employee =
          employeeMap.get(record.employeeId);

        if (!employee) return false;

        const matchesSearch =
          !search ||
          employee.fullName
            .toLowerCase()
            .includes(search) ||
          employee.employeeId
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          statusFilter === "All" ||
          record.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        const employeeA =
          employeeMap.get(a.employeeId)
            ?.fullName ?? "";

        const employeeB =
          employeeMap.get(b.employeeId)
            ?.fullName ?? "";

        return employeeA.localeCompare(
          employeeB,
        );
      });
  }, [
    teamAttendance,
    employeeMap,
    searchTerm,
    statusFilter,
  ]);

  const presentCount = teamAttendance.filter(
    (record) =>
      record.status === "Present",
  ).length;

  const lateCount = teamAttendance.filter(
    (record) =>
      record.status === "Late",
  ).length;

  const absentCount = teamAttendance.filter(
    (record) =>
      record.status === "Absent",
  ).length;

  const halfDayCount = teamAttendance.filter(
    (record) =>
      record.status === "Half Day",
  ).length;

  const onLeaveCount = teamAttendance.filter(
    (record) =>
      record.status === "On Leave",
  ).length;

  const getEmployee = (employeeId: string) =>
    employeeMap.get(employeeId);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    statusFilter !== "All";

  if (loading) {
    return (
      <div className="min-h-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-[#E5E7EB] dark:bg-[#292929]" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-[#E5E7EB] dark:bg-[#292929]" />
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-white dark:bg-[#181818]"
              />
            ),
          )}
        </div>

        <div className="h-20 animate-pulse rounded-2xl bg-white dark:bg-[#181818]" />

        <div className="h-96 animate-pulse rounded-2xl bg-white dark:bg-[#181818]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-6 dark:border-[#542020] dark:bg-[#211414]">
          <h2 className="text-base font-semibold text-[#991B1B] dark:text-[#FF8A8A]">
            Unable to load attendance
          </h2>

          <p className="mt-1 text-sm text-[#7F1D1D] dark:text-[#D6D6D6]">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-full min-w-0 space-y-6 overflow-x-hidden bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
        {/* PAGE HEADER */}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#667085] dark:text-[#B3B3B3]">
              Manager Portal
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Team Attendance
            </h1>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#999999]">
              View attendance records for your
              assigned team members.
            </p>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-xl border border-[#E1E5EA] bg-white px-3 py-2 dark:border-[#333333] dark:bg-[#181818]">
            <CalendarDays
              size={17}
              className="text-[#0066FF] dark:text-[#4D9AFF]"
            />

            <span className="text-sm font-semibold text-[#475467] dark:text-[#C7C7C7]">
              {formatDate(selectedDate)}
            </span>
          </div>
        </div>

        {/* SUMMARY */}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
         <SummaryCard
  title="Present"
  value={presentCount}
  icon={<UserCheck size={20} />}
  iconClass="
    bg-[#E8F8EF] text-[#16834B]
    dark:bg-[#183A2A] dark:text-[#00FF85]
  "
/>

<SummaryCard
  title="Late"
  value={lateCount}
  icon={<Clock3 size={20} />}
  iconClass="
    bg-[#FFF5D9] text-[#A16207]
    dark:bg-[#3A321A] dark:text-[#FFD166]
  "
/>

<SummaryCard
  title="Absent"
  value={absentCount}
  icon={<UserX size={20} />}
  iconClass="
    bg-[#FDECEC] text-[#C53030]
    dark:bg-[#3A2020] dark:text-[#FF8A8A]
  "
/>

<SummaryCard
  title="Half Day"
  value={halfDayCount}
  icon={<Clock3 size={20} />}
  iconClass="
    bg-[#EAF2FF] text-[#0066FF]
    dark:bg-[#10233F] dark:text-[#4D9AFF]
  "
/>

<SummaryCard
  title="On Leave"
  value={onLeaveCount}
  icon={<CalendarDays size={20} />}
  iconClass="
    bg-[#F3E8FF] text-[#7E22CE]
    dark:bg-[#302044] dark:text-[#D8B4FE]
  "
/>
        </div>

        {/* FILTERS */}

        <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 dark:border-[#333333] dark:bg-[#181818]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
             <Search
  size={18}
  className="
    pointer-events-none
    absolute left-3 top-1/2
    -translate-y-1/2
    text-[#667085]
    dark:text-[#C7C7C7]
  "
/>

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search employee name or ID..."
                className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-10 text-sm outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:bg-[#222222] dark:text-white dark:placeholder:text-[#777777] dark:focus:border-[#4D9AFF]"
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#667085] hover:bg-[#F1F5F9] dark:text-[#999999] dark:hover:bg-[#333333]"
                >
                 <X
  size={16}
  className="
    text-[#667085]
    dark:text-[#C7C7C7]
  "
/>
                </button>
              )}
            </div>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value,
                )
              }
              className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#222222] dark:text-white dark:focus:border-[#4D9AFF]"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as AttendanceStatus | "All",
                )
              }
              className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#344054] outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#222222] dark:text-white dark:focus:border-[#4D9AFF]"
            >
              <option value="All">
                All Status
              </option>
              <option value="Present">
                Present
              </option>
              <option value="Late">
                Late
              </option>
              <option value="Absent">
                Absent
              </option>
              <option value="Half Day">
                Half Day
              </option>
              <option value="On Leave">
                On Leave
              </option>
              <option value="Holiday">
                Holiday
              </option>
              <option value="Week Off">
                Week Off
              </option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#98A2B3] dark:text-[#888888]">
              Showing{" "}
              <span className="font-semibold">
                {filteredAttendance.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold">
                {teamAttendance.length}
              </span>{" "}
              attendance records
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-semibold text-[#0066FF] hover:underline dark:text-[#4D9AFF]"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* DESKTOP TABLE */}

        <div className="hidden overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white dark:border-[#333333] dark:bg-[#181818] md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] dark:border-[#333333] dark:bg-[#222222]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Check In
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Check Out
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Working Hours
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#999999]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-16 text-center"
                    >
                      <UserCheck
                        size={30}
                        className="mx-auto text-[#98A2B3] dark:text-[#666666]"
                      />

                      <p className="mt-3 text-sm font-semibold text-[#344054] dark:text-white">
                        No attendance records found
                      </p>

                      <p className="mt-1 text-xs text-[#98A2B3] dark:text-[#777777]">
                        Try another date or change
                        your filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map(
                    (record) => {
                      const employee =
                        getEmployee(
                          record.employeeId,
                        );

                      return (
                        <tr
                          key={record.id}
                          className="border-b border-[#E1E5EA] transition-colors duration-200 last:border-b-0 hover:bg-[#F8FAFC] dark:border-[#333333] dark:hover:bg-[#222222]"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                             <div
  className="
    flex h-10 w-10 shrink-0
    items-center justify-center
    overflow-hidden rounded-full
    bg-[#EAF2FF]
    text-xs font-bold
    text-[#0066FF]
    dark:bg-[#10233F]
    dark:text-[#4D9AFF]
  "
>
                                {employee?.profileImage ? (
                                  <img
                                    src={
                                      employee.profileImage
                                    }
                                    alt={
                                      employee.fullName
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  getInitials(
                                    employee?.fullName ??
                                      "Employee",
                                  )
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#344054] dark:text-white">
                                  {employee?.fullName ??
                                    "Unknown Employee"}
                                </p>

                                <p className="mt-0.5 text-xs text-[#98A2B3] dark:text-[#777777]">
                                  {employee?.employeeId ??
                                    record.employeeId}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-[#475467] dark:text-[#C7C7C7]">
                            {formatTime(
                              record.checkIn,
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-[#475467] dark:text-[#C7C7C7]">
                            {formatTime(
                              record.checkOut,
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm font-medium text-[#475467] dark:text-[#C7C7C7]">
                            {record.workingHours ||
                              "—"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                                record.status,
                              )}`}
                            >
                              {record.status}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAttendance(
                                  record,
                                )
                              }
                              className="rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs font-semibold text-[#0066FF] transition-all duration-200 hover:border-[#0066FF] hover:bg-[#EEF4FF] dark:border-[#3A3A3A] dark:bg-[#222222] dark:text-[#4D9AFF] dark:hover:border-[#4D9AFF] dark:hover:bg-[#10233F]"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MOBILE CARDS */}

        <div className="space-y-4 md:hidden">
          {filteredAttendance.length === 0 ? (
            <div className="rounded-2xl border border-[#E1E5EA] bg-white p-10 text-center dark:border-[#333333] dark:bg-[#181818]">
              <UserCheck
                size={30}
                className="mx-auto text-[#98A2B3] dark:text-[#666666]"
              />

              <p className="mt-3 text-sm font-semibold">
                No attendance records found
              </p>

              <p className="mt-1 text-xs text-[#98A2B3] dark:text-[#777777]">
                Try another date or filter.
              </p>
            </div>
          ) : (
            filteredAttendance.map(
              (record) => {
                const employee =
                  getEmployee(
                    record.employeeId,
                  );

                return (
                  <div
                    key={record.id}
                    className="group rounded-2xl border border-[#E1E5EA] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#B8D1FF] hover:shadow-lg dark:border-[#333333] dark:bg-[#181818] dark:hover:border-[#3B82F6] dark:hover:bg-[#1D1D1D]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EAF2FF] text-xs font-bold text-[#0066FF] dark:bg-[#10233F] dark:text-[#4D9AFF]">
                          {employee?.profileImage ? (
                            <img
                              src={
                                employee.profileImage
                              }
                              alt={
                                employee.fullName
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            getInitials(
                              employee?.fullName ??
                                "Employee",
                            )
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#344054] dark:text-white">
                            {employee?.fullName ??
                              "Unknown Employee"}
                          </p>

                          <p className="mt-0.5 text-xs text-[#98A2B3] dark:text-[#777777]">
                            {employee?.employeeId ??
                              record.employeeId}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${getStatusClass(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#E1E5EA] pt-4 dark:border-[#333333]">
                      <div>
                        <p className="text-[10px] text-[#98A2B3] dark:text-[#777777]">
                          Check In
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#475467] dark:text-[#C7C7C7]">
                          {formatTime(
                            record.checkIn,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-[#98A2B3] dark:text-[#777777]">
                          Check Out
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#475467] dark:text-[#C7C7C7]">
                          {formatTime(
                            record.checkOut,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-[#98A2B3] dark:text-[#777777]">
                          Hours
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#475467] dark:text-[#C7C7C7]">
                          {record.workingHours ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAttendance(
                          record,
                        )
                      }
                      className="mt-4 w-full rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-sm font-semibold text-[#0066FF] transition-all duration-200 hover:border-[#0066FF] hover:bg-[#EEF4FF] dark:border-[#3A3A3A] dark:bg-[#222222] dark:text-[#4D9AFF] dark:hover:border-[#4D9AFF] dark:hover:bg-[#10233F]"
                    >
                      View Details
                    </button>
                  </div>
                );
              },
            )
          )}
        </div>
      </div>

      {/* DETAILS MODAL */}

      {selectedAttendance && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() =>
            setSelectedAttendance(null)
          }
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#E1E5EA] bg-white p-6 shadow-2xl dark:border-[#333333] dark:bg-[#181818]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {(() => {
              const employee =
                getEmployee(
                  selectedAttendance.employeeId,
                );

              return (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-[#98A2B3] dark:text-[#777777]">
                        Attendance Details
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-[#1A1A2E] dark:text-white">
                        {employee?.fullName ??
                          "Unknown Employee"}
                      </h2>

                      <p className="mt-1 text-sm text-[#667085] dark:text-[#999999]">
                        {employee?.employeeId ??
                          selectedAttendance.employeeId}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAttendance(
                          null,
                        )
                      }
                      className="rounded-lg p-2 text-[#667085] transition hover:bg-[#F1F5F9] dark:text-[#999999] dark:hover:bg-[#333333] dark:hover:text-white"
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    <DetailRow
                      label="Date"
                      value={formatDate(
                        selectedAttendance.date,
                      )}
                    />

                    <DetailRow
                      label="Check In"
                      value={formatTime(
                        selectedAttendance.checkIn,
                      )}
                    />

                    <DetailRow
                      label="Check Out"
                      value={formatTime(
                        selectedAttendance.checkOut,
                      )}
                    />

                    <DetailRow
                      label="Working Hours"
                      value={
                        selectedAttendance.workingHours ||
                        "—"
                      }
                    />

                    <div className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#222222]">
                      <p className="text-xs text-[#98A2B3] dark:text-[#777777]">
                        Status
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          selectedAttendance.status,
                        )}`}
                      >
                        {selectedAttendance.status}
                      </span>
                    </div>

                    <div className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#222222]">
                      <p className="text-xs text-[#98A2B3] dark:text-[#777777]">
                        Remarks
                      </p>

                      <p className="mt-1 text-sm font-medium text-[#344054] dark:text-[#C7C7C7]">
                        {selectedAttendance.remarks ||
                          "No remarks"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedAttendance(
                        null,
                      )
                    }
                    className="mt-6 w-full rounded-xl bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0052CC] hover:shadow-md dark:bg-[#1E90FF] dark:hover:bg-[#4D9AFF]"
                  >
                    Close
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <div className="group rounded-2xl border border-[#E1E5EA] bg-white p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#B8D1FF] hover:shadow-lg dark:border-[#333333] dark:bg-[#181818] dark:hover:border-[#3B82F6] dark:hover:bg-[#1D1D1D]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#667085] dark:text-[#B3B3B3]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({
  label,
  value,
}: DetailRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] px-4 py-3 dark:border-[#333333] dark:bg-[#222222]">
      <span className="text-xs text-[#98A2B3] dark:text-[#777777]">
        {label}
      </span>

      <span className="text-sm font-semibold text-[#344054] dark:text-[#C7C7C7]">
        {value}
      </span>
    </div>
  );
}