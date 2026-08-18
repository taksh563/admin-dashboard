import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import SimpleReactValidator from "simple-react-validator";
import PageTitle from "../../components/common/PageTitle";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  BarChart3,
  Users,
  ShieldCheck,
  Check,
} from "lucide-react";

const Login = () => {

  
  const navigate = useNavigate();
  const [, forceUpdate] = useState();
 const SimpleValidator = useRef(new SimpleReactValidator({ autoForceUpdate: { forceUpdate: forceUpdate } }));

  const [showPassword, setShowPassword] =
    useState(false);

  const [rememberMe, setRememberMe] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const {
    success,
    error: showError,
  } = useToast();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  // =====================================================
  // SHOW SESSION EXPIRED MESSAGE
  // =====================================================

  useEffect(() => {
    const sessionMessage =
      sessionStorage.getItem(
        "sessionMessage"
      );

    if (sessionMessage) {
      showError(sessionMessage);

      sessionStorage.removeItem(
        "sessionMessage"
      );
    }
  }, [showError]);

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const submit = async (e) => {
    e.preventDefault();
   if (SimpleValidator.current.allValid()) {
      if (loading) {
        return;
      }

      setLoading(true);

      try {
        await login(
          form.email.trim(),
          form.password
        );

        success("Login successful.");

        navigate("/dashboard");
      } catch (error) {
        console.error(
          "Login error:",
          error
        );

        // -----------------------------------------------
        // Get backend error information
        // -----------------------------------------------

        const code =
          error.response?.data?.code;

        const message =
          error.response?.data?.message;

        // -----------------------------------------------
        // EMAIL NOT FOUND
        // -----------------------------------------------

        if (code === "EMAIL_NOT_FOUND") {
          showError(
            "Email address does not exist."
          );

          setLoading(false);
          return;
        }

        // -----------------------------------------------
        // WRONG PASSWORD
        // -----------------------------------------------

        if (code === "INVALID_PASSWORD") {
          showError(
            "Incorrect password."
          );

          setLoading(false);
          return;
        }

        // -----------------------------------------------
        // ACCOUNT INACTIVE
        // -----------------------------------------------

        if (
          code === "ACCOUNT_INACTIVE"
        ) {
          showError(
            message ||
            "Your account is inactive. Please contact the administrator."
          );

          setLoading(false);
          return;
        }

        // -----------------------------------------------
        // INVALID TOKEN
        // -----------------------------------------------

        if (code === "INVALID_TOKEN") {
          showError(
            "Your session is invalid. Please login again."
          );

          setLoading(false);
          return;
        }

        // -----------------------------------------------
        // TOKEN EXPIRED
        // -----------------------------------------------

        if (code === "TOKEN_EXPIRED") {
          showError(
            "Your session has expired. Please login again."
          );

          setLoading(false);
          return;
        }

        // -----------------------------------------------
        // GENERIC ERROR
        // -----------------------------------------------

        showError(
          message ||
          "Unable to login. Please try again."
        );

        setLoading(false);
      }
    } else {
     SimpleValidator.current.showMessages();
      forceUpdate(1);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
       <PageTitle />
      <div className="flex min-h-screen w-full">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div
          className="relative hidden min-h-screen bg-cover bg-center lg:flex lg:w-1/2"
          style={{
            backgroundImage:
              "url('/login-bg.jpg')",
          }}
        >
          {/* Overlay */}

          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-blue-700/75" />

          {/* Content */}

          <div className="relative z-10 flex w-full flex-col p-12 text-white">

            {/* Logo */}

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg">
                <LockKeyhole size={24} />
              </div>

              <div className="text-2xl font-bold tracking-tight">
                Admin
                <span className="text-blue-400">
                  Panel
                </span>
              </div>

            </div>

            {/* Welcome */}

            <div className="mt-5 max-w-md">

              <div className="h-1 w-14 rounded-full bg-blue-500" />

              <p className="mt-6 text-lg leading-relaxed text-blue-100">
                Sign in to continue to your
                admin dashboard and manage
                your application with ease.
              </p>

              {/* Features */}

              <div className="mt-10 space-y-7">

                {/* Analytics */}

                <div className="flex items-center gap-5">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <BarChart3
                      className="text-blue-400"
                      size={24}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      Analytics Overview
                    </h3>

                    <p className="mt-1 text-sm text-blue-200">
                      View real-time performance
                    </p>
                  </div>

                </div>

                {/* Users */}

                <div className="flex items-center gap-5">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <Users
                      className="text-blue-400"
                      size={24}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      User Management
                    </h3>

                    <p className="mt-1 text-sm text-blue-200">
                      Manage users and roles
                    </p>
                  </div>

                </div>

                {/* Security */}

                <div className="flex items-center gap-5">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
                    <ShieldCheck
                      className="text-blue-400"
                      size={24}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">
                      Secure & Reliable
                    </h3>

                    <p className="mt-1 text-sm text-blue-200">
                      Enterprise-grade security
                    </p>
                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:w-1/2">

          <div className="w-full max-w-lg">

            {/* Login Card */}

            <div>

              {/* Lock Icon */}

              <div className="mb-6 flex justify-center">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">

                  <LockKeyhole
                    size={34}
                    className="text-blue-600"
                  />

                </div>

              </div>

              {/* Form */}

              <form
                onSubmit={submit}
                className="mt-8 space-y-6"
              >

                {/* =================================================
                    EMAIL
                ================================================= */}

                <div>

                  <div className="relative">

                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      disabled={loading}
                      className="
                        h-14
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        pl-12
                        pr-4
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-slate-100
                      "
                    />
                    {SimpleValidator.current.message(
                      "email",
                      form.email,
                      "required|email"
                    )}
                  </div>

                </div>

                {/* =================================================
                    PASSWORD
                ================================================= */}

                <div>

                  <div className="relative">

                    <LockKeyhole
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      disabled={loading}
                      className="
                        h-14
                        w-full
                        rounded-lg
                        border
                        border-slate-300
                        pl-12
                        pr-12
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-500/10
                        disabled:cursor-not-allowed
                        disabled:bg-slate-100
                      "
                    />
                    {SimpleValidator.current.message(
                      "password",
                      form.password,
                      "required|min:3"
                    )}

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        transition
                        hover:text-slate-700
                        disabled:cursor-not-allowed
                      "
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>

                  </div>

                </div>

                {/* =================================================
                    REMEMBER / FORGOT
                ================================================= */}

                <div className="flex items-center justify-between">

                  <label className="flex cursor-pointer items-center gap-2">

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() =>
                        setRememberMe(
                          (prev) => !prev
                        )
                      }
                      className={`
                        flex
                        h-5
                        w-5
                        items-center
                        justify-center
                        rounded
                        border
                        transition
                        ${rememberMe
                          ? "border-blue-600 bg-blue-600"
                          : "border-slate-300"
                        }
                      `}
                    >
                      {rememberMe && (
                        <Check
                          size={14}
                          className="text-white"
                        />
                      )}
                    </button>

                    <span className="text-sm text-slate-600">
                      Remember me
                    </span>

                  </label>

                  <button
                    type="button"
                    disabled={loading}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>

                </div>

                {/* =================================================
                    LOGIN BUTTON
                ================================================= */}

                <button
                  type="submit"
                  disabled={loading}
                  className="
                    flex
                    h-14
                    w-full
                    items-center
                    justify-center
                    rounded-lg
                    bg-blue-600
                    text-base
                    font-semibold
                    text-white
                    shadow-lg
                    shadow-blue-600/20
                    transition
                    duration-200
                    hover:bg-blue-700
                    active:bg-blue-800
                    disabled:cursor-not-allowed
                    disabled:opacity-70
                  "
                >
                  {loading ? (
                    <>
                      <svg
                        className="mr-3 h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          className="opacity-25"
                        />

                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          className="opacity-75"
                        />
                      </svg>

                      Signing in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>

              </form>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;