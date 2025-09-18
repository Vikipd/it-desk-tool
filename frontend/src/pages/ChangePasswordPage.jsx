// COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FINAL, CORRECTED CHANGE PASSWORD PAGE.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const ChangePasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();
    const { role } = useAuth();

    const mutation = useMutation({
        mutationFn: (newPasswordData) => api.put('/api/auth/change-password/', newPasswordData),
        onSuccess: () => {
            toast.success('Password changed successfully! Redirecting to your dashboard...');
            const destination = {
                ADMIN: "/admin-dashboard",
                OBSERVER: "/admin-dashboard",
                CLIENT: "/client-dashboard",
                TECHNICIAN: "/technician-dashboard",
            }[role];
            navigate(destination || "/login");
        },
        // --- THIS IS THE FIX: Professional, detailed error handling ---
        onError: (error) => {
            const errorData = error.response?.data;
            if (errorData) {
                // We loop through all the error messages from the backend
                Object.keys(errorData).forEach((key) => {
                    const message = Array.isArray(errorData[key]) ? errorData[key].join(" ") : errorData[key];
                    // Example: "new_password: This password is too common."
                    toast.error(`${key.replace("_", " ")}: ${message}`);
                });
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
            return;
        }
        // --- THIS IS THE FIX: We now send the data with the correct field name ---
        mutation.mutate({ new_password: password });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 space-y-6">
                <div className="text-center">
                    <KeyRound className="mx-auto h-12 w-12 text-blue-600" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-900">
                        Create a New Password
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        For security, you must create a new password before you can continue.
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                             <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full flex items-center justify-center py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-colors focus:outline-none disabled:bg-blue-400"
                    >
                        {mutation.isPending ? "Saving..." : "Set New Password and Login"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordPage;