import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Edit3,
  Eye,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { api } from "../../services/api";

type EmploymentStatus =
  | "Active"
  | "Inactive"
  | "On Notice"
  | "Resigned";

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
  employmentStatus: EmploymentStatus;
  profileImage: string;
  createdDate: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
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

const EMPTY_FORM = {
  employeeId: "",
  fullName: "",
  email: "",
  phone: "",
  departmentId: "",
  designation: "",
  managerId: "",
  joiningDate: "",
  employmentStatus: "Active" as EmploymentStatus,
  profileImage: "",
};

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

  return (
    department?.name ||
    departmentId ||
    "Not Assigned"
  );
}

function getDepartmentId(
  departmentValue: string,
  departments: Department[],
) {
  const department = departments.find(
    (item) =>
      item.departmentId === departmentValue ||
      item.id === departmentValue ||
      item.name === departmentValue,
  );

  return (
    department?.departmentId ||
    departmentValue
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

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "U";

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

export default function Employees() {
  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [departments, setDepartments] =
    useState<Department[]>(
      DEFAULT_DEPARTMENTS,
    );

  const [search, setSearch] = useState("");

  const [departmentFilter, setDepartmentFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] = useState<
    "add" | "edit" | "view"
  >("add");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [formError, setFormError] =
    useState("");

  const [saving, setSaving] = useState(false);

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
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
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
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load employees:",
          err,
        );

        setError(
          "Unable to load employees. Please make sure JSON Server is running.",
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

  useEffect(() => {
  if (!showModal) {
    document.body.style.overflow = "";
    return;
  }

  const originalOverflow = document.body.style.overflow;

  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = originalOverflow;
  };
}, [showModal]);

  const filteredEmployees = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        !searchValue ||
        employee.fullName
          .toLowerCase()
          .includes(searchValue) ||
        employee.employeeId
          .toLowerCase()
          .includes(searchValue) ||
        employee.email
          .toLowerCase()
          .includes(searchValue) ||
        employee.designation
          .toLowerCase()
          .includes(searchValue);

      const employeeDepartmentId =
        getDepartmentId(
          employee.departmentId,
          departments,
        );

      const matchesDepartment =
        departmentFilter === "all" ||
        employeeDepartmentId ===
          departmentFilter;

      const matchesStatus =
        statusFilter === "all" ||
        employee.employmentStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    employees,
    departments,
    search,
    departmentFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const active = employees.filter(
      (employee) =>
        employee.employmentStatus ===
        "Active",
    ).length;

    const inactive = employees.filter(
      (employee) =>
        employee.employmentStatus ===
        "Inactive",
    ).length;

    const onNotice = employees.filter(
      (employee) =>
        employee.employmentStatus ===
        "On Notice",
    ).length;

    const resigned = employees.filter(
      (employee) =>
        employee.employmentStatus ===
        "Resigned",
    ).length;

    return {
      total: employees.length,
      active,
      inactive,
      onNotice,
      resigned,
    };
  }, [employees]);

  const openAddModal = () => {
    setModalMode("add");
    setSelectedEmployee(null);
    setForm({
      ...EMPTY_FORM,
      employeeId: getNextEmployeeId(),
    });
    setFormError("");
    setShowModal(true);
  };

  const openEditModal = (
    employee: Employee,
  ) => {
    setModalMode("edit");
    setSelectedEmployee(employee);

    setForm({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email,
      phone: employee.phone,
      departmentId: getDepartmentId(
        employee.departmentId,
        departments,
      ),
      designation: employee.designation,
      managerId: employee.managerId || "",
      joiningDate: employee.joiningDate,
      employmentStatus:
        employee.employmentStatus,
      profileImage: employee.profileImage || "",
    });

    setFormError("");
    setShowModal(true);
  };

  const openViewModal = (
    employee: Employee,
  ) => {
    setModalMode("view");
    setSelectedEmployee(employee);
    setFormError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedEmployee(null);
    setFormError("");
  };

  const getNextEmployeeId = () => {
    const numbers = employees
      .map((employee) => {
        const match =
          employee.employeeId.match(
            /(\d+)$/,
          );

        return match
          ? Number(match[1])
          : 0;
      })
      .filter((number) => number > 0);

    const nextNumber =
      numbers.length > 0
        ? Math.max(...numbers) + 1
        : 1;

    return `EMP${String(nextNumber).padStart(
      3,
      "0",
    )}`;
  };

  const validateForm = () => {
    const name = form.fullName.trim();

    if (!name) {
      return "Full name is required.";
    }

    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)) {
      return "Full name must contain only letters and spaces.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

   if (/[A-Z]/.test(form.email)) {
  return "Email must contain only lowercase letters.";
}

if (
  !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(
    form.email,
  )
) {
  return "Enter a valid lowercase email address.";
}

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!/^\d{10}$/.test(form.phone)) {
  return "Phone number must contain exactly 10 digits.";
}

    if (!form.departmentId) {
      return "Please select a department.";
    }

    if (!form.designation.trim()) {
      return "Designation is required.";
    }

    if (!form.joiningDate) {
      return "Joining date is required.";
    }

    return "";
  };

  const handleSubmit = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const payload: Employee = {
        id:
          modalMode === "edit" &&
          selectedEmployee
            ? selectedEmployee.id
            : `EMP-${Date.now()}`,
        employeeId:
          modalMode === "edit" &&
          selectedEmployee
            ? selectedEmployee.employeeId
            : form.employeeId ||
              getNextEmployeeId(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        departmentId:
          getDepartmentId(
            form.departmentId,
            departments,
          ),
        designation:
          form.designation.trim(),
        managerId:
          form.managerId.trim() || null,
        joiningDate: form.joiningDate,
        employmentStatus:
          form.employmentStatus,
        profileImage:
          form.profileImage.trim(),
        createdDate:
          modalMode === "edit" &&
          selectedEmployee
            ? selectedEmployee.createdDate
            : new Date()
                .toISOString()
                .split("T")[0],
      };

      if (
        modalMode === "edit" &&
        selectedEmployee
      ) {
        const response =
          await api.put<Employee>(
            `/employees/${selectedEmployee.id}`,
            payload,
          );

        setEmployees((current) =>
          current.map((employee) =>
            employee.id ===
            selectedEmployee.id
              ? response.data
              : employee,
          ),
        );
      } else {
        const response =
          await api.post<Employee>(
            "/employees",
            payload,
          );

        setEmployees((current) => [
          ...current,
          response.data,
        ]);
      }

      closeModal();
    } catch (err) {
      console.error(
        "Failed to save employee:",
        err,
      );

      setFormError(
        "Unable to save employee. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    employee: Employee,
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.fullName}?`,
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/employees/${employee.id}`,
      );

      setEmployees((current) =>
        current.filter(
          (item) =>
            item.id !== employee.id,
        ),
      );
    } catch (err) {
      console.error(
        "Failed to delete employee:",
        err,
      );

      window.alert(
        "Unable to delete employee. Please try again.",
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
            Human Resources
          </p>

          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Employees
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
            View and manage employee information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="
            inline-flex h-10
            items-center justify-center
            gap-2 rounded-xl
            bg-[#0066FF] px-4
            text-sm font-semibold text-white
            transition hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1878D1]
          "
        >
          <Plus size={17} />
          Add Employee
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        <EmployeeStat
          title="Total Employees"
          value={stats.total}
          icon={<UsersIcon />}
          iconClass="bg-blue-50 text-[#0066FF] dark:bg-blue-950/40 dark:text-[#1E90FF]"
        />

        <EmployeeStat
          title="Active"
          value={stats.active}
          icon={<UserRound size={19} />}
          iconClass="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />

        <EmployeeStat
          title="Inactive"
          value={stats.inactive}
          icon={<UserRound size={19} />}
          iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
        />

        <EmployeeStat
          title="On Notice"
          value={stats.onNotice}
          icon={<BriefcaseBusiness size={19} />}
          iconClass="bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
        />

        <EmployeeStat
          title="Resigned"
          value={stats.resigned}
          icon={<UserRound size={19} />}
          iconClass="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value,
                )
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
                All Departments
              </option>

              {departments.map(
                (department) => (
                  <option
                    key={
                      department.departmentId
                    }
                    value={
                      department.departmentId
                    }
                  >
                    {department.name}
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

          {/* STATUS */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value,
                )
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

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="On Notice">
                On Notice
              </option>

              <option value="Resigned">
                Resigned
              </option>
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
              transition hover:bg-[#F2F4F7]
              dark:border-[#3A3A3A]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            Clear
          </button>
        </div>
      </div>

      {/* EMPLOYEE LIST */}
      <div
        className="
          overflow-hidden rounded-2xl border shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div className="flex items-center justify-between border-b border-[#E1E5EA] p-5 dark:border-[#333333]">
          <div>
            <h2 className="text-lg font-bold">
              Employee List
            </h2>

            <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
              Showing {filteredEmployees.length}{" "}
              of {employees.length} employees
            </p>
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredEmployees.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* DESKTOP */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] dark:border-[#333333] dark:bg-[#202020]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Employee
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Department
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Designation
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Joining Date
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
                  {filteredEmployees.map(
                    (employee) => (
                      <EmployeeRow
                        key={employee.id}
                        employee={employee}
                        departmentName={getDepartmentName(
                          employee.departmentId,
                          departments,
                        )}
                        onView={() =>
                          openViewModal(
                            employee,
                          )
                        }
                        onEdit={() =>
                          openEditModal(
                            employee,
                          )
                        }
                        onDelete={() =>
                          handleDelete(
                            employee,
                          )
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE / TABLET */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {filteredEmployees.map(
                (employee) => (
                  <EmployeeCard
                    key={employee.id}
                    employee={employee}
                    departmentName={getDepartmentName(
                      employee.departmentId,
                      departments,
                    )}
                    onView={() =>
                      openViewModal(
                        employee,
                      )
                    }
                    onEdit={() =>
                      openEditModal(
                        employee,
                      )
                    }
                    onDelete={() =>
                      handleDelete(
                        employee,
                      )
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
  <EmployeeModal
    mode={modalMode}
    employee={selectedEmployee}
    form={form}
    setForm={setForm}
    departments={departments}
    formError={formError}
    saving={saving}
    onClose={closeModal}
    onSubmit={handleSubmit}
    onEdit={() =>
      selectedEmployee &&
      openEditModal(selectedEmployee)
    }
  />
)}
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT */
/* -------------------------------------------------- */

function EmployeeStat({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: number;
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

          <p className="mt-2 text-2xl font-bold">
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

function UsersIcon() {
  return <UserRound size={19} />;
}

/* -------------------------------------------------- */
/* TABLE ROW */
/* -------------------------------------------------- */

function EmployeeRow({
  employee,
  departmentName,
  onView,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  departmentName: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[#E1E5EA] last:border-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <EmployeeAvatar employee={employee} />

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {employee.fullName}
            </p>

            <p className="text-xs text-[#667085] dark:text-[#888888]">
              {employee.employeeId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4 text-sm">
        {departmentName}
      </td>

      <td className="px-5 py-4">
        <p className="text-sm">
          {employee.designation}
        </p>

        <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
          {employee.email}
        </p>
      </td>

      <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
        {formatDate(employee.joiningDate)}
      </td>

      <td className="px-5 py-4 text-center">
        <StatusBadge
          status={employee.employmentStatus}
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

          <IconButton
            title="Delete"
            danger
            onClick={onDelete}
          >
            <Trash2 size={17} />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------- */
/* MOBILE CARD */
/* -------------------------------------------------- */

function EmployeeCard({
  employee,
  departmentName,
  onView,
  onEdit,
  onDelete,
}: {
  employee: Employee;
  departmentName: string;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="
        rounded-xl border p-4
        border-[#E1E5EA]
        dark:border-[#333333]
        dark:bg-[#202020]
      "
    >
      <div className="flex items-start gap-3">
        <EmployeeAvatar employee={employee} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {employee.fullName}
              </p>

              <p className="text-xs text-[#667085] dark:text-[#888888]">
                {employee.employeeId}
              </p>
            </div>

            <StatusBadge
              status={employee.employmentStatus}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <InfoItem
          icon={<BriefcaseBusiness size={14} />}
          value={departmentName}
        />

        <InfoItem
          icon={<BriefcaseBusiness size={14} />}
          value={employee.designation}
        />

        <InfoItem
          icon={<Mail size={14} />}
          value={employee.email}
        />

        <InfoItem
          icon={<Phone size={14} />}
          value={employee.phone}
        />
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-[#E1E5EA] pt-3 dark:border-[#333333]">
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

        <IconButton
          title="Delete"
          danger
          onClick={onDelete}
        >
          <Trash2 size={17} />
        </IconButton>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* AVATAR */
/* -------------------------------------------------- */

function EmployeeAvatar({
  employee,
}: {
  employee: Employee;
}) {
  if (employee.profileImage) {
    return (
      <img
        src={employee.profileImage}
        alt={employee.fullName}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
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
      {getInitials(employee.fullName)}
    </div>
  );
}

/* -------------------------------------------------- */
/* STATUS */
/* -------------------------------------------------- */

function StatusBadge({
  status,
}: {
  status: EmploymentStatus;
}) {
  const classes: Record<
    EmploymentStatus,
    string
  > = {
    Active:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    Inactive:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    "On Notice":
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    Resigned:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  };

  return (
    <span
      className={`inline-flex shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold sm:text-xs ${classes[status]}`}
    >
      {status}
    </span>
  );
}

/* -------------------------------------------------- */
/* INFO ITEM */
/* -------------------------------------------------- */

function InfoItem({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg bg-[#F8F9FA] px-3 py-2 dark:bg-[#181818]">
      <span className="shrink-0 text-[#667085] dark:text-[#888888]">
        {icon}
      </span>

      <span className="truncate text-xs text-[#667085] dark:text-[#B3B3B3]">
        {value}
      </span>
    </div>
  );
}

/* -------------------------------------------------- */
/* ICON BUTTON */
/* -------------------------------------------------- */

function IconButton({
  children,
  title,
  danger = false,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`
        flex h-9 w-9
        items-center justify-center
        rounded-lg
        transition

        ${
          danger
            ? "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            : "text-[#0066FF] hover:bg-[#EEF4FF] dark:text-[#1E90FF] dark:hover:bg-[#10233F]"
        }
      `}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------- */
/* MODAL */
/* -------------------------------------------------- */

function EmployeeModal({
  mode,
  employee,
  form,
  setForm,
  departments,
  formError,
  saving,
  onClose,
  onSubmit,
  onEdit,
}: {
  mode: "add" | "edit" | "view";
  employee: Employee | null;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<
    React.SetStateAction<typeof EMPTY_FORM>
  >;
  departments: Department[];
  formError: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    event: React.FormEvent,
  ) => void;
  onEdit: () => void;
}) {
  const isView = mode === "view";

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
      rounded-2xl
      border
      border-[#E1E5EA]
      bg-white
      shadow-2xl
      dark:border-[#333333]
      dark:bg-[#181818]
    "
    onMouseDown={(event) => event.stopPropagation()}
  >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
          <div>
            <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Human Resources
            </p>

            <h2 className="mt-1 text-lg font-bold">
              {mode === "add"
                ? "Add Employee"
                : mode === "edit"
                  ? "Edit Employee"
                  : "Employee Details"}
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
              transition hover:bg-[#F2F4F7]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            <X size={18} />
          </button>
        </div>

        {isView && employee ? (
          <EmployeeDetails
            employee={employee}
            departments={departments}
            onEdit={onEdit}
            onClose={onClose}
          />
        ) : (
          <form
            onSubmit={onSubmit}
            className="p-5"
          >
            {formError && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* EMPLOYEE ID */}
              <FormField label="Employee ID">
                <input
                  type="text"
                  value={form.employeeId}
                  disabled
                  className={`
                    ${inputClass}
                    cursor-not-allowed
                    bg-[#F2F4F7]
                    dark:bg-[#252525]
                  `}
                />
              </FormField>

              {/* FULL NAME */}
              <FormField label="Full Name">
  <input
    type="text"
    value={form.fullName}
    onChange={(event) => {
      const value = event.target.value;

      if (
        value === "" ||
        /^[A-Za-z\s]*$/.test(value)
      ) {
        setForm((current) => ({
          ...current,
          fullName: value,
        }));
      }
    }}
    placeholder="Enter full name"
    className={inputClass}
/>
</FormField>

              {/* EMAIL */}
             <FormField label="Email">
  <input
    type="email"
    value={form.email}
    onChange={(event) => {
      const value = event.target.value;

      if (/[A-Z]/.test(value)) {
        return;
      }

      setForm((current) => ({
        ...current,
        email: value,
      }));
    }}
    placeholder="employee@company.com"
    className={inputClass}
/>
</FormField>

              {/* PHONE */}
            <FormField label="Phone">
  <input
    type="text"
    inputMode="numeric"
    maxLength={10}
    value={form.phone}
    onChange={(event) => {
      const value =
        event.target.value.replace(/\D/g, "");

      setForm((current) => ({
        ...current,
        phone: value,
      }));
    }}
    placeholder="10 digit phone number"
    className={inputClass}
/>
</FormField>

              {/* DEPARTMENT */}
              <FormField label="Department">
                <div className="relative">
                  <select
                    value={form.departmentId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        departmentId:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="">
                      Select Department
                    </option>

                    {departments.map(
                      (department) => (
                        <option
                          key={
                            department.departmentId
                          }
                          value={
                            department.departmentId
                          }
                        >
                          {department.name}
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

              {/* DESIGNATION */}
              <FormField label="Designation">
                <input
                  type="text"
                  value={form.designation}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      designation:
                        event.target.value,
                    }))
                  }
                  placeholder="Enter designation"
                  className={inputClass}
                />
              </FormField>

              {/* MANAGER */}
              <FormField label="Manager ID">
                <input
                  type="text"
                  value={form.managerId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      managerId:
                        event.target.value,
                    }))
                  }
                  placeholder="Optional"
                  className={inputClass}
                />
              </FormField>

              {/* JOINING DATE */}
              <FormField label="Joining Date">
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      joiningDate:
                        event.target.value,
                    }))
                  }
                  className={`
                    ${inputClass}
                    dark:[color-scheme:dark]
                  `}
                />
              </FormField>

              {/* STATUS */}
              <FormField label="Employment Status">
                <div className="relative">
                  <select
                    value={
                      form.employmentStatus
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        employmentStatus:
                          event.target
                            .value as EmploymentStatus,
                      }))
                    }
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    <option value="Active">
                      Active
                    </option>

                    <option value="Inactive">
                      Inactive
                    </option>

                    <option value="On Notice">
                      On Notice
                    </option>

                    <option value="Resigned">
                      Resigned
                    </option>
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

              {/* PROFILE IMAGE */}
              <FormField label="Profile Image URL">
                <input
                  type="url"
                  value={form.profileImage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      profileImage:
                        event.target.value,
                    }))
                  }
                  placeholder="Optional image URL"
                  className={inputClass}
                />
              </FormField>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
                  transition hover:bg-[#0052CC]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  dark:bg-[#1E90FF]
                  dark:hover:bg-[#1878D1]
                "
              >
                {saving
                  ? "Saving..."
                  : mode === "edit"
                    ? "Update Employee"
                    : "Add Employee"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* DETAILS */
/* -------------------------------------------------- */

function EmployeeDetails({
  employee,
  departments,
  onEdit,
  onClose,
}: {
  employee: Employee;
  departments: Department[];
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div className="p-5">
      <div className="flex flex-col items-center text-center">
        <EmployeeAvatar employee={employee} />

        <h3 className="mt-3 text-lg font-bold">
          {employee.fullName}
        </h3>

        <p className="text-xs text-[#667085] dark:text-[#888888]">
          {employee.employeeId}
        </p>

        <div className="mt-2">
          <StatusBadge
            status={employee.employmentStatus}
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DetailItem
          label="Email"
          value={employee.email}
        />

        <DetailItem
          label="Phone"
          value={employee.phone}
        />

        <DetailItem
          label="Department"
          value={getDepartmentName(
            employee.departmentId,
            departments,
          )}
        />

        <DetailItem
          label="Designation"
          value={employee.designation}
        />

        <DetailItem
          label="Manager ID"
          value={employee.managerId || "Not Assigned"}
        />

        <DetailItem
          label="Joining Date"
          value={formatDate(
            employee.joiningDate,
          )}
        />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
            text-sm font-semibold text-white
            hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1878D1]
          "
        >
          <Edit3 size={16} />
          Edit Employee
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* FORM FIELD */
/* -------------------------------------------------- */

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
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

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F8F9FA] p-3 dark:bg-[#202020]">
      <p className="text-[10px] text-[#667085] dark:text-[#888888]">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* LOADING */
/* -------------------------------------------------- */

function LoadingState() {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#D0D5DD] border-t-[#0066FF] dark:border-[#444444] dark:border-t-[#1E90FF]" />

      <p className="mt-3 text-sm text-[#667085] dark:text-[#888888]">
        Loading employees...
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* EMPTY */
/* -------------------------------------------------- */

function EmptyState() {
  return (
    <div className="px-5 py-14 text-center">
      <UserRound
        size={34}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        No employees found
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        Try changing your search or filters.
      </p>
    </div>
  );
}

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