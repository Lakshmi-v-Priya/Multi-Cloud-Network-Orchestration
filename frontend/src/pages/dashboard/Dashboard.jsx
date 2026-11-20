
import {
  Cloud,
  DollarSign,
  Server,
  Activity,
  ArrowUpRight,
  Network,
  Cpu,
  HardDrive,
  Clock3,
  Plus,
  ArrowRight,
  Globe,
} from 'lucide-react'

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'

import { useNavigate } from 'react-router-dom'

import StatCard from '../../components/dashboard/StatCard'
import SectionHeader from '../../components/dashboard/SectionHeader'

// Illustrative data only. Replace with backend data later.

const costData = [
  { month: 'Jun', aws: 4200, azure: 3500, gcp: 3100 },
  { month: 'Jul', aws: 4600, azure: 3700, gcp: 3300 },
  { month: 'Aug', aws: 4400, azure: 3900, gcp: 3500 },
  { month: 'Sep', aws: 5100, azure: 4200, gcp: 3700 },
  { month: 'Oct', aws: 4800, azure: 4000, gcp: 3900 },
  { month: 'Nov', aws: 5300, azure: 4500, gcp: 4100 },
]

const providerData = [
  { name: 'AWS', value: 40, color: '#F59E0B' },
  { name: 'Azure', value: 35, color: '#3B82F6' },
  { name: 'GCP', value: 25, color: '#10B981' },
]

const resourceData = [
  { name: 'Compute', usage: 68 },
  { name: 'Memory', usage: 52 },
  { name: 'Storage', usage: 76 },
  { name: 'Network', usage: 43 },
]

const providers = [
  {
    name: 'Amazon Web Services',
    short: 'AWS',
    color: 'bg-orange-500',
    background: 'bg-orange-50',
    text: 'text-orange-600',
  },
  {
    name: 'Microsoft Azure',
    short: 'AZURE',
    color: 'bg-blue-500',
    background: 'bg-blue-50',
    text: 'text-blue-600',
  },
  {
    name: 'Google Cloud Platform',
    short: 'GCP',
    color: 'bg-emerald-500',
    background: 'bg-emerald-50',
    text: 'text-emerald-600',
  },
]

function Dashboard() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-7xl space-y-7">

      {/* PAGE HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-slate-500">
            Overview / Dashboard
          </p>

          <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor, analyze and optimize your multi-cloud infrastructure.
          </p>
        </div>

        <button
          onClick={() => navigate('/intents/new')}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <Plus size={18} />
          Create New Intent
        </button>
      </div>

      {/* DEMO DATA NOTICE */}

      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
        <Activity size={18} className="mt-0.5 shrink-0 text-amber-600" />

        <div>
          <p className="text-xs font-semibold text-amber-800">
            Demonstration dashboard
          </p>

          <p className="mt-1 text-xs leading-5 text-amber-700">
            Charts and resource values currently use illustrative data.
            Live cloud integrations and backend analytics are not connected.
          </p>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Cloud Providers"
          value="03"
          description="AWS, Azure and GCP"
          icon={Cloud}
          color="blue"
        />

        <StatCard
          title="Estimated Monthly Cost"
          value="—"
          description="Pricing integration pending"
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Active Deployments"
          value="00"
          description="No deployments yet"
          icon={Server}
          color="violet"
        />

        <StatCard
          title="Network Monitoring"
          value="Pending"
          description="Monitoring not connected"
          icon={Activity}
          color="amber"
        />

      </div>

      {/* CLOUD PROVIDERS */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <SectionHeader
          title="Cloud Provider Overview"
          subtitle="Manage your multi-cloud provider integrations"
          action={
            <button
              onClick={() => navigate('/comparison')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              Compare providers <ArrowRight size={14} />
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {providers.map((provider) => (
            <div
              key={provider.short}
              className="rounded-xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between">

                <div className={`h-2 w-10 rounded-full ${provider.color}`} />

                <Cloud size={20} className={provider.text} />

              </div>

              <h3 className="mt-5 text-sm font-semibold text-slate-800">
                {provider.name}
              </h3>

              <div className="mt-3 flex items-center justify-between">

                <span className={`rounded-md px-2 py-1 text-[10px] font-semibold ${provider.background} ${provider.text}`}>
                  {provider.short}
                </span>

                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  Not connected
                </span>

              </div>
            </div>
          ))}

        </div>
      </section>

      {/* COST ANALYTICS */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

          <SectionHeader
            title="Cloud Cost Trends"
            subtitle="Illustrative monthly provider cost comparison (INR)"
            action={
              <button
                onClick={() => navigate('/cost-analysis')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                View analysis
              </button>
            }
          />

          <div className="h-72 w-full">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={costData}>

                <defs>
                  <linearGradient id="awsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="azureGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>

                  <linearGradient id="gcpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />

                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 12 }}
                />

                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toLocaleString('en-IN')}`,
                    'Illustrative cost',
                  ]}
                />

                <Area
                  type="monotone"
                  dataKey="aws"
                  name="AWS"
                  stroke="#F59E0B"
                  fill="url(#awsGradient)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="azure"
                  name="Azure"
                  stroke="#3B82F6"
                  fill="url(#azureGradient)"
                  strokeWidth={2}
                />

                <Area
                  type="monotone"
                  dataKey="gcp"
                  name="GCP"
                  stroke="#10B981"
                  fill="url(#gcpGradient)"
                  strokeWidth={2}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

          <div className="mt-4 flex flex-wrap gap-5">

            {[
              { name: 'AWS', color: 'bg-amber-500' },
              { name: 'Azure', color: 'bg-blue-500' },
              { name: 'GCP', color: 'bg-emerald-500' },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-xs text-slate-500">{item.name}</span>
              </div>
            ))}

          </div>

        </section>

        {/* PROVIDER DISTRIBUTION */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <SectionHeader
            title="Provider Distribution"
            subtitle="Illustrative allocation"
          />

          <div className="relative h-52">

            <ResponsiveContainer width="100%" height="100%">

              <PieChart>

                <Pie
                  data={providerData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={4}
                >

                  {providerData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}

                </Pie>

                <Tooltip formatter={(value) => `${value}%`} />

              </PieChart>

            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-900">
                100%
              </span>
              <span className="text-xs text-slate-400">
                Demo allocation
              </span>
            </div>

          </div>

          <div className="mt-4 space-y-4">

            {providerData.map((provider) => (
              <div key={provider.name} className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: provider.color }}
                  />

                  <span className="text-sm text-slate-600">
                    {provider.name}
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-800">
                  {provider.value}%
                </span>

              </div>
            ))}

          </div>

        </section>

      </div>

      {/* RESOURCE UTILIZATION */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <SectionHeader
            title="Resource Utilization"
            subtitle="Illustrative resource utilization percentages"
          />

          <div className="space-y-6">

            {resourceData.map((resource) => (

              <div key={resource.name}>

                <div className="mb-2 flex items-center justify-between">

                  <span className="text-sm font-medium text-slate-600">
                    {resource.name}
                  </span>

                  <span className="text-sm font-semibold text-slate-800">
                    {resource.usage}%
                  </span>

                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${resource.usage}%` }}
                  />

                </div>

              </div>

            ))}

          </div>

          <div className="mt-7 rounded-lg bg-slate-50 p-4">

            <div className="flex items-center gap-3">

              <Cpu size={20} className="text-blue-600" />

              <div>
                <p className="text-xs font-semibold text-slate-700">
                  Resource analytics
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Live utilization data will be available after monitoring integration.
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* NETWORK OVERVIEW */}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <SectionHeader
            title="Network Overview"
            subtitle="Network monitoring integration status"
          />

          <div className="grid grid-cols-2 gap-4">

            <div className="rounded-xl bg-blue-50 p-5">

              <Network className="text-blue-600" size={23} />

              <p className="mt-4 text-xs text-slate-500">
                Network Connections
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                —
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Awaiting integration
              </p>

            </div>

            <div className="rounded-xl bg-emerald-50 p-5">

              <Globe className="text-emerald-600" size={23} />

              <p className="mt-4 text-xs text-slate-500">
                Network Latency
              </p>

              <h3 className="mt-1 text-2xl font-bold text-slate-900">
                —
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                No measurements
              </p>

            </div>

            <div className="col-span-2 rounded-xl border border-slate-100 p-5">

              <div className="flex items-center gap-3">

                <HardDrive size={21} className="text-violet-600" />

                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Network monitoring
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Prometheus integration is pending.
                  </p>
                </div>

              </div>

              <div className="mt-4 h-2 rounded-full bg-slate-100" />

              <p className="mt-3 text-xs text-slate-400">
                No live network performance data available.
              </p>

            </div>

          </div>

        </section>

      </div>

      {/* RECENT ACTIVITY */}

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <SectionHeader
          title="Recent Orchestration Activity"
          subtitle="Recent intents, cloud comparisons and deployment operations"
          action={
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1 text-xs font-semibold text-blue-600"
            >
              View reports <ArrowRight size={14} />
            </button>
          }
        />

        <div className="flex min-h-44 flex-col items-center justify-center text-center">

          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Clock3 size={25} className="text-slate-400" />
          </div>

          <p className="mt-4 text-sm font-semibold text-slate-700">
            No orchestration activity
          </p>

          <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">
            Once you submit infrastructure intents and perform cloud
            comparisons, your activity history will appear here.
          </p>

        </div>

      </section>

      {/* QUICK ACTION */}

      <section className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 sm:p-8">

        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">

          <div>

            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Start orchestrating
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-900">
              Describe your cloud infrastructure requirements
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Submit your requirements in natural language and prepare
              them for intelligent multi-cloud analysis and optimization.
            </p>

          </div>

          <button
            onClick={() => navigate('/intents/new')}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Create New Intent
            <ArrowUpRight size={17} />
          </button>

        </div>

      </section>

    </div>
  )
}

export default Dashboard

