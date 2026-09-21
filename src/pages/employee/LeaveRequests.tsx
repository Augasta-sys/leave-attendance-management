import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: string;
  designation: string;
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
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface LeaveRequestWithDetails extends LeaveRequest {
  leaveTypeName: string;
  employeeName: string;
}

const statusStyles: Record<LeaveStatus, string> = {
  Pending:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  Approved:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  Rejected:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30",
  Cancelled:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/30",
};

function formatDate(date: string) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusIcon(status: LeaveStatus) {
  if (status === "Pending") {
    return <Clock3 className="h-3.5 w-3.5" />;
  }

  if (status === "Approved") {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }

  if (status === "Rejected") {
    return <XCircle className="h-3.5 w-3.5" />;
  }

  return <X className="h-3.5 w-3.5" />;
}

export default function EmployeeLeaveRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeaveStatus>(
    "All",
  );
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequestWithDetails | null>(null);

  const [cancelRequest, setCancelRequest] =
    useState<LeaveRequestWithDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
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
          requestsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<LeaveRequest[]>("/leaveRequests"),
        ]);

        if (cancelled) return;

        setEmployees(employeesResponse.data);
        setLeaveTypes(leaveTypesResponse.data);

        const employeeRequests = requestsResponse.data.filter(
          (request) => request.employeeId === user.employeeId,
        );

        setLeaveRequests(employeeRequests);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load leave requests:", err);

        setError(
          "Unable to load your leave requests. Please make sure the JSON Server is running.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [user?.employeeId]);

  const getLeaveTypeName = useCallback(
    (leaveTypeId: string) => {
      const leaveType = leaveTypes.find(
        (item) =>
          item.leaveTypeId === leaveTypeId ||
          item.id === leaveTypeId,
      );

      return leaveType?.name || "Unknown Leave";
    },
    [leaveTypes],
  );

  const getEmployeeName = useCallback(
    (employeeId: string) => {
      const employee = employees.find(
        (item) =>
          item.employeeId === employeeId ||
          item.id === employeeId,
      );

      return employee?.fullName || "Employee";
    },
    [employees],
  );

  const requestRows = useMemo<LeaveRequestWithDetails[]>(() => {
    return leaveRequests.map((request) => ({
      ...request,
      leaveTypeName: getLeaveTypeName(request.leaveTypeId),
      employeeName: getEmployeeName(request.employeeId),
    }));
  }, [leaveRequests, getLeaveTypeName, getEmployeeName]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requestRows
      .filter((request) => {
        if (statusFilter === "All") return true;
        return request.status === statusFilter;
      })
      .filter((request) => {
        if (leaveTypeFilter === "All") return true;

        return (
          request.leaveTypeId === leaveTypeFilter ||
          getLeaveTypeName(request.leaveTypeId) === leaveTypeFilter
        );
      })
      .filter((request) => {
        if (!query) return true;

        return (
          request.leaveTypeName.toLowerCase().includes(query) ||
          request.reason.toLowerCase().includes(query) ||
          request.status.toLowerCase().includes(query) ||
          request.fromDate.toLowerCase().includes(query) ||
          request.toDate.toLowerCase().includes(query)
        );
      })
      .sort(
        (first, second) =>
          new Date(second.appliedDate).getTime() -
          new Date(first.appliedDate).getTime(),
      );
  }, [
    requestRows,
    search,
    statusFilter,
    leaveTypeFilter,
    getLeaveTypeName,
  ]);

  const counts = useMemo(() => {
    return {
      total: requestRows.length,
      pending: requestRows.filter(
        (request) => request.status === "Pending",
      ).length,
      approved: requestRows.filter(
        (request) => request.status === "Approved",
      ).length,
      rejected: requestRows.filter(
        (request) => request.status === "Rejected",
      ).length,
      cancelled: requestRows.filter(
        (request) => request.status === "Cancelled",
      ).length,
    };
  }, [requestRows]);

  const handleCancelLeave = async () => {
    if (!cancelRequest) return;

    setCancelling(true);
    setError("");
    setSuccessMessage("");

    try {
      await api.patch(`/leaveRequests/${cancelRequest.id}`, {
        status: "Cancelled",
      });

      setLeaveRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === cancelRequest.id
            ? {
                ...request,
                status: "Cancelled",
              }
            : request,
        ),
      );

      setCancelRequest(null);

      setSuccessMessage(
        "Leave request cancelled successfully.",
      );

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Failed to cancel leave request:", err);

      setError(
        "Unable to cancel the leave request. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setLeaveTypeFilter("All");
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Employee Portal
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-white sm:text-3xl">
            My Leave Requests
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and manage your submitted leave requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/employee/apply-leave")}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98]"
        >
          <CalendarDays className="h-4 w-4" />
          Apply Leave
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="font-medium">{successMessage}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard
          label="Total"
          value={counts.total}
          icon={<FileText className="h-5 w-5" />}
        />

        <SummaryCard
          label="Pending"
          value={counts.pending}
          icon={<Clock3 className="h-5 w-5" />}
        />

        <SummaryCard
          label="Approved"
          value={counts.approved}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />

        <SummaryCard
          label="Rejected"
          value={counts.rejected}
          icon={<XCircle className="h-5 w-5" />}
        />

        <SummaryCard
          label="Cancelled"
          value={counts.cancelled}
          icon={<X className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#151515] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search leave requests..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-white/10 dark:bg-[#0D0D0D] dark:text-white dark:placeholder:text-gray-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "All" | LeaveStatus,
              )
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-[#0D0D0D] dark:text-white sm:w-auto sm:min-w-[150px]"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={leaveTypeFilter}
            onChange={(event) =>
              setLeaveTypeFilter(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-blue-500 dark:border-white/10 dark:bg-[#0D0D0D] dark:text-white sm:w-auto sm:min-w-[160px]"
          >
            <option value="All">All Leave Types</option>

            {leaveTypes
              .filter(
                (leaveType) =>
                  leaveType.status !== "Inactive",
              )
              .map((leaveType) => (
                <option
                  key={leaveType.leaveTypeId || leaveType.id}
                  value={leaveType.leaveTypeId || leaveType.id}
                >
                  {leaveType.name}
                </option>
              ))}
          </select>

          {(search ||
            statusFilter !== "All" ||
            leaveTypeFilter !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 shrink-0 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Requests */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-white/10 sm:px-5">
          <div>
            <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white sm:text-lg">
              Leave Requests
            </h2>

            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {filteredRequests.length} request
              {filteredRequests.length !== 1 ? "s" : ""} found
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredRequests.length === 0 ? (
          <EmptyState
            hasFilters={
              Boolean(search) ||
              statusFilter !== "All" ||
              leaveTypeFilter !== "All"
            }
            onClear={clearFilters}
            onApply={() => navigate("/employee/apply-leave")}
          />
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden w-full md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#101010]">
                    <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Leave Type
                    </th>

                    <th className="w-[18%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Dates
                    </th>

                    <th className="w-[10%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Days
                    </th>

                    <th className="w-[16%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Applied
                    </th>

                    <th className="w-[14%] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Status
                    </th>

                    <th className="w-[24%] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                            {request.leaveTypeName}
                          </p>

                          <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                            {request.reason}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                          {formatDate(request.fromDate)}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          to {formatDate(request.toDate)}
                        </p>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {request.numberOfDays}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {formatDate(request.appliedDate)}
                        </span>
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <StatusBadge status={request.status} />
                      </td>

                      <td className="px-4 py-4 align-middle">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRequest(request)
                            }
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>

                          {request.status === "Pending" && (
                            <button
                              type="button"
                              onClick={() =>
                                setCancelRequest(request)
                              }
                              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}
            <div className="space-y-3 p-3 md:hidden">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 dark:border-white/10 dark:bg-[#101010] dark:hover:border-blue-500/30 dark:hover:bg-blue-500/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                        {request.leaveTypeName}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Applied {formatDate(request.appliedDate)}
                      </p>
                    </div>

                    <StatusBadge status={request.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        From
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {formatDate(request.fromDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        To
                      </p>

                      <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
                        {formatDate(request.toDate)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Days
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        {request.numberOfDays}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        Reason
                      </p>

                      <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-200">
                        {request.reason}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-[#151515] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </button>

                    {request.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() => setCancelRequest(request)}
                        className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:bg-[#151515] dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* View details modal */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() => setSelectedRequest(null)}
        >
          <div
            className="hide-scrollbar max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Leave Request
                </p>

                <h3 className="mt-1 truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                  {selectedRequest.leaveTypeName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center justify-between gap-3">
                <StatusBadge status={selectedRequest.status} />

                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedRequest.id}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailItem
                  label="From Date"
                  value={formatDate(selectedRequest.fromDate)}
                />

                <DetailItem
                  label="To Date"
                  value={formatDate(selectedRequest.toDate)}
                />

                <DetailItem
                  label="Number of Days"
                  value={`${selectedRequest.numberOfDays} day${
                    selectedRequest.numberOfDays !== 1 ? "s" : ""
                  }`}
                />

                <DetailItem
                  label="Applied On"
                  value={formatDateTime(selectedRequest.appliedDate)}
                />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Reason
                </p>

                <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-[#0D0D0D] dark:text-gray-300">
                  {selectedRequest.reason || "No reason provided."}
                </div>
              </div>

              {selectedRequest.reviewComment && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Review Comment
                  </p>

                  <div className="rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:bg-[#0D0D0D] dark:text-gray-300">
                    {selectedRequest.reviewComment}
                  </div>
                </div>
              )}

              {selectedRequest.reviewedBy && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailItem
                    label="Reviewed By"
                    value={selectedRequest.reviewedBy}
                  />

                  <DetailItem
                    label="Review Date"
                    value={
                      selectedRequest.reviewDate
                        ? formatDateTime(selectedRequest.reviewDate)
                        : "-"
                    }
                  />
                </div>
              )}

              {selectedRequest.status === "Pending" && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setCancelRequest(selectedRequest);
                  }}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <X className="h-4 w-4" />
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelRequest && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={() => {
            if (!cancelling) {
              setCancelRequest(null);
            }
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#151515]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  <AlertCircle className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <h3 className="text-base font-bold text-[#1A1A2E] dark:text-white">
                    Cancel Leave Request
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelRequest(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm leading-6 text-gray-600 dark:text-gray-300">
                Are you sure you want to cancel your{" "}
                <span className="font-semibold text-[#1A1A2E] dark:text-white">
                  {cancelRequest.leaveTypeName}
                </span>{" "}
                request from{" "}
                <span className="font-semibold text-[#1A1A2E] dark:text-white">
                  {formatDate(cancelRequest.fromDate)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#1A1A2E] dark:text-white">
                  {formatDate(cancelRequest.toDate)}
                </span>
                ?
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => setCancelRequest(null)}
                  className="min-h-10 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                >
                  Keep Request
                </button>

                <button
                  type="button"
                  disabled={cancelling}
                  onClick={() => void handleCancelLeave()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancelling ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Yes, Cancel
                    </>
                  )}
                </button>
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
  icon: React.ReactNode;
}

function SummaryCard({
  label,
  value,
  icon,
}: SummaryCardProps) {
  return (
    <div className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-[#151515]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-gray-500 dark:text-gray-400">
            {label}
          </p>

          <p className="mt-1 text-xl font-bold text-[#1A1A2E] dark:text-white sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:scale-105 dark:bg-blue-500/10 dark:text-blue-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
    >
      {getStatusIcon(status)}
      {status}
    </span>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-[#1A1A2E] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClear,
  onApply,
}: {
  hasFilters: boolean;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        <FileText className="h-6 w-6" />
      </div>

      <h3 className="mt-4 text-base font-bold text-[#1A1A2E] dark:text-white">
        {hasFilters
          ? "No matching requests"
          : "No leave requests yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400">
        {hasFilters
          ? "Try changing your search or filters to find another request."
          : "You haven't submitted any leave requests yet."}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-10 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
          >
            Clear Filters
          </button>
        )}

        <button
          type="button"
          onClick={onApply}
          className="min-h-10 rounded-lg bg-[#0066FF] px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Apply for Leave
        </button>
      </div>
    </div>
  );
}