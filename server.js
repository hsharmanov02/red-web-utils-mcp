#!/usr/bin/env node
// red-web-utils MCP server (stdio). Each tool call is paid per call with USDC
// on Base via x402, using the caller's own wallet key supplied as env config.
// Env: RED_UTILS_PRIVATE_KEY (0x-prefixed EVM key with USDC on Base), or
// RED_UTILS_PAID=false to only list tools (calls will return the 402 challenge).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { wrapFetchWithPayment } from "x402-fetch";
import { privateKeyToAccount } from "viem/accounts";
import { z } from "zod";

const BASE = "https://red-web-utils.agent-tools-x402.workers.dev";

const TOOLS = [
  ["reader", "Read any web page as clean text", { url: z.string().url() }],
  ["metadata", "Extract title/description/OG metadata from a URL", { url: z.string().url() }],
  ["rss", "Parse an RSS/Atom feed into JSON", { url: z.string().url() }],
  ["links", "Extract all links from a web page", { url: z.string().url() }],
  ["newpairs", "New Base token pairs from the internal scanner", {}],
  ["deployer", "Base token deployer profile", { address: z.string() }],
  ["deployer_score", "Base deployer reputation score (unique dataset)", { address: z.string() }],
  ["swap_route", "0x swap quote across chains", { fromToken: z.string(), toToken: z.string(), fromAmount: z.string(), fromAddress: z.string(), fromChain: z.string().optional(), toChain: z.string().optional(), slippage: z.string().optional() }],
  ["edgar_search", "Search SEC EDGAR full-text filings", { q: z.string(), from: z.string().optional(), to: z.string().optional() }],
  ["edgar_company", "SEC company facts by ticker or CIK", { ticker: z.string().optional(), cik: z.string().optional() }],
  ["sanctions_check", "OFAC + UK OFSI sanctions screening", { name: z.string() }],
  ["insiders", "Latest SEC Form 4 insider transactions", { limit: z.string().optional() }],
  ["holdings", "Institutional 13F holdings by CIK or manager name", { cik: z.string().optional(), name: z.string().optional() }],
  ["caselaw_search", "Search UK case law (National Archives)", { q: z.string() }],
  ["caselaw_fetch", "Fetch a UK judgment by path", { path: z.string() }],
  ["legislation_search", "Search UK legislation (legislation.gov.uk)", { q: z.string() }],
  ["caselaw_us", "Search US case law (CourtListener)", { q: z.string(), court: z.string().optional() }],
];

const key = process.env.RED_UTILS_PRIVATE_KEY;
let fetchFn = fetch;
if (key) {
  const account = privateKeyToAccount(key);
  fetchFn = wrapFetchWithPayment(fetch, account);
}

const server = new McpServer({ name: "red-web-utils", version: "1.0.0" });
for (const [name, desc, shape] of TOOLS) {
  server.tool(name, desc + " (paid per call, USDC on Base via x402)", shape, async (args) => {
    const u = new URL(`${BASE}/api/${name.replace(/_/g, "/")}`);
    for (const [k, v] of Object.entries(args)) if (v !== undefined) u.searchParams.set(k, String(v));
    const res = await fetchFn(u);
    const text = await res.text();
    return { content: [{ type: "text", text }], isError: res.status >= 400 };
  });
}
const transport = new StdioServerTransport();
await server.connect(transport);
