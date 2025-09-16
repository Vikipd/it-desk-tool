// COPY AND PASTE THIS ENTIRE BLOCK INTO: frontend/src/components/UserModal.jsx

import React, { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../api";

const UserModal = ({ user, onClose, onSave }) => {
  const isEditMode = Boolean(user);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    phone_number: "",
    role: "CLIENT",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        username: user.username || "",
        phone_number: user.phone_number || "",
        role: user.role || "CLIENT",
        password: "",
        confirmPassword: "",
      });
    }
  }, [user, isEditMode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- FIX: All API endpoints now correctly start with '/api/'. ---
  const { mutate, isPending: isLoading } = useMutation({
    mutationFn: async (userData) => {
      if (isEditMode) {
        const payload = {
          username: userData.username,
          first_name: userData.first_name,
          last_name: userData.last_name,
          phone_number: userData.phone_number,
          role: userData.role,
        };
        return api.put(`/api/users/${user.id}/`, payload);
      } else {
        return api.post("/api/users/", userData);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "User updated successfully!" : "User created successfully!"
      );
      onSave();
      onClose();
    },
    onError: (error) => {
      const errorData = error.response?.data;
      if (errorData) {
        Object.keys(errorData).forEach((key) => {
          const message = Array.isArray(errorData[key])
            ? errorData[key].join(" ")
            : errorData[key];
          toast.error(`${key.replace("_", " ")}: ${message}`);
        });
      } else {
        toast.error("An unexpected error occurred.");
      }
    },
  });

  const { mutate: resetPassword, isPending: isResetting } = useMutation({
    mutationFn: (passwordData) =>
      api.put(`/api/users/${user.id}/reset-password/`, passwordData),
    onSuccess: () => {
      toast.success("Password reset successfully!");
      setShowPasswordReset(false);
      setNewPassword("");
      setConfirmNewPassword("");
    },
    onError: (error) => {
      const errorDetail =
        error.response?.data?.password?.join(" ") ||
        "Failed to reset password.";
      toast.error(errorDetail);
    },
  });
  // --- END OF FIX ---


  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!isEditMode && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    mutate(formData);
  };
  const handlePasswordReset = () => {
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    resetPassword({ password: newPassword });
  };
  
  // The rest of your component remains the same.
  // Just copy the whole block above and paste it.

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEditMode ? "Edit User Details" : "Add New Member"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
              placeholder="e.g., John"
            />
            <InputField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="e.g., Doe"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="e.g., johndoe"
            />
            <InputField
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g., 9876543210"
              maxLength={10}
              pattern="[0-9]*"
              title="Please enter a 10-digit phone number."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Select role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
            >
              <option value="CLIENT">Client</option>
              <option value="TECHNICIAN">Engineer</option>
              <option value="ADMIN">Admin</option>
              <option value="OBSERVER">Project Manager</option>
            </select>
          </div>
          {isEditMode && !showPasswordReset && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                <KeyRound size={16} className="mr-2" /> Reset Password for this
                User
              </button>
            </div>
          )}
          {isEditMode && showPasswordReset && (
            <div className="p-4 border-t mt-4 space-y-4">
              <p className="text-sm font-semibold text-gray-700">
                Set New Password
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Enter new password"
                      className="block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      placeholder="Confirm new password"
                      className="block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmNewPassword(!showConfirmNewPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="text-sm font-semibold text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={isResetting}
                  className="bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-orange-600 disabled:bg-gray-400"
                >
                  {isResetting ? "Resetting..." : "Save New Password"}
                </button>
              </div>
            </div>
          )}
          {!isEditMode && (
            <>
              <p className="text-sm font-semibold text-gray-600 pt-2">
                Set Initial Password
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter a secure password"
                      className="block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      placeholder="Confirm your password"
                      className="block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading
                ? "Saving..."
                : isEditMode
                ? "Update Details"
                : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InputField = ({
  label, name, value, onChange, type = "text", required = false, disabled = false, placeholder = "", maxLength, pattern, title,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
      {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      maxLength={maxLength}
      pattern={pattern}
      title={title}
      className="mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
    />
  </div>
);

export default UserModal;