import { useEffect, useState } from "react";
import { getSavedIntents } from "../../services/intentService";
import { getCloudComparison } from "../../services/comparisonService";

function Comparison() {
  const [intents, setIntents] = useState([]);
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [comparison, setComparison] = useState(null);

  const [loadingIntents, setLoadingIntents] = useState(true);
  const [loadingComparison, setLoadingComparison] = useState(false);

  const [error, setError] = useState("");

  // Fetch saved intents when the page loads
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

  // Compare the selected intent across cloud providers
  const handleCompare = async () => {
    if (!selectedIntentId) {
      setError("Please select an intent first.");
      return;
    }

    try {
      setError("");
      setComparison(null);
      setLoadingComparison(true);

      const data = await getCloudComparison(selectedIntentId);
      setComparison(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to compare cloud providers."
      );
    } finally {
      setLoadingComparison(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Multi-Cloud Comparison
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare infrastructure configurations across AWS, Azure, and Google Cloud.
        </p>
      </div>

      {/* Intent Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800">
          Select Infrastructure Intent
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose a previously saved intent to compare its infrastructure
          requirements across cloud providers.
        </p>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row">
          <select
            value={selectedIntentId}
            onChange={(e) => {
              setSelectedIntentId(e.target.value);
              setComparison(null);
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
                #{intent.id} — {intent.workload} ({intent.users} users)
              </option>
            ))}
          </select>

          <button
            onClick={handleCompare}
            disabled={!selectedIntentId || loadingComparison || loadingIntents}
            className="whitespace-nowrap rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loadingComparison ? "Comparing..." : "Compare Clouds"}
          </button>
        </div>

        {!loadingIntents && intents.length === 0 && (
          <p className="mt-3 text-sm text-amber-600">
            No saved intents found. Create an intent first.
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading */}
      {loadingComparison && (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-gray-600">
            Comparing AWS, Azure, and GCP configurations...
          </p>
        </div>
      )}

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Comparison Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Intent #{comparison.intent_id} · {comparison.workload}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {comparison.comparison_results.map((cloud) => (
              <div
                key={cloud.provider}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-bold text-gray-900">
                  {cloud.provider}
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Instance</span>
                    <span className="text-right font-medium text-gray-800">
                      {cloud.instance_type}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">vCPU</span>
                    <span className="font-medium text-gray-800">
                      {cloud.vcpu}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">RAM</span>
                    <span className="font-medium text-gray-800">
                      {cloud.ram_gb} GB
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Storage</span>
                    <span className="font-medium text-gray-800">
                      {cloud.storage_type}
                    </span>
                  </div>

                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Monthly Cost</span>
                    <span className="font-medium text-gray-800">
                      {cloud.estimated_monthly_cost == null
                        ? "Not available yet"
                        : `${cloud.currency} ${cloud.estimated_monthly_cost.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs leading-5 text-gray-600">
                    {cloud.notes}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Comparison;