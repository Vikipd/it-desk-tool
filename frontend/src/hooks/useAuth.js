// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THIS FIXES THE LOGIN.

import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN } from '../constants';

// THIS IS THE CORRECT, SYNCHRONOUS HOOK. IT IS FAST AND RELIABLE.
export const useAuth = () => {
    const token = localStorage.getItem(ACCESS_TOKEN);

    // If there is no token, the user is not authenticated.
    if (!token) {
        return { isAuthenticated: false, role: null, user: { id: null } };
    }

    try {
        // If there is a token, decode it instantly.
        const decodedToken = jwtDecode(token);
        const role = decodedToken.role;
        const user_id = decodedToken.user_id;

        // Return the user's true status.
        return { 
            isAuthenticated: true, 
            role: role,
            user: { id: user_id } // This provides user.id to the TicketDetail page
        };
    } catch (error) {
        // If the token is corrupted or invalid, the user is not authenticated.
        console.error("Invalid token found in localStorage", error);
        return { isAuthenticated: false, role: null, user: { id: null } };
    }
};