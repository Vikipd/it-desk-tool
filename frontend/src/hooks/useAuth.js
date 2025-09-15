import { ACCESS_TOKEN } from '../constants';

// This is our single source of truth for authentication.
// It performs a direct, synchronous check of localStorage.
export const useAuth = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);
    const role = localStorage.getItem('role');

    // Return the user's status in a clear object.
    return { 
        isAuthenticated: !!token, // true if a token exists, false otherwise
        role: role,
        // Add other details here if needed in the future
    };
};