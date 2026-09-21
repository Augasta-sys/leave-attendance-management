import { useEffect, useState } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Edit3,
  Mail,
  Phone,
  Save,
  User,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
  employmentStatus:
    | "Active"
    | "Inactive"
    | "On Notice"
    | "Resigned";
  profileImage: string;
  createdDate: string;
}

interface Department {
  id: string;
  departmentId: string;
  name: string;
  status?: "Active" | "Inactive";
}

interface EditForm {
  fullName: string;
  phone: string;
  profileImage: string;
}

function formatDate(date: string) {
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getStatusStyles(
  status: Employee["employmentStatus"],
) {
  switch (status) {
    case "Active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300";

    case "On Notice":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";

    case "Inactive":
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300";

    case "Resigned":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300";

    default:
      return "border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300";
  }
}

export default function EmployeeProfile() {
  const { user } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [managerName, setManagerName] = useState("-");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showImageModal, setShowImageModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editForm, setEditForm] = useState<EditForm>({
    fullName: "",
    phone: "",
    profileImage: "",
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [
          employeesResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
        ]);

        if (cancelled) return;

        const employees = employeesResponse.data;
        const departmentData = departmentsResponse.data;

        const currentEmployee =
          employees.find(
            (item) =>
              item.employeeId === user.employeeId ||
              item.id === user.employeeId,
          ) ?? null;

        setEmployee(currentEmployee);
        setDepartments(departmentData);

        if (currentEmployee?.managerId) {
          const manager =
            employees.find(
              (item) =>
                item.employeeId ===
                  currentEmployee.managerId ||
                item.id === currentEmployee.managerId,
            ) ?? null;

          setManagerName(manager?.fullName || "-");
        } else {
          setManagerName("-");
        }
      } catch (err) {
        if (cancelled) return;

        console.error(
          "Failed to load employee profile:",
          err,
        );

        setError(
          "Unable to load your profile. Please make sure the JSON Server is running.",
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user?.employeeId]);

  const departmentName = employee
    ? departments.find(
        (department) =>
          department.departmentId === employee.departmentId ||
          department.id === employee.departmentId,
      )?.name || "Unknown Department"
    : "-";

  const openEditModal = () => {
    if (!employee) return;

    setEditForm({
      fullName: employee.fullName,
      phone: employee.phone || "",
      profileImage: employee.profileImage || "",
    });

    setSaveError("");
    setSaveSuccess("");
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleEditChange = (
    field: keyof EditForm,
    value: string,
  ) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaveError("");
  };

  const validateEditForm = () => {
    const trimmedName = editForm.fullName.trim();
    const trimmedPhone = editForm.phone.trim();

    if (!trimmedName) {
      return "Full name is required.";
    }

    if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(trimmedName)) {
      return "Full name can contain only letters and spaces.";
    }

    if (!trimmedPhone) {
      return "Phone number is required.";
    }

    if (!/^[0-9]{10}$/.test(trimmedPhone)) {
      return "Phone number must contain exactly 10 digits.";
    }

    return "";
  };

  const handleSaveProfile = async () => {
    if (!employee) return;

    const validationError = validateEditForm();

    if (validationError) {
      setSaveError(validationError);
      return;
    }

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const updatedEmployee: Employee = {
        ...employee,
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        profileImage: editForm.profileImage.trim(),
      };

      const response = await api.put<Employee>(
        `/employees/${employee.id}`,
        updatedEmployee,
      );

      setEmployee(response.data);

      setSaveSuccess(
        "Profile updated successfully.",
      );

      setTimeout(() => {
        setShowEditModal(false);
        setSaveSuccess("");
      }, 900);
    } catch (err) {
      console.error(
        "Failed to update employee profile:",
        err,
      );

      setSaveError(
        "Unable to update your profile. Please make sure the JSON Server is running.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileLoading />;
  }

  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-blue-600 dark:text-blue-400">
            Employee Portal
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-[#1A1A2E] dark:text-white sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            View and update your employee and account
            information.
          </p>
        </div>

        {/* Edit Profile Button */}
        {employee && (
          <button
            type="button"
            onClick={openEditModal}
            className="
              inline-flex w-full shrink-0
              items-center justify-center gap-2
              rounded-xl bg-[#0066FF]
              px-4 py-2.5
              text-sm font-semibold text-white
              shadow-sm
              transition
              hover:bg-[#0052CC]
              focus:outline-none
              focus:ring-2
              focus:ring-[#0066FF]/30
              sm:w-auto
              dark:bg-[#1E90FF]
              dark:hover:bg-[#0077DD]
            "
          >
            <Edit3 className="h-4 w-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="min-w-0">
            <p className="font-semibold">
              Something went wrong
            </p>

            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {!error && !employee ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-[#151515]">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400">
            <UserRound className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-[#1A1A2E] dark:text-white">
            Profile not found
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            We couldn't find an employee profile for your
            account.
          </p>
        </div>
      ) : (
        employee && (
          <>
            {/* Profile Hero */}
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <div className="h-28 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 dark:from-[#151515] dark:via-[#1e90ff] dark:to-[#0066ff] sm:h-36" />

              <div className="px-4 pb-5 sm:px-6">
                <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (employee.profileImage) {
                          setShowImageModal(true);
                        }
                      }}
                      className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-blue-100 text-blue-700 shadow-lg dark:border-[#151515] dark:bg-blue-500/20 dark:text-blue-300 sm:h-28 sm:w-28 ${
                        employee.profileImage
                          ? "cursor-pointer"
                          : "cursor-default"
                      }`}
                      aria-label={
                        employee.profileImage
                          ? "View profile image"
                          : "Profile avatar"
                      }
                    >
                      {employee.profileImage ? (
                        <img
                          src={employee.profileImage}
                          alt={employee.fullName}
                          className="h-full w-full object-cover"
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";
                          }}
                        />
                      ) : (
                        <span className="text-2xl font-bold">
                          {getInitials(employee.fullName)}
                        </span>
                      )}
                    </button>

                    <div className="min-w-0 pb-1">
                      <h2 className="truncate text-xl font-bold text-[#1A1A2E] dark:text-white sm:text-2xl">
                        {employee.fullName}
                      </h2>

                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {employee.designation}
                      </p>

                      <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                        {employee.employeeId}
                      </p>
                    </div>
                  </div>

                  <div className="sm:pb-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyles(
                        employee.employmentStatus,
                      )}`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {employee.employmentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Personal Information */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <SectionHeader
                icon={<User className="h-5 w-5" />}
                title="Personal Information"
                description="Your basic employee information."
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileField
                  icon={<UserRound className="h-4 w-4" />}
                  label="Full Name"
                  value={employee.fullName}
                />

                <ProfileField
                  icon={<Mail className="h-4 w-4" />}
                  label="Email Address"
                  value={employee.email}
                />

                <ProfileField
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone Number"
                  value={employee.phone || "-"}
                />
              </div>
            </section>

            {/* Employment Information */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <SectionHeader
                icon={<BriefcaseBusiness className="h-5 w-5" />}
                title="Employment Information"
                description="Your role and organizational details."
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileField
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Employee ID"
                  value={employee.employeeId}
                />

                <ProfileField
                  icon={<BriefcaseBusiness className="h-4 w-4" />}
                  label="Designation"
                  value={employee.designation}
                />

                <ProfileField
                  icon={<Users className="h-4 w-4" />}
                  label="Department"
                  value={departmentName}
                />

                <ProfileField
                  icon={<UserRound className="h-4 w-4" />}
                  label="Reporting Manager"
                  value={managerName}
                />

                <ProfileField
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Joining Date"
                  value={formatDate(employee.joiningDate)}
                />

                <ProfileField
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  label="Employment Status"
                  value={employee.employmentStatus}
                />
              </div>
            </section>

            {/* Account Information */}
            <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#151515]">
              <SectionHeader
                icon={<UserRound className="h-5 w-5" />}
                title="Account Information"
                description="Information associated with your account."
              />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5 p-5 sm:grid-cols-2">
                <ProfileField
                  icon={<Mail className="h-4 w-4" />}
                  label="Login Email"
                  value={user?.email || employee.email}
                />

                <ProfileField
                  icon={<CalendarDays className="h-4 w-4" />}
                  label="Profile Created"
                  value={formatDate(employee.createdDate)}
                />
              </div>
            </section>
          </>
        )
      )}

      {/* Profile Image Modal */}
      {showImageModal &&
        employee &&
        employee.profileImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
            onMouseDown={() =>
              setShowImageModal(false)
            }
          >
            <div
              className="relative flex max-h-[90dvh] w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl bg-black/30 p-3 shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <button
                type="button"
                onClick={() =>
                  setShowImageModal(false)
                }
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                aria-label="Close image"
              >
                <X className="h-5 w-5" />
              </button>

              <img
                src={employee.profileImage}
                alt={employee.fullName}
                className="max-h-[84dvh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        )}

      {/* Edit Profile Modal */}
      {showEditModal && employee && (
        <div
          className="
            fixed inset-0 z-[110]
            flex items-center justify-center
            bg-black/60 p-3
            backdrop-blur-sm
            sm:p-5
          "
          onMouseDown={closeEditModal}
        >
          <div
            className="
              flex w-full max-w-lg
              max-h-[92dvh]
              flex-col
              overflow-hidden
              rounded-2xl
              border border-gray-200
              bg-white
              shadow-2xl
              dark:border-white/10
              dark:bg-[#151515]
            "
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div
              className="
                flex shrink-0
                items-center justify-between
                border-b border-gray-200
                px-4 py-4
                sm:px-5
                dark:border-white/10
              "
            >
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-[#1A1A2E] dark:text-white">
                  Edit Profile
                </h2>

                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Update your personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                aria-label="Close edit profile"
                className="
                  flex h-9 w-9 shrink-0
                  items-center justify-center
                  rounded-lg
                  text-gray-500
                  transition
                  hover:bg-gray-100
                  hover:text-gray-900
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:text-gray-400
                  dark:hover:bg-white/10
                  dark:hover:text-white
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="hide-scrollbar overflow-y-auto p-4 sm:p-5">
              {/* Avatar Preview */}
              <div className="mb-5 flex items-center gap-4">
                <div
                  className="
                    flex h-16 w-16 shrink-0
                    items-center justify-center
                    overflow-hidden
                    rounded-2xl
                    bg-blue-100
                    text-lg font-bold
                    text-blue-700
                    dark:bg-blue-500/20
                    dark:text-blue-300
                  "
                >
                  {editForm.profileImage ? (
                    <img
                      src={editForm.profileImage}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.style.display =
                          "none";
                      }}
                    />
                  ) : (
                    getInitials(editForm.fullName)
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A2E] dark:text-white">
                    Profile Information
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can update your name, phone number
                    and profile image.
                  </p>
                </div>
              </div>

              {/* Error */}
              {saveError && (
                <div
                  className="
                    mb-4 flex items-start gap-2
                    rounded-xl
                    border border-red-200
                    bg-red-50
                    p-3
                    text-sm text-red-700
                    dark:border-red-500/30
                    dark:bg-red-500/10
                    dark:text-red-300
                  "
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>{saveError}</p>
                </div>
              )}

              {/* Success */}
              {saveSuccess && (
                <div
                  className="
                    mb-4 flex items-start gap-2
                    rounded-xl
                    border border-emerald-200
                    bg-emerald-50
                    p-3
                    text-sm text-emerald-700
                    dark:border-emerald-500/30
                    dark:bg-emerald-500/10
                    dark:text-emerald-300
                  "
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>{saveSuccess}</p>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label
                  htmlFor="profile-full-name"
                  className="
                    mb-1.5 block
                    text-sm font-semibold
                    text-[#1A1A2E]
                    dark:text-white
                  "
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      h-4 w-4
                      -translate-y-1/2
                      text-gray-400
                      dark:text-gray-500
                    "
                  />

                  <input
                    id="profile-full-name"
                    type="text"
                    value={editForm.fullName}
                    onChange={(event) =>
                      handleEditChange(
                        "fullName",
                        event.target.value,
                      )
                    }
                    className="
                      h-11 w-full
                      rounded-xl
                      border border-gray-200
                      bg-white
                      pl-10 pr-3
                      text-sm
                      text-[#1A1A2E]
                      outline-none
                      transition
                      focus:border-[#0066FF]
                      focus:ring-2
                      focus:ring-[#0066FF]/10
                      dark:border-white/10
                      dark:bg-[#101010]
                      dark:text-white
                      dark:focus:border-[#1E90FF]
                      dark:focus:ring-[#1E90FF]/10
                    "
                    placeholder="Enter your full name"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="mt-4">
                <label
                  htmlFor="profile-phone"
                  className="
                    mb-1.5 block
                    text-sm font-semibold
                    text-[#1A1A2E]
                    dark:text-white
                  "
                >
                  Phone Number
                </label>

                <div className="relative">
                  <Phone
                    className="
                      pointer-events-none
                      absolute left-3 top-1/2
                      h-4 w-4
                      -translate-y-1/2
                      text-gray-400
                      dark:text-gray-500
                    "
                  />

                  <input
                    id="profile-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={editForm.phone}
                    onChange={(event) => {
                      const value =
                        event.target.value.replace(
                          /\D/g,
                          "",
                        );

                      handleEditChange(
                        "phone",
                        value,
                      );
                    }}
                    className="
                      h-11 w-full
                      rounded-xl
                      border border-gray-200
                      bg-white
                      pl-10 pr-3
                      text-sm
                      text-[#1A1A2E]
                      outline-none
                      transition
                      focus:border-[#0066FF]
                      focus:ring-2
                      focus:ring-[#0066FF]/10
                      dark:border-white/10
                      dark:bg-[#101010]
                      dark:text-white
                      dark:focus:border-[#1E90FF]
                      dark:focus:ring-[#1E90FF]/10
                    "
                    placeholder="Enter 10-digit phone number"
                    disabled={saving}
                  />
                </div>
              </div>

              {/* Profile Image */}
              <div className="mt-4">
                <label
                  htmlFor="profile-image"
                  className="
                    mb-1.5 block
                    text-sm font-semibold
                    text-[#1A1A2E]
                    dark:text-white
                  "
                >
                  Profile Image URL
                </label>

                <input
                  id="profile-image"
                  type="url"
                  value={editForm.profileImage}
                  onChange={(event) =>
                    handleEditChange(
                      "profileImage",
                      event.target.value,
                    )
                  }
                  className="
                    h-11 w-full
                    rounded-xl
                    border border-gray-200
                    bg-white
                    px-3
                    text-sm
                    text-[#1A1A2E]
                    outline-none
                    transition
                    focus:border-[#0066FF]
                    focus:ring-2
                    focus:ring-[#0066FF]/10
                    dark:border-white/10
                    dark:bg-[#101010]
                    dark:text-white
                    dark:focus:border-[#1E90FF]
                    dark:focus:ring-[#1E90FF]/10
                  "
                  placeholder="https://example.com/profile.jpg"
                  disabled={saving}
                />

                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  Enter a valid image URL. Leave empty to
                  use your initials.
                </p>
              </div>

              {/* Read-only fields */}
              <div
                className="
                  mt-5 rounded-xl
                  border border-gray-200
                  bg-gray-50
                  p-4
                  dark:border-white/10
                  dark:bg-white/[0.03]
                "
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Read-only information
                </p>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <ReadOnlyField
                    label="Employee ID"
                    value={employee.employeeId}
                  />

                  <ReadOnlyField
                    label="Email"
                    value={employee.email}
                  />

                  <ReadOnlyField
                    label="Department"
                    value={departmentName}
                  />

                  <ReadOnlyField
                    label="Designation"
                    value={employee.designation}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              className="
                flex shrink-0
                flex-col-reverse gap-2
                border-t border-gray-200
                bg-gray-50
                p-4
                sm:flex-row
                sm:justify-end
                dark:border-white/10
                dark:bg-[#111111]
              "
            >
              <button
                type="button"
                onClick={closeEditModal}
                disabled={saving}
                className="
                  h-10 w-full
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-4
                  text-sm font-semibold
                  text-gray-700
                  transition
                  hover:bg-gray-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  sm:w-auto
                  dark:border-white/10
                  dark:bg-[#1B1B1B]
                  dark:text-gray-200
                  dark:hover:bg-white/10
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="
                  inline-flex h-10 w-full
                  items-center justify-center
                  gap-2
                  rounded-xl
                  bg-[#0066FF]
                  px-5
                  text-sm font-semibold
                  text-white
                  transition
                  hover:bg-[#0052CC]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  sm:w-auto
                  dark:bg-[#1E90FF]
                  dark:hover:bg-[#0077DD]
                "
              >
                {saving ? (
                  <>
                    <span
                      className="
                        h-4 w-4
                        animate-spin
                        rounded-full
                        border-2
                        border-white/40
                        border-t-white
                      "
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
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

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-bold text-[#1A1A2E] dark:text-white">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <span className="text-blue-600 dark:text-blue-400">
          {icon}
        </span>

        <span>{label}</span>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-[#1A1A2E] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-medium text-[#1A1A2E] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="min-h-full w-full space-y-6 bg-[#F8F9FA] dark:bg-[#0D0D0D]">
      <div>
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-white/10" />

        <div className="mt-3 h-8 w-44 animate-pulse rounded bg-gray-200 dark:bg-white/10" />

        <div className="mt-2 h-4 w-72 max-w-full animate-pulse rounded bg-gray-200 dark:bg-white/10" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-[#151515]">
        <div className="h-32 animate-pulse bg-gray-200 dark:bg-white/10" />

        <div className="p-5">
          <div className="h-20 w-20 animate-pulse rounded-2xl bg-gray-200 dark:bg-white/10" />

          <div className="mt-4 h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />

          <div className="mt-2 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
        </div>
      </div>

      {[1, 2].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-[#151515]"
        >
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-white/10" />

          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((field) => (
              <div key={field}>
                <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-white/10" />

                <div className="mt-2 h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}