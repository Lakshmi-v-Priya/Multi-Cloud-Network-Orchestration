
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquareText,
  Cloud,
  Calculator,
  BrainCircuit,
  Network,
  Server,
  Activity,
  FileBarChart,
  Settings,
  ShieldCheck,
  X
} from 'lucide-react'

const navigation = [
  {
    title: 'MAIN MENU',
    items: [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'New Intent', path: '/intents/new', icon: MessageSquareText },
      { name: 'Cloud Comparison', path: '/comparison', icon: Cloud },
      { name: 'Cost Analysis', path: '/cost-analysis', icon: Calculator },
      { name: 'Optimization', path: '/optimization', icon: BrainCircuit },
    ],
  },
  {
    title: 'INFRASTRUCTURE',
    items: [
      { name: 'Network Topology', path: '/networking', icon: Network },
      { name: 'Deployments', path: '/deployments', icon: Server },
      { name: 'Monitoring', path: '/monitoring', icon: Activity },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Reports', path: '/reports', icon: FileBarChart },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-[#0B1220] text-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Cloud size={23} />
            </div>

            <div>
              <h1 className="text-base font-bold tracking-wide">
                MultiCloud
              </h1>
              <p className="text-xs text-slate-400">
                Network Orchestrator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-7">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.18em] text-slate-500">
                {section.title}
              </p>

              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`
                      }
                    >
                      <Icon size={19} strokeWidth={1.8} />
                      <span>{item.name}</span>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-800/70 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">
                Secure Workspace
              </p>
              <p className="text-[10px] text-slate-400">
                Multi-cloud management
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
