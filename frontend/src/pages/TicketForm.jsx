import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { useQuery } from "@tanstack/react-query";
import { groupedLocationsData, zonesData } from "../data/locationsData";
import { useAuth } from "../hooks/useAuth";

// Your custom styles are preserved
const customStyles = {
  control: (provided, state) => ({
    ...provided,
    borderRadius: "0.75rem",
    padding: "0.25rem",
    borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
    boxShadow: state.isFocused ? "0 0 0 2px #c7d2fe" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
    },
    transition: "all 0.2s ease-in-out",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#6366f1" : state.isHovered ? "#eef2ff" : "white",
    color: state.isSelected ? "white" : "#1f2937",
    cursor: "pointer",
  }),
};

// Your data functions are preserved
const fetchNodeNameData = async () => {
  return [
    { value: "PSS-32", label: "PSS-32" }, { value: "PSS-16II", label: "PSS-16II" }, { value: "PSS-8", label: "PSS-8" }, { value: "PSS-24X", label: "PSS-24X" },
  ];
};

const fetchPriorityData = async () => {
  return [
    { value: "CRITICAL", label: "Critical" }, { value: "HIGH", label: "High" }, { value: "MEDIUM", label: "Medium" }, { value: "LOW", label: "Low" },
  ];
};

const cardCategoryData = [
  { value: "2UX200", label: "2UX200" }, { value: "2UX500", label: "2UX500" }, { value: "5MX500", label: "5MX500" }, { value: "20AX200", label: "20AX200" }, { value: "IR9", label: "IR9" }, { value: "IR4 (DWDM)", label: "IR4 (DWDM)" }, { value: "ASG (Amplifier)", label: "ASG (Amplifier)" }, { value: "8EC2", label: "8EC2" }, { value: "32EC2", label: "32EC2" }, { value: "20MX80", label: "20MX80" }, { value: "12XCEC2", label: "12XCEC2" }, { value: "XST12T", label: "XST12T" }, { value: "Other", label: "Other" },
];

const zoneToStateMapping = {
    'North Zone': ['Chandigarh', 'Delhi', 'Haryana', 'Himachal Pradesh', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'Uttarakhand'],
    'South Zone': ['Andhra Pradesh', 'Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Puducherry', 'Lakshadweep', 'Andaman and Nicobar Islands'],
    'East Zone': ['Bihar', 'Jharkhand', 'Odisha', 'West Bengal', 'Sikkim'],
    'West Zone': ['Dadra and Nagar Haveli and Daman and Diu', 'Goa', 'Gujarat', 'Maharashtra'],
    'Central Zone': ['Chhattisgarh', 'Madhya Pradesh'],
    'North-East Zone': ['Arunachal Pradesh', 'Assam', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Tripura']
};

function TicketForm() {
  // Your state management is preserved
  const navigate = useNavigate();
  const { role } = useAuth();
  const [formData, setFormData] = useState({
    node_name: null, card_serial_number: "", fault_description: "", circle: null, node_location: null, ba_oa: "", card_category: null, other_card_description: "", priority: null, attachment: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for button loading state

  const { data: nodeNameData, isLoading: isNodeNameLoading } = useQuery({ queryKey: ["node_names"], queryFn: fetchNodeNameData });
  const { data: priorityData, isLoading: isPriorityLoading } = useQuery({ queryKey: ["priorities"], queryFn: fetchPriorityData });

  const isLoading = isNodeNameLoading || isPriorityLoading;

  const nodeLocationOptions = useMemo(() => {
    const selectedCircleLabel = formData.circle?.label;
    if (!selectedCircleLabel) return [];
    const statesInZone = zoneToStateMapping[selectedCircleLabel];
    if (!statesInZone) return [];
    return groupedLocationsData
      .filter(stateGroup => statesInZone.includes(stateGroup.label))
      .map(stateGroup => ({
        label: stateGroup.label,
        options: stateGroup.options.map(district => ({ ...district, stateLabel: stateGroup.label }))
      }));
  }, [formData.circle]);

  // All your handler functions are preserved
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (selectedOption, { name }) => {
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: selectedOption };
      if (name === "card_category" && selectedOption?.value !== "Other") {
        newData.other_card_description = "";
      }
      return newData;
    });
  };

  const handleCircleChange = (selectedOption) => {
    setFormData((prevData) => ({ ...prevData, circle: selectedOption, node_location: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData({ ...formData, attachment: file });
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const errors = {};
    if (!formData.node_name) errors.node_name = "Node Name is required.";
    if (!formData.card_serial_number) errors.card_serial_number = "Card Serial Number is required.";
    if (!formData.fault_description) errors.fault_description = "Fault Description is required.";
    if (!formData.circle) errors.circle = "Circle is required.";
    if (!formData.node_location) errors.node_location = "Node/Location is required.";
    if (!formData.ba_oa) errors.ba_oa = "BA/OA is required.";
    if (!formData.card_category) errors.card_category = "Card Category is required.";
    if (formData.card_category?.value === "Other" && !formData.other_card_description) {
      errors.other_card_description = 'Description is required for "Other" category.';
    }
    if (!formData.priority) errors.priority = "Priority is required.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    const data = new FormData();
    data.append("node_name", formData.node_name.value);
    data.append("card_serial_number", formData.card_serial_number);
    data.append("fault_description", formData.fault_description);
    data.append("circle", formData.circle.label);
    data.append("node_location", formData.node_location.value);
    data.append("ba_oa", formData.ba_oa);
    if (formData.card_category.value === "Other") {
      data.append("card_category", formData.other_card_description);
    } else {
      data.append("card_category", formData.card_category.value);
    }
    data.append("priority", formData.priority.value);
    if (formData.attachment) {
      data.append("attachment", formData.attachment);
    }

    try {
      // ========= THIS IS THE ONLY CHANGE MADE TO YOUR FILE =========
      // The required "/api" prefix has been added to the endpoint.
      await api.post("/api/tickets/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // ========= END OF THE FIX =========
      toast.success("Ticket created successfully!");
      navigate("/client-dashboard");
    } catch (err) {
      console.error("Failed to create ticket:", err.response || err);
      if (err.response && err.response.data) {
          const serverErrors = Object.entries(err.response.data)
                                     .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
                                     .join(' \n');
          toast.error(`Submission failed:\n${serverErrors}`, { duration: 6000 });
      } else {
          toast.error("Failed to create ticket. Please check your network connection.");
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  // Your entire JSX structure is preserved exactly as you wrote it.
  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row-reverse">
        <div className="w-full lg:w-1/2 p-8 sm:p-10 lg:p-12">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-3xl font-extrabold text-gray-900">Submit New Ticket</h2>
            <p className="mt-1 text-sm text-gray-500">Fill out the form below to submit a support request.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="node_name" className="block text-sm font-medium text-gray-700">Node Name</label>
                <Select id="node_name" name="node_name" value={formData.node_name} onChange={handleSelectChange} options={nodeNameData} isLoading={isNodeNameLoading} styles={customStyles} placeholder="Select Node Name..." className="mt-1" />
                {formErrors.node_name && (<p className="mt-1 text-xs text-red-600">{formErrors.node_name}</p>)}
              </div>
              <div>
                <label htmlFor="card_serial_number" className="block text-sm font-medium text-gray-700">Card Serial Number</label>
                <input type="text" id="card_serial_number" name="card_serial_number" value={formData.card_serial_number} onChange={handleChange} placeholder="Enter card identifier" className={`mt-1 block w-full px-4 py-3 rounded-xl border ${formErrors.card_serial_number ? "border-red-500" : "border-gray-300"} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm`} required />
                {formErrors.card_serial_number && (<p className="mt-1 text-xs text-red-600">{formErrors.card_serial_number}</p>)}
              </div>
            </div>
            <div>
              <label htmlFor="fault_description" className="block text-sm font-medium text-gray-700">Fault Description</label>
              <textarea id="fault_description" name="fault_description" value={formData.fault_description} onChange={handleChange} rows="3" placeholder="Detailed description of your problem" className={`mt-1 block w-full px-4 py-3 rounded-xl border ${formErrors.fault_description ? "border-red-500" : "border-gray-300"} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm`} required></textarea>
              {formErrors.fault_description && (<p className="mt-1 text-xs text-red-600">{formErrors.fault_description}</p>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="circle" className="block text-sm font-medium text-gray-700">Circle</label>
                <Select id="circle" name="circle" value={formData.circle} onChange={handleCircleChange} options={zonesData} styles={customStyles} placeholder="Select Circle..." className="mt-1" />
                {formErrors.circle && (<p className="mt-1 text-xs text-red-600">{formErrors.circle}</p>)}
              </div>
              <div>
                <label htmlFor="node_location" className="block text-sm font-medium text-gray-700">Node/Location</label>
                <Select id="node_location" name="node_location" value={formData.node_location} onChange={handleSelectChange} options={nodeLocationOptions} styles={customStyles} placeholder="Type a state or district..." className="mt-1" isDisabled={!formData.circle} filterOption={(option, inputValue) => { const lowerInput = inputValue.toLowerCase(); const districtMatch = option.label.toLowerCase().includes(lowerInput); const stateMatch = option.data.stateLabel.toLowerCase().includes(lowerInput); return districtMatch || stateMatch; }} />
                {formErrors.node_location && (<p className="mt-1 text-xs text-red-600">{formErrors.node_location}</p>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ba_oa" className="block text-sm font-medium text-gray-700">BA / OA</label>
                <input type="text" id="ba_oa" name="ba_oa" value={formData.ba_oa} onChange={handleChange} placeholder="Enter BA / OA" className={`mt-1 block w-full px-4 py-3 rounded-xl border ${formErrors.ba_oa ? "border-red-500" : "border-gray-300"} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm`} required />
                {formErrors.ba_oa && (<p className="mt-1 text-xs text-red-600">{formErrors.ba_oa}</p>)}
              </div>
              <div>
                <label htmlFor="card_category" className="block text-sm font-medium text-gray-700">Card Category</label>
                <Select id="card_category" name="card_category" value={formData.card_category} onChange={handleSelectChange} options={cardCategoryData} styles={customStyles} placeholder="Select Card..." className="mt-1" />
                {formErrors.card_category && (<p className="mt-1 text-xs text-red-600">{formErrors.card_category}</p>)}
              </div>
            </div>
            {formData.card_category?.value === "Other" && (
              <div>
                <label htmlFor="other_card_description" className="block text-sm font-medium text-gray-700">Other Card Description</label>
                <input type="text" id="other_card_description" name="other_card_description" value={formData.other_card_description} onChange={handleChange} placeholder="e.g., Special I/O Card" maxLength="50" className={`mt-1 block w-full px-4 py-3 rounded-xl border ${formErrors.other_card_description ? "border-red-500" : "border-gray-300"} shadow-sm focus:border-indigo-500 focus:ring-indigo-500 transition-all text-sm`} required />
                {formErrors.other_card_description && (<p className="mt-1 text-xs text-red-600">{formErrors.other_card_description}</p>)}
              </div>
            )}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
              <Select id="priority" name="priority" value={formData.priority} onChange={handleSelectChange} options={priorityData} isLoading={isPriorityLoading} styles={customStyles} placeholder="Select Priority..." className="mt-1" />
              {formErrors.priority && (<p className="mt-1 text-xs text-red-600">{formErrors.priority}</p>)}
            </div>
            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700">Attachment</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-20m32 0a4 4 0 00-4-4H12a4 4 0 00-4 4m20 20v-4m0-4h4m-4-4h4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="attachment-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>{fileName || "Upload a file"}</span>
                      <input id="attachment-file-upload" name="attachment" type="file" className="sr-only" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.txt" />
                    </label>
                    {!fileName && <p className="pl-1">or drag and drop</p>}
                  </div>
                  <p className="text-xs text-gray-500">Any file type up to 10MB</p>
                </div>
              </div>
            </div>
            <button type="submit" disabled={isLoading || isSubmitting || role === 'OBSERVER'} className="w-full py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed">
              {role === 'OBSERVER' ? 'Viewing as Observer' : (isSubmitting ? "Submitting..." : "Submit Ticket")}
            </button>
          </form>
        </div>
        <div className="relative hidden lg:flex w-1/2 items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-12">
          <div className="text-center text-white">
            <svg className="mx-auto h-24 w-24 text-white mb-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.75 17L12 19.25L14.25 17L12 14.75L9.75 17ZM12 4.75V2.75M12 21.25V19.25M4.75 12H2.75M21.25 12H19.25M6.25 6.25L4.5 4.5M19.5 19.5L17.75 17.75M17.75 6.25L19.5 4.5M4.5 19.5L6.25 17.75" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15a3 3 0 100-6 3 3 0 000 6z" /></svg>
            <h3 className="text-4xl font-extrabold tracking-tight">We're here to help.</h3>
            <p className="mt-4 text-lg font-medium opacity-80">Your support is our priority.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketForm;