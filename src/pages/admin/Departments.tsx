import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Edit3,
  Eye,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { api } from "../../services/api";

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status: "Active" | "Inactive";
  createdDate: string;
}

type ModalMode = "add" | "edit" | "view" | null;

interface DepartmentForm {
  departmentId: string;
  name: string;
  status: "Active" | "Inactive";
}

const DEFAULT_DEPARTMENTS: Department[] = [
  {
    id: "1",
    departmentId: "DEP001",
    name: "Development",
    status: "Active",
    createdDate: "2026-01-05",
  },
  {
    id: "2",
    departmentId: "DEP002",
    name: "Human Resources",
    status: "Active",
    createdDate: "2026-01-06",
  },
  {
    id: "3",
    departmentId: "DEP003",
    name: "Finance",
    status: "Active",
    createdDate: "2026-01-07",
  },
  {
    id: "4",
    departmentId: "DEP004",
    name: "Marketing",
    status: "Active",
    createdDate: "2026-01-08",
  },
  {
    id: "5",
    departmentId: "DEP005",
    name: "Sales",
    status: "Active",
    createdDate: "2026-01-09",
  },
  {
    id: "6",
    departmentId: "DEP006",
    name: "Operations",
    status: "Active",
    createdDate: "2026-01-10",
  },
  {
    id: "7",
    departmentId: "DEP007",
    name: "Support",
    status: "Active",
    createdDate: "2026-01-11",
  },
];

const emptyForm: DepartmentForm = {
  departmentId: "",
  name: "",
  status: "Active",
};

export default function Departments() {
  const [departments, setDepartments] =
    useState<Department[]>(DEFAULT_DEPARTMENTS);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Active" | "Inactive"
  >("All");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);

  const [form, setForm] = useState<DepartmentForm>(emptyForm);

  const [errors, setErrors] = useState<{
    departmentId?: string;
    name?: string;
  }>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [deleteDepartment, setDeleteDepartment] =
    useState<Department | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDepartments = async () => {
      try {
        const response = await api.get<Department[]>("/departments");

        if (cancelled) return;

        if (Array.isArray(response.data) && response.data.length > 0) {
          const normalizedDepartments = response.data.map(
            (department, index) => ({
              id: String(department.id ?? index + 1),
              departmentId:
                department.departmentId ||
                `DEP${String(index + 1).padStart(3, "0")}`,
              name: department.name || "",
              status: department.status || "Active",
              createdDate:
                department.createdDate ||
                new Date().toISOString().split("T")[0],
            }),
          );

          setDepartments(normalizedDepartments);
        } else {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to fetch departments:", error);
        setDepartments(DEFAULT_DEPARTMENTS);
        setErrorMessage(
          "Unable to load departments from the server. Showing default departments.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDepartments();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDepartments = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return departments.filter((department) => {
      const matchesSearch =
        !search ||
        department.departmentId.toLowerCase().includes(search) ||
        department.name.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || department.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  const activeCount = departments.filter(
    (department) => department.status === "Active",
  ).length;

  const inactiveCount = departments.filter(
    (department) => department.status === "Inactive",
  ).length;

  const openAddModal = () => {
    const nextNumber = departments.length + 1;

    setForm({
      departmentId: `DEP${String(nextNumber).padStart(3, "0")}`,
      name: "",
      status: "Active",
    });

    setSelectedDepartment(null);
    setErrors({});
    setModalMode("add");
    setErrorMessage("");
  };

  const openEditModal = (department: Department) => {
    setSelectedDepartment(department);

    setForm({
      departmentId: department.departmentId,
      name: department.name,
      status: department.status,
    });

    setErrors({});
    setModalMode("edit");
    setErrorMessage("");
  };

  const openViewModal = (department: Department) => {
    setSelectedDepartment(department);
    setModalMode("view");
  };

  const closeModal = () => {
    if (saving) return;

    setModalMode(null);
    setSelectedDepartment(null);
    setForm(emptyForm);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: {
      departmentId?: string;
      name?: string;
    } = {};

    const departmentId = form.departmentId.trim();
    const name = form.name.trim();

    if (!departmentId) {
      newErrors.departmentId = "Department ID is required.";
    } else if (!/^DEP\d{3,}$/i.test(departmentId)) {
      newErrors.departmentId =
        "Department ID must be in the format DEP001.";
    }

    if (!name) {
      newErrors.name = "Department name is required.";
    } else if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)) {
      newErrors.name =
        "Department name can contain only letters and spaces.";
    } else if (name.length < 2) {
      newErrors.name = "Department name must contain at least 2 letters.";
    }

    const duplicate = departments.some(
      (department) =>
        department.name.toLowerCase() === name.toLowerCase() &&
        department.id !== selectedDepartment?.id,
    );

    if (duplicate) {
      newErrors.name = "This department already exists.";
    }

    const duplicateId = departments.some(
      (department) =>
        department.departmentId.toLowerCase() === departmentId.toLowerCase() &&
        department.id !== selectedDepartment?.id,
    );

    if (duplicateId) {
      newErrors.departmentId = "This Department ID already exists.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (
    field: keyof DepartmentForm,
    value: string,
  ) => {
    if (field === "name") {
      const cleanedValue = value.replace(/[^A-Za-z\s]/g, "");

      setForm((current) => ({
        ...current,
        name: cleanedValue,
      }));

      setErrors((current) => ({
        ...current,
        name: "",
      }));

      return;
    }

    if (field === "departmentId") {
      const cleanedValue = value
        .replace(/[^A-Za-z0-9]/g, "")
        .toUpperCase();

      setForm((current) => ({
        ...current,
        departmentId: cleanedValue,
      }));

      setErrors((current) => ({
        ...current,
        departmentId: "",
      }));

      return;
    }

    if (field === "status") {
      setForm((current) => ({
        ...current,
        status: value as "Active" | "Inactive",
      }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      departmentId: form.departmentId.trim().toUpperCase(),
      name: form.name.trim(),
      status: form.status,
      createdDate:
        selectedDepartment?.createdDate ||
        new Date().toISOString().split("T")[0],
    };

    try {
      if (modalMode === "add") {
        const response = await api.post<Department>(
          "/departments",
          payload,
        );

        const createdDepartment: Department = {
          ...payload,
          id: String(response.data.id),
        };

        setDepartments((current) => [
          ...current,
          createdDepartment,
        ]);

        setSuccessMessage("Department added successfully.");
      }

      if (modalMode === "edit" && selectedDepartment) {
        const response = await api.put<Department>(
          `/departments/${selectedDepartment.id}`,
          {
            ...selectedDepartment,
            ...payload,
          },
        );

        const updatedDepartment: Department = {
          ...selectedDepartment,
          ...payload,
          id: String(response.data.id ?? selectedDepartment.id),
        };

        setDepartments((current) =>
          current.map((department) =>
            department.id === selectedDepartment.id
              ? updatedDepartment
              : department,
          ),
        );

        setSuccessMessage("Department updated successfully.");
      }

      setModalMode(null);
      setSelectedDepartment(null);
      setForm(emptyForm);
      setErrors({});
    } catch (error) {
      console.error("Failed to save department:", error);

      /*
       * If JSON Server is unavailable, keep the UI usable.
       * The local state is updated so the user can continue testing.
       */
      if (modalMode === "add") {
        const fallbackDepartment: Department = {
          ...payload,
          id: `local-${Date.now()}`,
        };

        setDepartments((current) => [
          ...current,
          fallbackDepartment,
        ]);

        setSuccessMessage(
          "Department added locally. JSON Server is not available.",
        );

        setModalMode(null);
        setForm(emptyForm);
        setErrors({});
      } else if (modalMode === "edit" && selectedDepartment) {
        const updatedDepartment: Department = {
          ...selectedDepartment,
          ...payload,
        };

        setDepartments((current) =>
          current.map((department) =>
            department.id === selectedDepartment.id
              ? updatedDepartment
              : department,
          ),
        );

        setSuccessMessage(
          "Department updated locally. JSON Server is not available.",
        );

        setModalMode(null);
        setSelectedDepartment(null);
        setForm(emptyForm);
        setErrors({});
      } else {
        setErrorMessage(
          "Unable to save the department. Please check that JSON Server is running.",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteDepartment) return;

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.delete(`/departments/${deleteDepartment.id}`);

      setDepartments((current) =>
        current.filter(
          (department) => department.id !== deleteDepartment.id,
        ),
      );

      setSuccessMessage("Department deleted successfully.");
      setDeleteDepartment(null);
    } catch (error) {
      console.error("Failed to delete department:", error);

      /*
       * Local fallback for testing when JSON Server is unavailable.
       */
      setDepartments((current) =>
        current.filter(
          (department) => department.id !== deleteDepartment.id,
        ),
      );

      setSuccessMessage(
        "Department deleted locally. JSON Server is not available.",
      );
      setDeleteDepartment(null);
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
              <Building2 size={20} />
            </div>

            <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Administration
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Departments
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
            Manage company departments and their status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white transition hover:bg-[#0052CC] focus:outline-none focus:ring-2 focus:ring-[#0066FF]/30 dark:bg-[#1E90FF] dark:hover:bg-[#187BD1]"
        >
          <Plus size={18} />
          Add Department
        </button>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#E1E5EA] bg-white p-5 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
          <p className="text-sm font-medium text-[#667085] dark:text-[#B3B3B3]">
            Total Departments
          </p>

          <p className="mt-2 text-3xl font-bold">
            {departments.length}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EA] bg-white p-5 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
          <p className="text-sm font-medium text-[#667085] dark:text-[#B3B3B3]">
            Active
          </p>

          <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E1E5EA] bg-white p-5 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
          <p className="text-sm font-medium text-[#667085] dark:text-[#B3B3B3]">
            Inactive
          </p>

          <p className="mt-2 text-3xl font-bold text-gray-500 dark:text-gray-300">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="flex flex-col gap-3 md:flex-row">
          {/* SEARCH */}
          <div className="relative min-w-0 flex-1">
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
              placeholder="Search by department ID or name..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-4 text-sm text-[#1A1A2E] outline-none transition placeholder:text-[#98A2B3] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:placeholder:text-[#777777] dark:focus:border-[#1E90FF]"
            />
          </div>

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | "Active"
                  | "Inactive",
              )
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-4 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* DEPARTMENT TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                Department List
              </h2>

              <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                {filteredDepartments.length} department
                {filteredDepartments.length !== 1 ? "s" : ""} found
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center px-5 py-10">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0066FF]/20 border-t-[#0066FF] dark:border-[#1E90FF]/20 dark:border-t-[#1E90FF]" />

              <p className="mt-3 text-sm text-[#667085] dark:text-[#B3B3B3]">
                Loading departments...
              </p>
            </div>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
              <Building2 size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold">
              No departments found
            </h3>

            <p className="mt-1 max-w-md text-sm text-[#667085] dark:text-[#B3B3B3]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] text-left dark:border-[#333333] dark:bg-[#111111]">
                    <th className="w-[18%] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Department ID
                    </th>

                    <th className="w-[30%] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Department Name
                    </th>

                    <th className="w-[18%] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Status
                    </th>

                    <th className="w-[18%] px-5 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Created Date
                    </th>

                    <th className="w-[16%] px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDepartments.map((department) => (
                    <tr
                      key={department.id}
                      className="border-b border-[#E1E5EA] last:border-b-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                          {department.departmentId}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-medium">
                          {department.name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={department.status} />
                      </td>

                      <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
                        {formatDate(department.createdDate)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label="View"
                            onClick={() =>
                              openViewModal(department)
                            }
                          >
                            <Eye size={17} />
                          </ActionButton>

                          <ActionButton
                            label="Edit"
                            onClick={() =>
                              openEditModal(department)
                            }
                          >
                            <Edit3 size={17} />
                          </ActionButton>

                          <ActionButton
                            label="Delete"
                            danger
                            onClick={() =>
                              setDeleteDepartment(department)
                            }
                          >
                            <Trash2 size={17} />
                          </ActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
              {filteredDepartments.map((department) => (
                <div
                  key={department.id}
                  className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#111111]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                        {department.departmentId}
                      </p>

                      <h3 className="mt-1 truncate text-base font-semibold">
                        {department.name}
                      </h3>
                    </div>

                    <StatusBadge status={department.status} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
                        Created
                      </p>

                      <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
                        {formatDate(department.createdDate)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <ActionButton
                        label="View"
                        onClick={() =>
                          openViewModal(department)
                        }
                      >
                        <Eye size={16} />
                      </ActionButton>

                      <ActionButton
                        label="Edit"
                        onClick={() =>
                          openEditModal(department)
                        }
                      >
                        <Edit3 size={16} />
                      </ActionButton>

                      <ActionButton
                        label="Delete"
                        danger
                        onClick={() =>
                          setDeleteDepartment(department)
                        }
                      >
                        <Trash2 size={16} />
                      </ActionButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <h2 className="text-lg font-bold">
                  {modalMode === "add"
                    ? "Add Department"
                    : "Edit Department"}
                </h2>

                <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                  {modalMode === "add"
                    ? "Create a new department."
                    : "Update department information."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#1A1A2E] disabled:cursor-not-allowed disabled:opacity-50 dark:text-[#B3B3B3] dark:hover:bg-[#292929] dark:hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="space-y-4 px-5 py-5">
              {/* DEPARTMENT ID */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Department ID
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.departmentId}
                  onChange={(event) =>
                    handleFormChange(
                      "departmentId",
                      event.target.value,
                    )
                  }
                  placeholder="DEP001"
                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition dark:bg-[#111111] dark:text-white ${
                    errors.departmentId
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/10"
                      : "border-[#D0D5DD] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                  }`}
                />

                {errors.departmentId && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.departmentId}
                  </p>
                )}
              </div>

              {/* DEPARTMENT NAME */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Department Name
                  <span className="ml-1 text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    handleFormChange("name", event.target.value)
                  }
                  placeholder="Enter department name"
                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none transition dark:bg-[#111111] dark:text-white ${
                    errors.name
                      ? "border-red-500 focus:ring-2 focus:ring-red-500/10"
                      : "border-[#D0D5DD] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                  }`}
                />

                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* STATUS */}
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    handleFormChange(
                      "status",
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#E1E5EA] px-5 py-4 sm:flex-row sm:justify-end dark:border-[#333333]">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E90FF] dark:hover:bg-[#187BD1]"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    {modalMode === "add"
                      ? "Add Department"
                      : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {modalMode === "view" && selectedDepartment && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[460px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                  Department Details
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  {selectedDepartment.name}
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
              <DetailRow
                label="Department ID"
                value={selectedDepartment.departmentId}
              />

              <DetailRow
                label="Department Name"
                value={selectedDepartment.name}
              />

              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-[#667085] dark:text-[#B3B3B3]">
                  Status
                </span>

                <StatusBadge status={selectedDepartment.status} />
              </div>

              <DetailRow
                label="Created Date"
                value={formatDate(selectedDepartment.createdDate)}
              />
            </div>

            <div className="border-t border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 w-full rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white transition hover:bg-[#0052CC] dark:bg-[#1E90FF] dark:hover:bg-[#187BD1]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteDepartment && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setDeleteDepartment(null);
            }
          }}
        >
          <div className="w-full max-w-[420px] rounded-2xl border border-[#E1E5EA] bg-white p-5 shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <Trash2 size={21} />
            </div>

            <h2 className="mt-4 text-lg font-bold">
              Delete Department?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-[#B3B3B3]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1A1A2E] dark:text-white">
                {deleteDepartment.name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteDepartment(null)}
                disabled={saving}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50 dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={17} />
                    Delete
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

/* STATUS BADGE */

function StatusBadge({
  status,
}: {
  status: "Active" | "Inactive";
}) {
  if (status === "Active") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700 dark:bg-green-950/40 dark:text-green-400">
        Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
      Inactive
    </span>
  );
}

/* ACTION BUTTON */

function ActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
        danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
          : "text-[#667085] hover:bg-[#F2F4F7] hover:text-[#0066FF] dark:text-[#B3B3B3] dark:hover:bg-[#292929] dark:hover:text-[#1E90FF]"
      }`}
    >
      {children}
    </button>
  );
}

/* DETAIL ROW */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#E1E5EA] pb-3 dark:border-[#333333]">
      <span className="text-sm text-[#667085] dark:text-[#B3B3B3]">
        {label}
      </span>

      <span className="text-right text-sm font-semibold">
        {value}
      </span>
    </div>
  );
}