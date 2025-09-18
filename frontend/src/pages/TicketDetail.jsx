// COPY AND PASTE THIS ENTIRE BLOCK. THIS IS THE FULL AND UNTRUNCATED FILE.

import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api.js";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Send,
  Loader2,
  AlertTriangle,
  Lock,
  Download,
  Edit,
  Printer,
} from "lucide-react";
import Select from "react-select";
import { useAuth } from "../hooks/useAuth.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const DetailItem = ({ label, value, fullWidth = false }) => (
  <div className={fullWidth ? "sm:col-span-2" : ""}>
    {" "}
    <p className="text-sm font-medium text-gray-500">{label}</p>{" "}
    <p className="mt-1 text-base text-gray-900 break-words">{value || "--"}</p>{" "}
  </div>
);

const EngineerActions = ({ ticket, onUpdate }) => {
  const [selectedAction, setSelectedAction] = useState(null);
  const [otherReason, setOtherReason] = useState("");
  const queryClient = useQueryClient();
  const statusUpdateMutation = useMutation({
    mutationFn: (data) => api.patch(`/api/tickets/${ticket.id}/`, data),
    onSuccess: (updatedTicket) => {
      toast.success(`Ticket status updated to "${updatedTicket.data.status}"`);
      setSelectedAction(null);
      setOtherReason("");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
      onUpdate();
    },
    onError: (error) =>
      toast.error(error.response?.data?.error || "Failed to update status."),
  });
  const commentMutation = useMutation({
    mutationFn: (commentData) =>
      api.post(`/api/tickets/${ticket.id}/comments/`, commentData),
    onSuccess: () => {
      toast.success("Reason for hold has been added as a comment.");
      queryClient.invalidateQueries({ queryKey: ["ticket", ticket.id] });
    },
    onError: () => toast.error("Failed to add comment for hold reason."),
  });
  const handleActionSubmit = () => {
    if (!selectedAction) return;
    let statusUpdateData = { status: selectedAction.value };
    if (selectedAction.value === "ON_HOLD") {
      if (!otherReason.trim()) {
        toast.error("A reason is required to put the ticket on hold.");
        return;
      }
      commentMutation.mutate(
        { text: `Ticket On Hold. Reason: ${otherReason}` },
        {
          onSuccess: () => {
            statusUpdateMutation.mutate(statusUpdateData);
          },
        }
      );
    } else {
      statusUpdateMutation.mutate(statusUpdateData);
    }
  };

  // --- THIS IS THE FIX: The label has been changed as you requested ---
  const actionOptions = [
    { value: "IN_PROGRESS", label: "Start Progress" },
    { value: "IN_TRANSIT", label: "Mark as In Transit" },
    { value: "UNDER_REPAIR", label: "Mark as Under Repair" },
    { value: "RESOLVED", label: "Mark as Resolved" },
    { value: "ON_HOLD", label: "Other Actions" }, // Changed from "On Hold (Other)"
  ];
  // --- END OF FIX ---

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
  )
    return null;
  return (
    <Section title="Engineer Actions">
      <div className="space-y-4">
        <Select
          options={filteredActions}
          value={selectedAction}
          onChange={setSelectedAction}
          placeholder="Select an action..."
        />
        {selectedAction?.value === "ON_HOLD" && (
          <textarea
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            placeholder="Please provide a reason..."
            className="w-full border rounded-md p-2 text-sm"
            rows="3"
          />
        )}
        <button
          onClick={handleActionSubmit}
          disabled={
            !selectedAction ||
            statusUpdateMutation.isPending ||
            commentMutation.isPending
          }
          className="w-full text-white px-4 py-2 rounded-lg shadow bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {statusUpdateMutation.isPending ? "Updating..." : "Confirm Action"}
        </button>
      </div>
    </Section>
  );
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [isEditingTimestamps, setIsEditingTimestamps] = useState(false);
  const [editableTimestamps, setEditableTimestamps] = useState({});

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
      console.error("Detailed Error Response:", error.response.data);
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
    window.print();
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
        <p className="mt-4">Failed to load ticket details.</p>
      </div>
    );

  const cardDetails = ticket.card || {};
  const timestampFields = [
    "assigned_at",
    "in_progress_at",
    "in_transit_at",
    "under_repair_at",
    "on_hold_at",
    "resolved_at",
    "closed_at",
  ];

  const isCommentBoxDisabled = commentMutation.isPending || role === "OBSERVER";

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans print:bg-white">
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
          <button
            onClick={handlePrint}
            className="flex items-center text-sm font-semibold bg-gray-200 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-300"
          >
            <Printer size={16} className="mr-2" /> Print / Export PDF
          </button>
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
                <DetailItem label="Primary IP" value={cardDetails.primary_ip} />
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
                  value={ticket.created_by_username}
                />
                <DetailItem
                  label="Assigned To"
                  value={ticket.assigned_to_username}
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
                  placeholder={
                    role === "OBSERVER"
                      ? "Commenting is disabled for Observers"
                      : "Add a comment..."
                  }
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
                  ) : isCommentBoxDisabled ? (
                    <Lock />
                  ) : (
                    <Send />
                  )}
                </button>
              </div>
            </Section>
          </div>
          <div className="lg:col-span-1 space-y-8 print:space-y-0">
            <div className="print:hidden">
              {role === "TECHNICIAN" && (
                <EngineerActions ticket={ticket} onUpdate={refetch} />
              )}
            </div>
            <div className="print:hidden">
              {role === "ADMIN" && (
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
                {role === "ADMIN" && (
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
                <TimestampItem label="Created At" date={ticket.created_at} />
                {timestampFields.map((field) =>
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
                      date={ticket[field]}
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
  );
};

const Section = ({ title, children }) => (
  <div className="bg-gray-50 p-6 rounded-lg shadow-sm print:shadow-none print:border print:border-gray-200 print:bg-white">
    {" "}
    <h2 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h2>{" "}
    {children}{" "}
  </div>
);
const CommentItem = ({ comment }) => (
  <div className="p-4 bg-white rounded-lg border-l-4 border-blue-300 print:border-none print:bg-transparent print:p-0 print:mb-2">
    {" "}
    <div className="flex justify-between text-sm">
      {" "}
      <p className="font-bold text-blue-800">{comment.author_username}</p>{" "}
      <p className="text-gray-500">
        {new Date(comment.created_at).toLocaleString()}
      </p>{" "}
    </div>{" "}
    <p className="mt-2 text-gray-800">{comment.text}</p>{" "}
  </div>
);
const TimestampItem = ({ label, date }) =>
  date ? (
    <div className="flex justify-between items-center text-sm">
      {" "}
      <p className="text-gray-600">{label}:</p>{" "}
      <p className="font-semibold text-gray-800">
        {new Date(date).toLocaleString()}
      </p>{" "}
    </div>
  ) : null;
const EditableTimestampItem = ({ label, selected, onChange }) => (
  <div className="flex justify-between items-center text-sm">
    {" "}
    <p className="text-gray-600">{label}:</p>{" "}
    <DatePicker
      selected={selected}
      onChange={onChange}
      showTimeSelect
      dateFormat="Pp"
      isClearable
      className="w-full p-1 border rounded-md"
    />{" "}
  </div>
);
const AdminAssign = ({ ticket, onAssign }) => {
  const { data: engineers, isLoading } = useQuery({
    queryKey: ["engineers"],
    queryFn: () => api.get("/api/technicians/").then((res) => res.data),
  });
  const engineerOptions =
    engineers?.map((e) => ({ value: e.id, label: e.username })) || [];
  const currentAssignee = engineerOptions.find(
    (opt) => opt.value === ticket.assigned_to
  );
  return (
    <Section title="Assign Engineer">
      {" "}
      <Select
        options={engineerOptions}
        value={currentAssignee}
        onChange={onAssign}
        isClearable={true}
        isLoading={isLoading}
        placeholder="Unassigned"
      />{" "}
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
      {" "}
      <Select
        options={priorityOptions}
        value={currentPriority}
        onChange={onPriorityChange}
      />{" "}
    </Section>
  );
};

export default TicketDetail;
