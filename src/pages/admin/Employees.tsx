import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  Edit,
  Eye,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { api } from "../../services/api";
import type { Employee } from "../../types/employee";

interface Department {
  id?: string;
  name?: string;
  departmentId?: string;
  departmentName?: string;
  status?: string;
}

interface DepartmentOption {
  value: string;
  label: string;
}

type ModalMode = "add" | "edit" | "view" | null;

interface EmployeeFormData {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  departmentId: string;
  designation: string;
  managerId: string;
  joiningDate: string;
  employmentStatus: Employee["employmentStatus"];
  profileImage: string;
}

/*
|--------------------------------------------------------------------------
| Default departments
|--------------------------------------------------------------------------
| These guarantee that the Department dropdown has options even when
| JSON Server does not return department records.
*/
const DEFAULT_DEPARTMENTS: DepartmentOption[] = [
  {
    value: "DEP001",
    label: "Development",
  },
  {
    value: "DEP002",
    label: "Human Resources",
  },
  {
    value: "DEP003",
    label: "Finance",
  },
  {
    value: "DEP004",
    label: "Marketing",
  },
  {
    value: "DEP005",
    label: "Sales",
  },
  {
    value: "DEP006",
    label: "Operations",
  },
  {
    value: "DEP007",
    label: "Support",
  },
];

const emptyForm: EmployeeFormData = {
  employeeId: "",
  fullName: "",
  email: "",
  phone: "",
  departmentId: "",
  designation: "",
  managerId: "",
  joiningDate: "",
  employmentStatus: "Active",
  profileImage: "",
};

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");

  const [modalMode, setModalMode] =
    useState<ModalMode>(null);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [formData, setFormData] =
    useState<EmployeeFormData>(emptyForm);

  const [formError, setFormError] = useState("");

  // ------------------------------------------------------------------
  // Load Employees + Departments
  // ------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const [employeesResponse, departmentsResponse] =
          await Promise.all([
            api.get<Employee[]>("/employees"),
            api.get<Department[]>("/departments"),
          ]);

        if (cancelled) return;

        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );

        setDepartments(
          Array.isArray(departmentsResponse.data)
            ? departmentsResponse.data
            : [],
        );
        setError("");
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee data:",
          err,
        );

        setError(
          "Unable to load employee data. Please make sure JSON Server is running.",
        );

        // Keep employee page usable even if departments API fails.
        setDepartments([]);
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

  // ------------------------------------------------------------------
  // Department options
  // ------------------------------------------------------------------

  /*
   * IMPORTANT:
   * Always start with the default departments.
   *
   * If JSON Server contains departments, those are added/updated.
   * This guarantees the dropdown will never contain only
   * "Select department".
   */
  const departmentOptions = useMemo<DepartmentOption[]>(() => {
    const departmentMap = new Map<string, DepartmentOption>();

    DEFAULT_DEPARTMENTS.forEach((item) => {
      departmentMap.set(item.value, item);
    });

    departments.forEach((item) => {
      const value =
        item.id ??
        item.departmentId ??
        "";

      const label =
        item.name ??
        item.departmentName ??
        "";

      if (value && label) {
        departmentMap.set(value, {
          value,
          label,
        });
      }
    });

    return Array.from(departmentMap.values());
  }, [departments]);

  // ------------------------------------------------------------------
  // Department helpers
  // ------------------------------------------------------------------

  const getDepartmentName = (
    departmentId: string,
  ) => {
    if (!departmentId) {
      return "—";
    }

    const foundDepartment =
      departmentOptions.find(
        (item) => item.value === departmentId,
      );

    if (foundDepartment) {
      return foundDepartment.label;
    }

    const foundByLabel =
      departmentOptions.find(
        (item) =>
          item.label.toLowerCase() ===
          departmentId.toLowerCase(),
      );

    return (
      foundByLabel?.label ??
      departmentId
    );
  };

  const getDepartmentId = (
    departmentValue: string,
  ) => {
    if (!departmentValue) {
      return "";
    }

    const foundDepartment =
      departmentOptions.find(
        (item) =>
          item.value === departmentValue ||
          item.label.toLowerCase() ===
            departmentValue.toLowerCase(),
      );

    return (
      foundDepartment?.value ??
      departmentValue
    );
  };

  // ------------------------------------------------------------------
  // Manager helper
  // ------------------------------------------------------------------

  const getManagerName = (
    managerId: string | null,
  ) => {
    if (!managerId) {
      return "—";
    }

    const manager = employees.find(
      (employee) =>
        employee.employeeId === managerId ||
        employee.id === managerId,
    );

    return manager?.fullName ?? managerId;
  };

  // ------------------------------------------------------------------
  // Department filter options
  // ------------------------------------------------------------------

  const departmentFilterOptions = useMemo(() => {
    return [
      {
        value: "All",
        label: "All Departments",
      },
      ...departmentOptions,
    ];
  }, [departmentOptions]);

  // ------------------------------------------------------------------
  // Filter Employees
  // ------------------------------------------------------------------

  const filteredEmployees = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch =
        searchValue === "" ||
        employee.fullName
          .toLowerCase()
          .includes(searchValue) ||
        employee.employeeId
          .toLowerCase()
          .includes(searchValue) ||
        employee.email
          .toLowerCase()
          .includes(searchValue);

      const matchedDepartment =
        departmentOptions.find(
          (item) =>
            item.value === employee.departmentId ||
            item.label.toLowerCase() ===
              employee.departmentId.toLowerCase(),
        );

      const employeeDepartmentId =
        matchedDepartment?.value ??
        employee.departmentId;

      const matchesDepartment =
        department === "All" ||
        employeeDepartmentId === department ||
        employee.departmentId === department;

      const matchesStatus =
        status === "All" ||
        employee.employmentStatus === status;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    employees,
    search,
    department,
    status,
    departmentOptions,
  ]);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------

  const activeEmployees =
    employees.filter(
      (employee) =>
        employee.employmentStatus === "Active",
    ).length;

  // ------------------------------------------------------------------
  // Status styles
  // ------------------------------------------------------------------

  const getStatusClass = (
    employeeStatus: Employee["employmentStatus"],
  ) => {
    switch (employeeStatus) {
      case "Active":
        return `
          bg-[#E8F8EF] text-[#16834B]
          dark:bg-[#222222] dark:text-[#00FF85]
        `;

      case "On Notice":
        return `
          bg-[#FFF5D9] text-[#A16207]
          dark:bg-[#292929] dark:text-[#FFD166]
        `;

      case "Resigned":
        return `
          bg-[#FDECEC] text-[#C53030]
          dark:bg-[#292929] dark:text-[#FF8A8A]
        `;

      case "Inactive":
      default:
        return `
          bg-[#F1F5F9] text-[#64748B]
          dark:bg-[#292929] dark:text-[#B3B3B3]
        `;
    }
  };

  // ------------------------------------------------------------------
  // Modal helpers
  // ------------------------------------------------------------------

  const closeModal = () => {
    setModalMode(null);
    setSelectedEmployee(null);
    setFormData(emptyForm);
    setFormError("");
  };

  const openAddModal = () => {
    setSelectedEmployee(null);

    setFormData({
      ...emptyForm,
      employeeId: `EMP${String(
        employees.length + 1,
      ).padStart(3, "0")}`,
    });

    setFormError("");
    setModalMode("add");
  };

  const openViewModal = (
    employee: Employee,
  ) => {
    setSelectedEmployee(employee);
    setFormError("");
    setModalMode("view");
  };

  const openEditModal = (
    employee: Employee,
  ) => {
    setSelectedEmployee(employee);

    const matchedDepartment =
      departmentOptions.find(
        (item) =>
          item.value === employee.departmentId ||
          item.label.toLowerCase() ===
            employee.departmentId.toLowerCase(),
      );

    setFormData({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      email: employee.email.toLowerCase(),
      phone: employee.phone.replace(/\D/g, ""),
      departmentId:
        matchedDepartment?.value ??
        getDepartmentId(
          employee.departmentId,
        ),
      designation: employee.designation,
      managerId: employee.managerId ?? "",
      joiningDate: employee.joiningDate,
      employmentStatus:
        employee.employmentStatus,
      profileImage:
        employee.profileImage ?? "",
    });

    setFormError("");
    setModalMode("edit");
  };

  // ------------------------------------------------------------------
  // Form changes
  // ------------------------------------------------------------------

  const handleInputChange = (
    field: keyof EmployeeFormData,
    value: string,
  ) => {
    // Full name - letters and spaces only
    if (field === "fullName") {
      if (/[^A-Za-z\s]/.test(value)) {
        return;
      }

      setFormData((current) => ({
        ...current,
        [field]: value,
      }));

      setFormError("");
      return;
    }

    // Email - lowercase only
    if (field === "email") {
      if (/[A-Z]/.test(value)) {
        setFormError(
          "Email must contain only lowercase letters.",
        );
        return;
      }

      setFormData((current) => ({
        ...current,
        [field]: value,
      }));

      setFormError("");
      return;
    }

    // Phone - numbers only
    if (field === "phone") {
      if (!/^\d*$/.test(value)) {
        return;
      }

      setFormData((current) => ({
        ...current,
        [field]: value,
      }));

      setFormError("");
      return;
    }

    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError("");
  };

  // ------------------------------------------------------------------
  // Validation
  // ------------------------------------------------------------------

  const validateName = (
    name: string,
  ) => {
    return /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(
      name.trim(),
    );
  };

  const validateEmail = (
    email: string,
  ) => {
    return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(
      email.trim(),
    );
  };

  // ------------------------------------------------------------------
  // Add / Edit Employee
  // ------------------------------------------------------------------

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError("");

    const employeeId =
      formData.employeeId.trim();

    const name =
      formData.fullName.trim();

    const email =
      formData.email.trim();

    const phone =
      formData.phone.trim();

    const designation =
      formData.designation.trim();

    // Employee ID
    if (!employeeId) {
      setFormError(
        "Employee ID is required.",
      );
      return;
    }

    // Name
    if (!name) {
      setFormError(
        "Full name is required.",
      );
      return;
    }

    if (!validateName(name)) {
      setFormError(
        "Name must contain only letters and spaces.",
      );
      return;
    }

    // Email
    if (!email) {
      setFormError(
        "Email is required.",
      );
      return;
    }

    if (/[A-Z]/.test(email)) {
      setFormError(
        "Email must contain only lowercase letters.",
      );
      return;
    }

    if (!validateEmail(email)) {
      setFormError(
        "Please enter a valid lowercase email address.",
      );
      return;
    }

    // Phone
    if (!phone) {
      setFormError(
        "Phone number is required.",
      );
      return;
    }

    if (!/^\d+$/.test(phone)) {
      setFormError(
        "Phone number must contain only numbers.",
      );
      return;
    }

    // Department
    if (!formData.departmentId) {
      setFormError(
        "Department is required.",
      );
      return;
    }

    // Designation
    if (!designation) {
      setFormError(
        "Designation is required.",
      );
      return;
    }

    // Joining date
    if (!formData.joiningDate) {
      setFormError(
        "Joining date is required.",
      );
      return;
    }

    // Duplicate Employee ID
    const duplicateEmployeeId =
      employees.some(
        (employee) =>
          employee.employeeId
            .toLowerCase() ===
            employeeId.toLowerCase() &&
          employee.id !==
            selectedEmployee?.id,
      );

    if (duplicateEmployeeId) {
      setFormError(
        "Employee ID already exists.",
      );
      return;
    }

    try {
      setActionLoading(true);

      // --------------------------------------------------------------
      // ADD
      // --------------------------------------------------------------

      if (modalMode === "add") {
        const newEmployee: Employee = {
          id: crypto.randomUUID(),

          employeeId,

          fullName: name,

          email: email.toLowerCase(),

          phone,

          departmentId:
            getDepartmentId(
              formData.departmentId,
            ),

          designation,

          managerId:
            formData.managerId || null,

          joiningDate:
            formData.joiningDate,

          employmentStatus:
            formData.employmentStatus,

          profileImage:
            formData.profileImage.trim(),

          createdDate:
            new Date().toISOString(),
        };

        const response =
          await api.post<Employee>(
            "/employees",
            newEmployee,
          );

        setEmployees((current) => [
          ...current,
          response.data,
        ]);

        closeModal();
        return;
      }

      // --------------------------------------------------------------
      // EDIT
      // --------------------------------------------------------------

      if (
        modalMode === "edit" &&
        selectedEmployee
      ) {
        const updatedEmployee: Employee = {
          ...selectedEmployee,

          employeeId,

          fullName: name,

          email: email.toLowerCase(),

          phone,

          departmentId:
            getDepartmentId(
              formData.departmentId,
            ),

          designation,

          managerId:
            formData.managerId || null,

          joiningDate:
            formData.joiningDate,

          employmentStatus:
            formData.employmentStatus,

          profileImage:
            formData.profileImage.trim(),
        };

        const response =
          await api.put<Employee>(
            `/employees/${selectedEmployee.id}`,
            updatedEmployee,
          );

        setEmployees((current) =>
          current.map((employee) =>
            employee.id ===
            selectedEmployee.id
              ? response.data
              : employee,
          ),
        );

        closeModal();
      }
    } catch (err) {
      console.error(
        "Employee save failed:",
        err,
      );

      setFormError(
        "Unable to save employee. Please make sure JSON Server is running.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Delete
  // ------------------------------------------------------------------

  const handleDelete = async (
    employee: Employee,
  ) => {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${employee.fullName}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

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
        "Employee delete failed:",
        err,
      );

      setError(
        "Unable to delete employee. Please try again.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div
      className="
        min-h-full w-full min-w-0
        space-y-6 overflow-x-hidden
        bg-[#F8F9FA] text-[#1A1A2E]
        dark:bg-[#0D0D0D] dark:text-white
      "
    >
      {/* ============================================================
          PAGE HEADER
      ============================================================ */}

      <div
        className="
          flex min-w-0 flex-col gap-4
          sm:flex-row sm:items-center
          sm:justify-between
        "
      >
        <div className="min-w-0">
          <p
            className="
              text-sm font-semibold
              text-[#0066FF]
              dark:text-[#1E90FF]
            "
          >
            Administration
          </p>

          <h1
            className="
              mt-1 text-2xl font-bold
              tracking-tight sm:text-3xl
            "
          >
            Employees
          </h1>

          <p
            className="
              mt-1 text-sm
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Manage employee records and
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="
            inline-flex w-fit shrink-0
            items-center gap-2
            rounded-xl
            bg-[#0066FF] px-4 py-2.5
            text-sm font-semibold text-white
            shadow-sm transition
            hover:bg-[#0052CC]
            dark:bg-[#1E90FF]
            dark:hover:bg-[#187BD0]
          "
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* ============================================================
          SUMMARY CARDS
      ============================================================ */}

      <div
        className="
          grid min-w-0 grid-cols-1
          gap-4 sm:grid-cols-3
        "
      >
        {/* Total Employees */}

        <div
          className="
            min-w-0 rounded-2xl border p-5
            shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div
            className="
              flex items-center
              justify-between gap-3
            "
          >
            <div>
              <p
                className="
                  text-sm
                  text-[#667085]
                  dark:text-[#B3B3B3]
                "
              >
                Total Employees
              </p>

              <p className="mt-2 text-2xl font-bold">
                {loading
                  ? "—"
                  : employees.length}
              </p>
            </div>

            <div
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl
                bg-[#E5F0FF]
                text-[#0066FF]
                dark:bg-[#292929]
                dark:text-[#1E90FF]
              "
            >
              <Users size={21} />
            </div>
          </div>
        </div>

        {/* Active Employees */}

        <div
          className="
            min-w-0 rounded-2xl border p-5
            shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <p
            className="
              text-sm
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Active Employees
          </p>

          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "—"
              : activeEmployees}
          </p>
        </div>

        {/* Departments */}

        <div
          className="
            min-w-0 rounded-2xl border p-5
            shadow-sm
            border-[#E1E5EA] bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <p
            className="
              text-sm
              text-[#667085]
              dark:text-[#B3B3B3]
            "
          >
            Departments
          </p>

          <p className="mt-2 text-2xl font-bold">
            {loading
              ? "—"
              : departmentOptions.length}
          </p>
        </div>
      </div>

      {/* ============================================================
          SEARCH / FILTERS
      ============================================================ */}

      <section
        className="
          min-w-0 rounded-2xl border
          p-4 shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        <div
          className="
            grid min-w-0 grid-cols-1 gap-3
            md:grid-cols-[minmax(0,1fr)_220px_180px]
          "
        >
          {/* Search */}

          <div className="relative min-w-0">
            <Search
              size={18}
              className="
                absolute left-3 top-1/2
                -translate-y-1/2
                text-[#667085]
                dark:text-[#B3B3B3]
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search by name, ID or email..."
              className="
                h-11 w-full min-w-0
                rounded-xl border
                border-[#E1E5EA]
                bg-[#F8F9FA]
                pl-10 pr-4
                text-sm text-[#1A1A2E]
                outline-none
                placeholder:text-[#98A2B3]
                focus:border-[#0066FF]
                dark:border-[#333333]
                dark:bg-[#222222]
                dark:text-white
                dark:placeholder:text-[#777777]
                dark:focus:border-[#1E90FF]
              "
            />
          </div>

          {/* Department Filter */}

          <select
            value={department}
            onChange={(event) =>
              setDepartment(
                event.target.value,
              )
            }
            className="
              h-11 w-full min-w-0
              rounded-xl border px-3
              text-sm outline-none
              border-[#E1E5EA]
              bg-[#F8F9FA]
              text-[#1A1A2E]
              focus:border-[#0066FF]
              dark:border-[#333333]
              dark:bg-[#222222]
              dark:text-white
              dark:focus:border-[#1E90FF]
            "
          >
            {departmentFilterOptions.map(
              (item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ),
            )}
          </select>

          {/* Status Filter */}

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
            className="
              h-11 w-full min-w-0
              rounded-xl border px-3
              text-sm outline-none
              border-[#E1E5EA]
              bg-[#F8F9FA]
              text-[#1A1A2E]
              focus:border-[#0066FF]
              dark:border-[#333333]
              dark:bg-[#222222]
              dark:text-white
              dark:focus:border-[#1E90FF]
            "
          >
            <option value="All">
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
        </div>
      </section>

      {/* ============================================================
          ERROR
      ============================================================ */}

      {error && (
        <div
          className="
            rounded-xl border
            px-4 py-3 text-sm
            border-red-200
            bg-red-50 text-red-700
            dark:border-[#444444]
            dark:bg-[#1F1F1F]
            dark:text-[#FFB4B4]
          "
        >
          {error}
        </div>
      )}

      {/* ============================================================
          EMPLOYEE TABLE
      ============================================================ */}

      <section
        className="
          min-w-0 overflow-hidden
          rounded-2xl border shadow-sm
          border-[#E1E5EA] bg-white
          dark:border-[#333333]
          dark:bg-[#181818]
        "
      >
        {/* ----------------------------------------------------------
            DESKTOP TABLE
        ---------------------------------------------------------- */}

        <div className="hidden w-full min-w-0 xl:block">
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[24%]" />
              <col className="w-[13%]" />
              <col className="w-[15%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[11%]" />
              <col className="w-[11%]" />
            </colgroup>

            <thead>
              <tr
                className="
                  border-b
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                {[
                  "Employee",
                  "Department",
                  "Designation",
                  "Manager",
                  "Joining Date",
                  "Status",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`
                      px-3 py-4
                      text-left text-xs
                      font-semibold
                      uppercase tracking-wide
                      text-[#667085]
                      dark:text-[#B3B3B3]
                      ${
                        heading ===
                        "Actions"
                          ? "text-right"
                          : ""
                      }
                    `}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody
              className="
                divide-y
                divide-[#EEF3F7]
                dark:divide-[#333333]
              "
            >
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      px-4 py-12
                      text-center text-sm
                      text-[#667085]
                      dark:text-[#B3B3B3]
                    "
                  >
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="
                      px-4 py-12
                      text-center text-sm
                      text-[#667085]
                      dark:text-[#B3B3B3]
                    "
                  >
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(
                  (employee) => (
                    <tr
                      key={employee.id}
                      className="
                        transition-colors
                        hover:bg-[#F8FBFF]
                        dark:hover:bg-[#222222]
                      "
                    >
                      {/* Employee */}

                      <td className="min-w-0 px-3 py-4">
                        <div
                          className="
                            flex min-w-0
                            items-center gap-2.5
                          "
                        >
                          <div
                            className="
                              flex h-9 w-9 shrink-0
                              items-center
                              justify-center
                              rounded-full
                              bg-[#E5F0FF]
                              text-sm font-bold
                              text-[#0066FF]
                              dark:bg-[#292929]
                              dark:text-[#1E90FF]
                            "
                          >
                            {employee.fullName
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p
                              className="
                                truncate
                                text-sm font-semibold
                              "
                            >
                              {employee.fullName}
                            </p>

                            <p
                              className="
                                mt-0.5 truncate
                                text-xs
                                text-[#667085]
                                dark:text-[#B3B3B3]
                              "
                            >
                              {
                                employee.employeeId
                              }
                            </p>

                            <p
                              className="
                                mt-0.5 truncate
                                text-xs
                                text-[#98A2B3]
                              "
                            >
                              {employee.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}

                      <td className="min-w-0 px-3 py-4 text-sm">
                        <p className="truncate">
                          {getDepartmentName(
                            employee.departmentId,
                          )}
                        </p>
                      </td>

                      {/* Designation */}

                      <td className="min-w-0 px-3 py-4 text-sm">
                        <p className="truncate">
                          {
                            employee.designation
                          }
                        </p>
                      </td>

                      {/* Manager */}

                      <td className="min-w-0 px-3 py-4 text-sm">
                        <p className="truncate">
                          {getManagerName(
                            employee.managerId,
                          )}
                        </p>
                      </td>

                      {/* Joining Date */}

                      <td
                        className="
                          px-3 py-4 text-sm
                          text-[#667085]
                          dark:text-[#B3B3B3]
                        "
                      >
                        {
                          employee.joiningDate
                        }
                      </td>

                      {/* Status */}

                      <td className="px-3 py-4">
                        <span
                          className={`
                            inline-flex
                            max-w-full
                            rounded-full
                            px-2 py-1
                            text-[10px]
                            font-semibold
                            ${getStatusClass(
                              employee.employmentStatus,
                            )}
                          `}
                        >
                          {
                            employee.employmentStatus
                          }
                        </span>
                      </td>

                      {/* Actions */}

                      <td className="px-3 py-4">
                        <div className="flex justify-end gap-1">
                          {/* View */}

                          <button
                            type="button"
                            title="View"
                            onClick={() =>
                              openViewModal(
                                employee,
                              )
                            }
                            className="
                              flex h-8 w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-[#667085]
                              hover:bg-[#EAF2FF]
                              hover:text-[#0066FF]
                              dark:text-[#B3B3B3]
                              dark:hover:bg-[#292929]
                              dark:hover:text-[#1E90FF]
                            "
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit */}

                          <button
                            type="button"
                            title="Edit"
                            onClick={() =>
                              openEditModal(
                                employee,
                              )
                            }
                            className="
                              flex h-8 w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-[#667085]
                              hover:bg-[#EAF2FF]
                              hover:text-[#0066FF]
                              dark:text-[#B3B3B3]
                              dark:hover:bg-[#292929]
                              dark:hover:text-[#1E90FF]
                            "
                          >
                            <Edit size={16} />
                          </button>

                          {/* Delete */}

                          <button
                            type="button"
                            title="Delete"
                            disabled={
                              actionLoading
                            }
                            onClick={() =>
                              handleDelete(
                                employee,
                              )
                            }
                            className="
                              flex h-8 w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-[#667085]
                              hover:bg-red-50
                              hover:text-red-600
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                              dark:text-[#B3B3B3]
                              dark:hover:bg-[#292929]
                              dark:hover:text-[#FF8A8A]
                            "
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>

        {/* ----------------------------------------------------------
            MOBILE / TABLET CARDS
        ---------------------------------------------------------- */}

        <div
          className="
            grid min-w-0 grid-cols-1
            gap-3 p-3 xl:hidden
          "
        >
          {loading ? (
            <div
              className="
                px-4 py-12
                text-center text-sm
                text-[#667085]
                dark:text-[#B3B3B3]
              "
            >
              Loading employees...
            </div>
          ) : filteredEmployees.length ===
            0 ? (
            <div
              className="
                px-4 py-12
                text-center text-sm
                text-[#667085]
                dark:text-[#B3B3B3]
              "
            >
              No employees found.
            </div>
          ) : (
            filteredEmployees.map(
              (employee) => (
                <div
                  key={employee.id}
                  className="
                    min-w-0 rounded-xl border
                    p-4
                    border-[#E1E5EA]
                    bg-white
                    dark:border-[#333333]
                    dark:bg-[#222222]
                  "
                >
                  <div
                    className="
                      flex min-w-0
                      items-start
                      justify-between gap-3
                    "
                  >
                    <div
                      className="
                        flex min-w-0
                        items-center gap-3
                      "
                    >
                      <div
                        className="
                          flex h-11 w-11
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-[#E5F0FF]
                          text-sm font-bold
                          text-[#0066FF]
                          dark:bg-[#292929]
                          dark:text-[#1E90FF]
                        "
                      >
                        {employee.fullName
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p
                          className="
                            truncate
                            text-sm font-semibold
                          "
                        >
                          {employee.fullName}
                        </p>

                        <p
                          className="
                            mt-0.5 text-xs
                            text-[#667085]
                            dark:text-[#B3B3B3]
                          "
                        >
                          {
                            employee.employeeId
                          }
                        </p>
                      </div>
                    </div>

                    <span
                      className={`
                        shrink-0 rounded-full
                        px-2.5 py-1
                        text-[10px]
                        font-semibold
                        ${getStatusClass(
                          employee.employmentStatus,
                        )}
                      `}
                    >
                      {
                        employee.employmentStatus
                      }
                    </span>
                  </div>

                  <div
                    className="
                      mt-4 grid min-w-0
                      grid-cols-1 gap-3
                      text-sm sm:grid-cols-2
                    "
                  >
                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Email
                      </p>

                      <p className="mt-0.5 break-all">
                        {employee.email}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Phone
                      </p>

                      <p className="mt-0.5 break-all">
                        {employee.phone}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Department
                      </p>

                      <p className="mt-0.5 truncate">
                        {getDepartmentName(
                          employee.departmentId,
                        )}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Designation
                      </p>

                      <p className="mt-0.5 truncate">
                        {
                          employee.designation
                        }
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Manager
                      </p>

                      <p className="mt-0.5 truncate">
                        {getManagerName(
                          employee.managerId,
                        )}
                      </p>
                    </div>

                    <div>
                      <p
                        className="
                          text-xs
                          text-[#98A2B3]
                        "
                      >
                        Joining Date
                      </p>

                      <p className="mt-0.5">
                        {
                          employee.joiningDate
                        }
                      </p>
                    </div>
                  </div>

                  <div
                    className="
                      mt-4 flex flex-wrap
                      justify-end gap-2
                      border-t
                      border-[#EEF3F7]
                      pt-3
                      dark:border-[#333333]
                    "
                  >
                    {/* View */}

                    <button
                      type="button"
                      onClick={() =>
                        openViewModal(
                          employee,
                        )
                      }
                      className="
                        flex h-9
                        items-center gap-1.5
                        rounded-lg px-3
                        text-xs font-semibold
                        text-[#667085]
                        hover:bg-[#EAF2FF]
                        hover:text-[#0066FF]
                        dark:text-[#B3B3B3]
                        dark:hover:bg-[#292929]
                        dark:hover:text-[#1E90FF]
                      "
                    >
                      <Eye size={15} />
                      View
                    </button>

                    {/* Edit */}

                    <button
                      type="button"
                      onClick={() =>
                        openEditModal(
                          employee,
                        )
                      }
                      className="
                        flex h-9
                        items-center gap-1.5
                        rounded-lg px-3
                        text-xs font-semibold
                        text-[#667085]
                        hover:bg-[#EAF2FF]
                        hover:text-[#0066FF]
                        dark:text-[#B3B3B3]
                        dark:hover:bg-[#292929]
                        dark:hover:text-[#1E90FF]
                      "
                    >
                      <Edit size={15} />
                      Edit
                    </button>

                    {/* Delete */}

                    <button
                      type="button"
                      disabled={
                        actionLoading
                      }
                      onClick={() =>
                        handleDelete(
                          employee,
                        )
                      }
                      className="
                        flex h-9
                        items-center gap-1.5
                        rounded-lg px-3
                        text-xs font-semibold
                        text-[#667085]
                        hover:bg-red-50
                        hover:text-red-600
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                        dark:text-[#B3B3B3]
                        dark:hover:bg-[#292929]
                        dark:hover:text-[#FF8A8A]
                      "
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </section>

      {/* ============================================================
          ADD / EDIT MODAL
      ============================================================ */}

      {(modalMode === "add" ||
        modalMode === "edit") && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center
            justify-center
            bg-black/50 p-3
            backdrop-blur-[2px]
            sm:p-4
          "
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className="
              w-full max-w-2xl
              rounded-2xl border
              border-[#E1E5EA]
              bg-white shadow-2xl
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            {/* Modal Header */}

            <div
              className="
                flex items-center
                justify-between
                border-b px-4 py-3
                border-[#E1E5EA]
                dark:border-[#333333]
                sm:px-5 sm:py-4
              "
            >
              <div className="min-w-0">
                <h2 className="text-lg font-bold">
                  {modalMode === "add"
                    ? "Add Employee"
                    : "Edit Employee"}
                </h2>

                <p
                  className="
                    mt-0.5 text-xs
                    text-[#667085]
                    dark:text-[#B3B3B3]
                  "
                >
                  {modalMode === "add"
                    ? "Create a new employee record."
                    : "Update employee information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="
                  flex h-9 w-9 shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-[#667085]
                  hover:bg-[#F1F5F9]
                  dark:text-[#B3B3B3]
                  dark:hover:bg-[#292929]
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}

            <form
              onSubmit={handleSubmit}
              className="
                space-y-4 p-4
                sm:space-y-5 sm:p-5
              "
            >
              {formError && (
                <div
                  className="
                    rounded-xl border
                    px-4 py-3 text-sm
                    border-red-200
                    bg-red-50
                    text-red-700
                    dark:border-[#444444]
                    dark:bg-[#1F1F1F]
                    dark:text-[#FFB4B4]
                  "
                >
                  {formError}
                </div>
              )}

              <div
                className="
                  grid grid-cols-1
                  gap-3 sm:grid-cols-2
                  sm:gap-4
                "
              >
                {/* Employee ID */}

                <FormInput
                  label="Employee ID"
                  value={
                    formData.employeeId
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "employeeId",
                      value,
                    )
                  }
                  required
                />

                {/* Full Name */}

                <FormInput
                  label="Full Name"
                  value={
                    formData.fullName
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "fullName",
                      value,
                    )
                  }
                  required
                />

                {/* Email */}

                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) =>
                    handleInputChange(
                      "email",
                      value,
                    )
                  }
                  required
                />

                {/* Phone */}

                <FormInput
                  label="Phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(value) =>
                    handleInputChange(
                      "phone",
                      value,
                    )
                  }
                  required
                />

                {/* ==================================================
                    DEPARTMENT
                    ==================================================
                    This is the corrected section.
                    departmentOptions always contains defaults.
                */}

                <FormSelect
                  label="Department"
                  value={
                    formData.departmentId
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "departmentId",
                      value,
                    )
                  }
                  options={
                    departmentOptions
                  }
                  placeholder="Select department"
                  required
                />

                {/* Designation */}

                <FormInput
                  label="Designation"
                  value={
                    formData.designation
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "designation",
                      value,
                    )
                  }
                  required
                />

                {/* Manager */}

                <FormSelect
                  label="Manager"
                  value={
                    formData.managerId
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "managerId",
                      value,
                    )
                  }
                  options={employees
                    .filter(
                      (employee) =>
                        employee.id !==
                        selectedEmployee?.id,
                    )
                    .map((employee) => ({
                      value:
                        employee.employeeId,
                      label:
                        employee.fullName,
                    }))}
                  placeholder="No manager"
                />

                {/* Joining Date */}

                <FormInput
                  label="Joining Date"
                  type="date"
                  value={
                    formData.joiningDate
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "joiningDate",
                      value,
                    )
                  }
                  required
                />

                {/* Employment Status */}

                <FormSelect
                  label="Employment Status"
                  value={
                    formData.employmentStatus
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "employmentStatus",
                      value as Employee["employmentStatus"],
                    )
                  }
                  options={[
                    {
                      value: "Active",
                      label: "Active",
                    },
                    {
                      value: "Inactive",
                      label: "Inactive",
                    },
                    {
                      value: "On Notice",
                      label: "On Notice",
                    },
                    {
                      value: "Resigned",
                      label: "Resigned",
                    },
                  ]}
                />

                {/* Profile Image */}

                <FormInput
                  label="Profile Image URL"
                  value={
                    formData.profileImage
                  }
                  onChange={(value) =>
                    handleInputChange(
                      "profileImage",
                      value,
                    )
                  }
                />
              </div>

              {/* Buttons */}

              <div
                className="
                  flex flex-col-reverse
                  gap-3 border-t
                  border-[#E1E5EA]
                  pt-4
                  sm:flex-row
                  sm:justify-end
                  dark:border-[#333333]
                "
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="
                    h-10 rounded-xl
                    border px-4
                    text-sm font-semibold
                    border-[#E1E5EA]
                    bg-white
                    text-[#1A1A2E]
                    hover:bg-[#F8F9FA]
                    dark:border-[#333333]
                    dark:bg-[#222222]
                    dark:text-white
                    dark:hover:bg-[#292929]
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="
                    h-10 rounded-xl
                    bg-[#0066FF]
                    px-5
                    text-sm font-semibold
                    text-white
                    hover:bg-[#0052CC]
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:bg-[#1E90FF]
                    dark:hover:bg-[#187BD0]
                  "
                >
                  {actionLoading
                    ? "Saving..."
                    : modalMode === "add"
                      ? "Add Employee"
                      : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          VIEW MODAL
      ============================================================ */}

      {modalMode === "view" &&
        selectedEmployee && (
          <div
            className="
              fixed inset-0 z-[100]
              flex items-center
              justify-center
              bg-black/50 p-3
              backdrop-blur-[2px]
              sm:p-4
            "
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                closeModal();
              }
            }}
          >
            <div
              className="
                w-full max-w-xl
                rounded-2xl border
                border-[#E1E5EA]
                bg-white shadow-2xl
                dark:border-[#333333]
                dark:bg-[#181818]
              "
            >
              {/* Header */}

              <div
                className="
                  flex items-center
                  justify-between
                  border-b px-4 py-3
                  border-[#E1E5EA]
                  dark:border-[#333333]
                  sm:px-5 sm:py-4
                "
              >
                <div>
                  <h2 className="text-lg font-bold">
                    Employee Details
                  </h2>

                  <p
                    className="
                      mt-0.5 text-xs
                      text-[#667085]
                      dark:text-[#B3B3B3]
                    "
                  >
                    Complete employee
                    information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="
                    flex h-9 w-9
                    items-center
                    justify-center
                    rounded-lg
                    text-[#667085]
                    hover:bg-[#F1F5F9]
                    dark:text-[#B3B3B3]
                    dark:hover:bg-[#292929]
                  "
                >
                  <X size={18} />
                </button>
              </div>

              {/* Details */}

              <div className="p-4 sm:p-5">
                <div
                  className="
                    flex items-center gap-4
                  "
                >
                  <div
                    className="
                      flex h-14 w-14
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#E5F0FF]
                      text-xl font-bold
                      text-[#0066FF]
                      dark:bg-[#292929]
                      dark:text-[#1E90FF]
                      sm:h-16 sm:w-16
                    "
                  >
                    {selectedEmployee.fullName
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <h3
                      className="
                        truncate
                        text-lg font-bold
                        sm:text-xl
                      "
                    >
                      {
                        selectedEmployee.fullName
                      }
                    </h3>

                    <p
                      className="
                        mt-1 text-sm
                        text-[#667085]
                        dark:text-[#B3B3B3]
                      "
                    >
                      {
                        selectedEmployee.employeeId
                      }
                    </p>
                  </div>
                </div>

                <div
                  className="
                    mt-5 grid
                    grid-cols-1 gap-4
                    sm:mt-6 sm:grid-cols-2
                  "
                >
                  <DetailItem
                    label="Email"
                    value={
                      selectedEmployee.email
                    }
                  />

                  <DetailItem
                    label="Phone"
                    value={
                      selectedEmployee.phone
                    }
                  />

                  <DetailItem
                    label="Department"
                    value={getDepartmentName(
                      selectedEmployee.departmentId,
                    )}
                  />

                  <DetailItem
                    label="Designation"
                    value={
                      selectedEmployee.designation
                    }
                  />

                  <DetailItem
                    label="Manager"
                    value={getManagerName(
                      selectedEmployee.managerId,
                    )}
                  />

                  <DetailItem
                    label="Joining Date"
                    value={
                      selectedEmployee.joiningDate
                    }
                  />

                  <div>
                    <p
                      className="
                        text-xs
                        text-[#98A2B3]
                      "
                    >
                      Employment Status
                    </p>

                    <span
                      className={`
                        mt-1 inline-flex
                        rounded-full
                        px-2.5 py-1
                        text-[11px]
                        font-semibold
                        ${getStatusClass(
                          selectedEmployee.employmentStatus,
                        )}
                      `}
                    >
                      {
                        selectedEmployee.employmentStatus
                      }
                    </span>
                  </div>

                  <DetailItem
                    label="Created Date"
                    value={
                      selectedEmployee.createdDate
                    }
                  />
                </div>

                {/* Edit Button */}

                <div
                  className="
                    mt-5 flex justify-end
                    border-t
                    border-[#E1E5EA]
                    pt-4
                    dark:border-[#333333]
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      openEditModal(
                        selectedEmployee,
                      )
                    }
                    className="
                      inline-flex h-10
                      items-center gap-2
                      rounded-xl px-4
                      text-sm font-semibold
                      text-white
                      bg-[#0066FF]
                      hover:bg-[#0052CC]
                      dark:bg-[#1E90FF]
                      dark:hover:bg-[#187BD0]
                    "
                  >
                    <Edit size={16} />
                    Edit Employee
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

// ==================================================================
// FORM INPUT
// ==================================================================

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: FormInputProps) {
  return (
    <label className="block min-w-0">
      <span
        className="
          mb-1.5 block text-xs
          font-semibold
          text-[#667085]
          dark:text-[#B3B3B3]
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="
          h-10 w-full min-w-0
          rounded-xl border px-3
          text-sm outline-none
          border-[#E1E5EA]
          bg-[#F8F9FA]
          text-[#1A1A2E]
          focus:border-[#0066FF]
          dark:border-[#333333]
          dark:bg-[#222222]
          dark:text-white
          dark:focus:border-[#1E90FF]
        "
      />
    </label>
  );
}

// ==================================================================
// FORM SELECT
// ==================================================================

interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: DepartmentOption[];
  placeholder?: string;
  required?: boolean;
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}: FormSelectProps) {
  return (
    <label className="block min-w-0">
      <span
        className="
          mb-1.5 block text-xs
          font-semibold
          text-[#667085]
          dark:text-[#B3B3B3]
        "
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className="
          h-10 w-full min-w-0
          rounded-xl border px-3
          text-sm outline-none
          border-[#E1E5EA]
          bg-[#F8F9FA]
          text-[#1A1A2E]
          focus:border-[#0066FF]
          dark:border-[#333333]
          dark:bg-[#222222]
          dark:text-white
          dark:focus:border-[#1E90FF]
        "
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

// ==================================================================
// DETAIL ITEM
// ==================================================================

interface DetailItemProps {
  label: string;
  value: string;
}

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="min-w-0">
      <p
        className="
          text-xs
          text-[#98A2B3]
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1 break-words
          text-sm font-medium
        "
      >
        {value || "—"}
      </p>
    </div>
  );
}