import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  UserCheck,
  UserMinus,
  Users,
  XCircle,
} from "lucide-react";

import { api } from "../../services/api";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: string;
  designation: string;
  managerId: string | null;
  joiningDate: string;
  employmentStatus?: string;
  profileImage?: string;
}

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
  checkIn?: string;
  checkOut?: string;
  workingHours?: string | number;
  status: AttendanceStatus;
  remarks?: string;
}

type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days?: number;
  reason: string;
  appliedDate: string;
  status: LeaveStatus;
  rejectionReason?: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "1",
    departmentId: "DEP001",
    name: "Development",
    status: "Active",
  },
  {
    id: "2",
    departmentId: "DEP002",
    name: "Human Resources",
    status: "Active",
  },
  {
    id: "3",
    departmentId: "DEP003",
    name: "Finance",
    status: "Active",
  },
  {
    id: "4",
    departmentId: "DEP004",
    name: "Marketing",
    status: "Active",
  },
  {
    id: "5",
    departmentId: "DEP005",
    name: "Sales",
    status: "Active",
  },
  {
    id: "6",
    departmentId: "DEP006",
    name: "Operations",
    status: "Active",
  },
  {
    id: "7",
    departmentId: "DEP007",
    name: "Support",
    status: "Active",
  },
];

function formatDate(date: string) {
  if (!date) return "-";

  const parsedDate = new Date(
    `${date}T00:00:00`,
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

function calculateDays(
  startDate: string,
  endDate: string,
) {
  if (!startDate || !endDate) return 0;

  const start = new Date(
    `${startDate}T00:00:00`,
  );

  const end = new Date(
    `${endDate}T00:00:00`,
  );

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
}

function getLeaveDays(
  request: LeaveRequest,
) {
  if (
    typeof request.days === "number" &&
    request.days > 0
  ) {
    return request.days;
  }

  return calculateDays(
    request.startDate,
    request.endDate,
  );
}

export default function HRDashboard() {
  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>([]);

  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);

  const [departments, setDepartments] = useState<
    Department[]
  >(DEFAULT_DEPARTMENTS);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const [
          employeesResponse,
          attendanceResponse,
          leaveRequestsResponse,
          leaveTypesResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Attendance[]>("/attendance"),
          api.get<LeaveRequest[]>("/leaveRequests"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<Department[]>("/departments"),
        ]);

        if (cancelled) return;

        setEmployees(Array.isArray(employeesResponse.data) ? employeesResponse.data : []);
        setAttendance(Array.isArray(attendanceResponse.data) ? attendanceResponse.data : []);
        setLeaveRequests(Array.isArray(leaveRequestsResponse.data) ? leaveRequestsResponse.data : []);
        setLeaveTypes(Array.isArray(leaveTypesResponse.data) ? leaveTypesResponse.data : []);

        const apiDepartments = Array.isArray(departmentsResponse.data)
          ? departmentsResponse.data
          : [];

        const mergedDepartments = [
          ...DEFAULT_DEPARTMENTS,
          ...apiDepartments.filter(
            (apiDepartment) =>
              !DEFAULT_DEPARTMENTS.some(
                (defaultDepartment) =>
                  defaultDepartment.departmentId === apiDepartment.departmentId,
              ),
          ),
        ];

        setDepartments(mergedDepartments);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load HR dashboard:", err);
        setError(
          "Unable to load dashboard data. Please make sure JSON Server is running.",
        );
        setDepartments(DEFAULT_DEPARTMENTS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => {
    return new Date()
      .toISOString()
      .split("T")[0];
  }, []);

  const todayAttendance = useMemo(() => {
    return attendance.filter(
      (record) => record.date === today,
    );
  }, [attendance, today]);

  const activeEmployees = useMemo(() => {
    return employees.filter(
      (employee) =>
        !employee.employmentStatus ||
        employee.employmentStatus === "Active",
    );
  }, [employees]);

  const presentToday = useMemo(() => {
    return todayAttendance.filter(
      (record) =>
        record.status === "Present" ||
        record.status === "Late",
    ).length;
  }, [todayAttendance]);

  const absentToday = useMemo(() => {
    return todayAttendance.filter(
      (record) => record.status === "Absent",
    ).length;
  }, [todayAttendance]);

  const onLeaveToday = useMemo(() => {
    return todayAttendance.filter(
      (record) =>
        record.status === "On Leave",
    ).length;
  }, [todayAttendance]);

  const halfDayToday = useMemo(() => {
    return todayAttendance.filter(
      (record) =>
        record.status === "Half Day",
    ).length;
  }, [todayAttendance]);

  const pendingLeaves = useMemo(() => {
    return leaveRequests.filter(
      (request) =>
        request.status === "Pending",
    );
  }, [leaveRequests]);

  const approvedLeaveDays = useMemo(() => {
    return leaveRequests
      .filter(
        (request) =>
          request.status === "Approved",
      )
      .reduce(
        (total, request) =>
          total + getLeaveDays(request),
        0,
      );
  }, [leaveRequests]);

  const attendancePercentage = useMemo(() => {
    if (activeEmployees.length === 0) {
      return 0;
    }

    return Math.round(
      (presentToday /
        activeEmployees.length) *
        100,
    );
  }, [
    presentToday,
    activeEmployees.length,
  ]);

  const recentLeaves = useMemo(() => {
    return [...leaveRequests]
      .sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() -
          new Date(a.appliedDate).getTime(),
      )
      .slice(0, 5);
  }, [leaveRequests]);

  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) => {
        const dateDifference =
          new Date(b.date).getTime() -
          new Date(a.date).getTime();

        if (dateDifference !== 0) {
          return dateDifference;
        }

        return b.id.localeCompare(a.id);
      })
      .slice(0, 6);
  }, [attendance]);

  const getEmployee = (
    employeeId: string,
  ) => {
    return employees.find(
      (employee) =>
        employee.employeeId === employeeId ||
        employee.id === employeeId,
    );
  };

  const getLeaveTypeName = (
    leaveTypeId: string,
  ) => {
    const leaveType = leaveTypes.find(
      (type) =>
        type.leaveTypeId === leaveTypeId ||
        type.id === leaveTypeId,
    );

    return (
      leaveType?.name ||
      leaveTypeId ||
      "Leave"
    );
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
          Human Resources
        </p>

        <h1 className="text-2xl font-bold sm:text-3xl">
          HR Dashboard
        </h1>

        <p className="text-sm text-[#667085] dark:text-[#B3B3B3]">
          Monitor employees, attendance and leave
          activities.
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <DashboardStat
          title="Total Employees"
          value={loading ? "—" : activeEmployees.length}
          subtitle="Active employees"
          icon={<Users size={20} />}
          iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
        />

        <DashboardStat
          title="Present Today"
          value={loading ? "—" : presentToday}
          subtitle={`${attendancePercentage}% attendance`}
          icon={<UserCheck size={20} />}
          iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />

        <DashboardStat
          title="Absent Today"
          value={loading ? "—" : absentToday}
          subtitle="Marked absent"
          icon={<UserMinus size={20} />}
          iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
        />

        <DashboardStat
          title="On Leave"
          value={loading ? "—" : onLeaveToday}
          subtitle={`${halfDayToday} half day`}
          icon={<CalendarDays size={20} />}
          iconClass="bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400"
        />

        <DashboardStat
          title="Pending Leaves"
          value={loading ? "—" : pendingLeaves.length}
          subtitle="Awaiting action"
          icon={<Clock3 size={20} />}
          iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
        />
      </div>

      {/* SECONDARY SUMMARY */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ATTENDANCE OVERVIEW */}
        <div
          className="
            rounded-2xl border p-5 shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Today's Attendance
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                {formatDate(today)}
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#0066FF] dark:bg-[#10233F] dark:text-[#1E90FF]">
              <CalendarDays size={19} />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold">
                  {attendancePercentage}%
                </p>

                <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                  Attendance rate
                </p>
              </div>

              <p className="text-xs text-[#667085] dark:text-[#888888]">
                {presentToday} of{" "}
                {activeEmployees.length}
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
              <div
                className="h-full rounded-full bg-[#0066FF] transition-all dark:bg-[#1E90FF]"
                style={{
                  width: `${Math.min(
                    attendancePercentage,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SmallMetric
              label="Present"
              value={presentToday}
              valueClass="text-green-600 dark:text-green-400"
            />

            <SmallMetric
              label="Absent"
              value={absentToday}
              valueClass="text-red-600 dark:text-red-400"
            />

            <SmallMetric
              label="Leave"
              value={onLeaveToday}
              valueClass="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>

        {/* LEAVE SUMMARY */}
        <div
          className="
            rounded-2xl border p-5 shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Leave Summary
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                Current leave activity
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <FileText size={19} />
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <SummaryRow
              label="Pending Requests"
              value={pendingLeaves.length}
              icon={<Clock3 size={16} />}
              iconClass="text-orange-500"
            />

            <SummaryRow
              label="Approved Requests"
              value={
                leaveRequests.filter(
                  (request) =>
                    request.status ===
                    "Approved",
                ).length
              }
              icon={<CheckCircle2 size={16} />}
              iconClass="text-green-500"
            />

            <SummaryRow
              label="Rejected Requests"
              value={
                leaveRequests.filter(
                  (request) =>
                    request.status ===
                    "Rejected",
                ).length
              }
              icon={<XCircle size={16} />}
              iconClass="text-red-500"
            />

            <SummaryRow
              label="Approved Leave Days"
              value={approvedLeaveDays}
              icon={<CalendarDays size={16} />}
              iconClass="text-[#0066FF] dark:text-[#1E90FF]"
            />
          </div>
        </div>

        {/* DEPARTMENT SUMMARY */}
        <div
          className="
            rounded-2xl border p-5 shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">
                Departments
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                Employee distribution
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
              <Users size={19} />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {departments
              .filter(
                (department) =>
                  department.status !==
                  "Inactive",
              )
              .slice(0, 5)
              .map((department) => {
                const count =
                  activeEmployees.filter(
                    (employee) =>
                      employee.departmentId ===
                        department.departmentId ||
                      employee.departmentId ===
                        department.id ||
                      employee.departmentId ===
                        department.name,
                  ).length;

                return (
                  <div
                    key={department.departmentId}
                    className="flex items-center justify-between gap-3"
                  >
                    <p className="min-w-0 truncate text-sm">
                      {department.name}
                    </p>

                    <span className="shrink-0 rounded-lg bg-[#F2F4F7] px-2.5 py-1 text-xs font-semibold text-[#667085] dark:bg-[#303030] dark:text-[#B3B3B3]">
                      {count}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* RECENT LEAVES + ATTENDANCE */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* RECENT LEAVE REQUESTS */}
        <div
          className="
            overflow-hidden rounded-2xl border shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div className="flex items-center justify-between border-b border-[#E1E5EA] p-5 dark:border-[#333333]">
            <div>
              <h2 className="text-base font-bold">
                Recent Leave Requests
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                Latest employee requests
              </p>
            </div>

            <a
              href="/hr/leave-requests"
              className="text-xs font-semibold text-[#0066FF] hover:underline dark:text-[#1E90FF]"
            >
              View all
            </a>
          </div>

          {loading ? (
            <LoadingState />
          ) : recentLeaves.length === 0 ? (
            <EmptyState message="No leave requests found." />
          ) : (
            <div className="divide-y divide-[#E1E5EA] dark:divide-[#333333]">
              {recentLeaves.map((request) => {
                const employee =
                  getEmployee(
                    request.employeeId,
                  );

                return (
                  <div
                    key={request.id}
                    className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#F8F9FA] dark:hover:bg-[#202020]"
                  >
                    <div
                      className="
                        flex h-9 w-9 shrink-0
                        items-center justify-center
                        rounded-full
                        bg-[#EAF2FF]
                        text-xs font-bold
                        text-[#0066FF]
                        dark:bg-[#10233F]
                        dark:text-[#1E90FF]
                      "
                    >
                      {(
                        employee?.fullName ||
                        "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {employee?.fullName ||
                          "Unknown Employee"}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-[#667085] dark:text-[#888888]">
                        {getLeaveTypeName(
                          request.leaveTypeId,
                        )}{" "}
                        •{" "}
                        {getLeaveDays(
                          request,
                        )}{" "}
                        day
                        {getLeaveDays(
                          request,
                        ) !== 1
                          ? "s"
                          : ""}
                      </p>
                    </div>

                    <LeaveStatusBadge
                      status={request.status}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RECENT ATTENDANCE */}
        <div
          className="
            overflow-hidden rounded-2xl border shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div className="flex items-center justify-between border-b border-[#E1E5EA] p-5 dark:border-[#333333]">
            <div>
              <h2 className="text-base font-bold">
                Recent Attendance
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                Latest attendance records
              </p>
            </div>

            <a
              href="/hr/attendance"
              className="text-xs font-semibold text-[#0066FF] hover:underline dark:text-[#1E90FF]"
            >
              View all
            </a>
          </div>

          {loading ? (
            <LoadingState />
          ) : recentAttendance.length ===
            0 ? (
            <EmptyState message="No attendance records found." />
          ) : (
            <div className="divide-y divide-[#E1E5EA] dark:divide-[#333333]">
              {recentAttendance.map(
                (record) => {
                  const employee =
                    getEmployee(
                      record.employeeId,
                    );

                  return (
                    <div
                      key={record.id}
                      className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#F8F9FA] dark:hover:bg-[#202020]"
                    >
                      <div
                        className="
                          flex h-9 w-9 shrink-0
                          items-center justify-center
                          rounded-full
                          bg-[#EAF2FF]
                          text-xs font-bold
                          text-[#0066FF]
                          dark:bg-[#10233F]
                          dark:text-[#1E90FF]
                        "
                      >
                        {(
                          employee?.fullName ||
                          "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {employee?.fullName ||
                            "Unknown Employee"}
                        </p>

                        <p className="mt-0.5 text-xs text-[#667085] dark:text-[#888888]">
                          {formatDate(
                            record.date,
                          )}
                        </p>
                      </div>

                      <AttendanceStatusBadge
                        status={record.status}
                      />
                    </div>
                  );
                },
              )}
            </div>
          )}
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div
        className="
          rounded-2xl border p-5 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div>
          <h2 className="text-base font-bold">
            Quick Actions
          </h2>

          <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
            Frequently used HR functions
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickAction
            href="/hr/employees"
            icon={<Users size={19} />}
            title="Employees"
          />

          <QuickAction
            href="/hr/attendance"
            icon={<CalendarDays size={19} />}
            title="Attendance"
          />

          <QuickAction
            href="/hr/leave-requests"
            icon={<FileText size={19} />}
            title="Leave Requests"
          />

          <QuickAction
            href="/hr/leave-balances"
            icon={<CheckCircle2 size={19} />}
            title="Leave Balances"
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT CARD */
/* -------------------------------------------------- */

function DashboardStat({
  title,
  value,
  subtitle,
  icon,
  iconClass,
}: {
  title: string;
  value: string | number;
  subtitle: string;
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
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-[#667085] dark:text-[#B3B3B3]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>

          <p className="mt-1 truncate text-[11px] text-[#98A2B3] dark:text-[#777777]">
            {subtitle}
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
/* SMALL METRIC */
/* -------------------------------------------------- */

function SmallMetric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="rounded-xl bg-[#F8F9FA] p-3 text-center dark:bg-[#202020]">
      <p className="text-[11px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p
        className={`mt-1 text-lg font-bold ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* SUMMARY ROW */
/* -------------------------------------------------- */

function SummaryRow({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F8F9FA] dark:bg-[#202020] ${iconClass}`}
        >
          {icon}
        </span>

        <span className="truncate text-sm text-[#667085] dark:text-[#B3B3B3]">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------- */
/* QUICK ACTION */
/* -------------------------------------------------- */

function QuickAction({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <a
      href={href}
      className="
        flex items-center gap-3
        rounded-xl border p-3
        border-[#E1E5EA]
        bg-[#F8F9FA]
        text-sm font-semibold
        transition
        hover:border-[#0066FF]
        hover:bg-[#EEF4FF]
        hover:text-[#0066FF]
        dark:border-[#333333]
        dark:bg-[#202020]
        dark:hover:border-[#1E90FF]
        dark:hover:bg-[#10233F]
        dark:hover:text-[#1E90FF]
      "
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#0066FF] dark:bg-[#181818] dark:text-[#1E90FF]">
        {icon}
      </span>

      <span className="truncate">
        {title}
      </span>
    </a>
  );
}

/* -------------------------------------------------- */
/* LEAVE STATUS */
/* -------------------------------------------------- */

function LeaveStatusBadge({
  status,
}: {
  status: LeaveStatus;
}) {
  const classes: Record<
    LeaveStatus,
    string
  > = {
    Pending:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    Approved:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    Rejected:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    Cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold sm:text-xs ${classes[status]}`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------- */
/* ATTENDANCE STATUS */
/* -------------------------------------------------- */

function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus;
}) {
  const classes: Record<
    AttendanceStatus,
    string
  > = {
    Present:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    Absent:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    "Half Day":
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    Late:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400",
    "On Leave":
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    Holiday:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    "Week Off":
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold sm:text-xs ${classes[status]}`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------- */
/* LOADING */
/* -------------------------------------------------- */

function LoadingState() {
  return (
    <div className="px-5 py-10 text-center">
      <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

      <p className="mt-3 text-xs text-[#667085] dark:text-[#888888]">
        Loading...
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* EMPTY */
/* -------------------------------------------------- */

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="px-5 py-10 text-center">
      <FileText
        size={30}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        {message}
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        No records are available at the moment.
      </p>
    </div>
  );
}