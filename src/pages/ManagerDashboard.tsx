import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";

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
  employmentStatus:
    | "Active"
    | "Inactive"
    | "On Notice"
    | "Resigned";
  profileImage: string;
  createdDate: string;
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
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: AttendanceStatus;
  remarks: string;
}

type LeaveRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

interface LeaveRequest {
  id: string;
  leaveId?: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days?: number;
  numberOfDays?: number;
  reason: string;
  appliedDate: string;
  status: LeaveRequestStatus;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  description?: string;
  maximumDays?: number;
  status?: "Active" | "Inactive";
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: ReactNode;
  iconBackground: string;
  iconColor: string;
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconBackground,
  iconColor,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-2xl border p-5 shadow-sm
        border-[#E1E5EA]
        bg-white
        transition-all duration-200
        hover:-translate-y-1
        hover:border-[#B8D1FF]
        hover:shadow-lg
        dark:border-[#333333]
        dark:bg-[#181818]
        dark:hover:border-[#3B82F6]
        dark:hover:bg-[#1D1D1D]
      "
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className="
              text-sm font-medium
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            {title}
          </p>

          <p
            className="
              mt-2 text-3xl font-bold tracking-tight
              text-[#1A1A2E]
              dark:text-white
            "
          >
            {value}
          </p>

          <p
            className="
              mt-1 text-xs
              text-[#98A2B3]
              dark:text-[#888888]
            "
          >
            {subtitle}
          </p>
        </div>

        <div
          className={`
            flex h-11 w-11 shrink-0
            items-center justify-center
            rounded-xl
            transition-transform duration-200
            group-hover:scale-110
            ${iconBackground}
            ${iconColor}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function getDateOnly(date: string) {
  return date.split("T")[0];
}

function calculateLeaveDays(request: LeaveRequest) {
  if (
    typeof request.days === "number" &&
    request.days > 0
  ) {
    return request.days;
  }

  if (
    typeof request.numberOfDays === "number" &&
    request.numberOfDays > 0
  ) {
    return request.numberOfDays;
  }

  if (!request.startDate || !request.endDate) {
    return 0;
  }

  const start = new Date(
    `${getDateOnly(request.startDate)}T00:00:00`,
  );

  const end = new Date(
    `${getDateOnly(request.endDate)}T00:00:00`,
  );

  const difference =
    end.getTime() - start.getTime();

  return (
    Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ) + 1
  );
}

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(
    `${getDateOnly(date)}T00:00:00`,
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
  if (!time) {
    return "—";
  }

  const parsedDate = new Date(
    `1970-01-01T${time}`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return time;
  }

  return parsedDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
        bg-[#EEF4FF] text-[#0066FF]
        dark:bg-[#10233F] dark:text-[#4D9AFF]
      `;

    case "On Leave":
      return `
        bg-[#F3E8FF] text-[#7E22CE]
        dark:bg-[#2D1B3D] dark:text-[#C084FC]
      `;

    case "Holiday":
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

function getLeaveStatusClass(
  status: LeaveRequestStatus,
) {
  switch (status) {
    case "Approved":
      return `
        bg-[#E8F8EF] text-[#16834B]
        dark:bg-[#183A2A] dark:text-[#00FF85]
      `;

    case "Rejected":
      return `
        bg-[#FDECEC] text-[#C53030]
        dark:bg-[#3A2020] dark:text-[#FF8A8A]
      `;

    case "Cancelled":
      return `
        bg-[#F1F5F9] text-[#64748B]
        dark:bg-[#292929] dark:text-[#B3B3B3]
      `;

    default:
      return `
        bg-[#FFF5D9] text-[#A16207]
        dark:bg-[#3A321A] dark:text-[#FFD166]
      `;
  }
}

export default function ManagerDashboard() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>([]);

  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          attendanceResponse,
          leaveRequestsResponse,
          leaveTypesResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Attendance[]>("/attendance"),
          api.get<LeaveRequest[]>(
            "/leaveRequests",
          ),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<Department[]>("/departments"),
        ]);

        if (cancelled) {
          return;
        }

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

        setLeaveRequests(
          Array.isArray(
            leaveRequestsResponse.data,
          )
            ? leaveRequestsResponse.data
            : [],
        );

        setLeaveTypes(
          Array.isArray(leaveTypesResponse.data)
            ? leaveTypesResponse.data
            : [],
        );

        setDepartments(
          Array.isArray(
            departmentsResponse.data,
          )
            ? departmentsResponse.data
            : [],
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load manager dashboard:",
          err,
        );

        setError(
          "Unable to load dashboard data. Please make sure JSON Server is running.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => {
    return new Date()
      .toISOString()
      .split("T")[0];
  }, []);

  const managerEmployee = useMemo(() => {
    if (!user) {
      return undefined;
    }

    return employees.find(
      (employee) =>
        employee.employeeId === user.employeeId ||
        employee.id === user.employeeId,
    );
  }, [employees, user]);

  const teamMembers = useMemo(() => {
    if (!user) {
      return [];
    }

    const managerIds = new Set<string>();

    if (user.employeeId) {
      managerIds.add(user.employeeId);
    }

    if (managerEmployee?.id) {
      managerIds.add(managerEmployee.id);
    }

    if (managerEmployee?.employeeId) {
      managerIds.add(
        managerEmployee.employeeId,
      );
    }

    return employees.filter((employee) => {
      if (
        employee.employmentStatus &&
        employee.employmentStatus !== "Active"
      ) {
        return false;
      }

      return (
        employee.managerId !== null &&
        employee.managerId !== undefined &&
        managerIds.has(employee.managerId)
      );
    });
  }, [employees, managerEmployee, user]);

  const teamEmployeeIds = useMemo(() => {
    const ids = new Set<string>();

    teamMembers.forEach((employee) => {
      ids.add(employee.id);
      ids.add(employee.employeeId);
    });

    return ids;
  }, [teamMembers]);

  const teamAttendanceToday = useMemo(() => {
    return attendance.filter(
      (record) =>
        record.date === today &&
        teamEmployeeIds.has(record.employeeId),
    );
  }, [
    attendance,
    teamEmployeeIds,
    today,
  ]);

  const presentToday = useMemo(() => {
    return teamAttendanceToday.filter(
      (record) =>
        record.status === "Present" ||
        record.status === "Late",
    ).length;
  }, [teamAttendanceToday]);

  const absentToday = useMemo(() => {
    return teamAttendanceToday.filter(
      (record) =>
        record.status === "Absent",
    ).length;
  }, [teamAttendanceToday]);

  const onLeaveToday = useMemo(() => {
    return teamAttendanceToday.filter(
      (record) =>
        record.status === "On Leave",
    ).length;
  }, [teamAttendanceToday]);

  const pendingApprovals = useMemo(() => {
    return leaveRequests.filter(
      (request) =>
        request.status === "Pending" &&
        teamEmployeeIds.has(request.employeeId),
    );
  }, [
    leaveRequests,
    teamEmployeeIds,
  ]);

  const teamLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) =>
      teamEmployeeIds.has(request.employeeId),
    );
  }, [
    leaveRequests,
    teamEmployeeIds,
  ]);

  const approvedLeaves = useMemo(() => {
    return teamLeaveRequests.filter(
      (request) =>
        request.status === "Approved",
    ).length;
  }, [teamLeaveRequests]);

  const rejectedLeaves = useMemo(() => {
    return teamLeaveRequests.filter(
      (request) =>
        request.status === "Rejected",
    ).length;
  }, [teamLeaveRequests]);

  const attendancePercentage = useMemo(() => {
    if (teamMembers.length === 0) {
      return 0;
    }

    return Math.round(
      (presentToday / teamMembers.length) *
        100,
    );
  }, [
    presentToday,
    teamMembers.length,
  ]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();

    departments.forEach((department) => {
      map.set(
        department.id,
        department.name,
      );

      map.set(
        department.departmentId,
        department.name,
      );
    });

    return map;
  }, [departments]);

  const leaveTypeMap = useMemo(() => {
    const map = new Map<string, string>();

    leaveTypes.forEach((leaveType) => {
      map.set(
        leaveType.id,
        leaveType.name,
      );

      map.set(
        leaveType.leaveTypeId,
        leaveType.name,
      );
    });

    return map;
  }, [leaveTypes]);

  const employeeMap = useMemo(() => {
    const map = new Map<
      string,
      Employee
    >();

    employees.forEach((employee) => {
      map.set(employee.id, employee);
      map.set(
        employee.employeeId,
        employee,
      );
    });

    return map;
  }, [employees]);

  const recentPendingRequests = useMemo(() => {
    return [...pendingApprovals]
      .sort(
        (a, b) =>
          new Date(
            b.appliedDate,
          ).getTime() -
          new Date(
            a.appliedDate,
          ).getTime(),
      )
      .slice(0, 5);
  }, [pendingApprovals]);

  const recentTeamAttendance = useMemo(() => {
    return [...teamAttendanceToday].sort(
      (a, b) => {
        const employeeA =
          employeeMap.get(
            a.employeeId,
          )?.fullName ?? "";

        const employeeB =
          employeeMap.get(
            b.employeeId,
          )?.fullName ?? "";

        return employeeA.localeCompare(
          employeeB,
        );
      },
    );
  }, [
    employeeMap,
    teamAttendanceToday,
  ]);

  const getEmployee = (
    employeeId: string,
  ) => {
    return employeeMap.get(employeeId);
  };

  const getDepartmentName = (
    departmentId: string,
  ) => {
    return (
      departmentMap.get(departmentId) ??
      "Unknown Department"
    );
  };

  const getLeaveTypeName = (
    leaveTypeId: string,
  ) => {
    return (
      leaveTypeMap.get(leaveTypeId) ??
      leaveTypeId
    );
  };

  if (loading) {
    return (
      <div
        className="
          min-h-full w-full
          bg-[#F8F9FA]
          dark:bg-[#0D0D0D]
        "
      >
        <div className="space-y-6">
          <div
            className="
              h-8 w-56 animate-pulse rounded-lg
              bg-[#E5E7EB]
              dark:bg-[#292929]
            "
          />

          <div
            className="
              h-5 w-80 animate-pulse rounded-lg
              bg-[#E5E7EB]
              dark:bg-[#292929]
            "
          />

          <div
            className="
              grid grid-cols-1 gap-4
              sm:grid-cols-2
              xl:grid-cols-5
            "
          >
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="
                  h-36 animate-pulse rounded-2xl
                  bg-white
                  dark:bg-[#181818]
                "
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="
          min-h-full w-full
          bg-[#F8F9FA]
          dark:bg-[#0D0D0D]
        "
      >
        <div
          className="
            rounded-2xl border p-6
            border-[#FECACA]
            bg-[#FEF2F2]
            dark:border-[#542020]
            dark:bg-[#211414]
          "
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className="
                mt-0.5 shrink-0
                text-[#DC2626]
                dark:text-[#FF8A8A]
              "
              size={22}
            />

            <div>
              <h2
                className="
                  text-base font-semibold
                  text-[#991B1B]
                  dark:text-[#FF8A8A]
                "
              >
                Unable to load Manager Dashboard
              </h2>

              <p
                className="
                  mt-1 text-sm
                  text-[#7F1D1D]
                  dark:text-[#D6D6D6]
                "
              >
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-full w-full min-w-0
        space-y-6 overflow-x-hidden
        bg-[#F8F9FA]
        text-[#1A1A2E]
        dark:bg-[#0D0D0D]
        dark:text-white
      "
    >
      {/* PAGE HEADER */}

      <div
        className="
          flex flex-col gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-sm font-medium
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Manager Portal
          </p>

          <h1
            className="
              mt-1 text-2xl font-bold tracking-tight
              text-[#1A1A2E]
              dark:text-white
              sm:text-3xl
            "
          >
            Manager Dashboard
          </h1>

          <p
            className="
              mt-1 text-sm
              text-[#667085]
              dark:text-[#999999]
            "
          >
            Welcome back,{" "}
            <span className="font-semibold">
              {managerEmployee?.fullName ??
                user?.name ??
                "Manager"}
            </span>
            . Here's your team's overview.
          </p>
        </div>

        <div
          className="
            flex w-fit items-center gap-2
            rounded-xl border px-3 py-2
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:border-[#B8D1FF]
            hover:shadow-sm
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
          "
        >
          <CalendarDays
            size={16}
            className="
              text-[#0066FF]
              dark:text-[#4D9AFF]
            "
          />

          <span
            className="
              text-sm font-medium
              text-[#475467]
              dark:text-[#C7C7C7]
            "
          >
            {formatDate(today)}
          </span>
        </div>
      </div>

      {/* STAT CARDS */}

      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
          xl:grid-cols-5
        "
      >
        <StatCard
          title="Total Team Members"
          value={teamMembers.length}
          subtitle="Active team members"
          icon={<Users size={21} />}
          iconBackground="
            bg-[#EAF2FF]
            dark:bg-[#10233F]
          "
          iconColor="
            text-[#0066FF]
            dark:text-[#4D9AFF]
          "
        />

        <StatCard
          title="Present Today"
          value={presentToday}
          subtitle={`${attendancePercentage}% of team`}
          icon={<UserCheck size={21} />}
          iconBackground="
            bg-[#E8F8EF]
            dark:bg-[#183A2A]
          "
          iconColor="
            text-[#16834B]
            dark:text-[#00FF85]
          "
        />

        <StatCard
          title="Absent Today"
          value={absentToday}
          subtitle="Team members absent"
          icon={<UserX size={21} />}
          iconBackground="
            bg-[#FDECEC]
            dark:bg-[#3A2020]
          "
          iconColor="
            text-[#C53030]
            dark:text-[#FF8A8A]
          "
        />

        <StatCard
          title="On Leave Today"
          value={onLeaveToday}
          subtitle="Team members on leave"
          icon={<CalendarDays size={21} />}
          iconBackground="
            bg-[#F3E8FF]
            dark:bg-[#2D1B3D]
          "
          iconColor="
            text-[#7E22CE]
            dark:text-[#C084FC]
          "
        />

        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Leave requests to review"
          icon={<Clock3 size={21} />}
          iconBackground="
            bg-[#FFF5D9]
            dark:bg-[#3A321A]
          "
          iconColor="
            text-[#A16207]
            dark:text-[#FFD166]
          "
        />
      </div>

      {/* SECONDARY SUMMARY */}

      <div
        className="
          grid grid-cols-1 gap-4
          md:grid-cols-3
        "
      >
        <div
          className="
            rounded-2xl border p-5
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:-translate-y-1
            hover:border-[#B8D1FF]
            hover:shadow-md
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
            dark:hover:bg-[#1D1D1D]
          "
        >
          <p
            className="
              text-sm font-medium
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Attendance Percentage
          </p>

          <div className="mt-4 flex items-end gap-3">
            <span
              className="
                text-3xl font-bold
                text-[#0066FF]
                dark:text-[#4D9AFF]
              "
            >
              {attendancePercentage}%
            </span>

            <span
              className="
                pb-1 text-xs
                text-[#98A2B3]
                dark:text-[#888888]
              "
            >
              today
            </span>
          </div>

          <div
            className="
              mt-4 h-2 overflow-hidden rounded-full
              bg-[#E5E7EB]
              dark:bg-[#333333]
            "
          >
            <div
              className="
                h-full rounded-full
                bg-[#0066FF]
                transition-all duration-500
                dark:bg-[#1E90FF]
              "
              style={{
                width: `${Math.min(
                  attendancePercentage,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>

        <div
          className="
            rounded-2xl border p-5
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:-translate-y-1
            hover:border-[#B8D1FF]
            hover:shadow-md
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
            dark:hover:bg-[#1D1D1D]
          "
        >
          <p
            className="
              text-sm font-medium
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Leave Summary
          </p>

          <div
            className="
              mt-4 grid grid-cols-2 gap-4
            "
          >
            <div>
              <p
                className="
                  text-2xl font-bold
                  text-[#16834B]
                  dark:text-[#00FF85]
                "
              >
                {approvedLeaves}
              </p>

              <p
                className="
                  mt-1 text-xs
                  text-[#98A2B3]
                  dark:text-[#888888]
                "
              >
                Approved
              </p>
            </div>

            <div>
              <p
                className="
                  text-2xl font-bold
                  text-[#C53030]
                  dark:text-[#FF8A8A]
                "
              >
                {rejectedLeaves}
              </p>

              <p
                className="
                  mt-1 text-xs
                  text-[#98A2B3]
                  dark:text-[#888888]
                "
              >
                Rejected
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            rounded-2xl border p-5
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:-translate-y-1
            hover:border-[#B8D1FF]
            hover:shadow-md
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
            dark:hover:bg-[#1D1D1D]
          "
        >
          <p
            className="
              text-sm font-medium
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Team Information
          </p>

          <div className="mt-4">
            <p
              className="
                text-lg font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              {managerEmployee?.designation ??
                "Manager"}
            </p>

            <p
              className="
                mt-1 text-sm
                text-[#667085]
                dark:text-[#999999]
              "
            >
              {managerEmployee
                ? getDepartmentName(
                    managerEmployee.departmentId,
                  )
                : "Team Manager"}
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}

      <div
        className="
          grid grid-cols-1 gap-6
          xl:grid-cols-[1.45fr_1fr]
        "
      >
        {/* TODAY'S TEAM ATTENDANCE */}

        <section
          className="
            min-w-0 overflow-hidden rounded-2xl border
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:border-[#B8D1FF]
            hover:shadow-md
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
          "
        >
          <div
            className="
              flex flex-col gap-3 border-b p-5
              border-[#E1E5EA]
              dark:border-[#333333]
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <div>
              <h2
                className="
                  text-base font-semibold
                  text-[#1A1A2E]
                  dark:text-white
                "
              >
                Today's Team Attendance
              </h2>

              <p
                className="
                  mt-1 text-xs
                  text-[#667085]
                  dark:text-[#888888]
                "
              >
                Attendance status of your team members
              </p>
            </div>

            <Link
              to="/manager/attendance"
              className="
                group inline-flex items-center gap-1.5
                text-sm font-semibold
                text-[#0066FF]
                transition-all duration-200
                hover:gap-2
                hover:text-[#0052CC]
                dark:text-[#4D9AFF]
                dark:hover:text-white
              "
            >
              View all
              <ArrowRight
                size={15}
                className="
                  transition-transform duration-200
                  group-hover:translate-x-0.5
                "
              />
            </Link>
          </div>

          {recentTeamAttendance.length === 0 ? (
            <div
              className="
                flex min-h-[220px]
                items-center justify-center
                px-5 text-center
              "
            >
              <div>
                <div
                  className="
                    mx-auto flex h-12 w-12
                    items-center justify-center
                    rounded-full
                    bg-[#EEF4FF]
                    text-[#0066FF]
                    transition-transform duration-200
                    hover:scale-110
                    dark:bg-[#10233F]
                    dark:text-[#4D9AFF]
                  "
                >
                  <CalendarDays size={21} />
                </div>

                <p
                  className="
                    mt-4 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  No attendance recorded today
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-[#98A2B3]
                    dark:text-[#888888]
                  "
                >
                  Attendance records for your team
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[650px]">
                  <thead>
                    <tr
                      className="
                        border-b
                        border-[#E1E5EA]
                        bg-[#F8F9FA]
                        dark:border-[#333333]
                        dark:bg-[#222222]
                      "
                    >
                      <th
                        className="
                          px-5 py-3.5 text-left
                          text-xs font-semibold uppercase
                          tracking-wide
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        Employee
                      </th>

                      <th
                        className="
                          px-5 py-3.5 text-left
                          text-xs font-semibold uppercase
                          tracking-wide
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        Check In
                      </th>

                      <th
                        className="
                          px-5 py-3.5 text-left
                          text-xs font-semibold uppercase
                          tracking-wide
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        Check Out
                      </th>

                      <th
                        className="
                          px-5 py-3.5 text-left
                          text-xs font-semibold uppercase
                          tracking-wide
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTeamAttendance.map(
                      (record) => {
                        const employee =
                          getEmployee(
                            record.employeeId,
                          );

                        return (
                          <tr
                            key={record.id}
                            className="
                              border-b last:border-0
                              border-[#E1E5EA]
                              transition-all duration-200
                              hover:bg-[#F4F8FF]
                              hover:shadow-[inset_3px_0_0_#0066FF]
                              dark:border-[#333333]
                              dark:hover:bg-[#202020]
                              dark:hover:shadow-[inset_3px_0_0_#1E90FF]
                            "
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="
                                    flex h-9 w-9 shrink-0
                                    items-center justify-center
                                    rounded-full
                                    bg-[#EAF2FF]
                                    text-xs font-bold
                                    text-[#0066FF]
                                    dark:bg-[#10233F]
                                    dark:text-[#4D9AFF]
                                  "
                                >
                                  {employee?.fullName
                                    ?.charAt(0)
                                    .toUpperCase() ??
                                    "?"}
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className="
                                      truncate text-sm
                                      font-semibold
                                      text-[#344054]
                                      dark:text-white
                                    "
                                  >
                                    {employee?.fullName ??
                                      "Unknown Employee"}
                                  </p>

                                  <p
                                    className="
                                      text-xs
                                      text-[#98A2B3]
                                      dark:text-[#888888]
                                    "
                                  >
                                    {employee?.employeeId ??
                                      record.employeeId}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td
                              className="
                                px-5 py-4 text-sm
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {formatTime(
                                record.checkIn,
                              )}
                            </td>

                            <td
                              className="
                                px-5 py-4 text-sm
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {formatTime(
                                record.checkOut,
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`
                                  inline-flex rounded-full
                                  px-2.5 py-1
                                  text-xs font-semibold
                                  ${getStatusClass(
                                    record.status,
                                  )}
                                `}
                              >
                                {record.status}
                              </span>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>

              <div
                className="
                  grid grid-cols-1 gap-3 p-4
                  md:hidden
                "
              >
                {recentTeamAttendance.map(
                  (record) => {
                    const employee =
                      getEmployee(
                        record.employeeId,
                      );

                    return (
                      <div
                        key={record.id}
                        className="
                          rounded-xl border p-4
                          border-[#E1E5EA]
                          bg-white
                          transition-all duration-200
                          hover:-translate-y-1
                          hover:border-[#B8D1FF]
                          hover:shadow-md
                          dark:border-[#333333]
                          dark:bg-[#202020]
                          dark:hover:border-[#3B82F6]
                          dark:hover:bg-[#242424]
                        "
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className="
                                flex h-9 w-9 shrink-0
                                items-center justify-center
                                rounded-full
                                bg-[#EAF2FF]
                                text-xs font-bold
                                text-[#0066FF]
                                dark:bg-[#10233F]
                                dark:text-[#4D9AFF]
                              "
                            >
                              {employee?.fullName
                                ?.charAt(0)
                                .toUpperCase() ??
                                "?"}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  truncate text-sm
                                  font-semibold
                                  text-[#344054]
                                  dark:text-white
                                "
                              >
                                {employee?.fullName ??
                                  "Unknown Employee"}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-[#98A2B3]
                                  dark:text-[#888888]
                                "
                              >
                                {employee?.employeeId ??
                                  record.employeeId}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`
                              shrink-0 rounded-full
                              px-2.5 py-1
                              text-[11px] font-semibold
                              ${getStatusClass(
                                record.status,
                              )}
                            `}
                          >
                            {record.status}
                          </span>
                        </div>

                        <div
                          className="
                            mt-4 grid grid-cols-2
                            gap-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[11px]
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              Check In
                            </p>

                            <p
                              className="
                                mt-1 text-sm font-medium
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {formatTime(
                                record.checkIn,
                              )}
                            </p>
                          </div>

                          <div>
                            <p
                              className="
                                text-[11px]
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              Check Out
                            </p>

                            <p
                              className="
                                mt-1 text-sm font-medium
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {formatTime(
                                record.checkOut,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </>
          )}
        </section>

        {/* PENDING LEAVE REQUESTS */}

        <section
          className="
            min-w-0 overflow-hidden rounded-2xl border
            border-[#E1E5EA]
            bg-white
            transition-all duration-200
            hover:border-[#B8D1FF]
            hover:shadow-md
            dark:border-[#333333]
            dark:bg-[#181818]
            dark:hover:border-[#3B82F6]
          "
        >
          <div
            className="
              flex items-center justify-between
              gap-3 border-b p-5
              border-[#E1E5EA]
              dark:border-[#333333]
            "
          >
            <div>
              <h2
                className="
                  text-base font-semibold
                  text-[#1A1A2E]
                  dark:text-white
                "
              >
                Pending Leave Requests
              </h2>

              <p
                className="
                  mt-1 text-xs
                  text-[#667085]
                  dark:text-[#888888]
                "
              >
                Requests awaiting your approval
              </p>
            </div>

            <Link
              to="/manager/leave-requests"
              className="
                group inline-flex items-center gap-1.5
                text-sm font-semibold
                text-[#0066FF]
                transition-all duration-200
                hover:gap-2
                hover:text-[#0052CC]
                dark:text-[#4D9AFF]
                dark:hover:text-white
              "
            >
              View all
              <ArrowRight
                size={15}
                className="
                  transition-transform duration-200
                  group-hover:translate-x-0.5
                "
              />
            </Link>
          </div>

          {recentPendingRequests.length === 0 ? (
            <div
              className="
                flex min-h-[220px]
                items-center justify-center
                px-5 text-center
              "
            >
              <div>
                <div
                  className="
                    mx-auto flex h-12 w-12
                    items-center justify-center
                    rounded-full
                    bg-[#E8F8EF]
                    text-[#16834B]
                    transition-transform duration-200
                    hover:scale-110
                    dark:bg-[#183A2A]
                    dark:text-[#00FF85]
                  "
                >
                  <CheckCircle2 size={21} />
                </div>

                <p
                  className="
                    mt-4 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  No pending requests
                </p>

                <p
                  className="
                    mt-1 text-xs
                    text-[#98A2B3]
                    dark:text-[#888888]
                  "
                >
                  Your team's pending leave requests
                  will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#E1E5EA] dark:divide-[#333333]">
              {recentPendingRequests.map(
                (request) => {
                  const employee =
                    getEmployee(
                      request.employeeId,
                    );

                  return (
                    <div
                      key={request.id}
                      className="
                        group p-5
                        transition-all duration-200
                        hover:bg-[#F4F8FF]
                        hover:shadow-[inset_3px_0_0_#0066FF]
                        dark:hover:bg-[#202020]
                        dark:hover:shadow-[inset_3px_0_0_#1E90FF]
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="
                              truncate text-sm font-semibold
                              text-[#344054]
                              transition-colors duration-200
                              group-hover:text-[#0066FF]
                              dark:text-white
                              dark:group-hover:text-[#4D9AFF]
                            "
                          >
                            {employee?.fullName ??
                              "Unknown Employee"}
                          </p>

                          <p
                            className="
                              mt-1 text-xs
                              text-[#98A2B3]
                              dark:text-[#888888]
                            "
                          >
                            {employee?.employeeId ??
                              request.employeeId}
                          </p>
                        </div>

                        <span
                          className={`
                            shrink-0 rounded-full
                            px-2.5 py-1
                            text-[11px] font-semibold
                            ${getLeaveStatusClass(
                              request.status,
                            )}
                          `}
                        >
                          {request.status}
                        </span>
                      </div>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span
                            className="
                              text-sm font-semibold
                              text-[#0066FF]
                              dark:text-[#4D9AFF]
                            "
                          >
                            {getLeaveTypeName(
                              request.leaveTypeId,
                            )}
                          </span>

                          <span
                            className="
                              text-xs
                              text-[#98A2B3]
                              dark:text-[#777777]
                            "
                          >
                            •
                          </span>

                          <span
                            className="
                              text-xs
                              text-[#667085]
                              dark:text-[#999999]
                            "
                          >
                            {calculateLeaveDays(
                              request,
                            )}{" "}
                            day
                            {calculateLeaveDays(
                              request,
                            ) !== 1
                              ? "s"
                              : ""}
                          </span>
                        </div>

                        <p
                          className="
                            mt-2 text-xs
                            text-[#667085]
                            dark:text-[#999999]
                          "
                        >
                          {formatDate(
                            request.startDate,
                          )}{" "}
                          –{" "}
                          {formatDate(
                            request.endDate,
                          )}
                        </p>

                        <p
                          className="
                            mt-2 line-clamp-2 text-xs
                            text-[#667085]
                            dark:text-[#999999]
                          "
                        >
                          {request.reason ||
                            "No reason provided."}
                        </p>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>

      {/* MY TEAM */}

      <section
        className="
          overflow-hidden rounded-2xl border
          border-[#E1E5EA]
          bg-white
          transition-all duration-200
          hover:border-[#B8D1FF]
          hover:shadow-md
          dark:border-[#333333]
          dark:bg-[#181818]
          dark:hover:border-[#3B82F6]
        "
      >
        <div
          className="
            flex flex-col gap-3 border-b p-5
            border-[#E1E5EA]
            dark:border-[#333333]
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                text-base font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              My Team
            </h2>

            <p
              className="
                mt-1 text-xs
                text-[#667085]
                dark:text-[#888888]
              "
            >
              Employees assigned to you
            </p>
          </div>

          <Link
            to="/manager/team"
            className="
              group inline-flex items-center gap-1.5
              text-sm font-semibold
              text-[#0066FF]
              transition-all duration-200
              hover:gap-2
              hover:text-[#0052CC]
              dark:text-[#4D9AFF]
              dark:hover:text-white
            "
          >
            View team
            <ArrowRight
              size={15}
              className="
                transition-transform duration-200
                group-hover:translate-x-0.5
              "
            />
          </Link>
        </div>

        {teamMembers.length === 0 ? (
          <div
            className="
              flex min-h-[180px]
              items-center justify-center
              px-5 text-center
            "
          >
            <div>
              <div
                className="
                  mx-auto flex h-12 w-12
                  items-center justify-center
                  rounded-full
                  bg-[#EEF4FF]
                  text-[#0066FF]
                  transition-transform duration-200
                  hover:scale-110
                  dark:bg-[#10233F]
                  dark:text-[#4D9AFF]
                "
              >
                <Users size={21} />
              </div>

              <p
                className="
                  mt-4 text-sm font-semibold
                  text-[#344054]
                  dark:text-white
                "
              >
                No team members found
              </p>

              <p
                className="
                  mt-1 max-w-md text-xs
                  text-[#98A2B3]
                  dark:text-[#888888]
                "
              >
                Employees assigned to this manager
                will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr
                    className="
                      border-b
                      border-[#E1E5EA]
                      bg-[#F8F9FA]
                      dark:border-[#333333]
                      dark:bg-[#222222]
                    "
                  >
                    <th
                      className="
                        px-5 py-3.5 text-left
                        text-xs font-semibold uppercase
                        tracking-wide
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      Employee
                    </th>

                    <th
                      className="
                        px-5 py-3.5 text-left
                        text-xs font-semibold uppercase
                        tracking-wide
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      Department
                    </th>

                    <th
                      className="
                        px-5 py-3.5 text-left
                        text-xs font-semibold uppercase
                        tracking-wide
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      Designation
                    </th>

                    <th
                      className="
                        px-5 py-3.5 text-left
                        text-xs font-semibold uppercase
                        tracking-wide
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      Joining Date
                    </th>

                    <th
                      className="
                        px-5 py-3.5 text-left
                        text-xs font-semibold uppercase
                        tracking-wide
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {teamMembers.map(
                    (employee) => (
                      <tr
                        key={employee.id}
                        className="
                          border-b last:border-0
                          border-[#E1E5EA]
                          transition-all duration-200
                          hover:bg-[#F4F8FF]
                          hover:shadow-[inset_3px_0_0_#0066FF]
                          dark:border-[#333333]
                          dark:hover:bg-[#202020]
                          dark:hover:shadow-[inset_3px_0_0_#1E90FF]
                        "
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="
                                flex h-10 w-10 shrink-0
                                items-center justify-center
                                overflow-hidden rounded-full
                                bg-[#EAF2FF]
                                text-sm font-bold
                                text-[#0066FF]
                                dark:bg-[#10233F]
                                dark:text-[#4D9AFF]
                              "
                            >
                              {employee.profileImage ? (
                                <img
                                  src={
                                    employee.profileImage
                                  }
                                  alt={
                                    employee.fullName
                                  }
                                  className="
                                    h-full w-full
                                    object-cover
                                  "
                                />
                              ) : (
                                employee.fullName
                                  .charAt(0)
                                  .toUpperCase()
                              )}
                            </div>

                            <div className="min-w-0">
                              <p
                                className="
                                  truncate text-sm
                                  font-semibold
                                  text-[#344054]
                                  dark:text-white
                                "
                              >
                                {employee.fullName}
                              </p>

                              <p
                                className="
                                  text-xs
                                  text-[#98A2B3]
                                  dark:text-[#888888]
                                "
                              >
                                {employee.employeeId}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td
                          className="
                            px-5 py-4 text-sm
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {getDepartmentName(
                            employee.departmentId,
                          )}
                        </td>

                        <td
                          className="
                            px-5 py-4 text-sm
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {employee.designation}
                        </td>

                        <td
                          className="
                            px-5 py-4 text-sm
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {formatDate(
                            employee.joiningDate,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className="
                              inline-flex rounded-full
                              bg-[#E8F8EF]
                              px-2.5 py-1
                              text-xs font-semibold
                              text-[#16834B]
                              dark:bg-[#183A2A]
                              dark:text-[#00FF85]
                            "
                          >
                            {employee.employmentStatus ||
                              "Active"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="
                grid grid-cols-1 gap-3 p-4
                lg:hidden
                sm:grid-cols-2
              "
            >
              {teamMembers.map(
                (employee) => (
                  <div
                    key={employee.id}
                    className="
                      rounded-xl border p-4
                      border-[#E1E5EA]
                      bg-white
                      transition-all duration-200
                      hover:-translate-y-1
                      hover:border-[#B8D1FF]
                      hover:shadow-md
                      dark:border-[#333333]
                      dark:bg-[#202020]
                      dark:hover:border-[#3B82F6]
                      dark:hover:bg-[#242424]
                      dark:hover:shadow-lg
                    "
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="
                          flex h-10 w-10 shrink-0
                          items-center justify-center
                          overflow-hidden rounded-full
                          bg-[#EAF2FF]
                          text-sm font-bold
                          text-[#0066FF]
                          dark:bg-[#10233F]
                          dark:text-[#4D9AFF]
                        "
                      >
                        {employee.profileImage ? (
                          <img
                            src={
                              employee.profileImage
                            }
                            alt={
                              employee.fullName
                            }
                            className="
                              h-full w-full
                              object-cover
                            "
                          />
                        ) : (
                          employee.fullName
                            .charAt(0)
                            .toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className="
                                truncate text-sm
                                font-semibold
                                text-[#344054]
                                dark:text-white
                              "
                            >
                              {employee.fullName}
                            </p>

                            <p
                              className="
                                mt-0.5 text-xs
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              {employee.employeeId}
                            </p>
                          </div>

                          <span
                            className="
                              shrink-0 rounded-full
                              bg-[#E8F8EF]
                              px-2 py-1
                              text-[10px] font-semibold
                              text-[#16834B]
                              dark:bg-[#183A2A]
                              dark:text-[#00FF85]
                            "
                          >
                            {employee.employmentStatus ||
                              "Active"}
                          </span>
                        </div>

                        <div
                          className="
                            mt-4 grid grid-cols-2
                            gap-3
                          "
                        >
                          <div>
                            <p
                              className="
                                text-[11px]
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              Department
                            </p>

                            <p
                              className="
                                mt-1 truncate text-xs
                                font-medium
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {getDepartmentName(
                                employee.departmentId,
                              )}
                            </p>
                          </div>

                          <div>
                            <p
                              className="
                                text-[11px]
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              Designation
                            </p>

                            <p
                              className="
                                mt-1 truncate text-xs
                                font-medium
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {employee.designation}
                            </p>
                          </div>

                          <div className="col-span-2">
                            <p
                              className="
                                text-[11px]
                                text-[#98A2B3]
                                dark:text-[#888888]
                              "
                            >
                              Joining Date
                            </p>

                            <p
                              className="
                                mt-1 text-xs font-medium
                                text-[#475467]
                                dark:text-[#C7C7C7]
                              "
                            >
                              {formatDate(
                                employee.joiningDate,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}