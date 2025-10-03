import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
// import Footer from "../components/Footer";

const BrandingPanel = () => (
  <div className="relative w-full hidden lg:flex flex-col justify-center items-center text-center bg-blue-700 p-12 text-white overflow-hidden">
    <div className="z-10 flex flex-col items-center">
      <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
        <img
          src="/assets/images/hfcl.png"
          alt="HFCL Group Logo"
          className="w-auto h-20"
        />
      </div>
      <h1 className="text-5xl font-bold tracking-tight mb-4">HFCL</h1>
      <h2 className="text-5xl font-bold tracking-tight">Fault Booking Tool</h2>
      <p className="mt-4 text-xl text-blue-100 max-w-sm mx-auto">
        Streamlining Network Operations with Precision and Speed.
      </p>
    </div>
  </div>
);

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter both username and password.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const response = await api.post("/api/token/", { username, password });
      const { access, refresh } = response.data;
      const decodedToken = jwtDecode(access);
      const { must_change_password, role } = decodedToken;

      localStorage.setItem(ACCESS_TOKEN, access);
      localStorage.setItem(REFRESH_TOKEN, refresh);
      localStorage.setItem("role", role?.trim().toUpperCase());

      toast.success("Login successful!");

      if (must_change_password) {
        navigate("/change-password");
      } else {
        const destination = {
          ADMIN: "/admin-dashboard",
          OBSERVER: "/admin-dashboard",
          CLIENT: "/client-dashboard",
          TECHNICIAN: "/technician-dashboard",
        }[role?.trim().toUpperCase()];
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
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl flex overflow-hidden">
          <BrandingPanel />
          {/* --- THIS IS THE FIX --- */}
          {/* Restored the correct width class: lg:w-1/2 */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center p-12 sm:p-16">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900">Sign In</h2>
                <p className="mt-3 text-base text-gray-600">
                  Welcome! Please enter your details.
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
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginError) setLoginError("");
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (loginError) setLoginError("");
                      }}
                      className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {loginError && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle size={20} />
                    <span>{loginError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400"
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- THIS IS THE FIX --- */}
      {/* The Footer component is correctly commented out to hide it. */}
      {/* <Footer /> */}
      
    </div>
  );
}

export default Login;