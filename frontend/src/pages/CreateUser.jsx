import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Select from 'react-select';
import { ArrowLeft, UserPlus } from 'lucide-react';
import api from '../api';

const CreateUser = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(null);
    const [passwordError, setPasswordError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Added for better user experience

    const roleOptions = [
        { value: 'CLIENT', label: 'Client' },
        { value: 'TECHNICIAN', label: 'Technician' },
        { value: 'OBSERVER', label: 'Observer' },
    ];

    const validatePassword = (password) => {
        if (password.length < 8) return 'Password must be at least 8 characters long.';
        if (!/\d/.test(password)) return 'Password must contain at least one number.';
        if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
        return '';
    };

    const handlePasswordChange = (e) => {
        const newPasswordValue = e.target.value;
        setPassword(newPasswordValue);
        setPasswordError(validatePassword(newPasswordValue));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Start loading

        const finalPasswordError = validatePassword(password);
        if (finalPasswordError) {
            setPasswordError(finalPasswordError);
            toast.error('Please fix the password errors before submitting.');
            setIsLoading(false); // Stop loading
            return;
        }
        if (!username || !password || !role) {
            toast.error('Please fill out all fields.');
            setIsLoading(false); // Stop loading
            return;
        }

        const toastId = toast.loading('Creating user...');

        try {
            // --- THIS IS THE DEFINITIVE FIX ---
            // The URL was missing the required "/api/" prefix.
            await api.post('/api/users/', {
                username: username,
                password: password,
                role: role.value
            });
            // --- END OF FIX ---

            toast.success(`User "${username}" created successfully!`, { id: toastId });
            navigate('/admin-dashboard');
        } catch (err) {
            // Improved error handling to catch various backend responses
            const errorData = err.response?.data;
            let errorMsg = 'Failed to create user. Please try again.';
            if (typeof errorData === 'object' && errorData !== null) {
                // Check for common error structures from Django REST Framework
                if (errorData.username) errorMsg = `Username: ${errorData.username[0]}`;
                else if (errorData.password) errorMsg = `Password: ${errorData.password[0]}`;
                else if (errorData.detail) errorMsg = errorData.detail;
            }
            toast.error(errorMsg, { id: toastId });
        } finally {
            setIsLoading(false); // Stop loading in all cases
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <button 
                    onClick={() => navigate('/admin-dashboard')} 
                    className="flex items-center text-gray-600 hover:text-gray-900 mb-6 font-semibold group"
                >
                    <ArrowLeft className="mr-2 h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    Back to Dashboard
                </button>

                <div className="bg-white p-8 rounded-xl shadow-lg">
                    <div className="flex flex-col items-center mb-6">
                        <div className="bg-green-100 p-3 rounded-full mb-3">
                            <UserPlus className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Create New User</h1>
                        <p className="text-gray-500 text-sm mt-1">Add a new client or technician to the system.</p>
                    </div>

                    <form onSubmit={handleCreateUser} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)} 
                                className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition" 
                                required 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={handlePasswordChange} 
                                className={`mt-1 w-full px-4 py-2 border rounded-md shadow-sm focus:ring-2 transition ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'}`} 
                                required 
                            />
                            {passwordError && (<p className="mt-2 text-xs text-red-600">{passwordError}</p>)}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <Select 
                                options={roleOptions} 
                                value={role} 
                                onChange={setRole} 
                                className="mt-1" 
                                placeholder="Select a role..."
                                styles={{
                                    control: (base) => ({
                                      ...base,
                                      borderColor: '#D1D5DB',
                                      boxShadow: 'none',
                                      '&:hover': {
                                        borderColor: '#10B981',
                                      },
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isSelected ? '#10B981' : (state.isFocused ? '#D1FAE5' : 'white'),
                                        color: state.isSelected ? 'white' : 'black',
                                        '&:active': {
                                            backgroundColor: '#059669',
                                        }
                                    }),
                                }}
                            />
                        </div>

                        <div className="pt-4">
                            <button 
                                type="submit" 
                                disabled={!!passwordError || isLoading} 
                                className="w-full flex justify-center items-center bg-green-600 text-white px-4 py-3 rounded-lg shadow-md font-semibold hover:bg-green-700 transition-transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                            >
                                {isLoading ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateUser;