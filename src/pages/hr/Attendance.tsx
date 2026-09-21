import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Search,
  Users,
  X,
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

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId?: string;
  designation?: string;
  managerId?: string | null;
  joiningDate?: string;
  employmentStatus?: string;
  profileImage?: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface AttendanceForm {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  remarks: string;
}

const ATTENDANCE_STATUSES: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "On Leave",
  "Holiday",
  "Week Off",
];

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

const EMPTY_FORM: AttendanceForm = {
  employeeId: "",
  date: "",
  checkIn: "",
  checkOut: "",
  status: "Present",
  remarks: "",
};

function formatDate(date: string): string {
  if (!date) {
    return "-";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEmployee(
  employeeId: string,
  employees: Employee[],
): Employee | undefined {
  return employees.find(
    (employee) =>
      employee.employeeId === employeeId ||
      employee.id === employeeId,
  );
}

function getDepartmentName(
  departmentId: string | undefined,
  departments: Department[],
): string {
  if (!departmentId) {
    return "Not Assigned";
  }

  const department = departments.find(
    (item) =>
      item.departmentId === departmentId ||
      item.id === departmentId ||
      item.name === departmentId,
  );

  return department?.name || departmentId;
}

function calculateWorkingHours(
  checkIn: string,
  checkOut: string,
): string {
  if (!checkIn || !checkOut) {
    return "";
  }

  const [inHours, inMinutes] = checkIn
    .split(":")
    .map(Number);

  const [outHours, outMinutes] = checkOut
    .split(":")
    .map(Number);

  if (
    Number.isNaN(inHours) ||
    Number.isNaN(inMinutes) ||
    Number.isNaN(outHours) ||
    Number.isNaN(outMinutes)
  ) {
    return "";
  }

  const startMinutes =
    inHours * 60 + inMinutes;

  const endMinutes =
    outHours * 60 + outMinutes;

  const difference =
    endMinutes - startMinutes;

  if (difference <= 0) {
    return "";
  }

  const hours = Math.floor(difference / 60);
  const minutes = difference % 60;

  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}

function getStatusClass(
  status: AttendanceStatus,
): string {
  const classes: Record<
    AttendanceStatus,
    string
  > = {
    Present:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",

    Absent:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",

    "Half Day":
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",

    Late:
      "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/40 dark:text-yellow-400",

    "On Leave":
      "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",

    Holiday:
      "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",

    "Week Off":
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return classes[status];
}

function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function Attendance() {
  const [attendance, setAttendance] =
    useState<Attendance[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>(
      DEFAULT_DEPARTMENTS,
    );

  const [search, setSearch] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState<"view" | "edit">("view");

  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);

  const [form, setForm] =
    useState<AttendanceForm>(EMPTY_FORM);

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        if (!cancelled) {
          setLoading(true);
          setError("");
        }

        const [
          attendanceResponse,
          employeesResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Attendance[]>("/attendance"),
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
        ]);

        if (cancelled) {
          return;
        }

        setAttendance(
          Array.isArray(attendanceResponse.data)
            ? attendanceResponse.data
            : [],
        );

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
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load HR attendance:",
          err,
        );

        setError(
          "Unable to load attendance data. Please make sure JSON Server is running.",
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

  /* Lock background scrolling while modal is open */

  useEffect(() => {
    if (!showModal) {
      document.body.style.overflow = "";
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [showModal]);

  const filteredAttendance = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return attendance.filter((record) => {
      const employee = getEmployee(
        record.employeeId,
        employees,
      );

      const matchesSearch =
        !searchValue ||
        employee?.fullName
          ?.toLowerCase()
          .includes(searchValue) ||
        employee?.employeeId
          ?.toLowerCase()
          .includes(searchValue) ||
        employee?.email
          ?.toLowerCase()
          .includes(searchValue) ||
        record.status
          .toLowerCase()
          .includes(searchValue);

      const matchesDate =
        !dateFilter ||
        record.date === dateFilter;

      const matchesStatus =
        statusFilter === "all" ||
        record.status === statusFilter;

      return (
        matchesSearch &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    attendance,
    employees,
    search,
    dateFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: attendance.length,

      present: attendance.filter(
        (record) =>
          record.status === "Present",
      ).length,

      late: attendance.filter(
        (record) =>
          record.status === "Late",
      ).length,

      absent: attendance.filter(
        (record) =>
          record.status === "Absent",
      ).length,

      halfDay: attendance.filter(
        (record) =>
          record.status === "Half Day",
      ).length,

      onLeave: attendance.filter(
        (record) =>
          record.status === "On Leave",
      ).length,
    };
  }, [attendance]);

  const clearFilters = () => {
    setSearch("");
    setDateFilter("");
    setStatusFilter("all");
  };

  const openViewModal = (
    record: Attendance,
  ) => {
    setModalMode("view");
    setSelectedAttendance(record);
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (
    record: Attendance,
  ) => {
    setModalMode("edit");
    setSelectedAttendance(record);

    setForm({
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      status: record.status,
      remarks: record.remarks || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setSelectedAttendance(null);
    setFormError("");
  };

  const validateForm = (): string => {
    if (!form.employeeId) {
      return "Please select an employee.";
    }

    if (!form.date) {
      return "Attendance date is required.";
    }

    if (!form.status) {
      return "Please select attendance status.";
    }

    const requiresTime =
      form.status === "Present" ||
      form.status === "Late" ||
      form.status === "Half Day";

    if (requiresTime) {
      if (!form.checkIn) {
        return "Check-in time is required.";
      }

      if (!form.checkOut) {
        return "Check-out time is required.";
      }

      const [inHours, inMinutes] =
        form.checkIn.split(":").map(Number);

      const [outHours, outMinutes] =
        form.checkOut.split(":").map(Number);

      const start =
        inHours * 60 + inMinutes;

      const end =
        outHours * 60 + outMinutes;

      if (end <= start) {
        return "Check-out time must be later than check-in time.";
      }
    }

    return "";
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (
      !selectedAttendance ||
      modalMode !== "edit"
    ) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const workingHours =
        calculateWorkingHours(
          form.checkIn,
          form.checkOut,
        );

      const payload: Attendance = {
        ...selectedAttendance,
        employeeId: form.employeeId,
        date: form.date,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        workingHours,
        status: form.status,
        remarks: form.remarks.trim(),
      };

      const response =
        await api.put<Attendance>(
          `/attendance/${selectedAttendance.id}`,
          payload,
        );

      setAttendance((current) =>
        current.map((record) =>
          record.id === selectedAttendance.id
            ? response.data
            : record,
        ),
      );

      setShowModal(false);
      setSelectedAttendance(null);
      setFormError("");
    } catch (err) {
      console.error(
        "Failed to update attendance:",
        err,
      );

      setFormError(
        "Unable to update attendance. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="
        min-h-full w-full space-y-6
        bg-[#F8F9FA]
        text-[#1A1A2E]
        dark:bg-[#0D0D0D]
        dark:text-white
      "
    >
      {/* HEADER */}

      <div>
        <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
          Human Resources
        </p>

        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Attendance
        </h1>

        <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
          View and correct employee attendance
          records.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            rounded-xl border
            border-red-200 bg-red-50
            px-4 py-3 text-sm
            text-red-600
            dark:border-red-900
            dark:bg-red-950/30
            dark:text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* STATS */}

      <div
        className="
          grid grid-cols-2 gap-4
          sm:grid-cols-3
          xl:grid-cols-6
        "
      >
        <AttendanceStat
          title="Total Records"
          value={stats.total}
          icon={<FileText size={19} />}
          iconClass="
            bg-blue-50 text-[#0066FF]
            dark:bg-blue-950/40
            dark:text-[#1E90FF]
          "
        />

        <AttendanceStat
          title="Present"
          value={stats.present}
          icon={<CheckCircle2 size={19} />}
          iconClass="
            bg-green-50 text-green-600
            dark:bg-green-950/40
            dark:text-green-400
          "
        />

        <AttendanceStat
          title="Late"
          value={stats.late}
          icon={<Clock3 size={19} />}
          iconClass="
            bg-yellow-50 text-yellow-600
            dark:bg-yellow-950/40
            dark:text-yellow-400
          "
        />

        <AttendanceStat
          title="Absent"
          value={stats.absent}
          icon={<X size={19} />}
          iconClass="
            bg-red-50 text-red-600
            dark:bg-red-950/40
            dark:text-red-400
          "
        />

        <AttendanceStat
          title="Half Day"
          value={stats.halfDay}
          icon={<Clock3 size={19} />}
          iconClass="
            bg-orange-50 text-orange-600
            dark:bg-orange-950/40
            dark:text-orange-400
          "
        />

        <AttendanceStat
          title="On Leave"
          value={stats.onLeave}
          icon={<CalendarDays size={19} />}
          iconClass="
            bg-purple-50 text-purple-600
            dark:bg-purple-950/40
            dark:text-purple-400
          "
        />
      </div>

      {/* FILTERS */}

      <div
        className="
          rounded-2xl border p-4 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div
          className="
            grid grid-cols-1 gap-3
            md:grid-cols-2
            xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]
          "
        >
          {/* SEARCH */}

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
              placeholder="Search employee..."
              className="
                h-11 w-full rounded-xl border
                border-[#D0D5DD] bg-white
                pl-10 pr-4 text-sm
                text-[#1A1A2E] outline-none
                focus:border-[#0066FF]
                focus:ring-2
                focus:ring-[#0066FF]/10
                dark:border-[#3A3A3A]
                dark:bg-[#101010]
                dark:text-white
                dark:placeholder:text-[#777777]
                dark:focus:border-[#1E90FF]
              "
            />
          </div>

          {/* DATE */}

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="
              h-11 w-full rounded-xl border
              border-[#D0D5DD] bg-white
              px-4 text-sm
              text-[#1A1A2E] outline-none
              focus:border-[#0066FF]
              dark:border-[#3A3A3A]
              dark:bg-[#101010]
              dark:text-white
              dark:[color-scheme:dark]
            "
          />

          {/* STATUS */}

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="
                h-11 w-full appearance-none
                rounded-xl border
                border-[#D0D5DD] bg-white
                px-4 pr-10 text-sm
                text-[#1A1A2E] outline-none
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

              {ATTENDANCE_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                ),
              )}
            </select>

            <ChevronDown
              size={17}
              className="
                pointer-events-none
                absolute right-3 top-1/2
                -translate-y-1/2
                text-[#667085]
                dark:text-[#B3B3B3]
              "
            />
          </div>

          {/* CLEAR */}

          <button
            type="button"
            onClick={clearFilters}
            className="
              h-11 rounded-xl border
              border-[#D0D5DD] px-4
              text-sm font-semibold
              text-[#667085]
              transition
              hover:bg-[#F2F4F7]
              dark:border-[#3A3A3A]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            Clear
          </button>
        </div>
      </div>

      {/* TABLE */}

      <div
        className="
          overflow-hidden rounded-2xl border shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div
          className="
            flex items-center justify-between
            border-b border-[#E1E5EA]
            p-5
            dark:border-[#333333]
          "
        >
          <div>
            <h2 className="text-lg font-bold">
              Attendance Records
            </h2>

            <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
              Showing {filteredAttendance.length} of{" "}
              {attendance.length} records
            </p>
          </div>

          <div
            className="
              hidden h-10 w-10
              items-center justify-center
              rounded-xl
              bg-[#EAF2FF]
              text-[#0066FF]
              sm:flex
              dark:bg-[#10233F]
              dark:text-[#1E90FF]
            "
          >
            <Users size={19} />
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredAttendance.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr
                    className="
                      border-b border-[#E1E5EA]
                      bg-[#F8F9FA]
                      dark:border-[#333333]
                      dark:bg-[#202020]
                    "
                  >
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Date
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Check In
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Check Out
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Working Hours
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.map(
                    (record) => (
                      <AttendanceRow
                        key={record.id}
                        record={record}
                        employee={getEmployee(
                          record.employeeId,
                          employees,
                        )}
                        onView={() =>
                          openViewModal(record)
                        }
                        onEdit={() =>
                          openEditModal(record)
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET */}

            <div
              className="
                grid grid-cols-1 gap-4 p-4
                lg:hidden
              "
            >
              {filteredAttendance.map(
                (record) => (
                  <AttendanceCard
                    key={record.id}
                    record={record}
                    employee={getEmployee(
                      record.employeeId,
                      employees,
                    )}
                    departments={departments}
                    onView={() =>
                      openViewModal(record)
                    }
                    onEdit={() =>
                      openEditModal(record)
                    }
                  />
                ),
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL */}

      {showModal && (
        <AttendanceModal
          mode={modalMode}
          record={selectedAttendance}
          employees={employees}
          departments={departments}
          form={form}
          setForm={setForm}
          formError={formError}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onEdit={() =>
            selectedAttendance &&
            openEditModal(selectedAttendance)
          }
        />
      )}
    </div>
  );
}

/* ================================================== */
/* STAT */
/* ================================================== */

function AttendanceStat({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
  icon: ReactNode;
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

          <p className="mt-2 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div
          className={`
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl
            ${iconClass}
          `}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* ================================================== */
/* TABLE ROW */
/* ================================================== */

function AttendanceRow({
  record,
  employee,
  onView,
  onEdit,
}: {
  record: Attendance;
  employee?: Employee;
  onView: () => void;
  onEdit: () => void;
}) {
  const workingHours = String(
    record.workingHours ||
      calculateWorkingHours(
        record.checkIn || "",
        record.checkOut || "",
      ) ||
      "-",
  );

  return (
    <tr
      className="
        border-b border-[#E1E5EA]
        last:border-0
        hover:bg-[#F8F9FA]
        dark:border-[#333333]
        dark:hover:bg-[#202020]
      "
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <EmployeeAvatar
            employee={employee}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {employee?.fullName ||
                "Unknown Employee"}
            </p>

            <p className="text-xs text-[#667085] dark:text-[#888888]">
              {employee?.employeeId ||
                record.employeeId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
        {formatDate(record.date)}
      </td>

      <td className="px-5 py-4 text-sm">
        {record.checkIn || "-"}
      </td>

      <td className="px-5 py-4 text-sm">
        {record.checkOut || "-"}
      </td>

      <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
        {workingHours}
      </td>

      <td className="px-5 py-4 text-center">
        <AttendanceStatusBadge
          status={record.status}
        />
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center justify-center gap-1">
          <IconButton
            title="View"
            onClick={onView}
          >
            <Eye size={17} />
          </IconButton>

          <IconButton
            title="Edit"
            onClick={onEdit}
          >
            <Edit3 size={17} />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

/* ================================================== */
/* MOBILE CARD */
/* ================================================== */

function AttendanceCard({
  record,
  employee,
  departments,
  onView,
  onEdit,
}: {
  record: Attendance;
  employee?: Employee;
  departments: Department[];
  onView: () => void;
  onEdit: () => void;
}) {
  const workingHours = String(
    record.workingHours ||
      calculateWorkingHours(
        record.checkIn || "",
        record.checkOut || "",
      ) ||
      "-",
  );

  return (
    <div
      className="
        rounded-xl border p-4
        border-[#E1E5EA]
        bg-white
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <div className="flex items-start gap-3">
        <EmployeeAvatar
          employee={employee}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {employee?.fullName ||
                  "Unknown Employee"}
              </p>

              <p className="text-xs text-[#667085] dark:text-[#888888]">
                {employee?.employeeId ||
                  record.employeeId}
              </p>
            </div>

            <AttendanceStatusBadge
              status={record.status}
            />
          </div>
        </div>
      </div>

      <div
        className="
          mt-4 grid grid-cols-2 gap-2
          sm:grid-cols-3
        "
      >
        <InfoItem
          label="Date"
          value={formatDate(record.date)}
        />

        <InfoItem
          label="Check In"
          value={record.checkIn || "-"}
        />

        <InfoItem
          label="Check Out"
          value={record.checkOut || "-"}
        />

        <InfoItem
          label="Working Hours"
          value={workingHours}
        />

        <InfoItem
          label="Department"
          value={getDepartmentName(
            employee?.departmentId,
            departments,
          )}
        />

        <InfoItem
          label="Remarks"
          value={record.remarks || "-"}
        />
      </div>

      <div
        className="
          mt-4 flex items-center justify-end
          gap-2 border-t
          border-[#E1E5EA] pt-3
          dark:border-[#333333]
        "
      >
        <IconButton
          title="View"
          onClick={onView}
        >
          <Eye size={17} />
        </IconButton>

        <IconButton
          title="Edit"
          onClick={onEdit}
        >
          <Edit3 size={17} />
        </IconButton>
      </div>
    </div>
  );
}

/* ================================================== */
/* AVATAR */
/* ================================================== */

function EmployeeAvatar({
  employee,
}: {
  employee?: Employee;
}) {
  if (employee?.profileImage) {
    return (
      <img
        src={employee.profileImage}
        alt={employee.fullName}
        className="
          h-10 w-10 shrink-0
          rounded-full object-cover
        "
      />
    );
  }

  return (
    <div
      className="
        flex h-10 w-10 shrink-0
        items-center justify-center
        rounded-full
        bg-[#EAF2FF]
        text-sm font-bold
        text-[#0066FF]
        dark:bg-[#10233F]
        dark:text-[#1E90FF]
      "
    >
      {getInitials(
        employee?.fullName || "User",
      )}
    </div>
  );
}

/* ================================================== */
/* STATUS BADGE */
/* ================================================== */

function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus;
}) {
  return (
    <span
      className={`
        inline-flex shrink-0
        rounded-lg px-2.5 py-1.5
        text-[10px] font-semibold
        sm:text-xs
        ${getStatusClass(status)}
      `}
    >
      {status}
    </span>
  );
}

/* ================================================== */
/* INFO ITEM */
/* ================================================== */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        min-w-0 rounded-lg
        bg-[#F8F9FA] px-3 py-2
        dark:bg-[#181818]
      "
    >
      <p className="text-[10px] text-[#98A2B3]">
        {label}
      </p>

      <p
        className="
          mt-1 truncate text-xs font-semibold
          text-[#667085]
          dark:text-[#B3B3B3]
        "
      >
        {value}
      </p>
    </div>
  );
}

/* ================================================== */
/* ICON BUTTON */
/* ================================================== */

function IconButton({
  children,
  title,
  onClick,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="
        flex h-9 w-9
        items-center justify-center
        rounded-lg
        text-[#0066FF]
        transition
        hover:bg-[#EEF4FF]
        dark:text-[#1E90FF]
        dark:hover:bg-[#10233F]
      "
    >
      {children}
    </button>
  );
}

/* ================================================== */
/* MODAL */
/* ================================================== */

function AttendanceModal({
  mode,
  record,
  employees,
  departments,
  form,
  setForm,
  formError,
  saving,
  onClose,
  onSubmit,
  onEdit,
}: {
  mode: "view" | "edit";
  record: Attendance | null;
  employees: Employee[];
  departments: Department[];
  form: AttendanceForm;
  setForm: Dispatch<
    SetStateAction<AttendanceForm>
  >;
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
  onEdit: () => void;
}) {
  const isView = mode === "view";

  const employee = record
    ? getEmployee(
        record.employeeId,
        employees,
      )
    : undefined;

  if (!record && isView) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50
        p-3 sm:p-4
      "
      onMouseDown={onClose}
    >
      <div
        className="
          w-full max-w-2xl
          overflow-hidden
          rounded-2xl border
          border-[#E1E5EA]
          bg-white shadow-2xl
          dark:border-[#333333]
          dark:bg-[#181818]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}

        <div
          className="
            flex items-center justify-between
            border-b border-[#E1E5EA]
            px-5 py-4
            dark:border-[#333333]
          "
        >
          <div>
            <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Human Resources
            </p>

            <h2 className="mt-1 text-lg font-bold">
              {isView
                ? "Attendance Details"
                : "Edit Attendance"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex h-9 w-9
              items-center justify-center
              rounded-lg
              text-[#667085]
              hover:bg-[#F2F4F7]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            <X size={18} />
          </button>
        </div>

        {isView && record ? (
          /* VIEW */

          <div className="p-5">
            <div className="flex flex-col items-center text-center">
              <EmployeeAvatar
                employee={employee}
              />

              <h3 className="mt-3 text-lg font-bold">
                {employee?.fullName ||
                  "Unknown Employee"}
              </h3>

              <p className="text-xs text-[#667085] dark:text-[#888888]">
                {employee?.employeeId ||
                  record.employeeId}
              </p>

              <div className="mt-2">
                <AttendanceStatusBadge
                  status={record.status}
                />
              </div>
            </div>

            <div
              className="
                mt-5 grid grid-cols-1 gap-3
                sm:grid-cols-2
              "
            >
              <DetailItem
                label="Date"
                value={formatDate(
                  record.date,
                )}
              />

              <DetailItem
                label="Department"
                value={getDepartmentName(
                  employee?.departmentId,
                  departments,
                )}
              />

              <DetailItem
                label="Check In"
                value={
                  record.checkIn || "-"
                }
              />

              <DetailItem
                label="Check Out"
                value={
                  record.checkOut || "-"
                }
              />

              <DetailItem
                label="Working Hours"
                value={String(
                  record.workingHours ||
                    calculateWorkingHours(
                      record.checkIn || "",
                      record.checkOut || "",
                    ) ||
                    "-",
                )}
              />

              <DetailItem
                label="Remarks"
                value={
                  record.remarks || "-"
                }
              />
            </div>

            <div
              className="
                mt-5 flex flex-col-reverse
                gap-2 sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={onClose}
                className="
                  h-10 rounded-xl border
                  border-[#D0D5DD] px-4
                  text-sm font-semibold
                  text-[#667085]
                  hover:bg-[#F2F4F7]
                  dark:border-[#3A3A3A]
                  dark:text-[#B3B3B3]
                  dark:hover:bg-[#303030]
                "
              >
                Close
              </button>

              <button
                type="button"
                onClick={onEdit}
                className="
                  inline-flex h-10
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-[#0066FF] px-5
                  text-sm font-semibold
                  text-white
                  hover:bg-[#0052CC]
                  dark:bg-[#1E90FF]
                  dark:hover:bg-[#1878D1]
                "
              >
                <Edit3 size={16} />
                Edit Attendance
              </button>
            </div>
          </div>
        ) : (
          /* EDIT */

          <form
            onSubmit={onSubmit}
            className="p-5"
          >
            {formError && (
              <div
                className="
                  mb-4 rounded-xl border
                  border-red-200 bg-red-50
                  px-4 py-3
                  text-xs text-red-600
                  dark:border-red-900
                  dark:bg-red-950/30
                  dark:text-red-400
                "
              >
                {formError}
              </div>
            )}

            <div
              className="
                grid grid-cols-1 gap-4
                sm:grid-cols-2
              "
            >
              <FormField label="Employee">
                <div className="relative">
                  <select
                    value={form.employeeId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employeeId:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">
                      Select Employee
                    </option>

                    {employees.map(
                      (item) => (
                        <option
                          key={item.id}
                          value={
                            item.employeeId
                          }
                        >
                          {item.fullName} (
                          {
                            item.employeeId
                          }
                          )
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="
                      pointer-events-none
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      text-[#667085]
                      dark:text-[#B3B3B3]
                    "
                  />
                </div>
              </FormField>

              <FormField label="Date">
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className={`
                    ${inputClass}
                    dark:[color-scheme:dark]
                  `}
                />
              </FormField>

              <FormField label="Check In">
                <input
                  type="time"
                  value={form.checkIn}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      checkIn:
                        event.target.value,
                    }))
                  }
                  className={`
                    ${inputClass}
                    dark:[color-scheme:dark]
                  `}
                />
              </FormField>

              <FormField label="Check Out">
                <input
                  type="time"
                  value={form.checkOut}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      checkOut:
                        event.target.value,
                    }))
                  }
                  className={`
                    ${inputClass}
                    dark:[color-scheme:dark]
                  `}
                />
              </FormField>

              <FormField label="Status">
                <div className="relative">
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status:
                          event.target
                            .value as AttendanceStatus,
                      }))
                    }
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    {ATTENDANCE_STATUSES.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      ),
                    )}
                  </select>

                  <ChevronDown
                    size={17}
                    className="
                      pointer-events-none
                      absolute right-3 top-1/2
                      -translate-y-1/2
                      text-[#667085]
                      dark:text-[#B3B3B3]
                    "
                  />
                </div>
              </FormField>

              <FormField label="Working Hours">
                <input
                  type="text"
                  readOnly
                  value={String(
                    calculateWorkingHours(
                      form.checkIn,
                      form.checkOut,
                    ) || "",
                  )}
                  placeholder="Auto calculated"
                  className={`
                    ${inputClass}
                    cursor-not-allowed
                    bg-[#F2F4F7]
                    dark:bg-[#252525]
                  `}
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Remarks">
                  <textarea
                    value={form.remarks}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        remarks:
                          event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Optional remarks"
                    className="
                      w-full resize-none
                      rounded-xl border
                      border-[#D0D5DD]
                      bg-white px-3 py-2
                      text-sm text-[#1A1A2E]
                      outline-none
                      focus:border-[#0066FF]
                      focus:ring-2
                      focus:ring-[#0066FF]/10
                      dark:border-[#3A3A3A]
                      dark:bg-[#101010]
                      dark:text-white
                      dark:placeholder:text-[#777777]
                      dark:focus:border-[#1E90FF]
                    "
                  />
                </FormField>
              </div>
            </div>

            <div
              className="
                mt-5 flex flex-col-reverse
                gap-2 sm:flex-row
                sm:justify-end
              "
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="
                  h-10 rounded-xl border
                  border-[#D0D5DD] px-4
                  text-sm font-semibold
                  text-[#667085]
                  hover:bg-[#F2F4F7]
                  dark:border-[#3A3A3A]
                  dark:text-[#B3B3B3]
                  dark:hover:bg-[#303030]
                "
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="
                  h-10 rounded-xl
                  bg-[#0066FF] px-5
                  text-sm font-semibold
                  text-white
                  hover:bg-[#0052CC]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:bg-[#1E90FF]
                  dark:hover:bg-[#1878D1]
                "
              >
                {saving
                  ? "Saving..."
                  : "Update Attendance"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* ================================================== */
/* FORM FIELD */
/* ================================================== */

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold">
        {label}
      </label>

      {children}
    </div>
  );
}

/* ================================================== */
/* DETAIL ITEM */
/* ================================================== */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        bg-[#F8F9FA]
        p-3
        dark:bg-[#202020]
      "
    >
      <p className="text-[10px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

/* ================================================== */
/* LOADING */
/* ================================================== */

function LoadingState() {
  return (
    <div className="px-5 py-14 text-center">
      <div
        className="
          mx-auto h-7 w-7 animate-spin
          rounded-full border-2
          border-[#D0D5DD]
          border-t-[#0066FF]
          dark:border-[#444444]
          dark:border-t-[#1E90FF]
        "
      />

      <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
        Loading attendance...
      </p>
    </div>
  );
}

/* ================================================== */
/* EMPTY */
/* ================================================== */

function EmptyState() {
  return (
    <div className="px-5 py-14 text-center">
      <CalendarDays
        size={34}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        No attendance records found
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        Try changing your search or filters.
      </p>
    </div>
  );
}

/* ================================================== */
/* INPUT */
/* ================================================== */

const inputClass = `
  h-10 w-full rounded-xl border
  border-[#D0D5DD]
  bg-white
  px-3
  text-sm
  text-[#1A1A2E]
  outline-none
  transition
  focus:border-[#0066FF]
  focus:ring-2
  focus:ring-[#0066FF]/10

  dark:border-[#3A3A3A]
  dark:bg-[#101010]
  dark:text-white
  dark:placeholder:text-[#777777]
  dark:focus:border-[#1E90FF]
  dark:focus:ring-[#1E90FF]/10
`;