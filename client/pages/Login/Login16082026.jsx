import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const {
    success,
    error: showError,
  } = useToast();

  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const submit = async (e) => {
  e.preventDefault();

  try {
    await login(form.email, form.password);

    success("Login successfully.");
    navigate("/dashboard");
  } catch (error) {
    showError(
      error.response?.data?.message ||
      "Invalid email or password."
    );
  }
};



  const handleSubmit = (e) => {
    e.preventDefault();

    // console.log("Login data:", formData);

    // Later connect your API here
    // axios.post("http://localhost:5000/api/auth/login", formData)
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="min-h-screen w-full flex">
        {/* ============================================
            LEFT SIDE
        ============================================ */}
        <div
          className="hidden lg:flex lg:w-1/2 min-h-screen relative bg-cover bg-center"
          style={{
            backgroundImage: "url('/login-bg.jpg')",
          }}
        >
          {/* Dark blue overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-blue-700/75" />

          {/* Left content */}
          <div className="relative z-10 flex flex-col  w-full p-12 text-white">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                <LockKeyhole size={24} />
              </div>

              <div className="text-2xl font-bold tracking-tight">
                Admin<span className="text-blue-400">Panel</span>
              </div>
            </div>

            {/* Welcome */}
            <div className="max-w-md">
              {/* 
              <h1 className="text-5xl font-bold leading-tight">
                Welcome Back!
              </h1> */}

              <div className="mt-5 h-1 w-14 bg-blue-500 rounded-full" />

              <p className="mt-6 text-lg text-blue-100 leading-relaxed">
                Sign in to continue to your admin dashboard and manage
                your application with ease.
              </p>

              {/* Features */}
              <div className="mt-10 space-y-7">

                {/* Analytics */}
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <BarChart3 className="text-blue-400" size={24} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">
                      Analytics Overview
                    </h3>

                    <p className="text-sm text-blue-200 mt-1">
                      View real-time performance
                    </p>
                  </div>
                </div>

                {/* Users */}
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <Users className="text-blue-400" size={24} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">
                      User Management
                    </h3>

                    <p className="text-sm text-blue-200 mt-1">
                      Manage users and roles
                    </p>
                  </div>
                </div>

                {/* Security */}
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                    <ShieldCheck className="text-blue-400" size={24} />
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg">
                      Secure & Reliable
                    </h3>

                    <p className="text-sm text-blue-200 mt-1">
                      Enterprise-grade security
                    </p>
                  </div>
                </div>

              </div>
            </div>



          </div>
        </div>

        {/* ============================================
            RIGHT SIDE
        ============================================ */}
        <div
          className="w-full lg:w-1/2 min-h-screen flex items-center justify-center bg-white px-6 py-10"

        >

          <div className="w-full max-w-lg">

            {/* Login Card */}
            <div
            // className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10"
            >

              {/* Lock Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
                  <LockKeyhole
                    size={34}
                    className="text-blue-600"
                  />
                </div>
              </div>

              {/* Heading */}
              {/* <div className="text-center">

                <h2 className="text-3xl font-bold text-slate-900">
                  Admin Login
                </h2>

                <p className="mt-3 text-slate-500 leading-relaxed">
                  Please enter your credentials to access
                  <br className="hidden sm:block" />
                  the admin dashboard
                </p>

              </div> */}

              {/* Form */}
              <form
                onSubmit={submit}
                className="mt-8 space-y-6"
              >

                {/* Email */}
                <div>
                  {/* <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Email Address
                  </label> */}

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
                      onChange={(e) =>
                        setForm({
                          ...form,
                          email: e.target.value,
                        })
                      }
                      placeholder="Enter your email"
                      autoComplete="email"
                      required
                      className="
                        w-full
                        h-14
                        pl-12
                        pr-4
                        rounded-lg
                        border
                        border-slate-300
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-500/10
                      "
                    />

                  </div>
                </div>

                {/* Password */}
                <div>
                  {/* <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-slate-700 mb-2"
                  >
                    Password
                  </label> */}

                  <div className="relative">

                    <LockKeyhole
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                      className="
                        w-full
                        h-14
                        pl-12
                        pr-12
                        rounded-lg
                        border
                        border-slate-300
                        text-slate-800
                        outline-none
                        transition
                        focus:border-blue-500
                        focus:ring-4
                        focus:ring-blue-500/10
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="
                        absolute
                        right-4
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                        hover:text-slate-700
                        transition
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

                {/* Remember / Forgot */}
                <div className="flex items-center justify-between">

                  <label className="flex items-center gap-2 cursor-pointer">

                    <button
                      type="button"
                      onClick={() =>
                        setRememberMe(!rememberMe)
                      }
                      className={`
                        w-5
                        h-5
                        rounded
                        border
                        flex
                        items-center
                        justify-center
                        transition
                        ${rememberMe
                          ? "bg-blue-600 border-blue-600"
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
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>

                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="
                    w-full
                    h-14
                    rounded-lg
                    bg-blue-600
                    hover:bg-blue-700
                    active:bg-blue-800
                    text-white
                    font-semibold
                    text-base
                    shadow-lg
                    shadow-blue-600/20
                    transition
                    duration-200
                  "
                >
                  Login
                </button>

                {/* Divider */}
                {/* <div className="flex items-center gap-4">

                  <div className="flex-1 h-px bg-slate-200" />

                  <span className="text-sm text-slate-400">
                    or continue with
                  </span>

                  <div className="flex-1 h-px bg-slate-200" />

                </div> */}

                {/* Google */}
                {/* <button
                  type="button"
                  className="
                    w-full
                    h-14
                    rounded-lg
                    border
                    border-slate-300
                    hover:bg-slate-50
                    text-slate-700
                    font-medium
                    flex
                    items-center
                    justify-center
                    gap-3
                    transition
                  "
                >
                  <span className="text-lg font-bold">
                    G
                  </span>

                  Login with Google
                </button> */}

              </form>
            </div>

            {/* Copyright */}
            {/* <p className="text-center text-sm text-slate-400 mt-8">
              © 2026 AdminPanel. All rights reserved.
            </p> */}

          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;