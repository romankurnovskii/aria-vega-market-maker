---
name: postman-sync
description: >
  Syncs Postman requests and collections with the API endpoints defined in the server code. Always trigger this skill when the user adds, modifies, or deletes routes or endpoints, changes payload interfaces, or asks to update/sync Postman YAML or JSON request collections.
---

# Postman Collection Synchronization Skill

A professional, disciplined skill to keep Postman collections (configured as individual `.request.yaml` files) fully synchronized with backend server definitions (Express, Fastify, Koa, NestJS, etc.).

---

## When to Trigger This Skill

You **MUST** invoke this skill whenever:
- A new REST API endpoint or route is added to the backend.
- An existing API endpoint is modified or removed.
- Request/response payloads, TypeScript body interfaces, or validation schemas are updated.
- The user explicitly mentions "Postman", "postman collections", "request files", "sync API", or similar keywords.

---

## Core Guidelines

### 1. Locate the Postman Collection Directory
- **Rule File Check**: First, check if there is an active Postman rule file, such as [.agents/rules/update-postman-rule.md](file:///Users/r/dev/github/aria-vega-market-maker/.agents/rules/update-postman-rule.md), to find the path where collection YAML files are stored.
- **Default Directory**: If not specified, look under `~/dev/github/privates/postman/postman/collections/` or `/Users/r/dev/github/privates/postman/postman/collections/` for a collection subfolder matching the repository or project name (e.g., `aria-vega-mm`).

### 2. File Naming and Formatting
Each endpoint must reside in its own YAML file ending in `.request.yaml` (e.g., `Create Assignment.request.yaml`).

Every `.request.yaml` file must conform to the following schema structure:

```yaml
$kind: http-request
name: [Human Readable Request Name]
url: "{{baseUrl}}/api/path"
method: [GET | POST | PUT | DELETE | PATCH]
headers:
  Content-Type: application/json  # Required for POST/PUT/PATCH with payloads
body:
  type: text
  content: |-
    {
        "field1": "value1"
    }
order: [Sequence Order Number]
```

### 3. Execution Ordering System
Assign a logical execution order using the `order` property to group endpoints appropriately:
- `1000 - 1900`: Basic querying / retrieval operations (e.g., `GET /assignments`).
- `2000 - 2900`: Resource creation / registering (e.g., `POST /assignments`).
- `3000 - 3900`: Resource updates or deletions (e.g., `DELETE /assignments/:id`).
- `4000 - 4900`: Ad-hoc, high-level processing or evaluations (e.g., `POST /strategies/:id/evaluate`).
- `5000`: Health check, liveness/readiness probes (e.g., `GET /health`).

### 4. Consistent Variables Usage
Use environment/workspace placeholder variables in double curly braces to enable variable-based testing across environments:
- Base URL: `{{baseUrl}}`
- Resource Identifier: `{{assignmentId}}`
- On-chain Addresses / Keys: `{{poolAddress}}`, `{{positionAddress}}`

**Example (Create Assignment):**
```yaml
$kind: http-request
name: Create Assignment
url: "{{baseUrl}}/assignments"
method: POST
headers:
  Content-Type: application/json
body:
  type: text
  content: |-
    {
        "id": "{{assignmentId}}",
        "strategyId": "trailing-usdc",
        "positionId": "{{positionAddress}}",
        "mode": "active"
    }
order: 2000
```

### 5. Proactive Validation and Cleanliness
- **Parity Check**: Compare the list of routes in backend source files (e.g., `server.ts` or route definitions) with the YAML files in the collection folder. Ensure no endpoints are missing and no outdated endpoints remain.
- **Payload Validation**: Ensure all fields declared in the request body examples precisely match the latest TypeScript interfaces or schema validation rules in the server source code.
- **Orphan Cleanup**: Delete any boilerplate/default request files (e.g., `New Request.request.yaml`) when setting up or updating a collection to keep the Workspace clean.
