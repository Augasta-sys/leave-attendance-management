import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import loginIllustration from "../assets/login-illustration.png";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loginError, setLoginError] = useState("");

  const [isLoading, setIsLoading] = useState(false);

 const validateForm = () => {
  let isValid = true;

  setEmailError("");
  setPasswordError("");
  setLoginError("");

  if (!email.trim()) {
    setEmailError("Email is required.");
    isValid = false;
  } else if (email !== email.toLowerCase()) {
    setEmailError("Email must contain only lowercase letters.");
    isValid = false;
  } else if (
    !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(
      email.trim(),
    )
  ) {
    setEmailError("Please enter a valid email address.");
    isValid = false;
  }

  if (!password) {
    setPasswordError("Password is required.");
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async (
  event: React.FormEvent<HTMLFormElement>,
) => {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  setIsLoading(true);
  setLoginError("");

  try {
    const loggedInUser = await login({
      email: email.trim(),
      password,
    });

    if (!loggedInUser) {
      setLoginError("Invalid email or password.");
      return;
    }

    switch (loggedInUser.role) {
      case "admin":
        navigate("/admin/dashboard");
        break;

      case "hr":
        navigate("/hr/dashboard");
        break;

      case "manager":
        navigate("/manager/dashboard");
        break;

      case "employee":
        navigate("/employee/dashboard");
        break;

      default:
        setLoginError("Invalid user role.");
    }
  } catch (error) {
    console.error("Login failed:", error);
    setLoginError("Something went wrong. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <main className="auth-page bg-[#dce9ff] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto h-full w-full max-w-[1700px] overflow-hidden rounded-2xl shadow-lg">
        <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[40%_60%]">

          {/* =====================================================
              LEFT 40% - LOGIN
          ====================================================== */}

          <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#dce9ff] px-5 py-6 sm:px-8 lg:px-6 xl:px-10">

            {/* Decorative circles */}

            <span
              className="
                absolute
                -left-8
                top-[8%]
                h-16
                w-16
                rounded-full
                border-4
                border-[#6f99df]
              "
            />

            <span
              className="
                absolute
                left-[42%]
                top-[-8px]
                h-5
                w-5
                rounded-full
                bg-[#82a8e8]
              "
            />

            <span
              className="
                absolute
                -left-3
                top-[48%]
                h-7
                w-7
                rounded-full
                bg-[#82a8e8]
              "
            />

            <span
              className="
                absolute
                bottom-[-20px]
                left-[8%]
                h-16
                w-16
                rounded-full
                border-4
                border-[#6f99df]
              "
            />

            <span
              className="
                absolute
                bottom-[8%]
                right-[-10px]
                h-20
                w-20
                rounded-full
                border-4
                border-[#6f99df]
              "
            />

            <span
              className="
                absolute
                bottom-[18%]
                right-[25%]
                h-6
                w-6
                rounded-full
                bg-[#82a8e8]
              "
            />

            {/* Login content */}

           <div className="relative z-20 w-full max-w-[370px]">

              {/* Login card */}

              <div className="rounded-2xl bg-[#a5c3fa] p-5 shadow-xl shadow-blue-900/15 sm:p-6">

                {/* Logo */}

                <div className="flex justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1749dc] text-white shadow-md">
                    <span className="text-sm font-bold">
                      LA
                    </span>
                  </div>
                </div>

                {/* Heading */}

                <div className="mt-4 text-center">
                  <h1 className="text-2xl font-bold text-white sm:text-[26px]">
                    Login Now
                  </h1>

                  <p className="mt-1 text-xs text-[#315b9f]">
                    Leave & Employee Attendance
                  </p>
                </div>

                {/* Error */}

                {loginError && (
                  <div
                    role="alert"
                    className="mt-4 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700"
                  >
                    {loginError}
                  </div>
                )}

                {/* Form */}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-5 space-y-3"
                >

                  {/* Email */}

                  <div>
                    <div className="relative">

                      <Mail
                        size={15}
                        className="
                          pointer-events-none
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-[#5793ed]
                        "
                      />

                    <input
  id="email"
  type="email"
  value={email}
  onChange={(event) => {
    const value = event.target.value;

    if (/[A-Z]/.test(value)) {
      setEmailError("Email must contain only lowercase letters.");
      return;
    }

    setEmail(value);
    setEmailError("");
    setLoginError("");
  }}
  placeholder="Email or Username"
  autoComplete="email"
  className={`
    h-10
    w-full
    rounded-md
    border
    bg-white
    pl-9
    pr-3
    text-xs
    text-slate-800
    outline-none
    placeholder:text-slate-400
    focus:border-blue-500
    focus:ring-2
    focus:ring-blue-500/20
    ${
      emailError
        ? "border-red-500"
        : "border-transparent"
    }
  `}
/>

                    </div>

                    {emailError && (
                      <p className="mt-1 text-[10px] text-red-700">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* Password */}

                  <div>
                    <div className="relative">

                      <LockKeyhole
                        size={15}
                        className="
                          pointer-events-none
                          absolute
                          left-3
                          top-1/2
                          -translate-y-1/2
                          text-[#5793ed]
                        "
                      />

                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setPasswordError("");
                          setLoginError("");
                        }}
                        placeholder="Password"
                        autoComplete="current-password"
                        className={`
                          h-10
                          w-full
                          rounded-md
                          border
                          bg-white
                          pl-9
                          pr-10
                          text-xs
                          text-slate-800
                          outline-none
                          placeholder:text-slate-400
                          focus:border-blue-500
                          focus:ring-2
                          focus:ring-blue-500/20
                          ${
                            passwordError
                              ? "border-red-500"
                              : "border-transparent"
                          }
                        `}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="
                          absolute
                          right-3
                          top-1/2
                          -translate-y-1/2
                          text-[#2f82ee]
                          transition
                          hover:text-blue-800
                        "
                      >
                        {showPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>

                    </div>

                    {passwordError && (
                      <p className="mt-1 text-[10px] text-red-700">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Remember + Forgot */}

                  <div className="flex items-center justify-between gap-2">

                    <label className="flex cursor-pointer items-center gap-1.5">

                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        className="h-3 w-3 accent-blue-700"
                      />

                      <span className="text-[10px] font-medium text-[#173d78]">
                        Remember me
                      </span>

                    </label>

                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="
                        text-[10px]
                        font-semibold
                        text-[#1748b8]
                        transition
                        hover:text-blue-950
                        hover:underline
                      "
                    >
                      Forgot password?
                    </button>

                  </div>

                  {/* Login button */}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="
                      flex
                      h-10
                      w-full
                      items-center
                      justify-center
                      rounded-md
                      bg-[#1749dc]
                      px-4
                      text-sm
                      font-bold
                      uppercase
                      tracking-wide
                      text-white
                      shadow-md
                      transition
                      hover:bg-[#0f3bbd]
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  >
                    {isLoading ? "Signing in..." : "Login"}
                  </button>

                </form>

                {/* Divider */}

                <div className="mt-5 flex items-center gap-2">

                  <div className="h-px flex-1 bg-[#73a1e7]" />

                  <span className="text-[9px] font-medium text-[#456da7]">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-[#73a1e7]" />

                </div>

                {/* Sign up */}

                <div className="mt-4 text-center">

                  <button
                    type="button"
                    onClick={() => navigate("/signup")}
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      text-[11px]
                      font-semibold
                      text-[#17438e]
                      transition
                      hover:text-blue-700
                    "
                  >
                    <UserPlus size={13} />

                    <span>
                      Don't have an account?{" "}
                      <span className="underline underline-offset-2">
                        Sign up
                      </span>
                    </span>
                  </button>

                </div>

              </div>

              {/* Security text */}

              <p className="mt-3 text-center text-[9px] font-medium text-[#456da7]">
                Secure employee attendance and leave management
              </p>

            </div>
          </section>

          {/* =====================================================
              RIGHT 60% - THREE LARGE SEMICIRCLES
          ====================================================== */}

          <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#dce9ff] lg:block">

            {/* =================================================
                SEMICIRCLE 1 - LIGHT BLUE
                OUTER / LARGEST
            ================================================== */}

            <div
              className="
                absolute
                -right-[32%]
                -top-[30%]
                h-[160%]
                w-[125%]
                rounded-full
                bg-[#91b2ee]
              "
            />

            {/* =================================================
                SEMICIRCLE 2 - BRIGHT BLUE
                MIDDLE
            ================================================== */}

            <div
              className="
                absolute
                -right-[33%]
                -top-[21%]
                h-[142%]
                w-[113%]
                rounded-full
                bg-[#1c5bd5]
              "
            />

            {/* =================================================
                SEMICIRCLE 3 - DARK BLUE
                INNER
            ================================================== */}

            <div
              className="
                absolute
                -right-[34%]
                -top-[12%]
                h-[124%]
                w-[101%]
                rounded-full
                bg-[#063da8]
              "
            />

            {/* =================================================
                DECORATIVE CIRCLES
            ================================================== */}

            <span
              className="
                absolute
                left-[5%]
                top-[12%]
                h-10
                w-10
                rounded-full
                border-4
                border-[#6795dd]
              "
            />

            <span
              className="
                absolute
                left-[20%]
                top-[4%]
                h-5
                w-5
                rounded-full
                bg-[#73a0e5]
              "
            />

            <span
              className="
                absolute
                left-[37%]
                top-[18%]
                h-10
                w-10
                rounded-full
                border-4
                border-white/65
              "
            />

            <span
              className="
                absolute
                right-[8%]
                top-[9%]
                h-6
                w-6
                rounded-full
                bg-[#7099da]
              "
            />

            <span
              className="
                absolute
                left-[8%]
                top-[50%]
                h-7
                w-7
                rounded-full
                bg-[#6794d9]
              "
            />

            <span
              className="
                absolute
                right-[7%]
                top-[60%]
                h-7
                w-7
                rounded-full
                bg-[#5d8bd3]
              "
            />

            <span
              className="
                absolute
                left-[30%]
                bottom-[5%]
                h-12
                w-12
                rounded-full
                border-4
                border-[#6795dd]
              "
            />

            <span
              className="
                absolute
                right-[18%]
                bottom-[12%]
                h-12
                w-12
                rounded-full
                border-4
                border-white/55
              "
            />

            {/* =================================================
                FLOWER
            ================================================== */}

            <div
              className="
                absolute
                inset-0
                z-20
                flex
                items-center
                justify-center
                px-8
                py-8
                xl:px-15
              "
            >
              <img
                src={loginIllustration}
                alt="Leave and employee attendance illustration"
                className="
                  w-[65%]
                  max-w-[600px]
                  object-contain
                  xl:w-[70%]
                  2xl:max-w-[700px]
                "
              />
            </div>

          </section>
        </div>
      </div>
    </main>
  );
}