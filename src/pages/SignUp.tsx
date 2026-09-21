import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  User,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api } from "../services/api";
import loginIllustration from "../assets/login-illustration.png";

export default function SignUp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setSignupError("");

  if (!name.trim()) {
  setNameError("Full name is required.");
  isValid = false;
} else if (!/^[A-Za-z]+(?:\s+[A-Za-z]+)*$/.test(name.trim())) {
  setNameError("Name must contain only letters and spaces.");
  isValid = false;
}

   if (!email.trim()) {
  setEmailError("Email is required.");
  isValid = false;
} else if (email !== email.toLowerCase()) {
  setEmailError("Email must contain only lowercase letters.");
  isValid = false;
} else if (
  !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email.trim())
) {
  setEmailError("Please enter a valid email address.");
  isValid = false;
}

    if (!password) {
      setPasswordError("Password is required.");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (event: {
    preventDefault: () => void;
  }) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setSignupError("");
    setSuccessMessage("");

    try {
      const existingUsersResponse = await api.get<
        {
          id: string;
          email: string;
          employeeId: string;
        }[]
      >("/users");

      const emailExists = existingUsersResponse.data.some(
        (user) =>
          user.email.toLowerCase() === email.trim().toLowerCase(),
      );

      if (emailExists) {
        setEmailError("An account with this email already exists.");
        return;
      }

      const employeeNumber =
        existingUsersResponse.data.length + 1;

      const employeeId = `EMP${String(employeeNumber).padStart(3, "0")}`;

      const newUser = {
        id: `USR${Date.now()}`,
        email: email.trim(),
        password,
        role: "employee",
        employeeId,
        name: name.trim(),
        status: "active",
      };

      await api.post("/users", newUser);

      setSuccessMessage(
        "Account created successfully. You can now sign in.",
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("Sign up failed:", error);

      setSignupError(
        "Unable to create your account. Please make sure JSON Server is running.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="auth-page bg-[#dce9ff] p-3 sm:p-5 lg:p-6">
      <div className="mx-auto h-full w-full max-w-[1700px] overflow-hidden rounded-2xl shadow-lg">
        <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[40%_60%]">

          {/* LEFT SIDE */}

          <section className="relative flex h-full min-h-0 items-center justify-center overflow-hidden bg-[#dce9ff] px-5 py-6 sm:px-8 lg:px-6 xl:px-10">

            {/* Decorative circles */}

            <span className="absolute -left-8 top-[8%] h-16 w-16 rounded-full border-4 border-[#6f99df]" />

            <span className="absolute left-[42%] top-[-8px] h-5 w-5 rounded-full bg-[#82a8e8]" />

            <span className="absolute -left-3 top-[48%] h-7 w-7 rounded-full bg-[#82a8e8]" />

            <span className="absolute bottom-[-20px] left-[8%] h-16 w-16 rounded-full border-4 border-[#6f99df]" />

            <span className="absolute bottom-[8%] right-[-10px] h-20 w-20 rounded-full border-4 border-[#6f99df]" />

            <div className="relative z-20 w-full max-w-[370px]">

              {/* Sign Up Card */}

              <div className="rounded-2xl bg-[#a5c3fa] p-7 shadow-xl shadow-blue-900/15 sm:p-8">

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
                    Create Account
                  </h1>

                  <p className="mt-1 text-xs text-[#315b9f]">
                    Leave & Employee Attendance
                  </p>
                </div>

                {/* Error */}

                {signupError && (
                  <div className="mt-4 rounded-lg border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700">
                    {signupError}
                  </div>
                )}

                {/* Success */}

                {successMessage && (
                  <div className="mt-4 rounded-lg border border-green-300 bg-green-100 px-3 py-2 text-xs text-green-700">
                    {successMessage}
                  </div>
                )}

                {/* Form */}

                <form
                  onSubmit={handleSubmit}
                  noValidate
                  className="mt-5 space-y-3"
                >

                  {/* Name */}

                  <div>
                    <div className="relative">
                      <User
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5793ed]"
                      />

                      <input
  type="text"
  value={name}
  onChange={(event) => {
    const value = event.target.value;

    if (/^[A-Za-z\s]*$/.test(value)) {
      setName(value);
      setNameError("");
    }
  }}
  placeholder="Full Name"
  autoComplete="name"
                        className={`h-11 w-full rounded-md border bg-white pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          nameError
                            ? "border-red-500"
                            : "border-transparent"
                        }`}
                      />
                    </div>

                    {nameError && (
                      <p className="mt-1 text-[10px] text-red-700">
                        {nameError}
                      </p>
                    )}
                  </div>

                  {/* Email */}

                  <div>
                    <div className="relative">
                      <Mail
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5793ed]"
                      />

                      <input
                        type="email"
                        value={email}
                       onChange={(event) => {
  const value = event.target.value.toLowerCase();

  setEmail(value);
  setEmailError("");
}}
                        placeholder="Email Address"
                        autoComplete="email"
                        className={`h-11 w-full rounded-md border bg-white pl-9 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          emailError
                            ? "border-red-500"
                            : "border-transparent"
                        }`}
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
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5793ed]"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setPasswordError("");
                        }}
                        placeholder="Password"
                        autoComplete="new-password"
                        className={`h-11 w-full rounded-md border bg-white pl-9 pr-10 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          passwordError
                            ? "border-red-500"
                            : "border-transparent"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2f82ee]"
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
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

                  {/* Confirm Password */}

                  <div>
                    <div className="relative">
                      <LockKeyhole
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5793ed]"
                      />

                      <input
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setConfirmPasswordError("");
                        }}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        className={`h-11 w-full rounded-md border bg-white pl-9 pr-10 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${
                          confirmPasswordError
                            ? "border-red-500"
                            : "border-transparent"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current,
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2f82ee]"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={15} />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>
                    </div>

                    {confirmPasswordError && (
                      <p className="mt-1 text-[10px] text-red-700">
                        {confirmPasswordError}
                      </p>
                    )}
                  </div>

                  {/* Create Account */}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex h-11 w-full items-center justify-center rounded-md bg-[#1749dc] px-4 text-sm font-bold uppercase tracking-wide text-white shadow-md transition hover:bg-[#0f3bbd] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading
                      ? "Creating..."
                      : "Create Account"}
                  </button>
                </form>

                {/* Login */}

                <div className="mt-5 text-center">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-[11px] font-semibold text-[#17438e] hover:text-blue-700"
                  >
                    Already have an account?{" "}
                    <span className="underline underline-offset-2">
                      Login
                    </span>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-center text-[9px] font-medium text-[#456da7]">
                Secure employee attendance and leave management
              </p>
            </div>
          </section>

          {/* RIGHT SIDE */}

          <section className="relative hidden h-full min-h-0 overflow-hidden bg-[#dce9ff] lg:block">

            {/* 1. LIGHT BLUE */}

            <div className="absolute -right-[32%] -top-[30%] h-[160%] w-[125%] rounded-full bg-[#91b2ee]" />

            {/* 2. BRIGHT BLUE */}

            <div className="absolute -right-[33%] -top-[21%] h-[142%] w-[113%] rounded-full bg-[#1c5bd5]" />

            {/* 3. DARK BLUE */}

            <div className="absolute -right-[34%] -top-[12%] h-[124%] w-[101%] rounded-full bg-[#063da8]" />

            {/* Decorative circles */}

            <span className="absolute left-[5%] top-[12%] h-10 w-10 rounded-full border-4 border-[#6795dd]" />

            <span className="absolute left-[20%] top-[4%] h-5 w-5 rounded-full bg-[#73a0e5]" />

            <span className="absolute left-[37%] top-[18%] h-10 w-10 rounded-full border-4 border-white/65" />

            <span className="absolute right-[8%] top-[9%] h-6 w-6 rounded-full bg-[#7099da]" />

            <span className="absolute left-[8%] top-[50%] h-7 w-7 rounded-full bg-[#6794d9]" />

            <span className="absolute right-[7%] top-[60%] h-7 w-7 rounded-full bg-[#5d8bd3]" />

            <span className="absolute left-[30%] bottom-[5%] h-12 w-12 rounded-full border-4 border-[#6795dd]" />

            <span className="absolute right-[18%] bottom-[12%] h-12 w-12 rounded-full border-4 border-white/55" />

            {/* Flower */}

            <div className="absolute inset-0 z-20 flex items-center justify-center px-8 py-8 xl:px-12">
              <img
                src={loginIllustration}
                alt="Leave and employee attendance illustration"
                className="w-[65%] max-w-[600px] object-contain xl:w-[70%] 2xl:max-w-[700px]"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}