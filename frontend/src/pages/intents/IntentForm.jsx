
import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";

import { validateIntent } from "../../services/intentService";

const initialFormData = {
  description: "",
  workload: "Web Application",
  users: 1000,
  cpu: 2,
  ram: 4,
  storage: 50,
  budget: 10000,
  currency: "INR",
  region: "ap-south-1",
  latency: "Low",
  availability: "High",
  providers: ["AWS", "Azure", "GCP"],
};

function IntentForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setApiError("");
    setSubmitted(null);
  };

  const handleProviderChange = (provider) => {
    setFormData((previous) => {
      const isSelected = previous.providers.includes(provider);

      return {
        ...previous,
        providers: isSelected
          ? previous.providers.filter((item) => item !== provider)
          : [...previous.providers, provider],
      };
    });

    setApiError("");
    setSubmitted(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setApiError("");
    setSubmitted(null);

    if (formData.description.trim().length < 20) {
      setApiError(
        "Please provide an intent description with at least 20 characters."
      );
      return;
    }

    if (formData.providers.length === 0) {
      setApiError("Please select at least one cloud provider.");
      return;
    }

    const payload = {
      ...formData,
      description: formData.description.trim(),
      users: Number(formData.users),
      cpu: Number(formData.cpu),
      ram: Number(formData.ram),
      storage: Number(formData.storage),
      budget: Number(formData.budget),
    };

    setLoading(true);

    try {
      const response = await validateIntent(payload);
setSubmitted(response);
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Unable to connect to the backend. Please try again.";

      setApiError(
        Array.isArray(message)
          ? message.map((item) => item.msg).join(", ")
          : message
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const labelClass =
    "mb-1.5 block text-sm font-medium text-slate-700";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Create Cloud Intent
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Describe your workload requirements and define your cloud
          infrastructure preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Natural language intent */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Intent Description
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Explain what you want your cloud infrastructure to do.
            </p>
          </div>

          <label htmlFor="description" className={labelClass}>
            Describe your workload
          </label>

          <textarea
            id="description"
            name="description"
            rows={5}
            value={formData.description}
            onChange={handleChange}
            placeholder="Example: I want to host an e-commerce application for 5,000 users. It should have high availability, low latency, 8 GB RAM, 4 CPU cores, and 200 GB storage. My monthly budget is ₹20,000."
            className={inputClass}
            minLength={20}
            maxLength={5000}
            required
          />

          <p className="mt-1 text-right text-xs text-slate-400">
            {formData.description.length}/5000 characters
          </p>
        </section>

        {/* Workload requirements */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Workload Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Specify the infrastructure resources required.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="workload" className={labelClass}>
                Workload Type
              </label>

              <select
                id="workload"
                name="workload"
                value={formData.workload}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Web Application</option>
                <option>Mobile Application</option>
                <option>Machine Learning</option>
                <option>Data Analytics</option>
                <option>Database</option>
                <option>Microservices</option>
                <option>Storage Workload</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="users" className={labelClass}>
                Expected Users
              </label>

              <input
                id="users"
                name="users"
                type="number"
                min="1"
                value={formData.users}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="cpu" className={labelClass}>
                CPU Cores
              </label>

              <input
                id="cpu"
                name="cpu"
                type="number"
                min="1"
                max="1024"
                value={formData.cpu}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="ram" className={labelClass}>
                RAM (GB)
              </label>

              <input
                id="ram"
                name="ram"
                type="number"
                min="1"
                max="16384"
                value={formData.ram}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="storage" className={labelClass}>
                Storage (GB)
              </label>

              <input
                id="storage"
                name="storage"
                type="number"
                min="1"
                max="10000000"
                value={formData.storage}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="region" className={labelClass}>
                Preferred Region
              </label>

              <select
                id="region"
                name="region"
                value={formData.region}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="ap-south-1">
                  Asia Pacific (Mumbai)
                </option>
                <option value="ap-south-2">
                  Asia Pacific (Hyderabad)
                </option>
                <option value="ap-southeast-1">
                  Asia Pacific (Singapore)
                </option>
                <option value="us-east-1">
                  US East (N. Virginia)
                </option>
                <option value="eu-west-1">
                  Europe (Ireland)
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* Performance and availability */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Performance Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Define your workload's performance and availability needs.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="latency" className={labelClass}>
                Latency Requirement
              </label>

              <select
                id="latency"
                name="latency"
                value={formData.latency}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Very Low</option>
                <option>Low</option>
                <option>Medium</option>
                <option>Flexible</option>
              </select>
            </div>

            <div>
              <label htmlFor="availability" className={labelClass}>
                Availability Requirement
              </label>

              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
                className={inputClass}
              >
                <option>Basic</option>
                <option>High</option>
                <option>Very High</option>
                <option>Mission Critical</option>
              </select>
            </div>
          </div>
        </section>

        {/* Budget and cloud providers */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Budget and Cloud Preferences
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Set your monthly budget and select the providers to compare.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="budget" className={labelClass}>
                Monthly Budget
              </label>

              <input
                id="budget"
                name="budget"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.budget}
                onChange={handleChange}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label htmlFor="currency" className={labelClass}>
                Currency
              </label>

              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <label className={labelClass}>
              Cloud Providers
            </label>

            <p className="mb-3 text-xs text-slate-500">
              Select one or more providers for the orchestration process.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {["AWS", "Azure", "GCP"].map((provider) => {
                const selected = formData.providers.includes(provider);

                return (
                  <label
                    key={provider}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleProviderChange(provider)}
                      className="h-4 w-4 accent-blue-600"
                    />

                    <span className="text-sm font-medium text-slate-800">
                      {provider}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>

        {/* API error */}
        {apiError && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p>{apiError}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Validate Intent
              </>
            )}
          </button>
        </div>
      </form>

      {/* Backend response */}
      {submitted && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />

            <h2 className="text-lg font-semibold text-green-800">
              Intent Validated Successfully
            </h2>
          </div>

          <p className="mt-2 text-sm text-green-700">
            {submitted.message}
          </p>

          <div className="mt-4 rounded-lg border border-green-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Validation Status
            </p>

            <p className="mt-1 text-sm font-semibold text-green-700">
              {submitted.validation_status}
            </p>

            <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Submitted Intent
            </p>

            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-6 text-green-300">
              {JSON.stringify(submitted.intent, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}

export default IntentForm;
