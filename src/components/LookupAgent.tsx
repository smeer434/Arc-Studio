/**
 * LookupAgent — look up any ERC-8004 agent by ID on Arc Testnet.
 * Reads ownerOf, getAgentWallet, and tokenURI from the IdentityRegistry.
 */
import { useState } from 'react'
import { useReadContract } from 'wagmi'
import { Search, ExternalLink } from 'lucide-react'

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

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function LookupAgent() {
  const [inputId, setInputId] = useState('')
  const [agentId, setAgentId] = useState<bigint | null>(null)
  const [error, setError] = useState('')

  const { data: owner, error: ownerError } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'ownerOf',
    args: [agentId ?? 0n],
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: agentId !== null },
  })

  const { data: wallet } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'getAgentWallet',
    args: [agentId ?? 0n],
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: agentId !== null },
  })

  const { data: uri } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: identityAbi,
    functionName: 'tokenURI',
    args: [agentId ?? 0n],
    chainId: ARC_TESTNET_CHAIN_ID,
    query: { enabled: agentId !== null },
  })

  const handleLookup = () => {
    setError('')
    const num = parseInt(inputId, 10)
    if (isNaN(num) || num < 0) {
      setError('Enter a valid agent ID (non-negative integer)')
      return
    }
    setAgentId(BigInt(num))
  }

  const notFound = ownerError?.message?.includes('ERC721NonexistentToken')

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
          <Search size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="display font-semibold text-base" style={{ color: 'var(--ink)' }}>
            Lookup Agent
          </h2>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            By ERC-8004 agent ID
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          min={0}
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          placeholder="Agent ID (e.g. 1)"
          className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          style={{
            background: 'var(--surface-muted)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
          }}
        />
        <button
          onClick={handleLookup}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
          style={{
            background: 'var(--accent)',
            color: '#0d1b2f',
          }}
        >
          Look up
        </button>
      </div>

      {error && (
        <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {agentId !== null && (
        <>
          {notFound ? (
            <p className="text-sm" style={{ color: 'var(--subtle)' }}>
              Agent #{agentId.toString()} does not exist in the registry.
            </p>
          ) : owner ? (
            <div className="space-y-2">
              <Row label="Agent ID" value={agentId.toString()} mono />
              <Row label="Owner" value={formatAddress(owner)} mono />
              <Row
                label="Agent Wallet"
                value={
                  wallet && wallet !== '0x0000000000000000000000000000000000000000'
                    ? formatAddress(wallet)
                    : 'Not set'
                }
                mono
              />
              {uri && (
                <div
                  className="rounded-xl px-4 py-3 mt-1"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Agent URI</p>
                  <p className="mono text-xs break-all" style={{ color: 'var(--ink-2)' }}>
                    {uri.startsWith('data:') ? uri.slice(0, 60) + '...' : uri}
                  </p>
                  {!uri.startsWith('data:') && (
                    <a
                      href={uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs mt-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      Open registration file <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm" style={{ color: 'var(--subtle)' }}>Loading...</p>
          )}
        </>
      )}
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-3"
      style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
    >
      <span className="text-xs" style={{ color: 'var(--subtle)' }}>{label}</span>
      <span className={`text-sm ${mono ? 'mono' : ''}`} style={{ color: 'var(--ink-2)' }}>
        {value}
      </span>
    </div>
  )
}
