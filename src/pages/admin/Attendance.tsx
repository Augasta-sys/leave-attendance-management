import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Clock3,
  Edit3,
  Eye,
  Search,
  UserCheck,
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
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: AttendanceStatus;
  remarks: string;
}

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  departmentId: string;
  designation: string;
}

type ModalMode = "view" | "edit" | null;

interface AttendanceForm {
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  remarks: string;
}

const STATUS_OPTIONS: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "On Leave",
  "Holiday",
  "Week Off",
];

const EMPTY_FORM: AttendanceForm = {
  employeeId: "",
  date: "",
  checkIn: "",
  checkOut: "",
  status: "Present",
  remarks: "",
};

export default function Attendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | AttendanceStatus
  >("All");

  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<Attendance | null>(null);

  const [form, setForm] = useState<AttendanceForm>(EMPTY_FORM);

  const [errors, setErrors] = useState<{
    employeeId?: string;
    date?: string;
    checkIn?: string;
    checkOut?: string;
    status?: string;
  }>({});

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const [attendanceResponse, employeesResponse] =
          await Promise.all([
            api.get<Attendance[]>("/attendance"),
            api.get<Employee[]>("/employees"),
          ]);

        setAttendance(attendanceResponse.data || []);
        setEmployees(employeesResponse.data || []);
      } catch (error) {
        console.error("Failed to load attendance:", error);

        setErrorMessage(
          "Unable to load attendance data. Please make sure JSON Server is running.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const getEmployee = useCallback(
    (employeeId: string) => {
      return employees.find(
        (employee) =>
          employee.employeeId === employeeId ||
          employee.id === employeeId,
      );
    },
    [employees],
  );

  const getEmployeeName = useCallback(
    (employeeId: string) => {
      return getEmployee(employeeId)?.fullName || employeeId;
    },
    [getEmployee],
  );

  const getEmployeeCode = useCallback(
    (employeeId: string) => {
      return getEmployee(employeeId)?.employeeId || employeeId;
    },
    [getEmployee],
  );

  const calculateWorkingHours = (
    checkIn: string,
    checkOut: string,
  ) => {
    if (!checkIn || !checkOut) {
      return "0h 0m";
    }

    const [inHour, inMinute] = checkIn.split(":").map(Number);
    const [outHour, outMinute] = checkOut.split(":").map(Number);

    if (
      Number.isNaN(inHour) ||
      Number.isNaN(inMinute) ||
      Number.isNaN(outHour) ||
      Number.isNaN(outMinute)
    ) {
      return "0h 0m";
    }

    const start = inHour * 60 + inMinute;
    let end = outHour * 60 + outMinute;

    if (end < start) {
      end += 24 * 60;
    }

    const totalMinutes = end - start;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const filteredAttendance = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return [...attendance]
      .filter((record) => {
        const employee = getEmployee(record.employeeId);

        const matchesSearch =
          !search ||
          record.employeeId.toLowerCase().includes(search) ||
          employee?.employeeId.toLowerCase().includes(search) ||
          employee?.fullName.toLowerCase().includes(search) ||
          employee?.designation.toLowerCase().includes(search);

        const matchesDate =
          !dateFilter || record.date === dateFilter;

        const matchesStatus =
          statusFilter === "All" ||
          record.status === statusFilter;

        return (
          matchesSearch &&
          matchesDate &&
          matchesStatus
        );
      })
      .sort((a, b) => {
        const dateComparison = b.date.localeCompare(a.date);

        if (dateComparison !== 0) {
          return dateComparison;
        }

        return getEmployeeName(a.employeeId).localeCompare(
          getEmployeeName(b.employeeId),
        );
      });
  }, [
  attendance,
  searchTerm,
  dateFilter,
  statusFilter,
  getEmployee,
  getEmployeeName,
]);

  const presentCount = attendance.filter(
    (item) =>
      item.status === "Present" || item.status === "Late",
  ).length;

  const absentCount = attendance.filter(
    (item) => item.status === "Absent",
  ).length;

  const leaveCount = attendance.filter(
    (item) => item.status === "On Leave",
  ).length;

  const halfDayCount = attendance.filter(
    (item) => item.status === "Half Day",
  ).length;

  const openViewModal = (record: Attendance) => {
    setSelectedAttendance(record);
    setModalMode("view");
  };

  const openEditModal = (record: Attendance) => {
    setSelectedAttendance(record);

    setForm({
      employeeId: record.employeeId,
      date: record.date,
      checkIn: record.checkIn || "",
      checkOut: record.checkOut || "",
      status: record.status,
      remarks: record.remarks || "",
    });

    setErrors({});
    setModalMode("edit");
    setErrorMessage("");
  };

  const closeModal = () => {
    if (saving) return;

    setModalMode(null);
    setSelectedAttendance(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const handleFormChange = (
    field: keyof AttendanceForm,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));
  };

  const validateForm = () => {
    const newErrors: {
      employeeId?: string;
      date?: string;
      checkIn?: string;
      checkOut?: string;
      status?: string;
    } = {};

    if (!form.employeeId) {
      newErrors.employeeId = "Please select an employee.";
    }

    if (!form.date) {
      newErrors.date = "Date is required.";
    }

    if (!form.status) {
      newErrors.status = "Status is required.";
    }

    const needsTime =
      form.status === "Present" ||
      form.status === "Late" ||
      form.status === "Half Day";

    if (needsTime && !form.checkIn) {
      newErrors.checkIn = "Check-in time is required.";
    }

    if (needsTime && !form.checkOut) {
      newErrors.checkOut = "Check-out time is required.";
    }

    if (
      form.checkIn &&
      form.checkOut &&
      form.checkOut <= form.checkIn
    ) {
      newErrors.checkOut =
        "Check-out time must be later than check-in time.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !selectedAttendance) {
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const workingHours = calculateWorkingHours(
      form.checkIn,
      form.checkOut,
    );

    const updatedRecord: Attendance = {
      ...selectedAttendance,
      employeeId: form.employeeId,
      date: form.date,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      workingHours,
      status: form.status,
      remarks: form.remarks.trim(),
    };

    try {
      const response = await api.put<Attendance>(
        `/attendance/${selectedAttendance.id}`,
        updatedRecord,
      );

      const serverRecord = response.data || updatedRecord;

      setAttendance((current) =>
        current.map((record) =>
          record.id === selectedAttendance.id
            ? serverRecord
            : record,
        ),
      );

      setSuccessMessage(
        "Attendance record updated successfully.",
      );

      closeModal();
    } catch (error) {
      console.error("Failed to update attendance:", error);

      setErrorMessage(
        "Unable to update attendance. Please make sure JSON Server is running.",
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setStatusFilter("All");
  };

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] text-[#1A1A2E] dark:bg-[#0D0D0D] dark:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
            <CalendarDays size={21} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Attendance
            </h1>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
              View and correct employee attendance records.
            </p>
          </div>
        </div>
      </div>

      {/* SUCCESS */}
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

      {/* ERROR */}
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Present / Late"
          value={presentCount}
          icon={<UserCheck size={19} />}
        />

        <StatCard
          label="Absent"
          value={absentCount}
          icon={<X size={19} />}
        />

        <StatCard
          label="Half Day"
          value={halfDayCount}
          icon={<Clock3 size={19} />}
        />

        <StatCard
          label="On Leave"
          value={leaveCount}
          icon={<CalendarDays size={19} />}
        />
      </div>

      {/* FILTERS */}
      <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          {/* SEARCH */}
          <div className="relative min-w-0">
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
              placeholder="Search employee..."
              className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white pl-10 pr-4 text-sm text-[#1A1A2E] outline-none placeholder:text-[#98A2B3] focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/10 dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:placeholder:text-[#777777] dark:focus:border-[#1E90FF]"
            />
          </div>

          {/* DATE */}
          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          />

          {/* STATUS */}
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "All"
                  | AttendanceStatus,
              )
            }
            className="h-11 rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm text-[#1A1A2E] outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
          >
            <option value="All">All Status</option>

            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* CLEAR */}
          <button
            type="button"
            onClick={clearFilters}
            className="h-11 rounded-xl border border-[#D0D5DD] px-4 text-sm font-semibold text-[#344054] transition hover:bg-[#F2F4F7] dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-sm dark:border-[#333333] dark:bg-[#181818]">
        <div className="flex items-center justify-between gap-3 border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
          <div>
            <h2 className="text-lg font-semibold">
              Attendance Records
            </h2>

            <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
              {filteredAttendance.length} record
              {filteredAttendance.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[260px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#0066FF]/20 border-t-[#0066FF] dark:border-[#1E90FF]/20 dark:border-t-[#1E90FF]" />

              <p className="mt-3 text-sm text-[#667085] dark:text-[#B3B3B3]">
                Loading attendance...
              </p>
            </div>
          </div>
        ) : filteredAttendance.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
              <CalendarDays size={25} />
            </div>

            <h3 className="mt-4 text-base font-semibold">
              No attendance records found
            </h3>

            <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden md:block">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-[#E1E5EA] bg-[#F8F9FA] text-left dark:border-[#333333] dark:bg-[#111111]">
                    <th className="w-[18%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Employee
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Date
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Check In
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Check Out
                    </th>

                    <th className="w-[14%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Working Hours
                    </th>

                    <th className="w-[12%] px-4 py-4 text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Status
                    </th>

                    <th className="w-[10%] px-4 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAttendance.map((record) => (
                    <tr
                      key={record.id}
                      className="border-b border-[#E1E5EA] last:border-b-0 hover:bg-[#F8F9FA] dark:border-[#333333] dark:hover:bg-[#202020]"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {getEmployeeName(
                              record.employeeId,
                            )}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-[#667085] dark:text-[#B3B3B3]">
                            {getEmployeeCode(
                              record.employeeId,
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
                        {formatDate(record.date)}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {record.checkIn || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm">
                        {record.checkOut || "-"}
                      </td>

                      <td className="px-4 py-4 text-sm text-[#667085] dark:text-[#B3B3B3]">
                        {record.workingHours ||
                          calculateWorkingHours(
                            record.checkIn,
                            record.checkOut,
                          )}
                      </td>

                      <td className="px-4 py-4">
                        <AttendanceBadge
                          status={record.status}
                        />
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-1">
                          <ActionButton
                            label="View"
                            onClick={() =>
                              openViewModal(record)
                            }
                          >
                            <Eye size={16} />
                          </ActionButton>

                          <ActionButton
                            label="Edit"
                            onClick={() =>
                              openEditModal(record)
                            }
                          >
                            <Edit3 size={16} />
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
              {filteredAttendance.map((record) => (
                <div
                  key={record.id}
                  className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-4 dark:border-[#333333] dark:bg-[#111111]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {getEmployeeName(record.employeeId)}
                      </p>

                      <p className="mt-1 text-xs text-[#667085] dark:text-[#B3B3B3]">
                        {getEmployeeCode(record.employeeId)}
                      </p>
                    </div>

                    <AttendanceBadge
                      status={record.status}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <InfoItem
                      label="Date"
                      value={formatDate(record.date)}
                    />

                    <InfoItem
                      label="Working Hours"
                      value={
                        record.workingHours ||
                        calculateWorkingHours(
                          record.checkIn,
                          record.checkOut,
                        )
                      }
                    />

                    <InfoItem
                      label="Check In"
                      value={record.checkIn || "-"}
                    />

                    <InfoItem
                      label="Check Out"
                      value={record.checkOut || "-"}
                    />
                  </div>

                  <div className="mt-4 flex justify-end gap-1 border-t border-[#E1E5EA] pt-3 dark:border-[#333333]">
                    <ActionButton
                      label="View"
                      onClick={() =>
                        openViewModal(record)
                      }
                    >
                      <Eye size={16} />
                    </ActionButton>

                    <ActionButton
                      label="Edit"
                      onClick={() =>
                        openEditModal(record)
                      }
                    >
                      <Edit3 size={16} />
                    </ActionButton>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL */}
      {modalMode === "view" && selectedAttendance && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                  Attendance Details
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  {getEmployeeName(
                    selectedAttendance.employeeId,
                  )}
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

            <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2">
              <DetailItem
                label="Employee ID"
                value={getEmployeeCode(
                  selectedAttendance.employeeId,
                )}
              />

              <DetailItem
                label="Date"
                value={formatDate(
                  selectedAttendance.date,
                )}
              />

              <DetailItem
                label="Check In"
                value={
                  selectedAttendance.checkIn || "-"
                }
              />

              <DetailItem
                label="Check Out"
                value={
                  selectedAttendance.checkOut || "-"
                }
              />

              <DetailItem
                label="Working Hours"
                value={
                  selectedAttendance.workingHours ||
                  calculateWorkingHours(
                    selectedAttendance.checkIn,
                    selectedAttendance.checkOut,
                  )
                }
              />

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#98A2B3]">
                  Status
                </p>

                <div className="mt-2">
                  <AttendanceBadge
                    status={selectedAttendance.status}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-[#98A2B3]">
                  Remarks
                </p>

                <p className="mt-2 rounded-xl bg-[#F8F9FA] p-3 text-sm text-[#667085] dark:bg-[#111111] dark:text-[#B3B3B3]">
                  {selectedAttendance.remarks ||
                    "No remarks added."}
                </p>
              </div>
            </div>

            <div className="border-t border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 w-full rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white hover:bg-[#0052CC] dark:bg-[#1E90FF] dark:hover:bg-[#187BD1]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {modalMode === "edit" && selectedAttendance && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#E1E5EA] bg-white shadow-2xl dark:border-[#333333] dark:bg-[#181818]">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-[#E1E5EA] px-5 py-4 dark:border-[#333333]">
              <div>
                <p className="text-xs font-semibold text-[#0066FF] dark:text-[#1E90FF]">
                  Attendance Correction
                </p>

                <h2 className="mt-1 text-lg font-bold">
                  Edit Attendance
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7] disabled:opacity-50 dark:text-[#B3B3B3] dark:hover:bg-[#292929]"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <div className="space-y-4 px-5 py-5">
              {/* EMPLOYEE + DATE */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Employee" required>
                  <select
                    value={form.employeeId}
                    onChange={(event) =>
                      handleFormChange(
                        "employeeId",
                        event.target.value,
                      )
                    }
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none dark:bg-[#111111] dark:text-white ${
                      errors.employeeId
                        ? "border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                    }`}
                  >
                    <option value="">
                      Select employee
                    </option>

                    {employees.map((employee) => (
                      <option
                        key={employee.id}
                        value={employee.employeeId}
                      >
                        {employee.employeeId} -{" "}
                        {employee.fullName}
                      </option>
                    ))}
                  </select>

                  {errors.employeeId && (
                    <ErrorText>
                      {errors.employeeId}
                    </ErrorText>
                  )}
                </FormField>

                <FormField label="Date" required>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      handleFormChange(
                        "date",
                        event.target.value,
                      )
                    }
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none dark:bg-[#111111] dark:text-white ${
                      errors.date
                        ? "border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                    }`}
                  />

                  {errors.date && (
                    <ErrorText>
                      {errors.date}
                    </ErrorText>
                  )}
                </FormField>
              </div>

              {/* CHECK IN + CHECK OUT */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Check In">
                  <input
                    type="time"
                    value={form.checkIn}
                    onChange={(event) =>
                      handleFormChange(
                        "checkIn",
                        event.target.value,
                      )
                    }
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none dark:bg-[#111111] dark:text-white ${
                      errors.checkIn
                        ? "border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                    }`}
                  />

                  {errors.checkIn && (
                    <ErrorText>
                      {errors.checkIn}
                    </ErrorText>
                  )}
                </FormField>

                <FormField label="Check Out">
                  <input
                    type="time"
                    value={form.checkOut}
                    onChange={(event) =>
                      handleFormChange(
                        "checkOut",
                        event.target.value,
                      )
                    }
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-sm outline-none dark:bg-[#111111] dark:text-white ${
                      errors.checkOut
                        ? "border-red-500"
                        : "border-[#D0D5DD] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:focus:border-[#1E90FF]"
                    }`}
                  />

                  {errors.checkOut && (
                    <ErrorText>
                      {errors.checkOut}
                    </ErrorText>
                  )}
                </FormField>
              </div>

              {/* STATUS */}
              <FormField label="Status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    handleFormChange(
                      "status",
                      event.target.value,
                    )
                  }
                  className="h-11 w-full rounded-xl border border-[#D0D5DD] bg-white px-3 text-sm outline-none focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:focus:border-[#1E90FF]"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>

                {errors.status && (
                  <ErrorText>{errors.status}</ErrorText>
                )}
              </FormField>

              {/* REMARKS */}
              <FormField label="Remarks">
                <textarea
                  value={form.remarks}
                  onChange={(event) =>
                    handleFormChange(
                      "remarks",
                      event.target.value,
                    )
                  }
                  placeholder="Enter remarks..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-[#D0D5DD] bg-white px-3 py-2.5 text-sm outline-none placeholder:text-[#98A2B3] focus:border-[#0066FF] dark:border-[#3A3A3A] dark:bg-[#111111] dark:text-white dark:placeholder:text-[#777777] dark:focus:border-[#1E90FF]"
                />
              </FormField>

              {/* WORKING HOURS PREVIEW */}
              <div className="rounded-xl border border-[#D0D5DD] bg-[#F8F9FA] px-4 py-3 dark:border-[#333333] dark:bg-[#111111]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock3
                      size={17}
                      className="text-[#0066FF] dark:text-[#1E90FF]"
                    />

                    <span className="text-sm font-medium">
                      Working Hours
                    </span>
                  </div>

                  <span className="text-sm font-bold">
                    {calculateWorkingHours(
                      form.checkIn,
                      form.checkOut,
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="flex flex-col-reverse gap-2 border-t border-[#E1E5EA] px-5 py-4 sm:flex-row sm:justify-end dark:border-[#333333]">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="h-10 rounded-xl border border-[#D0D5DD] px-5 text-sm font-semibold text-[#344054] hover:bg-[#F2F4F7] disabled:opacity-50 dark:border-[#444444] dark:text-white dark:hover:bg-[#292929]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white hover:bg-[#0052CC] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#1E90FF] dark:hover:bg-[#187BD1]"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    Save Changes
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

/* STAT CARD */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E1E5EA] bg-white p-4 shadow-sm dark:border-[#333333] dark:bg-[#181818] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-[#667085] dark:text-[#B3B3B3] sm:text-sm">
          {label}
        </p>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0066FF]/10 text-[#0066FF] dark:bg-[#1E90FF]/10 dark:text-[#1E90FF]">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

/* ATTENDANCE BADGE */

function AttendanceBadge({
  status,
}: {
  status: AttendanceStatus;
}) {
  const styles: Record<AttendanceStatus, string> = {
    Present:
      "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",
    Absent:
      "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    "Half Day":
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
    Late:
      "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400",
    "On Leave":
      "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    Holiday:
      "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    "Week Off":
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ACTION BUTTON */

function ActionButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] transition hover:bg-[#F2F4F7] hover:text-[#0066FF] dark:text-[#B3B3B3] dark:hover:bg-[#292929] dark:hover:text-[#1E90FF]"
    >
      {children}
    </button>
  );
}

/* FORM FIELD */

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

/* ERROR */

function ErrorText({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-1 text-xs text-red-500">
      {children}
    </p>
  );
}

/* INFO ITEM */

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>
    </div>
  );
}

/* DETAIL ITEM */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#E1E5EA] bg-[#F8F9FA] p-3 dark:border-[#333333] dark:bg-[#111111]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#98A2B3]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}