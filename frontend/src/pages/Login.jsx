import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/api/token/", { username, password });
      const { access, refresh } = response.data;
      const decodedToken = jwtDecode(access);
      const role = decodedToken.role?.trim().toUpperCase();
      localStorage.setItem(ACCESS_TOKEN, access);
      localStorage.setItem(REFRESH_TOKEN, refresh);
      localStorage.setItem("role", role);
      toast.success("Login successful!");
      const destination = {
        ADMIN: "/admin-dashboard",
        OBSERVER: "/admin-dashboard",
        CLIENT: "/client-dashboard",
        TECHNICIAN: "/technician-dashboard",
      }[role];
      if (destination) {
        navigate(destination);
      } else {
        toast.error("Unsupported user role.");
        localStorage.clear();
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(detail || "Invalid credentials or server error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Left Panel - CORRECTED Blue/Teal Gradient */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-gradient-to-br from-blue-500 to-teal-400 p-12 text-center text-white">
          <ShieldCheck className="mx-auto h-24 w-24 text-white mb-6 opacity-90" />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Fault Booking Tool
          </h1>
          <p className="mt-4 text-lg text-blue-100">
            From issue to resolution, effortlessly.
          </p>
        </div>

        {/* Right Panel - Clean White Form */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 sm:p-16">
          <div className="w-full max-w-sm">
            <div className="mb-8 text-left">
              <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
              <p className="mt-2 text-base text-gray-600">
                Sign in to continue to your account
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600 focus:outline-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* CORRECTED Indigo/Purple Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              >
                {isLoading ? "Signing In..." : "Sign In"}
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
