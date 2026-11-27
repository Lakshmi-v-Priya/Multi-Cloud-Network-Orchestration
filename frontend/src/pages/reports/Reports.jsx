
import { useEffect, useMemo, useState } from "react";
import {
  getSavedIntents,
} from "../../services/intentService";
import {
  getCostAnalysis,
} from "../../services/costAnalysisService";
import {
  getOptimization,
} from "../../services/optimizationService";

const currencyFormat = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency} ${Number(amount || 0).toFixed(2)}`;
  }
};

const StatCard = ({ title, value, subtitle, color = "blue" }) => {
  const colors = {
    blue: "border-blue-500/20 bg-blue-500/5",
    green: "border-emerald-500/20 bg-emerald-500/5",
    purple: "border-purple-500/20 bg-purple-500/5",
    orange: "border-orange-500/20 bg-orange-500/5",
  };

  return (
    <div className={`rounded-xl border ${colors[color]} p-5`}>
      <p className="text-sm text-gray-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-white">{value}</h3>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  );
};

function Reports() {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [costData, setCostData] = useState(null);
  const [optimizationData, setOptimizationData] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [loadingReports, setLoadingReports] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadIntents = async () => {
      try {
        setError("");
        const data = await getSavedIntents();
        setIntents(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(
          err.response?.data?.detail || "Unable to load saved intents."
        );
      } finally {
        setLoadingIntents(false);
      }
    };

    loadIntents();
  }, []);

  const selectedIntent = intents.find(
    (intent) => String(intent.id) === String(selectedIntentId)
  );

  const loadReports = async () => {
    if (!selectedIntentId) {
      setError("Please select an infrastructure intent.");
      return;
    }

    setLoadingReports(true);
    setError("");
    setCostData(null);
    setOptimizationData(null);

    try {
      const [costResult, optimizationResult] = await Promise.allSettled([
        getCostAnalysis(selectedIntentId),
        getOptimization(selectedIntentId),
      ]);

      if (costResult.status === "fulfilled") {
        setCostData(costResult.value);
      }

      if (optimizationResult.status === "fulfilled") {
        setOptimizationData(optimizationResult.value);
      }

      if (
        costResult.status === "rejected" &&
        optimizationResult.status === "rejected"
      ) {
        throw new Error("Both cost analysis and optimization requests failed.");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Unable to generate reports."
      );
    } finally {
      setLoadingReports(false);
    }
  };

  const estimates = costData?.cost_estimates || [];
  const candidates = optimizationData?.candidates || [];
  const currency = estimates[0]?.currency || candidates[0]?.currency || "INR";

  const cheapestProvider = useMemo(() => {
    if (!estimates.length) return null;

    return estimates.reduce((lowest, current) =>
      Number(current.total_monthly_cost) <
      Number(lowest.total_monthly_cost)
        ? current
        : lowest
    );
  }, [estimates]);

  const recommendedCandidate = candidates.find(
    (candidate) => candidate.recommendation === "Recommended"
  );

  const totalProviderCost = estimates.reduce(
    (sum, provider) => sum + Number(provider.total_monthly_cost || 0),
    0
  );

  const averageProviderCost = estimates.length
    ? totalProviderCost / estimates.length
    : 0;

  const exportCSV = () => {
    if (!selectedIntent) {
      setError("Select an intent before exporting.");
      return;
    }

    const rows = [
      ["Multi-Cloud Orchestration Report"],
      ["Intent ID", selectedIntent.id],
      ["Workload", selectedIntent.workload || ""],
      ["Region", selectedIntent.region || ""],
      ["Users", selectedIntent.users ?? ""],
      ["Budget", selectedIntent.budget ?? ""],
      ["Currency", currency],
      [],
      ["COST ANALYSIS"],
      [
        "Provider",
        "Compute Cost",
        "Storage Cost",
        "Network Cost",
        "Total Monthly Cost",
      ],
      ...estimates.map((item) => [
        item.provider,
        item.compute_cost,
        item.storage_cost,
        item.network_cost,
        item.total_monthly_cost,
      ]),
      [],
      ["OPTIMIZATION ANALYSIS"],
      [
        "Provider",
        "Recommendation",
        "Optimization Score",
        "Estimated Monthly Cost",
        "Budget",
        "Cost Rank",
        "Within Budget",
      ],
      ...candidates.map((item) => [
        item.provider,
        item.recommendation,
        item.optimization_score,
        item.estimated_monthly_cost,
        item.budget,
        item.cost_rank,
        item.within_budget,
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `multi-cloud-report-${selectedIntent.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const maxCost = Math.max(
    ...estimates.map((item) => Number(item.total_monthly_cost || 0)),
    1
  );

  return (
    <div className="min-h-screen space-y-6 bg-gray-950 p-6 text-white">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="mt-1 text-sm text-gray-400">
            Infrastructure insights, cost reports and optimization summaries
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={!selectedIntent || (!costData && !optimizationData)}
          className="rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 text-sm font-medium transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Saved Intents"
          value={loadingIntents ? "..." : intents.length}
          subtitle="Total infrastructure requirements"
          color="blue"
        />
        <StatCard
          title="Providers Analyzed"
          value={estimates.length || candidates.length || "—"}
          subtitle="For the selected intent"
          color="purple"
        />
        <StatCard
          title="Lowest Estimated Cost"
          value={
            cheapestProvider
              ? currencyFormat(cheapestProvider.total_monthly_cost, currency)
              : "—"
          }
          subtitle={cheapestProvider?.provider || "Run cost analysis"}
          color="green"
        />
        <StatCard
          title="Recommended Provider"
          value={recommendedCandidate?.provider || "—"}
          subtitle={
            recommendedCandidate
              ? `Score: ${recommendedCandidate.optimization_score ?? "N/A"}`
              : "Run optimization"
          }
          color="orange"
        />
      </div>

      {/* Intent selection */}
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-semibold">Generate Infrastructure Report</h2>
        <p className="mt-1 text-sm text-gray-400">
          Select a saved intent to retrieve its cost and optimization results.
        </p>

        <div className="mt-4 flex flex-col gap-3 md:flex-row">
          <select
            value={selectedIntentId}
            onChange={(e) => {
              setSelectedIntentId(e.target.value);
              setCostData(null);
              setOptimizationData(null);
              setError("");
            }}
            disabled={loadingIntents}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
          >
            <option value="">
              {loadingIntents
                ? "Loading intents..."
                : "Select an infrastructure intent"}
            </option>
            {intents.map((intent) => (
              <option key={intent.id} value={intent.id}>
                {intent.workload || "Unnamed workload"} — {intent.region || "Unknown region"} (ID: {intent.id})
              </option>
            ))}
          </select>

          <button
            onClick={loadReports}
            disabled={!selectedIntentId || loadingReports || loadingIntents}
            className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingReports ? "Generating Report..." : "Generate Report"}
          </button>
        </div>

        {selectedIntent && (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-gray-950 p-4 text-sm md:grid-cols-4">
            <div>
              <p className="text-gray-500">Workload</p>
              <p className="mt-1 font-medium">{selectedIntent.workload || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Region</p>
              <p className="mt-1 font-medium">{selectedIntent.region || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Users</p>
              <p className="mt-1 font-medium">{selectedIntent.users ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Budget</p>
              <p className="mt-1 font-medium">
                {selectedIntent.budget != null
                  ? currencyFormat(selectedIntent.budget, selectedIntent.currency || currency)
                  : "—"}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {!costData && !optimizationData && !loadingReports && (
        <div className="rounded-xl border border-dashed border-gray-800 bg-gray-900/50 p-12 text-center">
          <h3 className="font-semibold text-gray-300">No report generated yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            Choose an intent above and click Generate Report to view analytics.
          </p>
        </div>
      )}

      {loadingReports && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
          <p className="mt-4 text-sm text-gray-400">
            Fetching cost and optimization results...
          </p>
        </div>
      )}

      {/* Cost analysis */}
      {estimates.length > 0 && !loadingReports && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-5 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Provider Cost Report</h2>
              <p className="text-sm text-gray-400">
                Estimated monthly cost breakdown
              </p>
            </div>
            <span className="text-xs text-gray-500">
              Estimates · Not actual cloud billing
            </span>
          </div>

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Lowest Cost Provider</p>
              <p className="mt-2 font-semibold text-emerald-400">
                {cheapestProvider?.provider || "—"}
              </p>
              <p className="mt-1 text-sm text-gray-300">
                {cheapestProvider
                  ? currencyFormat(cheapestProvider.total_monthly_cost, currency)
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Average Provider Estimate</p>
              <p className="mt-2 text-xl font-semibold">
                {currencyFormat(averageProviderCost, currency)}
              </p>
            </div>
            <div className="rounded-lg bg-gray-950 p-4">
              <p className="text-xs text-gray-500">Providers Compared</p>
              <p className="mt-2 text-xl font-semibold">{estimates.length}</p>
            </div>
          </div>

          <div className="space-y-5">
            {estimates.map((provider, index) => {
              const total = Number(provider.total_monthly_cost || 0);
              const percentage = (total / maxCost) * 100;
              const isCheapest = provider.provider === cheapestProvider?.provider;

              return (
                <div key={`${provider.provider}-${index}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{provider.provider}</span>
                      {isCheapest && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                          Lowest estimate
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-semibold">
                      {currencyFormat(total, currency)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-gray-800">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <span>Compute: {currencyFormat(provider.compute_cost, currency)}</span>
                    <span>Storage: {currencyFormat(provider.storage_cost, currency)}</span>
                    <span>Network: {currencyFormat(provider.network_cost, currency)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Optimization analysis */}
      {candidates.length > 0 && !loadingReports && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Optimization Report</h2>
            <p className="text-sm text-gray-400">
              Provider ranking and recommendation scores
            </p>
          </div>

          {recommendedCandidate && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-xs text-emerald-400">Recommended Provider</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">
                    {recommendedCandidate.provider}
                  </h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Optimization Score: {recommendedCandidate.optimization_score ?? "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Estimated monthly cost</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currencyFormat(recommendedCandidate.estimated_monthly_cost, currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-gray-800 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-3">Rank</th>
                  <th className="px-3 py-3">Provider</th>
                  <th className="px-3 py-3">Score</th>
                  <th className="px-3 py-3">Monthly Estimate</th>
                  <th className="px-3 py-3">Budget</th>
                  <th className="px-3 py-3">Budget Status</th>
                </tr>
              </thead>
              <tbody>
                {[...candidates]
                  .sort(
                    (a, b) =>
                      Number(b.optimization_score || 0) -
                      Number(a.optimization_score || 0)
                  )
                  .map((candidate, index) => (
                    <tr
                      key={`${candidate.provider}-${index}`}
                      className="border-b border-gray-800/70"
                    >
                      <td className="px-3 py-3">{candidate.cost_rank ?? index + 1}</td>
                      <td className="px-3 py-3 font-medium">
                        {candidate.provider}
                        {candidate.recommendation === "Recommended" && (
                          <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-400">
                            Recommended
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {candidate.optimization_score ?? "—"}
                      </td>
                      <td className="px-3 py-3">
                        {currencyFormat(candidate.estimated_monthly_cost, currency)}
                      </td>
                      <td className="px-3 py-3">
                        {candidate.budget != null
                          ? currencyFormat(candidate.budget, currency)
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        {candidate.within_budget === true ? (
                          <span className="text-emerald-400">Within budget</span>
                        ) : candidate.within_budget === false ? (
                          <span className="text-red-400">Over budget</span>
                        ) : (
                          <span className="text-gray-500">Unknown</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data transparency */}
      {(costData || optimizationData) && !loadingReports && (
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <h3 className="text-sm font-semibold text-gray-300">Report Notes</h3>
          <ul className="mt-2 space-y-1 text-xs text-gray-500">
            <li>• Cost values are estimates returned by the backend, not actual cloud billing.</li>
            <li>• Optimization scores and recommendations are based on the project's optimization logic.</li>
            <li>• Results represent the selected intent only.</li>
            <li>• Real cloud usage, billing, deployment history and telemetry are not presented unless connected and available.</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default Reports;
