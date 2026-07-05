# Connecting the Dots with AI: B2B Sourcing & Pipeline CRM

An AI-powered intelligence platform built on React 19, Express, and Gemini 3.5, designed to solve complex business sourcing problems. It intelligently crawls public web indexes using **Google Search Grounding**, extracts detailed company/expert profiles, ranks them based on user priorities, and provides integrated Kanban pipeline CRM and personalized automated email outreach copywriting.

---

## 🚀 Key Architectural Features
1. **Sourcing Finder with Google Grounding**: Leverages Gemini 3.5-flash with real-time Google Search grounding to retrieve real-world entities, active URLs, and verified industry credentials.
2. **Tunable Ranking Engine**: Adjust sourcing filters using sliders to weight relevance match, geographic alignment, or industrial scale.
3. **Persistent Pipeline CRM**: Draggable/status-updating Kanban board (Discovered, Shortlisted, Contacted, In Conversation, Closed-Won) with on-the-fly notes saving.
4. **AI Outreach Center**: Generates tailored outreach sequences matching your corporate brand to selected manufacturer capabilities, accompanied by visual copywriting strategy breakdowns.
5. **Business Analytics Dashboard**: Features responsive vector (SVG) charts tracking funnel distribution, lead density, and simulated outreach logs.

---

## 📂 Project Structure

```text
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions deployment to GitHub Pages
├── data/
│   └── db.json             # Persistent local JSON database file (CRM & Logs)
├── src/
│   ├── components/         # Reusable modular UI elements
│   ├── App.tsx             # Main dashboard controller and reactive client
│   ├── index.css           # Global Tailwind and premium font loading
│   ├── main.tsx            # React application mount
│   └── types.ts            # Type declarations and database interfaces
├── Dockerfile              # Multi-stage container compilation file
├── docker-compose.yml      # Docker compose configuration
├── package.json            # Scripts & dependencies
├── server.ts               # Express full-stack API server and Vite router
├── tsconfig.json           # TS rules compilation configuration
└── vite.config.ts          # Vite asset processing rules
```

---

## 🛠️ Local Setup & Deployment Instructions

### Option 1: Classic Node.js and npm (Standard Start)

#### 1. Clone the repository and navigate to the project root:
```bash
git clone https://github.com/your-username/connecting-the-dots-ai.git
cd connecting-the-dots-ai
```

#### 2. Install dependencies:
```bash
npm install
```

#### 3. Set up your Environment variables:
Create a `.env` file in the root directory (based on `.env.example`):
```env
GEMINI_API_KEY="your-actual-api-key-from-google-ai-studio"
```

#### 4. Run the development environment:
```bash
npm run dev
```
The server will boot up and bind to `http://localhost:3000`. Open your browser to test the full-stack system!

#### 5. Build for production:
```bash
npm run build
npm start
```

---

### Option 2: Containerized Deployment (Docker & Docker Compose)

Docker simplifies environment provisioning and ensures absolute path consistency without requiring local Node setup.

#### 1. Build and boot the services:
Run the following single command in your terminal from the project root:
```bash
docker-compose up --build -d
```

#### 2. Verify container state:
Ensure the application is running safely:
```bash
docker ps
```

#### 3. Access the platform:
Open `http://localhost:3000` to interact with the system. Sourcing data and pipelines will persist safely inside the `crm-data` Docker volume.

#### 4. Stopping the system:
```bash
docker-compose down
```

---

## ⚡ Grounding Verification & Static Fail-safe
When deploying directly to a static environment like **GitHub Pages** (via our custom GitHub Actions), the platform automatically activates its high-integrity **Simulated Intelligence Sourcing Engine**. This ensures that the beautiful dashboard can still be fully navigated and tested by stakeholders offline or on static CDN platforms, while full-stack environments running on Node/Docker provide real-time web crawlers!
