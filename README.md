# Veil

> Private browsing vision for AI agents.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Veil System                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   Browser    │     │   Extension  │     │    Server    │                │
│  │   (User)     │────▶│  (Local)     │────▶│  (Local/     │                │
│  │              │     │              │     │   Remote)    │                │
│  └──────────────┘     └──────────────┘     └──────────────┘                │
│         │                    │                    │                          │
│         │  1. User Goal      │                    │                          │
│         │◀───────────────────│                    │                          │
│         │                    │  2. Capture DOM    │                          │
│         │                    │     + Screenshot   │                          │
│         │                    │                    │                          │
│         │                    │  3. Local Vision   │                          │
│         │                    │     (ONNX/WebGPU)  │                          │
│         │                    │                    │                          │
│         │                    │  4. Redaction      │                          │
│         │                    │     Engine         │                          │
│         │                    │                    │                          │
│         │                    │  5. Sanitized      │                          │
│         │                    │     Payload ──────▶│                          │
│         │                    │                    │  6. Rule-Based           │
│         │                    │                    │     Planner              │
│         │                    │                    │                          │
│         │                    │  7. Action Plan ◀──│                          │
│         │                    │                    │                          │
│         │                    │  8. Local Policy   │                          │
│         │                    │     Validation     │                          │
│         │                    │                    │                          │
│         │  9. User Confirm   │                    │                          │
│         │     (if needed)    │                    │                          │
│         │                    │                    │                          │
│         │                    │  10. Execute       │                          │
│         │                    │     Actions        │                          │
│         │                    │                    │                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Goal Input** → Veil popup
2. **Content Script** extracts visible DOM structure (no values from sensitive fields)
3. **Vision Pipeline** runs local ONNX model (WebGPU/WASM) to detect faces/sensitive regions
4. **Redaction Engine** masks PII in both DOM and screenshot
5. **Sanitized Payload** sent to server (never raw data)
6. **Server Planner** returns structured action plan
7. **Local Policy Engine** validates each action
8. **User Confirmation** for consequential actions
9. **Action Execution** in content script

## What Stays On-Device

- ✅ Raw screenshots
- ✅ Full DOM/HTML
- ✅ Form values (passwords, credit cards, PII)
- ✅ Cookies, localStorage, sessionStorage
- ✅ Browser history
- ✅ Full URLs with query strings
- ✅ Unredacted OCR text
- ✅ Clipboard contents

## What May Leave Device

- 📤 Sanitized screenshot (redacted, compressed, viewport-only)
- 📤 Semantic page map (element roles, labels, bounds - sanitized)
- 📤 Redaction manifest (categories, bounds, confidence, replacement tokens)
- 📤 User goal text
- 📤 Session ID and timestamp

## Redaction Order

1. **Explicit attributes**: `data-sensitive`, `data-private`, `data-pii`, `autocomplete="password"`, password inputs
2. **DOM-based detection**: Labels, placeholders, nearby context, autocomplete attributes
3. **Regex patterns**: Email, phone, credit card, CVV, Aadhaar, PAN, SSN, API keys, JWTs
4. **Vision model**: Face detection, credit card visual detection, ID card detection
5. **Merge**: Combine DOM and vision detections, deduplicate overlapping regions
6. **Apply**: Black rectangles for text/secrets, blur for faces
7. **Manifest**: Generate redaction manifest with categories, bounds, confidence

## Threat Model & Limitations

### Threats Addressed
- **Passive network observers**: Only sanitized data transmitted
- **Malicious server**: Cannot request hidden/redacted content; actions validated locally
- **Extension compromise**: No persistent storage of sensitive data; session cleared on demand
- **Cross-site tracking**: Origin allowlist; no third-party requests

### Known Limitations
- ⚠️ Client-side detection is **not perfect** - conservative defaults recommended
- ⚠️ Canvas/WebGL content requires OCR fallback (not implemented in prototype)
- ⚠️ Dynamic content loaded after capture may not be analyzed
- ⚠️ Shadow DOM and iframes not fully supported
- ⚠️ Vision model accuracy depends on model quality (mock used by default)
- ⚠️ False positives/negatives in PII detection possible
- ⚠️ No guarantee against side-channel attacks

## Browser Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab on user activation |
| `scripting` | Inject content script for DOM extraction |
| `storage` | Store user preferences, session state |
| `tabs` | Track active tab for context |
| `host_permissions` | Communicate with allowed server origins only |

## Quick Start

### Prerequisites
- Node.js 20+
- npm 9+
- Chrome or Firefox

### Installation

```bash
# Clone and install
git clone <repo>
cd Veil
npm install

# Build all packages
npm run build

# Start server (terminal 1)
npm run dev:server

# Build extension (terminal 2)
npm run dev:extension
```

### Load Extension

**Chrome:**
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/dist`

**Firefox:**
1. Open `about:debugging`
2. Click "This Firefox" → "Load Temporary Add-on"
3. Select `extension/dist/manifest.json`

### Run Demo

```bash
# Serve demo page
npx serve demo
# Open http://localhost:3000
```

Or with Docker:
```bash
npm run docker:up
# Server: http://localhost:3001
# Demo: http://localhost:8080
```

## Usage

1. Open the demo page (or any page)
2. Click Veil extension icon
3. Enter a goal: *"Find the submit button and prepare the form"*
4. Click "Analyze & Plan"
5. Review sanitized preview and redaction manifest
6. Review server-proposed actions
7. Confirm or reject actions requiring confirmation
8. Watch actions execute on page

## Replacing Mock Model with Real ONNX

1. Obtain ONNX model (e.g., YOLOv8 face detection):
   ```bash
   # Example: Export from Ultralytics
   yolo export model=yolov8n.pt format=onnx opset=12
   ```

2. Place model in `extension/public/models/`

3. Update vision pipeline config:
   ```typescript
   // In content script or popup
   const pipeline = createVisionPipeline({
     provider: "onnx",
     modelConfig: {
       modelPath: "/models/yolov8n-face.onnx",
       inputWidth: 320,
       inputHeight: 320,
       confidenceThreshold: 0.5,
       classNames: ["face", "person", "credit_card"],
       executionProvider: "webgpu",
     },
   });
   ```

4. Rebuild extension: `npm run build:extension`

### WebGPU vs WASM
- **WebGPU**: Preferred for performance (Chrome 113+, Firefox 120+)
- **WASM**: Fallback for unsupported browsers
- **Mock**: Default for zero-dependency demos

## Project Structure

```
Veil/
├── extension/           # Browser extension (Manifest V3)
│   ├── src/
│   │   ├── background/  # Service worker (server comms, policy)
│   │   ├── content/     # Content script (DOM extraction, actions)
│   │   ├── popup/       # React dashboard UI
│   │   ├── vision/      # ONNX Runtime Web pipeline
│   │   ├── redaction/   # PII detection & redaction
│   │   └── utils/       # Helpers
│   └── public/          # Static assets, manifest
├── server/              # Agent orchestration server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── planner/     # Rule-based planner
│   │   └── validation/  # Zod schemas, rate limiting
│   └── dist/
├── shared/              # Shared types & Zod schemas
│   └── src/schemas/
├── demo/                # Test page with sensitive fields
├── tests/               # Unit & integration tests
├── docker-compose.yml   # Local development stack
└── .env.example         # Configuration template
```

## API Reference

### POST `/api/agent/plan`

**Request** (`ClientPayload`):
```json
{
  "sessionId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "userGoal": "Find submit button",
  "sanitizedScreenshot": "data:image/jpeg;base64,...",
  "pageMap": {
    "urlOrigin": "https://example.com",
    "title": "Page Title",
    "viewport": { "width": 1920, "height": 1080 },
    "elements": [{ "id", "role", "label", "bounds", "visible", "enabled", "sensitive" }]
  },
  "redactionManifest": [{ "category", "bounds", "confidence", "replacement" }]
}
```

**Response** (`ServerPlan`):
```json
{
  "summary": "Found submit button",
  "confidence": 0.9,
  "requiresUserConfirmation": false,
  "actions": [{
    "id": "uuid",
    "type": "highlight",
    "target": { "elementId": "el-1" },
    "reason": "Highlight submit button",
    "confidence": 0.9
  }]
}
```

### Action Types
- `highlight` - Visual highlight (auto)
- `focus` - Focus element (auto)
- `scroll` - Scroll page (auto)
- `wait` - Wait (auto)
- `click` - Click element (confirm)
- `type` - Type text (confirm)

## Benchmarks

Run benchmarks:
```bash
npm run test -- --coverage
```

### Metrics Collected (Local Only)
- Model inference time
- Screenshot capture time
- DOM extraction time
- Redaction time
- Payload size before/after sanitization
- Server round-trip time
- Total end-to-end latency
- Sensitive regions detected
- Actions blocked by policy
- Inference backend used

### Expected Performance (Mock Provider)
| Metric | Target |
|--------|--------|
| DOM extraction | < 50ms |
| Redaction | < 30ms |
| Mock vision | < 10ms |
| Total local | < 100ms |
| Payload size | < 100KB |
| Memory | < 50MB |

## Development

```bash
# Watch mode for all packages
npm run dev:server &
npm run dev:extension

# Run tests
npm run test

# Lint
npm run lint

# Build production
npm run build
```

## Extending

### Custom Vision Provider
Implement `VisionProvider` interface:
```typescript
class MyVisionProvider implements VisionProvider {
  name = "my-provider";
  async initialize() { /* load model */ }
  async detect(input) { /* return detections */ }
  dispose() { /* cleanup */ }
  isReady() { return true; }
}
```

### Custom Redaction Patterns
Add to `extension/src/redaction/patterns.ts`:
```typescript
export const CUSTOM_PATTERNS = {
  myCustom: /\bMY_PATTERN_\d+\b/g,
};
```

### Server Planner
Replace `ruleBasedPlanner` with LLM integration:
```typescript
async function llmPlanner(context) {
  const response = await fetch("https://api.llm.com", { /* ... */ });
  return parseResponse(response);
}
```

## Privacy Checklist

- [x] No raw screenshots transmitted
- [x] No DOM/HTML transmitted
- [x] No form values from sensitive fields
- [x] No cookies/storage/history
- [x] No full URLs with query strings
- [x] No unredacted OCR text
- [x] No clipboard access
- [x] Origin allowlist enforced
- [x] Rate limiting implemented
- [x] Request cancellation supported
- [x] Local action validation
- [x] User confirmation for consequential actions
- [x] Emergency session clear
- [x] In-memory only processing
- [x] Deterministic mock for demos

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit PR with description

## Support

- Issues: GitHub Issues
- Security: security@privatesight.example
- Documentation: See `/docs` folder