
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Cpu,
  HardDrive,
  Network,
  Wallet,
  CheckCircle2,
  Info,
  Server,
  RotateCcw,
  Cloud,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

function IntentForm() {
  const navigate = useNavigate()

  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(null)

  const [formData, setFormData] = useState({
    workload: 'Web Application',
    users: '10000',
    cpu: '4',
    ram: '8',
    storage: '200',
    budget: '15000',
    currency: 'INR',
    region: 'Asia Pacific',
    latency: 'Low',
    availability: 'High',
    providers: ['AWS', 'Azure', 'GCP'],
  })

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const toggleProvider = (provider) => {
    setFormData((previous) => ({
      ...previous,
      providers: previous.providers.includes(provider)
        ? previous.providers.filter((item) => item !== provider)
        : [...previous.providers, provider],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!description.trim()) {
      return
    }

    if (formData.providers.length === 0) {
      alert('Please select at least one cloud provider.')
      return
    }

    setSubmitted({
      description,
      ...formData,
    })
  }

  const resetForm = () => {
    setDescription('')
    setSubmitted(null)

    setFormData({
      workload: 'Web Application',
      users: '10000',
      cpu: '4',
      ram: '8',
      storage: '200',
      budget: '15000',
      currency: 'INR',
      region: 'Asia Pacific',
      latency: 'Low',
      availability: 'High',
      providers: ['AWS', 'Azure', 'GCP'],
    })
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">

      {/* HEADER */}

      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-5 flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={17} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <BrainCircuit size={25} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Create Infrastructure Intent
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Describe your infrastructure requirements in natural language.
            </p>
          </div>
        </div>
      </div>

      {/* INFORMATION */}

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <Info size={20} className="mt-0.5 shrink-0 text-blue-600" />

        <p className="text-sm leading-6 text-blue-800">
          Provide your application requirements below. The system will
          prepare them for structured intent extraction and multi-cloud
          analysis.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* NATURAL LANGUAGE INPUT */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <BrainCircuit size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Natural Language Requirements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Explain what you want to deploy.
              </p>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Infrastructure Description
            <span className="ml-1 text-red-500">*</span>
          </label>

          <textarea
            required
            minLength={20}
            rows={6}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Example: I want to deploy an e-commerce application supporting 10,000 users. It should have 4 CPU cores, 8 GB RAM, 200 GB storage, high availability and low latency. My monthly budget is ₹15,000."
            className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />

          <div className="mt-2 flex justify-between text-xs text-slate-400">
            <span>Include your workload and technical requirements.</span>
            <span>{description.length} characters</span>
          </div>

        </section>

        {/* WORKLOAD DETAILS */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Server size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Workload Requirements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Specify the expected application workload.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Application Type
              </label>

              <select
                value={formData.workload}
                onChange={(e) => updateField('workload', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Web Application</option>
                <option>E-commerce</option>
                <option>Mobile Backend</option>
                <option>Data Processing</option>
                <option>Machine Learning</option>
                <option>Database Workload</option>
                <option>Microservices</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Expected Users
              </label>

              <input
                type="number"
                min="1"
                required
                value={formData.users}
                onChange={(e) => updateField('users', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

          </div>

        </section>

        {/* COMPUTE AND STORAGE */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <Cpu size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Compute and Storage
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Define the minimum infrastructure requirements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                CPU Cores
              </label>

              <input
                type="number"
                min="1"
                required
                value={formData.cpu}
                onChange={(e) => updateField('cpu', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                RAM (GB)
              </label>

              <input
                type="number"
                min="1"
                required
                value={formData.ram}
                onChange={(e) => updateField('ram', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Storage Capacity (GB)
              </label>

              <input
                type="number"
                min="1"
                required
                value={formData.storage}
                onChange={(e) => updateField('storage', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Preferred Region
              </label>

              <select
                value={formData.region}
                onChange={(e) => updateField('region', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Asia Pacific</option>
                <option>India</option>
                <option>Europe</option>
                <option>North America</option>
                <option>South America</option>
                <option>Any Available Region</option>
              </select>
            </div>

          </div>

        </section>

        {/* NETWORK REQUIREMENTS */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600">
              <Network size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Network Requirements
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Define network performance and availability preferences.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Latency Preference
              </label>

              <select
                value={formData.latency}
                onChange={(e) => updateField('latency', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Very Low</option>
                <option>Low</option>
                <option>Medium</option>
                <option>Flexible</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Availability Requirement
              </label>

              <select
                value={formData.availability}
                onChange={(e) => updateField('availability', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option>Basic</option>
                <option>High</option>
                <option>Very High</option>
                <option>Mission Critical</option>
              </select>
            </div>

          </div>

        </section>

        {/* BUDGET */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
              <Wallet size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Budget Constraints
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Define your maximum monthly infrastructure budget.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Monthly Budget
              </label>

              <input
                type="number"
                min="1"
                required
                value={formData.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>

              <select
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="INR">INR - Indian Rupee</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

          </div>

        </section>

        {/* PROVIDER PREFERENCE */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <Cloud size={21} />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Cloud Provider Preferences
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select the providers you want the system to evaluate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

            {['AWS', 'Azure', 'GCP'].map((provider) => (

              <label
                key={provider}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition ${
                  formData.providers.includes(provider)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >

                <input
                  type="checkbox"
                  checked={formData.providers.includes(provider)}
                  onChange={() => toggleProvider(provider)}
                  className="h-4 w-4 accent-blue-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  {provider}
                </span>

              </label>

            ))}

          </div>

        </section>

        {/* SUBMIT */}

        <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">

          <button
            type="button"
            onClick={resetForm}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw size={16} />
            Reset Form
          </button>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            Validate Requirements
            <ArrowRight size={17} />
          </button>

        </div>

      </form>

      {/* LOCAL VALIDATION RESULT */}

      {submitted && (

        <section className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">

          <div className="flex items-start gap-3">

            <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />

            <div>
              <h2 className="font-semibold text-slate-900">
                Requirements captured successfully
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your form passed the browser's basic validation.
                No LLM processing or cloud analysis has been performed yet.
              </p>
            </div>

          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">

            <h3 className="text-sm font-semibold text-slate-800">
              Intent Summary
            </h3>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              {submitted.description}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">

              {[
                ['Workload', submitted.workload],
                ['Expected Users', submitted.users],
                ['CPU Cores', submitted.cpu],
                ['RAM', `${submitted.ram} GB`],
                ['Storage', `${submitted.storage} GB`],
                ['Monthly Budget', `${submitted.currency} ${submitted.budget}`],
                ['Region', submitted.region],
                ['Latency', submitted.latency],
                ['Availability', submitted.availability],
                ['Providers', submitted.providers.join(', ')],
              ].map(([label, value]) => (

                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                    {value}
                  </p>
                </div>

              ))}

            </div>

          </div>

          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800">
              Next stage: LLM processing
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-700">
              This intent is currently held in browser memory only.
              Backend persistence, LLM extraction and cloud resource
              evaluation will be implemented in subsequent stages.
            </p>
          </div>

        </section>

      )}

    </div>
  )
}

export default IntentForm
