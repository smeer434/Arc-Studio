/**
 * PayAgent — demonstrates calling the x402-gated agent endpoints.
 * The frontend hits /api/analyze and /api/summarize through the Vite proxy.
 * Because we're testing from a browser (not an agent wallet), the server
 * returns the 402 details so users can see the payment requirements.
 * A real agentic caller would use `circle services pay` or the x402 client SDK.
 */
import { useState } from 'react'
import { Zap, DollarSign, ChevronRight, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface EndpointConfig {
  path: string
  label: string
  price: string
  description: string
  bodyKey: string
  bodyPlaceholder: string
}

const ENDPOINTS: EndpointConfig[] = [
  {
    path: '/api/analyze',
    label: 'Analyze Onchain Data',
    price: '$0.01 USDC',
    description: 'Scan recent blocks for events matching a query',
    bodyKey: 'query',
    bodyPlaceholder: 'Transfer events for USDC token',
  },
  {
    path: '/api/summarize',
    label: 'Summarize Governance Proposal',
    price: '$0.005 USDC',
    description: 'Get an AI summary of a governance proposal',
    bodyKey: 'proposalId',
    bodyPlaceholder: 'prop-42',
  },
]

interface ApiResponse {
  status: number
  body: unknown
}

function copyToClipboard(text: string) {
  void navigator.clipboard.writeText(text).then(() => toast.success('Copied!'))
}

export function PayAgent() {
  const [activeEndpoint, setActiveEndpoint] = useState<EndpointConfig>(ENDPOINTS[0])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<ApiResponse | null>(null)

  const callEndpoint = async () => {
    setLoading(true)
    setResponse(null)
    try {
      const res = await fetch(activeEndpoint.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [activeEndpoint.bodyKey]: inputValue || activeEndpoint.bodyPlaceholder }),
      })
      const body = await res.json() as unknown
      setResponse({ status: res.status, body })
    } catch (err) {
      setResponse({ status: 0, body: { error: String(err) } })
    } finally {
      setLoading(false)
    }
  }

  const is402 = response?.status === 402
  const is200 = response?.status === 200
  const isError = response !== null && !is402 && !is200

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(172,198,233,0.15)' }}
        >
          <Zap size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="display font-semibold text-base" style={{ color: 'var(--ink)' }}>
            Paid Agent Endpoints
          </h2>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            x402 Gateway Nanopayments
          </p>
        </div>
      </div>

      {/* Endpoint selector */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.path}
            onClick={() => { setActiveEndpoint(ep); setResponse(null) }}
            className="rounded-xl px-3 py-3 text-left transition-all"
            style={{
              background: activeEndpoint.path === ep.path ? 'var(--surface-strong)' : 'var(--surface-muted)',
              border: activeEndpoint.path === ep.path ? '1px solid var(--border-strong)' : '1px solid var(--border)',
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--ink)' }}>{ep.label}</p>
            <div className="flex items-center gap-1.5">
              <DollarSign size={10} style={{ color: 'var(--success)' }} />
              <span className="text-xs" style={{ color: 'var(--success)' }}>{ep.price}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="mb-4">
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
          {activeEndpoint.bodyKey.charAt(0).toUpperCase() + activeEndpoint.bodyKey.slice(1)}
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={activeEndpoint.bodyPlaceholder}
          disabled={loading}
          className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
        />
      </div>

      <button
        onClick={() => { void callEndpoint() }}
        disabled={loading}
        className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: 'rgba(172,198,233,0.15)',
          border: '1px solid rgba(172,198,233,0.3)',
          color: 'var(--accent)',
          opacity: loading ? 0.5 : 1,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
        {loading ? 'Calling...' : `Call ${activeEndpoint.label}`}
      </button>

      {/* Explanation */}
      <p className="text-xs mt-3 mb-4" style={{ color: 'var(--subtle)' }}>
        Without a paid x402 token, the server returns{' '}
        <span className="mono" style={{ color: 'var(--accent)' }}>402 Payment Required</span>.
        Real agents pay via{' '}
        <span className="mono" style={{ color: 'var(--muted)' }}>circle services pay</span>{' '}
        or the x402 client SDK.
      </p>

      {/* Response */}
      {response && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${is200 ? 'rgba(141,216,159,0.3)' : is402 ? 'rgba(172,198,233,0.3)' : 'rgba(232,109,122,0.3)'}` }}
        >
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              background: is200
                ? 'rgba(141,216,159,0.08)'
                : is402
                ? 'rgba(172,198,233,0.08)'
                : 'rgba(232,109,122,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              {is200 ? (
                <CheckCircle size={14} style={{ color: 'var(--success)' }} />
              ) : isError ? (
                <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
              ) : (
                <Zap size={14} style={{ color: 'var(--accent)' }} />
              )}
              <span
                className="text-xs font-semibold mono"
                style={{ color: is200 ? 'var(--success)' : is402 ? 'var(--accent)' : 'var(--danger)' }}
              >
                HTTP {response.status === 0 ? 'ERR' : response.status}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(JSON.stringify(response.body, null, 2))}
              className="p-1 rounded"
              style={{ color: 'var(--subtle)' }}
            >
              <Copy size={12} />
            </button>
          </div>
          <pre
            className="text-xs p-4 overflow-auto max-h-48"
            style={{ color: 'var(--muted)', background: 'var(--surface-muted)' }}
          >
            {JSON.stringify(response.body, null, 2)}
          </pre>
        </div>
      )}

      {is402 && (
        <div className="mt-3 rounded-xl px-4 py-3" style={{ background: 'rgba(172,198,233,0.06)', border: '1px solid rgba(172,198,233,0.15)' }}>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            To pay from an agent wallet, run:
          </p>
          <pre
            className="text-xs mt-1.5 overflow-auto"
            style={{ color: 'var(--accent)' }}
          >
{`circle services pay "${window.location.origin}${activeEndpoint.path}" \\
  -X POST \\
  --address <your-wallet> \\
  --chain ARC-TESTNET \\
  --max-amount 0.01`}
          </pre>
        </div>
      )}
    </div>
  )
}
