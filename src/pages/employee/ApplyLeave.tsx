import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  departmentId: string;
  designation: string;
}

interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  description?: string;
  totalDays?: number;
  status: string;
}

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected" | "Cancelled";
  appliedDate: string;
}

export default function ApplyLeave() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [leaveTypes, setLeaveTypes] = useState<
    LeaveType[]
  >([]);

  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>([]);

  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          leaveTypesResponse,
          leaveRequestsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<LeaveType[]>("/leaveTypes"),
          api.get<LeaveRequest[]>("/leaveRequests"),
        ]);

        if (cancelled) {
          return;
        }

        const currentEmployee =
          employeesResponse.data.find(
            (item) =>
              item.employeeId === user.employeeId ||
              item.id === user.employeeId,
          ) || null;

        setEmployee(currentEmployee);

        setLeaveTypes(
          leaveTypesResponse.data.filter(
            (item) => item.status === "Active",
          ),
        );

        setLeaveRequests(
          leaveRequestsResponse.data.filter(
            (item) =>
              item.employeeId === user.employeeId ||
              item.employeeId ===
                currentEmployee?.employeeId ||
              item.employeeId === currentEmployee?.id,
          ),
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load leave application data:",
          err,
        );

        setError(
          "Unable to load leave information.",
        );
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
  }, [user]);

  const selectedLeaveType = useMemo(
    () =>
      leaveTypes.find(
        (item) =>
          item.leaveTypeId === leaveTypeId ||
          item.id === leaveTypeId,
      ),
    [leaveTypes, leaveTypeId],
  );

  const calculateDays = (
    start: string,
    end: string,
  ) => {
    if (!start || !end) {
      return 0;
    }

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime()) ||
      endDate < startDate
    ) {
      return 0;
    }

    const difference =
      endDate.getTime() - startDate.getTime();

    return (
      Math.floor(
        difference / (1000 * 60 * 60 * 24),
      ) + 1
    );
  };

  const numberOfDays = calculateDays(
    fromDate,
    toDate,
  );

  const usedDays = useMemo(() => {
    if (!selectedLeaveType || !employee) {
      return 0;
    }

    return leaveRequests
      .filter(
        (request) =>
          request.status === "Approved" &&
          (request.leaveTypeId ===
            selectedLeaveType.leaveTypeId ||
            request.leaveTypeId ===
              selectedLeaveType.id),
      )
      .reduce(
        (total, request) =>
          total + Number(request.numberOfDays || 0),
        0,
      );
  }, [employee, leaveRequests, selectedLeaveType]);

  const pendingDays = useMemo(() => {
    if (!selectedLeaveType || !employee) {
      return 0;
    }

    return leaveRequests
      .filter(
        (request) =>
          request.status === "Pending" &&
          (request.leaveTypeId ===
            selectedLeaveType.leaveTypeId ||
            request.leaveTypeId ===
              selectedLeaveType.id),
      )
      .reduce(
        (total, request) =>
          total + Number(request.numberOfDays || 0),
        0,
      );
  }, [employee, leaveRequests, selectedLeaveType]);

  const allocatedDays = Number(
    selectedLeaveType?.totalDays || 0,
  );

  const remainingDays = Math.max(
    allocatedDays - usedDays,
    0,
  );

  const availableAfterPending = Math.max(
    remainingDays - pendingDays,
    0,
  );

  const today = new Date()
    .toISOString()
    .split("T")[0];

  const hasOverlap = (
    existingRequest: LeaveRequest,
  ) => {
    if (
      existingRequest.status !== "Pending" &&
      existingRequest.status !== "Approved"
    ) {
      return false;
    }

    return (
      fromDate <= existingRequest.toDate &&
      toDate >= existingRequest.fromDate
    );
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!employee) {
      setError(
        "Employee information could not be found.",
      );
      return;
    }

    if (!leaveTypeId) {
      setError("Please select a leave type.");
      return;
    }

    if (!fromDate || !toDate) {
      setError(
        "Please select both from and to dates.",
      );
      return;
    }

    if (fromDate < today) {
      setError(
        "Leave cannot be applied for a past date.",
      );
      return;
    }

    if (toDate < fromDate) {
      setError(
        "To date cannot be earlier than from date.",
      );
      return;
    }

    if (numberOfDays <= 0) {
      setError("Please select valid leave dates.");
      return;
    }

    if (numberOfDays > availableAfterPending) {
      setError(
        `Insufficient leave balance. Only ${availableAfterPending} day${
          availableAfterPending === 1 ? "" : "s"
        } available after pending requests.`,
      );
      return;
    }

    const overlappingRequest =
      leaveRequests.some(hasOverlap);

    if (overlappingRequest) {
      setError(
        "You already have a pending or approved leave request for the selected dates.",
      );
      return;
    }

    if (!reason.trim()) {
      setError("Please enter a reason for the leave.");
      return;
    }

    if (reason.trim().length < 5) {
      setError(
        "Please provide a little more detail in the reason.",
      );
      return;
    }

    try {
      setSubmitting(true);

      const newRequest: LeaveRequest = {
        id: `LR${Date.now()}`,
        employeeId: employee.employeeId,
        leaveTypeId:
          selectedLeaveType?.leaveTypeId ||
          leaveTypeId,
        fromDate,
        toDate,
        numberOfDays,
        reason: reason.trim(),
        status: "Pending",
        appliedDate: new Date()
          .toISOString()
          .split("T")[0],
      };

      await api.post(
        "/leaveRequests",
        newRequest,
      );

      setSuccess(
        "Leave request submitted successfully.",
      );

      setLeaveRequests((current) => [
        ...current,
        newRequest,
      ]);

      setLeaveTypeId("");
      setFromDate("");
      setToDate("");
      setReason("");

      setTimeout(() => {
        navigate("/employee/leave-requests");
      }, 1000);
    } catch (err) {
      console.error(
        "Failed to submit leave request:",
        err,
      );

      setError(
        "Unable to submit leave request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F8F9FA] dark:bg-[#0D0D0D]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-[#0066FF] dark:border-gray-700 dark:border-t-[#1E90FF]" />
      </div>
    );
  }

  return (
    <div className="min-w-0 w-full space-y-6 overflow-x-hidden bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/employee/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#0066FF] dark:text-gray-400 dark:hover:text-[#1E90FF]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-[#1A1A2E] dark:text-white sm:text-3xl">
            Apply Leave
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Submit a leave request for approval.
          </p>
        </div>

        <Link
          to="/employee/leave-requests"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#0066FF] hover:bg-blue-50 hover:text-[#0066FF] dark:border-gray-700 dark:bg-[#171717] dark:text-gray-300 dark:hover:border-[#1E90FF] dark:hover:bg-blue-500/10 dark:hover:text-[#1E90FF]"
        >
          <FileText className="h-4 w-4" />
          My Requests
        </Link>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-500/10">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500 dark:text-red-400" />

          <p className="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-500/10">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500 dark:text-emerald-400" />

          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            {success}
          </p>
        </div>
      )}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#171717] sm:p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <CalendarDays className="h-5 w-5 text-[#0066FF] dark:text-[#1E90FF]" />
            </div>

            <div>
              <h2 className="font-bold text-[#1A1A2E] dark:text-white">
                Leave Details
              </h2>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fill in the details below.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Leave Type */}
            <div>
              <label
                htmlFor="leaveType"
                className="mb-2 block text-sm font-semibold text-[#1A1A2E] dark:text-white"
              >
                Leave Type
              </label>

              <select
                id="leaveType"
                value={leaveTypeId}
                onChange={(event) =>
                  setLeaveTypeId(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
              >
                <option value="">
                  Select leave type
                </option>

                {leaveTypes.map((type) => (
                  <option
                    key={type.id}
                    value={
                      type.leaveTypeId || type.id
                    }
                  >
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="fromDate"
                  className="mb-2 block text-sm font-semibold text-[#1A1A2E] dark:text-white"
                >
                  From Date
                </label>

                <input
                  id="fromDate"
                  type="date"
                  min={today}
                  value={fromDate}
                  onChange={(event) =>
                    setFromDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF]"
                />
              </div>

              <div>
                <label
                  htmlFor="toDate"
                  className="mb-2 block text-sm font-semibold text-[#1A1A2E] dark:text-white"
                >
                  To Date
                </label>

                <input
                  id="toDate"
                  type="date"
                  min={fromDate || today}
                  value={toDate}
                  onChange={(event) =>
                    setToDate(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1A1A2E] outline-none transition focus:border-[#0066FF] dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:focus:border-[#1E90FF]"
                />
              </div>
            </div>

            {/* Days */}
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Number of Days
                </span>

                <span className="text-xl font-bold text-[#0066FF] dark:text-[#1E90FF]">
                  {numberOfDays}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label
                htmlFor="reason"
                className="mb-2 block text-sm font-semibold text-[#1A1A2E] dark:text-white"
              >
                Reason
              </label>

              <textarea
                id="reason"
                value={reason}
                onChange={(event) =>
                  setReason(event.target.value)
                }
                placeholder="Enter the reason for your leave..."
                rows={5}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-[#1A1A2E] outline-none transition placeholder:text-gray-400 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-[#202020] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-[#1E90FF] dark:focus:ring-blue-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0066FF] px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#1E90FF] dark:hover:bg-blue-500"
            >
              {submitting
                ? "Submitting..."
                : "Submit Leave Request"}
            </button>
          </div>
        </form>

        {/* Balance Card */}
        <aside className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-[#171717]">
          <h2 className="font-bold text-[#1A1A2E] dark:text-white">
            Leave Balance
          </h2>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Select a leave type to view its balance.
          </p>

          {selectedLeaveType ? (
            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-[#202020]">
              <p className="text-sm font-bold text-[#1A1A2E] dark:text-white">
                {selectedLeaveType.name}
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Allocated
                  </span>

                  <span className="font-semibold text-[#1A1A2E] dark:text-white">
                    {allocatedDays} days
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Used
                  </span>

                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {usedDays} days
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Pending
                  </span>

                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {pendingDays} days
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Available
                    </span>

                    <span className="font-bold text-[#0066FF] dark:text-[#1E90FF]">
                      {availableAfterPending} days
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-700">
              <CalendarDays className="mx-auto h-7 w-7 text-gray-400 dark:text-gray-500" />

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Select a leave type to see your balance.
              </p>
            </div>
          )}

          <Link
            to="/employee/leave-balance"
            className="mt-4 block text-center text-sm font-semibold text-[#0066FF] hover:text-blue-700 dark:text-[#1E90FF] dark:hover:text-blue-300"
          >
            View full leave balance →
          </Link>
        </aside>
      </div>
    </div>
  );
}