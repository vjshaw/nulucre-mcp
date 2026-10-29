#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

const ORACLE = 'https://oracle.nulucre.com';

const TOOLS = [
  {
    name: 'nulucre_score_evm',
    description: 'Get a trust/reputation score for an EVM wallet address (Ethereum, Base, Polygon, Arbitrum, Optimism). Returns a 0-100 score, status label, signal breakdown, and chain activity. First 10 calls per day are free; subsequent calls require x402 micropayment.',
    inputSchema: { type: 'object', properties: { address: { type: 'string', description: 'EVM wallet address (0x...)' } }, required: ['address'] },
  },
  {
    name: 'nulucre_score_stellar',
    description: 'Get a trust/reputation score for a Stellar wallet address (G...). Returns a 0-100 score, status, and signal breakdown. Requires x402 micropayment.',
    inputSchema: { type: 'object', properties: { address: { type: 'string', description: 'Stellar public key (G...)' } }, required: ['address'] },
  },
  {
    name: 'nulucre_score_xrpl',
    description: 'Get a trust/reputation score for an XRPL wallet address (r...). Returns a 0-100 score, status, and signal breakdown. Requires x402 micropayment.',
    inputSchema: { type: 'object', properties: { address: { type: 'string', description: 'XRPL wallet address (r...)' } }, required: ['address'] },
  },
  {
    name: 'nulucre_score_solana',
    description: 'Get a trust/reputation score for a Solana wallet address. Returns a 0-100 score, status, and signal breakdown. Requires x402 micropayment.',
    inputSchema: { type: 'object', properties: { address: { type: 'string', description: 'Solana wallet address (base58)' } }, required: ['address'] },
  },
  {
    name: 'nulucre_cohort_attestation',
    description: 'Retrieve the on-chain attestation record for the Nulucre baseline cohort. Returns the SHA-256 hash of the 96-wallet dataset and transaction IDs on Stellar, Base, Solana, and XRPL.',
    inputSchema: { type: 'object', properties: { cohort_id: { type: 'string', description: 'Cohort identifier (default: jan2027-v1)', default: 'jan2027-v1' } }, required: [] },
  },
  {
    name: 'nulucre_cohort_list',
    description: 'List all available Nulucre cohorts with record counts and attestation status.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

async function callTool(name, args) {
  try {
    switch (name) {
      case 'nulucre_score_evm': {
        const r = await axios.get(`${ORACLE}/reputation/evm/${args.address}`, { timeout: 15000 });
        return formatScore('EVM', args.address, r.data);
      }
      case 'nulucre_score_stellar': {
        const r = await axios.get(`${ORACLE}/reputation/stellar/${args.address}`, { timeout: 15000 });
        return formatScore('Stellar', args.address, r.data);
      }
      case 'nulucre_score_xrpl': {
        const r = await axios.get(`${ORACLE}/reputation/xrpl/${args.address}`, { timeout: 15000 });
        return formatScore('XRPL', args.address, r.data);
      }
      case 'nulucre_score_solana': {
        const r = await axios.get(`${ORACLE}/reputation/solana/${args.address}`, { timeout: 15000 });
        return formatScore('Solana', args.address, r.data);
      }
      case 'nulucre_cohort_attestation': {
        const id = args.cohort_id || 'jan2027-v1';
        const r = await axios.get(`${ORACLE}/cohort/${id}/attestation`, { timeout: 10000 });
        const d = r.data;
        const chains = Object.entries(d.chains || {})
          .filter(([k]) => k !== 'ethereum')
          .map(([chain, info]) => `  ${chain}: ${info.tx}\n    Explorer: ${info.explorer}`)
          .join('\n');
        return [
          `Nulucre Cohort Attestation - ${id}`,
          `Snapshot date: ${d.snapshot_date}`,
          `SHA-256 hash: ${d.sha256}`,
          `Record count: ${d.record_count} wallets`,
          `Attested at: ${d.attested_at}`,
          `\nOn-chain records:\n${chains}`,
        ].join('\n');
      }
      case 'nulucre_cohort_list': {
        const r = await axios.get(`${ORACLE}/cohort`, { timeout: 10000 });
        const cohorts = Object.values(r.data.cohorts || r.data);
        return cohorts.map(c => `${c.cohort_id}: ${c.record_count} records, attested=${c.attested || false}`).join('\n');
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (err) {
    if (err.response?.status === 402) return 'Payment required (x402). See https://nulucre.com for pricing.';
    return `Error calling ${name}: ${err.message}`;
  }
}

function formatScore(chain, address, data) {
  const score = data.score ?? 'N/A';
  const status = data.status ?? 'unknown';
  const breakdown = data.breakdown ?? {};
  const signals = Object.entries(breakdown)
    .map(([k, v]) => `  ${k}: ${v?.score ?? v}`)
    .join('\n');
  return [
    `Nulucre Reputation Score - ${chain}`,
    `Address: ${address}`,
    `Score: ${score}/100`,
    `Status: ${status}`,
    signals ? `\nSignal breakdown:\n${signals}` : '',
  ].filter(Boolean).join('\n');
}

const server = new Server(
  { name: 'nulucre', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const text = await callTool(name, args || {});
  return { content: [{ type: 'text', text }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Nulucre MCP server running');
