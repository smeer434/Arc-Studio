/**
 * AgentIdentity — shows a registered ERC-8004 agent's live onchain identity card.
 * Reads agentId → agentURI → parses registration JSON.
 */
import { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { ExternalLink, Cpu, Globe, ShieldCheck } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'

const ARC_TESTNET_CHAIN_ID = 5042002
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const

const identityAbi = [
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function',
    name: 'getAgentWallet',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function',
    name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

interface AgentRegistration {
  name?: string
  description?: string
  services?: { name: string; endpoint: string; version?: string }[]
  x402Support?: boolean
  active?: boolean
}

interface Props {
  agentId: bigint
  txHash: string
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function AgentIdentity({ agentId, txHash }: Props) {
  const [registration, setRegistration] = useState<AgentRegistration | null>(null)
  const [uriError, setUriError] = useState(false)

  const { data: agentURI } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'tokenURI',
    args: [agentId],
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: owner } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'ownerOf',
    args: [agentId],
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: wallet } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'getAgentWallet',
    args: [agentId],
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  // Parse registration JSON from URI (handles data URIs and HTTPS).
  // Data URIs are parsed synchronously outside of the effect to avoid
  // calling setState inside an effect; the effect only runs async fetches.
  const parsedFromDataUri: AgentRegistration | null = (() => {
    if (!agentURI?.startsWith('data:application/json;base64,')) return null
    try {
      const raw: unknown = JSON.parse(atob(agentURI.replace('data:application/json;base64,', '')))
      return raw as AgentRegistration
    } catch {
      return null
    }
  })()

  useEffect(() => {
    if (!agentURI) return
    if (agentURI.startsWith('data:application/json;base64,')) return // handled above
    if (agentURI.startsWith('https://') || agentURI.startsWith('http://')) {
      fetch(agentURI)
        .then((r) => r.json() as Promise<AgentRegistration>)
        .then((json) => setRegistration(json))
        .catch(() => setUriError(true))
    }
  }, [agentURI])

  // Use the data-URI parse or the fetched registration
  const effectiveRegistration = parsedFromDataUri ?? registration

  const explorerAgentUrl = `https://explorer.testnet.arc.io/address/${IDENTITY_REGISTRY}`

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--surface-strong)',
        border: '1px solid var(--border-strong)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(172,198,233,0.15)', border: '1px solid rgba(172,198,233,0.25)' }}
          >
            <Cpu size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <h2 className="display font-semibold text-lg" style={{ color: 'var(--ink)' }}>
              {effectiveRegistration?.name ?? `Agent #${agentId.toString()}`}
            </h2>
            <p className="text-xs mono" style={{ color: 'var(--subtle)' }}>
              ERC-8004 · ID {agentId.toString()}
            </p>
          </div>
        </div>
        {effectiveRegistration?.active !== false && (
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: 'rgba(141,216,159,0.15)', color: 'var(--success)', border: '1px solid rgba(141,216,159,0.3)' }}
          >
            Active
          </span>
        )}
      </div>

      {/* Description */}
      {effectiveRegistration?.description && (
        <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--muted)' }}>
          {effectiveRegistration.description}
        </p>
      )}

      {uriError && (
        <p className="text-sm mb-4" style={{ color: 'var(--subtle)' }}>
          (Registration JSON hosted off-chain — open the URI to view.)
        </p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Owner</p>
          <p className="mono text-sm" style={{ color: 'var(--ink-2)' }}>
            {owner ? formatAddress(owner) : '—'}
          </p>
        </div>
        <div
          className="rounded-xl px-4 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Agent Wallet</p>
          <p className="mono text-sm" style={{ color: 'var(--ink-2)' }}>
            {wallet && wallet !== '0x0000000000000000000000000000000000000000'
              ? formatAddress(wallet)
              : 'Not set'}
          </p>
        </div>
      </div>

      {/* x402 badge */}
      {effectiveRegistration?.x402Support && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4"
          style={{ background: 'rgba(172,198,233,0.08)', border: '1px solid rgba(172,198,233,0.2)' }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
          <span className="text-sm" style={{ color: 'var(--accent)' }}>
            x402 nanopayments supported
          </span>
        </div>
      )}

      {/* Services */}
      {effectiveRegistration?.services && effectiveRegistration.services.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--subtle)' }}>
            SERVICES
          </p>
          {effectiveRegistration.services.map((svc, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl px-4 py-3 mb-2"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <Globe size={14} style={{ color: 'var(--subtle)', flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--ink-2)' }}>{svc.name}</p>
                <p className="mono text-xs truncate" style={{ color: 'var(--subtle)' }}>{svc.endpoint}</p>
              </div>
              {svc.version && (
                <span className="ml-auto text-xs mono" style={{ color: 'var(--subtle)' }}>
                  v{svc.version}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Explorer links */}
      <div className="flex gap-3 flex-wrap">
        <a
          href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          Registration tx <ExternalLink size={11} />
        </a>
        <a
          href={explorerAgentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: 'var(--subtle)' }}
        >
          Registry contract <ExternalLink size={11} />
        </a>
      </div>
    </div>
  )
}
