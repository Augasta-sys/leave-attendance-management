import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";

import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import ScrollToTop from "./components/layout/ScrollToTop";

import AdminDashboard from "./pages/AdminDashboard";
import AdminEmployees from "./pages/admin/Employees";
import Departments from "./pages/admin/Departments";
import AdminAttendance from "./pages/admin/Attendance";
import AdminLeaveRequests from "./pages/admin/LeaveRequests";
import AdminReports from "./pages/admin/Reports";
import AdminLeaveBalances from "./pages/admin/LeaveBalances";
import Settings from "./pages/admin/Settings";

import HRDashboard from "./pages/hr/HRDashboard";
import HREmployees from "./pages/hr/Employees";
import HRAttendance from "./pages/hr/Attendance";
import HRLeaveRequests from "./pages/hr/LeaveRequests";
import HRLeaveTypes from "./pages/hr/LeaveTypes";
import HRLeaveBalances from "./pages/hr/LeaveBalances";

import ManagerDashboard from "./pages/ManagerDashboard";
import MyTeam from "./pages/manager/MyTeam";
import ManagerAttendance from "./pages/manager/Attendance";
import ManagerLeaveRequests from "./pages/manager/LeaveRequests";
import ManagerLeaveBalances from "./pages/manager/LeaveBalances";

import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeAttendance from "./pages/employee/Attendance";
import ApplyLeave from "./pages/employee/ApplyLeave";
import EmployeeLeaveRequests from "./pages/employee/LeaveRequests";
import EmployeeLeaveBalance from "./pages/employee/LeaveBalance";
import EmployeeProfile from "./pages/employee/Profile";

import { useAuth } from "./context/AuthContext";

function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>

     <ScrollToTop />
      <Routes>
        {/* Public Routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<SignUp />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* ADMIN */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["admin"]}
            />
          }
        >
          <Route
            path="/admin/dashboard"
            element={
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/employees"
            element={
              <DashboardLayout>
                <AdminEmployees />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/departments"
            element={
              <DashboardLayout>
                <Departments />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/attendance"
            element={
              <DashboardLayout>
                <AdminAttendance />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/leave-requests"
            element={
              <DashboardLayout>
                <AdminLeaveRequests />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/leave-balances"
            element={
              <DashboardLayout>
                <AdminLeaveBalances />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <DashboardLayout>
                <AdminReports />
              </DashboardLayout>
            }
          />

          <Route
            path="/admin/settings"
            element={
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            }
          />
        </Route>

        {/* HR */}

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["hr"]}
            />
          }
        >
          <Route
            path="/hr/dashboard"
            element={
              <DashboardLayout>
                <HRDashboard />
              </DashboardLayout>
            }
          />

          <Route
            path="/hr/employees"
            element={
              <DashboardLayout>
                <HREmployees />
              </DashboardLayout>
            }
          />

          <Route
            path="/hr/attendance"
            element={
              <DashboardLayout>
                <HRAttendance />
              </DashboardLayout>
            }
          />

          <Route
            path="/hr/leave-requests"
            element={
              <DashboardLayout>
                <HRLeaveRequests />
              </DashboardLayout>
            }
          />

          <Route
  path="/hr/leave-types"
  element={
    <DashboardLayout>
      <HRLeaveTypes />
    </DashboardLayout>
  }
/>

<Route
  path="/hr/leave-balances"
  element={
    <DashboardLayout>
      <HRLeaveBalances />
    </DashboardLayout>
  }
/>
        </Route>

     {/* MANAGER */}

<Route
  element={
    <ProtectedRoute
      allowedRoles={["manager"]}
    />
  }
>
  <Route
    path="/manager/dashboard"
    element={
      <DashboardLayout>
        <ManagerDashboard />
      </DashboardLayout>
    }
  />

  <Route
    path="/manager/team"
    element={
      <DashboardLayout>
        <MyTeam />
      </DashboardLayout>
    }
  />

  <Route
    path="/manager/attendance"
    element={
      <DashboardLayout>
        <ManagerAttendance />
      </DashboardLayout>
    }
  />

  <Route
    path="/manager/leave-requests"
    element={
      <DashboardLayout>
        <ManagerLeaveRequests />
      </DashboardLayout>
    }
  />

  <Route
  path="/manager/leave-balances"
  element={
    <DashboardLayout>
      <ManagerLeaveBalances />
    </DashboardLayout>
  }
/>
</Route>

{/* EMPLOYEE */}
<Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
  <Route
    path="/employee/dashboard"
    element={
      <DashboardLayout>
        <EmployeeDashboard />
      </DashboardLayout>
    }
  />

  <Route
    path="/employee/attendance"
    element={
      <DashboardLayout>
        <EmployeeAttendance />
      </DashboardLayout>
    }
  />

  <Route
    path="/employee/apply-leave"
    element={
      <DashboardLayout>
        <ApplyLeave />
      </DashboardLayout>
    }
  />

  <Route
    path="/employee/leave-requests"
    element={
      <DashboardLayout>
        <EmployeeLeaveRequests />
      </DashboardLayout>
    }
  />

  <Route
  path="/employee/leave-balance"
  element={
    <DashboardLayout>
      <EmployeeLeaveBalance />
    </DashboardLayout>
  }
/>

<Route
  path="/employee/profile"
  element={
    <DashboardLayout>
      <EmployeeProfile />
    </DashboardLayout>
  }
/>

</Route>

        {/* Default */}

        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? `/${user.role}/dashboard`
                  : "/login"
              }
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? `/${user.role}/dashboard`
                  : "/login"
              }
              replace
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;