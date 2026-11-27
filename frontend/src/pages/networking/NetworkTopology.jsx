
import { useEffect, useState } from "react";
import {
  Network,
  Cloud,
  Layers3,
  ShieldCheck,
  Globe,
  Database,
  Server,
  ArrowDown,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Info,
  Workflow,
} from "lucide-react";

import { getSavedIntents } from "../../services/intentService";
import { generateNetworkTopology } from "../../services/networkTopologyService";

const providerColors = {
  AWS: "border-orange-200 bg-orange-50 text-orange-700",
  Azure: "border-blue-200 bg-blue-50 text-blue-700",
  GCP: "border-green-200 bg-green-50 text-green-700",
};

const subnetColors = {
  Public: "border-blue-200 bg-blue-50 text-blue-700",
  Private: "border-purple-200 bg-purple-50 text-purple-700",
};

const NetworkTopology = () => {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [provider, setProvider] = useState("");
  const [topology, setTopology] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [intentError, setIntentError] = useState("");
  const [refreshMessage, setRefreshMessage] = useState("");
  useEffect(() => {
  if (!refreshMessage) return;

  const timer = setTimeout(() => {
    setRefreshMessage("");
  }, 3000);

  return () => clearTimeout(timer);
}, [refreshMessage]);
  const [error, setError] = useState("");

  const fetchIntents = async () => {
    try {
      setLoadingIntents(true);
      setIntentError("");
      setRefreshMessage("");

      const data = await getSavedIntents();
      setIntents(data);

      // Preserve the selected intent when it still exists in the refreshed list.
      const existingIntent = data.find(
        (intent) => String(intent.id) === selectedIntentId
      );
      const intentToSelect = existingIntent || data[0] || null;

      if (intentToSelect) {
        setSelectedIntentId(String(intentToSelect.id));

        // Keep the provider if it is still supported by this intent.
        const providerStillValid = intentToSelect.providers?.includes(provider);
        setProvider(
          providerStillValid ? provider : intentToSelect.providers?.[0] || ""
        );
      } else {
        setSelectedIntentId("");
        setProvider("");
      }

      // Clear the previous topology because refreshed intent data may have changed.
      setTopology(null);
      setError("");
      setRefreshMessage("Intents refreshed successfully.");
    } catch (err) {
      setIntentError(
        err.response?.data?.detail || "Failed to load saved intents."
      );
      setRefreshMessage("");
    } finally {
      setLoadingIntents(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  const selectedIntent = intents.find(
    (intent) => String(intent.id) === selectedIntentId
  );

  const handleIntentChange = (intentId) => {
    setSelectedIntentId(intentId);
    setTopology(null);
    setError("");

    const selected = intents.find(
      (intent) => String(intent.id) === intentId
    );

    setProvider(selected?.providers?.[0] || "");
  };

  const handleGenerateTopology = async () => {
    if (!selectedIntentId || !provider) {
      setError("Please select an intent and cloud provider.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setTopology(null);

      const result = await generateNetworkTopology(
        Number(selectedIntentId),
        provider
      );

      setTopology(result);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to generate network topology."
      );
    } finally {
      setGenerating(false);
    }
  };

  const getComponentIcon = (componentType = "") => {
    const type = componentType.toLowerCase();

    if (type.includes("database")) return Database;
    if (type.includes("security") || type.includes("firewall")) return ShieldCheck;
    if (type.includes("gateway") || type.includes("internet")) return Globe;
    if (type.includes("network") || type.includes("vpc") || type.includes("virtual")) return Network;

    return Server;
  };

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Network className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900">
              Network Topology
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Plan network architecture, subnet segmentation, and connectivity across cloud providers.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
          <Info size={14} />
          Simulation Mode
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Topology Configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a saved infrastructure intent and cloud provider to generate a network design.
          </p>
        </div>

        {intentError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={17} />
            {intentError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Intent Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Saved Infrastructure Intent
            </label>

            <select
              value={selectedIntentId}
              onChange={(e) => handleIntentChange(e.target.value)}
              disabled={loadingIntents || intents.length === 0}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            >
              <option value="">
                {loadingIntents ? "Loading intents..." : "Select an intent"}
              </option>

              {intents.map((intent) => (
                <option key={intent.id} value={String(intent.id)}>
                  #{intent.id} — {intent.workload}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Cloud Provider
            </label>

            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setTopology(null);
                setError("");
              }}
              disabled={!selectedIntent}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
            >
              <option value="">Select provider</option>

              {selectedIntent?.providers?.map((cloud) => (
                <option key={cloud} value={cloud}>
                  {cloud}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Intent Summary */}
        {selectedIntent && (
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Workload</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedIntent.workload}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Region</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedIntent.region}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Budget</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">
                {selectedIntent.budget} {selectedIntent.currency || "INR"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Providers</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {selectedIntent.providers?.map((cloud) => (
                  <span
                    key={cloud}
                    className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700"
                  >
                    {cloud}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGenerateTopology}
            disabled={generating || !selectedIntent || !provider}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Generating Topology...
              </>
            ) : (
              <>
                <Network size={18} />
                Generate Network Topology
              </>
            )}
          </button>

          <button
            onClick={fetchIntents}
            disabled={loadingIntents}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingIntents ? "animate-spin" : ""}
            />
            Refresh Intents
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Refresh Success */}
        {refreshMessage && !loadingIntents && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            <CheckCircle2 size={18} />
            {refreshMessage}
          </div>
        )}

        {/* Empty Intents */}
        {!loadingIntents && !intentError && intents.length === 0 && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            No saved intents available. Create an infrastructure intent first.
          </div>
        )}
      </div>

      {/* Generated Topology */}
      {topology && (
        <div className="space-y-6">
          {/* Topology Summary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={22} />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Network Topology Generated
                  </h2>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  Simulated architecture for Intent #{topology.intent_id}
                </p>
              </div>

              <span
                className={`w-fit rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  providerColors[topology.provider] ||
                  "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {topology.provider}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Layers3 size={17} />
                  <span className="text-xs font-medium">Architecture</span>
                </div>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {topology.architecture_type}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Network size={17} />
                  <span className="text-xs font-medium">Network CIDR</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {topology.network_cidr}
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Cloud size={17} />
                  <span className="text-xs font-medium">Region</span>
                </div>
                <p className="mt-2 text-xl font-bold text-slate-900">
                  {topology.region}
                </p>
              </div>
            </div>
          </div>

          {/* Subnets */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Subnet Design
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Logical network segmentation generated for the selected workload.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {topology.subnets.map((subnet, index) => (
                <div
                  key={subnet.subnet_name}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <Network size={21} />
                    </div>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-semibold ${
                        subnetColors[subnet.subnet_type] ||
                        "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {subnet.subnet_type}
                    </span>
                  </div>

                  <h3 className="mt-3 font-semibold text-slate-900">
                    {subnet.subnet_name.replace(/_/g, " ")}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {subnet.tier} Tier
                  </p>

                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">CIDR Block</p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                      {subnet.cidr_block}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-semibold text-slate-500">Purpose</p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {subnet.purpose}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Connectivity Flow */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Network Connectivity Flow
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Logical communication flow between the planned network layers.
              </p>
            </div>

            <div className="flex flex-col items-center">
              {topology.connectivity_flow.map((flow, index) => (
                <div key={`${flow}-${index}`} className="w-full max-w-2xl">
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{flow}</p>
                  </div>

                  {index < topology.connectivity_flow.length - 1 && (
                    <div className="flex justify-center py-2 text-slate-300">
                      <ArrowDown size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Network Components */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Network Components
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Provider-specific networking components included in the design.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {topology.components.map((component, index) => {
                const Icon = getComponentIcon(component.component_type);

                return (
                  <div
                    key={`${component.component_name}-${index}`}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon size={21} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {component.component_name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {component.component_type}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-slate-600">
                      {component.purpose}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Design Rationale */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Design Rationale
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Why this network architecture was selected.
              </p>
            </div>

            <div className="space-y-3">
              {topology.design_rationale.map((reason, index) => (
                <div
                  key={`${reason}-${index}`}
                  className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"
                >
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />
                  <p className="text-sm leading-relaxed text-slate-700">
                    {reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 shrink-0 text-amber-600" size={19} />
              <div>
                <h3 className="text-sm font-semibold text-amber-800">
                  Simulation Disclaimer
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  {topology.disclaimer ||
                    "This topology is simulated. No real cloud infrastructure or network resources have been provisioned."}
                </p>
                <p className="mt-2 text-xs font-medium text-amber-700">
                  High availability subnet duplication is not yet implemented in this simulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkTopology;
