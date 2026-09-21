import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  Search,
  X,
  XCircle,
} from "lucide-react";

import { api } from "../../services/api";

type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

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

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  daysAllowed?: number;
  description?: string;
}

const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: "1",
    leaveTypeId: "LT001",
    name: "Casual Leave",
    daysAllowed: 12,
  },
  {
    id: "2",
    leaveTypeId: "LT002",
    name: "Sick Leave",
    daysAllowed: 10,
  },
  {
    id: "3",
    leaveTypeId: "LT003",
    name: "Earned Leave",
    daysAllowed: 15,
  },
  {
    id: "4",
    leaveTypeId: "LT004",
    name: "Maternity Leave",
    daysAllowed: 180,
  },
  {
    id: "5",
    leaveTypeId: "LT005",
    name: "Paternity Leave",
    daysAllowed: 15,
  },
];

function formatDate(date: string) {
  if (!date) return "-";

  const parsedDate = new Date(
    `${date}T00:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function calculateDays(
  startDate: string,
  endDate: string,
) {
  if (!startDate || !endDate) {
    return 0;
  }

  const start = new Date(
    `${startDate}T00:00:00`,
  );

  const end = new Date(
    `${endDate}T00:00:00`,
  );

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

function getLeaveDays(
  request: LeaveRequest,
) {
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

function getEmployee(
  employeeId: string,
  employees: Employee[],
) {
  return employees.find(
    (employee) =>
      employee.employeeId === employeeId ||
      employee.id === employeeId,
  );
}

function getLeaveType(
  leaveTypeId: string,
  leaveTypes: LeaveType[],
) {
  return leaveTypes.find(
    (type) =>
      type.leaveTypeId === leaveTypeId ||
      type.id === leaveTypeId,
  );
}

function getLeaveTypeName(
  leaveTypeId: string,
  leaveTypes: LeaveType[],
) {
  return (
    getLeaveType(
      leaveTypeId,
      leaveTypes,
    )?.name ||
    leaveTypeId ||
    "Leave"
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function getStatusClass(
  status: LeaveStatus,
) {
  const classes: Record<
    LeaveStatus,
    string
  > = {
    Pending:
      "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",

    Approved:
      "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",

    Rejected:
      "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",

    Cancelled:
      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  };

  return classes[status];
}

export default function LeaveRequests() {
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>([]);

  const [employees, setEmployees] =
    useState<Employee[]>([]);

  const [leaveTypes, setLeaveTypes] =
    useState<LeaveType[]>(
      DEFAULT_LEAVE_TYPES,
    );

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [leaveTypeFilter, setLeaveTypeFilter] =
    useState("all");

  const [dateFilter, setDateFilter] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [modalMode, setModalMode] =
    useState<"view" | "reject">("view");

  const [selectedRequest, setSelectedRequest] =
    useState<LeaveRequest | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [actionError, setActionError] =
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
          leaveRequestsResponse,
          employeesResponse,
          leaveTypesResponse,
        ] = await Promise.all([
          api.get<LeaveRequest[]>("/leaveRequests"),
          api.get<Employee[]>("/employees"),
          api.get<LeaveType[]>("/leaveTypes"),
        ]);

        if (cancelled) return;

        setLeaveRequests(
          Array.isArray(leaveRequestsResponse.data)
            ? leaveRequestsResponse.data
            : [],
        );

        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );

        const apiLeaveTypes = Array.isArray(leaveTypesResponse.data)
          ? leaveTypesResponse.data
          : [];

        const mergedLeaveTypes = [
          ...DEFAULT_LEAVE_TYPES,
          ...apiLeaveTypes.filter(
            (apiType) =>
              !DEFAULT_LEAVE_TYPES.some(
                (defaultType) =>
                  defaultType.leaveTypeId === apiType.leaveTypeId,
              ),
          ),
        ];

        setLeaveTypes(mergedLeaveTypes);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load HR leave requests:", err);
        setError(
          "Unable to load leave requests. Please make sure JSON Server is running.",
        );
        setLeaveTypes(DEFAULT_LEAVE_TYPES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Prevent the page behind the modal
   * from scrolling or moving.
   */
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

  const filteredRequests = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return [...leaveRequests]
      .filter((request) => {
        const employee = getEmployee(
          request.employeeId,
          employees,
        );

        const leaveType =
          getLeaveType(
            request.leaveTypeId,
            leaveTypes,
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
          leaveType?.name
            ?.toLowerCase()
            .includes(searchValue) ||
          request.reason
            ?.toLowerCase()
            .includes(searchValue);

        const matchesStatus =
          statusFilter === "all" ||
          request.status === statusFilter;

        const matchesLeaveType =
          leaveTypeFilter === "all" ||
          request.leaveTypeId ===
            leaveTypeFilter;

        const matchesDate =
          !dateFilter ||
          request.startDate === dateFilter ||
          request.endDate === dateFilter ||
          (request.startDate <=
            dateFilter &&
            request.endDate >= dateFilter);

        return (
          matchesSearch &&
          matchesStatus &&
          matchesLeaveType &&
          matchesDate
        );
      })
      .sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() -
          new Date(a.appliedDate).getTime(),
      );
  }, [
    leaveRequests,
    employees,
    leaveTypes,
    search,
    statusFilter,
    leaveTypeFilter,
    dateFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: leaveRequests.length,

      pending: leaveRequests.filter(
        (request) =>
          request.status === "Pending",
      ).length,

      approved: leaveRequests.filter(
        (request) =>
          request.status === "Approved",
      ).length,

      rejected: leaveRequests.filter(
        (request) =>
          request.status === "Rejected",
      ).length,

      cancelled: leaveRequests.filter(
        (request) =>
          request.status === "Cancelled",
      ).length,
    };
  }, [leaveRequests]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setLeaveTypeFilter("all");
    setDateFilter("");
  };

  const openViewModal = (
    request: LeaveRequest,
  ) => {
    setModalMode("view");
    setSelectedRequest(request);
    setRejectionReason("");
    setActionError("");
    setShowModal(true);
  };

  const openRejectModal = (
    request: LeaveRequest,
  ) => {
    setModalMode("reject");
    setSelectedRequest(request);
    setRejectionReason("");
    setActionError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
    setActionError("");
  };

  const handleApprove = async (
    request: LeaveRequest,
  ) => {
    if (request.status !== "Pending") {
      return;
    }

    const confirmed =
      window.confirm(
        `Approve ${getLeaveTypeName(
          request.leaveTypeId,
          leaveTypes,
        )} for ${
          getEmployee(
            request.employeeId,
            employees,
          )?.fullName ||
          "this employee"
        }?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const response =
        await api.patch<LeaveRequest>(
          `/leaveRequests/${request.id}`,
          {
            status: "Approved",
            rejectionReason: "",
          },
        );

      setLeaveRequests((current) =>
        current.map((item) =>
          item.id === request.id
            ? response.data
            : item,
        ),
      );

      if (
        selectedRequest?.id ===
        request.id
      ) {
        setSelectedRequest(
          response.data,
        );
      }

      setShowModal(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error(
        "Failed to approve leave request:",
        err,
      );

      setActionError(
        "Unable to approve the leave request. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) {
      return;
    }

    if (
      selectedRequest.status !== "Pending"
    ) {
      setActionError(
        "Only pending requests can be rejected.",
      );
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setActionError(
        "Rejection reason is required.",
      );
      return;
    }

    try {
      setSaving(true);
      setActionError("");

      const response =
        await api.patch<LeaveRequest>(
          `/leaveRequests/${selectedRequest.id}`,
          {
            status: "Rejected",
            rejectionReason: reason,
          },
        );

      setLeaveRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? response.data
            : item,
        ),
      );

      setShowModal(false);
      setSelectedRequest(null);
      setRejectionReason("");
    } catch (err) {
      console.error(
        "Failed to reject leave request:",
        err,
      );

      setActionError(
        "Unable to reject the leave request. Please try again.",
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
      {/* PAGE HEADER */}

      <div>
        <p className="text-sm font-semibold text-[#0066FF] dark:text-[#1E90FF]">
          Human Resources
        </p>

        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Leave Requests
        </h1>

        <p className="mt-1 text-sm text-[#667085] dark:text-[#B3B3B3]">
          Review and manage employee leave
          requests.
        </p>
      </div>

      {/* ERROR */}

      {error && (
        <div
          className="
            rounded-xl border
            border-red-200 bg-red-50
            px-4 py-3
            text-sm text-red-600
            dark:border-red-900
            dark:bg-red-950/30
            dark:text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* STAT CARDS */}

      <div
        className="
          grid grid-cols-2 gap-4
          sm:grid-cols-3
          xl:grid-cols-5
        "
      >
        <LeaveStat
          title="Total Requests"
          value={stats.total}
          icon={<FileText size={19} />}
          iconClass="
            bg-blue-50 text-[#0066FF]
            dark:bg-blue-950/40
            dark:text-[#1E90FF]
          "
        />

        <LeaveStat
          title="Pending"
          value={stats.pending}
          icon={<Clock3 size={19} />}
          iconClass="
            bg-orange-50 text-orange-600
            dark:bg-orange-950/40
            dark:text-orange-400
          "
        />

        <LeaveStat
          title="Approved"
          value={stats.approved}
          icon={<CheckCircle2 size={19} />}
          iconClass="
            bg-green-50 text-green-600
            dark:bg-green-950/40
            dark:text-green-400
          "
        />

        <LeaveStat
          title="Rejected"
          value={stats.rejected}
          icon={<XCircle size={19} />}
          iconClass="
            bg-red-50 text-red-600
            dark:bg-red-950/40
            dark:text-red-400
          "
        />

        <LeaveStat
          title="Cancelled"
          value={stats.cancelled}
          icon={<CalendarDays size={19} />}
          iconClass="
            bg-gray-100 text-gray-600
            dark:bg-gray-800
            dark:text-gray-300
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
            xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]
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
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search employee or leave..."
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

          {/* STATUS */}

          <SelectField
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ["all", "All Status"],
              ["Pending", "Pending"],
              ["Approved", "Approved"],
              ["Rejected", "Rejected"],
              ["Cancelled", "Cancelled"],
            ]}
          />

          {/* LEAVE TYPE */}

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
                All Leave Types
              </option>

              {leaveTypes.map(
                (type) => (
                  <option
                    key={type.leaveTypeId}
                    value={
                      type.leaveTypeId
                    }
                  >
                    {type.name}
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

          {/* DATE */}

          <input
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(
                event.target.value,
              )
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

      {/* REQUEST LIST */}

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
              Leave Request List
            </h2>

            <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
              Showing{" "}
              {filteredRequests.length} of{" "}
              {leaveRequests.length} requests
            </p>
          </div>

          <div
            className="
              hidden h-10 w-10
              items-center justify-center
              rounded-xl
              bg-orange-50
              text-orange-600
              sm:flex
              dark:bg-orange-950/40
              dark:text-orange-400
            "
          >
            <FileText size={19} />
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filteredRequests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1000px]">
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
                      Leave Type
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Leave Period
                    </th>

                    <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-wide text-[#667085] dark:text-[#B3B3B3]">
                      Days
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
                  {filteredRequests.map(
                    (request) => (
                      <LeaveRequestRow
                        key={request.id}
                        request={request}
                        employee={getEmployee(
                          request.employeeId,
                          employees,
                        )}
                        leaveType={getLeaveType(
                          request.leaveTypeId,
                          leaveTypes,
                        )}
                        onView={() =>
                          openViewModal(
                            request,
                          )
                        }
                        onApprove={() =>
                          handleApprove(
                            request,
                          )
                        }
                        onReject={() =>
                          openRejectModal(
                            request,
                          )
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
              {filteredRequests.map(
                (request) => (
                  <LeaveRequestCard
                    key={request.id}
                    request={request}
                    employee={getEmployee(
                      request.employeeId,
                      employees,
                    )}
                    leaveType={getLeaveType(
                      request.leaveTypeId,
                      leaveTypes,
                    )}
                    onView={() =>
                      openViewModal(request)
                    }
                    onApprove={() =>
                      handleApprove(
                        request,
                      )
                    }
                    onReject={() =>
                      openRejectModal(
                        request,
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
        <LeaveRequestModal
          mode={modalMode}
          request={selectedRequest}
          employee={
            selectedRequest
              ? getEmployee(
                  selectedRequest.employeeId,
                  employees,
                )
              : undefined
          }
          leaveType={
            selectedRequest
              ? getLeaveType(
                  selectedRequest.leaveTypeId,
                  leaveTypes,
                )
              : undefined
          }
          rejectionReason={
            rejectionReason
          }
          setRejectionReason={
            setRejectionReason
          }
          actionError={actionError}
          saving={saving}
          onClose={closeModal}
          onApprove={() =>
            selectedRequest &&
            handleApprove(selectedRequest)
          }
          onReject={handleReject}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------- */
/* STAT CARD */
/* -------------------------------------------------- */

function LeaveStat({
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

/* -------------------------------------------------- */
/* SELECT */
/* -------------------------------------------------- */

function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
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
        {options.map(
          ([optionValue, label]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {label}
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
  );
}

/* -------------------------------------------------- */
/* TABLE ROW */
/* -------------------------------------------------- */

function LeaveRequestRow({
  request,
  employee,
  leaveType,
  onView,
  onApprove,
  onReject,
}: {
  request: LeaveRequest;
  employee?: Employee;
  leaveType?: LeaveType;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending =
    request.status === "Pending";

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
                request.employeeId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-5 py-4">
        <p className="text-sm font-semibold">
          {leaveType?.name ||
            request.leaveTypeId}
        </p>

        <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
          Applied{" "}
          {formatDate(
            request.appliedDate,
          )}
        </p>
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

      <td className="px-5 py-4 text-center">
        <span className="text-sm font-bold">
          {getLeaveDays(request)}
        </span>
      </td>

      <td className="px-5 py-4 text-center">
        <LeaveStatusBadge
          status={request.status}
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

          {isPending && (
            <>
              <IconButton
                title="Approve"
                success
                onClick={onApprove}
              >
                <CheckCircle2 size={17} />
              </IconButton>

              <IconButton
                title="Reject"
                danger
                onClick={onReject}
              >
                <XCircle size={17} />
              </IconButton>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------- */
/* MOBILE CARD */
/* -------------------------------------------------- */

function LeaveRequestCard({
  request,
  employee,
  leaveType,
  onView,
  onApprove,
  onReject,
}: {
  request: LeaveRequest;
  employee?: Employee;
  leaveType?: LeaveType;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending =
    request.status === "Pending";

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
                  request.employeeId}
              </p>
            </div>

            <LeaveStatusBadge
              status={request.status}
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
          label="Leave Type"
          value={
            leaveType?.name ||
            request.leaveTypeId
          }
        />

        <InfoItem
          label="Days"
          value={String(
            getLeaveDays(request),
          )}
        />

        <InfoItem
          label="Applied Date"
          value={formatDate(
            request.appliedDate,
          )}
        />

        <InfoItem
          label="Start Date"
          value={formatDate(
            request.startDate,
          )}
        />

        <InfoItem
          label="End Date"
          value={formatDate(
            request.endDate,
          )}
        />

        <InfoItem
          label="Reason"
          value={request.reason}
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

        {isPending && (
          <>
            <IconButton
              title="Approve"
              success
              onClick={onApprove}
            >
              <CheckCircle2 size={17} />
            </IconButton>

            <IconButton
              title="Reject"
              danger
              onClick={onReject}
            >
              <XCircle size={17} />
            </IconButton>
          </>
        )}
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

/* -------------------------------------------------- */
/* STATUS */
/* -------------------------------------------------- */

function LeaveStatusBadge({
  status,
}: {
  status: LeaveStatus;
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

/* -------------------------------------------------- */
/* INFO ITEM */
/* -------------------------------------------------- */

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
          mt-1 truncate
          text-xs font-semibold
          text-[#667085]
          dark:text-[#B3B3B3]
        "
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------- */
/* ICON BUTTON */
/* -------------------------------------------------- */

function IconButton({
  children,
  title,
  onClick,
  success = false,
  danger = false,
}: {
  children: ReactNode;
  title: string;
  onClick: () => void;
  success?: boolean;
  danger?: boolean;
}) {
  const className = danger
    ? `
      text-red-500
      hover:bg-red-50
      dark:text-red-400
      dark:hover:bg-red-950/30
    `
    : success
      ? `
        text-green-600
        hover:bg-green-50
        dark:text-green-400
        dark:hover:bg-green-950/30
      `
      : `
        text-[#0066FF]
        hover:bg-[#EEF4FF]
        dark:text-[#1E90FF]
        dark:hover:bg-[#10233F]
      `;

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
        ${className}
      `}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------- */
/* MODAL */
/* -------------------------------------------------- */

function LeaveRequestModal({
  mode,
  request,
  employee,
  leaveType,
  rejectionReason,
  setRejectionReason,
  actionError,
  saving,
  onClose,
  onApprove,
  onReject,
}: {
  mode: "view" | "reject";
  request: LeaveRequest | null;
  employee?: Employee;
  leaveType?: LeaveType;
  rejectionReason: string;
  setRejectionReason: (
    value: string,
  ) => void;
  actionError: string;
  saving: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  if (!request) {
    return null;
  }

  const isPending =
    request.status === "Pending";

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
              {mode === "reject"
                ? "Reject Leave Request"
                : "Leave Request Details"}
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
              transition
              hover:bg-[#F2F4F7]
              dark:text-[#B3B3B3]
              dark:hover:bg-[#303030]
            "
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}

        <div className="p-5">
          {actionError && (
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
              {actionError}
            </div>
          )}

          {/* EMPLOYEE */}

          <div className="flex items-center gap-3">
            <EmployeeAvatar
              employee={employee}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
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

          {/* DETAILS */}

          <div
            className="
              mt-5 grid grid-cols-1 gap-3
              sm:grid-cols-2
            "
          >
            <DetailItem
              label="Leave Type"
              value={
                leaveType?.name ||
                request.leaveTypeId
              }
            />

            <DetailItem
              label="Number of Days"
              value={String(
                getLeaveDays(request),
              )}
            />

            <DetailItem
              label="Start Date"
              value={formatDate(
                request.startDate,
              )}
            />

            <DetailItem
              label="End Date"
              value={formatDate(
                request.endDate,
              )}
            />

            <DetailItem
              label="Applied Date"
              value={formatDate(
                request.appliedDate,
              )}
            />

            <DetailItem
              label="Employee Email"
              value={
                employee?.email || "-"
              }
            />

            <div className="sm:col-span-2">
              <DetailItem
                label="Reason"
                value={request.reason}
              />
            </div>

            {request.rejectionReason && (
              <div className="sm:col-span-2">
                <DetailItem
                  label="Rejection Reason"
                  value={
                    request.rejectionReason
                  }
                />
              </div>
            )}
          </div>

          {/* REJECTION FORM */}

          {mode === "reject" && (
            <div className="mt-5">
              <label
                className="
                  mb-1.5 block
                  text-xs font-semibold
                "
              >
                Rejection Reason
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <textarea
                value={rejectionReason}
                onChange={(event) =>
                  setRejectionReason(
                    event.target.value,
                  )
                }
                rows={4}
                placeholder="Enter reason for rejecting this leave request"
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
            </div>
          )}

          {/* ACTIONS */}

          <div
            className="
              mt-5 flex flex-col-reverse
              gap-2
              sm:flex-row sm:justify-end
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
              Close
            </button>

            {mode === "view" &&
              isPending && (
                <>
                  <button
                    type="button"
                    onClick={onReject}
                    disabled={saving}
                    className="
                      inline-flex h-10
                      items-center justify-center
                      gap-2 rounded-xl
                      border
                      border-red-200
                      px-4
                      text-sm font-semibold
                      text-red-600
                      hover:bg-red-50
                      dark:border-red-900
                      dark:text-red-400
                      dark:hover:bg-red-950/30
                    "
                  >
                    <XCircle size={16} />
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={onApprove}
                    disabled={saving}
                    className="
                      inline-flex h-10
                      items-center justify-center
                      gap-2 rounded-xl
                      bg-green-600
                      px-5
                      text-sm font-semibold
                      text-white
                      hover:bg-green-700
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    <CheckCircle2
                      size={16}
                    />

                    {saving
                      ? "Approving..."
                      : "Approve"}
                  </button>
                </>
              )}

            {mode === "reject" && (
              <button
                type="button"
                onClick={onReject}
                disabled={saving}
                className="
                  inline-flex h-10
                  items-center justify-center
                  gap-2 rounded-xl
                  bg-red-600
                  px-5
                  text-sm font-semibold
                  text-white
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <XCircle size={16} />

                {saving
                  ? "Rejecting..."
                  : "Reject Leave"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* DETAIL ITEM */
/* -------------------------------------------------- */

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

      <p className="mt-1 text-sm font-semibold">
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
        Loading leave requests...
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
      <FileText
        size={34}
        className="mx-auto text-[#98A2B3]"
      />

      <p className="mt-3 text-sm font-semibold">
        No leave requests found
      </p>

      <p className="mt-1 text-xs text-[#667085] dark:text-[#888888]">
        Try changing your search or filters.
      </p>
    </div>
  );
}