import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Eye,
  Search,
  Users,
  X,
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
  profileImage?: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
  createdDate?: string;
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
  days?: number;
  reason: string;
  appliedDate: string;
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Cancelled";
  rejectionReason?: string;
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
    name: "Development",
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
    name: "Support",
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
    daysAllowed: 90,
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

function getDepartmentName(
  departmentId: string,
  departments: Department[],
) {
  const department = departments.find(
    (item) =>
      item.departmentId === departmentId ||
      item.id === departmentId ||
      item.name === departmentId,
  );

  return department?.name || departmentId || "Not Assigned";
}

function calculateDays(
  startDate: string,
  endDate: string,
) {
  if (!startDate || !endDate) {
    return 0;
  }

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

  return Math.max(
    0,
    Math.floor(
      difference / (1000 * 60 * 60 * 24),
    ) + 1,
  );
}

function getRequestDays(request: LeaveRequest) {
  if (
    typeof request.days === "number" &&
    request.days > 0
  ) {
    return request.days;
  }

  return calculateDays(
    request.startDate,
    request.endDate,
  );
}

export default function LeaveBalances() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<
    Department[]
  >([]);
  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);
  const [leaveRequests, setLeaveRequests] = useState<
    LeaveRequest[]
  >([]);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("all");
  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedBalance, setSelectedBalance] =
    useState<BalanceRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
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

        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );

        const apiDepartments =
          Array.isArray(departmentsResponse.data)
            ? departmentsResponse.data
            : [];

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

        setLeaveTypes(
          leaveTypesResponse.data?.length
            ? leaveTypesResponse.data
            : DEFAULT_LEAVE_TYPES,
        );

        setLeaveRequests(
          Array.isArray(leaveRequestsResponse.data)
            ? leaveRequestsResponse.data
            : [],
        );

        setError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load leave balances:",
          err,
        );

        setError(
          "Unable to load leave balance data. Please make sure JSON Server is running.",
        );

        setDepartments(DEFAULT_DEPARTMENTS);
        setLeaveTypes(DEFAULT_LEAVE_TYPES);
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


  const balanceRows = useMemo<BalanceRow[]>(() => {
    const rows: BalanceRow[] = [];

    employees.forEach((employee) => {
      leaveTypes.forEach((leaveType) => {
        const approvedRequests =
          leaveRequests.filter(
            (request) =>
              request.employeeId === employee.employeeId &&
              request.leaveTypeId === leaveType.leaveTypeId &&
              request.status === "Approved",
          );

        const used = approvedRequests.reduce(
          (total, request) =>
            total + getRequestDays(request),
          0,
        );

        const allocated = Number(
          leaveType.daysAllowed || 0,
        );

        const remaining = Math.max(
          allocated - used,
          0,
        );

        rows.push({
          employee,
          departmentName: getDepartmentName(
            employee.departmentId,
            departments,
          ),
          leaveType,
          allocated,
          used,
          remaining,
        });
      });
    });

    return rows;
  }, [
    employees,
    departments,
    leaveTypes,
    leaveRequests,
  ]);

  const filteredRows = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return balanceRows.filter((row) => {
      const matchesSearch =
        !searchValue ||
        row.employee.fullName
          .toLowerCase()
          .includes(searchValue) ||
        row.employee.employeeId
          .toLowerCase()
          .includes(searchValue) ||
        row.employee.email
          .toLowerCase()
          .includes(searchValue) ||
        row.departmentName
          .toLowerCase()
          .includes(searchValue) ||
        row.leaveType.name
          .toLowerCase()
          .includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        row.employee.departmentId ===
          departmentFilter ||
        row.departmentName === departmentFilter;

      const matchesLeaveType =
        leaveTypeFilter === "all" ||
        row.leaveType.leaveTypeId ===
          leaveTypeFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesLeaveType
      );
    });
  }, [
    balanceRows,
    search,
    departmentFilter,
    leaveTypeFilter,
  ]);

  const stats = useMemo(() => {
    const uniqueEmployees = new Set(
      balanceRows.map(
        (row) => row.employee.employeeId,
      ),
    );

    const allocated = balanceRows.reduce(
      (total, row) => total + row.allocated,
      0,
    );

    const used = balanceRows.reduce(
      (total, row) => total + row.used,
      0,
    );

    const remaining = balanceRows.reduce(
      (total, row) => total + row.remaining,
      0,
    );

    return {
      employees: uniqueEmployees.size,
      allocated,
      used,
      remaining,
    };
  }, [balanceRows]);

  const getUsagePercentage = (
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

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Leave Balances
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
            View employee leave allocation, usage and
            remaining balance.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={stats.employees}
          icon={<Users size={20} />}
          iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
        />

        <StatCard
          title="Total Allocated"
          value={`${stats.allocated} days`}
          icon={<CalendarDays size={20} />}
          iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
        />

        <StatCard
          title="Total Used"
          value={`${stats.used} days`}
          icon={<CalendarDays size={20} />}
          iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
        />

        <StatCard
          title="Total Remaining"
          value={`${stats.remaining} days`}
          icon={<CalendarDays size={20} />}
          iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />
      </div>

      {/* Filters */}
      <div
        className="
          rounded-2xl border p-4 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333] dark:bg-[#181818]
        "
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-[#98A2B3]
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search employee or leave type..."
              className="
                h-11 w-full rounded-xl border
                border-[#D0D5DD] bg-white
                pl-10 pr-4 text-sm outline-none
                transition
                focus:border-[#0066FF]
                focus:ring-2 focus:ring-[#0066FF]/10
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:placeholder:text-[#777777]
                dark:focus:border-[#1E90FF]
              "
            />
          </div>

          {/* Department */}
<div className="relative">
  <select
    value={departmentFilter}
    onChange={(event) => {
      setDepartmentFilter(event.target.value);
    }}
    className="
      h-11 w-full appearance-none
      rounded-xl border
      border-[#D0D5DD] bg-white
      px-4 pr-10 text-sm
      text-[#1A1A2E]
      outline-none
      focus:border-[#0066FF]
      focus:ring-2 focus:ring-[#0066FF]/10

      dark:border-[#3A3A3A]
      dark:bg-[#101010]
      dark:text-white
      dark:focus:border-[#1E90FF]
    "
  >
    <option
      value="all"
      className="bg-white text-[#1A1A2E] dark:bg-[#101010] dark:text-white"
    >
      All Departments
    </option>

    {departments.map((department) => (
      <option
        key={department.departmentId}
        value={department.departmentId}
        className="bg-white text-[#1A1A2E] dark:bg-[#101010] dark:text-white"
      >
        {department.name}
      </option>
    ))}
  </select>

  <ChevronDown
    size={18}
    className="
      pointer-events-none
      absolute right-3 top-1/2
      -translate-y-1/2
      text-[#667085]
      dark:text-[#B3B3B3]
    "
  />
</div>

          {/* Leave Type */}
          <div className="relative">
            <select
              value={leaveTypeFilter}
              onChange={(event) =>
                setLeaveTypeFilter(
                  event.target.value,
                )
              }
              className="
                h-11 w-full appearance-none
                rounded-xl border
                border-[#D0D5DD] bg-white
                px-4 pr-10 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
            >
              <option value="all">
                All Leave Types
              </option>

              {leaveTypes.map((leaveType) => (
                <option
                  key={leaveType.leaveTypeId}
                  value={leaveType.leaveTypeId}
                >
                  {leaveType.name}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-[#667085]
              "
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="
          rounded-2xl border shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        {/* Desktop table */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr
                className="
                  border-b
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#202020]
                "
              >
                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Employee
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Department
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Leave Type
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Allocated
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Used
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Remaining
                </th>

                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableLoading />
              ) : filteredRows.length === 0 ? (
                <TableEmpty />
              ) : (
                filteredRows.map((row) => (
                  <BalanceTableRow
                    key={`${row.employee.employeeId}-${row.leaveType.leaveTypeId}`}
                    row={row}
                    usagePercentage={getUsagePercentage(
                      row.used,
                      row.allocated,
                    )}
                    onView={() =>
                      setSelectedBalance(row)
                    }
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile / Tablet cards */}
        <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
          {loading ? (
            <MobileLoading />
          ) : filteredRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#D0D5DD] p-8 text-center dark:border-[#3A3A3A]">
              <CalendarDays
                size={30}
                className="mx-auto text-[#98A2B3]"
              />

              <p className="mt-3 text-sm font-medium">
                No leave balance records found.
              </p>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            filteredRows.map((row) => (
              <BalanceCard
                key={`${row.employee.employeeId}-${row.leaveType.leaveTypeId}`}
                row={row}
                usagePercentage={getUsagePercentage(
                  row.used,
                  row.allocated,
                )}
                onView={() =>
                  setSelectedBalance(row)
                }
              />
            ))
          )}
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-[#667085] dark:text-[#888888]">
          Showing {filteredRows.length} of{" "}
          {balanceRows.length} leave balance records
        </p>
      )}

      {/* View Modal */}
      {selectedBalance && (
        <BalanceDetailsModal
          row={selectedBalance}
          usagePercentage={getUsagePercentage(
            selectedBalance.used,
            selectedBalance.allocated,
          )}
          onClose={() =>
            setSelectedBalance(null)
          }
        />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT CARD */
/* -------------------------------------------------- */

function StatCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div
      className="
        rounded-2xl border p-5 shadow-sm
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#667085] dark:text-[#B3B3B3]">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* TABLE ROW */
/* -------------------------------------------------- */

function BalanceTableRow({
  row,
  usagePercentage,
  onView,
}: {
  row: BalanceRow;
  usagePercentage: number;
  onView: () => void;
}) {
  return (
    <tr
      className="
        border-b border-[#E1E5EA]
        last:border-b-0
        hover:bg-[#F8F9FA]
        dark:border-[#333333]
        dark:hover:bg-[#202020]
      "
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {row.employee.profileImage ? (
            <img
              src={row.employee.profileImage}
              alt={row.employee.fullName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="
                flex h-10 w-10 items-center
                justify-center rounded-full
                bg-[#EAF2FF]
                text-sm font-bold text-[#0066FF]
                dark:bg-[#10233F]
                dark:text-[#1E90FF]
              "
            >
              {row.employee.fullName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {row.employee.fullName}
            </p>

            <p className="text-xs text-[#667085] dark:text-[#888888]">
              {row.employee.employeeId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm">
        {row.departmentName}
      </td>

      <td className="px-5 py-4">
        <span
          className="
            inline-flex rounded-lg
            bg-[#EEF4FF] px-3 py-1.5
            text-xs font-semibold
            text-[#0066FF]
            dark:bg-[#10233F]
            dark:text-[#4D9AFF]
          "
        >
          {row.leaveType.name}
        </span>
      </td>

      <td className="px-5 py-4 text-center text-sm font-semibold">
        {row.allocated}
      </td>

      <td className="px-5 py-4 text-center text-sm font-semibold">
        {row.used}
      </td>

      <td className="px-5 py-4">
        <div className="min-w-[100px]">
          <div className="text-center text-sm font-bold">
            {row.remaining}
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
            <div
              className="h-full rounded-full bg-[#0066FF] dark:bg-[#1E90FF]"
              style={{
                width: `${Math.min(
                  100 - usagePercentage,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-center">
        <button
          type="button"
          onClick={onView}
          className="
            inline-flex h-9 w-9 items-center
            justify-center rounded-lg
            text-[#0066FF]
            transition hover:bg-[#EEF4FF]
            dark:text-[#1E90FF]
            dark:hover:bg-[#10233F]
          "
          title="View balance"
        >
          <Eye size={18} />
        </button>
      </td>
    </tr>
  );
}

/* -------------------------------------------------- */
/* MOBILE CARD */
/* -------------------------------------------------- */

function BalanceCard({
  row,
  usagePercentage,
  onView,
}: {
  row: BalanceRow;
  usagePercentage: number;
  onView: () => void;
}) {
  return (
    <div
      className="
        rounded-xl border p-4
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {row.employee.profileImage ? (
            <img
              src={row.employee.profileImage}
              alt={row.employee.fullName}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-full
                bg-[#EAF2FF]
                text-sm font-bold text-[#0066FF]
                dark:bg-[#10233F]
                dark:text-[#1E90FF]
              "
            >
              {row.employee.fullName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {row.employee.fullName}
            </p>

            <p className="truncate text-xs text-[#667085] dark:text-[#888888]">
              {row.employee.employeeId}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onView}
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-lg
            text-[#0066FF]
            hover:bg-[#EEF4FF]
            dark:text-[#1E90FF]
            dark:hover:bg-[#10233F]
          "
          title="View balance"
        >
          <Eye size={18} />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-lg bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#0066FF] dark:bg-[#10233F] dark:text-[#4D9AFF]">
          {row.leaveType.name}
        </span>

        <span className="rounded-lg bg-[#F2F4F7] px-2.5 py-1 text-xs text-[#667085] dark:bg-[#303030] dark:text-[#B3B3B3]">
          {row.departmentName}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <BalanceValue
          label="Allocated"
          value={row.allocated}
        />

        <BalanceValue
          label="Used"
          value={row.used}
        />

        <BalanceValue
          label="Remaining"
          value={row.remaining}
        />
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs text-[#667085] dark:text-[#888888]">
            Used
          </span>

          <span className="text-xs font-semibold">
            {usagePercentage}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
          <div
            className="h-full rounded-full bg-[#0066FF] dark:bg-[#1E90FF]"
            style={{
              width: `${usagePercentage}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* BALANCE VALUE */
/* -------------------------------------------------- */

function BalanceValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-xl border p-3 text-center
        border-[#E1E5EA]
        bg-[#F8F9FA]
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <p className="text-[11px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* VIEW MODAL */
/* -------------------------------------------------- */

function BalanceDetailsModal({
  row,
  usagePercentage,
  onClose,
}: {
  row: BalanceRow;
  usagePercentage: number;
  onClose: () => void;
}) {
  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50 p-4
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl border
          border-[#E1E5EA]
          bg-white p-5 shadow-2xl
          dark:border-[#333333]
          dark:bg-[#181818]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Leave Balance
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Balance Details
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex h-9 w-9 items-center
              justify-center rounded-lg
              text-[#667085]
              hover:bg-[#F2F4F7]
              dark:hover:bg-[#303030]
            "
          >
            <X size={19} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {row.employee.profileImage ? (
            <img
              src={row.employee.profileImage}
              alt={row.employee.fullName}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div
              className="
                flex h-12 w-12
                items-center justify-center
                rounded-full
                bg-[#EAF2FF]
                text-lg font-bold
                text-[#0066FF]
                dark:bg-[#10233F]
                dark:text-[#1E90FF]
              "
            >
              {row.employee.fullName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate font-semibold">
              {row.employee.fullName}
            </p>

            <p className="text-sm text-[#667085] dark:text-[#888888]">
              {row.employee.employeeId}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <DetailRow
            label="Department"
            value={row.departmentName}
          />

          <DetailRow
            label="Designation"
            value={row.employee.designation}
          />

          <DetailRow
            label="Leave Type"
            value={row.leaveType.name}
          />

          <DetailRow
            label="Annual Allocation"
            value={`${row.allocated} days`}
          />

          <DetailRow
            label="Used"
            value={`${row.used} days`}
          />

          <DetailRow
            label="Remaining"
            value={`${row.remaining} days`}
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-[#667085] dark:text-[#888888]">
              Leave Usage
            </span>

            <span className="text-sm font-bold">
              {usagePercentage}%
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
            <div
              className="h-full rounded-full bg-[#0066FF] dark:bg-[#1E90FF]"
              style={{
                width: `${usagePercentage}%`,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="
            mt-6 h-10 w-full rounded-xl
            bg-[#0066FF] px-4
            text-sm font-semibold text-white
            transition hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1878D1]
          "
        >
          Close
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* DETAIL ROW */
/* -------------------------------------------------- */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex items-center
        justify-between gap-4
        rounded-xl border px-4 py-3
        border-[#E1E5EA]
        bg-[#F8F9FA]
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <span className="text-sm text-[#667085] dark:text-[#999999]">
        {label}
      </span>

      <span className="max-w-[60%] truncate text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------- */
/* LOADING */
/* -------------------------------------------------- */

function TableLoading() {
  return (
    <tbody>
      <tr>
        <td
          colSpan={7}
          className="px-5 py-12 text-center"
        >
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

          <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
            Loading leave balances...
          </p>
        </td>
      </tr>
    </tbody>
  );
}

function TableEmpty() {
  return (
    <tbody>
      <tr>
        <td
          colSpan={7}
          className="px-5 py-12 text-center"
        >
          <CalendarDays
            size={32}
            className="mx-auto text-[#98A2B3]"
          />

          <p className="mt-3 text-sm font-semibold">
            No leave balance records found
          </p>

          <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
            Try changing your search or filters.
          </p>
        </td>
      </tr>
    </tbody>
  );
}

function MobileLoading() {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

      <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
        Loading leave balances...
      </p>
    </div>
  );
}