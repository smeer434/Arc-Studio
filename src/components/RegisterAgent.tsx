/**
 * RegisterAgent — registers an ERC-8004 agent identity on Arc Testnet
 * by calling the IdentityRegistry.register(agentURI) function.
 */
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEventLogs } from 'viem'
import { ExternalLink, Bot, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { buildTxExplorerUrl } from '@/onchain-facts'
import { toast } from 'sonner'

const ARC_TESTNET_CHAIN_ID = 5042002
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const

const identityAbi = [
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'agentURI', type: 'string' }],
    outputs: [{ name: 'agentId', type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Registered',
    inputs: [
      { name: 'agentId', type: 'uint256', indexed: true },
      { name: 'agentURI', type: 'string', indexed: false },
      { name: 'owner', type: 'address', indexed: true },
    ],
  },
] as const

interface Props {
  onRegistered: (agentId: bigint, txHash: string) => void
}

export function RegisterAgent({ onRegistered }: Props) {
  const { chainId, isConnected } = useAccount()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const [agentName, setAgentName] = useState('My Onchain Agent')
  const [agentDescription, setAgentDescription] = useState('An AI agent that analyzes onchain data for a fee.')
  const [serviceEndpoint, setServiceEndpoint] = useState('https://your-agent.example.com/api')

  const isWrongChain = isConnected && chainId !== ARC_TESTNET_CHAIN_ID

  // Build the registration JSON inline (in production, host this on IPFS)
  const buildAgentURI = () => {
    const registrationJson = {
      type: 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1',
      name: agentName,
      description: agentDescription,
      services: [{ name: 'A2A', endpoint: serviceEndpoint, version: '1.0.0' }],
      x402Support: true,
      active: true,
      registrations: [],
      supportedTrust: ['reputation'],
    }
    // Encode as a data URI for demo purposes (production: upload to IPFS/HTTPS)
    return 'data:application/json;base64,' + btoa(JSON.stringify(registrationJson))
  }

  const { writeContract, data: txHash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({ hash: txHash })

  // Parse agentId from receipt when confirmed
  if (isSuccess && receipt && txHash) {
    try {
      const logs = parseEventLogs({ abi: identityAbi, eventName: 'Registered', logs: receipt.logs })
      if (logs.length > 0) {
        onRegistered(logs[0].args.agentId, txHash)
      }
    } catch {
      // parsing may run multiple times; ignore duplicates
    }
  }

  const handleRegister = () => {
    if (!isConnected) { toast.error('Connect your wallet first.'); return }
    if (isWrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (!agentName.trim() || !serviceEndpoint.trim()) {
      toast.error('Fill in a name and service endpoint.')
      return
    }
    writeContract({
      address: IDENTITY_REGISTRY,
      abi: identityAbi,
      functionName: 'register',
      args: [buildAgentURI()],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  const errorMessage = writeError
    ? writeError.message.includes('user rejected')
      ? null
      : writeError.message.split('\n')[0]
    : null

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
          <Bot size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 className="display font-semibold text-base" style={{ color: 'var(--ink)' }}>
            Register Agent Identity
          </h2>
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            ERC-8004 on Arc Testnet
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
            Agent Name
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            disabled={isPending || isConfirming}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
            placeholder="My Onchain Agent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
            Description
          </label>
          <textarea
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
            disabled={isPending || isConfirming}
            rows={2}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
            placeholder="What does this agent do?"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
            Service Endpoint
          </label>
          <input
            type="url"
            value={serviceEndpoint}
            onChange={(e) => setServiceEndpoint(e.target.value)}
            disabled={isPending || isConfirming}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none font-mono"
            style={{
              background: 'var(--surface-muted)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
            }}
            placeholder="https://your-agent.example.com/api"
          />
        </div>
      </div>

      {/* Status */}
      {isSuccess && txHash && (
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: 'rgba(141,216,159,0.12)', border: '1px solid rgba(141,216,159,0.3)' }}
        >
          <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          <span style={{ color: 'var(--success)' }}>Registered on-chain!</span>
          <a
            href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            View <ExternalLink size={12} />
          </a>
        </div>
      )}

      {errorMessage && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 mb-4 text-sm"
          style={{ background: 'rgba(232,109,122,0.12)', border: '1px solid rgba(232,109,122,0.3)' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} className="mt-0.5" />
          <span style={{ color: 'var(--danger)' }} className="break-all">{errorMessage}</span>
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={!isConnected || isPending || isConfirming}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
        style={{
          background: isWrongChain ? 'rgba(172,198,233,0.2)' : 'var(--accent)',
          color: isWrongChain ? 'var(--accent)' : '#0d1b2f',
          border: isWrongChain ? '1px solid var(--accent)' : 'none',
          opacity: !isConnected || isPending || isConfirming ? 0.5 : 1,
          cursor: !isConnected || isPending || isConfirming ? 'not-allowed' : 'pointer',
        }}
      >
        {isSwitching || isPending || isConfirming ? (
          <Loader2 size={16} className="animate-spin" />
        ) : null}
        {!isConnected
          ? 'Connect Wallet'
          : isWrongChain
          ? 'Switch to Arc Testnet'
          : isSwitching
          ? 'Switching...'
          : isPending
          ? 'Confirm in wallet...'
          : isConfirming
          ? 'Registering...'
          : 'Register Agent'}
      </button>

      <p className="text-xs mt-3 text-center" style={{ color: 'var(--subtle)' }}>
        ~0.006 USDC in gas. Get test USDC from the sidebar faucet.
      </p>
    </div>
  )
}
