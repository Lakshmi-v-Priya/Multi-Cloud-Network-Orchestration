import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { getSavedIntents } from "../../services/intentService";
import { getCostAnalysis } from "../../services/costAnalysisService";

function CostAnalysis() {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [costData, setCostData] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [loadingCosts, setLoadingCosts] = useState(false);
  const [error, setError] = useState("");

  // Load saved intents
  useEffect(() => {
    const fetchIntents = async () => {
      try {
        setLoadingIntents(true);
        const data = await getSavedIntents();
        setIntents(data);
      } catch (err) {
        setError("Unable to load saved intents.");
      } finally {
        setLoadingIntents(false);
      }
    };

    fetchIntents();
  }, []);

  // Fetch cost analysis for selected intent
  const handleAnalyze = async () => {
    if (!selectedIntentId) {
      setError("Please select an infrastructure intent first.");
      return;
    }

    try {
      setError("");
      setCostData(null);
      setLoadingCosts(true);

      const data = await getCostAnalysis(selectedIntentId);
      setCostData(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to calculate cloud costs."
      );
    } finally {
      setLoadingCosts(false);
    }
  };

  const estimates = costData?.cost_estimates || [];

  const currency = estimates[0]?.currency || "INR";

  const formatCost = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalAcrossProviders = estimates.reduce(
    (sum, cloud) => sum + cloud.total_monthly_cost,
    0
  );

  const lowestCostCloud =
    estimates.length > 0
      ? estimates.reduce((lowest, cloud) =>
          cloud.total_monthly_cost < lowest.total_monthly_cost
            ? cloud
            : lowest
        )
      : null;

  const chartData = estimates.map((cloud) => ({
    provider: cloud.provider,
    Compute: cloud.compute_cost,
    Storage: cloud.storage_cost,
    Network: cloud.network_cost,
    Total: cloud.total_monthly_cost,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Cost Analysis
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyze and compare estimated monthly infrastructure costs across AWS,
          Azure, and Google Cloud.
        </p>
      </div>

      {/* Intent Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Select Infrastructure Intent
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose a saved intent to calculate its estimated cloud infrastructure
          costs.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          <select
            value={selectedIntentId}
            onChange={(e) => {
              setSelectedIntentId(e.target.value);
              setCostData(null);
              setError("");
            }}
            disabled={loadingIntents}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">
              {loadingIntents
                ? "Loading saved intents..."
                : "Select a saved intent"}
            </option>

            {intents.map((intent) => (
              <option key={intent.id} value={intent.id}>
                #{intent.id} - {intent.workload} ({intent.users} users)
              </option>
            ))}
          </select>

          <button
            onClick={handleAnalyze}
            disabled={!selectedIntentId || loadingCosts || loadingIntents}
            className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingCosts ? "Analyzing..." : "Analyze Costs"}
          </button>
        </div>

        {!loadingIntents && intents.length === 0 && (
          <p className="mt-3 text-sm text-amber-600">
            No saved intents found. Create an intent first.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loadingCosts && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-600">
            Calculating estimated costs for AWS, Azure, and GCP...
          </p>
        </div>
      )}

      {/* Cost Results */}
      {costData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total Cost Across Providers */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Combined Estimate
              </p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {formatCost(totalAcrossProviders)}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Sum of all provider estimates
              </p>
            </div>

            {/* Lowest Cost Provider */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Lowest Estimate
              </p>
              <h3 className="mt-2 text-2xl font-bold text-green-700">
                {lowestCostCloud?.provider || "—"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {lowestCostCloud
                  ? formatCost(lowestCostCloud.total_monthly_cost) + " / month"
                  : "No data"}
              </p>
            </div>

            {/* Intent */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Analyzed Workload
              </p>
              <h3 className="mt-2 text-xl font-bold text-gray-900">
                {costData.workload}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Intent #{costData.intent_id} · {costData.region}
              </p>
            </div>
          </div>

          {/* Provider Cost Cards */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Provider Cost Breakdown
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Estimated monthly costs for each cloud provider.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {estimates.map((cloud) => {
                const isLowest =
                  lowestCostCloud?.provider === cloud.provider;

                return (
                  <div
                    key={cloud.provider}
                    className={`rounded-xl border bg-white p-5 shadow-sm ${
                      isLowest
                        ? "border-green-300 ring-1 ring-green-100"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-gray-900">
                        {cloud.provider}
                      </h3>

                      {isLowest && (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Lowest
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-2xl font-bold text-gray-900">
                      {formatCost(cloud.total_monthly_cost)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Estimated per month
                    </p>

                    <div className="mt-5 space-y-3 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Compute</span>
                        <span className="font-medium text-gray-800">
                          {formatCost(cloud.compute_cost)}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Storage</span>
                        <span className="font-medium text-gray-800">
                          {formatCost(cloud.storage_cost)}
                        </span>
                      </div>

                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-500">Network</span>
                        <span className="font-medium text-gray-800">
                          {formatCost(cloud.network_cost)}
                        </span>
                      </div>

                      <div className="flex justify-between pt-1">
                        <span className="font-semibold text-gray-700">
                          Total
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatCost(cloud.total_monthly_cost)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs leading-5 text-gray-600">
                        {cloud.notes}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cost Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Cost Comparison
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Compute, storage, and network estimates by provider.
            </p>

            <div className="mt-6 h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCost(value)}
                  />
                  <Bar dataKey="Compute" stackId="cost" fill="#2563eb" />
                  <Bar dataKey="Storage" stackId="cost" fill="#14b8a6" />
                  <Bar dataKey="Network" stackId="cost" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-blue-600" />
                Compute
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-teal-500" />
                Storage
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-amber-500" />
                Network
              </span>
            </div>
          </div>

          {/* Pricing Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-800">
              Demo Pricing Disclaimer
            </h3>
            <p className="mt-1 text-sm leading-6 text-amber-700">
              These values use illustrative demo rates and assumed monthly usage.
              They are not official AWS, Azure, or Google Cloud prices. Actual
              costs may vary by region, instance type, discounts, usage, and
              network traffic.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CostAnalysis;