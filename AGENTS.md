# Onchain Agent

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

Registers an AI agent's identity onchain using ERC-8004 (IdentityRegistry on Arc Testnet), and monetizes the agent's API endpoints via x402 Circle Gateway Nanopayments. The app has three panels: Register Agent (mint ERC-8004 token), Lookup Agent (read any agent's onchain identity), and Pay (demo the x402 payment gate).

## Key Addresses (Arc Testnet)

| Contract | Address |
|---|---|
| ERC-8004 IdentityRegistry | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| ERC-8004 ReputationRegistry | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| ERC-8004 ValidationRegistry | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` |
| USDC (ERC-20) | `0x3600000000000000000000000000000000000000` |

## x402 Backend

- Backend runs on port 3001 via `bun run server`
- Two paid routes: `POST /analyze` ($0.01 USDC) and `POST /summarize` ($0.005 USDC)
- Gated by Circle Gateway Nanopayments via `@circle-fin/x402-batching`
- **Set `VITE_SELLER_ADDRESS` in `.env` to your EVM receive address before production use**

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
