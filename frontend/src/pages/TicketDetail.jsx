import { useAuth } from '../hooks/useAuth.js';
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api.js';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Send, Loader2, AlertTriangle, Lock } from 'lucide-react';
import Select from 'react-select';


// No changes needed in these child components
const TicketActions = ({ ticket, role, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const handleStatusUpdate = async (newStatus) => {
        setIsUpdating(true);
        try {
            const response = await api.patch(`/api/tickets/${ticket.id}/`, { status: newStatus });
            toast.success(`Ticket status updated to "${response.data.status}"`);
            onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update status.");
        } finally {
            setIsUpdating(false);
        }
    };
    const technicianActions = { 'OPEN': { label: 'Start Progress', nextStatus: 'IN_PROGRESS' }, 'IN_PROGRESS': { label: 'Mark as In Transit', nextStatus: 'IN_TRANSIT' }, 'IN_TRANSIT': { label: 'Mark as Under Repair', nextStatus: 'UNDER_REPAIR' }, 'UNDER_REPAIR': { label: 'Mark as Resolved', nextStatus: 'RESOLVED' } };
    const adminActions = { 'RESOLVED': { label: 'Close Ticket', nextStatus: 'CLOSED' } };
    const renderAction = (action) => (<button onClick={() => handleStatusUpdate(action.nextStatus)} disabled={isUpdating} className={`w-full text-white px-4 py-2 rounded-lg shadow transition disabled:bg-gray-400 ${action.nextStatus === 'CLOSED' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{isUpdating ? 'Updating...' : action.label}</button>);
    if (role === 'TECHNICIAN' && technicianActions[ticket.status]) { return <div className="bg-gray-50 p-6 rounded-lg shadow-sm"><h2 className="text-xl font-semibold mb-4">Actions</h2>{renderAction(technicianActions[ticket.status])}</div>; }
    if (role === 'ADMIN' && adminActions[ticket.status]) { return <div className="bg-gray-50 p-6 rounded-lg shadow-sm"><h2 className="text-xl font-semibold mb-4">Actions</h2>{renderAction(adminActions[ticket.status])}</div>; }
    return null;
};

const AdminControls = ({ ticket, onUpdate }) => {
    const [technicians, setTechnicians] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    useEffect(() => {
        const fetchTechnicians = async () => {
            try {
                const response = await api.get('/api/technicians/');
                setTechnicians(response.data);
            } catch (error) {
                toast.error("Could not load technician list.");
            }
        };
        fetchTechnicians();
    }, []);
    const handleAssign = async (selectedOption) => {
        setIsAssigning(true);
        try {
            const response = await api.patch(`/api/tickets/${ticket.id}/`, { assigned_to: selectedOption ? selectedOption.value : null });
            toast.success(`Ticket assigned to ${response.data.assigned_to_username || 'Unassigned'}`);
            onUpdate();
        } catch (error) {
            toast.error("Failed to assign ticket.");
        } finally {
            setIsAssigning(false);
        }
    };
    const technicianOptions = technicians.map(tech => ({ value: tech.id, label: tech.username }));
    const currentAssignee = technicianOptions.find(opt => opt.value === ticket.assigned_to);
    const isClosed = ticket.status === 'CLOSED';
    return (<div className="bg-gray-50 p-6 rounded-lg shadow-sm"><h2 className="text-xl font-semibold mb-4">Assign Ticket</h2><Select options={technicianOptions} value={currentAssignee} onChange={handleAssign} isClearable={true} isLoading={isAssigning} placeholder={isClosed ? "Ticket is closed" : "Unassigned"} isDisabled={isClosed}/></div>);
};

const AdminPriorityControl = ({ ticket, onUpdate }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const priorityOptions = [{ value: "CRITICAL", label: "Critical" }, { value: "HIGH", label: "High" }, { value: "MEDIUM", label: "Medium" }, { value: "LOW", label: "Low" }];
    const currentPriority = priorityOptions.find(opt => opt.value === ticket.priority);
    const handlePriorityChange = async (selectedOption) => {
        setIsUpdating(true);
        try {
            await api.patch(`/api/tickets/${ticket.id}/`, { priority: selectedOption.value });
            toast.success("Priority updated!");
            onUpdate();
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to update priority.");
        } finally {
            setIsUpdating(false);
        }
    };
    const isClosed = ticket.status === 'CLOSED';
    return (<div className="bg-gray-50 p-6 rounded-lg shadow-sm"><h2 className="text-xl font-semibold mb-4">Change Priority</h2><Select options={priorityOptions} value={currentPriority} onChange={handlePriorityChange} isLoading={isUpdating} isDisabled={isClosed} placeholder={isClosed ? "Ticket is closed" : "Select priority"}/></div>);
};


// --- TICKET DETAIL COMPONENT (WITH THE DEFINITIVE FIX) ---
const TicketDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { role } = useAuth();
    // const role = localStorage.getItem('role');

    const [ticket, setTicket] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [ticketRes, commentsRes] = await Promise.all([
                api.get(`/api/tickets/${id}/`),
                api.get(`/api/tickets/${id}/comments/`)
            ]);
            setTicket(ticketRes.data);
            setComments(commentsRes.data);
        } catch (err) {
            setError("Failed to load ticket details. You may not have permission to view this.");
            if (err.response?.status === 401) {
                toast.error("Your session has expired. Please log in again.");
                navigate('/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        if (!role) {
            navigate('/login');
            return;
        }
        setIsLoading(true);
        fetchData();
    }, [id, role, navigate, fetchData]);
    
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || ticket.status === 'CLOSED') return;

        setIsSubmittingComment(true);
        const toastId = toast.loading("Adding comment...");

        try {
            // THE DEFINITIVE FIX: Send the ticket ID along with the comment text.
            // The backend requires this to associate the comment with the ticket.
            const response = await api.post(`/api/tickets/${id}/comments/`, {
                text: newComment,
                ticket: id 
            });
            setComments(prevComments => [...prevComments, response.data]);
            setNewComment('');
            toast.success("Comment added successfully!", { id: toastId });
        } catch (err) {
            // More detailed error logging for future debugging, if needed.
            console.error("COMMENT SUBMISSION ERROR:", err.response?.data || err.message);
            const errorMessage = err.response?.data?.detail || "Failed to add comment.";
            toast.error(errorMessage, { id: toastId });
        } finally {
            setIsSubmittingComment(false);
        }
    };
    
    if (isLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    if (error) return <div className="text-center p-8 text-red-600 flex flex-col items-center"><AlertTriangle size={48} /><p className="mt-4 text-lg">{error}</p><button onClick={() => navigate(-1)} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Go Back</button></div>;
    if (!ticket) return <div className="text-center p-8 text-gray-600"><p>Ticket not found.</p></div>;

    const isTicketClosed = ticket.status === 'CLOSED';

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-xl p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 transition-colors mr-4"><ArrowLeft size={24} /></button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Ticket #{ticket.ticket_id}</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Details Section */}
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700">
                                <p><strong>Created By:</strong> {ticket.username}</p>
                                <p><strong>Node Name:</strong> {ticket.node_name}</p>
                                <p><strong>Circle:</strong> {ticket.circle}</p>
                                <p><strong>BA/OA:</strong> {ticket.ba_oa}</p>
                                <p><strong>Category:</strong> {ticket.card_category}</p>
                                <p><strong>Priority:</strong> {ticket.priority}</p>
                                <p><strong>Status:</strong> <span className="font-bold">{ticket.status}</span></p>
                                <p><strong>Created At:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
                                {ticket.assigned_to_username && <p><strong>Assigned To:</strong> {ticket.assigned_to_username}</p>}
                            </div>
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-2">Issue Description</h3>
                                <p className="whitespace-pre-wrap bg-white p-3 rounded-md border">{ticket.fault_description}</p>
                            </div>
                        </div>
                        
                        {/* Comments Section */}
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Comments</h2>
                            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                {comments.length > 0 ? (comments.map(comment => (
                                    <div key={comment.id} className="p-4 bg-white rounded-lg shadow-sm border-l-4 border-blue-300">
                                        <div className="flex justify-between items-center text-sm">
                                            <p className="font-bold text-blue-800">{comment.author_username}</p>
                                            <p className="text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                                        </div>
                                        <p className="mt-2 text-gray-800">{comment.text}</p>
                                    </div>
                                ))) : (<p className="text-gray-500 italic">No comments yet.</p>)}
                            </div>
                            <form onSubmit={handleCommentSubmit} className="mt-6 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    value={newComment} 
                                    onChange={(e) => setNewComment(e.target.value)} 
                                    placeholder={isTicketClosed ? "Cannot comment on a closed ticket" : "Add a comment..."}
                                    className="flex-grow border rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-200"
                                    disabled={isSubmittingComment || isTicketClosed || role === 'OBSERVER'}
                                />
                                <button 
                                    type="submit" 
                                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center w-12 h-10"
                                    disabled={isSubmittingComment || !newComment.trim() || isTicketClosed || role === 'OBSERVER'}
                                >
                                    {isSubmittingComment ? <Loader2 className="animate-spin" size={20} /> : (isTicketClosed || role === 'OBSERVER'? <Lock size={20}/> : <Send size={20} />)}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="md:col-span-1 space-y-8">

                        {/* <TicketActions ticket={ticket} role={role} onUpdate={fetchData} /> */}
                        {role !== 'OBSERVER' && <TicketActions ticket={ticket} role={role} onUpdate={fetchData} />}
                        {role === 'ADMIN' && (
                    <>
                        <AdminControls ticket={ticket} onUpdate={fetchData} />
                        <AdminPriorityControl ticket={ticket} onUpdate={fetchData} />
                    </>
                )}
                        <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                            <h2 className="text-xl font-semibold mb-4">Attachment</h2>
                            {ticket.attachment ? (
                                <a href={ticket.attachment} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                                    View Attachment
                                </a>
                            ) : (
                                <div className="h-24 flex items-center justify-center bg-gray-200 text-gray-500 rounded-lg">
                                    No Attachment
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;