// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK.

import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Loader2, AlertTriangle } from "lucide-react";

const ContactsPage = () => {
  const { data: profileData } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => api.get("/api/auth/me/"),
  });
  const username = profileData?.data?.username || "";

  const {
    data: contactsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contacts"],
    queryFn: () => api.get("/api/auth/contacts/"),
  });

  const contacts = contactsData?.data || [];

  const exportMutation = useMutation({
    mutationFn: () => api.get("/api/auth/contacts/export/"),
    onSuccess: (response) => {
      const allContacts = response.data;
      if (!allContacts || allContacts.length === 0) {
        toast.error("No contacts to export.");
        return;
      }

      toast.success("Generating CSV...");
      const headers = ["S.No", "Circle", "Name", "Contact Number", "Email"];
      const rows = allContacts.map((contact, index) =>
        [
          index + 1,
          `"${contact.circle}"`,
          `"${contact.name}"`,
          `"${contact.mobile_number}"`,
          `"${contact.email}"`,
        ].join(",")
      );

      const csvContent = [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `hfcl_spoc_contacts_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: () => toast.error("Failed to export contacts."),
  });

  return (
    <DashboardLayout
      pageTitle="HFCL Circle SPOC Contacts"
      username={username}
      onExport={exportMutation.mutate}
      showExportButton={true}
    >
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">S.No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Circle</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact Number</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan="5" className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" /></td></tr>
            ) : error ? (
              <tr><td colSpan="5" className="text-center py-10 text-red-500"><AlertTriangle className="h-8 w-8 mx-auto" /> Failed to load contacts.</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan="5" className="py-10 text-center text-gray-500">No contacts found.</td></tr>
            ) : (
              contacts.map((contact, index) => (
                <tr key={contact.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.circle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{contact.mobile_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline"><a href={`mailto:${contact.email}`}>{contact.email}</a></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
};

export default ContactsPage;