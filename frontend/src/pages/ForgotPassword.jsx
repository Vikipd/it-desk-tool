// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE WARNING IS GONE.

import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // <-- CORRECTED: useNavigate is removed
import { toast } from 'react-hot-toast';
import { ArrowLeft, Mail, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../api';
import Footer from '../components/Footer';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_number: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // const navigate = useNavigate(); // <-- THIS UNUSED LINE IS DELETED

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, phone_number } = formData;

    if (!username || !email || !phone_number) {
      toast.error('All fields are required.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/api/auth/validate-user-details/', formData);
      
      setSuccess('Validation successful. Please contact your administrator at admin@example.com to reset your password.');
      toast.success('Details validated successfully!');

    } catch (err) {
      const serverError = err.response?.data?.error || 'Invalid details provided. Please check your information and try again.';
      setError(serverError);
      toast.error(serverError);
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
              <img src="/assets/images/favicon.png" alt="HFCL Logo" className="w-auto h-12 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-slate-800">Forgot Password</h1>
              <p className="mt-2 text-slate-500">Enter your details to validate your account.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3"><User className="h-5 w-5 text-slate-400" /></span>
                  <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Mail className="h-5 w-5 text-slate-400" /></span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3"><Phone className="h-5 w-5 text-slate-400" /></span>
                  <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle size={20} /><span>{error} For assistance, please contact <strong>admin@example.com</strong>.</span>
                </div>
              )}

              {success && (
                <div className="flex items-center space-x-2 text-green-700 text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle size={20} /><span>{success}</span>
                </div>
              )}

              <button type="submit" disabled={isLoading || success} className="w-full flex justify-center py-3 text-base font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed">
                {isLoading ? 'Validating...' : 'Validate My Details'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-800">
                <ArrowLeft size={16} className="mr-1" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ForgotPassword;