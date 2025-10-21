// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  Download,
  Edit,
  Printer,
  Trash2,
} from "lucide-react";
import Select from "react-select";
import { useAuth } from "../AuthContext"; // --- THIS IS THE FIX ---
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ActionModal from "../components/ActionModal.jsx";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center print:hidden">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="mt-4 text-gray-600">{children}</div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const formatToIST = (dateString) => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    const options = {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };
    return new Intl.DateTimeFormat("en-IN", options).format(date);
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return "Invalid Date";
  }
};

const DetailItem = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-base text-gray-900 break-words">{value || "--"}</p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="bg-gray-50 p-6 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200 print:bg-white print:p-4 print:mb-4">
    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h2>
    {children}
  </div>
);

const CommentItem = ({ comment }) => (
  <div className="p-4 bg-white rounded-lg border-l-4 border-blue-300 print:border-t print:border-gray-200 print:rounded-none print:border-l-0 print:bg-transparent print:p-0 print:pt-2 print:mb-2">
    <div className="flex justify-between text-sm">
      <p className="font-bold text-blue-800">{comment.author_username}</p>
      <p className="text-gray-500">{formatToIST(comment.created_at)}</p>
    </div>
    <p className="mt-2 text-gray-800">{comment.text}</p>
  </div>
);

const TimestampItem = ({ label, date }) =>
  date ? (
    <div className="flex justify-between items-center text-sm">
      <p className="text-gray-600">{label}:</p>
      <p className="font-semibold text-gray-800">{date}</p>
    </div>
  ) : null;

const EditableTimestampItem = ({ label, selected, onChange }) => (
  <div className="flex justify-between items-center text-sm">
    <p className="text-gray-600">{label}:</p>
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      dateFormat="Pp"
      isClearable
      className="w-full p-1 border rounded-md"
    />
  </div>
);

const AdminAssign = ({ ticket, onAssign }) => {
  const { data: engineers, isLoading } = useQuery({
    queryKey: ["engineers"],
    queryFn: () => api.get("/api/auth/technicians/").then((res) => res.data),
  });
  const engineerOptions =
    engineers?.map((e) => ({ value: e.id, label: e.username })) || [];
  const currentAssignee = engineerOptions.find(
    (opt) => opt.value === ticket.assigned_to
  );
  return (
    <Section title="Assign Engineer">
      <Select
        options={engineerOptions}
        value={currentAssignee}
        onChange={onAssign}
        isClearable={true}
        isLoading={isLoading}
        placeholder="Unassigned"
      />
    </Section>
  );
};

const AdminPriority = ({ ticket, onPriorityChange }) => {
  const priorityOptions = [
    { value: "CRITICAL", label: "Critical" },
    { value: "HIGH", label: "High" },
    { value: "MEDIUM", label: "Medium" },
    { value: "LOW", label: "Low" },
  ];
  const currentPriority = priorityOptions.find(
    (opt) => opt.value === ticket.priority
  );
  return (
    <Section title="Change Priority">
      <Select
        options={priorityOptions}
        value={currentPriority}
        onChange={onPriorityChange}
      />
    </Section>
  );
};

const EngineerActions = ({ ticket, onUpdate, currentUserId }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const statusUpdateMutation = useMutation({
    mutationFn: (data) => api.patch(`/api/tickets/${ticket.id}/`, data),
    onSuccess: (updatedTicket) => {
      toast.success(`Ticket status updated to "${updatedTicket.data.status}"`);
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      onUpdate();
    },
    onError: (error) =>
      toast.error(error.response?.data?.error || "Failed to update status."),
  });

  if (!currentUserId || ticket.assigned_to !== currentUserId) {
    return null;
  }

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const actionOptions = [
    { value: "IN_PROGRESS", label: "Start Progress" },
    { value: "IN_TRANSIT", label: "Mark as In Transit" },
    { value: "UNDER_REPAIR", label: "Mark as Under Repair" },
    { value: "RESOLVED", label: "Mark as Resolved" },
    { value: "ON_HOLD", label: "Put On Hold" },
  ];
  const statusOrder = [
    "OPEN",
    "IN_PROGRESS",
    "IN_TRANSIT",
    "UNDER_REPAIR",
    "RESOLVED",
  ];
  const currentStatusIndex = statusOrder.indexOf(ticket.status);
  const filteredActions = actionOptions.filter((action) => {
    if (ticket.status === "ON_HOLD") return false;
    if (action.value === "ON_HOLD") return true;
    const actionIndex = statusOrder.indexOf(action.value);
    return actionIndex > currentStatusIndex;
  });

  if (ticket.status === "ON_HOLD") {
    return (
      <Section title="Engineer Actions">
        <button
          onClick={() => statusUpdateMutation.mutate({ status: "IN_PROGRESS" })}
          disabled={statusUpdateMutation.isPending}
          className="w-full text-white px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {statusUpdateMutation.isPending ? "Resuming..." : "Resume Progress"}
        </button>
      </Section>
    );
  }

  if (
    filteredActions.length === 0 ||
    ticket.status === "RESOLVED" ||
    ticket.status === "CLOSED"
  ) {
    return null;
  }

  return (
    <>
      <Section title="Engineer Actions">
        <div className="space-y-4">
          <Select
            options={filteredActions}
            value={null}
            onChange={handleActionSelect}
            placeholder="Select an action..."
          />
        </div>
      </Section>
      {isModalOpen && selectedAction && (
        <ActionModal
          ticketId={ticket.id}
          action={selectedAction}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAction(null);
          }}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth(); // Changed from role to userRole for consistency
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isEditingTimestamps, setIsEditingTimestamps] = useState(false);
  const [editableTimestamps, setEditableTimestamps] = useState({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me/').then(res => setCurrentUserId(res.data.id)).catch(console.error);
  }, []);

  const {
    data: ticket,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const res = await api.get(`/api/tickets/${id}/`);
      const ticketData = res.data;
      const allTimestampFields = [
        "assigned_at",
        "in_progress_at",
        "in_transit_at",
        "under_repair_at",
        "on_hold_at",
        "resolved_at",
        "closed_at",
      ];
      const initialTimestamps = {};
      allTimestampFields.forEach((field) => {
        initialTimestamps[field] = ticketData[field]
          ? new Date(ticketData[field])
          : null;
      });
      setEditableTimestamps(initialTimestamps);
      return ticketData;
    },
  });

  const commentMutation = useMutation({
    mutationFn: (commentData) =>
      api.post(`/api/tickets/${id}/comments/`, commentData),
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      toast.success("Comment added!");
    },
    onError: (error) => {
      console.error("Detailed Error Response:", error.response?.data);
      toast.error("Failed to add comment. See console for details.");
    },
  });

  const adminMutation = useMutation({
    mutationFn: (updateData) => api.patch(`/api/tickets/${id}/`, updateData),
    onSuccess: () => {
      refetch();
      toast.success("Ticket updated successfully!");
    },
    onError: () => toast.error("Failed to update ticket."),
  });

  const timestampMutation = useMutation({
    mutationFn: (timestampData) =>
      api.patch(`/api/tickets/${id}/edit-timestamps/`, timestampData),
    onSuccess: () => {
      refetch();
      setIsEditingTimestamps(false);
      toast.success("Timestamps updated successfully!");
    },
    onError: () => toast.error("Failed to update timestamps."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/tickets/${id}/`),
    onSuccess: () => {
      toast.success(
        `Ticket #${ticket.ticket_id} has been permanently deleted.`
      );
      queryClient.invalidateQueries({ queryKey: ["filteredTickets"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardData"] });
      navigate("/admin-dashboard");
    },
    onError: () => {
      toast.error("Failed to delete the ticket.");
      setIsDeleteModalOpen(false);
    },
  });

  const handleCommentSubmit = (e) => {
    if (e) e.preventDefault();
    if (newComment.trim()) {
      commentMutation.mutate({ text: newComment });
    }
  };
  const handleAssign = (selectedOption) =>
    adminMutation.mutate({
      assigned_to: selectedOption ? selectedOption.value : null,
    });
  const handlePriorityChange = (selectedOption) =>
    adminMutation.mutate({ priority: selectedOption.value });
  const handleCloseTicket = () => adminMutation.mutate({ status: "CLOSED" });
  const handleTimestampChange = (field, date) =>
    setEditableTimestamps((prev) => ({ ...prev, [field]: date }));
  const handleSaveTimestamps = () => {
    const payload = Object.keys(editableTimestamps).reduce((acc, key) => {
      acc[key] = editableTimestamps[key]
        ? editableTimestamps[key].toISOString()
        : null;
      return acc;
    }, {});
    timestampMutation.mutate(payload);
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Ticket_${ticket?.ticket_id || "Details"}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 500);
  };

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  if (error)
    return (
      <div className="text-center p-8 text-red-600">
        <AlertTriangle size={48} />
        <p className="mt-4">
          Failed to load ticket details. You may not have permission to view
          this ticket.
        </p>
      </div>
    );

  const cardDetails = ticket?.card || {};
  const isCommentBoxDisabled = commentMutation.isPending;

  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans print:bg-white">
        <div className="hidden print-header">
          <img
            src="/assets/images/hfcl.png"
            alt="HFCL Logo"
            className="print-header-logo"
          />
          <div className="text-right">
            <h1 className="print-header-title">Ticket Details</h1>
            <p className="print-header-date">
              Printed on: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-xl print:shadow-none">
          <div className="p-6 sm:p-8 border-b flex justify-between items-center print:hidden">
            <div className="flex items-center">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Ticket #{ticket.ticket_id}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {userRole === "ADMIN" && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center text-sm font-semibold bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-600 hover:text-white"
                >
                  <Trash2 size={16} className="mr-2" /> Delete Ticket
                </button>
              )}
              <button
                onClick={handlePrint}
                className="flex items-center text-sm font-semibold bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
              >
                <Printer size={16} className="mr-2" /> Print / Export PDF
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8 print:grid-cols-1">
            <div className="lg:col-span-2 space-y-8 print:col-span-1">
              <Section title="Hardware Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailItem label="Node Name" value={cardDetails.node_name} />
                  <DetailItem
                    label="Serial Number"
                    value={cardDetails.serial_number}
                  />
                  <DetailItem
                    label="Primary IP"
                    value={cardDetails.primary_ip}
                  />
                  <DetailItem label="AID" value={cardDetails.aid} />
                  <DetailItem
                    label="Unit Part Number"
                    value={cardDetails.unit_part_number}
                  />
                  <DetailItem label="CLEI" value={cardDetails.clei} />
                  <DetailItem label="Zone" value={cardDetails.zone} />
                  <DetailItem label="State" value={cardDetails.state} />
                  <DetailItem label="Node Type" value={cardDetails.node_type} />
                  <DetailItem label="Location" value={cardDetails.location} />
                  <DetailItem label="Card Type" value={cardDetails.card_type} />
                  <DetailItem label="Slot" value={cardDetails.slot} />
                </div>
              </Section>
              <Section title="Fault Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailItem
                    label="Created By"
                    value={ticket.created_by?.username}
                  />
                  <DetailItem
                    label="Assigned To"
                    value={ticket.assigned_to_details?.username}
                  />
                  <DetailItem label="Priority" value={ticket.priority} />
                  <DetailItem label="Status" value={ticket.status} />
                  <DetailItem
                    label="Issue Description"
                    value={ticket.fault_description}
                    fullWidth
                  />
                  {ticket.other_card_type_description && (
                    <DetailItem
                      label="Other Card Type Info"
                      value={ticket.other_card_type_description}
                      fullWidth
                    />
                  )}
                </div>
              </Section>
              <Section title="Comments">
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 print:max-h-full print:overflow-visible">
                  {ticket.comments
                    ?.map((c) => <CommentItem key={c.id} comment={c} />)
                    .reverse()}
                </div>
                <div className="mt-6 flex gap-2 print:hidden">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-grow border rounded-md p-2"
                    disabled={isCommentBoxDisabled}
                  />
                  <button
                    onClick={handleCommentSubmit}
                    type="button"
                    className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 w-12 h-10 flex items-center justify-center"
                    disabled={isCommentBoxDisabled || !newComment.trim()}
                  >
                    {commentMutation.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Send />
                    )}
                  </button>
                </div>
              </Section>
            </div>
            <div className="lg:col-span-1 space-y-8 print:space-y-0">
              <div className="print:hidden">
                {userRole === "TECHNICIAN" && (
                  <EngineerActions ticket={ticket} onUpdate={refetch} currentUserId={currentUserId} />
                )}
              </div>
              <div className="print:hidden">
                {userRole === "ADMIN" && (
                  <>
                    <AdminAssign ticket={ticket} onAssign={handleAssign} />
                    <AdminPriority
                      ticket={ticket}
                      onPriorityChange={handlePriorityChange}
                    />
                    {ticket.status === "RESOLVED" && (
                      <Section title="Admin Actions">
                        <button
                          onClick={handleCloseTicket}
                          disabled={adminMutation.isPending}
                          className="w-full text-white px-4 py-2 rounded-lg shadow bg-green-600 hover:bg-green-700"
                        >
                          Close Ticket
                        </button>
                      </Section>
                    )}
                  </>
                )}
              </div>
              <Section title="Ticket History">
                <div className="flex justify-end mb-2 print:hidden">
                  {userRole === "ADMIN" && (
                    <>
                      {!isEditingTimestamps ? (
                        <button
                          onClick={() => setIsEditingTimestamps(true)}
                          className="flex items-center text-sm text-blue-600 hover:underline"
                        >
                          <Edit size={14} className="mr-1" /> Edit Timestamps
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingTimestamps(false)}
                            className="text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveTimestamps}
                            disabled={timestampMutation.isPending}
                            className="text-sm font-semibold text-green-600 hover:underline"
                          >
                            {timestampMutation.isPending ? "Saving..." : "Save"}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <TimestampItem
                    label="Created At"
                    date={formatToIST(ticket.created_at)}
                  />
                  {Object.keys(editableTimestamps).map((field) =>
                    isEditingTimestamps ? (
                      <EditableTimestampItem
                        key={field}
                        label={field.replace(/_/g, " ").replace("at", "At")}
                        selected={editableTimestamps[field]}
                        onChange={(date) => handleTimestampChange(field, date)}
                      />
                    ) : (
                      <TimestampItem
                        key={field}
                        label={field.replace(/_/g, " ").replace("at", "At")}
                        date={formatToIST(ticket[field])}
                      />
                    )
                  )}
                </div>
              </Section>
              <Section title="Attachment">
                <div className="print:hidden">
                  {ticket.attachment ? (
                    <a
                      href={ticket.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 hover:underline break-all"
                    >
                      <Download size={16} className="mr-2" /> View Attachment
                    </a>
                  ) : (
                    <p>No attachment provided.</p>
                  )}
                </div>
                <p className="hidden print:block">
                  {ticket.attachment
                    ? "See digital record for attachment"
                    : "No attachment provided."}
                </p>
              </Section>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
      >
        <p>
          Are you sure you want to permanently delete ticket{" "}
          <strong>#{ticket?.ticket_id}</strong>?
        </p>
        <p className="mt-2 text-sm font-semibold text-red-600">
          This action cannot be undone.
        </p>
      </ConfirmationModal>
    </>
  );
};

export default TicketDetail;