import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Users,
  X,
  XCircle,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

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
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: ReactNode;
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

export default function ManagerLeaveRequests() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | LeaveStatus>(
    "All",
  );
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  const [actionRequest, setActionRequest] =
    useState<LeaveRequest | null>(null);

  const [actionType, setActionType] = useState<
    "approve" | "reject" | null
  >(null);

  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        employeesResponse,
        departmentsResponse,
        leaveTypesResponse,
        leaveRequestsResponse,
      ] = await Promise.all([
        api.get<Employee[]>("/employees"),
        api.get<Department[]>("/departments"),
        api.get<LeaveType[]>("/leaveTypes"),
        api.get<LeaveRequest[]>("/leaveRequests"),
      ]);

      setEmployees(employeesResponse.data);
      setDepartments(departmentsResponse.data);
      setLeaveTypes(leaveTypesResponse.data);
      setLeaveRequests(leaveRequestsResponse.data);
    } catch (err) {
      console.error("Failed to load leave requests:", err);
      setError("Unable to load leave requests. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          departmentsResponse,
          leaveTypesResponse,
          leaveRequestsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<LeaveRequest[]>("/leaveRequests"),
        ]);

        if (cancelled) return;

        setEmployees(employeesResponse.data);
        setDepartments(departmentsResponse.data);
        setLeaveTypes(leaveTypesResponse.data);
        setLeaveRequests(leaveRequestsResponse.data);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load leave requests:", err);
        setError("Unable to load leave requests. Please try again.");
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

  const teamMembers = useMemo(() => {
    if (!managerEmployee) return [];

    return employees.filter(
      (employee) =>
        employee.managerId === managerEmployee.id ||
        employee.managerId === managerEmployee.employeeId,
    );
  }, [employees, managerEmployee]);

  const teamEmployeeIds = useMemo(
    () => new Set(teamMembers.map((employee) => employee.employeeId)),
    [teamMembers],
  );

  const getEmployee = useCallback(
  (employeeId: string) =>
    employees.find(
      (employee) =>
        employee.employeeId === employeeId ||
        employee.id === employeeId,
    ),
  [employees],
);

const getLeaveType = useCallback(
  (leaveTypeId: string) =>
    leaveTypes.find(
      (leaveType) =>
        leaveType.leaveTypeId === leaveTypeId ||
        leaveType.id === leaveTypeId,
    ),
  [leaveTypes],
);

const getDepartment = useCallback(
  (departmentId: string) =>
    departments.find(
      (department) =>
        department.departmentId === departmentId ||
        department.id === departmentId,
    ),
  [departments],
);

  const teamLeaveRequests = useMemo(() => {
    return leaveRequests.filter((request) =>
      teamEmployeeIds.has(request.employeeId),
    );
  }, [leaveRequests, teamEmployeeIds]);

  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return teamLeaveRequests.filter((request) => {
      const employee = getEmployee(request.employeeId);
      const leaveType = getLeaveType(request.leaveTypeId);

      const matchesSearch =
        !search ||
        employee?.fullName.toLowerCase().includes(search) ||
        employee?.employeeId.toLowerCase().includes(search) ||
        employee?.email.toLowerCase().includes(search) ||
        leaveType?.name.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const matchesLeaveType =
        leaveTypeFilter === "All" ||
        request.leaveTypeId === leaveTypeFilter;

      return matchesSearch && matchesStatus && matchesLeaveType;
    });
 }, [
  teamLeaveRequests,
  searchTerm,
  statusFilter,
  leaveTypeFilter,
  getEmployee,
  getLeaveType,
]);

  const pendingCount = teamLeaveRequests.filter(
    (request) => request.status === "Pending",
  ).length;

  const approvedCount = teamLeaveRequests.filter(
    (request) => request.status === "Approved",
  ).length;

  const rejectedCount = teamLeaveRequests.filter(
    (request) => request.status === "Rejected",
  ).length;

  const cancelledCount = teamLeaveRequests.filter(
    (request) => request.status === "Cancelled",
  ).length;

  const formatDate = (date: string) => {
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
  };

  const getStatusClass = (status: LeaveStatus) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30";

      case "Approved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30";

      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30";

      case "Cancelled":
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/30";

      default:
        return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-300 dark:border-gray-500/30";
    }
  };

  const openActionModal = (
    request: LeaveRequest,
    type: "approve" | "reject",
  ) => {
    setActionRequest(request);
    setActionType(type);
    setRejectionReason("");
  };

  const closeActionModal = () => {
    if (actionLoading) return;

    setActionRequest(null);
    setActionType(null);
    setRejectionReason("");
  };

  const handleAction = async () => {
    if (!actionRequest || !actionType || !user) return;

    if (
      actionType === "reject" &&
      !rejectionReason.trim()
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccessMessage("");

      const today = new Date().toISOString().split("T")[0];

      const updateData =
        actionType === "approve"
          ? {
              status: "Approved",
              reviewedBy: user.employeeId,
              reviewDate: today,
              reviewComment: "Approved by manager.",
            }
          : {
              status: "Rejected",
              reviewedBy: user.employeeId,
              reviewDate: today,
              reviewComment: rejectionReason.trim(),
            };

      const response = await api.patch<LeaveRequest>(
        `/leaveRequests/${actionRequest.id}`,
        updateData,
      );

      setLeaveRequests((currentRequests) =>
        currentRequests.map((request) =>
          request.id === actionRequest.id
            ? {
                ...request,
                ...response.data,
              }
            : request,
        ),
      );

      setSuccessMessage(
        actionType === "approve"
          ? "Leave request approved successfully."
          : "Leave request rejected successfully.",
      );

      closeActionModal();

      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (err) {
      console.error("Failed to update leave request:", err);
      setError(
        "Unable to update the leave request. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0066FF] dark:border-gray-700 dark:border-t-[#1E90FF]" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading leave requests...
          </p>
        </div>
      </div>
    );
  }

  if (error && leaveRequests.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/50 dark:bg-[#171717]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
            Unable to load leave requests
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => void fetchData()}
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
      <div className="min-w-0">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <FileText className="h-5 w-5 text-[#0066FF] dark:text-[#1E90FF]" />
              </div>

              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
                  Leave Requests
                </h1>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Review and manage leave requests from your team.
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-[#171717]">
            <Users className="h-5 w-5 text-[#0066FF] dark:text-[#1E90FF]" />

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Team Members
              </p>

              <p className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                {teamMembers.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-500/10">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />

          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />

          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {successMessage}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          }
          iconClassName="bg-amber-100 dark:bg-amber-500/10"
        />

        <StatCard
          title="Approved"
          value={approvedCount}
          icon={
            <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          }
          iconClassName="bg-emerald-100 dark:bg-emerald-500/10"
        />

        <StatCard
          title="Rejected"
          value={rejectedCount}
          icon={
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-300" />
          }
          iconClassName="bg-red-100 dark:bg-red-500/10"
        />

        <StatCard
          title="Cancelled"
          value={cancelledCount}
          icon={
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          }
          iconClassName="bg-gray-100 dark:bg-gray-500/10"
        />
      </div>

      {/* Filters */}
      <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#171717] sm:p-5">
        <div className="grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative min-w-0 md:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search employee or leave type..."
              className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#0D0D0D] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
            />
          </div>

          {/* Status */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "All" | LeaveStatus,
              )
            }
            className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#0D0D0D] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Leave type */}
          <select
            value={leaveTypeFilter}
            onChange={(event) =>
              setLeaveTypeFilter(event.target.value)
            }
            className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#0D0D0D] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
          >
            <option value="All">All Leave Types</option>

            {leaveTypes.map((leaveType) => (
              <option
                key={leaveType.id}
                value={leaveType.leaveTypeId || leaveType.id}
              >
                {leaveType.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        {/* Desktop */}
        <div className="hidden w-full md:block">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#202020]">
                <th className="w-[24%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Employee
                </th>

                <th className="w-[16%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Leave Type
                </th>

                <th className="w-[18%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Dates
                </th>

                <th className="w-[8%] px-4 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Days
                </th>

                <th className="w-[12%] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Status
                </th>

                <th className="w-[22%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((request) => {
                const employee = getEmployee(request.employeeId);
                const leaveType = getLeaveType(request.leaveTypeId);
                const department = employee
                  ? getDepartment(employee.departmentId)
                  : undefined;

                return (
                  <tr
                    key={request.id}
                    className="group border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                  >
                    {/* Employee */}
                    <td className="min-w-0 px-4 py-4 align-middle">
                      <div className="flex min-w-0 items-center gap-3">
                        {employee?.profileImage ? (
                          <img
                            src={employee.profileImage}
                            alt={employee.fullName}
                            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                            {employee?.fullName
                              ?.charAt(0)
                              .toUpperCase() || "?"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p
                            title={employee?.fullName || "Unknown Employee"}
                            className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white"
                          >
                            {employee?.fullName || "Unknown Employee"}
                          </p>

                          <p
                            title={`${employee?.employeeId || "-"}${department ? ` • ${department.name}` : ""}`}
                            className="truncate text-xs text-gray-500 dark:text-gray-400"
                          >
                            {employee?.employeeId || "-"}
                            {department
                              ? ` • ${department.name}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Leave Type */}
                    <td className="min-w-0 px-4 py-4 align-middle">
                      <p
                        title={leaveType?.name || "Unknown Leave"}
                        className="truncate text-sm font-medium text-[#1A1A2E] dark:text-white"
                      >
                        {leaveType?.name || "Unknown Leave"}
                      </p>

                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        Applied {formatDate(request.appliedDate)}
                      </p>
                    </td>

                    {/* Dates */}
                    <td className="min-w-0 px-4 py-4 align-middle">
                      <p className="truncate text-sm font-medium text-[#1A1A2E] dark:text-white">
                        {formatDate(request.fromDate)}
                      </p>

                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        to {formatDate(request.toDate)}
                      </p>
                    </td>

                    {/* Days */}
                    <td className="px-4 py-4 text-center align-middle">
                      <span className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                        {request.numberOfDays}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          request.status,
                        )}`}
                      >
                        <span className="truncate">
                          {request.status}
                        </span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 align-middle">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedRequest(request)
                          }
                          className="whitespace-nowrap rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
                        >
                          View
                        </button>

                        {request.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal(
                                  request,
                                  "approve",
                                )
                              }
                              className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openActionModal(
                                  request,
                                  "reject",
                                )
                              }
                              className="whitespace-nowrap rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="space-y-4 p-4 md:hidden">
          {filteredRequests.map((request) => {
            const employee = getEmployee(request.employeeId);
            const leaveType = getLeaveType(request.leaveTypeId);
            const department = employee
              ? getDepartment(employee.departmentId)
              : undefined;

            return (
              <div
                key={request.id}
                className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-[#202020]"
              >
                {/* Employee */}
                <div className="flex min-w-0 items-center gap-3">
                  {employee?.profileImage ? (
                    <img
                      src={employee.profileImage}
                      alt={employee.fullName}
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                      {employee?.fullName
                        ?.charAt(0)
                        .toUpperCase() || "?"}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                      {employee?.fullName || "Unknown Employee"}
                    </p>

                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {employee?.employeeId || "-"}
                      {department
                        ? ` • ${department.name}`
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                      request.status,
                    )}`}
                  >
                    {request.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#171717]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Leave Type
                    </p>

                    <p
                      title={leaveType?.name || "Unknown Leave"}
                      className="mt-1 truncate text-sm font-semibold text-[#1A1A2E] dark:text-white"
                    >
                      {leaveType?.name || "Unknown Leave"}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#171717]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Days
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {request.numberOfDays}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#171717]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      From
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {formatDate(request.fromDate)}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-[#171717]">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      To
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {formatDate(request.toDate)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedRequest(request)
                    }
                    className="flex-1 whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:bg-[#171717] dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
                  >
                    View Details
                  </button>

                  {request.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          openActionModal(
                            request,
                            "approve",
                          )
                        }
                        className="flex-1 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openActionModal(
                            request,
                            "reject",
                          )
                        }
                        className="flex-1 whitespace-nowrap rounded-lg bg-red-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty */}
        {filteredRequests.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <FileText className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#1A1A2E] dark:text-white">
              No leave requests found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              {teamLeaveRequests.length === 0
                ? "Your team does not have any leave requests yet."
                : "Try changing the search or filter options."}
            </p>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#171717]">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-[#171717]">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                  Leave Request Details
                </h2>

                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {selectedRequest.requestId ||
                    selectedRequest.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {(() => {
                const employee = getEmployee(
                  selectedRequest.employeeId,
                );
                const leaveType = getLeaveType(
                  selectedRequest.leaveTypeId,
                );
                const department = employee
                  ? getDepartment(employee.departmentId)
                  : undefined;

                return (
                  <>
                    <div className="flex items-center gap-3">
                      {employee?.profileImage ? (
                        <img
                          src={employee.profileImage}
                          alt={employee.fullName}
                          className="h-14 w-14 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                          {employee?.fullName
                            ?.charAt(0)
                            .toUpperCase() || "?"}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-[#1A1A2E] dark:text-white">
                          {employee?.fullName ||
                            "Unknown Employee"}
                        </h3>

                        <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                          {employee?.employeeId || "-"}
                          {employee?.designation
                            ? ` • ${employee.designation}`
                            : ""}
                        </p>

                        {department && (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                            {department.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Leave Type
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {leaveType?.name || "Unknown Leave"}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Status
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                            selectedRequest.status,
                          )}`}
                        >
                          {selectedRequest.status}
                        </span>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          From Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {formatDate(
                            selectedRequest.fromDate,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          To Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {formatDate(
                            selectedRequest.toDate,
                          )}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Number of Days
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {selectedRequest.numberOfDays}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Applied Date
                        </p>

                        <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                          {formatDate(
                            selectedRequest.appliedDate,
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        Reason
                      </p>

                      <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-300">
                        {selectedRequest.reason || "No reason provided."}
                      </div>
                    </div>

                    {selectedRequest.reviewComment && (
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Review Comment
                        </p>

                        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-700 dark:border-gray-700 dark:bg-[#202020] dark:text-gray-300">
                          {selectedRequest.reviewComment}
                        </div>
                      </div>
                    )}

                    {selectedRequest.status === "Pending" && (
                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(null);
                            openActionModal(
                              selectedRequest,
                              "reject",
                            );
                          }}
                          className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(null);
                            openActionModal(
                              selectedRequest,
                              "approve",
                            );
                          }}
                          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {actionRequest && actionType && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#171717]">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    actionType === "approve"
                      ? "bg-emerald-100 dark:bg-emerald-500/10"
                      : "bg-red-100 dark:bg-red-500/10"
                  }`}
                >
                  {actionType === "approve" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                    {actionType === "approve"
                      ? "Approve Leave Request"
                      : "Reject Leave Request"}
                  </h2>

                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {getEmployee(actionRequest.employeeId)
                      ?.fullName || "Unknown Employee"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoading}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Leave Type
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {getLeaveType(
                        actionRequest.leaveTypeId,
                      )?.name || "Unknown Leave"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Days
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {actionRequest.numberOfDays}
                    </p>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Dates
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                    {formatDate(actionRequest.fromDate)} -{" "}
                    {formatDate(actionRequest.toDate)}
                  </p>
                </div>
              </div>

              {actionType === "reject" && (
                <div>
                  <label
                    htmlFor="rejectionReason"
                    className="mb-2 block text-sm font-semibold text-[#1A1A2E] dark:text-white"
                  >
                    Rejection Reason{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    id="rejectionReason"
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    placeholder="Enter the reason for rejecting this request..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-[#1A1A2E] outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-gray-700 dark:bg-[#0D0D0D] dark:text-white dark:focus:border-red-400 dark:focus:ring-red-500/10"
                  />

                  {!rejectionReason.trim() && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      A rejection reason is required.
                    </p>
                  )}
                </div>
              )}

              {actionType === "approve" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-500/10">
                  <p className="text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                    Approving this request will mark the leave
                    request as approved.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={actionLoading}
                  className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => void handleAction()}
                  disabled={
                    actionLoading ||
                    (actionType === "reject" &&
                      !rejectionReason.trim())
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {actionLoading
                    ? "Processing..."
                    : actionType === "approve"
                      ? "Confirm Approval"
                      : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}