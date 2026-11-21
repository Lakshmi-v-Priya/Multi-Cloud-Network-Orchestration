import { useEffect, useState } from "react";
import { getSavedIntents } from "../../services/intentService";
import { LoaderCircle, RefreshCw } from "lucide-react";

const IntentList = () => {
  const [intents, setIntents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchIntents = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getSavedIntents();
      setIntents(data);
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to fetch saved intents."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Saved Intents</h1>
          <p className="text-gray-400 mt-1">
            View and manage your previously submitted cloud requirements.
          </p>
        </div>

        <button
          onClick={fetchIntents}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-20 text-gray-400">
          <LoaderCircle className="animate-spin mr-2" size={20} />
          Loading saved intents...
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && intents.length === 0 && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">
          <h2 className="text-lg font-semibold text-white">
            No intents saved yet
          </h2>
          <p className="text-gray-400 mt-2">
            Submit your first cloud requirement to see it here.
          </p>
        </div>
      )}

      {/* Intents Table */}
      {!loading && !error && intents.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-gray-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Workload</th>
                <th className="px-4 py-3">Region</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Providers</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {intents.map((intent) => (
                <tr key={intent.id} className="hover:bg-gray-900/60">
                  <td className="px-4 py-3 text-gray-400">
                    #{intent.id}
                  </td>

                  <td className="px-4 py-3 text-white font-medium">
                    {intent.workload}
                  </td>

                  <td className="px-4 py-3 text-gray-300">
                    {intent.region}
                  </td>

                  <td className="px-4 py-3 text-gray-300">
                    {intent.users.toLocaleString()}
                  </td>

                  <td className="px-4 py-3 text-gray-300">
                    {intent.currency} {intent.budget.toLocaleString()}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {intent.providers.map((provider) => (
                        <span
                          key={provider}
                          className="px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-400"
                        >
                          {provider}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                    {new Date(intent.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default IntentList;