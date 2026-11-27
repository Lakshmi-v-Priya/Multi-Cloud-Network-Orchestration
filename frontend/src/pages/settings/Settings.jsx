
import { useEffect, useState } from 'react'
import {
  Settings2,
  Globe,
  Cloud,
  SlidersHorizontal,
  Network,
  Wallet,
  Bell,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

const STORAGE_KEY = 'multicloud-platform-settings'

const defaultSettings = {
  defaultRegion: 'ap-south-1',
  currency: 'INR',
  providers: {
    AWS: true,
    Azure: true,
    GCP: true,
  },
  optimizationMode: 'balanced',
  networkPriority: 'balanced',
  defaultBudget: 15000,
  alertThreshold: 80,
  budgetAlerts: true,
  optimizationAlerts: true,
}

const regions = [
  { value: 'ap-south-1', label: 'Mumbai (India)' },
  { value: 'ap-south-2', label: 'Hyderabad (India)' },
  { value: 'ap-southeast-1', label: 'Singapore' },
  { value: 'us-east-1', label: 'N. Virginia (US)' },
  { value: 'us-west-2', label: 'Oregon (US)' },
  { value: 'eu-west-1', label: 'Ireland' },
  { value: 'eu-central-1', label: 'Frankfurt (Germany)' },
]

const currencies = [
  { value: 'INR', label: 'Indian Rupee (₹)' },
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' },
]

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      {children}
    </section>
  )
}

function FieldLabel({ children, description }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700">{children}</p>
      {description && (
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      )}
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-blue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)

      if (saved) {
        const parsed = JSON.parse(saved)

        return {
          ...defaultSettings,
          ...parsed,
          providers: {
            ...defaultSettings.providers,
            ...parsed.providers,
          },
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }

    return {
      ...defaultSettings,
      providers: { ...defaultSettings.providers },
    }
  })

  const [saveMessage, setSaveMessage] = useState(null)

  useEffect(() => {
    if (!saveMessage) return

    const timeout = setTimeout(() => {
      setSaveMessage(null)
    }, 3000)

    return () => clearTimeout(timeout)
  }, [saveMessage])

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }))
    setSaveMessage(null)
  }

  const updateProvider = (provider, enabled) => {
    setSettings((previous) => ({
      ...previous,
      providers: {
        ...previous.providers,
        [provider]: enabled,
      },
    }))
    setSaveMessage(null)
  }

  const saveSettings = () => {
    const atLeastOneProvider = Object.values(settings.providers).some(Boolean)

    if (!atLeastOneProvider) {
      setSaveMessage({
        type: 'error',
        text: 'Please enable at least one cloud provider before saving.',
      })
      return
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
      setSaveMessage({
        type: 'success',
        text: 'Settings saved successfully!',
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.',
      })
    }
  }

  const resetSettings = () => {
    const resetValues = {
      ...defaultSettings,
      providers: { ...defaultSettings.providers },
    }

    setSettings(resetValues)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resetValues))
      setSaveMessage({
        type: 'success',
        text: 'Settings have been reset to defaults.',
      })
    } catch (error) {
      console.error('Error resetting settings:', error)
      setSaveMessage({
        type: 'error',
        text: 'Unable to reset settings.',
      })
    }
  }

  const inputClass =
    'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100'

  const providers = [
    {
      name: 'AWS',
      fullName: 'Amazon Web Services',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      name: 'Azure',
      fullName: 'Microsoft Azure',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      name: 'GCP',
      fullName: 'Google Cloud Platform',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  const optimizationOptions = [
    {
      value: 'cost',
      title: 'Cost Focused',
      description: 'Prioritize the lowest infrastructure cost.',
    },
    {
      value: 'balanced',
      title: 'Balanced',
      description: 'Balance cost, performance and reliability.',
    },
    {
      value: 'performance',
      title: 'Performance Focused',
      description: 'Prioritize performance over cost.',
    },
  ]

  const networkOptions = [
    { value: 'latency', label: 'Low Latency' },
    { value: 'availability', label: 'High Availability' },
    { value: 'balanced', label: 'Balanced' },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-blue-100 p-3 text-blue-700">
          <Settings2 size={24} />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure your cloud orchestration preferences.
          </p>
        </div>
      </div>

      {/* Local Settings Notice */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These settings are stored locally in your
          browser. They do not connect to cloud accounts or modify actual
          cloud infrastructure.
        </p>
      </div>

      {/* General Preferences */}
      <Section
        icon={Globe}
        title="General Preferences"
        description="Set your default region and currency."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <FieldLabel description="Region used as the default for new configurations.">
              Default Region
            </FieldLabel>

            <select
              className={inputClass}
              value={settings.defaultRegion}
              onChange={(e) =>
                updateSetting('defaultRegion', e.target.value)
              }
            >
              {regions.map((region) => (
                <option key={region.value} value={region.value}>
                  {region.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel description="Currency used when displaying estimated costs.">
              Preferred Currency
            </FieldLabel>

            <select
              className={inputClass}
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      {/* Cloud Providers */}
      <Section
        icon={Cloud}
        title="Cloud Providers"
        description="Select the cloud providers available for analysis and recommendations."
      >
        <div className="space-y-3">
          {providers.map((provider) => (
            <div
              key={provider.name}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3">
                <div className={`rounded-lg ${provider.bg} p-2`}>
                  <Cloud size={18} className={provider.color} />
                </div>

                <div>
                  <p className={`font-semibold ${provider.color}`}>
                    {provider.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {provider.fullName}
                  </p>
                </div>
              </div>

              <Toggle
                checked={settings.providers[provider.name]}
                onChange={(value) =>
                  updateProvider(provider.name, value)
                }
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Optimization Preferences */}
      <Section
        icon={SlidersHorizontal}
        title="Optimization Preferences"
        description="Choose how the platform should prioritize cloud recommendations."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {optimizationOptions.map((option) => {
            const selected = settings.optimizationMode === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  updateSetting('optimizationMode', option.value)
                }
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-semibold ${
                      selected ? 'text-blue-700' : 'text-slate-700'
                    }`}
                  >
                    {option.title}
                  </p>

                  {selected && (
                    <CheckCircle2 size={18} className="text-blue-600" />
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {option.description}
                </p>
              </button>
            )
          })}
        </div>
      </Section>

      {/* Network Preferences */}
      <Section
        icon={Network}
        title="Network Preferences"
        description="Set the default networking priority for your recommendations."
      >
        <div>
          <FieldLabel description="Used as the preferred network objective when evaluating configurations.">
            Network Priority
          </FieldLabel>

          <select
            className={inputClass}
            value={settings.networkPriority}
            onChange={(e) =>
              updateSetting('networkPriority', e.target.value)
            }
          >
            {networkOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Section>

      {/* Budget Preferences */}
      <Section
        icon={Wallet}
        title="Budget & Cost Preferences"
        description="Set a default budget and configure cost alert thresholds."
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <FieldLabel description="Default budget for new cloud deployments.">
              Default Budget ({settings.currency})
            </FieldLabel>

            <input
              type="number"
              min="0"
              className={inputClass}
              value={settings.defaultBudget}
              onChange={(e) =>
                updateSetting(
                  'defaultBudget',
                  Math.max(0, Number(e.target.value))
                )
              }
            />
          </div>

          <div>
            <FieldLabel description="Trigger an alert when budget usage reaches this percentage.">
              Budget Alert Threshold (%)
            </FieldLabel>

            <input
              type="number"
              min="1"
              max="100"
              className={inputClass}
              value={settings.alertThreshold}
              onChange={(e) =>
                updateSetting(
                  'alertThreshold',
                  Math.min(100, Math.max(1, Number(e.target.value)))
                )
              }
            />
          </div>
        </div>
      </Section>

      {/* Notifications */}
      <Section
        icon={Bell}
        title="Notifications"
        description="Choose which notifications you want to receive."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Budget Alerts
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Notify when estimated spending reaches the configured threshold.
              </p>
            </div>

            <Toggle
              checked={settings.budgetAlerts}
              onChange={(value) =>
                updateSetting('budgetAlerts', value)
              }
            />
          </div>

          <div className="border-t border-slate-200" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Optimization Notifications
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Notify when cost optimization recommendations are available.
              </p>
            </div>

            <Toggle
              checked={settings.optimizationAlerts}
              onChange={(value) =>
                updateSetting('optimizationAlerts', value)
              }
            />
          </div>
        </div>
      </Section>

      {/* Save Message */}
      {saveMessage && (
        <div
          role="status"
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            saveMessage.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span>{saveMessage.text}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={resetSettings}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <RotateCcw size={16} />
          Reset Defaults
        </button>

        <button
          type="button"
          onClick={saveSettings}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          <Save size={16} />
          Save Settings
        </button>
      </div>
    </div>
  )
}

export default Settings
