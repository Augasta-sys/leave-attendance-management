import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Eye,
  FileText,
  Plus,
  Search,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

import { api } from "../../services/api";

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  daysAllowed: number;
  description?: string;
  status?: "Active" | "Inactive";
  createdDate?: string;
}

type LeaveTypeStatus = "Active" | "Inactive";

interface LeaveTypeForm {
  leaveTypeId: string;
  name: string;
  daysAllowed: string;
  description: string;
  status: LeaveTypeStatus;
}

interface DetailItemProps {
  label: string;
  value: ReactNode;
}

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: "1",
    leaveTypeId: "LT001",
    name: "Casual Leave",
    daysAllowed: 12,
    description: "Leave for personal or casual requirements.",
    status: "Active",
    createdDate: "2026-01-01",
  },
  {
    id: "2",
    leaveTypeId: "LT002",
    name: "Sick Leave",
    daysAllowed: 10,
    description: "Leave for illness or medical reasons.",
    status: "Active",
    createdDate: "2026-01-01",
  },
  {
    id: "3",
    leaveTypeId: "LT003",
    name: "Earned Leave",
    daysAllowed: 15,
    description: "Annual earned leave available to employees.",
    status: "Active",
    createdDate: "2026-01-01",
  },
  {
    id: "4",
    leaveTypeId: "LT004",
    name: "Maternity Leave",
    daysAllowed: 180,
    description: "Leave provided for maternity purposes.",
    status: "Active",
    createdDate: "2026-01-01",
  },
  {
    id: "5",
    leaveTypeId: "LT005",
    name: "Paternity Leave",
    daysAllowed: 15,
    description: "Leave provided for paternity purposes.",
    status: "Active",
    createdDate: "2026-01-01",
  },
];

const EMPTY_FORM: LeaveTypeForm = {
  leaveTypeId: "",
  name: "",
  daysAllowed: "",
  description: "",
  status: "Active",
};

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#101010]">
      <p className="mb-1 text-xs font-medium text-[#667085] dark:text-[#A0A0A0]">
        {label}
      </p>

      <p className="break-words text-sm font-semibold text-[#1A1A2E] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function getStatusClass(status: LeaveTypeStatus) {
  if (status === "Active") {
    return "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400";
  }

  return "bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(date?: string) {
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
}

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveTypeStatus>(
    "all",
  );

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");

  const [selectedLeaveType, setSelectedLeaveType] =
    useState<LeaveType | null>(null);

  const [form, setForm] = useState<LeaveTypeForm>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchLeaveTypes = async () => {
      try {
        setLoading(true);

        const response = await api.get<LeaveType[]>("/leaveTypes");

        const apiLeaveTypes = response.data || [];

        const mergedLeaveTypes = [
          ...DEFAULT_LEAVE_TYPES,
          ...apiLeaveTypes.filter(
            (apiLeaveType) =>
              !DEFAULT_LEAVE_TYPES.some(
                (defaultLeaveType) =>
                  defaultLeaveType.leaveTypeId === apiLeaveType.leaveTypeId,
              ),
          ),
        ];

        setLeaveTypes(mergedLeaveTypes);
      } catch (fetchError) {
        console.error("Failed to fetch leave types:", fetchError);

        setLeaveTypes(DEFAULT_LEAVE_TYPES);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveTypes();
  }, []);

  useEffect(() => {
    if (!showModal && !deleteTarget) {
      document.body.style.overflow = "";
      return;
    }

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showModal, deleteTarget]);

  const filteredLeaveTypes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return leaveTypes.filter((leaveType) => {
      const matchesSearch =
        !search ||
        leaveType.leaveTypeId.toLowerCase().includes(search) ||
        leaveType.name.toLowerCase().includes(search) ||
        (leaveType.description || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ||
        (leaveType.status || "Active") === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leaveTypes, searchTerm, statusFilter]);

  const totalLeaveTypes = leaveTypes.length;

  const activeLeaveTypes = leaveTypes.filter(
    (leaveType) => (leaveType.status || "Active") === "Active",
  ).length;

  const inactiveLeaveTypes = leaveTypes.filter(
    (leaveType) => (leaveType.status || "Active") === "Inactive",
  ).length;

  const totalDays = leaveTypes.reduce(
    (total, leaveType) => total + Number(leaveType.daysAllowed || 0),
    0,
  );

  const openAddModal = () => {
    setModalMode("add");
    setSelectedLeaveType(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (leaveType: LeaveType) => {
    setModalMode("edit");
    setSelectedLeaveType(leaveType);

    setForm({
      leaveTypeId: leaveType.leaveTypeId,
      name: leaveType.name,
      daysAllowed: String(leaveType.daysAllowed),
      description: leaveType.description || "",
      status: leaveType.status || "Active",
    });

    setError("");
    setShowModal(true);
  };

  const openViewModal = (leaveType: LeaveType) => {
    setModalMode("view");
    setSelectedLeaveType(leaveType);
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedLeaveType(null);
    setError("");
  };

  const validateForm = () => {
    const leaveTypeId = form.leaveTypeId.trim();
    const name = form.name.trim();
    const daysAllowed = Number(form.daysAllowed);

    if (!/^LT\d{3,}$/i.test(leaveTypeId)) {
      return "Leave Type ID must be in the format LT001.";
    }

    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name)) {
      return "Leave type name can contain only letters and spaces.";
    }

    if (
      !form.daysAllowed.trim() ||
      !Number.isInteger(daysAllowed) ||
      daysAllowed <= 0
    ) {
      return "Days allowed must be a positive whole number.";
    }

    const duplicateId = leaveTypes.some(
      (leaveType) =>
        leaveType.leaveTypeId.toLowerCase() === leaveTypeId.toLowerCase() &&
        leaveType.id !== selectedLeaveType?.id,
    );

    if (duplicateId) {
      return "This Leave Type ID already exists.";
    }

    const duplicateName = leaveTypes.some(
      (leaveType) =>
        leaveType.name.toLowerCase() === name.toLowerCase() &&
        leaveType.id !== selectedLeaveType?.id,
    );

    if (duplicateName) {
      return "This leave type name already exists.";
    }

    return "";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: LeaveType = {
      id: selectedLeaveType?.id || Date.now().toString(),
      leaveTypeId: form.leaveTypeId.trim().toUpperCase(),
      name: form.name.trim(),
      daysAllowed: Number(form.daysAllowed),
      description: form.description.trim(),
      status: form.status,
      createdDate:
        selectedLeaveType?.createdDate ||
        new Date().toISOString().split("T")[0],
    };

    try {
      setSaving(true);
      setError("");

      if (modalMode === "add") {
        try {
          const response = await api.post<LeaveType>("/leaveTypes", payload);

          setLeaveTypes((current) => [...current, response.data]);
        } catch (postError) {
          console.error("Failed to save to JSON Server:", postError);

          setLeaveTypes((current) => [...current, payload]);
        }
      }

      if (modalMode === "edit" && selectedLeaveType) {
        try {
          const response = await api.put<LeaveType>(
            `/leaveTypes/${selectedLeaveType.id}`,
            payload,
          );

          setLeaveTypes((current) =>
            current.map((leaveType) =>
              leaveType.id === selectedLeaveType.id
                ? response.data
                : leaveType,
            ),
          );
        } catch (putError) {
          console.error("Failed to update JSON Server:", putError);

          setLeaveTypes((current) =>
            current.map((leaveType) =>
              leaveType.id === selectedLeaveType.id
                ? payload
                : leaveType,
            ),
          );
        }
      }

      setShowModal(false);
      setSelectedLeaveType(null);
    } catch (submitError) {
      console.error("Leave type operation failed:", submitError);
      setError("Unable to save leave type. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (leaveType: LeaveType) => {
    setDeleteTarget(leaveType);
    setDeleteError("");
  };

  const cancelDelete = () => {
    if (deleting) return;

    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setDeleteError("");

      try {
        const leaveRequestsResponse =
          await api.get<Array<{ leaveTypeId: string }>>("/leaveRequests");

        const isUsed = leaveRequestsResponse.data.some(
          (request) => request.leaveTypeId === deleteTarget.leaveTypeId,
        );

        if (isUsed) {
          setDeleteError(
            "This leave type is already used in leave requests and cannot be deleted.",
          );
          return;
        }
      } catch (checkError) {
        console.error("Unable to check leave requests:", checkError);
      }

      try {
        await api.delete(`/leaveTypes/${deleteTarget.id}`);
      } catch (deleteApiError) {
        console.error("Delete request failed:", deleteApiError);
      }

      setLeaveTypes((current) =>
        current.filter((leaveType) => leaveType.id !== deleteTarget.id),
      );

      setDeleteTarget(null);
    } catch (deleteErrorValue) {
      console.error("Delete leave type failed:", deleteErrorValue);
      setDeleteError("Unable to delete this leave type.");
    } finally {
      setDeleting(false);
    }
  };

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-white sm:text-3xl">
            Leave Types
          </h1>

          <p className="mt-1 text-sm text-[#667085] dark:text-[#A0A0A0]">
            Manage leave types and annual leave allowances.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="
            inline-flex h-11 items-center justify-center gap-2
            rounded-xl bg-[#0066FF] px-5
            text-sm font-semibold text-white
            shadow-sm transition
            hover:bg-[#0052CC]
            focus:outline-none focus:ring-2
            focus:ring-[#0066FF]/30
            dark:bg-[#1E90FF]
            dark:hover:bg-[#1877D5]
          "
        >
          <Plus size={18} />
          Add Leave Type
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Total Leave Types
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalLeaveTypes}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
              <CalendarDays size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Active
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {activeLeaveTypes}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Inactive
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {inactiveLeaveTypes}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400">
              <XCircle size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 dark:border-[#2D2D2D] dark:bg-[#181818]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                Total Allowed Days
              </p>

              <p className="mt-2 text-2xl font-bold text-[#1A1A2E] dark:text-white">
                {totalDays}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
              <Clock3 size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-[#2D2D2D] dark:bg-[#181818]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="
                pointer-events-none absolute left-4
                top-1/2 -translate-y-1/2
                text-[#98A2B3]
                dark:text-[#777777]
              "
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by ID, leave type or description..."
              className={`${inputClass} pl-11`}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | LeaveTypeStatus,
              )
            }
            className={inputClass}
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl border border-[#E5E7EB] bg-white dark:border-[#2D2D2D] dark:bg-[#181818]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D9E7FF] border-t-[#0066FF] dark:border-[#333333] dark:border-t-[#1E90FF]" />
          </div>
        ) : filteredLeaveTypes.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F2F4F7] text-[#667085] dark:bg-[#242424] dark:text-[#A0A0A0]">
              <FileText size={24} />
            </div>

            <h3 className="mt-4 text-base font-semibold text-[#1A1A2E] dark:text-white">
              No leave types found
            </h3>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#A0A0A0]">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F8F9FA] dark:border-[#2D2D2D] dark:bg-[#111111]">
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Leave Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Name
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Days Allowed
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Status
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Created Date
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#A0A0A0]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeaveTypes.map((leaveType) => {
                    const status = leaveType.status || "Active";

                    return (
                      <tr
                        key={leaveType.id}
                        className="border-b border-[#E5E7EB] last:border-b-0 hover:bg-[#F8F9FA] dark:border-[#2D2D2D] dark:hover:bg-[#202020]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                              {getInitials(leaveType.name)}
                            </div>

                            <span className="font-semibold text-[#1A1A2E] dark:text-white">
                              {leaveType.leaveTypeId}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-medium text-[#344054] dark:text-[#E5E5E5]">
                            {leaveType.name}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                            {leaveType.daysAllowed} days
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#667085] dark:text-[#A0A0A0]">
                          {formatDate(leaveType.createdDate)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openViewModal(leaveType)}
                              title="View"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#EEF4FF] hover:text-[#0066FF] dark:text-[#A0A0A0] dark:hover:bg-[#242424] dark:hover:text-[#1E90FF]"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModal(leaveType)}
                              title="Edit"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#EEF4FF] hover:text-[#0066FF] dark:text-[#A0A0A0] dark:hover:bg-[#242424] dark:hover:text-[#1E90FF]"
                            >
                              <Edit3 size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => confirmDelete(leaveType)}
                              title="Delete"
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-red-50 hover:text-red-600 dark:text-[#A0A0A0] dark:hover:bg-red-500/10 dark:hover:text-red-400"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {filteredLeaveTypes.map((leaveType) => {
                const status = leaveType.status || "Active";

                return (
                  <div
                    key={leaveType.id}
                    className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4 dark:border-[#333333] dark:bg-[#111111]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                          {getInitials(leaveType.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#1A1A2E] dark:text-white">
                            {leaveType.name}
                          </p>

                          <p className="mt-0.5 text-xs text-[#667085] dark:text-[#A0A0A0]">
                            {leaveType.leaveTypeId}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F2F4F7] p-3 dark:bg-[#202020]">
                        <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                          Days Allowed
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#1A1A2E] dark:text-white">
                          {leaveType.daysAllowed} days
                        </p>
                      </div>

                      <div className="rounded-xl bg-[#F2F4F7] p-3 dark:bg-[#202020]">
                        <p className="text-xs text-[#667085] dark:text-[#A0A0A0]">
                          Created
                        </p>

                        <p className="mt-1 text-sm font-bold text-[#1A1A2E] dark:text-white">
                          {formatDate(leaveType.createdDate)}
                        </p>
                      </div>
                    </div>

                    {leaveType.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-[#667085] dark:text-[#A0A0A0]">
                        {leaveType.description}
                      </p>
                    )}

                    <div className="mt-4 flex justify-end gap-2 border-t border-[#E5E7EB] pt-3 dark:border-[#333333]">
                      <button
                        type="button"
                        onClick={() => openViewModal(leaveType)}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#667085] transition hover:bg-[#EEF4FF] hover:text-[#0066FF] dark:text-[#A0A0A0] dark:hover:bg-[#242424] dark:hover:text-[#1E90FF]"
                      >
                        <Eye size={15} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(leaveType)}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-[#667085] transition hover:bg-[#EEF4FF] hover:text-[#0066FF] dark:text-[#A0A0A0] dark:hover:bg-[#242424] dark:hover:text-[#1E90FF]"
                      >
                        <Edit3 size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => confirmDelete(leaveType)}
                        className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit / View Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={closeModal}
        >
          <div
            className="
              w-full max-w-xl
              rounded-2xl border border-[#E1E5EA]
              bg-white shadow-2xl
              dark:border-[#333333]
              dark:bg-[#181818]
            "
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4 dark:border-[#333333] sm:px-6">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-white">
                  {modalMode === "add"
                    ? "Add Leave Type"
                    : modalMode === "edit"
                      ? "Edit Leave Type"
                      : "Leave Type Details"}
                </h2>

                <p className="mt-0.5 text-xs text-[#667085] dark:text-[#A0A0A0]">
                  {modalMode === "view"
                    ? "View leave type information."
                    : "Enter the leave type details below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#1A1A2E] dark:text-[#A0A0A0] dark:hover:bg-[#242424] dark:hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            {modalMode === "view" && selectedLeaveType ? (
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center gap-4 rounded-2xl bg-[#F8F9FA] p-4 dark:bg-[#101010]">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 font-bold text-[#0066FF] dark:bg-blue-500/10 dark:text-[#1E90FF]">
                    {getInitials(selectedLeaveType.name)}
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-[#1A1A2E] dark:text-white">
                      {selectedLeaveType.name}
                    </h3>

                    <p className="text-sm text-[#667085] dark:text-[#A0A0A0]">
                      {selectedLeaveType.leaveTypeId}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <DetailItem
                    label="Leave Type ID"
                    value={selectedLeaveType.leaveTypeId}
                  />

                  <DetailItem
                    label="Days Allowed"
                    value={`${selectedLeaveType.daysAllowed} days`}
                  />

                  <DetailItem
                    label="Status"
                    value={
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(selectedLeaveType.status || "Active")}`}
                      >
                        {selectedLeaveType.status || "Active"}
                      </span>
                    }
                  />

                  <DetailItem
                    label="Created Date"
                    value={formatDate(selectedLeaveType.createdDate)}
                  />
                </div>

                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#101010]">
                  <p className="mb-2 text-xs font-medium text-[#667085] dark:text-[#A0A0A0]">
                    Description
                  </p>

                  <p className="text-sm leading-6 text-[#344054] dark:text-[#D0D0D0]">
                    {selectedLeaveType.description || "No description provided."}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F2F4F7] dark:border-[#3A3A3A] dark:text-white dark:hover:bg-[#242424]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 p-5 sm:p-6">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#E5E5E5]">
                        Leave Type ID
                      </label>

                      <input
                        type="text"
                        value={form.leaveTypeId}
                        onChange={(event) => {
                          const value = event.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");

                          setForm((current) => ({
                            ...current,
                            leaveTypeId: value,
                          }));
                        }}
                        placeholder="LT001"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#E5E5E5]">
                        Leave Type Name
                      </label>

                      <input
                        type="text"
                        value={form.name}
                        onChange={(event) => {
                          const value = event.target.value;

                          if (
                            value === "" ||
                            /^[A-Za-z\s]*$/.test(value)
                          ) {
                            setForm((current) => ({
                              ...current,
                              name: value,
                            }));
                          }
                        }}
                        placeholder="Casual Leave"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#E5E5E5]">
                        Days Allowed
                      </label>

                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.daysAllowed}
                        onChange={(event) => {
                          const value = event.target.value.replace(/\D/g, "");

                          setForm((current) => ({
                            ...current,
                            daysAllowed: value,
                          }));
                        }}
                        placeholder="12"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#E5E5E5]">
                        Status
                      </label>

                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status: event.target.value as LeaveTypeStatus,
                          }))
                        }
                        className={inputClass}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#344054] dark:text-[#E5E5E5]">
                      Description
                    </label>

                    <textarea
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          description: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Enter a short description..."
                      className="
                        w-full resize-none rounded-xl border
                        border-[#D0D5DD] bg-white px-4 py-3
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
                      "
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col-reverse gap-3 border-t border-[#E5E7EB] px-5 py-4 dark:border-[#333333] sm:flex-row sm:justify-end sm:px-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3A3A3A] dark:text-white dark:hover:bg-[#242424]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white transition hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E90FF] dark:hover:bg-[#1877D5]"
                  >
                    {saving && (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    )}

                    {modalMode === "add" ? "Add Leave Type" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={cancelDelete}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#E1E5EA] bg-white p-5 shadow-2xl dark:border-[#333333] dark:bg-[#181818] sm:p-6"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
              Delete Leave Type?
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-[#A0A0A0]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#1A1A2E] dark:text-white">
                {deleteTarget.name}
              </span>
              ?
            </p>

            {deleteError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] transition hover:bg-[#F2F4F7] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3A3A3A] dark:text-white dark:hover:bg-[#242424]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}

                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}