import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

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
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
  reviewedBy?: string;
  reviewDate?: string;
  reviewComment?: string;
}

interface BalanceRow {
  employee: Employee;
  departmentName: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  pendingDays: number;
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

export default function ManagerLeaveBalances() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

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

        if (cancelled) {
          return;
        }

        setEmployees(employeesResponse.data);
        setDepartments(departmentsResponse.data);
        setLeaveTypes(leaveTypesResponse.data);
        setLeaveRequests(leaveRequestsResponse.data);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to load leave balances:", err);

        setError(
          "Unable to load leave balances. Please try again.",
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

  /*
   * Find the logged-in manager's employee record.
   */
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

  /*
   * Only employees assigned to this manager are displayed.
   */
  const teamMembers = useMemo(() => {
    if (!managerEmployee) {
      return [];
    }

    return employees.filter(
      (employee) =>
        employee.managerId === managerEmployee.id ||
        employee.managerId === managerEmployee.employeeId,
    );
  }, [employees, managerEmployee]);

  /*
   * Only active leave types are used for calculating balances.
   */
  const activeLeaveTypes = useMemo(
    () =>
      leaveTypes.filter(
        (leaveType) => leaveType.status === "Active",
      ),
    [leaveTypes],
  );

  /*
   * Department helper.
   */
  const getDepartmentName = useCallback(
    (departmentId: string) =>
      departments.find(
        (department) =>
          department.departmentId === departmentId ||
          department.id === departmentId,
      )?.name || "Unknown Department",
    [departments],
  );

  /*
   * Normalize leave type IDs because the database can reference
   * either the leaveTypeId or the JSON Server id.
   */
  const getLeaveTypeId = useCallback(
    (leaveTypeId: string) =>
      leaveTypes.find(
        (leaveType) =>
          leaveType.leaveTypeId === leaveTypeId ||
          leaveType.id === leaveTypeId,
      )?.leaveTypeId || leaveTypeId,
    [leaveTypes],
  );

  /*
   * Get all requests belonging to one employee.
   */
  const getEmployeeLeaveRequests = useCallback(
    (employeeId: string) =>
      leaveRequests.filter(
        (request) => request.employeeId === employeeId,
      ),
    [leaveRequests],
  );

  /*
   * Approved leave is counted as used leave.
   */
  const getApprovedDays = useCallback(
    (employeeId: string, leaveTypeId: string) => {
      const normalizedLeaveTypeId =
        getLeaveTypeId(leaveTypeId);

      return getEmployeeLeaveRequests(employeeId)
        .filter(
          (request) =>
            request.status === "Approved" &&
            getLeaveTypeId(request.leaveTypeId) ===
              normalizedLeaveTypeId,
        )
        .reduce(
          (total, request) =>
            total + Number(request.numberOfDays || 0),
          0,
        );
    },
    [getEmployeeLeaveRequests, getLeaveTypeId],
  );

  /*
   * Pending leave is displayed separately and does not reduce
   * the remaining balance.
   */
  const getPendingDays = useCallback(
    (employeeId: string, leaveTypeId: string) => {
      const normalizedLeaveTypeId =
        getLeaveTypeId(leaveTypeId);

      return getEmployeeLeaveRequests(employeeId)
        .filter(
          (request) =>
            request.status === "Pending" &&
            getLeaveTypeId(request.leaveTypeId) ===
              normalizedLeaveTypeId,
        )
        .reduce(
          (total, request) =>
            total + Number(request.numberOfDays || 0),
          0,
        );
    },
    [getEmployeeLeaveRequests, getLeaveTypeId],
  );

  /*
   * Build the team balance rows.
   */
  const balanceRows = useMemo<BalanceRow[]>(() => {
    return teamMembers.map((employee) => {
      const totalAllocated = activeLeaveTypes.reduce(
        (total, leaveType) =>
          total + Number(leaveType.totalDays || 0),
        0,
      );

      const totalUsed = activeLeaveTypes.reduce(
        (total, leaveType) =>
          total +
          getApprovedDays(
            employee.employeeId,
            leaveType.leaveTypeId || leaveType.id,
          ),
        0,
      );

      const pendingDays = activeLeaveTypes.reduce(
        (total, leaveType) =>
          total +
          getPendingDays(
            employee.employeeId,
            leaveType.leaveTypeId || leaveType.id,
          ),
        0,
      );

      return {
        employee,
        departmentName: getDepartmentName(
          employee.departmentId,
        ),
        totalAllocated,
        totalUsed,
        totalRemaining: Math.max(
          totalAllocated - totalUsed,
          0,
        ),
        pendingDays,
      };
    });
  }, [
    teamMembers,
    activeLeaveTypes,
    getApprovedDays,
    getPendingDays,
    getDepartmentName,
  ]);

  /*
   * Search team members.
   */
  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return balanceRows;
    }

    return balanceRows.filter(
      (row) =>
        row.employee.fullName
          .toLowerCase()
          .includes(search) ||
        row.employee.employeeId
          .toLowerCase()
          .includes(search) ||
        row.employee.email
          .toLowerCase()
          .includes(search) ||
        row.employee.designation
          .toLowerCase()
          .includes(search) ||
        row.departmentName
          .toLowerCase()
          .includes(search),
    );
  }, [balanceRows, searchTerm]);

  /*
   * Summary values.
   */
  const totalAllocated = balanceRows.reduce(
    (total, row) => total + row.totalAllocated,
    0,
  );

  const totalUsed = balanceRows.reduce(
    (total, row) => total + row.totalUsed,
    0,
  );

  const totalRemaining = balanceRows.reduce(
    (total, row) => total + row.totalRemaining,
    0,
  );

  const totalPending = balanceRows.reduce(
    (total, row) => total + row.pendingDays,
    0,
  );

  /*
   * Get an individual employee's balance for one leave type.
   */
  const getEmployeeBalance = (
    employeeId: string,
    leaveTypeId: string,
  ) => {
    const leaveType = activeLeaveTypes.find(
      (type) =>
        type.leaveTypeId === leaveTypeId ||
        type.id === leaveTypeId,
    );

    if (!leaveType) {
      return {
        allocated: 0,
        used: 0,
        remaining: 0,
        pending: 0,
      };
    }

    const allocated = Number(
      leaveType.totalDays || 0,
    );

    const used = getApprovedDays(
      employeeId,
      leaveType.leaveTypeId || leaveType.id,
    );

    const pending = getPendingDays(
      employeeId,
      leaveType.leaveTypeId || leaveType.id,
    );

    return {
      allocated,
      used,
      remaining: Math.max(allocated - used, 0),
      pending,
    };
  };

  /*
   * Progress bar percentage.
   */
  const getProgressWidth = (
    used: number,
    allocated: number,
  ) => {
    if (allocated <= 0) {
      return 0;
    }

    return Math.min(
      Math.round((used / allocated) * 100),
      100,
    );
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
            Loading leave balances...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Error state.
   */
  if (error && employees.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/50 dark:bg-[#171717]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
            Unable to load leave balances
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
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
      {/* Page Header */}
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <CalendarDays className="h-5 w-5 text-[#0066FF] dark:text-[#1E90FF]" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
                Leave Balance
              </h1>

              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                View leave balances for your team members.
              </p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm dark:border-gray-700 dark:bg-[#171717]">
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

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-500/10">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />

          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          title="Total Allocated"
          value={totalAllocated}
          icon={
            <CalendarDays className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          }
          iconClassName="bg-blue-100 dark:bg-blue-500/10"
        />

        <StatCard
          title="Used"
          value={totalUsed}
          icon={
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
          }
          iconClassName="bg-emerald-100 dark:bg-emerald-500/10"
        />

        <StatCard
          title="Remaining"
          value={totalRemaining}
          icon={
            <Clock3 className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          }
          iconClassName="bg-violet-100 dark:bg-violet-500/10"
        />

        <StatCard
          title="Pending"
          value={totalPending}
          icon={
            <Clock3 className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          }
          iconClassName="bg-amber-100 dark:bg-amber-500/10"
        />
      </div>

      {/* Search */}
      <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search team member..."
            className="h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#0D0D0D] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
          />
        </div>
      </div>

      {/* Balance Table */}
      <div className="min-w-0 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-[#171717]">
        {/* Desktop Table */}
        <div className="hidden w-full md:block">
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-[#202020]">
                <th className="w-[25%] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:px-4">
                  Employee
                </th>

                <th className="w-[17%] px-3 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 lg:px-4">
                  Department
                </th>

                <th className="w-[11%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Allocated
                </th>

                <th className="w-[11%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Used
                </th>

                <th className="w-[11%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Remaining
                </th>

                <th className="w-[18%] px-2 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={row.employee.id}
                  className="group border-b border-gray-100 transition-colors last:border-0 hover:bg-blue-50/50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
                >
                  {/* Employee */}
                  <td className="min-w-0 px-3 py-4 lg:px-4">
                    <div className="flex min-w-0 items-center gap-2.5 lg:gap-3">
                      {row.employee.profileImage ? (
                        <img
                          src={row.employee.profileImage}
                          alt={row.employee.fullName}
                          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700 lg:h-10 lg:w-10"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF] lg:h-10 lg:w-10 lg:text-sm">
                          {row.employee.fullName
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p
                          title={row.employee.fullName}
                          className="truncate text-xs font-semibold text-[#1A1A2E] dark:text-white lg:text-sm"
                        >
                          {row.employee.fullName}
                        </p>

                        <p
                          title={`${row.employee.employeeId} • ${row.employee.designation}`}
                          className="truncate text-[11px] text-gray-500 dark:text-gray-400 lg:text-xs"
                        >
                          {row.employee.employeeId} •{" "}
                          {row.employee.designation}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="min-w-0 px-3 py-4 lg:px-4">
                    <p
                      title={row.departmentName}
                      className="truncate text-xs font-medium text-[#1A1A2E] dark:text-white lg:text-sm"
                    >
                      {row.departmentName}
                    </p>
                  </td>

                  {/* Allocated */}
                  <td className="px-2 py-4 text-center">
                    <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                      {row.totalAllocated}
                    </span>
                  </td>

                  {/* Used */}
                  <td className="px-2 py-4 text-center">
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.totalUsed}
                    </span>
                  </td>

                  {/* Remaining */}
                  <td className="px-2 py-4 text-center">
                    <span
                      className={`text-sm font-bold ${
                        row.totalRemaining <= 3
                          ? "text-red-600 dark:text-red-400"
                          : "text-[#0066FF] dark:text-[#1E90FF]"
                      }`}
                    >
                      {row.totalRemaining}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-2 py-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedEmployee(row.employee)
                      }
                      className="mx-auto block w-full max-w-[120px] truncate rounded-lg border border-gray-200 px-2 py-2 text-[11px] font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF] sm:text-xs"
                    >
                      View Balance
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-4 p-4 md:hidden">
          {filteredRows.map((row) => (
            <div
              key={row.employee.id}
              className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-[#202020]"
            >
              <div className="flex min-w-0 items-center gap-3">
                {row.employee.profileImage ? (
                  <img
                    src={row.employee.profileImage}
                    alt={row.employee.fullName}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                    {row.employee.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                    {row.employee.fullName}
                  </p>

                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {row.employee.employeeId}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-[#171717]">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Allocated
                  </p>

                  <p className="mt-1 font-bold text-[#1A1A2E] dark:text-white">
                    {row.totalAllocated}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-[#171717]">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Used
                  </p>

                  <p className="mt-1 font-bold text-emerald-600 dark:text-emerald-400">
                    {row.totalUsed}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3 text-center dark:border-gray-700 dark:bg-[#171717]">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Remaining
                  </p>

                  <p
                    className={`mt-1 font-bold ${
                      row.totalRemaining <= 3
                        ? "text-red-600 dark:text-red-400"
                        : "text-[#0066FF] dark:text-[#1E90FF]"
                    }`}
                  >
                    {row.totalRemaining}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Pending Leave
                </p>

                <p className="mt-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                  {row.pendingDays} days
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEmployee(row.employee)
                }
                className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:bg-[#171717] dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
              >
                View Leave Balance
              </button>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredRows.length === 0 && (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <Users className="h-7 w-7 text-gray-400 dark:text-gray-500" />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#1A1A2E] dark:text-white">
              No team members found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
              Try changing your search or check whether team
              members are assigned to you.
            </p>
          </div>
        )}
      </div>

      {/* Employee Balance Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
         <div className="hide-scrollbar max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-[#171717]">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4 dark:border-gray-700 dark:bg-[#171717]">
              <div className="flex min-w-0 items-center gap-3">
                {selectedEmployee.profileImage ? (
                  <img
                    src={selectedEmployee.profileImage}
                    alt={selectedEmployee.fullName}
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                    {selectedEmployee.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                    {selectedEmployee.fullName}
                  </h2>

                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {selectedEmployee.employeeId} •{" "}
                    {selectedEmployee.designation}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedEmployee(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4 p-5">
              {activeLeaveTypes.map((leaveType) => {
                const balance = getEmployeeBalance(
                  selectedEmployee.employeeId,
                  leaveType.leaveTypeId ||
                    leaveType.id,
                );

                const progress = getProgressWidth(
                  balance.used,
                  balance.allocated,
                );

                return (
                  <div
                    key={leaveType.id}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                          {leaveType.name}
                        </h3>

                        {leaveType.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            {leaveType.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                        {balance.remaining} left
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-gray-500 dark:text-gray-400">
                          Used {balance.used} of{" "}
                          {balance.allocated} days
                        </span>

                        <span className="shrink-0 font-semibold text-[#1A1A2E] dark:text-white">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
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
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Allocated
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#1A1A2E] dark:text-white">
                          {balance.allocated}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Used
                        </p>

                        <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {balance.used}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3 text-center dark:bg-[#171717]">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Pending
                        </p>

                        <p className="mt-1 text-sm font-bold text-amber-600 dark:text-amber-400">
                          {balance.pending}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {activeLeaveTypes.length === 0 && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-[#202020]">
                  <CalendarDays className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />

                  <p className="mt-3 text-sm font-semibold text-[#1A1A2E] dark:text-white">
                    No active leave types
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Leave types need to be configured before
                    balances can be displayed.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}