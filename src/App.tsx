import { useState } from 'react'
import { ConnectKitButton } from 'connectkit'
import { Bot, Search, Zap } from 'lucide-react'
import { RegisterAgent } from './components/RegisterAgent'
import { AgentIdentity } from './components/AgentIdentity'
import { LookupAgent } from './components/LookupAgent'
import { PayAgent } from './components/PayAgent'

type Tab = 'register' | 'lookup' | 'pay'

interface RegisteredAgent {
  agentId: bigint
  txHash: string
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('register')
  const [registeredAgent, setRegisteredAgent] = useState<RegisteredAgent | null>(null)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'register', label: 'Register', icon: <Bot size={15} /> },
    { id: 'lookup', label: 'Lookup', icon: <Search size={15} /> },
    { id: 'pay', label: 'Pay', icon: <Zap size={15} /> },
  ]

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 py-3"
        style={{
          background: 'rgba(13,27,47,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="display font-semibold text-base" style={{ color: 'var(--ink)' }}>
              Onchain Agent
            </h1>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>
              ERC-8004 identity · x402 payments · Arc Testnet
            </p>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-20">
        {/* Tab bar */}
        <div
          className="flex gap-1 rounded-2xl p-1 mb-6"
          style={{ background: 'var(--surface-muted)' }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium transition-all"
              style={
                activeTab === tab.id
                  ? {
                      background: 'var(--surface-strong)',
                      color: 'var(--accent)',
                      border: '1px solid var(--border-strong)',
                    }
                  : {
                      color: 'var(--subtle)',
                      border: '1px solid transparent',
                    }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'register' && (
          <div className="space-y-4">
            <RegisterAgent
              onRegistered={(agentId, txHash) => {
                setRegisteredAgent({ agentId, txHash })
              }}
            />
            {registeredAgent && (
              <AgentIdentity
                agentId={registeredAgent.agentId}
                txHash={registeredAgent.txHash}
              />
            )}
          </div>
        )}

        {activeTab === 'lookup' && <LookupAgent />}
        {activeTab === 'pay' && <PayAgent />}

        {/* Info callout */}
        <div
          className="mt-6 rounded-2xl px-5 py-4"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <h3 className="display text-sm font-semibold mb-2" style={{ color: 'var(--ink-2)' }}>
            How it works
          </h3>
          <ol className="space-y-2">
            {[
              'Connect your wallet (Arc Testnet). Get test USDC from the sidebar.',
              'Register your agent: mints an ERC-8004 token on Arc with your name, description, and service endpoint.',
              'The x402 backend enforces pay-per-call via Circle Gateway Nanopayments.',
              'Real agent callers pay with circle services pay or the x402 client SDK.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(172,198,233,0.15)', color: 'var(--accent)' }}
                >
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  )
}
