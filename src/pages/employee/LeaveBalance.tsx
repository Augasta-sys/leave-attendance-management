import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Info,
  X,
} from "lucide-react";

import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: string;
  designation: string;
  employmentStatus?: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  totalDays: number;
  status?: "Active" | "Inactive";
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface LeaveBalanceRow {
  leaveTypeId: string;
  leaveTypeName: string;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

function formatDays(value: number) {
  return Number.isInteger(value)
    ? value.toString()
    : value.toFixed(1);
}

export default function EmployeeLeaveBalance() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBalance, setSelectedBalance] =
    useState<LeaveBalanceRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          employeesResponse,
          leaveTypesResponse,
          leaveRequestsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<LeaveRequest[]>("/leaveRequests"),
        ]);

        if (cancelled) return;

        setEmployees(employeesResponse.data);
        setLeaveTypes(leaveTypesResponse.data);

        const employeeRequests =
          leaveRequestsResponse.data.filter(
            (request) =>
              request.employeeId === user.employeeId,
          );

        setLeaveRequests(employeeRequests);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load leave balance:", err);

        setError(
          "Unable to load your leave balance. Please make sure the JSON Server is running.",
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
  }, [user?.employeeId]);

  /*
   * No useMemo here.
   * This avoids the React Compiler dependency warning
   * caused by using user inside a manually memoized callback.
   */
  const employee = user?.employeeId
    ? employees.find(
        (item) =>
          item.employeeId === user.employeeId ||
          item.id === user.employeeId,
      ) ?? null
    : null;

  const getLeaveTypeId = useCallback(
    (leaveTypeId: string) => {
      return (
        leaveTypes.find(
          (leaveType) =>
            leaveType.leaveTypeId === leaveTypeId ||
            leaveType.id === leaveTypeId,
        )?.leaveTypeId ?? leaveTypeId
      );
    },
    [leaveTypes],
  );

  const getApprovedDays = useCallback(
    (leaveTypeId: string) => {
      const normalizedId = getLeaveTypeId(leaveTypeId);

      return leaveRequests
        .filter(
          (request) =>
            request.status === "Approved" &&
            getLeaveTypeId(request.leaveTypeId) === normalizedId,
        )
        .reduce(
          (total, request) =>
            total + Number(request.numberOfDays || 0),
          0,
        );
    },
    [getLeaveTypeId, leaveRequests],
  );

  const getPendingDays = useCallback(
    (leaveTypeId: string) => {
      const normalizedId = getLeaveTypeId(leaveTypeId);

      return leaveRequests
        .filter(
          (request) =>
            request.status === "Pending" &&
            getLeaveTypeId(request.leaveTypeId) === normalizedId,
        )
        .reduce(
          (total, request) =>
            total + Number(request.numberOfDays || 0),
          0,
        );
    },
    [getLeaveTypeId, leaveRequests],
  );

  const balanceRows = useMemo<LeaveBalanceRow[]>(() => {
    return leaveTypes
      .filter(
        (leaveType) => leaveType.status !== "Inactive",
      )
      .map((leaveType) => {
        const allocated = Number(
          leaveType.totalDays || 0,
        );

        const used = getApprovedDays(
          leaveType.leaveTypeId,
        );

        const pending = getPendingDays(
          leaveType.leaveTypeId,
        );

        const remaining = Math.max(
          allocated - used,
          0,
        );

        return {
          leaveTypeId: leaveType.leaveTypeId,
          leaveTypeName: leaveType.name,
          allocated,
          used,
          pending,
          remaining,
        };
      });
  }, [getApprovedDays, getPendingDays, leaveTypes]);

  const summary = useMemo(() => {
    return balanceRows.reduce(
      (totals, row) => ({
        allocated: totals.allocated + row.allocated,
        used: totals.used + row.used,
        pending: totals.pending + row.pending,
        remaining: totals.remaining + row.remaining,
      }),
      {
        allocated: 0,
        used: 0,
        pending: 0,
        remaining: 0,
      },
    );
  }, [balanceRows]);

  const totalUsagePercentage =
    summary.allocated > 0
      ? Math.min(
          Math.round(
            (summary.used / summary.allocated) * 100,
          ),
          100,
        )
      : 0;

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Page Header */}
      <div>
        <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
          Employee Portal
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-white sm:text-3xl">
          Leave Balance
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          View your allocated, used, pending and remaining leave
          days.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0">
            <p className="font-semibold">
              Unable to load leave balance
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Employee Information */}
      {employee && (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151515] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="text-sm font-bold">
                {employee.fullName
                  .split(" ")
                  .map((name) => name[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold text-[#1A1A2E] dark:text-white">
                {employee.fullName}
              </h2>

              <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">
                {employee.designation} • {employee.email}
              </p>
            </div>

            <div className="sm:ml-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />

                {employee.employmentStatus || "Active"}
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Allocated"
          value={summary.allocated}
          suffix="days"
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <SummaryCard
          label="Used"
          value={summary.used}
          suffix="days"
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <SummaryCard
          label="Pending"
          value={summary.pending}
          suffix="days"
          icon={<Clock3 className="h-5 w-5" />}
        />

        <SummaryCard
          label="Remaining"
          value={summary.remaining}
          suffix="days"
          icon={<FileText className="h-5 w-5" />}
        />
      </div>

      {/* Overall Usage */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#151515]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">
              Overall Leave Usage
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatDays(summary.used)} of{" "}
              {formatDays(summary.allocated)} allocated days used
            </p>
          </div>

          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalUsagePercentage}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-[#0066FF] transition-all duration-500"
            style={{
              width: `${totalUsagePercentage}%`,
            }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Remaining:{" "}
            <strong className="text-gray-700 dark:text-gray-200">
              {formatDays(summary.remaining)} days
            </strong>
          </span>

          <span>
            Pending:{" "}
            <strong className="text-gray-700 dark:text-gray-200">
              {formatDays(summary.pending)} days
            </strong>
          </span>
        </div>
      </section>

      {/* Leave Type Balance */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
        <div className="border-b border-gray-200 px-4 py-4 dark:border-white/10 sm:px-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-400" />

            <div>
              <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white sm:text-lg">
                Leave Type Balance
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
                Your current balance by leave type.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4 sm:p-5">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
              />
            ))}
          </div>
        ) : balanceRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Info className="h-6 w-6" />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#1A1A2E] dark:text-white">
              No leave types available
            </h3>

            <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              No active leave types have been configured yet.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden w-full md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#101010]">
                    <th className="w-[23%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Leave Type
                    </th>

                    <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Allocated
                    </th>

                    <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Used
                    </th>

                    <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Pending
                    </th>

                    <th className="w-[15%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Remaining
                    </th>

                    <th className="w-[20%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {balanceRows.map((row) => {
                    const percentage =
                      row.allocated > 0
                        ? Math.min(
                            Math.round(
                              (row.used / row.allocated) * 100,
                            ),
                            100,
                          )
                        : 0;

                    return (
                      <tr
                        key={row.leaveTypeId}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                      >
                        <td className="px-4 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                              {row.leaveTypeName}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                <div
                                  className="h-full rounded-full bg-[#0066FF]"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>

                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {percentage}% used
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {formatDays(row.allocated)}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {formatDays(row.used)}
                        </td>

                        <td className="px-4 py-4 text-sm font-semibold text-amber-600 dark:text-amber-400">
                          {formatDays(row.pending)}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatDays(row.remaining)}
                        </td>

                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBalance(row)
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Info className="h-3.5 w-3.5" />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-3 p-3 md:hidden">
              {balanceRows.map((row) => {
                const percentage =
                  row.allocated > 0
                    ? Math.min(
                        Math.round(
                          (row.used / row.allocated) * 100,
                        ),
                        100,
                      )
                    : 0;

                return (
                  <div
                    key={row.leaveTypeId}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 dark:border-white/10 dark:bg-[#101010] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                          {row.leaveTypeName}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {percentage}% used
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {formatDays(row.remaining)} left
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#0066FF]"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <BalanceMiniStat
                        label="Allocated"
                        value={formatDays(row.allocated)}
                      />

                      <BalanceMiniStat
                        label="Used"
                        value={formatDays(row.used)}
                      />

                      <BalanceMiniStat
                        label="Pending"
                        value={formatDays(row.pending)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBalance(row)
                      }
                      className="mt-4 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Info className="h-3.5 w-3.5" />
                      View Details
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Details Modal */}
      {selectedBalance && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setSelectedBalance(null)}
        >
          <div
            className="hide-scrollbar max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Leave Balance
                </p>

                <h3 className="mt-1 truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                  {selectedBalance.leaveTypeName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedBalance(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-gray-50 p-4 dark:bg-[#0D0D0D]">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Remaining Balance
                    </p>

                    <p className="mt-1 text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatDays(
                        selectedBalance.remaining,
                      )}
                    </p>
                  </div>

                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    days
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <BalanceDetail
                  label="Allocated"
                  value={selectedBalance.allocated}
                />

                <BalanceDetail
                  label="Used"
                  value={selectedBalance.used}
                />

                <BalanceDetail
                  label="Pending"
                  value={selectedBalance.pending}
                />

                <BalanceDetail
                  label="Remaining"
                  value={selectedBalance.remaining}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Usage
                  </span>

                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {selectedBalance.allocated > 0
                      ? Math.min(
                          Math.round(
                            (selectedBalance.used /
                              selectedBalance.allocated) *
                              100,
                          ),
                          100,
                        )
                      : 0}
                    %
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#0066FF]"
                    style={{
                      width: `${
                        selectedBalance.allocated > 0
                          ? Math.min(
                              Math.round(
                                (selectedBalance.used /
                                  selectedBalance.allocated) *
                                  100,
                              ),
                              100,
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                Approved leave days are counted as used. Pending
                requests are shown separately and do not reduce the
                remaining balance until they are approved.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  suffix: string;
  icon: React.ReactNode;
}

function SummaryCard({
  label,
  value,
  suffix,
  icon,
}: SummaryCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151515]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <div className="mt-1 flex items-baseline gap-1.5">
            <p className="text-xl font-bold text-[#1A1A2E] dark:text-white sm:text-2xl">
              {formatDays(value)}
            </p>

            <span className="text-xs text-gray-400 dark:text-gray-500">
              {suffix}
            </span>
          </div>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function BalanceMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-white p-2.5 dark:bg-[#151515]">
      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-[#1A1A2E] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function BalanceDetail({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-[#0D0D0D]">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-[#1A1A2E] dark:text-white">
        {formatDays(value)}
      </p>

      <p className="text-[11px] text-gray-400 dark:text-gray-500">
        days
      </p>
    </div>
  );
}