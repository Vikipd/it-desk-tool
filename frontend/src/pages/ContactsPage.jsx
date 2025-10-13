// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

const ContactsPage = () => {
  const { data: profileData } = useQuery({ queryKey: ["userProfile"], queryFn: () => api.get("/api/auth/me/") });
  const username = profileData?.data?.username || "";
  
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts", currentPage],
    queryFn: () => api.get(`/api/auth/contacts/?page=${currentPage}`),
    keepPreviousData: true,
  });

  const contacts = data?.data?.results || [];
  const totalCount = data?.data?.count || 0;
  const hasNextPage = data?.data?.next !== null;
  const hasPreviousPage = data?.data?.previous !== null;

  const exportMutation = useMutation({
      mutationFn: () => api.get("/api/auth/contacts/export/"),
      onSuccess: (response) => {
          const allContacts = response.data;
          if (!allContacts || allContacts.length === 0) { toast.error("No contacts to export."); return; }
          
          toast.success("Generating CSV...");
          const headers = ["S.No", "Name", "Role", "Zone", "State", "Mobile", "Email"];
          const rows = allContacts.map((contact, index) => 
              [index + 1, `"${contact.name}"`, `"${contact.role}"`, `"${contact.zone}"`, `"${contact.state}"`, `"${contact.mobile}"`, `"${contact.email}"`].join(",")
          );
          const csvContent = [headers.join(","), ...rows].join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", `contacts_export_${new Date().toISOString()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      },
      onError: () => toast.error("Failed to export contacts."),
  });

  return (
    <DashboardLayout 
        pageTitle="Contacts" 
        username={username}
        onExport={() => exportMutation.mutate()}
        showExportButton={true}
    >
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Zone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="7" className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /></td></tr>
            ) : error ? (
              <tr><td colSpan="7" className="text-center py-10 text-red-500"><AlertTriangle className="h-8 w-8 mx-auto" /> Failed to load contacts.</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-10 text-gray-500">No contacts found.</td></tr>
            ) : (
              contacts.map((contact, index) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(currentPage - 1) * 10 + index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.zone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.state}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.mobile}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline"><a href={`mailto:${contact.email}`}>{contact.email}</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-700">Showing <span className="font-medium">{Math.min((currentPage - 1) * 10 + 1, totalCount)}</span> to <span className="font-medium">{Math.min(currentPage * 10, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results</div>
        <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => p - 1)} disabled={!hasPreviousPage || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={16} />Previous</button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={!hasNextPage || isLoading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next<ChevronRight size={16} /></button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ContactsPage;