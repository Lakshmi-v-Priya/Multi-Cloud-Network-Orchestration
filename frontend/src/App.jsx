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

const modulePages = [
  {
    path: '/intents/new',
    title: 'Intent Management',
    description:
      'Submit natural-language infrastructure requirements and manage your intents.',
  },
  {
    path: '/networking',
    title: 'Network Topology',
    description:
      'Plan network architecture and connectivity across multiple cloud providers.',
  },
  {
    path: '/monitoring',
    title: 'Infrastructure Monitoring',
    description:
      'Monitor infrastructure health, network performance and expenditure.',
  },
  {
    path: '/reports',
    title: 'Reports and Analytics',
    description:
      'Explore cost comparisons, optimization results and infrastructure reports.',
  },
  {
    path: '/settings',
    title: 'Platform Settings',
    description:
      'Manage platform preferences, integrations and configuration.',
  },
]

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

        {/* Deployment Preparation */}
        <Route path="/deployments" element={<Deployment />} />

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