import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  Check,
  Eye,
  FileText,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { api } from "../../services/api";

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
  days: number;
  reason: string;
  appliedDate: string;
  status: LeaveStatus;
  rejectionReason?: string;
}

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
  daysAllowed: number;
  status: "Active" | "Inactive";
}

type ModalMode = "view" | "reject" | null;

const STATUS_OPTIONS: Array<"All" | LeaveStatus> = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
];

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] = useState<
    LeaveRequest[]
  >([]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | LeaveStatus
  >("All");
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState("All");
  const [dateFilter, setDateFilter] = useState("");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!cancelled) {
        setLoading(true);
        setErrorMessage("");
      }

      try {
        const [
          leaveRequestsResponse,
          employeesResponse,
          leaveTypesResponse,
        ] = await Promise.all([
          api.get<LeaveRequest[]>("/leaveRequests"),
          api.get<Employee[]>("/employees"),
          api.get<LeaveType[]>("/leaveTypes"),
        ]);

        if (cancelled) {
          return;
        }

        setLeaveRequests(
          Array.isArray(leaveRequestsResponse.data)
            ? leaveRequestsResponse.data
            : [],
        );
        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );
        setLeaveTypes(
          Array.isArray(leaveTypesResponse.data)
            ? leaveTypesResponse.data
            : [],
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load leave request data:",
          error,
        );

        setErrorMessage(
          "Unable to load leave requests. Please make sure JSON Server is running.",
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

  const getEmployee = useCallback(
    (employeeId: string) => {
      return employees.find(
        (employee) =>
          employee.employeeId === employeeId ||
          employee.id === employeeId,
      );
    },
    [employees],
  );

  const getEmployeeName = (employeeId: string) => {
    return getEmployee(employeeId)?.fullName || employeeId;
  };

  const getLeaveType = useCallback(
    (leaveTypeId: string) => {
      return leaveTypes.find(
        (leaveType) =>
          leaveType.leaveTypeId === leaveTypeId ||
          leaveType.id === leaveTypeId,
      );
    },
    [leaveTypes],
  );

  const getLeaveTypeName = (leaveTypeId: string) => {
    return (
      getLeaveType(leaveTypeId)?.name || leaveTypeId
    );
  };

  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...leaveRequests]
      .filter((request) => {
        const employee = getEmployee(request.employeeId);
        const leaveType = getLeaveType(request.leaveTypeId);

        const matchesSearch =
          !search ||
          request.employeeId
            .toLowerCase()
            .includes(search) ||
          employee?.employeeId
            .toLowerCase()
            .includes(search) ||
          employee?.fullName
            .toLowerCase()
            .includes(search) ||
          leaveType?.name
            .toLowerCase()
            .includes(search) ||
          request.reason
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          statusFilter === "All" ||
          request.status === statusFilter;

        const matchesLeaveType =
          leaveTypeFilter === "All" ||
          request.leaveTypeId === leaveTypeFilter ||
          leaveType?.leaveTypeId === leaveTypeFilter ||
          leaveType?.id === leaveTypeFilter;

        const matchesDate =
          !dateFilter ||
          (request.startDate <= dateFilter &&
            request.endDate >= dateFilter);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesLeaveType &&
          matchesDate
        );
      })
      .sort((a, b) =>
        b.appliedDate.localeCompare(a.appliedDate),
      );
  }, [
    leaveRequests,
    searchTerm,
    statusFilter,
    leaveTypeFilter,
    dateFilter,
    getEmployee,
    getLeaveType,
  ]);

  const pendingCount = leaveRequests.filter(
    (request) => request.status === "Pending",
  ).length;

  const approvedCount = leaveRequests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejectedCount = leaveRequests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const cancelledCount = leaveRequests.filter(
    (request) => request.status === "Cancelled",
  ).length;

  const openViewModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setModalMode("view");
  };

  const openRejectModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setRejectionError("");
    setModalMode("reject");
  };

  const closeModal = () => {
    if (processingId) return;

    setModalMode(null);
    setSelectedRequest(null);
    setRejectionReason("");
    setRejectionError("");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setLeaveTypeFilter("All");
    setDateFilter("");
  };

  const calculateDays = (
    startDate: string,
    endDate: string,
  ) => {
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return 0;
    }

    const difference =
      end.getTime() - start.getTime();

    return Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ) + 1;
  };

  const updateLeaveBalance = async (
    request: LeaveRequest,
  ) => {
    const employee = getEmployee(request.employeeId);

    if (!employee) {
      return;
    }

    /*
     * Employee objects in the current project may not yet
     * contain a leaveBalance field. The balance update is
     * therefore attempted only when the field exists.
     */

    const employeeWithBalance = employee as Employee & {
      leaveBalance?: Record<string, number> | number;
    };

    if (employeeWithBalance.leaveBalance === undefined) {
      return;
    }

    const currentBalance =
      employeeWithBalance.leaveBalance;

    if (
      typeof currentBalance === "object" &&
      currentBalance !== null
    ) {
      const leaveType = getLeaveType(request.leaveTypeId);

      if (!leaveType) return;

      const key =
        leaveType.leaveTypeId || leaveType.id;

      const existingBalance =
        Number(currentBalance[key] || 0);

      const newBalance = {
        ...currentBalance,
        [key]: Math.max(
          0,
          existingBalance - request.days,
        ),
      };

      await api.patch(`/employees/${employee.id}`, {
        leaveBalance: newBalance,
      });
    } else if (typeof currentBalance === "number") {
      await api.patch(`/employees/${employee.id}`, {
        leaveBalance: Math.max(
          0,
          currentBalance - request.days,
        ),
      });
    }
  };

  const approveRequest = async (
    request: LeaveRequest,
  ) => {
    if (request.status !== "Pending") {
      return;
    }

    setProcessingId(request.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updatedRequest: LeaveRequest = {
        ...request,
        status: "Approved",
      };

      await api.patch(
        `/leaveRequests/${request.id}`,
        {
          status: "Approved",
        },
      );

      /*
       * Balance changes only after approval.
       */
      try {
        await updateLeaveBalance(request);
      } catch (balanceError) {
        console.error(
          "Leave balance update failed:",
          balanceError,
        );
      }

      setLeaveRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? updatedRequest
            : item,
        ),
      );

      setSuccessMessage(
        `${getEmployeeName(
          request.employeeId,
        )}'s leave request has been approved.`,
      );
    } catch (error) {
      console.error(
        "Failed to approve leave request:",
        error,
      );

      setErrorMessage(
        "Unable to approve the leave request. Please make sure JSON Server is running.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectRequest = async () => {
    if (!selectedRequest) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      setRejectionError(
        "Rejection reason is required.",
      );
      return;
    }

    if (reason.length < 3) {
      setRejectionError(
        "Please provide a valid rejection reason.",
      );
      return;
    }

    setProcessingId(selectedRequest.id);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const updatedRequest: LeaveRequest = {
        ...selectedRequest,
        status: "Rejected",
        rejectionReason: reason,
      };

      await api.patch(
        `/leaveRequests/${selectedRequest.id}`,
        {
          status: "Rejected",
          rejectionReason: reason,
        },
      );

      setLeaveRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? updatedRequest
            : item,
        ),
      );

      setSuccessMessage(
        `${getEmployeeName(
          selectedRequest.employeeId,
        )}'s leave request has been rejected.`,
      );

      closeModal();
    } catch (error) {
      console.error(
        "Failed to reject leave request:",
        error,
      );

      setErrorMessage(
        "Unable to reject the leave request. Please make sure JSON Server is running.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
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
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
          <FileText size={21} />
        </div>

        <div>
          <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Leave Requests
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
            Review, approve, and reject employee leave
            requests.
          </p>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-400">
          <div className="flex items-center gap-2">
            <Check size={18} />
            <span>{successMessage}</span>
          </div>

          <button
            type="button"
            onClick={() => setSuccessMessage("")}
            className="rounded-lg p-1 hover:bg-green-100 dark:hover:bg-green-900/30"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={() => setErrorMessage("")}
            className="rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Pending"
          value={pendingCount}
          type="pending"
        />

        <StatCard
          label="Approved"
          value={approvedCount}
          type="approved"
        />

        <StatCard
          label="Rejected"
          value={rejectedCount}
          type="rejected"
        />

        <StatCard
          label="Cancelled"
          value={cancelledCount}
          type="cancelled"
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_170px_180px_170px_auto]">
          {/* SEARCH */}
          <div className="relative min-w-0">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98A2B3] dark:text-[#777777]"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search employee, ID, leave type..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-4 text-sm text-[#1A1A2E] outline-none placeholder:text-[#98A2B3] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:placeholder:text-[#777777] dark:focus:border-[#1E90FF]"
            />
          </div>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | LeaveStatus,
              )
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "All"
                  ? "All Status"
                  : status}
              </option>
            ))}
          </select>

          {/* LEAVE TYPE */}
          <select
            value={leaveTypeFilter}
            onChange={(event) =>
              setLeaveTypeFilter(event.target.value)
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          >
            <option value="All">All Leave Types</option>

            {leaveTypes.map((leaveType) => (
              <option
                key={leaveType.id}
                value={leaveType.leaveTypeId}
              >
                {leaveType.name}
              </option>
            ))}
          </select>

          {/* DATE */}
          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          />

          {/* CLEAR */}
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* REQUEST LIST */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
          <h2 className="text-lg font-semibold">
            Leave Request List
          </h2>

          <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
            {filteredRequests.length} request
            {filteredRequests.length !== 1 ? "s" : ""}
            {" "}found
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0066FF]/20 border-t-[#0066FF] dark:border-[#1E90FF]/20 dark:border-t-[#1E90FF]" />

              <p className="mt-3 text-sm text-[#667085] dark:text-[#B3B3B3]">
                Loading leave requests...
              </p>
            </div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
              <CalendarDays size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold">
              No leave requests found
            </h3>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] text-left dark:border-[#333333] dark:bg-[#111111]">
                    <th className="w-[17%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Employee
                    </th>

                    <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Leave Type
                    </th>

                    <th className="w-[18%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Leave Period
                    </th>

                    <th className="w-[8%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Days
                    </th>

                    <th className="w-[13%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Applied
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Status
                    </th>

                    <th className="w-[19%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-[#E1E5EA] last:border-b-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]"
                    >
                      <td className="px-4 py-4">
                        <p className="truncate text-sm font-semibold">
                          {getEmployeeName(
                            request.employeeId,
                          )}
                        </p>

                        <p className="mt-0.5 truncate text-xs text-[#667085] dark:text-[#B3B3B3]">
                          {request.employeeId}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm font-medium">
                          {getLeaveTypeName(
                            request.leaveTypeId,
                          )}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <p className="text-xs text-[#667085] dark:text-[#B3B3B3]">
                          {formatDate(request.startDate)}
                        </p>

                        <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                          to {formatDate(request.endDate)}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold">
                        {request.days ||
                          calculateDays(
                            request.startDate,
                            request.endDate,
                          )}
                      </td>

                      <td className="px-4 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
                        {formatDate(request.appliedDate)}
                      </td>

                      <td className="px-4 py-4">
                        <LeaveStatusBadge
                          status={request.status}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label="View"
                            onClick={() =>
                              openViewModal(request)
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          {request.status ===
                            "Pending" && (
                            <>
                              <ActionButton
                                label="Approve"
                                success
                                disabled={
                                  processingId ===
                                  request.id
                                }
                                onClick={() =>
                                  approveRequest(request)
                                }
                              >
                                <Check size={16} />
                              </ActionButton>

                              <ActionButton
                                label="Reject"
                                danger
                                disabled={
                                  processingId ===
                                  request.id
                                }
                                onClick={() =>
                                  openRejectModal(request)
                                }
                              >
                                <XCircle size={16} />
                              </ActionButton>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#111111]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {getEmployeeName(
                          request.employeeId,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                        {request.employeeId}
                      </p>
                    </div>

                    <LeaveStatusBadge
                      status={request.status}
                    />
                  </div>

                  <div className="mt-4 space-y-3">
                    <InfoItem
                      label="Leave Type"
                      value={getLeaveTypeName(
                        request.leaveTypeId,
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem
                        label="Start Date"
                        value={formatDate(
                          request.startDate,
                        )}
                      />

                      <InfoItem
                        label="End Date"
                        value={formatDate(
                          request.endDate,
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem
                        label="Days"
                        value={String(
                          request.days ||
                            calculateDays(
                              request.startDate,
                              request.endDate,
                            ),
                        )}
                      />

                      <InfoItem
                        label="Applied"
                        value={formatDate(
                          request.appliedDate,
                        )}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-1 border-t border-[#E1E5EA] pt-3 dark:border-[#333333]">
                    <ActionButton
                      label="View"
                      onClick={() =>
                        openViewModal(request)
                      }
                    >
                      <Eye size={16} />
                    </ActionButton>

                    {request.status === "Pending" && (
                      <>
                        <ActionButton
                          label="Approve"
                          success
                          disabled={
                            processingId === request.id
                          }
                          onClick={() =>
                            approveRequest(request)
                          }
                        >
                          <Check size={16} />
                        </ActionButton>

                        <ActionButton
                          label="Reject"
                          danger
                          disabled={
                            processingId === request.id
                          }
                          onClick={() =>
                            openRejectModal(request)
                          }
                        >
                          <XCircle size={16} />
                        </ActionButton>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL */}
      {modalMode === "view" && selectedRequest && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                  Leave Request Details
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  {getEmployeeName(
                    selectedRequest.employeeId,
                  )}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] dark:text-[#B3B3B3] dark:hover:bg-[#292929]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="grid grid-cols-2 gap-3">
                <DetailItem
                  label="Employee ID"
                  value={selectedRequest.employeeId}
                />

                <DetailItem
                  label="Leave Type"
                  value={getLeaveTypeName(
                    selectedRequest.leaveTypeId,
                  )}
                />

                <DetailItem
                  label="Start Date"
                  value={formatDate(
                    selectedRequest.startDate,
                  )}
                />

                <DetailItem
                  label="End Date"
                  value={formatDate(
                    selectedRequest.endDate,
                  )}
                />

                <DetailItem
                  label="Days"
                  value={String(
                    selectedRequest.days ||
                      calculateDays(
                        selectedRequest.startDate,
                        selectedRequest.endDate,
                      ),
                  )}
                />

                <DetailItem
                  label="Applied Date"
                  value={formatDate(
                    selectedRequest.appliedDate,
                  )}
                />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#98A2B3]">
                  Status
                </p>

                <div className="mt-2">
                  <LeaveStatusBadge
                    status={selectedRequest.status}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#98A2B3]">
                  Reason
                </p>

                <p className="mt-2 rounded-xl bg-[#F8F9FA] p-3 text-sm leading-6 text-[#667085] dark:bg-[#111111] dark:text-[#B3B3B3]">
                  {selectedRequest.reason ||
                    "No reason provided."}
                </p>
              </div>

              {selectedRequest.status === "Rejected" &&
                selectedRequest.rejectionReason && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                      Rejection Reason
                    </p>

                    <p className="mt-2 rounded-xl bg-red-50 p-3 text-sm leading-6 text-red-700 dark:bg-red-950/30 dark:text-red-400">
                      {selectedRequest.rejectionReason}
                    </p>
                  </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E1E5EA] px-5 py-4 sm:flex-row sm:justify-end dark:border-[#333333]">
              {selectedRequest.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      approveRequest(selectedRequest)
                    }
                    disabled={
                      processingId ===
                      selectedRequest.id
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check size={17} />
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openRejectModal(selectedRequest)
                    }
                    disabled={
                      processingId ===
                      selectedRequest.id
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={17} />
                    Reject
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {modalMode === "reject" && selectedRequest && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <p className="text-xs font-semibold text-red-500">
                  Reject Leave Request
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Confirm Rejection
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(processingId)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] disabled:opacity-50 dark:text-[#B3B3B3] dark:hover:bg-[#292929]"
              >
                <X size={19} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div className="rounded-xl bg-[#F8F9FA] p-4 dark:bg-[#111111]">
                <p className="text-sm">
                  You are rejecting the leave request from{" "}
                  <span className="font-semibold">
                    {getEmployeeName(
                      selectedRequest.employeeId,
                    )}
                  </span>
                  .
                </p>

                <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                  {getLeaveTypeName(
                    selectedRequest.leaveTypeId,
                  )}{" "}
                  •{" "}
                  {formatDate(
                    selectedRequest.startDate,
                  )}{" "}
                  to{" "}
                  {formatDate(
                    selectedRequest.endDate,
                  )}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Rejection Reason
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <textarea
                  value={rejectionReason}
                  onChange={(event) => {
                    setRejectionReason(
                      event.target.value,
                    );
                    setRejectionError("");
                  }}
                  placeholder="Enter the reason for rejection..."
                  rows={4}
                  className={`w-full resize-none rounded-xl border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#98A2B3] dark:bg-[#111111] dark:text-white dark:placeholder:text-[#777777] ${
                    rejectionError
                      ? "border-red-500"
                      : "border-[#D0D5DD] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                  }`}
                />

                {rejectionError && (
                  <p className="mt-1 text-xs text-red-500">
                    {rejectionError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[#E1E5EA] px-5 py-4 sm:flex-row sm:justify-end dark:border-[#333333]">
              <button
                type="button"
                onClick={closeModal}
                disabled={Boolean(processingId)}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50 dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={rejectRequest}
                disabled={Boolean(processingId)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processingId ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle size={17} />
                    Reject Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* STAT CARD */

function StatCard({
  label,
  value,
  type,
}: {
  label: string;
  value: number;
  type: "pending" | "approved" | "rejected" | "cancelled";
}) {
  const styles = {
    pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
    approved:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    rejected:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 shadow-sm dark:border-[#333333] dark:bg-[#181818] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-[#667085] dark:text-[#B3B3B3] sm:text-sm">
          {label}
        </p>

        <span
          className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${styles[type]}`}
        >
          {label}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

/* STATUS BADGE */

function LeaveStatusBadge({
  status,
}: {
  status: LeaveStatus;
}) {
  const styles: Record<LeaveStatus, string> = {
    Pending:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
    Approved:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    Rejected:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    Cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ACTION BUTTON */

function ActionButton({
  children,
  label,
  onClick,
  success = false,
  danger = false,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  success?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  let className =
    "flex h-9 w-9 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ";

  if (success) {
    className +=
      "text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30";
  } else if (danger) {
    className +=
      "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30";
  } else {
    className +=
      "text-[#667085] hover:bg-[#F2F4F7] hover:text-[#0066FF] dark:text-[#B3B3B3] dark:hover:bg-[#292929] dark:hover:text-[#1E90FF]";
  }

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  );
}

/* INFO ITEM */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

/* DETAIL ITEM */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-3 dark:border-[#333333] dark:bg-[#111111]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}