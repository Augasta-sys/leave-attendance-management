import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { api } from "../../services/api";

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Late"
  | "On Leave"
  | "Holiday"
  | "Week Off";

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
  employmentStatus?: string;
  profileImage?: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workingHours?: string | number;
  status: AttendanceStatus;
  remarks?: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  daysAllowed?: number;
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
  status: LeaveStatus;
  rejectionReason?: string;
}

interface EmployeeReport {
  employee: Employee;
  departmentName: string;
  totalAttendance: number;
  present: number;
  absent: number;
  halfDay: number;
  late: number;
  onLeave: number;
  attendancePercentage: number;
  leaveDays: number;
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
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (end.getTime() - start.getTime()) /
        (1000 * 60 * 60 * 24),
    ) + 1,
  );
}

function getLeaveDays(request: LeaveRequest) {
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

function formatDate(date: string) {
  if (!date) return "-";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function downloadCSV(
  filename: string,
  rows: string[][],
) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          const escaped = String(value).replace(
            /"/g,
            '""',
          );

          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export default function Reports() {
  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [departments, setDepartments] = useState<
    Department[]
  >([]);

  const [attendance, setAttendance] = useState<
    Attendance[]
  >([]);

  const [leaveRequests, setLeaveRequests] = useState<
    LeaveRequest[]
  >([]);

  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);

  const [activeReport, setActiveReport] = useState<
    "attendance" | "leave"
  >("attendance");

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const [
          employeesResponse,
          departmentsResponse,
          attendanceResponse,
          leaveRequestsResponse,
          leaveTypesResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
          api.get<Attendance[]>("/attendance"),
          api.get<LeaveRequest[]>("/leaveRequests"),
          api.get<LeaveType[]>("/leaveTypes"),
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

        setAttendance(
          Array.isArray(attendanceResponse.data)
            ? attendanceResponse.data
            : [],
        );

        setLeaveRequests(
          Array.isArray(leaveRequestsResponse.data)
            ? leaveRequestsResponse.data
            : [],
        );

        setLeaveTypes(
          Array.isArray(leaveTypesResponse.data)
            ? leaveTypesResponse.data
            : [],
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load reports:",
          err,
        );

        setError(
          "Unable to load report data. Please make sure JSON Server is running.",
        );

        setDepartments(DEFAULT_DEPARTMENTS);
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

  const filteredAttendance = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return attendance.filter((record) => {
      const employee = employees.find(
        (item) =>
          item.employeeId === record.employeeId ||
          item.id === record.employeeId,
      );

      const employeeName =
        employee?.fullName?.toLowerCase() || "";

      const employeeId =
        employee?.employeeId?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        employee?.departmentId ===
          departmentFilter ||
        getDepartmentName(
          employee?.departmentId || "",
          departments,
        ) === departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      const matchesFromDate =
        !fromDate || record.date >= fromDate;

      const matchesToDate =
        !toDate || record.date <= toDate;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    attendance,
    employees,
    departments,
    search,
    departmentFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const filteredLeaves = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return leaveRequests.filter((request) => {
      const employee = employees.find(
        (item) =>
          item.employeeId === request.employeeId ||
          item.id === request.employeeId,
      );

      const employeeName =
        employee?.fullName?.toLowerCase() || "";

      const employeeId =
        employee?.employeeId?.toLowerCase() || "";

      const leaveType = leaveTypes.find(
        (item) =>
          item.leaveTypeId ===
            request.leaveTypeId ||
          item.id === request.leaveTypeId,
      );

      const leaveTypeName =
        leaveType?.name?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        employeeName.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        leaveTypeName.includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        employee?.departmentId ===
          departmentFilter ||
        getDepartmentName(
          employee?.departmentId || "",
          departments,
        ) === departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        request.status === statusFilter;

      const matchesFromDate =
        !fromDate ||
        request.endDate >= fromDate;

      const matchesToDate =
        !toDate ||
        request.startDate <= toDate;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus &&
        matchesFromDate &&
        matchesToDate
      );
    });
  }, [
    leaveRequests,
    employees,
    departments,
    leaveTypes,
    search,
    departmentFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const attendanceStats = useMemo(() => {
    const records = filteredAttendance;

    const present = records.filter(
      (item) => item.status === "Present",
    ).length;

    const absent = records.filter(
      (item) => item.status === "Absent",
    ).length;

    const halfDay = records.filter(
      (item) => item.status === "Half Day",
    ).length;

    const late = records.filter(
      (item) => item.status === "Late",
    ).length;

    const onLeave = records.filter(
      (item) => item.status === "On Leave",
    ).length;

    const workingRecords =
      present + absent + halfDay + late;

    const percentage =
      workingRecords > 0
        ? Math.round(
            ((present + late) /
              workingRecords) *
              100,
          )
        : 0;

    return {
      total: records.length,
      present,
      absent,
      halfDay,
      late,
      onLeave,
      percentage,
    };
  }, [filteredAttendance]);

  const leaveStats = useMemo(() => {
    const requests = filteredLeaves;

    const approved = requests.filter(
      (item) => item.status === "Approved",
    );

    const pending = requests.filter(
      (item) => item.status === "Pending",
    );

    const rejected = requests.filter(
      (item) => item.status === "Rejected",
    );

    const cancelled = requests.filter(
      (item) => item.status === "Cancelled",
    );

    const approvedDays = approved.reduce(
      (total, request) =>
        total + getLeaveDays(request),
      0,
    );

    return {
      total: requests.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      cancelled: cancelled.length,
      approvedDays,
    };
  }, [filteredLeaves]);

  const employeeReports = useMemo<
    EmployeeReport[]
  >(() => {
    return employees
      .map((employee) => {
        const records = filteredAttendance.filter(
          (record) =>
            record.employeeId ===
              employee.employeeId ||
            record.employeeId === employee.id,
        );

        const employeeLeaves =
          filteredLeaves.filter(
            (request) =>
              request.employeeId ===
                employee.employeeId ||
              request.employeeId === employee.id,
          );

        const present = records.filter(
          (item) => item.status === "Present",
        ).length;

        const absent = records.filter(
          (item) => item.status === "Absent",
        ).length;

        const halfDay = records.filter(
          (item) => item.status === "Half Day",
        ).length;

        const late = records.filter(
          (item) => item.status === "Late",
        ).length;

        const onLeave = records.filter(
          (item) => item.status === "On Leave",
        ).length;

        const leaveDays = employeeLeaves
          .filter(
            (request) =>
              request.status === "Approved",
          )
          .reduce(
            (total, request) =>
              total + getLeaveDays(request),
            0,
          );

        const workingRecords =
          present + absent + halfDay + late;

        const attendancePercentage =
          workingRecords > 0
            ? Math.round(
                ((present + late) /
                  workingRecords) *
                  100,
              )
            : 0;

        return {
          employee,
          departmentName: getDepartmentName(
            employee.departmentId,
            departments,
          ),
          totalAttendance: records.length,
          present,
          absent,
          halfDay,
          late,
          onLeave,
          attendancePercentage,
          leaveDays,
        };
      })
      .filter((report) => {
        const value = search
          .trim()
          .toLowerCase();

        if (!value) return true;

        return (
          report.employee.fullName
            .toLowerCase()
            .includes(value) ||
          report.employee.employeeId
            .toLowerCase()
            .includes(value)
        );
      });
  }, [
    employees,
    filteredAttendance,
    filteredLeaves,
    departments,
    search,
  ]);

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  const handleExportAttendance = () => {
    const rows: string[][] = [
      [
        "Employee ID",
        "Employee Name",
        "Department",
        "Date",
        "Check In",
        "Check Out",
        "Status",
        "Working Hours",
        "Remarks",
      ],
    ];

    filteredAttendance.forEach((record) => {
      const employee = employees.find(
        (item) =>
          item.employeeId === record.employeeId ||
          item.id === record.employeeId,
      );

      rows.push([
        employee?.employeeId || record.employeeId,
        employee?.fullName || "Unknown",
        getDepartmentName(
          employee?.departmentId || "",
          departments,
        ),
        record.date,
        record.checkIn || "-",
        record.checkOut || "-",
        record.status,
        String(record.workingHours || "-"),
        record.remarks || "-",
      ]);
    });

    downloadCSV(
      "attendance-report.csv",
      rows,
    );
  };

  const handleExportLeave = () => {
    const rows: string[][] = [
      [
        "Employee ID",
        "Employee Name",
        "Department",
        "Leave Type",
        "Start Date",
        "End Date",
        "Days",
        "Status",
        "Applied Date",
        "Reason",
      ],
    ];

    filteredLeaves.forEach((request) => {
      const employee = employees.find(
        (item) =>
          item.employeeId === request.employeeId ||
          item.id === request.employeeId,
      );

      const leaveType = leaveTypes.find(
        (item) =>
          item.leaveTypeId ===
            request.leaveTypeId ||
          item.id === request.leaveTypeId,
      );

      rows.push([
        employee?.employeeId ||
          request.employeeId,
        employee?.fullName || "Unknown",
        getDepartmentName(
          employee?.departmentId || "",
          departments,
        ),
        leaveType?.name || request.leaveTypeId,
        request.startDate,
        request.endDate,
        String(getLeaveDays(request)),
        request.status,
        request.appliedDate,
        request.reason,
      ]);
    });

    downloadCSV(
      "leave-report.csv",
      rows,
    );
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Reports
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
            Generate attendance and leave management
            reports.
          </p>
        </div>

        <button
          type="button"
          onClick={
            activeReport === "attendance"
              ? handleExportAttendance
              : handleExportLeave
          }
          className="
            inline-flex h-10 items-center
            justify-center gap-2 rounded-xl
            bg-[#0066FF] px-4
            text-sm font-semibold text-white
            transition hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1878D1]
          "
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* REPORT TABS */}
      <div
        className="
          flex w-full max-w-md
          rounded-xl border p-1
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <button
          type="button"
          onClick={() => {
            setActiveReport("attendance");
            setStatusFilter("all");
          }}
          className={`
            flex-1 rounded-lg px-4 py-2.5
            text-sm font-semibold transition
            ${
              activeReport === "attendance"
                ? "bg-[#0066FF] text-white dark:bg-[#1E90FF]"
                : "text-[#667085] hover:bg-[#F2F4F7] dark:text-[#B3B3B3] dark:hover:bg-[#252525]"
            }
          `}
        >
          Attendance Report
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveReport("leave");
            setStatusFilter("all");
          }}
          className={`
            flex-1 rounded-lg px-4 py-2.5
            text-sm font-semibold transition
            ${
              activeReport === "leave"
                ? "bg-[#0066FF] text-white dark:bg-[#1E90FF]"
                : "text-[#667085] hover:bg-[#F2F4F7] dark:text-[#B3B3B3] dark:hover:bg-[#252525]"
            }
          `}
        >
          Leave Report
        </button>
      </div>

      {/* ATTENDANCE STATS */}
      {activeReport === "attendance" && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">
          <ReportStat
            title="Total Records"
            value={attendanceStats.total}
            icon={<FileText size={19} />}
            iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
          />

          <ReportStat
            title="Present"
            value={attendanceStats.present}
            icon={<CheckCircle2 size={19} />}
            iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
          />

          <ReportStat
            title="Absent"
            value={attendanceStats.absent}
            icon={<XCircle size={19} />}
            iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          />

          <ReportStat
            title="Half Day"
            value={attendanceStats.halfDay}
            icon={<Clock3 size={19} />}
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
          />

          <ReportStat
            title="Late"
            value={attendanceStats.late}
            icon={<Clock3 size={19} />}
            iconClass="bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400"
          />

          <ReportStat
            title="Attendance"
            value={`${attendanceStats.percentage}%`}
            icon={<Users size={19} />}
            iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
          />
        </div>
      )}

      {/* LEAVE STATS */}
      {activeReport === "leave" && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
          <ReportStat
            title="Total Requests"
            value={leaveStats.total}
            icon={<FileText size={19} />}
            iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
          />

          <ReportStat
            title="Approved"
            value={leaveStats.approved}
            icon={<CheckCircle2 size={19} />}
            iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
          />

          <ReportStat
            title="Pending"
            value={leaveStats.pending}
            icon={<Clock3 size={19} />}
            iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
          />

          <ReportStat
            title="Rejected"
            value={leaveStats.rejected}
            icon={<XCircle size={19} />}
            iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
          />

          <ReportStat
            title="Cancelled"
            value={leaveStats.cancelled}
            icon={<XCircle size={19} />}
            iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
          />

          <ReportStat
            title="Approved Days"
            value={leaveStats.approvedDays}
            icon={<CalendarDays size={19} />}
            iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
          />
        </div>
      )}

      {/* FILTERS */}
      <div
        className="
          rounded-2xl border p-4 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {/* SEARCH */}
          <div className="relative xl:col-span-2">
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
              placeholder={
                activeReport === "attendance"
                  ? "Search employee..."
                  : "Search employee or leave type..."
              }
              className="
                h-11 w-full rounded-xl border
                border-[#D0D5DD] bg-white
                pl-10 pr-4 text-sm
                text-[#1A1A2E] outline-none
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

        {/* DEPARTMENT */}
<div className="relative">
  <select
    value={departmentFilter}
    onChange={(event) => {
      setDepartmentFilter(event.target.value);
    }}
    className="
      h-11 w-full appearance-none
      rounded-xl border
      border-[#D0D5DD]
      bg-white
      px-4 pr-10
      text-sm
      font-medium
      text-[#1A1A2E]
      outline-none
      transition
      focus:border-[#0066FF]
      focus:ring-2
      focus:ring-[#0066FF]/10

      dark:border-[#3A3A3A]
      dark:bg-[#101010]
      dark:text-white
      dark:focus:border-[#1E90FF]
      dark:focus:ring-[#1E90FF]/10
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

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value,
              )
            }
            className="
              h-11 w-full rounded-xl border
              border-[#D0D5DD] bg-white
              px-3 text-sm outline-none
              focus:border-[#0066FF]
              dark:border-[#3A3A3A]
              dark:bg-[#101010]
              dark:text-white
              dark:focus:border-[#1E90FF]
            "
          >
            <option value="all">
              All Status
            </option>

            {activeReport === "attendance" ? (
              <>
                <option value="Present">
                  Present
                </option>
                <option value="Absent">
                  Absent
                </option>
                <option value="Half Day">
                  Half Day
                </option>
                <option value="Late">
                  Late
                </option>
                <option value="On Leave">
                  On Leave
                </option>
                <option value="Holiday">
                  Holiday
                </option>
                <option value="Week Off">
                  Week Off
                </option>
              </>
            ) : (
              <>
                <option value="Pending">
                  Pending
                </option>
                <option value="Approved">
                  Approved
                </option>
                <option value="Rejected">
                  Rejected
                </option>
                <option value="Cancelled">
                  Cancelled
                </option>
              </>
            )}
          </select>

          {/* FROM DATE */}
          <div className="grid grid-cols-2 gap-3 md:col-span-2 xl:col-span-5 xl:grid-cols-[1fr_1fr_auto]">
            <input
              type="date"
              value={fromDate}
              onChange={(event) =>
                setFromDate(event.target.value)
              }
              className="
                h-11 rounded-xl border
                border-[#D0D5DD] bg-white
                px-3 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
              title="From date"
            />

            <input
              type="date"
              value={toDate}
              onChange={(event) =>
                setToDate(event.target.value)
              }
              className="
                h-11 rounded-xl border
                border-[#D0D5DD] bg-white
                px-3 text-sm outline-none
                focus:border-[#0066FF]
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:focus:border-[#1E90FF]
              "
              title="To date"
            />

            <button
              type="button"
              onClick={clearFilters}
              className="
                h-11 rounded-xl border
                border-[#D0D5DD] px-4
                text-sm font-semibold
                text-[#667085]
                transition hover:bg-[#F2F4F7]
                dark:border-[#3A3A3A]
                dark:text-[#B3B3B3]
                dark:hover:bg-[#303030]
              "
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* REPORT CONTENT */}
      {activeReport === "attendance" ? (
        <AttendanceReportTable
          reports={employeeReports}
          records={filteredAttendance}
          loading={loading}
          formatDate={formatDate}
        />
      ) : (
        <LeaveReportTable
          requests={filteredLeaves}
          employees={employees}
          departments={departments}
          leaveTypes={leaveTypes}
          loading={loading}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT CARD */
/* -------------------------------------------------- */

function ReportStat({
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
        rounded-2xl border p-4 shadow-sm
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs text-[#667085] dark:text-[#B3B3B3]">
            {title}
          </p>

          <p className="mt-2 text-xl font-bold sm:text-2xl">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* ATTENDANCE REPORT */
/* -------------------------------------------------- */

function AttendanceReportTable({
  reports,
  records,
  loading,
  formatDate,
}: {
  reports: EmployeeReport[];
  records: Attendance[];
  loading: boolean;
  formatDate: (date: string) => string;
}) {
  return (
    <div
      className="
        rounded-2xl border shadow-sm
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex flex-col gap-1 border-b border-[#E1E5EA] p-5 dark:border-[#333333] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Employee Attendance Summary
          </h2>

          <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
            Attendance performance by employee.
          </p>
        </div>

        <span className="text-xs text-[#667085] dark:text-[#888888]">
          {records.length} attendance records
        </span>
      </div>

      {loading ? (
        <LoadingState />
      ) : reports.length === 0 ? (
        <EmptyState message="No attendance report data found." />
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] dark:border-[#333333] dark:bg-[#202020]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Department
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Present
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Absent
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Half Day
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Late
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    On Leave
                  </th>

                  <th className="px-5 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.employee.employeeId}
                    className="border-b border-[#E1E5EA] last:border-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold">
                        {report.employee.fullName}
                      </p>

                      <p className="text-xs text-[#667085] dark:text-[#888888]">
                        {report.employee.employeeId}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm">
                      {report.departmentName}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-green-600 dark:text-green-400">
                      {report.present}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-red-600 dark:text-red-400">
                      {report.absent}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold">
                      {report.halfDay}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {report.late}
                    </td>

                    <td className="px-4 py-4 text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      {report.onLeave}
                    </td>

                    <td className="px-5 py-4">
                      <div className="mx-auto max-w-[110px]">
                        <div className="text-center text-sm font-bold">
                          {report.attendancePercentage}%
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5E7EB] dark:bg-[#333333]">
                          <div
                            className="h-full rounded-full bg-[#0066FF] dark:bg-[#1E90FF]"
                            style={{
                              width: `${report.attendancePercentage}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {reports.map((report) => (
              <div
                key={report.employee.employeeId}
                className="rounded-xl border border-[#E1E5EA] p-4 dark:border-[#333333] dark:bg-[#202020]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {report.employee.fullName}
                    </p>

                    <p className="text-xs text-[#667085] dark:text-[#888888]">
                      {report.employee.employeeId}
                    </p>
                  </div>

                  <span className="rounded-lg bg-[#EEF4FF] px-2.5 py-1 text-xs font-bold text-[#0066FF] dark:bg-[#10233F] dark:text-[#4D9AFF]">
                    {report.attendancePercentage}%
                  </span>
                </div>

                <p className="mt-2 text-xs text-[#667085] dark:text-[#999999]">
                  {report.departmentName}
                </p>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  <MiniValue
                    label="Present"
                    value={report.present}
                  />

                  <MiniValue
                    label="Absent"
                    value={report.absent}
                  />

                  <MiniValue
                    label="Half Day"
                    value={report.halfDay}
                  />

                  <MiniValue
                    label="Late"
                    value={report.late}
                  />

                  <MiniValue
                    label="Leave"
                    value={report.onLeave}
                  />

                  <MiniValue
                    label="Total"
                    value={report.totalAttendance}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading &&
        records.length > 0 &&
        records.length <= 10 && (
          <div className="border-t border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
            <p className="text-xs text-[#667085] dark:text-[#888888]">
              Latest records
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {records.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  className="rounded-lg bg-[#F8F9FA] px-3 py-2 dark:bg-[#202020]"
                >
                  <p className="text-xs font-semibold">
                    {record.status}
                  </p>

                  <p className="mt-1 text-[11px] text-[#667085] dark:text-[#888888]">
                    {formatDate(record.date)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
    </div>
  );
}

/* -------------------------------------------------- */
/* LEAVE REPORT */
/* -------------------------------------------------- */

function LeaveReportTable({
  requests,
  employees,
  departments,
  leaveTypes,
  loading,
}: {
  requests: LeaveRequest[];
  employees: Employee[];
  departments: Department[];
  leaveTypes: LeaveType[];
  loading: boolean;
}) {
  return (
    <div
      className="
        rounded-2xl border shadow-sm
        border-[#E1E5EA] bg-white
        dark:border-[#333333]
        dark:bg-[#181818]
      "
    >
      <div className="flex flex-col gap-1 border-b border-[#E1E5EA] p-5 dark:border-[#333333] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">
            Leave Request Report
          </h2>

          <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
            Employee leave request and approval details.
          </p>
        </div>

        <span className="text-xs text-[#667085] dark:text-[#888888]">
          {requests.length} leave requests
        </span>
      </div>

      {loading ? (
        <LoadingState />
      ) : requests.length === 0 ? (
        <EmptyState message="No leave report data found." />
      ) : (
        <>
          {/* DESKTOP */}
          <div className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] dark:border-[#333333] dark:bg-[#202020]">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Employee
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Department
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Leave Type
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Period
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Days
                  </th>

                  <th className="px-4 py-4 text-center text-xs font-semibold uppercase text-[#667085] dark:text-[#B3B3B3]">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => {
                  const employee =
                    employees.find(
                      (item) =>
                        item.employeeId ===
                          request.employeeId ||
                        item.id ===
                          request.employeeId,
                    );

                  const leaveType =
                    leaveTypes.find(
                      (item) =>
                        item.leaveTypeId ===
                          request.leaveTypeId ||
                        item.id ===
                          request.leaveTypeId,
                    );

                  return (
                    <tr
                      key={request.id}
                      className="border-b border-[#E1E5EA] last:border-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          {employee?.fullName ||
                            "Unknown Employee"}
                        </p>

                        <p className="text-xs text-[#667085] dark:text-[#888888]">
                          {employee?.employeeId ||
                            request.employeeId}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {getDepartmentName(
                          employee?.departmentId ||
                            "",
                          departments,
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-[#EEF4FF] px-2.5 py-1.5 text-xs font-semibold text-[#0066FF] dark:bg-[#10233F] dark:text-[#4D9AFF]">
                          {leaveType?.name ||
                            request.leaveTypeId}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm">
                          {formatDate(
                            request.startDate,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
                          to{" "}
                          {formatDate(
                            request.endDate,
                          )}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center text-sm font-semibold">
                        {getLeaveDays(request)}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <LeaveStatusBadge
                          status={request.status}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE / TABLET */}
          <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
            {requests.map((request) => {
              const employee =
                employees.find(
                  (item) =>
                    item.employeeId ===
                      request.employeeId ||
                    item.id === request.employeeId,
                );

              const leaveType =
                leaveTypes.find(
                  (item) =>
                    item.leaveTypeId ===
                      request.leaveTypeId ||
                    item.id === request.leaveTypeId,
                );

              return (
                <div
                  key={request.id}
                  className="rounded-xl border border-[#E1E5EA] p-4 dark:border-[#333333] dark:bg-[#202020]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {employee?.fullName ||
                          "Unknown Employee"}
                      </p>

                      <p className="text-xs text-[#667085] dark:text-[#888888]">
                        {employee?.employeeId ||
                          request.employeeId}
                      </p>
                    </div>

                    <LeaveStatusBadge
                      status={request.status}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <DetailValue
                      label="Department"
                      value={getDepartmentName(
                        employee?.departmentId ||
                          "",
                        departments,
                      )}
                    />

                    <DetailValue
                      label="Leave Type"
                      value={
                        leaveType?.name ||
                        request.leaveTypeId
                      }
                    />

                    <DetailValue
                      label="Start Date"
                      value={formatDate(
                        request.startDate,
                      )}
                    />

                    <DetailValue
                      label="End Date"
                      value={formatDate(
                        request.endDate,
                      )}
                    />

                    <DetailValue
                      label="Days"
                      value={String(
                        getLeaveDays(request),
                      )}
                    />

                    <DetailValue
                      label="Applied"
                      value={formatDate(
                        request.appliedDate,
                      )}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* HELPERS */
/* -------------------------------------------------- */

function MiniValue({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-[#F8F9FA] p-2 text-center dark:bg-[#181818]">
      <p className="text-[10px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function DetailValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-[#F8F9FA] p-3 dark:bg-[#181818]">
      <p className="text-[10px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-semibold">
        {value}
      </p>
    </div>
  );
}

function LeaveStatusBadge({
  status,
}: {
  status: LeaveStatus;
}) {
  const classes: Record<LeaveStatus, string> = {
    Pending:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    Approved:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    Rejected:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    Cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex rounded-lg px-2.5 py-1.5 text-xs font-semibold ${classes[status]}`}
    >
      {status}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

      <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
        Loading report...
      </p>
    </div>
  );
}

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <FileText
        size={34}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        {message}
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        Try changing the filters.
      </p>
    </div>
  );
}