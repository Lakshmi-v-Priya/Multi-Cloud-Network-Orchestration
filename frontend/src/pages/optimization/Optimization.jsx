import { useEffect, useState } from "react";
import {
  getSavedIntents,
} from "../../services/intentService";
import {
  getOptimization,
} from "../../services/optimizationService";

function Optimization() {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [optimizationData, setOptimizationData] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [loadingOptimization, setLoadingOptimization] = useState(false);
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

  // Run optimization for selected intent
  const handleOptimize = async () => {
    if (!selectedIntentId) {
      setError("Please select an infrastructure intent first.");
      return;
    }

    try {
      setError("");
      setOptimizationData(null);
      setLoadingOptimization(true);

      const data = await getOptimization(selectedIntentId);
      setOptimizationData(data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Failed to run cloud optimization."
      );
    } finally {
      setLoadingOptimization(false);
    }
  };

  const candidates = optimizationData?.candidates || [];

  const currency = candidates[0]?.currency || "INR";

  const formatCost = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const sortedCandidates = [...candidates].sort(
    (a, b) => b.optimization_score - a.optimization_score
  );

  const recommendedCandidate = candidates.find(
    (candidate) => candidate.recommendation === "Recommended"
  );

  const getRecommendationStyle = (recommendation) => {
    switch (recommendation) {
      case "Recommended":
        return "bg-green-100 text-green-700 border-green-200";
      case "Alternative":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Over Budget":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-700";
    if (score >= 70) return "text-blue-700";
    if (score >= 50) return "text-amber-700";
    return "text-red-700";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Cloud Optimization
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Evaluate cloud providers using weighted cost, budget,
          latency and availability criteria to identify the most
          suitable infrastructure option.
        </p>
      </div>

      {/* Intent Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Select Infrastructure Intent
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select a saved infrastructure intent to rank cloud providers
          using the optimization engine.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          <select
            value={selectedIntentId}
            onChange={(e) => {
              setSelectedIntentId(e.target.value);
              setOptimizationData(null);
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
            onClick={handleOptimize}
            disabled={
              !selectedIntentId ||
              loadingOptimization ||
              loadingIntents
            }
            className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingOptimization
              ? "Optimizing..."
              : "Run Optimization"}
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
      {loadingOptimization && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-600">
            Evaluating cloud providers and ranking configurations...
          </p>
        </div>
      )}

      {/* Optimization Results */}
      {optimizationData && (
        <div className="space-y-6">
          {/* Recommendation Summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Recommended Cloud Provider
                </p>

                <h2 className="mt-2 text-3xl font-bold text-green-700">
                  {optimizationData.recommended_provider ||
                    "No Suitable Provider"}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  {optimizationData.recommendation_reason}
                </p>
              </div>

              {recommendedCandidate && (
                <div className="rounded-xl bg-green-50 p-5 text-center">
                  <p className="text-sm font-medium text-green-700">
                    Optimization Score
                  </p>
                  <p className="mt-1 text-4xl font-bold text-green-800">
                    {recommendedCandidate.optimization_score}
                    <span className="text-xl">/100</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Recommended Cost */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Recommended Monthly Cost
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {recommendedCandidate
                  ? formatCost(
                      recommendedCandidate.estimated_monthly_cost
                    )
                  : "N/A"}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                {recommendedCandidate
                  ? "Estimated cost for selected provider"
                  : "No provider meets the budget"}
              </p>
            </div>

            {/* Budget */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Monthly Budget
              </p>

              <h3 className="mt-2 text-2xl font-bold text-gray-900">
                {candidates.length > 0
                  ? formatCost(candidates[0].budget)
                  : "N/A"}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                User-defined budget limit
              </p>
            </div>

            {/* Workload */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Analyzed Workload
              </p>

              <h3 className="mt-2 text-xl font-bold text-gray-900">
                {optimizationData.workload}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Intent #{optimizationData.intent_id} ·{" "}
                {optimizationData.region}
              </p>
            </div>
          </div>

          {/* Provider Rankings */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Cloud Provider Rankings
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Providers are ranked using a weighted score based on
              cost efficiency, budget compliance, latency suitability
              and availability suitability.
            </p>

            <div className="mt-4 space-y-4">
              {sortedCandidates.map((candidate, index) => (
                <div
                  key={candidate.provider}
                  className={`rounded-xl border bg-white p-5 shadow-sm ${
                    candidate.recommendation === "Recommended"
                      ? "border-green-300 ring-1 ring-green-100"
                      : "border-gray-200"
                  }`}
                >
                  {/* Candidate Header */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-700">
                        #{index + 1}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {candidate.provider}
                        </h3>

                        <p className="text-sm text-gray-500">
                          {candidate.instance_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getRecommendationStyle(
                          candidate.recommendation
                        )}`}
                      >
                        {candidate.recommendation}
                      </span>

                      <span
                        className={`rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold ${getScoreColor(
                          candidate.optimization_score
                        )}`}
                      >
                        Score: {candidate.optimization_score}/100
                      </span>
                    </div>
                  </div>

                  {/* Candidate Details */}
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Estimated Monthly Cost
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {formatCost(
                          candidate.estimated_monthly_cost
                        )}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Cost Rank
                      </p>

                      <p className="mt-1 text-lg font-bold text-gray-900">
                        #{candidate.cost_rank}
                      </p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-medium text-gray-500">
                        Budget Status
                      </p>

                      <p
                        className={`mt-1 text-lg font-bold ${
                          candidate.within_budget
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {candidate.within_budget
                          ? "Within Budget"
                          : "Over Budget"}
                      </p>
                    </div>
                  </div>

                  {/* Score Bar */}
                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs text-gray-500">
                      <span>Optimization Score</span>
                      <span>{candidate.optimization_score}%</span>
                    </div>

                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          candidate.within_budget
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                        style={{
                          width: `${candidate.optimization_score}%`,
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Multi-Objective Score Breakdown */}
                  <div className="mt-5 rounded-lg border border-gray-200 p-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Multi-Objective Score Breakdown
                    </h4>

                    <div className="mt-4 space-y-4">
                      {[
                        {
                          label: "Cost Efficiency",
                          score: candidate.cost_score,
                          max: 35,
                        },
                        {
                          label: "Budget Compliance",
                          score: candidate.budget_score,
                          max: 25,
                        },
                        {
                          label: "Latency Suitability",
                          score: candidate.latency_score,
                          max: 20,
                        },
                        {
                          label: "Availability Suitability",
                          score: candidate.availability_score,
                          max: 20,
                        },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="font-medium text-gray-700">
                              {item.label}
                            </span>

                            <span className="text-gray-500">
                              {item.score} / {item.max}
                            </span>
                          </div>

                          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{
                                width: `${(item.score / item.max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-gray-100 pt-3">
                      <div className="flex justify-between text-sm font-semibold text-gray-800">
                        <span>Total Weighted Score</span>
                        <span>
                          {candidate.optimization_score} / 100
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="mt-5 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Evaluation Details
                    </h4>

                    <ul className="mt-2 space-y-2">
                      {candidate.reasons.map((reason, reasonIndex) => (
                        <li
                          key={reasonIndex}
                          className="flex gap-2 text-sm leading-5 text-gray-600"
                        >
                          <span className="text-blue-600">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Strategy */}
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-sm font-semibold text-blue-900">
              Optimization Strategy
            </h3>

            <p className="mt-1 text-sm leading-6 text-blue-800">
              {optimizationData.optimization_strategy}
            </p>
          </div>

          {/* Simulation Disclaimer */}
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-800">
              Simulation Disclaimer
            </h3>

            <p className="mt-1 text-sm leading-6 text-amber-700">
              {optimizationData.disclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Optimization;