export type LeaveStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled";

export interface LeaveType {
  id: string;
  leaveTypeId: string;
  name: string;
  description: string;
  maximumDays: number;
  status: "Active" | "Inactive";
}

export interface LeaveRequest {
  id: string;
  leaveId: string;
  employeeId: string;
  employeeName: string;
  leaveTypeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  appliedDate: string;
  status: LeaveStatus;
  reviewedBy: string;
  reviewDate: string;
  reviewComment: string;
}