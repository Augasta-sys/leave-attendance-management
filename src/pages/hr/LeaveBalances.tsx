import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Search,
  Users,
} from "lucide-react";

import { api } from "../../services/api";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  departmentId: string;
  designation: string;
  employmentStatus?: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  daysAllowed: number;
  status?: "Active" | "Inactive";
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  appliedDate: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
}

interface BalanceRow {
  employee: Employee;
  departmentName: string;
  leaveType: LeaveType;
  allocated: number;
  used: number;
  remaining: number;
}

const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "1",
    departmentId: "DEP001",
    name: "Engineering",
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
    name: "Administration",
    status: "Active",
  },
];

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: "1",
    leaveTypeId: "LT001",
    name: "Casual Leave",
    daysAllowed: 12,
    status: "Active",
  },
  {
    id: "2",
    leaveTypeId: "LT002",
    name: "Sick Leave",
    daysAllowed: 10,
    status: "Active",
  },
  {
    id: "3",
    leaveTypeId: "LT003",
    name: "Earned Leave",
    daysAllowed: 15,
    status: "Active",
  },
  {
    id: "4",
    leaveTypeId: "LT004",
    name: "Maternity Leave",
    daysAllowed: 180,
    status: "Active",
  },
  {
    id: "5",
    leaveTypeId: "LT005",
    name: "Paternity Leave",
    daysAllowed: 15,
    status: "Active",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRemainingClass(remaining: number, allocated: number) {
  if (remaining <= 0) {
    return "text-red-600 dark:text-red-400";
  }

  if (allocated > 0 && remaining <= allocated * 0.25) {
    return "text-amber-600 dark:text-amber-400";
  }

  return "text-emerald-600 dark:text-emerald-400";
}

export default function LeaveBalances() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

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

        setEmployees(employeesResponse.data || []);

        const apiDepartments = departmentsResponse.data || [];

        const mergedDepartments = [
          ...DEFAULT_DEPARTMENTS,
          ...apiDepartments.filter(
            (apiDepartment) =>
              !DEFAULT_DEPARTMENTS.some(
                (defaultDepartment) =>
                  defaultDepartment.departmentId ===
                  apiDepartment.departmentId,
              ),
          ),
        ];

        setDepartments(mergedDepartments);

        const apiLeaveTypes = leaveTypesResponse.data || [];

        const mergedLeaveTypes = [
          ...DEFAULT_LEAVE_TYPES,
          ...apiLeaveTypes.filter(
            (apiLeaveType) =>
              !DEFAULT_LEAVE_TYPES.some(
                (defaultLeaveType) =>
                  defaultLeaveType.leaveTypeId ===
                  apiLeaveType.leaveTypeId,
              ),
          ),
        ];

        setLeaveTypes(mergedLeaveTypes);
        setLeaveRequests(leaveRequestsResponse.data || []);
      } catch (error) {
        console.error("Failed to fetch leave balance data:", error);

        try {
          const [
            employeesResponse,
            leaveRequestsResponse,
          ] = await Promise.all([
            api.get<Employee[]>("/employees"),
            api.get<LeaveRequest[]>("/leaveRequests"),
          ]);

          setEmployees(employeesResponse.data || []);
          setLeaveRequests(leaveRequestsResponse.data || []);
        } catch (fallbackError) {
          console.error("Fallback fetch failed:", fallbackError);
        }

        setDepartments(DEFAULT_DEPARTMENTS);
        setLeaveTypes(DEFAULT_LEAVE_TYPES);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDepartmentName = useCallback(
    (departmentId: string) => {
      return (
        departments.find(
          (department) => department.departmentId === departmentId,
        )?.name || "Unknown Department"
      );
    },
    [departments],
  );

  const balanceRows = useMemo<BalanceRow[]>(() => {
    const rows: BalanceRow[] = [];

    employees.forEach((employee) => {
      leaveTypes
        .filter((leaveType) => (leaveType.status || "Active") === "Active")
        .forEach((leaveType) => {
          const used = leaveRequests
            .filter(
              (request) =>
                request.employeeId === employee.employeeId &&
                request.leaveTypeId === leaveType.leaveTypeId &&
                request.status === "Approved",
            )
            .reduce((total, request) => total + Number(request.days || 0), 0);

          const allocated = Number(leaveType.daysAllowed || 0);

          rows.push({
            employee,
            departmentName: getDepartmentName(employee.departmentId),
            leaveType,
            allocated,
            used,
            remaining: Math.max(allocated - used, 0),
          });
        });
    });

    return rows;
  }, [employees, leaveTypes, leaveRequests, getDepartmentName]);

  const filteredRows = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return balanceRows.filter((row) => {
      const matchesSearch =
        !search ||
        row.employee.employeeId.toLowerCase().includes(search) ||
        row.employee.fullName.toLowerCase().includes(search) ||
        row.employee.email.toLowerCase().includes(search) ||
        row.leaveType.name.toLowerCase().includes(search);

      const matchesDepartment =
        departmentFilter === "all" ||
        row.employee.departmentId === departmentFilter;

      const matchesLeaveType =
        leaveTypeFilter === "all" ||
        row.leaveType.leaveTypeId === leaveTypeFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesLeaveType
      );
    });
  }, [
    balanceRows,
    searchTerm,
    departmentFilter,
    leaveTypeFilter,
  ]);

  const totalEmployees = employees.length;

  const totalAllocated = filteredRows.reduce(
    (total, row) => total + row.allocated,
    0,
  );

  const totalUsed = filteredRows.reduce(
    (total, row) => total + row.used,
    0,
  );

  const totalRemaining = filteredRows.reduce(
    (total, row) => total + row.remaining,
    0,
  );

  const inputClass = `
    h-11 w-full rounded-xl border
    border-[#D0D5DD] bg-white px-4
    text-sm text-[#1A1A2E]
    outline-none transition
    placeholder:text-[#98A2B3]
    focus:border-[#0066FF]
    focus:ring-2 focus:ring-[#0066FF]/10
    dark:border-[#3A3A3A]
    dark:bg-[#101010]
    dark:text-white
    dark:placeholder:text-[#777777]
    dark:focus:border-[#1E90FF]
    dark:focus:ring-[#1E90FF]/10
  `;

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-white sm:text-3xl">
          Leave Balances
        </h1>

        <p className="mt-1 text-sm text-[#667085] dark:text-[#A0A0A0]">
          View employee leave allocations, used days and remaining balances.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Employees
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalEmployees}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
              <Users size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Allocated Days
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalAllocated}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Used Days
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalUsed}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
              <Clock3 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Remaining Days
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalRemaining}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-[#2D2D2D] dark:bg-[#181818]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#98A2B3] dark:text-[#777777]"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search employee or leave type..."
              className={`${inputClass} pl-11`}
            />
          </div>

          {/* Department */}
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All Departments</option>

            {departments
              .filter(
                (department) =>
                  (department.status || "Active") === "Active",
              )
              .map((department) => (
                <option
                  key={department.departmentId}
                  value={department.departmentId}
                >
                  {department.name}
                </option>
              ))}
          </select>

          {/* Leave Type */}
          <select
            value={leaveTypeFilter}
            onChange={(event) => setLeaveTypeFilter(event.target.value)}
            className={inputClass}
          >
            <option value="all">All Leave Types</option>

            {leaveTypes
              .filter(
                (leaveType) =>
                  (leaveType.status || "Active") === "Active",
              )
              .map((leaveType) => (
                <option
                  key={leaveType.leaveTypeId}
                  value={leaveType.leaveTypeId}
                >
                  {leaveType.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Table / Cards */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white dark:border-[#2D2D2D] dark:bg-[#181818]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D9E7FF] border-t-[#0066FF] dark:border-[#333333] dark:border-t-[#1E90FF]" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7] text-[#667085] dark:bg-[#242424] dark:text-[#A0A0A0]">
              <CalendarDays size={24} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-[#1A1A2E] dark:text-white">
              No leave balances found
            </h3>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#A0A0A0]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] dark:border-[#2D2D2D] dark:bg-[#111111]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Leave Type
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Allocated
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Used
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Remaining
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={`${row.employee.employeeId}-${row.leaveType.leaveTypeId}`}
                      className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8F9FA] dark:border-[#2D2D2D] dark:hover:bg-[#202020]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                            {getInitials(row.employee.fullName)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#1A1A2E] dark:text-white">
                              {row.employee.fullName}
                            </p>

                            <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                              {row.employee.employeeId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-[#344054] dark:text-[#D0D0D0]">
                        {row.departmentName}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm font-medium text-[#1A1A2E] dark:text-white">
                          {row.leaveType.name}
                        </span>

                        <p className="mt-0.5 text-xs text-[#667085] dark:text-[#A0A0A0]">
                          {row.leaveType.leaveTypeId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-[#1A1A2E] dark:text-white">
                        {row.allocated}
                      </td>

                      <td className="px-5 py-4 text-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {row.used}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`text-sm font-bold ${getRemainingClass(
                            row.remaining,
                            row.allocated,
                          )}`}
                        >
                          {row.remaining}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {filteredRows.map((row) => (
                <div
                  key={`${row.employee.employeeId}-${row.leaveType.leaveTypeId}`}
                  className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4 dark:border-[#333333] dark:bg-[#111111]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                      {getInitials(row.employee.fullName)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                        {row.employee.fullName}
                      </p>

                      <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                        {row.employee.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                      Department
                    </p>

                    <p className="mt-1 text-sm font-medium text-[#1A1A2E] dark:text-white">
                      {row.departmentName}
                    </p>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#F2F4F7] p-3 dark:bg-[#202020]">
                    <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                      Leave Type
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#1A1A2E] dark:text-white">
                      {row.leaveType.name}
                    </p>

                    <p className="mt-0.5 text-xs text-[#667085] dark:text-[#A0A0A0]">
                      {row.leaveType.leaveTypeId}
                    </p>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center dark:border-[#333333] dark:bg-[#181818]">
                      <p className="text-[11px] text-[#667085] dark:text-[#A0A0A0]">
                        Allocated
                      </p>

                      <p className="mt-1 text-base font-bold text-[#1A1A2E] dark:text-white">
                        {row.allocated}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center dark:border-[#333333] dark:bg-[#181818]">
                      <p className="text-[11px] text-[#667085] dark:text-[#A0A0A0]">
                        Used
                      </p>

                      <p className="mt-1 text-base font-bold text-orange-600 dark:text-orange-400">
                        {row.used}
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 text-center dark:border-[#333333] dark:bg-[#181818]">
                      <p className="text-[11px] text-[#667085] dark:text-[#A0A0A0]">
                        Remaining
                      </p>

                      <p
                        className={`mt-1 text-base font-bold ${getRemainingClass(
                          row.remaining,
                          row.allocated,
                        )}`}
                      >
                        {row.remaining}
                      </p>
                    </div>
                  </div>

                  {row.allocated > 0 && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="text-[#667085] dark:text-[#A0A0A0]">
                          Usage
                        </span>

                        <span className="font-medium text-[#344054] dark:text-[#D0D0D0]">
                          {Math.min(
                            Math.round(
                              (row.used / row.allocated) * 100,
                            ),
                            100,
                          )}
                          %
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
                        <div
                          className="h-full rounded-full bg-[#0066FF] transition-all dark:bg-[#1E90FF]"
                          style={{
                            width: `${Math.min(
                              (row.used / row.allocated) * 100,
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}