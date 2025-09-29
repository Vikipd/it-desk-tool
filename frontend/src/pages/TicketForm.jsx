// COPY AND PASTE THIS ENTIRE, FINAL, PERFECT BLOCK. THE REDIRECT IS FIXED.

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { ArrowLeft, UploadCloud } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const formatOptions = (data) =>
  data ? data.map((item) => ({ value: item, label: item })) : [];
const customStyles = {
  control: (base) => ({ ...base, padding: "0.25rem", borderRadius: "0.75rem" }),
};

const ManualApiSelect = ({
  value,
  onChange,
  fieldName,
  queryParams,
  placeholder,
  isDisabled,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ["filteredData", fieldName, queryParams],
    queryFn: () =>
      api
        .get(`/api/cards/filtered-data/${fieldName}/`, { params: queryParams })
        .then((res) => res.data),
    enabled: !isDisabled,
  });
  return (
    <Select
      value={value}
      onChange={onChange}
      options={formatOptions(data)}
      isLoading={isLoading}
      isDisabled={isDisabled}
      placeholder={placeholder}
      styles={customStyles}
    />
  );
};

function TicketForm() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCardType, setSelectedCardType] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [autofilledData, setAutofilledData] = useState(null);
  const [faultDescription, setFaultDescription] = useState("");
  const [otherCardDescription, setOtherCardDescription] = useState("");
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [attachment, setAttachment] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualNodeName, setManualNodeName] = useState(null);
  const [manualPrimaryIp, setManualPrimaryIp] = useState(null);
  const [manualAid, setManualAid] = useState(null);
  const [manualUnitPartNumber, setManualUnitPartNumber] = useState(null);
  const [manualClei, setManualClei] = useState(null);
  const [manualSlot, setManualSlot] = useState("");
  const [manualSerialNumber, setManualSerialNumber] = useState("");

  const { data: zones, isLoading: isLoadingZones } = useQuery({
    queryKey: ["zones"],
    queryFn: () => api.get("/api/cards/zones/").then((res) => res.data),
  });
  const { data: states, isLoading: isLoadingStates } = useQuery({
    queryKey: ["states", selectedZone],
    queryFn: () =>
      api
        .get("/api/cards/states/", { params: { zone: selectedZone?.value } })
        .then((res) => res.data),
    enabled: !!selectedZone,
  });
  const { data: nodeTypes, isLoading: isLoadingNodeTypes } = useQuery({
    queryKey: ["nodeTypes", selectedState],
    queryFn: () =>
      api
        .get("/api/cards/node-types/", {
          params: { zone: selectedZone?.value, state: selectedState?.value },
        })
        .then((res) => res.data),
    enabled: !!selectedState,
  });
  const { data: locations, isLoading: isLoadingLocations } = useQuery({
    queryKey: ["locations", selectedNodeType],
    queryFn: () =>
      api
        .get("/api/cards/locations/", {
          params: {
            zone: selectedZone?.value,
            state: selectedState?.value,
            node_type: selectedNodeType?.value,
          },
        })
        .then((res) => res.data),
    enabled: !!selectedNodeType,
  });
  const { data: cardTypes, isLoading: isLoadingCardTypes } = useQuery({
    queryKey: ["cardTypes", selectedLocation],
    queryFn: async () => {
      const res = await api.get("/api/cards/card-types/", {
        params: {
          zone: selectedZone?.value,
          state: selectedState?.value,
          node_type: selectedNodeType?.value,
          location: selectedLocation?.value,
        },
      });
      return ["Other", ...res.data];
    },
    enabled: !!selectedLocation,
  });
  const { data: slots, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["slots", selectedCardType],
    queryFn: () =>
      api
        .get("/api/cards/slots/", {
          params: {
            zone: selectedZone?.value,
            state: selectedState?.value,
            node_type: selectedNodeType?.value,
            location: selectedLocation?.value,
            card_type: selectedCardType?.value,
          },
        })
        .then((res) => res.data),
    enabled: !!selectedCardType && selectedCardType?.value !== "Other",
  });
  const { isFetching: isAutofilling } = useQuery({
    queryKey: ["autofill", selectedSlot],
    queryFn: async () => {
      const params = {
        zone: selectedZone.value,
        state: selectedState.value,
        node_type: selectedNodeType.value,
        location: selectedLocation.value,
        card_type: selectedCardType.value,
        slot: selectedSlot.value,
      };
      const res = await api.get("/api/cards/autofill/", { params });
      setAutofilledData(res.data);
      return res.data;
    },
    enabled: !!selectedSlot && selectedCardType?.value !== "Other",
    retry: false,
  });

  const handleSelectChange = (setter, resetFields) => (option) => {
    setter(option);
    resetFields.forEach((fieldSetter) => fieldSetter(null));
    setAutofilledData(null);
  };
  const handleCardTypeChange = (option) => {
    setSelectedCardType(option);
    setSelectedSlot(null);
    setAutofilledData(null);
    if (option?.value !== "Other") {
      setOtherCardDescription("");
    }
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      toast.error("File size cannot exceed 10MB.");
      return;
    }
    setAttachment(file);
    setFileName(file ? file.name : "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isManualMode = selectedCardType?.value === "Other";
    if (!isManualMode && !autofilledData) {
      toast.error("Please complete hardware selections to identify the card.");
      return;
    }
    if (
      isManualMode &&
      (!selectedZone ||
        !selectedState ||
        !selectedNodeType ||
        !selectedLocation ||
        !manualNodeName ||
        !manualSlot ||
        !manualSerialNumber)
    ) {
      toast.error("Please fill all required manual hardware details.");
      return;
    }
    if (!faultDescription.trim()) {
      toast.error("Fault Description is required.");
      return;
    }
    if (!selectedPriority) {
      toast.error("Priority is required.");
      return;
    }
    if (isManualMode && !otherCardDescription.trim()) {
      toast.error('Description is required for "Other" Card Type.');
      return;
    }

    setIsSubmitting(true);
    const data = new FormData();
    data.append("fault_description", faultDescription);
    data.append("priority", selectedPriority.value);
    if (attachment) {
      data.append("attachment", attachment);
    }
    if (isManualMode) {
      data.append("other_card_type_description", otherCardDescription);
      data.append("zone", selectedZone.value);
      data.append("state", selectedState.value);
      data.append("node_type", selectedNodeType.value);
      data.append("location", selectedLocation.value);
      data.append("manual_node_name", manualNodeName.value);
      data.append("manual_primary_ip", manualPrimaryIp?.value || "");
      data.append("manual_aid", manualAid?.value || "");
      data.append("manual_unit_part_number", manualUnitPartNumber?.value || "");
      data.append("manual_clei", manualClei?.value || "");
      data.append("manual_slot", manualSlot);
      data.append("manual_serial_number", manualSerialNumber);
    } else {
      data.append("serial_number", autofilledData.serial_number);
    }

    try {
      await api.post("/api/tickets/", data);
      toast.success("Ticket created successfully!");

      // --- MODIFICATION: THIS IS THE CORRECT, PROFESSIONAL REDIRECT LOGIC ---
      if (role === "CLIENT") {
        navigate("/client-dashboard");
      } else if (role === "TECHNICIAN") {
        navigate("/technician-dashboard");
      } else if (role === "ADMIN") {
        navigate("/admin-dashboard");
      } else {
        navigate(-1); // Go back as a fallback
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData && typeof errorData === "object") {
        const errorMessages = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n");
        toast.error(`Submission failed:\n${errorMessages}`);
      } else {
        toast.error(errorData || "Failed to create ticket.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isManualMode = selectedCardType?.value === "Other";
  const canFetchManualOptions =
    !!selectedZone &&
    !!selectedState &&
    !!selectedNodeType &&
    !!selectedLocation;

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 sm:p-10 lg:p-12">
          <div className="flex items-center mb-6">
            <Link to={-1} className="text-gray-500 hover:text-gray-800 mr-4">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">
                Submit New Ticket
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Fill out the form to identify hardware and submit a request.
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset className="p-4 border rounded-lg">
              <legend className="px-2 text-lg font-semibold text-blue-700">
                Hardware Identification
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Zone
                  </label>
                  <Select
                    value={selectedZone}
                    onChange={handleSelectChange(setSelectedZone, [
                      setSelectedState,
                      setSelectedNodeType,
                      setSelectedLocation,
                      setSelectedCardType,
                      setSelectedSlot,
                    ])}
                    options={formatOptions(zones)}
                    isLoading={isLoadingZones}
                    placeholder="Select Zone..."
                    styles={customStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <Select
                    value={selectedState}
                    onChange={handleSelectChange(setSelectedState, [
                      setSelectedNodeType,
                      setSelectedLocation,
                      setSelectedCardType,
                      setSelectedSlot,
                    ])}
                    options={formatOptions(states)}
                    isLoading={isLoadingStates}
                    isDisabled={!selectedZone || isLoadingStates}
                    placeholder="Select State..."
                    styles={customStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Node Type
                  </label>
                  <Select
                    value={selectedNodeType}
                    onChange={handleSelectChange(setSelectedNodeType, [
                      setSelectedLocation,
                      setSelectedCardType,
                      setSelectedSlot,
                    ])}
                    options={formatOptions(nodeTypes)}
                    isLoading={isLoadingNodeTypes}
                    isDisabled={!selectedState || isLoadingNodeTypes}
                    placeholder="Select Node Type..."
                    styles={customStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <Select
                    value={selectedLocation}
                    onChange={handleSelectChange(setSelectedLocation, [
                      setSelectedCardType,
                      setSelectedSlot,
                    ])}
                    options={formatOptions(locations)}
                    isLoading={isLoadingLocations}
                    isDisabled={!selectedNodeType || isLoadingLocations}
                    placeholder="Select Location..."
                    styles={customStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Card Type
                  </label>
                  <Select
                    value={selectedCardType}
                    onChange={handleCardTypeChange}
                    options={formatOptions(cardTypes)}
                    isLoading={isLoadingCardTypes}
                    isDisabled={!selectedLocation || isLoadingCardTypes}
                    placeholder="Select Card Type..."
                    styles={customStyles}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Slot
                  </label>
                  <Select
                    value={selectedSlot}
                    onChange={handleSelectChange(setSelectedSlot, [])}
                    options={formatOptions(slots)}
                    isLoading={isLoadingSlots}
                    isDisabled={
                      !selectedCardType || isLoadingSlots || isManualMode
                    }
                    placeholder={
                      isManualMode ? "N/A for Other" : "Select Slot..."
                    }
                    styles={customStyles}
                  />
                </div>
              </div>
            </fieldset>
            {(autofilledData || isAutofilling) && !isManualMode && (
              <fieldset className="p-4 border rounded-lg bg-gray-50">
                <legend className="px-2 text-lg font-semibold text-orange-700">
                  Verified Card Details
                </legend>
                {isAutofilling ? (
                  <p className="text-center">Verifying...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    <div className="lg:col-span-3">
                      <InputField
                        label="Node Name"
                        value={autofilledData.node_name}
                        readOnly
                      />
                    </div>
                    <InputField
                      label="Primary IP"
                      value={autofilledData.primary_ip}
                      readOnly
                    />
                    <InputField
                      label="AID"
                      value={autofilledData.aid}
                      readOnly
                    />
                    <InputField
                      label="Serial Number"
                      value={autofilledData.serial_number}
                      readOnly
                    />
                    <InputField
                      label="Unit Part Number"
                      value={autofilledData.unit_part_number}
                      readOnly
                    />
                    <InputField
                      label="CLEI"
                      value={autofilledData.clei}
                      readOnly
                    />
                  </div>
                )}
              </fieldset>
            )}
            {isManualMode && (
              <fieldset className="p-4 border rounded-lg bg-yellow-50">
                <legend className="px-2 text-lg font-semibold text-yellow-800">
                  Manual Hardware Details
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Node Name
                    </label>
                    <ManualApiSelect
                      value={manualNodeName}
                      onChange={setManualNodeName}
                      fieldName="node_name"
                      queryParams={{
                        zone: selectedZone?.value,
                        state: selectedState?.value,
                        node_type: selectedNodeType?.value,
                        location: selectedLocation?.value,
                      }}
                      placeholder="Select Node Name..."
                      isDisabled={!canFetchManualOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Primary IP
                    </label>
                    <ManualApiSelect
                      value={manualPrimaryIp}
                      onChange={setManualPrimaryIp}
                      fieldName="primary_ip"
                      queryParams={{
                        zone: selectedZone?.value,
                        state: selectedState?.value,
                        node_type: selectedNodeType?.value,
                        location: selectedLocation?.value,
                      }}
                      placeholder="Select Primary IP..."
                      isDisabled={!canFetchManualOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      AID
                    </label>
                    <ManualApiSelect
                      value={manualAid}
                      onChange={setManualAid}
                      fieldName="aid"
                      queryParams={{
                        zone: selectedZone?.value,
                        state: selectedState?.value,
                        node_type: selectedNodeType?.value,
                        location: selectedLocation?.value,
                      }}
                      placeholder="Select AID..."
                      isDisabled={!canFetchManualOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Unit Part Number
                    </label>
                    <ManualApiSelect
                      value={manualUnitPartNumber}
                      onChange={setManualUnitPartNumber}
                      fieldName="unit_part_number"
                      queryParams={{
                        zone: selectedZone?.value,
                        state: selectedState?.value,
                        node_type: selectedNodeType?.value,
                        location: selectedLocation?.value,
                      }}
                      placeholder="Select Part Number..."
                      isDisabled={!canFetchManualOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      CLEI
                    </label>
                    <ManualApiSelect
                      value={manualClei}
                      onChange={setManualClei}
                      fieldName="clei"
                      queryParams={{
                        zone: selectedZone?.value,
                        state: selectedState?.value,
                        node_type: selectedNodeType?.value,
                        location: selectedLocation?.value,
                      }}
                      placeholder="Select CLEI..."
                      isDisabled={!canFetchManualOptions}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Slot
                    </label>
                    <input
                      type="text"
                      value={manualSlot}
                      onChange={(e) => setManualSlot(e.target.value)}
                      placeholder="Enter Slot Number"
                      className="mt-1 block w-full px-4 py-3 rounded-xl border-gray-300"
                      required={isManualMode}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={manualSerialNumber}
                      onChange={(e) => setManualSerialNumber(e.target.value)}
                      placeholder="Enter Serial Number"
                      className="mt-1 block w-full px-4 py-3 rounded-xl border-gray-300"
                      required={isManualMode}
                    />
                  </div>
                </div>
              </fieldset>
            )}
            <fieldset className="p-4 border rounded-lg">
              <legend className="px-2 text-lg font-semibold text-gray-800">
                Fault Information
              </legend>
              <div className="space-y-4 pt-2">
                {isManualMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Other Card Type Description
                    </label>
                    <input
                      type="text"
                      value={otherCardDescription}
                      onChange={(e) => setOtherCardDescription(e.target.value)}
                      placeholder="Please specify the card type"
                      className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fault Description
                  </label>
                  <textarea
                    value={faultDescription}
                    onChange={(e) => setFaultDescription(e.target.value)}
                    rows="4"
                    placeholder="Detailed description of the problem..."
                    className="mt-1 block w-full px-4 py-3 rounded-xl border border-gray-300"
                    required
                  ></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <Select
                      value={selectedPriority}
                      onChange={setSelectedPriority}
                      options={[
                        { value: "CRITICAL", label: "Critical" },
                        { value: "HIGH", label: "High" },
                        { value: "MEDIUM", label: "Medium" },
                        { value: "LOW", label: "Low" },
                      ]}
                      placeholder="Select Priority..."
                      styles={customStyles}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Attachment
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="attachment-file"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            <span>{fileName || "Upload a file"}</span>
                            <input
                              id="attachment-file"
                              name="attachment"
                              type="file"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                          {!fileName && (
                            <p className="pl-1">or drag and drop</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Any file type up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </fieldset>
            <button
              type="submit"
              disabled={isSubmitting || isAutofilling || role === "OBSERVER"}
              className="w-full py-3 text-base font-semibold text-white bg-indigo-600 rounded-xl shadow-lg hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {role === "OBSERVER"
                ? "Viewing as Observer"
                : isSubmitting
                ? "Submitting..."
                : "Submit Ticket"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const InputField = ({ label, value, readOnly }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type="text"
      value={value || ""}
      readOnly={readOnly}
      className="mt-1 block w-full px-4 py-3 rounded-xl border-gray-300 bg-gray-100 cursor-not-allowed"
    />
  </div>
);

export default TicketForm;
