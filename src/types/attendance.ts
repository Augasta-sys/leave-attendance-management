export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Late"
  | "On Leave"
  | "Holiday"
  | "Week Off";

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  status: AttendanceStatus;
  remarks: string;
}