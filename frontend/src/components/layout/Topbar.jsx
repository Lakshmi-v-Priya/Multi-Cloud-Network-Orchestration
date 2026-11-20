
import {
  Menu,
  Search,
  Bell,
  ChevronDown
} from 'lucide-react'

function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">

      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-slate-600 hover:text-blue-600 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu size={24} />
        </button>

        <div>
          <p className="text-sm font-semibold text-slate-800">
            Cloud Infrastructure Platform
          </p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Manage, compare and optimize your cloud resources
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">

        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <Search size={17} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-32 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
            /
          </span>
        </div>

        <button
          className="relative text-slate-500 hover:text-blue-600"
          aria-label="Notifications"
        >
          <Bell size={21} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 border-l border-slate-200 sm:block" />

        <button className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            LP
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Project Admin
            </p>
            <p className="text-xs text-slate-400">
              Administrator
            </p>
          </div>

          <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
        </button>

      </div>
    </header>
  )
}

export default Topbar
