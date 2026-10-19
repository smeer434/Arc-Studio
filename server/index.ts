/**
 * Onchain Agent — Express backend
 *
 * Exposes two routes:
 *   POST /analyze   — x402-gated, returns a mock onchain analysis result
 *   POST /summarize — x402-gated, returns a mock governance summary
 *
 * Uses Circle Gateway Nanopayments via @circle-fin/x402-batching.
 * The seller receive address is read from VITE_SELLER_ADDRESS in .env.
 */

import express from 'express'
import cors from 'cors'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())
app.use(cors())

const sellerAddress = process.env.VITE_SELLER_ADDRESS
if (!sellerAddress) {
  console.error('[server] VITE_SELLER_ADDRESS not set — x402 gateway will not start.')
  process.exit(1)
}

const gateway = createGatewayMiddleware({
  sellerAddress: sellerAddress as `0x${string}`,
})

// Health check — no payment required
app.get('/health', (_req, res) => {
  res.json({ ok: true, sellerAddress })
})

// Paid route: onchain data analysis
app.post('/analyze', gateway.require('$0.01'), (req, res) => {
  const { query } = req.body as { query?: string }
  res.json({
    result: `Onchain analysis for: "${query ?? 'no query'}"`,
    blocksScanned: 5000,
    eventsFound: Math.floor(Math.random() * 42),
    timestamp: new Date().toISOString(),
  })
})

// Paid route: governance proposal summary
app.post('/summarize', gateway.require('$0.005'), (req, res) => {
  const { proposalId } = req.body as { proposalId?: string }
  res.json({
    proposalId: proposalId ?? 'unknown',
    summary: `This proposal aims to adjust protocol parameters. Key points: fee reduction of 0.1%, quorum raised to 10%. Voting ends in 3 days.`,
    sentiment: 'neutral',
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT ?? 3001
app.listen(PORT, () => {
  console.log(`[server] Agent API running on :${PORT}`)
  console.log(`[server] Seller address: ${sellerAddress}`)
})
