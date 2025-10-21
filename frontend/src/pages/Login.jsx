// Path: E:\it-admin-tool\frontend\src\pages\Login.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../AuthContext";

// --- THIS IS YOUR EXACT PROVIDED DESIGN, INTEGRATED ---
const BrandingPanel = () => (
  <div className="hidden lg:flex w-7/12 bg-blue-700 p-12 flex-col justify-center items-center text-center text-white">
    <div className="bg-white p-5 rounded-2xl shadow-lg mb-8">
      <img src="/assets/images/hfcl.png" alt="HFCL Logo" className="w-24 h-24" />
    </div>
    <h1 className="text-5xl font-bold">HFCL</h1>
    <h2 className="text-4xl font-semibold mt-2">
      Fault Booking Tool
    </h2>
    <p className="mt-6 text-base text-blue-100 opacity-90 max-w-sm mx-auto">
      Streamlining Network Operations with Precision and Speed.
    </p>
  </div>
);


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const response = await api.post("/api/auth/token/", {
        username,
        password,
      });

      const { access, refresh } = response.data;
      const decodedToken = jwtDecode(access);
      const { must_change_password, role } = decodedToken;

      const userRole = role?.trim().toUpperCase();

      localStorage.setItem(ACCESS_TOKEN, access);
      localStorage.setItem(REFRESH_TOKEN, refresh);
      localStorage.setItem("role", userRole);
      
      login(userRole);

      toast.success("Login successful!");

      if (must_change_password) {
        navigate("/change-password");
      } else {
        const destination = {
          ADMIN: "/admin-dashboard",
          OBSERVER: "/admin-dashboard",
          CLIENT: "/client-dashboard",
          TECHNICIAN: "/technician-dashboard",
        }[userRole];

        if (destination) {
          navigate(destination);
        } else {
          toast.error("Unsupported user role.");
          localStorage.clear();
        }
      }
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorMessage =
        detail || "Invalid username or password. Please try again.";
      setLoginError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <main className="w-full max-w-6xl flex-grow flex items-center justify-center">
        <div className="w-full flex bg-white shadow-2xl rounded-2xl overflow-hidden">
          <BrandingPanel />
          <div className="w-full lg:w-5/12 flex items-center justify-center p-8 md:p-12">
            <div className="w-full max-w-sm">
              <h2 className="text-3xl font-bold mb-2 text-slate-800">
                Sign In
              </h2>
              <p className="text-slate-500 mb-8">
                Welcome! Please enter your details.
              </p>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    className={`w-full px-4 py-3 bg-slate-100 border rounded-lg focus:outline-none focus:ring-2 ${loginError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'}`}
                    required
                  />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-700" htmlFor="password">
                            Password
                        </label>
                        <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      className={`w-full px-4 py-3 pr-12 bg-slate-100 border rounded-lg focus:outline-none focus:ring-2 ${loginError ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500 focus:border-blue-500'}`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 px-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div id="form-error" role="alert" aria-live="polite" className="flex items-center mt-2 text-sm text-red-600">
                    <AlertCircle className="h-5 w-5 mr-1.5"/>
                    <span>{loginError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold text-base shadow-lg hover:shadow-xl disabled:bg-slate-400"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Login;