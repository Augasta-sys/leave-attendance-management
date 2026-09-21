import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LogIn,
  LogOut,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

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
  employmentStatus: string;
  profileImage: string;
  createdDate: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status: string;
  createdDate: string;
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status:
    | "Present"
    | "Absent"
    | "Half Day"
    | "Late"
    | "On Leave"
    | "Holiday"
    | "Week Off";
  remarks?: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  description?: string;
  totalDays?: number;
  status: string;
}

interface LeaveRequest {
  id: string;
  requestId?: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: ReactNode;
  iconClassName: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
}: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-gray-700 dark:bg-[#171717] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
            {value}
          </p>

          <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
            {subtitle}
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

function getStatusClass(status: string) {
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

    case "Pending":
      return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400";

    case "Approved":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";

    case "Cancelled":
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

function formatShortDate(dateString: string) {
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
  });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [department, setDepartment] =
    useState<Department | null>(null);

  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);

  const [leaveRequests, setLeaveRequests] = useState<
    LeaveRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState<
    "" | "check-in" | "check-out"
  >("");

  const [attendanceMessage, setAttendanceMessage] =
    useState("");

  const [attendanceError, setAttendanceError] =
    useState("");

  /*
   * Today's date.
   */
  const today = new Date()
    .toISOString()
    .split("T")[0];

  /*
   * Load employee dashboard data.
   */
  useEffect(() => {
    let cancelled = false;

    const loadDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          departmentsResponse,
          attendanceResponse,
          leaveTypesResponse,
          leaveRequestsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
          api.get<Attendance[]>("/attendance"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<LeaveRequest[]>("/leaveRequests"),
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

        if (currentEmployee) {
          const currentDepartment =
            departmentsResponse.data.find(
              (item) =>
                item.departmentId ===
                  currentEmployee.departmentId ||
                item.id === currentEmployee.departmentId,
            ) || null;

          setDepartment(currentDepartment);
        } else {
          setDepartment(null);
        }

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

        setLeaveTypes(leaveTypesResponse.data);

        const employeeLeaveRequests =
          leaveRequestsResponse.data.filter((item) =>
            employeeIds.has(item.employeeId),
          );

        setLeaveRequests(employeeLeaveRequests);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load employee dashboard:",
          err,
        );

        setError(
          "Unable to load your dashboard. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  /*
   * Today's attendance record.
   */
  const todayAttendance = useMemo(() => {
    return (
      attendance.find(
        (item) => item.date === today,
      ) || null
    );
  }, [attendance, today]);

  /*
   * Attendance summary.
   */
  const presentDays = useMemo(() => {
    return attendance.filter(
      (item) =>
        item.status === "Present" ||
        item.status === "Late",
    ).length;
  }, [attendance]);

  const absentDays = useMemo(() => {
    return attendance.filter(
      (item) => item.status === "Absent",
    ).length;
  }, [attendance]);

  const leaveDays = useMemo(() => {
    return attendance.filter(
      (item) => item.status === "On Leave",
    ).length;
  }, [attendance]);

  /*
   * Leave summary.
   */
  const approvedLeaveRequests = useMemo(() => {
    return leaveRequests.filter(
      (request) => request.status === "Approved",
    );
  }, [leaveRequests]);

  const pendingLeaveRequests = useMemo(() => {
    return leaveRequests.filter(
      (request) => request.status === "Pending",
    );
  }, [leaveRequests]);

  const totalApprovedLeaveDays = useMemo(() => {
    return approvedLeaveRequests.reduce(
      (total, request) =>
        total + Number(request.numberOfDays || 0),
      0,
    );
  }, [approvedLeaveRequests]);

  const totalAllocatedLeave = useMemo(() => {
    return leaveTypes
      .filter(
        (leaveType) => leaveType.status === "Active",
      )
      .reduce(
        (total, leaveType) =>
          total + Number(leaveType.totalDays || 0),
        0,
      );
  }, [leaveTypes]);

  const totalRemainingLeave = Math.max(
    totalAllocatedLeave - totalApprovedLeaveDays,
    0,
  );

  /*
   * Recent attendance.
   */
  const recentAttendance = useMemo(() => {
    return [...attendance]
      .sort((a, b) =>
        b.date.localeCompare(a.date),
      )
      .slice(0, 5);
  }, [attendance]);

  /*
   * Recent leave requests.
   */
  const recentLeaveRequests = useMemo(() => {
    return [...leaveRequests]
      .sort((a, b) =>
        b.appliedDate.localeCompare(a.appliedDate),
      )
      .slice(0, 5);
  }, [leaveRequests]);

  /*
   * Active leave types.
   */
  const activeLeaveTypes = useMemo(
    () =>
      leaveTypes.filter(
        (leaveType) => leaveType.status === "Active",
      ),
    [leaveTypes],
  );

  /*
   * Get leave type name.
   */
  const getLeaveTypeName = (
    leaveTypeId: string,
  ) => {
    return (
      leaveTypes.find(
        (leaveType) =>
          leaveType.leaveTypeId === leaveTypeId ||
          leaveType.id === leaveTypeId,
      )?.name || "Leave"
    );
  };

  /*
   * Calculate employee leave balance.
   */
  const getLeaveTypeBalance = (
    leaveType: LeaveType,
  ) => {
    const allocated = Number(
      leaveType.totalDays || 0,
    );

    const used = approvedLeaveRequests
      .filter(
        (request) =>
          request.leaveTypeId ===
            leaveType.leaveTypeId ||
          request.leaveTypeId === leaveType.id,
      )
      .reduce(
        (total, request) =>
          total + Number(request.numberOfDays || 0),
        0,
      );

    const pending = pendingLeaveRequests
      .filter(
        (request) =>
          request.leaveTypeId ===
            leaveType.leaveTypeId ||
          request.leaveTypeId === leaveType.id,
      )
      .reduce(
        (total, request) =>
          total + Number(request.numberOfDays || 0),
        0,
      );

    return {
      allocated,
      used,
      pending,
      remaining: Math.max(
        allocated - used,
        0,
      ),
    };
  };

  /*
   * Get current time in HH:mm format.
   */
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      },
    );
  };

  /*
   * Calculate working hours.
   */
  const calculateWorkingHours = (
    checkIn: string,
    checkOut: string,
  ) => {
    if (!checkIn || !checkOut) {
      return "0h 0m";
    }

    const [startHour, startMinute] =
      checkIn.split(":").map(Number);

    const [endHour, endMinute] =
      checkOut.split(":").map(Number);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return "0h 0m";
    }

    const startTotal =
      startHour * 60 + startMinute;

    const endTotal =
      endHour * 60 + endMinute;

    let difference = endTotal - startTotal;

    if (difference < 0) {
      difference += 24 * 60;
    }

    const hours = Math.floor(
      difference / 60,
    );

    const minutes = difference % 60;

    return `${hours}h ${minutes}m`;
  };

  /*
   * Check In.
   */
  const handleCheckIn = async () => {
    if (!employee) {
      setAttendanceError(
        "Employee information could not be found.",
      );
      return;
    }

    if (todayAttendance?.checkIn) {
      return;
    }

    try {
      setActionLoading("check-in");
      setAttendanceMessage("");
      setAttendanceError("");

      const currentTime = getCurrentTime();

      if (todayAttendance) {
        const response =
          await api.patch<Attendance>(
            `/attendance/${todayAttendance.id}`,
            {
              checkIn: currentTime,
              status:
                todayAttendance.status === "Absent"
                  ? "Present"
                  : todayAttendance.status,
            },
          );

        setAttendance((current) =>
          current.map((record) =>
            record.id === todayAttendance.id
              ? response.data
              : record,
          ),
        );
      } else {
        const newAttendance: Attendance = {
          id: `ATT${Date.now()}`,
          employeeId: employee.employeeId,
          date: today,
          checkIn: currentTime,
          checkOut: "",
          workingHours: "0h 0m",
          status: "Present",
          remarks:
            "Checked in by employee.",
        };

        const response =
          await api.post<Attendance>(
            "/attendance",
            newAttendance,
          );

        setAttendance((current) => [
          response.data,
          ...current,
        ]);
      }

      setAttendanceMessage(
        `Check-in recorded at ${currentTime}.`,
      );
    } catch (err) {
      console.error(
        "Check-in failed:",
        err,
      );

      setAttendanceError(
        "Unable to record check-in. Please try again.",
      );
    } finally {
      setActionLoading("");
    }
  };

  /*
   * Check Out.
   */
  const handleCheckOut = async () => {
    if (!todayAttendance?.checkIn) {
      setAttendanceError(
        "Please check in before checking out.",
      );
      return;
    }

    if (todayAttendance.checkOut) {
      return;
    }

    try {
      setActionLoading("check-out");
      setAttendanceMessage("");
      setAttendanceError("");

      const currentTime = getCurrentTime();

      const workingHours =
        calculateWorkingHours(
          todayAttendance.checkIn,
          currentTime,
        );

      const response =
        await api.patch<Attendance>(
          `/attendance/${todayAttendance.id}`,
          {
            checkOut: currentTime,
            workingHours,
          },
        );

      setAttendance((current) =>
        current.map((record) =>
          record.id === todayAttendance.id
            ? response.data
            : record,
        ),
      );

      setAttendanceMessage(
        `Check-out recorded at ${currentTime}. Working hours: ${workingHours}.`,
      );
    } catch (err) {
      console.error(
        "Check-out failed:",
        err,
      );

      setAttendanceError(
        "Unable to record check-out. Please try again.",
      );
    } finally {
      setActionLoading("");
    }
  };

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0066FF] dark:border-gray-700 dark:border-t-[#1E90FF]" />

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-[#171717]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <UserX className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
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
      {/* Welcome Section */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
          <div className="flex min-w-0 items-center gap-4">
            {employee?.profileImage ? (
              <img
                src={employee.profileImage}
                alt={employee.fullName}
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-4 ring-blue-50 dark:ring-blue-500/10 sm:h-16 sm:w-16"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF] sm:h-16 sm:w-16">
                {employee?.fullName
                  ?.charAt(0)
                  .toUpperCase() || "E"}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-sm font-medium text-[#0066FF] dark:text-[#1E90FF]">
                Welcome back!
              </p>

              <h1 className="mt-1 truncate text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
                {employee?.fullName ||
                  user?.name}
              </h1>

              <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                {employee?.designation ||
                  "Employee"}

                {department?.name
                  ? ` • ${department.name}`
                  : ""}
              </p>
            </div>
          </div>

          <Link
            to="/employee/profile"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
          >
            <User className="h-4 w-4" />
            My Profile
          </Link>
        </div>
      </section>

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
            className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
              todayAttendance
                ? getStatusClass(
                    todayAttendance.status,
                  )
                : "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
            }`}
          >
            {todayAttendance?.status ||
              "Not Marked"}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* Check In */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check In
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.checkIn ||
                "--"}
            </p>
          </div>

          {/* Check Out */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <LogOut className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check Out
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.checkOut ||
                "--"}
            </p>
          </div>

          {/* Working Hours */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
            <div className="flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-[#0066FF] dark:text-[#1E90FF]" />

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Working Hours
              </p>
            </div>

            <p className="mt-2 text-lg font-bold text-[#1A1A2E] dark:text-white">
              {todayAttendance?.workingHours ||
                "--"}
            </p>
          </div>
        </div>

        {/* Check In / Check Out */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleCheckIn}
            disabled={
              Boolean(actionLoading) ||
              Boolean(todayAttendance?.checkIn)
            }
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1E90FF] dark:hover:bg-blue-500"
          >
            <LogIn className="h-4 w-4" />

            {actionLoading === "check-in"
              ? "Checking In..."
              : todayAttendance?.checkIn
                ? "Checked In"
                : "Check In"}
          </button>

          <button
            type="button"
            onClick={handleCheckOut}
            disabled={
              Boolean(actionLoading) ||
              !todayAttendance?.checkIn ||
              Boolean(todayAttendance?.checkOut)
            }
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
          >
            <LogOut className="h-4 w-4" />

            {actionLoading === "check-out"
              ? "Checking Out..."
              : todayAttendance?.checkOut
                ? "Checked Out"
                : "Check Out"}
          </button>
        </div>

        {attendanceMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-400">
            {attendanceMessage}
          </div>
        )}

        {attendanceError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-500/10 dark:text-red-400">
            {attendanceError}
          </div>
        )}

        <div className="mt-5">
          <Link
            to="/employee/attendance"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0066FF] transition hover:text-blue-700 dark:text-[#1E90FF] dark:hover:text-blue-300"
          >
            View attendance history
            <span aria-hidden="true">
              →
            </span>
          </Link>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Present Days"
          value={presentDays}
          subtitle="Present + Late"
          icon={
            <UserCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          }
          iconClassName="bg-emerald-100 dark:bg-emerald-500/10"
        />

        <StatCard
          title="Absent Days"
          value={absentDays}
          subtitle="Attendance records"
          icon={
            <UserX className="h-5 w-5 text-red-600 dark:text-red-300" />
          }
          iconClassName="bg-red-100 dark:bg-red-500/10"
        />

        <StatCard
          title="Leave Days"
          value={leaveDays}
          subtitle="On leave"
          icon={
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          }
          iconClassName="bg-blue-100 dark:bg-blue-500/10"
        />

        <StatCard
          title="Remaining Leave"
          value={totalRemainingLeave}
          subtitle={`${pendingLeaveRequests.length} pending request${
            pendingLeaveRequests.length ===
            1
              ? ""
              : "s"
          }`}
          icon={
            <CheckCircle2 className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          }
          iconClassName="bg-violet-100 dark:bg-violet-500/10"
        />
      </div>

      {/* Leave Balance + Quick Actions */}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        {/* Leave Balance */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#171717] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                Leave Balance
              </h2>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Your current leave balance
              </p>
            </div>

            <Link
              to="/employee/leave-balance"
              className="shrink-0 text-xs font-semibold text-[#0066FF] hover:text-blue-700 dark:text-[#1E90FF] dark:hover:text-blue-300 sm:text-sm"
            >
              View all
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {activeLeaveTypes
              .slice(0, 4)
              .map((leaveType) => {
                const balance =
                  getLeaveTypeBalance(
                    leaveType,
                  );

                const progress =
                  balance.allocated > 0
                    ? Math.min(
                        Math.round(
                          (balance.used /
                            balance.allocated) *
                            100,
                        ),
                        100,
                      )
                    : 0;

                return (
                  <div
                    key={leaveType.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:shadow-sm dark:border-gray-700 dark:bg-[#202020]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        {leaveType.name}
                      </p>

                      <span className="shrink-0 text-sm font-bold text-[#0066FF] dark:text-[#1E90FF]">
                        {balance.remaining} days
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded-full transition-all ${
                          progress >= 90
                            ? "bg-red-500"
                            : progress >= 70
                              ? "bg-amber-500"
                              : "bg-[#0066FF] dark:bg-[#1E90FF]"
                        }`}
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        Used {balance.used} of{" "}
                        {balance.allocated}
                      </span>

                      {balance.pending >
                        0 && (
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {balance.pending}{" "}
                          pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeLeaveTypes.length ===
              0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
                <CalendarDays className="mx-auto h-7 w-7 text-gray-400 dark:text-gray-500" />

                <p className="mt-2 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  No leave types available
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#171717] sm:p-6">
          <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-white">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Frequently used options
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Link
              to="/employee/apply-leave"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-[#0066FF] hover:bg-blue-50 dark:border-gray-700 dark:bg-[#202020] dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                <CalendarDays className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  Apply Leave
                </p>

                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Submit a new request
                </p>
              </div>
            </Link>

            <Link
              to="/employee/attendance"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-[#0066FF] hover:bg-blue-50 dark:border-gray-700 dark:bg-[#202020] dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                <Clock3 className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  My Attendance
                </p>

                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  View attendance history
                </p>
              </div>
            </Link>

            <Link
              to="/employee/leave-requests"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-[#0066FF] hover:bg-blue-50 dark:border-gray-700 dark:bg-[#202020] dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
                <FileText className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  My Leave Requests
                </p>

                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  Track your requests
                </p>
              </div>
            </Link>

            <Link
              to="/employee/profile"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 transition hover:border-[#0066FF] hover:bg-blue-50 dark:border-gray-700 dark:bg-[#202020] dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                <User className="h-5 w-5 transition-transform group-hover:scale-110" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                  My Profile
                </p>

                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  View your information
                </p>
              </div>
            </Link>
          </div>
        </section>
      </div>

      {/* Recent Leave Requests */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
              Recent Leave Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your latest leave requests
            </p>
          </div>

          <Link
            to="/employee/leave-requests"
            className="shrink-0 text-xs font-semibold text-[#0066FF] hover:text-blue-700 dark:text-[#1E90FF] dark:hover:text-blue-300 sm:text-sm"
          >
            View all
          </Link>
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-[#202020]">
                <th className="w-[25%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Leave Type
                </th>

                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Dates
                </th>

                <th className="w-[15%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Days
                </th>

                <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>

                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Applied
                </th>
              </tr>
            </thead>

            <tbody>
              {recentLeaveRequests.map(
                (request) => (
                  <tr
                    key={request.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="min-w-0 px-4 py-4">
                      <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        {getLeaveTypeName(
                          request.leaveTypeId,
                        )}
                      </p>
                    </td>

                    <td className="min-w-0 px-4 py-4">
                      <p className="truncate text-xs text-gray-600 dark:text-gray-300">
                        {formatShortDate(
                          request.fromDate,
                        )}{" "}
                        -{" "}
                        {formatShortDate(
                          request.toDate,
                        )}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {request.numberOfDays}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        {request.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(
                        request.appliedDate,
                      )}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 p-4 md:hidden">
          {recentLeaveRequests.map(
            (request) => (
              <div
                key={request.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                      {getLeaveTypeName(
                        request.leaveTypeId,
                      )}
                    </p>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formatShortDate(
                        request.fromDate,
                      )}{" "}
                      -{" "}
                      {formatShortDate(
                        request.toDate,
                      )}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    {request.numberOfDays} day
                    {request.numberOfDays ===
                    1
                      ? ""
                      : "s"}
                  </span>

                  <span className="text-gray-500 dark:text-gray-400">
                    {formatDate(
                      request.appliedDate,
                    )}
                  </span>
                </div>
              </div>
            ),
          )}

          {recentLeaveRequests.length ===
            0 && (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No leave requests found.
            </div>
          )}
        </div>

        {recentLeaveRequests.length ===
          0 && (
          <div className="hidden py-10 text-center text-sm text-gray-500 dark:text-gray-400 md:block">
            No leave requests found.
          </div>
        )}
      </section>

      {/* Recent Attendance */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-700 sm:p-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
              Recent Attendance
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Your latest attendance records
            </p>
          </div>

          <Link
            to="/employee/attendance"
            className="shrink-0 text-xs font-semibold text-[#0066FF] hover:text-blue-700 dark:text-[#1E90FF] dark:hover:text-blue-300 sm:text-sm"
          >
            View all
          </Link>
        </div>

        <div className="hidden md:block">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-[#202020]">
                <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Date
                </th>

                <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Check In
                </th>

                <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Check Out
                </th>

                <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Hours
                </th>

                <th className="w-[20%] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {recentAttendance.map(
                (record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <td className="px-4 py-4 text-sm font-medium text-[#1A1A2E] dark:text-white">
                      {formatDate(record.date)}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                      {record.checkIn ||
                        "--"}
                    </td>

                    <td className="px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-300">
                      {record.checkOut ||
                        "--"}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-medium text-[#1A1A2E] dark:text-white">
                      {record.workingHours ||
                        "--"}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-3 p-4 md:hidden">
          {recentAttendance.map(
            (record) => (
              <div
                key={record.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                    {formatDate(record.date)}
                  </p>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                      record.status,
                    )}`}
                  >
                    {record.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-white p-2.5 text-center dark:bg-[#171717]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      In
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#1A1A2E] dark:text-white">
                      {record.checkIn ||
                        "--"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 text-center dark:bg-[#171717]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Out
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#1A1A2E] dark:text-white">
                      {record.checkOut ||
                        "--"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white p-2.5 text-center dark:bg-[#171717]">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Hours
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#1A1A2E] dark:text-white">
                      {record.workingHours ||
                        "--"}
                    </p>
                  </div>
                </div>
              </div>
            ),
          )}

          {recentAttendance.length ===
            0 && (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No attendance records found.
            </div>
          )}
        </div>

        {recentAttendance.length ===
          0 && (
          <div className="hidden py-10 text-center text-sm text-gray-500 dark:text-gray-400 md:block">
            No attendance records found.
          </div>
        )}
      </section>
    </div>
  );
}