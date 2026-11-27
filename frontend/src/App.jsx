
import { Routes, Route, Navigate } from 'react-router-dom'

import IntentForm from './pages/intents/IntentForm'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/dashboard/Dashboard'
import PagePlaceholder from './pages/PagePlaceholder'
import IntentList from './pages/intents/IntentList'
import Comparison from './pages/comparison/Comparison'
import CostAnalysis from './pages/cost-analysis/CostAnalysis'
import Optimization from './pages/optimization/Optimization'
import Orchestration from './pages/orchestration/Orchestration'
import Deployment from './pages/deployments/Deployment'
import NetworkTopology from './pages/networking/NetworkTopology'
import Monitoring from './pages/monitoring/Monitoring'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'

const modulePages = []

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Intent Management */}
        <Route path="/intents" element={<IntentList />} />
        <Route path="/intents/new" element={<IntentForm />} />

        {/* Cloud Analysis */}
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/cost-analysis" element={<CostAnalysis />} />
        <Route path="/optimization" element={<Optimization />} />

        {/* Orchestration */}
        <Route path="/orchestration" element={<Orchestration />} />

        {/* Network Topology */}
        <Route path="/networking" element={<NetworkTopology />} />

        {/* Infrastructure Monitoring */}
        <Route path="/monitoring" element={<Monitoring />} />

        {/* Reports & Analytics */}
        <Route path="/reports" element={<Reports />} />

        {/* Deployment Preparation */}
        <Route path="/deployments" element={<Deployment />} />

        {/* Platform Settings */}
        <Route path="/settings" element={<Settings />} />

        {/* Other modules */}
        {modulePages.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={
              <PagePlaceholder
                title={page.title}
                description={page.description}
              />
            }
          />
        ))}

        {/* 404 Page */}
        <Route
          path="*"
          element={
            <PagePlaceholder
              title="Page Not Found"
              description="The requested page does not exist."
            />
          }
        />
      </Routes>
    </AppLayout>
  )
}

export default App
