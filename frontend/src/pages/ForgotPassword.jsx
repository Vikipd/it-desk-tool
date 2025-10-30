// Path: E:\it-admin-tool\frontend\src\pages\ForgotPassword.jsx
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Mail, User, Phone, CheckCircle, Info, AlertTriangle } from "lucide-react";
import api from "../api";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [genericError, setGenericError] = useState(""); // State for the generic error message

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear errors when the user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (genericError) setGenericError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, phone_number } = formData;

    if (!username || !email || !phone_number) {
      toast.error("All fields are required.");
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccess("");
    setGenericError(""); // Reset generic error on new submission

    try {
      await api.post("/api/auth/validate-user-details/", formData);

      setSuccess("Validation successful. Please see below for the next step.");
      toast.success("Details validated successfully!");
    } catch (err) {
      // --- THIS IS THE FIX ---
      // This logic correctly separates specific validation errors from other unexpected errors.
      const serverErrors = err.response?.data;
      
      // Check if the server sent back specific validation errors (like wrong email, etc.)
      if (err.response?.status === 400 && serverErrors && typeof serverErrors === "object") {
        setErrors(serverErrors);
        toast.error("Please correct the errors shown below.");
      } else {
        // If it's any other type of error (like 500 server error), show a generic message.
        const errorMsg = "An unexpected error occurred. Please try again later.";
        setGenericError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-12">
            <div className="text-center mb-8">
              <img
                src="/assets/images/favicon.png"
                alt="Logo"
                className="w-auto h-12 mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-slate-800">
                Forgot Password
              </h1>
              <p className="mt-2 text-slate-500">
                Enter your details to validate your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* --- FIX: Display the generic error message at the top of the form --- */}
              {genericError && (
                <div className="flex items-center space-x-2 text-red-700 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle size={20} className="flex-shrink-0" />
                  <span>{genericError}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.username
                        ? "border-red-500 ring-red-500"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.email
                        ? "border-red-500 ring-red-500"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </span>
                  <input
                    type="tel"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.phone_number
                        ? "border-red-500 ring-red-500"
                        : "border-slate-300 focus:ring-blue-500"
                    }`}
                    required
                  />
                </div>
                {errors.phone_number && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.phone_number}
                  </p>
                )}
              </div>

              {success && (
                <div className="flex items-start space-x-2 text-green-700 text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}
              
              <div className="flex items-start space-x-2 text-slate-600 text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                <Info size={20} className="flex-shrink-0 mt-0.5" />
                <span>
                  For assistance, please contact the administrator at{" "}
                  <strong>admin@example.com</strong>.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || success}
                  className="w-full flex justify-center py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Validating..." : "Validate My Details"}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;