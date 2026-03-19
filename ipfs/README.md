# NeuroVault IPFS Service

A standalone **Express.js** server for pinning JSON data to **IPFS via Pinata**. Used for uploading AI reasoning artifacts, proposal metadata, and any structured data that needs permanent, content-addressed storage.

> **Note**: The NeuroVault agent (`agent/`) now calls Pinata's REST API directly for reasoning blob pinning. This standalone server is available for independent use, testing, and integration with other services.

---

## How It Works

```
Client (POST /upload)
    │
    ▼
┌──────────────────────┐
│  Express Server      │
│  (server.js)         │
│                      │
│  1. Receive JSON     │
│  2. Wrap in payload  │
│  3. Pin via Pinata   │
│  4. Return CID + URL │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Pinata Cloud        │
│                      │
│  pinJSONToIPFS()     │
│  → IPFS CID          │
│  → Gateway URL       │
└──────────────────────┘
```

---

## Pinata Integration

### SDK

Uses the official `@pinata/sdk` Node.js package:

```javascript
const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);
```

### Pinning Flow

1. Client sends JSON data via `POST /upload`
2. Server wraps it in a payload:
   ```json
   {
     "source": "Polkadot Hackathon AI",
     "content": "<your data>"
   }
   ```
3. Calls `pinata.pinJSONToIPFS(payload)`
4. Pinata pins the JSON to IPFS and returns the CID
5. Server responds with CID and gateway URL

### Response Format

```json
{
  "success": true,
  "cid": "QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh",
  "url": "https://gateway.pinata.cloud/ipfs/QmSw6TEwXRiSZsUsmuhyPfbLcoNeGFQdebCQFKSVWUS1Sh"
}
```

### Viewing Pinned Content

Any pinned content is accessible via the Pinata gateway:

```
https://gateway.pinata.cloud/ipfs/<CID>
```

Content is permanent and content-addressed — the CID is derived from the data itself, so the same input always produces the same CID.

---

## API

### POST `/upload`

Pin JSON data to IPFS.

**Request:**

```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -d '{"data": "Hello from the AI! This is my test data."}'
```

**Request Body:**

```json
{
  "data": "any JSON-serializable value (string, object, array, etc.)"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "cid": "Qm...",
  "url": "https://gateway.pinata.cloud/ipfs/Qm..."
}
```

**Error Response (400):**

```json
{
  "error": "No AI data sent!"
}
```

**Error Response (500):**

```json
{
  "error": "Failed to upload to IPFS"
}
```

---

## Environment Variables

Create a `.env` file in this directory:

```env
# Required — Pinata credentials
PINATA_API_KEY=your_pinata_api_key
PINATA_API_SECRET=your_pinata_api_secret

# Optional — server port (default: 3000)
PORT=3000
```

Get your Pinata API keys at: https://app.pinata.cloud/developers/api-keys

---

## Quick Start

```bash
# Install dependencies
npm install

# Create .env with your Pinata keys
echo "PINATA_API_KEY=your_key" > .env
echo "PINATA_API_SECRET=your_secret" >> .env

# Start the server
node server.js
# → 🚀 IPFS Server is running on http://localhost:3000
```

### Test Upload

```bash
# Run the test script
node test.js
# → Response from server: { success: true, cid: "Qm...", url: "https://..." }
```

Or test manually with curl:

```bash
curl -X POST http://localhost:3000/upload \
  -H "Content-Type: application/json" \
  -d '{"data": {"action": "stake", "amount": 5000, "reasoning": "Test reasoning blob"}}'
```

---

## Files

| File | Description |
|------|-------------|
| `server.js` | Express server — receives JSON, pins to IPFS via Pinata SDK |
| `test.js` | Test script — sends sample data to the upload endpoint |
| `package.json` | Dependencies: express, cors, @pinata/sdk, dotenv |

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `express` | HTTP server |
| `cors` | Cross-origin requests |
| `@pinata/sdk` | Pinata IPFS pinning SDK |
| `dotenv` | Environment variable loading |

---

## How the Agent Uses IPFS Differently

The standalone IPFS server uses the **Pinata SDK** (`@pinata/sdk`). The NeuroVault agent (`agent/src/ipfs.ts`) calls the **Pinata REST API** directly with JWT auth instead:

```
Agent approach (agent/src/ipfs.ts):
  POST https://api.pinata.cloud/pinning/pinJSONToIPFS
  Authorization: Bearer <PINATA_JWT>

Standalone server approach (ipfs/server.js):
  pinata.pinJSONToIPFS(payload)  // SDK handles auth via API key/secret
```

Both produce the same result — a permanent IPFS CID accessible via the Pinata gateway. The agent uses direct REST calls to avoid the SDK dependency and have more control over error handling and fallback behavior.
