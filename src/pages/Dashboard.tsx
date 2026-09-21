import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  Users,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {user?.name}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value="156"
          icon={<Users size={22} />}
        />

        <StatCard
          title="Present Today"
          value="142"
          icon={<CalendarCheck size={22} />}
        />

        <StatCard
          title="On Leave"
          value="8"
          icon={<CalendarDays size={22} />}
        />

        <StatCard
          title="Pending Requests"
          value="6"
          icon={<Clock3 size={22} />}
        />
      </div>

      {/* Welcome card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Leave & Employee Attendance Management System
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Manage employees, attendance, leave requests, approvals and
          reports from one centralized system.
        </p>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}