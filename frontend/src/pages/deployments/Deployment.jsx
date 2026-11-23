
import { useEffect, useState } from "react";
import {
  Cloud,
  Server,
  Database,
  Network,
  ShieldCheck,
  ArrowDown,
  IndianRupee,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
} from "lucide-react";

import { getSavedIntents } from "../../services/intentService";
import { prepareDeployment } from "../../services/deploymentService";

function Deployment() {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [provider, setProvider] = useState("AWS");
  const [deploymentData, setDeploymentData] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState("");

  // Load saved infrastructure intents
  useEffect(() => {
    const fetchIntents = async () => {
      try {
        setLoadingIntents(true);
        const data = await getSavedIntents();
        setIntents(data);
      } catch (err) {
        setError("Unable to load saved infrastructure intents.");
      } finally {
        setLoadingIntents(false);
      }
    };

    fetchIntents();
  }, []);

  // Prepare deployment configuration
  const handlePrepareDeployment = async () => {
    if (!selectedIntentId) {
      setError("Please select an infrastructure intent.");
      return;
    }

    try {
      setError("");
      setDeploymentData(null);
      setPreparing(true);

      const data = await prepareDeployment(
        selectedIntentId,
        provider
      );

      setDeploymentData(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to prepare deployment configuration."
      );
    } finally {
      setPreparing(false);
    }
  };

  // Currency formatting
  const formatCost = (amount, currency = "INR") => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  };

  // Resource icons
  const getResourceIcon = (resourceType) => {
    if (resourceType?.toLowerCase().includes("virtual machine")) {
      return Server;
    }

    if (resourceType?.toLowerCase().includes("storage")) {
      return Database;
    }

    if (resourceType?.toLowerCase().includes("network")) {
      return Network;
    }

    return ShieldCheck;
  };

  // Deployment order display names
  const getResourceLabel = (resourceName) => {
    const labels = {
      application_network: "Application Network",
      application_security: "Security Configuration",
      application_storage: "Application Storage",
      application_compute: "Application Compute",
    };

    return labels[resourceName] || resourceName.replaceAll("_", " ");
  };

  const resources = deploymentData?.resources || [];
  const deploymentOrder = deploymentData?.deployment_order || [];

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Deployment Management
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Prepare cloud deployment configurations from your
          infrastructure intents and orchestration plans.
        </p>
      </div>

      {/* Configuration Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Deployment Configuration
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select an infrastructure intent and cloud provider
          to generate a deployment-ready configuration.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* Intent Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Infrastructure Intent
            </label>

            <select
              value={selectedIntentId}
              onChange={(e) => {
                setSelectedIntentId(e.target.value);
                setDeploymentData(null);
                setError("");
              }}
              disabled={loadingIntents}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">
                {loadingIntents
                  ? "Loading intents..."
                  : "Select a saved intent"}
              </option>

              {intents.map((intent) => (
                <option key={intent.id} value={intent.id}>
                  #{intent.id} - {intent.workload} ({intent.users} users)
                </option>
              ))}
            </select>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cloud Provider
            </label>

            <select
              value={provider}
              onChange={(e) => {
                setProvider(e.target.value);
                setDeploymentData(null);
                setError("");
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="AWS">Amazon Web Services (AWS)</option>
              <option value="Azure">Microsoft Azure</option>
              <option value="GCP">Google Cloud Platform (GCP)</option>
            </select>
          </div>
        </div>

        {/* Prepare Button */}
        <button
          onClick={handlePrepareDeployment}
          disabled={
            !selectedIntentId ||
            preparing ||
            loadingIntents
          }
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {preparing ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Preparing Configuration...
            </>
          ) : (
            <>
              <ClipboardCheck className="h-4 w-4" />
              Prepare Deployment
            </>
          )}
        </button>

        {!loadingIntents && intents.length === 0 && (
          <p className="mt-3 text-sm text-amber-600">
            No saved intents found. Create an intent before preparing
            a deployment.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Preparing State */}
      {preparing && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 font-medium text-gray-800">
            Preparing your deployment configuration
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Generating resources and calculating estimated costs...
          </p>
        </div>
      )}

      {/* Deployment Results */}
      {deploymentData && (
        <div className="space-y-6">

          {/* Status Summary */}
          <div className="rounded-xl border border-green-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />

                  <span className="text-sm font-medium text-green-700">
                    Configuration Successfully Prepared
                  </span>
                </div>

                <h2 className="mt-2 text-2xl font-bold text-gray-900">
                  {deploymentData.provider}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {deploymentData.workload} · Intent #
                  {deploymentData.intent_id} · {deploymentData.region}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 px-5 py-3 text-center">
                <p className="text-xs font-medium text-green-700">
                  Deployment Status
                </p>

                <p className="mt-1 text-lg font-bold text-green-800">
                  {deploymentData.deployment_status}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            {/* Provider */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                <Cloud className="h-5 w-5 text-blue-600" />
              </div>

              <p className="mt-3 text-sm font-medium text-gray-500">
                Selected Provider
              </p>

              <h3 className="mt-1 text-xl font-bold text-gray-900">
                {deploymentData.provider}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {deploymentData.region}
              </p>
            </div>

            {/* Resources */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                <Server className="h-5 w-5 text-purple-600" />
              </div>

              <p className="mt-3 text-sm font-medium text-gray-500">
                Planned Resources
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {resources.length}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Infrastructure components
              </p>
            </div>

            {/* Cost */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50">
                <IndianRupee className="h-5 w-5 text-amber-600" />
              </div>

              <p className="mt-3 text-sm font-medium text-gray-500">
                Estimated Monthly Cost
              </p>

              <h3 className="mt-1 text-2xl font-bold text-gray-900">
                {formatCost(
                  deploymentData.estimated_monthly_cost,
                  deploymentData.currency
                )}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Simulated monthly estimate
              </p>
            </div>
          </div>

          {/* Resource Configurations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Resource Configuration
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Infrastructure components generated from the selected intent.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {resources.map((resource) => {
                const ResourceIcon = getResourceIcon(
                  resource.resource_type
                );

                return (
                  <div
                    key={resource.resource_name}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <ResourceIcon className="h-5 w-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {getResourceLabel(resource.resource_name)}
                        </h3>

                        <p className="mt-0.5 text-sm text-gray-500">
                          {resource.resource_type}
                        </p>
                      </div>
                    </div>

                    {/* Resource Metadata */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Provider
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {resource.provider}
                        </p>
                      </div>

                      <div className="rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-500">
                          Region
                        </p>

                        <p className="mt-1 text-sm font-semibold text-gray-800">
                          {resource.region}
                        </p>
                      </div>
                    </div>

                    {/* Resource Configuration */}
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-800">
                        Configuration Details
                      </h4>

                      <div className="mt-2 space-y-2">
                        {Object.entries(
                          resource.configuration || {}
                        ).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 text-sm"
                          >
                            <span className="text-gray-500">
                              {key.replaceAll("_", " ")}
                            </span>

                            <span className="text-right font-medium text-gray-800">
                              {typeof value === "boolean"
                                ? value
                                  ? "Enabled"
                                  : "Disabled"
                                : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Purpose */}
                    <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                      <p className="text-xs font-semibold text-blue-800">
                        Purpose
                      </p>

                      <p className="mt-1 text-sm leading-5 text-blue-700">
                        {resource.purpose}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deployment Order */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Deployment Sequence
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Resources are arranged in dependency order for deployment.
            </p>

            <div className="mt-5 space-y-2">
              {deploymentOrder.map((resourceName, index) => (
                <div key={`${resourceName}-${index}`}>
                  <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {index + 1}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {getResourceLabel(resourceName)}
                      </p>

                      <p className="text-xs text-gray-500">
                        {resourceName}
                      </p>
                    </div>
                  </div>

                  {index < deploymentOrder.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

              <div>
                <h3 className="text-sm font-semibold text-amber-800">
                  Simulation Mode
                </h3>

                <p className="mt-1 text-sm leading-6 text-amber-700">
                  {deploymentData.disclaimer}
                </p>

                <p className="mt-2 text-xs font-medium text-amber-800">
                  No real cloud resources have been created or modified.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}

export default Deployment;
