
import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  Cloud,
  Server,
  Wifi,
  Gauge,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Zap,
} from 'lucide-react'

const providers = ['All Providers', 'AWS', 'Azure', 'GCP']

const initialClouds = [
  { name: 'AWS', region: 'us-east-1', status: 'Healthy', latency: 42, bandwidth: 68, packetLoss: 0.2, nodes: 12 },
  { name: 'Azure', region: 'eastus', status: 'Healthy', latency: 56, bandwidth: 54, packetLoss: 0.1, nodes: 8 },
  { name: 'GCP', region: 'us-central1', status: 'Healthy', latency: 38, bandwidth: 72, packetLoss: 0.3, nodes: 10 },
]

function randomChange(value, min, max, step = 1) {
  const change = (Math.random() > 0.5 ? 1 : -1) * step
  return Math.max(min, Math.min(max, value + change))
}

function MetricCard({ title, value, unit, icon: Icon, change, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`rounded-xl p-2 ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        <span className="mb-1 text-sm text-slate-500">{unit}</span>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-emerald-600">
        <ArrowDownRight size={14} />
        <span>{change}</span>
        <span className="text-slate-400">vs previous interval</span>
      </div>
    </div>
)}


function getStatus(cloud) {
  if (cloud.latency > 180 || cloud.bandwidth > 90 || cloud.packetLoss > 2) {
    return 'Critical'
  }
  if (cloud.latency >= 100 || cloud.bandwidth >= 80 || cloud.packetLoss >= 1) {
    return 'Warning'
  }
  return 'Healthy'
}

function StatusBadge({ status }) {
  const styles = {
    Healthy: 'bg-emerald-50 text-emerald-700',
    Warning: 'bg-amber-50 text-amber-700',
    Critical: 'bg-red-50 text-red-700',
  }
  const dotStyles = {
    Healthy: 'bg-emerald-500',
    Warning: 'bg-amber-500',
    Critical: 'bg-red-500',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status] || styles.Healthy}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status] || dotStyles.Healthy}`} />
      {status}
    </span>
  )
}

function TrafficLineChart({ series, selectedProvider }) {
  const chartWidth = 720
  const chartHeight = 240
  const left = 42
  const right = 14
  const top = 18
  const bottom = 28
  const plotWidth = chartWidth - left - right
  const plotHeight = chartHeight - top - bottom
  const maxValue = 1200
  const colors = { AWS: '#2563eb', Azure: '#7c3aed', GCP: '#059669' }
  const names = selectedProvider === 'All Providers' ? ['AWS', 'Azure', 'GCP'] : [selectedProvider]
  const yTicks = [0, 300, 600, 900, 1200]
  const xFor = (index, length) => left + (length <= 1 ? 0 : (index / (length - 1)) * plotWidth)
  const yFor = (value) => top + plotHeight - (Math.max(0, Math.min(maxValue, value)) / maxValue) * plotHeight

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[600px] w-full" role="img" aria-label="Simulated network traffic line chart">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={left} x2={chartWidth - right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={left - 8} y={yFor(tick) + 4} textAnchor="end" fontSize="11" fill="#64748b">{tick}</text>
          </g>
        ))}
        {names.map((name) => {
          const values = series[name] || []
          const points = values.map((value, index) => `${xFor(index, values.length)},${yFor(value)}`).join(' ')
          return (
            <g key={name}>
              <polyline points={points} fill="none" stroke={colors[name]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {values.map((value, index) => (
                <circle key={`${name}-${index}`} cx={xFor(index, values.length)} cy={yFor(value)} r="3" fill={colors[name]}>
                  <title>{name}: {value} Mbps</title>
                </circle>
              ))}
            </g>
          )
        })}
        <text x={left} y={chartHeight - 8} fontSize="11" fill="#64748b">60 sec ago</text>
        <text x={chartWidth - right} y={chartHeight - 8} textAnchor="end" fontSize="11" fill="#64748b">Now</text>
      </svg>
    </div>
  )
}


function Monitoring() {
  const [clouds, setClouds] = useState(initialClouds)
  const [selectedProvider, setSelectedProvider] = useState('All Providers')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshing, setRefreshing] = useState(false)
  const [history, setHistory] = useState([35, 42, 38, 55, 47, 62, 58, 65, 52, 70, 64, 68])
  const [trafficHistory, setTrafficHistory] = useState({ AWS: [520, 560, 480, 610, 590, 640, 700, 660, 720, 680, 740, 710], Azure: [380, 420, 460, 440, 500, 480, 520, 560, 540, 590, 610, 580], GCP: [610, 580, 640, 690, 660, 720, 740, 710, 780, 760, 820, 790] })
  const [alertHistory, setAlertHistory] = useState([])
  const previousStatuses = useRef(Object.fromEntries(initialClouds.map((cloud) => [cloud.name, getStatus(cloud)])))

  const filteredClouds =
    selectedProvider === 'All Providers'
      ? clouds
      : clouds.filter((cloud) => cloud.name === selectedProvider)

  const totalNodes = filteredClouds.reduce((sum, cloud) => sum + cloud.nodes, 0)
  const avgLatency = filteredClouds.length
    ? Math.round(filteredClouds.reduce((sum, cloud) => sum + cloud.latency, 0) / filteredClouds.length)
    : 0
  const avgBandwidth = filteredClouds.length
    ? Math.round(filteredClouds.reduce((sum, cloud) => sum + cloud.bandwidth, 0) / filteredClouds.length)
    : 0
  const avgPacketLoss = filteredClouds.length
    ? (filteredClouds.reduce((sum, cloud) => sum + cloud.packetLoss, 0) / filteredClouds.length).toFixed(1)
    : '0.0'
  const providerAlerts = filteredClouds.flatMap((cloud) => {
    const status = getStatus(cloud)
    if (status === 'Healthy') return []
    const reasons = []
    if (cloud.latency >= 100) reasons.push(`Latency is ${cloud.latency} ms`)
    if (cloud.bandwidth >= 80) reasons.push(`Bandwidth is ${cloud.bandwidth}%`)
    if (cloud.packetLoss >= 1) reasons.push(`Packet loss is ${cloud.packetLoss}%`)
    return [{ provider: cloud.name, status, reasons }]
  })
  const warningCount = providerAlerts.filter((alert) => alert.status === 'Warning').length
  const criticalCount = providerAlerts.filter((alert) => alert.status === 'Critical').length

  useEffect(() => {
    const newEvents = []
    clouds.forEach((cloud) => {
      const currentStatus = getStatus(cloud)
      const previousStatus = previousStatuses.current[cloud.name] || 'Healthy'
      if (currentStatus !== previousStatus) {
        const reasons = []
        if (cloud.latency >= 100) reasons.push(`Latency is ${cloud.latency} ms`)
        if (cloud.bandwidth >= 80) reasons.push(`Bandwidth is ${cloud.bandwidth}%`)
        if (cloud.packetLoss >= 1) reasons.push(`Packet loss is ${cloud.packetLoss}%`)
        const resolved = currentStatus === 'Healthy' && previousStatus !== 'Healthy'
        newEvents.push({
          id: `${cloud.name}-${Date.now()}-${Math.random()}`,
          time: new Date(),
          provider: cloud.name,
          severity: resolved ? 'Resolved' : currentStatus,
          event: resolved ? `${previousStatus} condition cleared. Metrics returned to healthy levels.` : reasons.join(' · ') || `Status changed from ${previousStatus} to ${currentStatus}`,
          transition: `${previousStatus} → ${currentStatus}`,
        })
      }
      previousStatuses.current[cloud.name] = currentStatus
    })
    if (newEvents.length) setAlertHistory((current) => [...newEvents.reverse(), ...current].slice(0, 50))
  }, [clouds])


  const refreshMetrics = () => {
    setRefreshing(true)

    setClouds((current) =>
      current.map((cloud) => ({
        ...cloud,
        latency: randomChange(cloud.latency, 20, 220, 8),
        bandwidth: randomChange(cloud.bandwidth, 20, 95, 4),
        packetLoss: Number(randomChange(cloud.packetLoss, 0, 3.5, 0.2).toFixed(1)),
      }))
    )

    setHistory((current) => [...current.slice(1), Math.round(Math.random() * 65 + 20)])
    setTrafficHistory((current) => Object.fromEntries(Object.entries(current).map(([provider, values]) => {
      const lastValue = values[values.length - 1] || 500
      const nextValue = Math.max(120, Math.min(1200, lastValue + (Math.random() > 0.5 ? 1 : -1) * Math.round(Math.random() * 110 + 20)))
      return [provider, [...values.slice(1), nextValue]]
    })))
    setLastUpdated(new Date())

    setTimeout(() => setRefreshing(false), 500)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Infrastructure Monitoring</h1>
          <p className="mt-1 text-sm text-slate-500">
            Monitor multi-cloud infrastructure health and network performance.
          </p>
        </div>

        <button
          onClick={refreshMetrics}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh Metrics
        </button>
      </div>

      {/* Simulation notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <Activity size={18} className="mt-0.5 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Simulation Mode</p>
          <p className="mt-1 text-xs text-blue-700">
            Monitoring metrics are simulated for demonstration purposes. No real cloud resources are being monitored.
          </p>
        </div>
      </div>

      {/* Provider Filter */}
      <div className="flex flex-wrap gap-2">
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setSelectedProvider(provider)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              selectedProvider === provider
                ? 'bg-slate-900 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {provider}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active Nodes"
          value={totalNodes}
          unit="nodes"
          icon={Server}
          change="Stable"
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          title="Average Latency"
          value={avgLatency}
          unit="ms"
          icon={Zap}
          change="Live simulated"
          color="bg-violet-50 text-violet-600"
        />
        <MetricCard
          title="Bandwidth Usage"
          value={avgBandwidth}
          unit="%"
          icon={Wifi}
          change="Live simulated"
          color="bg-cyan-50 text-cyan-600"
        />
        <MetricCard
          title="Packet Loss"
          value={avgPacketLoss}
          unit="%"
          icon={Gauge}
          change="Live simulated"
          color="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Smart Health Alerts */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Smart Health Alerts</h2>
            <p className="mt-1 text-xs text-slate-500">Alerts are calculated from the current simulated metrics and thresholds.</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{warningCount} Warning</span>
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{criticalCount} Critical</span>
          </div>
        </div>
        <div className="p-5">
          {providerAlerts.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              <ShieldCheck size={18} /> All selected providers are within healthy thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {providerAlerts.map((alert) => (
                <div key={alert.provider} className={`flex items-start gap-3 rounded-xl border p-4 ${alert.status === 'Critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                  <AlertTriangle size={18} className={alert.status === 'Critical' ? 'text-red-600' : 'text-amber-600'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-800">{alert.provider}</p>
                      <StatusBadge status={alert.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{alert.reasons.join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Alert History */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-semibold text-slate-900">Alert History</h2>
          <p className="mt-1 text-xs text-slate-500">Status changes captured during this monitoring session.</p>
        </div>
        {alertHistory.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">No status changes recorded yet. Alerts will appear here when a provider's health changes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Time</th>
                  <th className="px-5 py-3 font-medium">Provider</th>
                  <th className="px-5 py-3 font-medium">Severity</th>
                  <th className="px-5 py-3 font-medium">Transition</th>
                  <th className="px-5 py-3 font-medium">Event</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alertHistory.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">{event.time.toLocaleTimeString()}</td>
                    <td className="px-5 py-4 font-medium text-slate-800">{event.provider}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${event.severity === 'Critical' ? 'bg-red-50 text-red-700' : event.severity === 'Warning' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{event.severity}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-600">{event.transition}</td>
                    <td className="px-5 py-4 text-slate-600">{event.event}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cloud Provider Health */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Cloud Provider Health</h2>
            <p className="mt-1 text-xs text-slate-500">Current status of simulated cloud environments</p>
          </div>
          <Cloud size={20} className="text-slate-400" />
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-3">
          {filteredClouds.map((cloud) => (
            <div key={cloud.name} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                    <Cloud size={20} className="text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{cloud.name}</h3>
                    <p className="text-xs text-slate-500">{cloud.region}</p>
                  </div>
                </div>
                <StatusBadge status={getStatus(cloud)} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Latency</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{cloud.latency} ms</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Bandwidth</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{cloud.bandwidth}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Packet Loss</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{cloud.packetLoss}%</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Active Nodes</p>
                  <p className="mt-1 text-lg font-semibold text-slate-800">{cloud.nodes}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Bandwidth capacity</span>
                  <span>{cloud.bandwidth}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cloud.bandwidth > 80 ? 'bg-amber-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${cloud.bandwidth}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Traffic Visualization */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">Network Traffic Visualization</h2>
            <p className="mt-1 text-xs text-slate-500">Simulated traffic volume over the last 60 seconds · Mbps</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live simulation
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-4 text-xs font-medium">
          {(selectedProvider === 'All Providers' ? ['AWS', 'Azure', 'GCP'] : [selectedProvider]).map((name) => (
            <span key={name} className="inline-flex items-center gap-2 text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${name === 'AWS' ? 'bg-blue-600' : name === 'Azure' ? 'bg-violet-600' : 'bg-emerald-600'}`} />
              {name}
            </span>
          ))}
        </div>
        <div className="mt-4">
          <TrafficLineChart series={trafficHistory} selectedProvider={selectedProvider} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>Traffic volume (Mbps)</span>
          <span>Updates every 5 seconds</span>
        </div>
      </div>

      {/* Network Performance Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="font-semibold text-slate-900">Network Performance Details</h2>
            <p className="mt-1 text-xs text-slate-500">Detailed simulated performance by cloud provider</p>
          </div>
          <Globe size={20} className="text-slate-400" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Provider</th>
                <th className="px-5 py-3 font-medium">Region</th>
                <th className="px-5 py-3 font-medium">Latency</th>
                <th className="px-5 py-3 font-medium">Bandwidth</th>
                <th className="px-5 py-3 font-medium">Packet Loss</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClouds.map((cloud) => (
                <tr key={cloud.name} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium text-slate-800">{cloud.name}</td>
                  <td className="px-5 py-4 text-slate-500">{cloud.region}</td>
                  <td className="px-5 py-4 text-slate-700">{cloud.latency} ms</td>
                  <td className="px-5 py-4 text-slate-700">{cloud.bandwidth}%</td>
                  <td className="px-5 py-4 text-slate-700">{cloud.packetLoss}%</td>
                  <td className="px-5 py-4"><StatusBadge status={getStatus(cloud)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={15} className="text-emerald-600" />
          Simulation only · No real cloud connection
        </div>
        <div className="flex items-center gap-2">
          <Clock size={15} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
}

export default Monitoring
