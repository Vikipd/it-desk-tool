// Path: E:\it-admin-tool\frontend\src\AuthContext.js
// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { createContext, useState, useEffect, useContext } from 'react';
import { ACCESS_TOKEN, REFRESH_TOKEN } from './constants';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    useEffect(() => {
        // This effect runs once when the app loads
        const token = localStorage.getItem(ACCESS_TOKEN);
        const role = localStorage.getItem("role");
        if (token && role) {
            setIsAuthenticated(true);
            setUserRole(role);
        }
        setIsLoading(false); // Finished checking initial auth state
    }, []);

    const login = (role) => {
        setIsAuthenticated(true);
        setUserRole(role);
    };

    const logout = () => {
        // Clear state and local storage
        setIsAuthenticated(false);
        setUserRole(null);
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        localStorage.removeItem("role");
    };

    const contextValue = {
        isAuthenticated,
        userRole,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// This is our new, centralized hook.
// Any component can call useAuth() to get the auth state and functions.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};