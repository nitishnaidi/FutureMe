# FutureMe

FutureMe lets an AI assistant or client **seal a private message now and deliver it later** without exposing the stored message body through normal APIs or MCP tools.

## Why

A normal scheduled email remains readable before delivery. FutureMe is designed for letters, reflections, predictions, and reminders that you want to experience later without casually rereading them.

## Core security contract

After a message is sealed, normal application and AI interfaces **never return its plaintext content**.

Allowed:

```text
seal_future_message(message, deliverAt, timezone, destination)
get_delivery_status(id)
reschedule_message(id, newDate)
cancel_message(id)
```

Intentionally not implemented:

```text
read_message(id)
list_message_content(id)
```

This is an application-level non-retrieval guarantee, not irreversible deletion. A sufficiently privileged infrastructure administrator with access to encrypted storage and encryption keys could potentially recover content. Production deployments should separate storage and key-management permissions and audit privileged access.

## Architecture

```text
Claude / ChatGPT / Client
          |
          v
 FutureMe REST / MCP
          |
          v
 Encrypt before persistence
          |
          +----> safe operational metadata
          |
          +----> encrypted message payload
          |
          v
 Scheduled delivery worker
          |
          v
 Email / Push / SMS
```

The client receives metadata only:

```json
{
  "id": "fm_123",
  "deliverAt": "2027-03-28T09:00:00",
  "timezone": "America/Chicago",
  "status": "SEALED"
}
```

## MVP API

```http
POST   /future-messages
GET    /future-messages/:id/status
PATCH  /future-messages/:id/schedule
DELETE /future-messages/:id
```

There is deliberately no endpoint for retrieving message content.

### Seal a message

```json
POST /future-messages

{
  "message": "A private letter to my future self...",
  "deliverAt": "2027-03-28T09:00:00",
  "timezone": "America/Chicago",
  "destination": {
    "type": "email",
    "address": "me@example.com"
  }
}
```

Response:

```json
{
  "id": "<generated-id>",
  "deliverAt": "2027-03-28T09:00:00",
  "timezone": "America/Chicago",
  "destination": {
    "type": "email",
    "address": "me@example.com"
  },
  "status": "SEALED"
}
```

The original message is never returned.

## Current implementation

The first MVP includes:

- Node.js + TypeScript REST API
- timezone-aware future scheduling validation
- AES-256-GCM authenticated encryption
- in-memory development store behind a persistence interface
- status, reschedule, and cancellation operations
- automated non-retrieval test
- environment-based encryption key configuration

The in-memory store is intentionally development-only. **It cannot provide reliable future delivery across restarts.**

## Production path

Before using FutureMe for a real months-later message:

1. Replace the in-memory store with PostgreSQL or another durable database.
2. Use envelope encryption backed by AWS KMS, Azure Key Vault, GCP KMS, or equivalent instead of a raw application key.
3. Add a durable scheduler/worker that claims due messages idempotently.
4. Add an email delivery adapter with retry and delivery-state tracking.
5. Add MCP tools using the same narrow API boundary.
6. Deploy monitoring and backup/recovery procedures and test them.

## Threat model

FutureMe should:

- never log plaintext message bodies
- never include plaintext in errors or tracing
- avoid plaintext in queues
- encrypt before persistence
- use authenticated encryption
- restrict worker decryption privileges
- redact destinations from logs where practical
- make delivery idempotent
- audit privileged operations

It does not claim protection against compromised infrastructure, privileged administrators, provider/legal retention, or loss of the encryption key.

## MCP design

The future MCP server will expose:

```text
seal_future_message
get_delivery_status
reschedule_message
cancel_message
```

No MCP resource or tool will expose stored message content. This makes the same backend usable by Claude, ChatGPT, or another MCP-capable client.

## Local development

```bash
npm install
cp .env.example .env
# Generate a 32-byte key and put its 64-character hex value in .env
npm run dev
```

Run tests:

```bash
npm test
```

## Repository safety

Never commit:

- real letters
- real recipient addresses
- encryption keys
- email-provider credentials
- production database contents

The repository contains only example data.

## Next milestone

Durable PostgreSQL persistence, delivery worker, email adapter, and MCP server are the next implementation phase. Until those are implemented and deployed, this repository should **not** be trusted to deliver a real future message.
