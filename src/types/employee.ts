export type EmploymentStatus =
  | "Active"
  | "Inactive"
  | "On Notice"
  | "Resigned";

export interface Employee {
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