import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  UserMinus,
  Users,
  UserX,
} from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";

import { api } from "../services/api";
import type { Attendance } from "../types/attendance";
import type { Employee } from "../types/employee";
import type { LeaveRequest } from "../types/leave";

interface Department {
  id: string;
  name: string;
  status?: string;
}

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: ElementType;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: StatCardProps) {
  return (
    <div
      className="
        rounded-2xl border p-5 shadow-sm
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-md

        border-[#DCE7F2] bg-white
        hover:border-[#0066FF]

        dark:border-[#333333]
        dark:bg-[#181818]
        dark:hover:border-[#555555]
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

          <h3
            className="
              mt-2 text-3xl font-bold tracking-tight
              text-[#1A1A2E]
              dark:text-white
            "
          >
            {value}
          </h3>

          <p
            className="
              mt-2 text-xs
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            {description}
          </p>
        </div>

        <div
          className="
            flex h-11 w-11 shrink-0 items-center
            justify-center rounded-xl

            bg-[#E5F0FF] text-[#0066FF]

            dark:bg-[#292929]
            dark:text-[#1E90FF]
          "
        >
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<
    LeaveRequest[]
  >([]);
  const [departments, setDepartments] = useState<Department[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = new Date()
    .toISOString()
    .split("T")[0];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          attendanceResponse,
          leaveResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Attendance[]>("/attendance"),
          api.get<LeaveRequest[]>("/leaveRequests"),
          api.get<Department[]>("/departments"),
        ]);

        setEmployees(employeesResponse.data);
        setAttendance(attendanceResponse.data);
        setLeaveRequests(leaveResponse.data);
        setDepartments(departmentsResponse.data);
      } catch (err) {
        console.error(
          "Failed to load admin dashboard:",
          err,
        );

        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const todayAttendance = useMemo(
    () =>
      attendance.filter(
        (record) => record.date === today,
      ),
    [attendance, today],
  );

  const presentToday = todayAttendance.filter(
    (record) =>
      record.status === "Present" ||
      record.status === "Late",
  ).length;

  const absentToday = todayAttendance.filter(
    (record) => record.status === "Absent",
  ).length;

  const onLeaveToday = todayAttendance.filter(
    (record) => record.status === "On Leave",
  ).length;

  const pendingLeaves = leaveRequests.filter(
    (request) => request.status === "Pending",
  );

  const attendancePercentage =
    employees.length > 0
      ? Math.round(
          (presentToday / employees.length) * 100,
        )
      : 0;

  const recentLeaves = [...leaveRequests]
    .sort(
      (a, b) =>
        new Date(b.appliedDate).getTime() -
        new Date(a.appliedDate).getTime(),
    )
    .slice(0, 5);

  const recentAttendance = [...attendance]
    .sort(
      (a, b) =>
        new Date(`${b.date}T00:00:00`).getTime() -
        new Date(`${a.date}T00:00:00`).getTime(),
    )
    .slice(0, 5);

  const getLeaveStatusClass = (
    status: LeaveRequest["status"],
  ) => {
    switch (status) {
      case "Approved":
        return `
          bg-[#E8F8EF] text-[#16834B]
          dark:bg-[#222222] dark:text-[#00FF85]
        `;

      case "Rejected":
        return `
          bg-[#FDECEC] text-[#C53030]
          dark:bg-[#292929] dark:text-[#FF8A8A]
        `;

      case "Cancelled":
        return `
          bg-[#F1F5F9] text-[#64748B]
          dark:bg-[#292929] dark:text-[#B3B3B3]
        `;

      default:
        return `
          bg-[#FFF5D9] text-[#A16207]
          dark:bg-[#292929] dark:text-[#D6D6D6]
        `;
    }
  };

  const getAttendanceStatusClass = (
    status: Attendance["status"],
  ) => {
    switch (status) {
      case "Present":
        return `
          bg-[#E8F8EF] text-[#16834B]
          dark:bg-[#222222] dark:text-[#00FF85]
        `;

      case "Late":
        return `
          bg-[#FFF5D9] text-[#A16207]
          dark:bg-[#292929] dark:text-[#D6D6D6]
        `;

      case "Absent":
        return `
          bg-[#FDECEC] text-[#C53030]
          dark:bg-[#292929] dark:text-[#FF8A8A]
        `;

      case "On Leave":
        return `
          bg-[#E5F0FF] text-[#0066FF]
          dark:bg-[#292929] dark:text-[#1E90FF]
        `;

      default:
        return `
          bg-[#F1F5F9] text-[#64748B]
          dark:bg-[#292929] dark:text-[#B3B3B3]
        `;
    }
  };

  return (
    <div
      className="
        min-h-full w-full space-y-6
        bg-[#F8F9FA]
        dark:bg-[#0D0D0D]
      "
    >
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p
            className="
              text-sm font-semibold
              text-[#0066FF]
              dark:text-[#1E90FF]
            "
          >
            Overview
          </p>

          <h1
            className="
              mt-1 text-2xl font-bold tracking-tight
              text-[#1A1A2E]
              dark:text-white
              sm:text-3xl
            "
          >
            Admin Dashboard
          </h1>

          <p
            className="
              mt-1 text-sm
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Monitor employees, attendance and leave
            activity.
          </p>
        </div>

        {/* Date */}
        <div
          className="
            inline-flex w-fit items-center gap-2
            rounded-xl border px-3 py-2 text-sm
            shadow-sm

            border-[#DCE7F2]
            bg-white
            text-[#475467]

            dark:border-[#333333]
            dark:bg-[#181818]
            dark:text-[#D1D1D1]
          "
        >
          <CalendarDays size={17} />

          <span>
            {new Date().toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          className="
            rounded-xl border px-4 py-3 text-sm

            border-red-200
            bg-red-50
            text-red-700

            dark:border-[#444444]
            dark:bg-[#1F1F1F]
            dark:text-[#FFB4B4]
          "
        >
          {error}
        </div>
      )}

      {/* Statistics */}
      <div
        className="
          grid grid-cols-1 gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >
        <StatCard
          title="Total Employees"
          value={loading ? "—" : employees.length}
          description="Active employee records"
          icon={Users}
        />

        <StatCard
          title="Present Today"
          value={loading ? "—" : presentToday}
          description="Present and late employees"
          icon={CheckCircle2}
        />

        <StatCard
          title="Absent Today"
          value={loading ? "—" : absentToday}
          description="Employees marked absent"
          icon={UserX}
        />

        <StatCard
          title="On Leave Today"
          value={loading ? "—" : onLeaveToday}
          description="Employees currently on leave"
          icon={UserMinus}
        />

        <StatCard
          title="Pending Leave Requests"
          value={loading ? "—" : pendingLeaves.length}
          description="Requests awaiting review"
          icon={ClipboardList}
        />

        <StatCard
          title="Total Departments"
          value={loading ? "—" : departments.length}
          description="Configured departments"
          icon={Activity}
        />

        <StatCard
          title="Attendance Percentage"
          value={
            loading
              ? "—"
              : `${attendancePercentage}%`
          }
          description="Today's attendance rate"
          icon={CalendarCheck}
        />
      </div>

      {/* Leave + Attendance */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Recent Leave Requests */}
        <section
          className="
            overflow-hidden rounded-2xl border shadow-sm

            border-[#DCE7F2]
            bg-white

            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div
            className="
              flex items-center justify-between
              border-b px-5 py-4

              border-[#E6EEF5]
              dark:border-[#333333]
            "
          >
            <div>
              <h2
                className="
                  text-base font-bold
                  text-[#1A1A2E]
                  dark:text-white
                "
              >
                Recent Leave Requests
              </h2>

              <p
                className="
                  mt-1 text-xs
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                Latest employee leave activity
              </p>
            </div>

            <Link
              to="/admin/leave-requests"
              className="
                flex items-center gap-1 text-xs
                font-semibold
                text-[#0066FF]
                hover:text-[#0052CC]

                dark:text-[#1E90FF]
                dark:hover:text-white
              "
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className="
              divide-y
              divide-[#EEF3F7]
              dark:divide-[#333333]
            "
          >
            {loading ? (
              <div
                className="
                  px-5 py-8 text-center text-sm
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                Loading...
              </div>
            ) : recentLeaves.length === 0 ? (
              <div
                className="
                  px-5 py-8 text-center text-sm
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                No leave requests found.
              </div>
            ) : (
              recentLeaves.map((request) => (
                <div
                  key={request.id}
                  className="
                    flex items-center justify-between
                    gap-4 px-5 py-4
                  "
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="
                        flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-full text-sm font-bold

                        bg-[#E5F0FF]
                        text-[#0066FF]

                        dark:bg-[#292929]
                        dark:text-[#1E90FF]
                      "
                    >
                      {request.employeeName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate text-sm font-semibold
                          text-[#1A1A2E]
                          dark:text-white
                        "
                      >
                        {request.employeeName}
                      </p>

                      <p
                        className="
                          mt-0.5 truncate text-xs
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        {request.leaveType}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`
                        inline-flex rounded-full
                        px-2.5 py-1 text-[11px]
                        font-semibold
                        ${getLeaveStatusClass(
                          request.status,
                        )}
                      `}
                    >
                      {request.status}
                    </span>

                    <p
                      className="
                        mt-1 text-[11px]
                        text-[#94A3B8]
                        dark:text-[#888888]
                      "
                    >
                      {request.numberOfDays}{" "}
                      {request.numberOfDays === 1
                        ? "day"
                        : "days"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Attendance Overview */}
        <section
          className="
            overflow-hidden rounded-2xl border shadow-sm

            border-[#DCE7F2]
            bg-white

            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div
            className="
              flex items-center justify-between
              border-b px-5 py-4

              border-[#E6EEF5]
              dark:border-[#333333]
            "
          >
            <div>
              <h2
                className="
                  text-base font-bold
                  text-[#1A1A2E]
                  dark:text-white
                "
              >
                Attendance Overview
              </h2>

              <p
                className="
                  mt-1 text-xs
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                Latest attendance records
              </p>
            </div>

            <Link
              to="/admin/attendance"
              className="
                flex items-center gap-1 text-xs
                font-semibold
                text-[#0066FF]
                hover:text-[#0052CC]

                dark:text-[#1E90FF]
                dark:hover:text-white
              "
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div
            className="
              divide-y
              divide-[#EEF3F7]
              dark:divide-[#333333]
            "
          >
            {loading ? (
              <div
                className="
                  px-5 py-8 text-center text-sm
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                Loading...
              </div>
            ) : recentAttendance.length === 0 ? (
              <div
                className="
                  px-5 py-8 text-center text-sm
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                No attendance records found.
              </div>
            ) : (
              recentAttendance.map((record) => (
                <div
                  key={record.id}
                  className="
                    flex items-center justify-between
                    gap-4 px-5 py-4
                  "
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="
                        flex h-10 w-10 shrink-0
                        items-center justify-center
                        rounded-full

                        bg-[#E5F0FF]
                        text-[#0066FF]

                        dark:bg-[#292929]
                        dark:text-[#1E90FF]
                      "
                    >
                      <Clock3 size={17} />
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          truncate text-sm font-semibold
                          text-[#1A1A2E]
                          dark:text-white
                        "
                      >
                        {record.employeeName}
                      </p>

                      <p
                        className="
                          mt-0.5 text-xs
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        {record.date}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`
                        inline-flex rounded-full
                        px-2.5 py-1 text-[11px]
                        font-semibold
                        ${getAttendanceStatusClass(
                          record.status,
                        )}
                      `}
                    >
                      {record.status}
                    </span>

                    <p
                      className="
                        mt-1 text-[11px]
                        text-[#94A3B8]
                        dark:text-[#888888]
                      "
                    >
                      {record.workingHours || "--"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Quick Actions */}
      <section
        className="
          rounded-2xl border p-5 shadow-sm

          border-[#DCE7F2]
          bg-white

          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div className="mb-4">
          <h2
            className="
              text-base font-bold
              text-[#1A1A2E]
              dark:text-white
            "
          >
            Quick Actions
          </h2>

          <p
            className="
              mt-1 text-xs
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Frequently used administration options
          </p>
        </div>

        <div
          className="
            grid grid-cols-1 gap-3
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <Link
            to="/admin/employees"
            className="
              flex items-center gap-3 rounded-xl
              border p-4 transition

              border-[#DCE7F2]
              bg-[#F8FBFF]

              hover:border-[#0066FF]
              hover:bg-[#EAF2FF]

              dark:border-[#333333]
              dark:bg-[#222222]
              dark:hover:border-[#555555]
              dark:hover:bg-[#2A2A2A]
            "
          >
            <Users
              size={19}
              className="
                text-[#0066FF]
                dark:text-[#1E90FF]
              "
            />

            <span
              className="
                text-sm font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              Manage Employees
            </span>
          </Link>

          <Link
            to="/admin/attendance"
            className="
              flex items-center gap-3 rounded-xl
              border p-4 transition

              border-[#DCE7F2]
              bg-[#F8FBFF]

              hover:border-[#0066FF]
              hover:bg-[#EAF2FF]

              dark:border-[#333333]
              dark:bg-[#222222]
              dark:hover:border-[#555555]
              dark:hover:bg-[#2A2A2A]
            "
          >
            <CalendarCheck
              size={19}
              className="
                text-[#0066FF]
                dark:text-[#1E90FF]
              "
            />

            <span
              className="
                text-sm font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              Attendance
            </span>
          </Link>

          <Link
            to="/admin/leave-requests"
            className="
              flex items-center gap-3 rounded-xl
              border p-4 transition

              border-[#DCE7F2]
              bg-[#F8FBFF]

              hover:border-[#0066FF]
              hover:bg-[#EAF2FF]

              dark:border-[#333333]
              dark:bg-[#222222]
              dark:hover:border-[#555555]
              dark:hover:bg-[#2A2A2A]
            "
          >
            <ClipboardList
              size={19}
              className="
                text-[#0066FF]
                dark:text-[#1E90FF]
              "
            />

            <span
              className="
                text-sm font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              Leave Requests
            </span>
          </Link>

          <Link
            to="/admin/reports"
            className="
              flex items-center gap-3 rounded-xl
              border p-4 transition

              border-[#DCE7F2]
              bg-[#F8FBFF]

              hover:border-[#0066FF]
              hover:bg-[#EAF2FF]

              dark:border-[#333333]
              dark:bg-[#222222]
              dark:hover:border-[#555555]
              dark:hover:bg-[#2A2A2A]
            "
          >
            <CalendarDays
              size={19}
              className="
                text-[#0066FF]
                dark:text-[#1E90FF]
              "
            />

            <span
              className="
                text-sm font-semibold
                text-[#1A1A2E]
                dark:text-white
              "
            >
              View Reports
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}