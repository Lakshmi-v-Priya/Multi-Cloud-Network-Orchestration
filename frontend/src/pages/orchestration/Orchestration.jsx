import { useEffect, useState } from "react";
import {
  Workflow,
  Server,
  Database,
  Network,
  ShieldCheck,
  ArrowDown,
  Cloud,
  IndianRupee,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Info,
  Cpu,
  HardDrive,
  ClipboardCheck,
  XCircle,
} from "lucide-react";

import { getSavedIntents } from "../../services/intentService";
import { getOrchestrationPlan } from "../../services/orchestrationService";
import { validateInfrastructurePlan } from "../../services/validationService";

const providerColors = {
  AWS: "border-orange-500/30 bg-orange-500/10 text-orange-400",
  Azure: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  GCP: "border-green-500/30 bg-green-500/10 text-green-400",
};

const resourceIcons = {
  "Virtual Machine": Server,
  "Block Storage": Database,
  "Virtual Network": Network,
  "Network Security Rules": ShieldCheck,
};

const Orchestration = () => {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [provider, setProvider] = useState("");
  const [plan, setPlan] = useState(null);

  // Validation state
  const [validationReport, setValidationReport] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [intentError, setIntentError] = useState("");

  // Fetch saved intents
  const fetchIntents = async () => {
    try {
      setLoadingIntents(true);
      setIntentError("");

      const data = await getSavedIntents();
      setIntents(data);

      if (data.length > 0) {
        setSelectedIntentId(String(data[0].id));
        setProvider(data[0].providers?.[0] || "");
      }
    } catch (err) {
      setIntentError(
        err.response?.data?.detail || "Failed to load saved intents."
      );
    } finally {
      setLoadingIntents(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  // Find currently selected intent
  const selectedIntent = intents.find(
    (intent) => String(intent.id) === selectedIntentId
  );

  // Handle intent selection
  const handleIntentChange = (intentId) => {
    setSelectedIntentId(intentId);
    setPlan(null);
    setValidationReport(null);
    setValidationError("");
    setError("");

    const selected = intents.find(
      (intent) => String(intent.id) === intentId
    );

    setProvider(selected?.providers?.[0] || "");
  };

  // Generate orchestration plan
  const handleGeneratePlan = async () => {
    if (!selectedIntentId || !provider) {
      setError("Please select an intent and cloud provider.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setPlan(null);
      setValidationReport(null);
      setValidationError("");

      const result = await getOrchestrationPlan(
        selectedIntentId,
        provider
      );

      setPlan(result);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to generate orchestration plan."
      );
    } finally {
      setGenerating(false);
    }
  };

  // Validate the generated infrastructure plan
  const handleValidatePlan = async () => {
    if (!selectedIntentId || !provider || !plan) {
      setValidationError("Generate an infrastructure plan first.");
      return;
    }

    try {
      setValidating(true);
      setValidationError("");
      setValidationReport(null);

      const result = await validateInfrastructurePlan(
        selectedIntentId,
        provider
      );

      setValidationReport(result);
    } catch (err) {
      setValidationError(
        err.response?.data?.detail ||
          "Failed to validate infrastructure plan."
      );
    } finally {
      setValidating(false);
    }
  };

  const formatCurrency = (amount, currency) => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency || "INR"} ${amount}`;
    }
  };

  // Validation status styling
  const getCheckStatusStyle = (status) => {
    switch (status) {
      case "PASS":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "WARNING":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "FAIL":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getCheckStatusIcon = (status) => {
    switch (status) {
      case "PASS":
        return CheckCircle2;
      case "WARNING":
        return AlertCircle;
      case "FAIL":
        return XCircle;
      default:
        return Info;
    }
  };

  const getOverallStatusStyle = (status) => {
    switch (status) {
      case "VALID":
        return "border-emerald-200 bg-emerald-50 text-emerald-800";
      case "VALID_WITH_WARNINGS":
        return "border-amber-200 bg-amber-50 text-amber-800";
      case "INVALID":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700";
    }
  };

  const getOverallStatusIcon = (status) => {
    switch (status) {
      case "VALID":
        return CheckCircle2;
      case "VALID_WITH_WARNINGS":
        return AlertCircle;
      case "INVALID":
        return XCircle;
      default:
        return Info;
    }
  };

  return (
    <div className="space-y-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Workflow className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900">
              Orchestration Planning
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Generate a structured infrastructure plan from your cloud requirements.
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
            Plan Configuration
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select a saved intent and the cloud provider for planning.
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
                {loadingIntents
                  ? "Loading intents..."
                  : "Select an intent"}
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
                setPlan(null);
                setValidationReport(null);
                setValidationError("");
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

        {/* Selected Intent Summary */}
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
                {formatCurrency(
                  selectedIntent.budget,
                  selectedIntent.currency
                )}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Selected Providers</p>
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

        {/* Generate Button */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleGeneratePlan}
            disabled={generating || !selectedIntent || !provider}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Workflow size={18} />
                Generate Orchestration Plan
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

        {/* Error Message */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* No Intents Message */}
        {!loadingIntents && !intentError && intents.length === 0 && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            No saved intents available. Create an infrastructure intent first.
          </div>
        )}
      </div>

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-6">
          {/* Plan Header */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={22} />
                  <h2 className="text-lg font-semibold text-slate-900">
                    Orchestration Plan Generated
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Infrastructure plan for {plan.workload}
                </p>
              </div>

              <span
                className={`w-fit rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                  providerColors[plan.selected_provider] ||
                  "border-slate-200 bg-slate-100 text-slate-600"
                }`}
              >
                {plan.selected_provider}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Resource Count */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Server size={17} />
                  <span className="text-xs font-medium">Planned Resources</span>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {plan.resources.length}
                </p>
              </div>

              {/* Provider */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Cloud size={17} />
                  <span className="text-xs font-medium">Cloud Provider</span>
                </div>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {plan.selected_provider}
                </p>
              </div>

              {/* Cost */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <IndianRupee size={17} />
                  <span className="text-xs font-medium">Estimated Monthly Cost</span>
                </div>

                <p className="mt-2 text-xl font-bold text-blue-700">
                  {formatCurrency(
                    plan.estimated_monthly_cost,
                    plan.currency
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Planned Infrastructure Resources
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Resource specifications and their intended purposes.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {plan.resources.map((resource, index) => {
                const Icon =
                  resourceIcons[resource.resource_type] || Server;

                return (
                  <div
                    key={resource.resource_name}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon size={21} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900">
                            {resource.resource_name
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (char) =>
                                char.toUpperCase()
                              )}
                          </h3>

                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                            #{index + 1}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {resource.resource_type}
                        </p>
                      </div>
                    </div>

                    {/* Resource Configuration */}
                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Configuration
                      </p>

                      <div className="space-y-2">
                        {Object.entries(resource.configuration).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-start justify-between gap-3 text-sm"
                            >
                              <span className="text-slate-500">
                                {key.replace(/_/g, " ")}
                              </span>

                              <span className="break-all text-right font-medium text-slate-800">
                                {String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {/* Resource Purpose */}
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-slate-500">
                        Purpose
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {resource.purpose}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Deployment Sequence */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">
                Deployment Sequence
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Recommended order for provisioning the planned infrastructure.
              </p>
            </div>

            <div className="flex flex-col items-stretch">
              {plan.deployment_order.map((step, index) => {
                const resource = plan.resources.find(
                  (item) => item.resource_name === step
                );

                const Icon = resource
                  ? resourceIcons[resource.resource_type] || Server
                  : Server;

                return (
                  <div key={step}>
                    <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {index + 1}
                      </div>

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                        <Icon size={20} />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">
                          {step
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (char) =>
                              char.toUpperCase()
                            )}
                        </p>

                        <p className="text-xs text-slate-500">
                          {resource?.resource_type || "Infrastructure Resource"}
                        </p>
                      </div>
                    </div>

                    {index < plan.deployment_order.length - 1 && (
                      <div className="flex justify-center py-2 text-slate-300">
                        <ArrowDown size={20} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validate Plan Action */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-indigo-900">
                  Infrastructure Plan Validation
                </h2>
                <p className="mt-1 text-sm text-indigo-700">
                  Check resource completeness, budget, security settings, and deployment dependencies.
                </p>
              </div>

              <button
                onClick={handleValidatePlan}
                disabled={validating || !plan}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <ClipboardCheck size={18} />
                    Validate Plan
                  </>
                )}
              </button>
            </div>

            {validationError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={18} />
                {validationError}
              </div>
            )}
          </div>

          {/* Validation Report */}
          {validationReport && (
            <div className="space-y-5">
              {/* Overall Status */}
              {(() => {
                const OverallIcon = getOverallStatusIcon(
                  validationReport.overall_status
                );

                return (
                  <div
                    className={`rounded-2xl border p-5 sm:p-6 ${getOverallStatusStyle(
                      validationReport.overall_status
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <OverallIcon size={24} className="mt-0.5 shrink-0" />

                      <div>
                        <h2 className="text-lg font-bold">
                          {validationReport.overall_status.replace(/_/g, " ")}
                        </h2>
                        <p className="mt-1 text-sm">
                          Validation completed for {validationReport.provider} infrastructure plan.
                        </p>
                      </div>
                    </div>

                    {/* Validation Summary */}
                    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-xl border border-emerald-200 bg-white/70 p-3">
                        <p className="text-2xl font-bold text-emerald-700">
                          {validationReport.passed_checks}
                        </p>
                        <p className="text-xs text-emerald-700">Passed</p>
                      </div>

                      <div className="rounded-xl border border-amber-200 bg-white/70 p-3">
                        <p className="text-2xl font-bold text-amber-700">
                          {validationReport.warning_checks}
                        </p>
                        <p className="text-xs text-amber-700">Warnings</p>
                      </div>

                      <div className="rounded-xl border border-red-200 bg-white/70 p-3">
                        <p className="text-2xl font-bold text-red-700">
                          {validationReport.failed_checks}
                        </p>
                        <p className="text-xs text-red-700">Failed</p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white/70 p-3">
                        <p className="text-2xl font-bold text-slate-800">
                          {validationReport.total_checks}
                        </p>
                        <p className="text-xs text-slate-600">Total Checks</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Individual Validation Checks */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Validation Details
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the result of every infrastructure validation check.
                  </p>
                </div>

                <div className="space-y-3">
                  {validationReport.checks.map((check, index) => {
                    const StatusIcon = getCheckStatusIcon(check.status);

                    return (
                      <div
                        key={`${check.check_name}-${index}`}
                        className={`rounded-xl border p-4 ${getCheckStatusStyle(
                          check.status
                        )}`}
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon
                            size={20}
                            className="mt-0.5 shrink-0"
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h3 className="font-semibold">
                                {check.check_name}
                              </h3>

                              <span className="rounded-full border border-current px-2 py-0.5 text-xs font-semibold">
                                {check.status}
                              </span>
                            </div>

                            <p className="mt-1 text-sm leading-relaxed">
                              {check.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Validation Disclaimer */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 shrink-0 text-amber-600" size={19} />
                  <div>
                    <h3 className="text-sm font-semibold text-amber-800">
                      Validation Simulation Disclaimer
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-amber-700">
                      {validationReport.disclaimer ||
                        "Validation is simulated. No actual cloud resources are deployed or modified."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Disclaimer */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 shrink-0 text-amber-600" size={19} />

              <div>
                <h3 className="text-sm font-semibold text-amber-800">
                  Simulation Disclaimer
                </h3>

                <p className="mt-1 text-sm leading-relaxed text-amber-700">
                  {plan.disclaimer ||
                    "This plan is simulated. No cloud resources have been provisioned."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orchestration;