# Technical & Architectural Specification Report: "Connecting the Dots with AI"

This report outlines the technical blueprint, architectural decisions, security protocols, data pipelines, and design patterns utilized in the development of the **Connecting the Dots with AI** business intelligence platform.


---

## 1. System Architecture

The application is structured as a **Full-Stack Single-Page Application (SPA) with an Express Backend and a React Frontend**. It runs inside a secure, containerized sandbox and binds exclusively to port `3000`.

```text
                  +----------------------------------------------+
                  |               CLIENT BROWSER                 |
                  |  +----------------------------------------+  |
                  |  |      React 19 Frontend Dashboard       |  |
                  |  +-------------------+--------------------+  |
                  +----------------------|-----------------------+
                                         | REST APIs (JSON)
                                         v
                  +----------------------------------------------+
                  |              EXPRESS BOCKEND                 |
                  |  +-------------------+--------------------+  |
                  |  |    Sourcing & CRM Route Controllers   |  |
                  |  +-------------------+--------------------+  |
                  |                      | Local DB I/O          |
                  |                      v                       |
                  |  +-------------------+--------------------+  |
                  |  |     JSON File Database (data/db.json)  |  |
                  |  +----------------------------------------+  |
                  +----------------------|-----------------------+
                                         | @google/genai SDK
                                         v
                  +----------------------------------------------+
                  |             EXTERNAL SERVICES                |
                  |  +-------------------+--------------------+  |
                  |  |    Gemini 3.5 API with Google Grounding|  |
                  |  +----------------------------------------+  |
                  +----------------------------------------------+
```

### Components of the Stack:
- **Frontend Layer**: Built using React 19 and Tailwind CSS. Employs a desk-first responsive design, highly optimized SVG dashboards, and interactive Kanban boards.
- **Backend API Layer**: Powered by Express. Express acts as a middleware for security (masking key configurations from browser bundles), handles persistent database I/O, and executes server-side Google GenAI API transactions.
- **Asset Bundling**: Bundled and compiled on the server side using `esbuild` for TypeScript type-stripping, resolving relative paths at build time, and outputting to a self-contained `dist/server.cjs` file to bypass relative ESM import restrictions.

---

## 2. AI Sourcing Workflow & Grounding

The key highlight of the sourcing process is the integration of **Google Search Grounding** within Gemini 3.5.

### Step-by-Step AI Sourcing Pipeline:
1. **Query Entry**: The user inputs a sourcing query (e.g. *"biodegradable packaging in India"*).
2. **Intent Analysis**: The backend parses the query parameters and extracts strategic filters (relevance matches, regional target geographies, operational scales).
3. **Google Search Grounding**: The Express backend sends the query directly to Gemini 3.5-flash with `tools: [{ googleSearch: {} }]` configured. Gemini searches Google search indexes, crawling live web indices.
4. **Information Extraction**: The model filters, aggregates, and extracts structured data from the grounding metadata (`groundingChunks`), selecting real-world suppliers, specialists, and manufacturers.
5. **JSON Schema Formatting**: Using `responseMimeType: "application/json"`, the model outputs a strict JSON payload representing the leads.
6. **Enrichment and Citations**: Grounding citation URLs are parsed on the fly from the Gemini `groundingMetadata` and displayed directly to the user as clickable proof of validity.

---

## 3. Database Design

For rapid development and container portability, the application utilizes a **Durable File-based JSON Database** (`data/db.json`) on the writeable container overlay.

### Entity Schema Structures:

#### A. Saved CRM Leads (`crmLeads`)
| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier generated on creation (e.g., `lead_3s9x1n8`) |
| `name` | `string` | Official name of company or specialist |
| `website` | `string` | Verified URL extracted from web grounding |
| `location` | `string` | City and country |
| `industry` | `string` | Sourced sector category |
| `description`| `string` | Extracted operational capabilities |
| `contactEmail`| `string` | Sourced generic email point |
| `contactPhone`| `string` | Office telephone number |
| `relevanceScore`| `number` | Strategic match score from 50 to 100 |
| `matchReason`| `string` | Dynamic AI reasoning statement |
| `status` | `string` | Kanban lane stage (`Discovered`, `Shortlisted`, `Contacted`, `In Conversation`, `Closed-Won`) |
| `notes` | `string` | Collaborative text area comments and transaction logs |
| `addedAt` | `string` | Timestamp in ISO 8601 format |

#### B. Campaign Transmission Logs (`outreachLogs`)
| Field Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique identifier (`log_8f2n83a`) |
| `leadId` | `string` | Reference ID to the parent saved lead |
| `leadName` | `string` | Target company name |
| `subject` | `string` | Custom generated email subject |
| `body` | `string` | Personalized message text |
| `goal` | `string` | Sourcing campaign objective |
| `timestamp` | `string` | Transmitted timestamp |
| `status` | `string` | Simulated delivery state (`Sent`, `Opened`, `Replied`) |

---

## 4. Software Design Patterns

1. **Lazy Initialization Pattern**: The Google GenAI SDK client is not instantiated at module load time to prevent crashes on startup if the `GEMINI_API_KEY` is missing. It is resolved on demand during the first API call.
2. **Fail-Safe / Graceful Degradation Pattern**: If the external Gemini API is unreachable, or if the API key is not yet configured, the system degrades to a highly realistic simulated sourcing and copywriter engine, returning realistic data structures so the platform remains fully testable.
3. **Repository/Data Access Object (DAO) Pattern**: Data access to `db.json` is encapsulated inside clean, asynchronous helper functions (`readDb`, `writeDb`), protecting state integrity.
4. **Single-Source-of-Truth React State**: All UI lanes, counters, and analytics charts feed from a unified React CRM state which is continuously synced with the database on updates.

---

## 5. Security & Privacy Considerations

- **API Key Masking**: The Gemini API key is *never* compiled in frontend bundles. The client never loads or accesses the `@google/genai` library directly. All calls are routed through server-side secure endpoints, hiding variables from browser developer tools.
- **Input Sanitization**: Free-text queries and custom instructions are handled strictly as parameters, preventing prompt injection attacks on the underlying model.
- **CORS & CORS Sandboxing**: The Express server implements rigid REST boundaries, and the application is configured to run inside a sandboxed iframe.
- **Container Isolation**: Docker volumes partition local operational databases from public networks, preventing unauthorized directory listings.

---

## 6. Performance Optimizations

1. **Asynchronous Non-blocking Operations**: Express routes leverage asynchronous Promises for heavy model transactions and file I/O operations, ensuring high concurrency.
2. **SVG-only Vector Visualization**: Recharts or D3.js can occasionally conflict with React 19 ESM constraints or crash during production bundling. This application utilizes pure, lightweight responsive SVG elements that render natively on the client without downloading external canvas modules.
3. **Incremental Debounced DB Writes**: State changes in Kanban notes are committed on text area blur events (`onBlur`), reducing operational disk writes and optimizing container CPU utilization.
4. **Vite Development Cache**: Dev caching is active, HMR file-watching is optimized during editing to prevent container flickering, and code builds are pre-optimized during esbuild compilation.
