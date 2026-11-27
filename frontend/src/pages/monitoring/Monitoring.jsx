import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, Cloud, Server, Wifi, Gauge, RefreshCw, ShieldCheck, AlertTriangle,
  Clock, ArrowUpRight, ArrowDownRight, Globe, Zap, Pause, Play, Search,
  CheckCircle2, CircleAlert, TrendingUp, TrendingDown, Lightbulb, SlidersHorizontal,
} from 'lucide-react'

const PROVIDERS = ['All Providers', 'AWS', 'Azure', 'GCP']
const BASE_CLOUDS = [
  { name: 'AWS', region: 'us-east-1', latency: 42, bandwidth: 68, packetLoss: 0.2, nodes: 12 },
  { name: 'Azure', region: 'eastus', latency: 56, bandwidth: 54, packetLoss: 0.1, nodes: 8 },
  { name: 'GCP', region: 'us-central1', latency: 38, bandwidth: 72, packetLoss: 0.3, nodes: 10 },
]
const COLORS = { AWS: '#2563eb', Azure: '#7c3aed', GCP: '#059669' }
const DEFAULT_THRESHOLDS = { latencyWarning: 100, latencyCritical: 180, bandwidthWarning: 80, bandwidthCritical: 90, packetWarning: 1, packetCritical: 2 }
const fmtTime = (date) => new Date(date).toLocaleTimeString()
const seedSeries = (base, spread = 8) => Array.from({ length: 24 }, () => Number(Math.max(0, base + (Math.random() - 0.5) * spread).toFixed(2)))
const INITIAL_PERFORMANCE = { latency: { AWS: seedSeries(42, 12), Azure: seedSeries(56, 14), GCP: seedSeries(38, 10) }, bandwidth: { AWS: seedSeries(68, 8), Azure: seedSeries(54, 7), GCP: seedSeries(72, 9) }, packetLoss: { AWS: seedSeries(.2, .3), Azure: seedSeries(.1, .2), GCP: seedSeries(.3, .35) } }
const statusOf = (cloud, t) => cloud.latency >= t.latencyCritical || cloud.bandwidth >= t.bandwidthCritical || cloud.packetLoss >= t.packetCritical ? 'Critical' : cloud.latency >= t.latencyWarning || cloud.bandwidth >= t.bandwidthWarning || cloud.packetLoss >= t.packetWarning ? 'Warning' : 'Healthy'
const healthScore = (clouds) => Math.max(0, Math.round(100 - clouds.reduce((sum, c) => sum + Math.min(35, c.latency / 8) + Math.min(30, c.bandwidth / 4) + Math.min(35, c.packetLoss * 10), 0) / Math.max(1, clouds.length)))
const Badge = ({ status }) => {
  const style = status === 'Critical' ? 'bg-red-50 text-red-700' : status === 'Warning' ? 'bg-amber-50 text-amber-700' : status === 'Resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-50 text-emerald-700'
  const dot = status === 'Critical' ? 'bg-red-500' : status === 'Warning' ? 'bg-amber-500' : 'bg-emerald-500'
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{status}</span>
}
const MetricCard = ({ title, value, unit, icon: Icon, sub, iconStyle = 'bg-blue-50 text-blue-600' }) => <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-500">{title}</p><div className={`rounded-xl p-2 ${iconStyle}`}><Icon size={18}/></div></div><div className="mt-4 flex items-end gap-2"><span className="text-3xl font-bold text-slate-900">{value}</span><span className="mb-1 text-sm text-slate-500">{unit}</span></div><p className="mt-2 text-xs text-slate-500">{sub}</p></div>
function HistoryChart({ metric, series, selectedProviders, unit, max }) {
  const w=560, h=170, pad=24;
  const values=selectedProviders.flatMap(p=>series[p]||[]);
  const ceiling=max || Math.max(1, ...values);
  return <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${metric} history chart`}>{[0,.25,.5,.75,1].map(t=><line key={t} x1={pad} x2={w-pad} y1={pad+(h-2*pad)*t} y2={pad+(h-2*pad)*t} stroke="#e2e8f0" strokeDasharray="4 4"/>)}{selectedProviders.map(provider=>{const vals=series[provider]||[];const pts=vals.map((v,i)=>`${pad+(vals.length<=1?0:i/(vals.length-1)*(w-2*pad))},${h-pad-Math.max(0,Math.min(ceiling,v))/ceiling*(h-2*pad)}`).join(" ");return <polyline key={provider} points={pts} fill="none" stroke={COLORS[provider]} strokeWidth="2.5" strokeLinecap="round"/>})}<text x={pad} y={h-5} fontSize="11" fill="#64748b">Older</text><text x={w-pad} y={h-5} textAnchor="end" fontSize="11" fill="#64748b">Now ({unit})</text></svg>
}
const Panel = ({ title, subtitle, children, right }) => <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>{right}</div><div className="p-5">{children}</div></section>

function Monitoring() {
  const [clouds, setClouds] = useState(BASE_CLOUDS)
  const [provider, setProvider] = useState('All Providers')
  const [running, setRunning] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [showThresholds, setShowThresholds] = useState(false)
  const [eventLog, setEventLog] = useState([{ id: 'initial', time: new Date(), provider: 'System', severity: 'Info', type: 'Monitoring started', message: 'Simulation monitoring session initialized.' }])
  const [eventSearch, setEventSearch] = useState('')
  const [eventSeverity, setEventSeverity] = useState('All')
  const [availability, setAvailability] = useState({ AWS: 99.98, Azure: 99.95, GCP: 99.99 })
  const [uptimeSamples, setUptimeSamples] = useState({ AWS: 0, Azure: 0, GCP: 0 })
  const [performanceHistory, setPerformanceHistory] = useState(INITIAL_PERFORMANCE)
  const [traffic, setTraffic] = useState({ AWS: [520, 560, 480, 610, 590, 640, 700, 660, 720, 680, 740, 710], Azure: [380, 420, 460, 440, 500, 480, 520, 560, 540, 590, 610, 580], GCP: [610, 580, 640, 690, 660, 720, 740, 710, 780, 760, 820, 790] })
  const prevStatuses = useRef(Object.fromEntries(BASE_CLOUDS.map(c => [c.name, 'Healthy'])))
  const filtered = provider === 'All Providers' ? clouds : clouds.filter(c => c.name === provider)
  const totalNodes = filtered.reduce((s, c) => s + c.nodes, 0)
  const avgLatency = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.latency, 0) / filtered.length) : 0
  const avgBandwidth = filtered.length ? Math.round(filtered.reduce((s, c) => s + c.bandwidth, 0) / filtered.length) : 0
  const avgLoss = filtered.length ? (filtered.reduce((s, c) => s + c.packetLoss, 0) / filtered.length).toFixed(2) : '0.00'
  const score = healthScore(filtered)
  const providerStatuses = clouds.map(c => ({ ...c, status: statusOf(c, thresholds) }))
  const alerts = providerStatuses.filter(c => c.status !== 'Healthy')
  const incidentCounts = eventLog.filter(e => ['Warning', 'Critical'].includes(e.severity)).length
  const filteredEvents = eventLog.filter(e => (eventSeverity === 'All' || e.severity === eventSeverity) && `${e.provider} ${e.type} ${e.message}`.toLowerCase().includes(eventSearch.toLowerCase()))
  const insights = useMemo(() => {
    const result = []
    clouds.forEach(c => {
      if (c.latency >= thresholds.latencyWarning) result.push(`${c.name} latency is elevated (${c.latency} ms). Consider reviewing routing or region load.`)
      if (c.bandwidth >= thresholds.bandwidthWarning) result.push(`${c.name} bandwidth is approaching capacity (${c.bandwidth}%). Review traffic distribution.`)
      if (c.packetLoss >= thresholds.packetWarning) result.push(`${c.name} packet loss is above the warning threshold (${c.packetLoss}%). Check network path quality.`)
    })
    if (!result.length) result.push('All simulated providers are currently within configured warning thresholds. Continue monitoring for changes.')
    return result
  }, [clouds, thresholds])

  const refreshMetrics = () => {
    setRefreshing(true)
    setClouds(current => current.map(c => ({ ...c, latency: Math.max(15, Math.min(220, c.latency + (Math.random() > .5 ? 1 : -1) * Math.round(Math.random() * 18 + 3))), bandwidth: Math.max(20, Math.min(95, c.bandwidth + (Math.random() > .5 ? 1 : -1) * Math.round(Math.random() * 8 + 1))), packetLoss: Number(Math.max(0, Math.min(3.5, c.packetLoss + (Math.random() > .5 ? 1 : -1) * Number((Math.random() * .4).toFixed(1)))).toFixed(2)) })))
    setTraffic(current => Object.fromEntries(Object.entries(current).map(([p, values]) => { const last = values.at(-1) || 500; return [p, [...values.slice(1), Math.max(100, Math.min(1200, last + (Math.random() > .5 ? 1 : -1) * Math.round(Math.random() * 100 + 20)))]] })))
    setAvailability(current => Object.fromEntries(Object.entries(current).map(([p, value]) => [p, Math.max(99.5, Math.min(100, value + (Math.random() - .5) * .003))])))
    setPerformanceHistory(current => Object.fromEntries(Object.entries(current).map(([metric, providers]) => [metric, Object.fromEntries(Object.entries(providers).map(([p, values]) => { const last=values.at(-1) ?? 50; const wiggle=metric==='latency'?24:metric==='bandwidth'?12:.45; const ceiling=metric==='latency'?220:metric==='bandwidth'?95:3.5; const next=Math.max(0,Math.min(ceiling,last+(Math.random()-.5)*wiggle)); return [p,[...values.slice(1),Number(next.toFixed(2))]] }))])))
    setUptimeSamples(current => Object.fromEntries(Object.entries(current).map(([p, n]) => [p, n + 1])))
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      if (!running) return
      const snapshot = clouds
      const updates = []
      snapshot.forEach(c => {
        const current = statusOf(c, thresholds)
        const previous = prevStatuses.current[c.name] || 'Healthy'
        if (current !== previous) {
          const severity = current === 'Healthy' ? 'Resolved' : current
          updates.push({ id: `${c.name}-${Date.now()}-${Math.random()}`, time: new Date(), provider: c.name, severity, type: current === 'Healthy' ? 'Incident resolved' : `${current} incident detected`, message: `Status changed ${previous} → ${current}. Latency ${c.latency} ms, bandwidth ${c.bandwidth}%, packet loss ${c.packetLoss}%.` })
          prevStatuses.current[c.name] = current
        }
        const anomaly = c.latency > 1.7 * 56 || c.bandwidth > 90 || c.packetLoss > 1.5
        if (anomaly) updates.push({ id: `${c.name}-anomaly-${Date.now()}-${Math.random()}`, time: new Date(), provider: c.name, severity: current === 'Critical' ? 'Critical' : 'Warning', type: 'Rule-based anomaly', message: `Potential anomaly: latency ${c.latency} ms, bandwidth ${c.bandwidth}%, packet loss ${c.packetLoss}%.` })
      })
      if (updates.length) setEventLog(current => [...updates.reverse(), ...current].slice(0, 200))
    }, 5000)
    return () => clearInterval(timer)
  }, [clouds, thresholds, running])

  useEffect(() => {
    if (!running) return undefined
    const interval = setInterval(refreshMetrics, 5000)
    return () => clearInterval(interval)
  }, [running])

  const trendFor = (c, key) => {
    const original = BASE_CLOUDS.find(x => x.name === c.name)?.[key] ?? c[key]
    const delta = Number((c[key] - original).toFixed(1))
    const improving = key === 'latency' || key === 'packetLoss' ? delta <= 0 : delta <= 0
    return <span className={`inline-flex items-center gap-1 text-xs ${improving ? 'text-emerald-600' : 'text-amber-600'}`}>{improving ? <TrendingDown size={13}/> : <TrendingUp size={13}/>} {delta > 0 ? '+' : ''}{delta}</span>
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-slate-900">Infrastructure Monitoring</h1><p className="mt-1 text-sm text-slate-500">Monitor multi-cloud infrastructure health and network performance.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setRunning(v => !v)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm">{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pause' : 'Resume'} Monitoring</button><button onClick={refreshMetrics} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''}/> Refresh</button></div></div>
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4"><Activity size={18} className="mt-0.5 text-blue-600"/><div><p className="text-sm font-semibold text-blue-800">Simulation Mode</p><p className="mt-1 text-xs text-blue-700">Metrics, alerts, availability and insights are simulated. No real cloud resources are connected.</p></div><span className={`ml-auto rounded-full px-2 py-1 text-xs font-medium ${running ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{running ? 'Monitoring active' : 'Paused'}</span></div>
    <div className="flex flex-wrap gap-2">{PROVIDERS.map(p => <button key={p} onClick={() => setProvider(p)} className={`rounded-xl px-4 py-2 text-sm font-medium ${provider === p ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{p}</button>)}</div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard title="Active Nodes" value={totalNodes} unit="nodes" icon={Server} sub="Across selected providers"/><MetricCard title="Average Latency" value={avgLatency} unit="ms" icon={Zap} sub="Lower is better" iconStyle="bg-violet-50 text-violet-600"/><MetricCard title="Bandwidth Usage" value={avgBandwidth} unit="%" icon={Wifi} sub="Average utilization" iconStyle="bg-cyan-50 text-cyan-600"/><MetricCard title="Packet Loss" value={avgLoss} unit="%" icon={Gauge} sub="Average loss" iconStyle="bg-amber-50 text-amber-600"/><MetricCard title="Health Score" value={score} unit="/100" icon={ShieldCheck} sub={score >= 85 ? 'Healthy overall' : score >= 65 ? 'Needs attention' : 'Poor health'} iconStyle="bg-emerald-50 text-emerald-600"/></div>
    <Panel title="Smart Health Alerts & Incident Detection" subtitle="Rule-based incident classification using current metrics." right={<div className="flex gap-2"><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">{alerts.filter(c => c.status === 'Warning').length} Warning</span><span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{alerts.filter(c => c.status === 'Critical').length} Critical</span></div>}>
      {alerts.length ? <div className="space-y-3">{alerts.map(c => <div key={c.name} className={`flex flex-wrap items-start gap-3 rounded-xl border p-4 ${c.status === 'Critical' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}><AlertTriangle size={18} className={c.status === 'Critical' ? 'text-red-600' : 'text-amber-600'}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm text-slate-800">{c.name}</strong><Badge status={c.status}/></div><p className="mt-1 text-xs text-slate-600">Latency {c.latency} ms · Bandwidth {c.bandwidth}% · Packet loss {c.packetLoss}%</p></div></div>)}</div> : <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"><ShieldCheck className="mr-2 inline" size={18}/>All selected providers are within configured thresholds.</div>}
      <div className="mt-4"><button onClick={() => setShowThresholds(v => !v)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"><SlidersHorizontal size={15}/> {showThresholds ? 'Hide' : 'Configure'} alert thresholds</button></div>
      {showThresholds && <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(thresholds).map(([key, value]) => <label key={key} className="text-xs text-slate-600"><span className="mb-1 block">{({latencyWarning:'Latency warning (ms)',latencyCritical:'Latency critical (ms)',bandwidthWarning:'Bandwidth warning (%)',bandwidthCritical:'Bandwidth critical (%)',packetWarning:'Packet-loss warning (%)',packetCritical:'Packet-loss critical (%)'})[key]}</span><input type="number" min="0" value={value} onChange={e => setThresholds(t => ({...t, [key]: Number(e.target.value)}))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"/></label>)}<button onClick={() => setThresholds(DEFAULT_THRESHOLDS)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">Reset defaults</button></div>}
    </Panel>
    <Panel title="Cloud Provider Health" subtitle="Current simulated provider health, trends and incidents.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{filtered.map(c => { const status = statusOf(c, thresholds); return <div key={c.name} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"><Cloud size={20}/></div><div><h3 className="font-semibold text-slate-900">{c.name}</h3><p className="text-xs text-slate-500">{c.region}</p></div></div><Badge status={status}/></div><div className="mt-4 grid grid-cols-2 gap-3">{[['Latency',c.latency,'ms','latency'],['Bandwidth',c.bandwidth,'%','bandwidth'],['Packet Loss',c.packetLoss,'%','packetLoss'],['Active Nodes',c.nodes,'nodes','nodes']].map(([label,value,unit,key])=><div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-lg font-semibold text-slate-800">{value} {unit}</p>{key !== 'nodes' && trendFor(c,key)}</div>)}</div><div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>Bandwidth capacity</span><span>{c.bandwidth}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${c.bandwidth >= thresholds.bandwidthWarning ? 'bg-amber-500' : 'bg-blue-500'}`} style={{width:`${c.bandwidth}%`}}/></div></div></div>})}</div>
    </Panel>
    <Panel title="Network Performance Analytics" subtitle="Historical trends for latency, bandwidth utilization and packet loss.">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {[["latency","Latency","ms",220],["bandwidth","Bandwidth Utilization","%",100],["packetLoss","Packet Loss","%",3.5]].map(([metric,label,unit,max])=>{
          const shown=provider==='All Providers'?['AWS','Azure','GCP']:[provider];
          return <div key={metric} className="rounded-xl border border-slate-200 p-4">
            <h3 className="text-sm font-semibold text-slate-800">{label}</h3>
            <div className="mt-3 flex flex-wrap gap-3 text-xs">{shown.map(p=><span key={p} className="flex items-center gap-1.5 text-slate-500"><span className="h-2 w-2 rounded-full" style={{background:COLORS[p]}}/>{p}</span>)}</div>
            <div className="mt-3"><HistoryChart metric={label} series={performanceHistory[metric]} selectedProviders={shown} unit={unit} max={max}/></div>
          </div>
        })}
      </div>
    </Panel>
    <Panel title="Availability & Uptime Analytics" subtitle="Estimated simulated availability summary (not SLA or real uptime measurement)."><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{filtered.map(c=><div key={c.name} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between"><strong>{c.name}</strong><CheckCircle2 size={18} className="text-emerald-500"/></div><p className="mt-3 text-2xl font-bold text-slate-900">{availability[c.name].toFixed(3)}%</p><p className="text-xs text-slate-500">Estimated availability index</p><div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{width:`${availability[c.name]}%`}}/></div><p className="mt-2 text-xs text-slate-500">Simulated samples: {uptimeSamples[c.name]}</p></div>)}</div></Panel>
    <Panel title="Insights & Recommendations" subtitle="Rule-based suggestions based on the current simulation."><div className="space-y-2">{insights.map((item,i)=><div key={i} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700"><Lightbulb size={16} className="mt-0.5 shrink-0 text-amber-500"/>{item}</div>)}</div></Panel>
    <Panel title="Network Traffic Comparison" subtitle="Last 12 simulated refresh samples (Mbps)."><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{(provider === 'All Providers' ? ['AWS','Azure','GCP'] : [provider]).map(name=>{const values=traffic[name]; const peak=Math.max(...values); return <div key={name} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between"><strong>{name}</strong><span className="text-xs text-slate-500">Peak {peak} Mbps</span></div><div className="mt-4 flex h-36 items-end gap-1">{values.map((v,i)=><div key={i} title={`${v} Mbps`} className="flex-1 rounded-t bg-blue-500/80" style={{height:`${v/1200*100}%`}}/>)}</div><div className="mt-2 flex justify-between text-xs text-slate-400"><span>Older</span><span>Now</span></div></div>})}</div></Panel>
    <Panel title="Searchable Event Log" subtitle={`Showing ${filteredEvents.length} of ${eventLog.length} simulation events.`} right={<div className="flex flex-wrap gap-2"><div className="relative"><Search size={14} className="absolute left-2 top-2.5 text-slate-400"/><input value={eventSearch} onChange={e=>setEventSearch(e.target.value)} placeholder="Search events" className="rounded-lg border border-slate-200 py-2 pl-7 pr-2 text-xs"/></div><select value={eventSeverity} onChange={e=>setEventSeverity(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs"><option>All</option><option>Info</option><option>Warning</option><option>Critical</option><option>Resolved</option></select></div>}>
      {filteredEvents.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Severity</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredEvents.map(e=><tr key={e.id} className="hover:bg-slate-50"><td className="whitespace-nowrap px-4 py-3 text-slate-500">{fmtTime(e.time)}</td><td className="px-4 py-3 font-medium">{e.provider}</td><td className="px-4 py-3"><Badge status={e.severity}/></td><td className="px-4 py-3">{e.type}</td><td className="px-4 py-3 text-slate-600">{e.message}</td></tr>)}</tbody></table></div> : <p className="text-sm text-slate-500">No events match your search and severity filter.</p>}
    </Panel>
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-600"/>Simulation only · No real cloud connection</div><div className="flex items-center gap-2"><Clock size={15}/>Last updated: {fmtTime(lastUpdated)} · Refresh interval: 5 seconds {running ? '(active)' : '(paused)'}</div></div>
  </div>
}
export default Monitoring
