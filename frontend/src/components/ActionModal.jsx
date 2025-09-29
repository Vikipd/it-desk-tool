// COPY AND PASTE THIS ENTIRE BLOCK INTO THE NEW FILE: frontend/src/components/ActionModal.jsx

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import api from '../api';

const ActionModal = ({ ticketId, action, onClose, onUpdate }) => {
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => api.post(`/api/tickets/${ticketId}/update-status-with-comment/`, data),
    onSuccess: (updatedTicket) => {
      toast.success(`Ticket status updated to "${updatedTicket.data.status}"`);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      onUpdate();
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update ticket.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('A comment is required to proceed.');
      return;
    }
    mutation.mutate({
      status: action.value,
      comment: comment,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Confirm Action: {action.label}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment <span className="text-red-500">*</span>
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Please provide a reason or update for this action..."
                className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                required
              />
            </div>
          </div>
          <div className="flex justify-end pt-6">
            <button 
              type="submit" 
              disabled={!comment.trim() || mutation.isPending}
              className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActionModal;