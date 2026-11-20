
import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F5F7FB]">

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="min-h-screen lg:pl-72">

        <Topbar
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <main className="min-h-[calc(100vh-5rem)] p-5 sm:p-8">
          {children}
        </main>

      </div>
    </div>
  )
}

export default AppLayout
