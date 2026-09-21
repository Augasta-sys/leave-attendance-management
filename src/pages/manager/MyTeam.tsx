import {
  BriefcaseBusiness,
  CalendarDays,
  Mail,
  Phone,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";

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

type StatusFilter =
  | "All"
  | "Active"
  | "Inactive"
  | "On Notice"
  | "Resigned";

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(
    `${date.split("T")[0]}T00:00:00`,
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

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getStatusClass(
  status: Employee["employmentStatus"],
) {
  switch (status) {
    case "Active":
      return `
        bg-[#E8F8EF] text-[#16834B]
        dark:bg-[#183A2A] dark:text-[#00FF85]
      `;

    case "Inactive":
      return `
        bg-[#F1F5F9] text-[#64748B]
        dark:bg-[#292929] dark:text-[#B3B3B3]
      `;

    case "On Notice":
      return `
        bg-[#FFF5D9] text-[#A16207]
        dark:bg-[#3A321A] dark:text-[#FFD166]
      `;

    case "Resigned":
      return `
        bg-[#FDECEC] text-[#C53030]
        dark:bg-[#3A2020] dark:text-[#FF8A8A]
      `;

    default:
      return `
        bg-[#F1F5F9] text-[#64748B]
        dark:bg-[#292929] dark:text-[#B3B3B3]
      `;
  }
}

export default function MyTeam() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<
    Employee[]
  >([]);

  const [departments, setDepartments] = useState<
    Department[]
  >([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] =
    useState("All");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          employeesResponse,
          departmentsResponse,
        ] = await Promise.all([
          api.get<Employee[]>("/employees"),
          api.get<Department[]>("/departments"),
        ]);

        if (cancelled) {
          return;
        }

        setEmployees(
          Array.isArray(employeesResponse.data)
            ? employeesResponse.data
            : [],
        );

        setDepartments(
          Array.isArray(
            departmentsResponse.data,
          )
            ? departmentsResponse.data
            : [],
        );
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(
          "Failed to load team members:",
          err,
        );

        setError(
          "Unable to load team members. Please make sure JSON Server is running.",
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
  }, []);

  const managerEmployee = useMemo(() => {
    if (!user) {
      return undefined;
    }

    return employees.find(
      (employee) =>
        employee.employeeId === user.employeeId ||
        employee.id === user.employeeId,
    );
  }, [employees, user]);

  const managerIds = useMemo(() => {
    const ids = new Set<string>();

    if (user?.employeeId) {
      ids.add(user.employeeId);
    }

    if (managerEmployee?.id) {
      ids.add(managerEmployee.id);
    }

    if (managerEmployee?.employeeId) {
      ids.add(managerEmployee.employeeId);
    }

    return ids;
  }, [managerEmployee, user]);

  const teamMembers = useMemo(() => {
    return employees.filter((employee) => {
      if (
        employee.employmentStatus &&
        employee.employmentStatus !== "Active"
      ) {
        return false;
      }

      return (
        employee.managerId !== null &&
        employee.managerId !== undefined &&
        managerIds.has(employee.managerId)
      );
    });
  }, [employees, managerIds]);

  const departmentMap = useMemo(() => {
    const map = new Map<string, string>();

    departments.forEach((department) => {
      map.set(
        department.id,
        department.name,
      );

      map.set(
        department.departmentId,
        department.name,
      );
    });

    return map;
  }, [departments]);

  const getDepartmentName = (
    departmentId: string,
  ) => {
    return (
      departmentMap.get(departmentId) ??
      "Unknown Department"
    );
  };

  const filteredMembers = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return teamMembers.filter((employee) => {
      const matchesSearch =
        !search ||
        employee.fullName
          .toLowerCase()
          .includes(search) ||
        employee.employeeId
          .toLowerCase()
          .includes(search) ||
        employee.email
          .toLowerCase()
          .includes(search) ||
        employee.designation
          .toLowerCase()
          .includes(search);

      const matchesDepartment =
        departmentFilter === "All" ||
        employee.departmentId ===
          departmentFilter;

      const matchesStatus =
        statusFilter === "All" ||
        employee.employmentStatus ===
          statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }, [
    teamMembers,
    searchTerm,
    departmentFilter,
    statusFilter,
  ]);

  const teamDepartments = useMemo(() => {
    const ids = new Set(
      teamMembers.map(
        (employee) => employee.departmentId,
      ),
    );

    return departments.filter(
      (department) =>
        ids.has(department.id) ||
        ids.has(department.departmentId),
    );
  }, [departments, teamMembers]);

  const activeCount = teamMembers.filter(
    (employee) =>
      employee.employmentStatus === "Active",
  ).length;

  const onNoticeCount = teamMembers.filter(
    (employee) =>
      employee.employmentStatus === "On Notice",
  ).length;

  const inactiveCount = teamMembers.filter(
    (employee) =>
      employee.employmentStatus === "Inactive",
  ).length;

  const clearFilters = () => {
    setSearchTerm("");
    setDepartmentFilter("All");
    setStatusFilter("All");
  };

  const hasFilters =
    searchTerm.trim() !== "" ||
    departmentFilter !== "All" ||
    statusFilter !== "All";

  if (loading) {
    return (
      <div
        className="
          min-h-full w-full space-y-6
          bg-[#F8F9FA]
          dark:bg-[#0D0D0D]
        "
      >
        <div className="space-y-2">
          <div
            className="
              h-8 w-52 animate-pulse rounded-lg
              bg-[#E5E7EB]
              dark:bg-[#292929]
            "
          />

          <div
            className="
              h-4 w-72 animate-pulse rounded-lg
              bg-[#E5E7EB]
              dark:bg-[#292929]
            "
          />
        </div>

        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-3
          "
        >
          {Array.from({
            length: 3,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-28 animate-pulse rounded-2xl
                bg-white
                dark:bg-[#181818]
              "
            />
          ))}
        </div>

        <div
          className="
            h-16 animate-pulse rounded-2xl
            bg-white
            dark:bg-[#181818]
          "
        />

        <div
          className="
            grid grid-cols-1 gap-4
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="
                h-64 animate-pulse rounded-2xl
                bg-white
                dark:bg-[#181818]
              "
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="
          min-h-full w-full
          bg-[#F8F9FA]
          dark:bg-[#0D0D0D]
        "
      >
        <div
          className="
            rounded-2xl border p-6
            border-[#FECACA]
            bg-[#FEF2F2]
            dark:border-[#542020]
            dark:bg-[#211414]
          "
        >
          <h2
            className="
              text-base font-semibold
              text-[#991B1B]
              dark:text-[#FF8A8A]
            "
          >
            Unable to load My Team
          </h2>

          <p
            className="
              mt-1 text-sm
              text-[#7F1D1D]
              dark:text-[#D6D6D6]
            "
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className="
          min-h-full w-full min-w-0
          space-y-6 overflow-x-hidden
          bg-[#F8F9FA]
          text-[#1A1A2E]
          dark:bg-[#0D0D0D]
          dark:text-white
        "
      >
        {/* HEADER */}

        <div
          className="
            flex flex-col gap-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-sm font-medium
                text-[#667085]
                dark:text-[#B3B3B3]
              "
            >
              Manager Portal
            </p>

            <h1
              className="
                mt-1 text-2xl font-bold tracking-tight
                text-[#1A1A2E]
                dark:text-white
                sm:text-3xl
              "
            >
              My Team
            </h1>

            <p
              className="
                mt-1 text-sm
                text-[#667085]
                dark:text-[#999999]
              "
            >
              View and manage the employees
              assigned to your team.
            </p>
          </div>

          <div
            className="
              flex w-fit items-center gap-2
              rounded-xl border px-3 py-2
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            <Users
              size={17}
              className="
                text-[#0066FF]
                dark:text-[#4D9AFF]
              "
            />

            <span
              className="
                text-sm font-semibold
                text-[#475467]
                dark:text-[#C7C7C7]
              "
            >
              {teamMembers.length} Team{" "}
              {teamMembers.length === 1
                ? "Member"
                : "Members"}
            </span>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <div
          className="
            grid grid-cols-1 gap-4
            sm:grid-cols-3
          "
        >
          <div
            className="
              rounded-2xl border p-5
              border-[#E1E5EA]
              bg-white
              transition-all duration-200
              hover:-translate-y-1
              hover:border-[#B8D1FF]
              hover:shadow-lg
              dark:border-[#333333]
              dark:bg-[#181818]
              dark:hover:border-[#3B82F6]
              dark:hover:bg-[#1D1D1D]
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="
                    text-sm font-medium
                    text-[#667085]
                    dark:text-[#B3B3B3]
                  "
                >
                  Active Members
                </p>

                <p
                  className="
                    mt-2 text-3xl font-bold
                    text-[#16834B]
                    dark:text-[#00FF85]
                  "
                >
                  {activeCount}
                </p>
              </div>

              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#E8F8EF]
                  text-[#16834B]
                  dark:bg-[#183A2A]
                  dark:text-[#00FF85]
                "
              >
                <UserRound size={21} />
              </div>
            </div>
          </div>

          <div
            className="
              rounded-2xl border p-5
              border-[#E1E5EA]
              bg-white
              transition-all duration-200
              hover:-translate-y-1
              hover:border-[#B8D1FF]
              hover:shadow-lg
              dark:border-[#333333]
              dark:bg-[#181818]
              dark:hover:border-[#3B82F6]
              dark:hover:bg-[#1D1D1D]
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="
                    text-sm font-medium
                    text-[#667085]
                    dark:text-[#B3B3B3]
                  "
                >
                  On Notice
                </p>

                <p
                  className="
                    mt-2 text-3xl font-bold
                    text-[#A16207]
                    dark:text-[#FFD166]
                  "
                >
                  {onNoticeCount}
                </p>
              </div>

              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#FFF5D9]
                  text-[#A16207]
                  dark:bg-[#3A321A]
                  dark:text-[#FFD166]
                "
              >
                <BriefcaseBusiness size={21} />
              </div>
            </div>
          </div>

          <div
            className="
              rounded-2xl border p-5
              border-[#E1E5EA]
              bg-white
              transition-all duration-200
              hover:-translate-y-1
              hover:border-[#B8D1FF]
              hover:shadow-lg
              dark:border-[#333333]
              dark:bg-[#181818]
              dark:hover:border-[#3B82F6]
              dark:hover:bg-[#1D1D1D]
            "
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="
                    text-sm font-medium
                    text-[#667085]
                    dark:text-[#B3B3B3]
                  "
                >
                  Inactive Members
                </p>

                <p
                  className="
                    mt-2 text-3xl font-bold
                    text-[#64748B]
                    dark:text-[#B3B3B3]
                  "
                >
                  {inactiveCount}
                </p>
              </div>

              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl
                  bg-[#F1F5F9]
                  text-[#64748B]
                  dark:bg-[#292929]
                  dark:text-[#B3B3B3]
                "
              >
                <UserRound size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}

        <div
          className="
            rounded-2xl border p-4
            border-[#E1E5EA]
            bg-white
            dark:border-[#333333]
            dark:bg-[#181818]
          "
        >
          <div
            className="
              flex flex-col gap-3
              lg:flex-row
              lg:items-center
            "
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={18}
                className="
                  pointer-events-none
                  absolute left-3 top-1/2
                  -translate-y-1/2
                  text-[#98A2B3]
                  dark:text-[#777777]
                "
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="
                  Search by name, employee ID,
                  email or designation...
                "
                className="
                  h-11 w-full rounded-xl border
                  bg-white pl-10 pr-10 text-sm
                  outline-none
                  border-[#D0D5DD]
                  text-[#1A1A2E]
                  placeholder:text-[#98A2B3]
                  focus:border-[#0066FF]
                  focus:ring-2
                  focus:ring-[#0066FF]/10
                  dark:border-[#3A3A3A]
                  dark:bg-[#222222]
                  dark:text-white
                  dark:placeholder:text-[#777777]
                  dark:focus:border-[#4D9AFF]
                "
              />

              {searchTerm && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchTerm("")
                  }
                  className="
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    rounded-md p-1
                    text-[#667085]
                    transition
                    hover:bg-[#F1F5F9]
                    hover:text-[#1A1A2E]
                    dark:text-[#999999]
                    dark:hover:bg-[#333333]
                    dark:hover:text-white
                  "
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value,
                )
              }
              className="
                h-11 rounded-xl border
                bg-white px-3 text-sm
                outline-none
                border-[#D0D5DD]
                text-[#344054]
                focus:border-[#0066FF]
                focus:ring-2
                focus:ring-[#0066FF]/10
                dark:border-[#3A3A3A]
                dark:bg-[#222222]
                dark:text-white
                dark:focus:border-[#4D9AFF]
                lg:w-52
              "
            >
              <option value="All">
                All Departments
              </option>

              {teamDepartments.map(
                (department) => (
                  <option
                    key={department.id}
                    value={department.departmentId}
                  >
                    {department.name}
                  </option>
                ),
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter,
                )
              }
              className="
                h-11 rounded-xl border
                bg-white px-3 text-sm
                outline-none
                border-[#D0D5DD]
                text-[#344054]
                focus:border-[#0066FF]
                focus:ring-2
                focus:ring-[#0066FF]/10
                dark:border-[#3A3A3A]
                dark:bg-[#222222]
                dark:text-white
                dark:focus:border-[#4D9AFF]
                lg:w-44
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

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  h-11 rounded-xl border
                  px-4 text-sm font-semibold
                  transition-all duration-200
                  border-[#D0D5DD]
                  bg-white
                  text-[#475467]
                  hover:border-[#0066FF]
                  hover:bg-[#EEF4FF]
                  hover:text-[#0066FF]
                  dark:border-[#3A3A3A]
                  dark:bg-[#222222]
                  dark:text-[#C7C7C7]
                  dark:hover:border-[#4D9AFF]
                  dark:hover:bg-[#10233F]
                  dark:hover:text-[#4D9AFF]
                "
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="mt-3">
            <p
              className="
                text-xs
                text-[#98A2B3]
                dark:text-[#888888]
              "
            >
              Showing{" "}
              <span className="font-semibold">
                {filteredMembers.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold">
                {teamMembers.length}
              </span>{" "}
              team members
            </p>
          </div>
        </div>

        {/* TEAM MEMBERS */}

        {filteredMembers.length === 0 ? (
          <div
            className="
              rounded-2xl border
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
          >
            <div
              className="
                flex min-h-[320px]
                items-center justify-center
                px-5 text-center
              "
            >
              <div>
                <div
                  className="
                    mx-auto flex h-14 w-14
                    items-center justify-center
                    rounded-full
                    bg-[#EEF4FF]
                    text-[#0066FF]
                    dark:bg-[#10233F]
                    dark:text-[#4D9AFF]
                  "
                >
                  <Users size={24} />
                </div>

                <h2
                  className="
                    mt-4 text-base font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {teamMembers.length === 0
                    ? "No team members found"
                    : "No matching members"}
                </h2>

                <p
                  className="
                    mt-1 max-w-md text-sm
                    text-[#98A2B3]
                    dark:text-[#888888]
                  "
                >
                  {teamMembers.length === 0
                    ? "Employees assigned to you will appear here."
                    : "Try changing your search or filters."}
                </p>

                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="
                      mt-4 rounded-xl
                      bg-[#0066FF] px-4 py-2
                      text-sm font-semibold
                      text-white
                      transition-all duration-200
                      hover:bg-[#0052CC]
                      hover:shadow-md
                      dark:bg-[#1E90FF]
                      dark:hover:bg-[#4D9AFF]
                    "
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="
              grid grid-cols-1 gap-5
              sm:grid-cols-2
              xl:grid-cols-3
            "
          >
            {filteredMembers.map(
              (employee) => (
                <div
                  key={employee.id}
                  className="
                    group rounded-2xl border p-5
                    border-[#E1E5EA]
                    bg-white
                    transition-all duration-200
                    hover:-translate-y-1
                    hover:border-[#B8D1FF]
                    hover:shadow-xl
                    dark:border-[#333333]
                    dark:bg-[#181818]
                    dark:hover:border-[#3B82F6]
                    dark:hover:bg-[#1D1D1D]
                  "
                >
                  {/* Employee header */}

                  <div className="flex items-start gap-3">
                    <div
                      className="
                        flex h-12 w-12 shrink-0
                        items-center justify-center
                        overflow-hidden rounded-full
                        bg-[#EAF2FF]
                        text-sm font-bold
                        text-[#0066FF]
                        ring-2 ring-transparent
                        transition-all duration-200
                        group-hover:ring-[#B8D1FF]
                        dark:bg-[#10233F]
                        dark:text-[#4D9AFF]
                        dark:group-hover:ring-[#3B82F6]
                      "
                    >
                      {employee.profileImage ? (
                        <img
                          src={
                            employee.profileImage
                          }
                          alt={
                            employee.fullName
                          }
                          className="
                            h-full w-full
                            object-cover
                          "
                        />
                      ) : (
                        getInitials(
                          employee.fullName,
                        )
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h2
                            className="
                              truncate text-base
                              font-semibold
                              text-[#1A1A2E]
                              transition-colors
                              duration-200
                              group-hover:text-[#0066FF]
                              dark:text-white
                              dark:group-hover:text-[#4D9AFF]
                            "
                          >
                            {employee.fullName}
                          </h2>

                          <p
                            className="
                              mt-0.5 text-xs
                              text-[#98A2B3]
                              dark:text-[#888888]
                            "
                          >
                            {employee.employeeId}
                          </p>
                        </div>

                        <span
                          className={`
                            shrink-0 rounded-full
                            px-2.5 py-1
                            text-[10px] font-semibold
                            ${getStatusClass(
                              employee.employmentStatus,
                            )}
                          `}
                        >
                          {employee.employmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employee information */}

                  <div
                    className="
                      mt-5 space-y-3
                      border-t pt-4
                      border-[#E1E5EA]
                      dark:border-[#333333]
                    "
                  >
                    <div className="flex items-center gap-3">
                      <BriefcaseBusiness
                        size={16}
                        className="
                          shrink-0
                          text-[#667085]
                          dark:text-[#888888]
                        "
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-[11px]
                            text-[#98A2B3]
                            dark:text-[#777777]
                          "
                        >
                          Designation
                        </p>

                        <p
                          className="
                            truncate text-sm font-medium
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {employee.designation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Users
                        size={16}
                        className="
                          shrink-0
                          text-[#667085]
                          dark:text-[#888888]
                        "
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-[11px]
                            text-[#98A2B3]
                            dark:text-[#777777]
                          "
                        >
                          Department
                        </p>

                        <p
                          className="
                            truncate text-sm font-medium
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {getDepartmentName(
                            employee.departmentId,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail
                        size={16}
                        className="
                          shrink-0
                          text-[#667085]
                          dark:text-[#888888]
                        "
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-[11px]
                            text-[#98A2B3]
                            dark:text-[#777777]
                          "
                        >
                          Email
                        </p>

                        <p
                          className="
                            truncate text-sm font-medium
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {employee.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone
                        size={16}
                        className="
                          shrink-0
                          text-[#667085]
                          dark:text-[#888888]
                        "
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-[11px]
                            text-[#98A2B3]
                            dark:text-[#777777]
                          "
                        >
                          Phone
                        </p>

                        <p
                          className="
                            truncate text-sm font-medium
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {employee.phone || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays
                        size={16}
                        className="
                          shrink-0
                          text-[#667085]
                          dark:text-[#888888]
                        "
                      />

                      <div className="min-w-0">
                        <p
                          className="
                            text-[11px]
                            text-[#98A2B3]
                            dark:text-[#777777]
                          "
                        >
                          Joining Date
                        </p>

                        <p
                          className="
                            truncate text-sm font-medium
                            text-[#475467]
                            dark:text-[#C7C7C7]
                          "
                        >
                          {formatDate(
                            employee.joiningDate,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* View details */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedEmployee(
                        employee,
                      )
                    }
                    className="
                      mt-5 w-full rounded-xl
                      border px-4 py-2.5
                      text-sm font-semibold
                      transition-all duration-200
                      border-[#D0D5DD]
                      bg-white
                      text-[#0066FF]
                      hover:border-[#0066FF]
                      hover:bg-[#EEF4FF]
                      hover:shadow-sm
                      dark:border-[#3A3A3A]
                      dark:bg-[#222222]
                      dark:text-[#4D9AFF]
                      dark:hover:border-[#4D9AFF]
                      dark:hover:bg-[#10233F]
                    "
                  >
                    View Details
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedEmployee && (
        <div
          className="
            fixed inset-0 z-[100]
            flex items-center justify-center
            bg-black/50 p-4
            backdrop-blur-sm
          "
          onClick={() =>
            setSelectedEmployee(null)
          }
        >
          <div
            className="
              max-h-[90vh] w-full max-w-lg
              overflow-y-auto rounded-2xl
              border p-6 shadow-2xl
              border-[#E1E5EA]
              bg-white
              dark:border-[#333333]
              dark:bg-[#181818]
            "
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="
                    flex h-14 w-14 shrink-0
                    items-center justify-center
                    overflow-hidden rounded-full
                    bg-[#EAF2FF]
                    text-lg font-bold
                    text-[#0066FF]
                    dark:bg-[#10233F]
                    dark:text-[#4D9AFF]
                  "
                >
                  {selectedEmployee.profileImage ? (
                    <img
                      src={
                        selectedEmployee.profileImage
                      }
                      alt={
                        selectedEmployee.fullName
                      }
                      className="
                        h-full w-full
                        object-cover
                      "
                    />
                  ) : (
                    getInitials(
                      selectedEmployee.fullName,
                    )
                  )}
                </div>

                <div className="min-w-0">
                  <h2
                    className="
                      truncate text-lg font-bold
                      text-[#1A1A2E]
                      dark:text-white
                    "
                  >
                    {selectedEmployee.fullName}
                  </h2>

                  <p
                    className="
                      mt-1 text-sm
                      text-[#667085]
                      dark:text-[#999999]
                    "
                  >
                    {selectedEmployee.employeeId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEmployee(null)
                }
                className="
                  rounded-lg p-2
                  text-[#667085]
                  transition-all duration-200
                  hover:bg-[#F1F5F9]
                  hover:text-[#1A1A2E]
                  dark:text-[#999999]
                  dark:hover:bg-[#333333]
                  dark:hover:text-white
                "
                aria-label="Close details"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Designation
                </p>

                <p
                  className="
                    mt-1 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {selectedEmployee.designation}
                </p>
              </div>

              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Department
                </p>

                <p
                  className="
                    mt-1 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {getDepartmentName(
                    selectedEmployee.departmentId,
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Email
                </p>

                <p
                  className="
                    mt-1 break-all text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {selectedEmployee.email}
                </p>
              </div>

              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Phone
                </p>

                <p
                  className="
                    mt-1 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {selectedEmployee.phone ||
                    "—"}
                </p>
              </div>

              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Joining Date
                </p>

                <p
                  className="
                    mt-1 text-sm font-semibold
                    text-[#344054]
                    dark:text-white
                  "
                >
                  {formatDate(
                    selectedEmployee.joiningDate,
                  )}
                </p>
              </div>

              <div
                className="
                  rounded-xl border p-4
                  border-[#E1E5EA]
                  bg-[#F8F9FA]
                  dark:border-[#333333]
                  dark:bg-[#222222]
                "
              >
                <p
                  className="
                    text-xs
                    text-[#98A2B3]
                    dark:text-[#777777]
                  "
                >
                  Status
                </p>

                <span
                  className={`
                    mt-2 inline-flex rounded-full
                    px-2.5 py-1
                    text-xs font-semibold
                    ${getStatusClass(
                      selectedEmployee.employmentStatus,
                    )}
                  `}
                >
                  {selectedEmployee.employmentStatus}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSelectedEmployee(null)
              }
              className="
                mt-6 w-full rounded-xl
                bg-[#0066FF] px-4 py-2.5
                text-sm font-semibold text-white
                transition-all duration-200
                hover:bg-[#0052CC]
                hover:shadow-md
                dark:bg-[#1E90FF]
                dark:hover:bg-[#4D9AFF]
              "
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}