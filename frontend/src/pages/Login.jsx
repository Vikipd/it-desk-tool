// COPY AND PASTE THIS ENTIRE BLOCK INTO: frontend/src/pages/Login.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    if (loginError) { setLoginError(""); }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (loginError) { setLoginError(""); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    setLoginError(""); // Clear previous errors

    try {
      // --- FIX: The URL now correctly includes the '/api/' prefix. ---
      const response = await api.post("/api/token/", { username, password });
      // --- END OF FIX ---

      const { access, refresh } = response.data;
      const decodedToken = jwtDecode(access);

      const mustChangePassword = decodedToken.must_change_password;
      const role = decodedToken.role?.trim().toUpperCase();

      localStorage.setItem(ACCESS_TOKEN, access);
      localStorage.setItem(REFRESH_TOKEN, refresh);
      localStorage.setItem("role", role);
      
      toast.success("Login successful!");

      if (mustChangePassword) {
        navigate("/change-password");
      } else {
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
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage = detail || "Invalid username or password. Please try again.";
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // The rest of your JSX remains the same, so I'm omitting it for brevity.
  // Just copy the whole block above and paste it.
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2 flex flex-col justify-center items-center text-center bg-blue-600 p-12 text-white">
          <h1 className="text-4xl font-bold tracking-tight">
            Fault Booking Tool
          </h1>
          <p className="mt-4 text-lg text-blue-100">Operations, simplified.</p>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col justify-center p-12">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Login to your account
              </h2>
              <p className="mt-2 text-base text-gray-600">
                Enter your credentials to access your dashboard.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 rounded-r-lg text-gray-400 hover:text-gray-600 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center space-x-2 text-red-600 text-sm font-semibold p-3 bg-red-50 rounded-lg">
                  <AlertCircle size={20} />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3 text-base font-semibold text-white bg-teal-600 rounded-lg shadow-md hover:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-teal-400"
              >
                {isLoading ? "Logging In..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;