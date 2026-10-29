# Nulucre MCP Server

> **Model Context Protocol server for the [Nulucre](https://nulucre.com) wallet reputation API.**  
> Let AI agents score wallets on EVM, Stellar, XRPL, and Solana — and verify on-chain dataset integrity — without writing any API glue code.

## What it does

Nulucre scores wallets 0–100 based on on-chain signals: transaction history, asset diversity, protocol engagement, and more. This MCP server wraps those endpoints as six native tools any MCP-compatible AI agent can call.

| Tool | What it does |
|---|---|
| `nulucre_score_evm` | Score an EVM wallet (Ethereum, Base, Polygon, Arbitrum, Optimism) |
| `nulucre_score_stellar` | Score a Stellar wallet |
| `nulucre_score_xrpl` | Score an XRPL wallet |
| `nulucre_score_solana` | Score a Solana wallet |
| `nulucre_cohort_attestation` | Retrieve on-chain attestation for the baseline dataset |
| `nulucre_cohort_list` | List all available cohorts |

## Quick start

### With Claude Desktop / Claude Code

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nulucre": {
      "command": "npx",
      "args": ["-y", "nulucre-mcp"]
    }
  }
}
```

Then restart Claude and ask: *"What's the reputation score for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?"*

### With any MCP client

```bash
npx nulucre-mcp
```

The server communicates over stdio following the MCP 1.0 spec.

## Install

```bash
npm install nulucre-mcp
# or
npm install -g nulucre-mcp
```

Requires Node.js ≥ 18.

## Pricing

The first 10 EVM calls per day are free. Additional calls and all Stellar / XRPL / Solana calls use [x402 micropayments](https://nulucre.com/pricing) — the agent pays automatically with no API key required.

## On-chain attestation

The baseline 96-wallet dataset is cryptographically attested on four independent chains:

| Chain | Transaction |
|---|---|
| Stellar | [42549703…](https://stellar.expert/explorer/public/tx/42549703a5a7109faf89dfce55a2ed3bc90fe3d1cf16897de58ab408f7dbcf1a) |
| XRPL | [26DAF179…](https://livenet.xrpl.org/transactions/26DAF179C5F516A7B4D6B80D6ABF56222C57AC80141FDFFBE5AE01157D7CE3E7) |
| Solana | [JxH1jfjQ…](https://solscan.io/tx/JxH1jfjQGxwwpRRWEoNB1seQVeFf8txSttvqBv3oadjyA4WAh1JXEkc8fKQLW28SRGDSJQkZgjd5NKGip39t3k3) |
| Base | [0b2f6984…](https://basescan.org/tx/0b2f69845afb27f3b6cb41bf1383727c452975fcd11dc9a5a1961f20adea5ade) |

SHA-256: `111456014ae197486be3f5013fd04e4acbf1f4f251be843a8328db2dd4857746`

Call `nulucre_cohort_attestation` from any agent to verify this hash against all four chains in one step.

## Links

- **Website**: https://nulucre.com  
- **Verification page**: https://nulucre.com/verify.html  
- **API docs**: https://oracle.nulucre.com  
- **npm**: https://www.npmjs.com/package/nulucre-mcp

## License

MIT © Nulucre Inc.
