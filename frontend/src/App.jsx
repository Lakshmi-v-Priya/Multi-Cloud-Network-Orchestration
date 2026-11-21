
import { Routes, Route, Navigate } from 'react-router-dom'
import IntentForm from './pages/intents/IntentForm'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/dashboard/Dashboard'
import PagePlaceholder from './pages/PagePlaceholder'
import IntentList from './pages/intents/IntentList'

const modulePages = [
  {
    path: '/intents/new',
    title: 'Intent Management',
    description: 'Submit natural-language infrastructure requirements and manage your intents.',
  },
  {
    path: '/comparison',
    title: 'Multi-Cloud Comparison',
    description: 'Compare AWS, Microsoft Azure and Google Cloud resources.',
  },
  {
    path: '/cost-analysis',
    title: 'Cost Analysis',
    description: 'Evaluate infrastructure and network expenditure across cloud providers.',
  },
  {
    path: '/optimization',
    title: 'Intelligent Optimization',
    description: 'Optimize infrastructure based on cost, latency, availability and performance.',
  },
  {
    path: '/networking',
    title: 'Network Topology',
    description: 'Plan network architecture and connectivity across multiple cloud providers.',
  },
  {
    path: '/deployments',
    title: 'Infrastructure Deployments',
    description: 'Generate, validate and manage Terraform infrastructure deployments.',
  },
  {
    path: '/monitoring',
    title: 'Infrastructure Monitoring',
    description: 'Monitor infrastructure health, network performance and expenditure.',
  },
  {
    path: '/reports',
    title: 'Reports and Analytics',
    description: 'Explore cost comparisons, optimization results and infrastructure reports.',
  },
  {
    path: '/settings',
    title: 'Platform Settings',
    description: 'Manage platform preferences, integrations and configuration.',
  },
]

function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/intents" element={<IntentList />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/intents/new" element={<IntentForm />} />
        <Route path="/dashboard" element={<Dashboard />} />

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
