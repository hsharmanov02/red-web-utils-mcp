# mcp-red-web-utils

MCP server exposing 17 pay-per-call utilities (web reading, SEC/EDGAR, sanctions screening, insider + 13F holdings, UK/US case law, UK legislation, Base deployer intel, swap routing). Payments: x402, USDC on Base, per call $0.001-$0.005.

## Remote (no install)

POST streamable-HTTP MCP to `https://red-web-utils.agent-tools-x402.workers.dev/mcp` (`initialize`, `tools/list`, `tools/call`). Unpaid calls return a 402 x402/MPP challenge; retry with the payment credential.

## Stdio

```json
{
  "mcpServers": {
    "red-web-utils": {
      "command": "npx",
      "args": ["-y", "mcp-red-web-utils"],
      "env": { "RED_UTILS_PRIVATE_KEY": "0x..." }
    }
  }
}
```
