import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Helper to generate IDs
function generateId() {
  return "lead_" + Math.random().toString(36).substring(2, 11);
}

// Read database file
async function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const parentDir = path.dirname(DB_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      const initial = {
        crmLeads: [],
        outreachLogs: [],
        userSettings: {
          myCompanyName: "EcoPack Solutions",
          myCompanySector: "Sustainable Supply Chains",
          myValueProposition: "We provide sustainable retail packaging consultancy and distribution services to direct-to-consumer eco-brands."
        }
      };
      await fs.promises.writeFile(DB_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = await fs.promises.readFile(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return {
      crmLeads: [],
      outreachLogs: [],
      userSettings: {
        myCompanyName: "EcoPack Solutions",
        myCompanySector: "Sustainable Supply Chains",
        myValueProposition: "We provide sustainable retail packaging consultancy and distribution services to direct-to-consumer eco-brands."
      }
    };
  }
}

// Write database file
async function writeDb(data: any) {
  try {
    const parentDir = path.dirname(DB_PATH);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    await fs.promises.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// Lazy initialization of GoogleGenAI SDK to avoid module-load crashes
let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. The system will fall back to highly optimized mock simulations.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Mock search generator for fallback/testing
function getMockSearchResults(query: string) {
  const queryLower = query.toLowerCase();
  
  let targetSector = "Manufacturing & Supply Chain";
  let geographicFocus = "Global / General";
  let intent = `Identify strategic business partners for "${query}"`;
  
  if (queryLower.includes("india")) {
    geographicFocus = "India";
  } else if (queryLower.includes("europe") || queryLower.includes("germany") || queryLower.includes("uk")) {
    geographicFocus = "Europe";
  } else if (queryLower.includes("usa") || queryLower.includes("america") || queryLower.includes("us")) {
    geographicFocus = "United States";
  }

  if (queryLower.includes("biodegradable") || queryLower.includes("packaging") || queryLower.includes("eco")) {
    targetSector = "Sustainable Materials & Packaging";
    intent = "Source eco-friendly, biodegradable packaging manufacturers with certified sustainability standards.";
    return {
      analysis: {
        queryIntent: intent,
        targetSector: targetSector,
        geographicFocus: geographicFocus,
        keyChallenges: [
          "Ensuring complete industrial or home compostability certification",
          "Optimizing supply chain freight costs and import/export duties",
          "Maintaining high moisture and barrier resistance for food contact products"
        ]
      },
      leads: [
        {
          id: "lead-biodeg-1",
          name: "Ecoware India",
          website: "https://www.ecoware.in",
          location: "New Delhi, India",
          industry: "Eco-Friendly Food Packaging",
          description: "India's largest manufacturer of certified 100% biodegradable, compostable tableware and food packaging. Products are made from agricultural waste (bagasse), are oil & water-resistant, and break down naturally in 90 days.",
          contactEmail: "sales@ecoware.in",
          contactPhone: "+91 11 4050 4550",
          relevanceScore: 98,
          matchReason: "Direct match for biodegradable packaging in India. They possess international certifications including USDA Biobased, BPI, and DIN CERTCO."
        },
        {
          id: "lead-biodeg-2",
          name: "Chuk (Noida Paper Products)",
          website: "https://www.chuk.in",
          location: "Ayodhya, Uttar Pradesh, India",
          industry: "Compostable Food Service Ware",
          description: "A prominent green brand producing compostable plates, bowls, and delivery containers. Made from sugarcane bagasse with premium FDA-approved oil and water barrier properties.",
          contactEmail: "connect@chuk.in",
          contactPhone: "+91 52 7824 5131",
          relevanceScore: 94,
          matchReason: "Highly relevant compostable bagasse packaging supplier with advanced automated manufacturing capabilities in northern India."
        },
        {
          id: "lead-biodeg-3",
          name: "Pappco Greenware",
          website: "https://www.pappcogreenware.com",
          location: "Mumbai, Maharashtra, India",
          industry: "Sustainable Packaging Supplies",
          description: "Offers a wide range of green packaging products including wooden cutlery, paper straws, bagasse plates, and custom-molded pulp packaging for cosmetics and retail applications.",
          contactEmail: "info@pappcogreenware.com",
          contactPhone: "+91 22 2854 4400",
          relevanceScore: 91,
          matchReason: "Provides high-quality consumer retail and cosmetic outer biodegradable packaging solutions with reliable delivery across India."
        },
        {
          id: "lead-biodeg-4",
          name: "Bakeys Foods & Pack",
          website: "https://www.bakeys.com",
          location: "Hyderabad, Telangana, India",
          industry: "Edible & Biodegradable Cutlery",
          description: "Pioneers of edible cutlery made from sorghum, wheat, and rice flours. They also specialize in developing custom grain-based films and wrappers for dry snacks.",
          contactEmail: "contact@bakeys.com",
          contactPhone: "+91 40 2300 1192",
          relevanceScore: 88,
          matchReason: "Niche, highly innovative edible alternative that completely bypasses plastic recycling streams. Best for brand differentiation."
        },
        {
          id: "lead-biodeg-5",
          name: "Truegreen Organic Industries",
          website: "https://www.truegreen.co.in",
          location: "Bengaluru, Karnataka, India",
          industry: "Bioplastics & Compostable Films",
          description: "Manufactures biodegradable and compostable carry bags, grocery bags, garbage rolls, and stretch films using cornstarch-based PLA material.",
          contactEmail: "enquiry@truegreen.co.in",
          contactPhone: "+91 80 4122 9312",
          relevanceScore: 86,
          matchReason: "Excellent supplier for biodegradable shipping mailers, compostable protective wrap, and outer logistics film."
        },
        {
          id: "lead-biodeg-6",
          name: "Bio-Plastobag Industries",
          website: "https://www.bioplastobag.com",
          location: "Chennai, Tamil Nadu, India",
          industry: "Flexible Compostable Packaging",
          description: "Specializes in manufacturing certified compostable polybags, mailing pouches, and apparel covers using eco-friendly bio-polymers. Fully ISO 17088 and CPCB certified.",
          contactEmail: "support@bioplastobag.com",
          contactPhone: "+91 44 2651 8833",
          relevanceScore: 85,
          matchReason: "Critical for e-commerce brands needing compostable garment protection covers and certified shipping poly mailers."
        }
      ],
      marketSummary: "The sustainable and biodegradable packaging market in India is expanding rapidly, driven by strict national single-use plastic bans and rising eco-consciousness among e-commerce and retail brands. Sugarcane bagasse and cornstarch-based PLA are the two primary raw materials. Certifications from the Central Pollution Control Board (CPCB) under ISO 17088 are legally mandatory to sell and distribute bioplastics in India.",
      suggestedNextActions: [
        "Ask prospective suppliers for their valid CPCB (Central Pollution Control Board) certification registration number.",
        "Request sample boxes of different bagasse GSM weights to test durability against grease and liquid content.",
        "Calculate total landed freight cost from India main ports (Mumbai/Chennai) to your distribution hubs."
      ],
      citations: [
        { title: "Central Pollution Control Board of India - Bioplastic Regulations", uri: "https://cpcb.nic.in" },
        { title: "Ecoware India Official Catalog", uri: "https://www.ecoware.in" },
        { title: "Chuk - Eco-friendly Bagasse Innovators", uri: "https://www.chuk.in" }
      ],
      searchQueries: ["biodegradable packaging manufacturers in India", "certified compostable bagasse packaging suppliers India"]
    };
  }

  // General Mock Fallback for any other query
  return {
    analysis: {
      queryIntent: intent,
      targetSector: targetSector,
      geographicFocus: geographicFocus,
      keyChallenges: [
        "Finding reliable business contacts with rapid response rates",
        "Assessing and validating true operational scale",
        "Aligning regional regulatory compliance and quality standards"
      ]
    },
    leads: [
      {
        id: "lead-gen-1",
        name: "Apex Solutions Group",
        website: "https://www.apexsolutionsgroup-mock.com",
        location: "New York, USA",
        industry: targetSector,
        description: `A global leader specializing in ${query}. They offer customized business consulting, end-to-end integration, and enterprise-scale procurement services.`,
        contactEmail: "info@apexsolutionsgroup-mock.com",
        contactPhone: "+1 (555) 019-2831",
        relevanceScore: 95,
        matchReason: `High industry reputation and direct alignment with your request for "${query}".`
      },
      {
        id: "lead-gen-2",
        name: "Nova Enterprise Partners",
        website: "https://www.novaenterprisepartners-mock.com",
        location: "London, UK",
        industry: targetSector,
        description: "Highly respected consultants and materials brokers providing bespoke systems, materials sourcing, and contract negotiation.",
        contactEmail: "partners@novaenterprisepartners-mock.com",
        contactPhone: "+44 20 7946 0912",
        relevanceScore: 92,
        matchReason: "Strong track record with complex international supply chains and multi-stakeholder business problems."
      },
      {
        id: "lead-gen-3",
        name: "Vanguard Global Industries",
        website: "https://www.vanguardglobal-mock.com",
        location: "Singapore",
        industry: "Global Trade & Sourcing",
        description: "Specialized sourcing agency and supply chain orchestrator with strong manufacturing partnerships across Southeast Asia and India.",
        contactEmail: "sourcing@vanguardglobal-mock.com",
        contactPhone: "+65 6789 0123",
        relevanceScore: 89,
        matchReason: "Excellent broker for bulk sourcing, freight logistics, and strict quality assurance checks."
      },
      {
        id: "lead-gen-4",
        name: "EcoMaterials Labs",
        website: "https://www.ecomaterialslabs-mock.com",
        location: "Munich, Germany",
        industry: "Materials Science & Research",
        description: "An advanced engineering and research lab developing bio-based alternatives, structural compostability, and sustainable solution designs.",
        contactEmail: "research@ecomaterialslabs-mock.com",
        contactPhone: "+49 89 2019 3812",
        relevanceScore: 86,
        matchReason: "Best for custom product engineering and complex technical materials specifications that off-the-shelf vendors cannot fulfill."
      }
    ],
    marketSummary: `The market for "${query}" is experiencing significant growth due to digital transformation, supply chain shifts, and stricter global sustainability frameworks. Main actors are diversifying their production locations and increasing focus on transparent, verifiable certifications.`,
    suggestedNextActions: [
      "Formulate specific performance criteria and volume requirements for materials/experts.",
      "Reach out to shortlisted companies via our Outreach email client to request a brief capability call.",
      "Verify their certified corporate history and trade registration details."
    ],
    citations: [
      { title: `Global Sourcing & Supply Chain Analysis on ${query}`, uri: "https://www.wikipedia.org" }
    ],
    searchQueries: [query]
  };
}

// Generate fallback outreach copy
function getMockOutreach(lead: any, goal: string, myCompanyName: string, myCompanySector: string, myValueProposition: string, notes: string) {
  let subject = "";
  let body = "";
  let strategyPoints: string[] = [];

  const notesText = notes ? ` Regarding our specific requirement: ${notes}` : "";

  if (goal.toLowerCase().includes("quote") || goal.toLowerCase().includes("rfq")) {
    subject = `RFQ Inquiry: Custom Packaging/Sourcing Solutions for ${myCompanyName}`;
    body = `Dear Sourcing Team at ${lead.name},

I hope this email finds you well.

My name is [My Name], and I lead the Sustainable Supply Chain division at ${myCompanyName}. We are currently expanding our direct-to-consumer distribution network and are actively looking for reliable, high-integrity manufacturers to supply our operational needs.

We came across ${lead.name} during our market intelligence research, and we were incredibly impressed by your specialized capabilities in:
"${lead.description.substring(0, 150)}..."

Since your team operates directly out of ${lead.location}, we believe there is a fantastic opportunity to collaborate. Specifically, we would love to learn more about your lead times, minimum order quantities (MOQs), and standard compliance certifications.${notesText}

Could you let us know your availability for a brief 10-minute introduction call this coming Thursday? Alternatively, I can share our exact packaging specifications so we can request an initial price estimate.

Thank you very much for your time. I look forward to exploring how we can connect the dots together.

Warm regards,

[My Name]
[My Title]
${myCompanyName}
[My Email]`;
    strategyPoints = [
      "Direct & Professional Sourcing Opening: Positioned the request as a commercial sourcing inquiry (RFQ), ensuring it gets routed to their active sales or account management team.",
      "Specific Capability Highlight: By citing their exact description and location, we show that this is an intentional, highly relevant outreach, not automated spam.",
      "Frictionless Call-to-Action: Offered two simple ways to proceed: a quick intro call, or sharing specifications directly for pricing."
    ];
  } else if (goal.toLowerCase().includes("partnership")) {
    subject = `Strategic Partnership Proposal: ${myCompanyName} x ${lead.name}`;
    body = `Dear Partnerships Team at ${lead.name},

I hope you are having a productive week.

I'm reaching out from ${myCompanyName}, where our core mission is: "${myValueProposition}". 

As we look to scale our sustainability consulting and sourcing services, we are seeking to align with world-class providers in the ${lead.industry} space. We have been tracking ${lead.name} and are highly impressed by your reputation and unique market footprint in ${lead.location}.

Given our active client base and your manufacturing and product capabilities, a referral or co-delivery partnership could add immense value to both our organizations.${notesText}

I would love to set up a brief, exploratory video conference to discuss how we might create a mutually beneficial channel partnership. 

Are you open to a short conversation next Tuesday at 3:00 PM IST / 9:30 AM UTC, or is there a better time that works for you?

Best regards,

[My Name]
[My Title]
${myCompanyName}
[My Email]`;
    strategyPoints = [
      "Value Proposition Synergy: Introduced our corporate value proposition first, establishing immediate credibility.",
      "Mutual Value Alignment: Focused on the strategic 'win-win' angle, positioning the outreach as an opportunity to generate new revenue channels for them.",
      "Structured Time Slots: Proposing a specific date and time reduces scheduling friction and increases response rates."
    ];
  } else {
    // Default Sales Pitch or Expert Interview
    subject = `Connecting the Dots: Collaboration opportunity between ${myCompanyName} and ${lead.name}`;
    body = `Dear [Contact Name] at ${lead.name},

I hope this message finds you well.

I'm writing to you because we are actively researching the latest advancements in the ${lead.industry} sector, and we identified ${lead.name} as a leading innovator in the ${lead.location} region.

At ${myCompanyName}, we help brands solve complex challenges in the ${myCompanySector} industry. In reviewing your capabilities, we see a powerful overlap between your core strengths and our current projects. Specifically, your focus on ${lead.description.substring(0, 100)}... aligns perfectly with our strategic goals.${notesText}

I would appreciate the opportunity to connect for a brief 15-minute introductory conversation to learn more about your operational focus and see if there are collaborative avenues to explore.

Would you be open to a call sometime next week?

Sincerely,

[My Name]
[My Title]
${myCompanyName}
[My Email]`;
    strategyPoints = [
      "Curiosity and Innovation Hook: Framed the outreach around research and industry innovation, which is highly flattering and disarming.",
      "Clear Alignment: Mapped our strategic goals to their specific listed services, creating a logical business connection."
    ];
  }

  return { subject, body, strategyPoints };
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS
// -----------------------------------------------------------------------------

// Get full DB data
app.get("/api/db", async (req, res) => {
  const db = await readDb();
  res.json(db);
});

// Update corporate settings
app.post("/api/settings", async (req, res) => {
  const { myCompanyName, myCompanySector, myValueProposition } = req.body;
  const db = await readDb();
  db.userSettings = {
    myCompanyName: myCompanyName || "EcoPack Solutions",
    myCompanySector: myCompanySector || "Sustainable Supply Chains",
    myValueProposition: myValueProposition || "Sustainable retail packaging Consultancy"
  };
  await writeDb(db);
  res.json({ success: true, userSettings: db.userSettings });
});

// Search and extract leads using Google Search Grounding with Gemini 3.5-flash
app.post("/api/search", async (req, res) => {
  const { query, weights } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query is required" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No API Key, returning realistic mock search results.");
      const mockResult = getMockSearchResults(query);
      return res.json(mockResult);
    }

    const client = getAiClient();
    
    const prompt = `
    You are an expert business intelligence and lead generation AI platform.
    The user is trying to solve a business problem or find a strategic match.
    Their search query is: "${query}"

    Search the web using Google Search to find real companies, manufacturers, specialists, distributors, service providers, or opportunities that match this request. 
    Look for real-world entities that actually exist and can be contacted.

    Generate a highly structured JSON response. You MUST output ONLY valid JSON that matches this structure exactly, with no markdown backticks, no wrap, just the raw JSON:
    {
      "analysis": {
        "queryIntent": "Short description of what the user is trying to solve",
        "targetSector": "The primary industry sector",
        "geographicFocus": "Target country/region if applicable",
        "keyChallenges": ["Key challenge or criteria 1", "Key challenge or criteria 2"]
      },
      "leads": [
        {
          "name": "Official Name of the Company or Expert",
          "website": "Direct Website URL from search grounding sources, or a realistic domain based on their name",
          "location": "City, Country",
          "industry": "Specific industry/sector",
          "description": "Comprehensive description of their capabilities, services, certifications, and how they solve the user's problem.",
          "contactEmail": "A generic email like info@company.com or contact@company.com based on their actual website",
          "contactPhone": "A general office number if found, or a realistic placeholder like '+91 22 5555 0192'",
          "relevanceScore": 95,
          "matchReason": "Detailed business logic explanation of why this company is the perfect candidate for the user's query."
        }
      ],
      "marketSummary": "A highly professional, detailed executive summary of the industry landscape, standard price points or regulatory considerations, and competitive landscape based on search grounding findings.",
      "suggestedNextActions": [
        "Action 1",
        "Action 2",
        "Action 3"
      ]
    }

    Ensure you list at least 6 real, high-quality, non-duplicate recommendations. Ensure relevanceScore is an integer between 50 and 100.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response received from Gemini");
    }

    let parsedData;
    try {
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      console.error("Error parsing JSON from Gemini search response:", parseErr);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to extract JSON structure from model response");
      }
    }

    // Assign IDs if not returned by model
    if (parsedData.leads && Array.isArray(parsedData.leads)) {
      parsedData.leads = parsedData.leads.map((lead: any, index: number) => {
        return {
          id: lead.id || `lead-${index}-${Date.now()}`,
          ...lead
        };
      });
    }

    // Capture Search Grounding Metadata for citations!
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      ...parsedData,
      citations: groundingChunks.map((chunk: any) => ({
        title: chunk.web?.title || "Web Source",
        uri: chunk.web?.uri || "#"
      })).filter((c: any) => c.uri !== "#"),
      searchQueries: webSearchQueries
    });

  } catch (err: any) {
    if (err.status === 429 || err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Search API Quota Exceeded (429). Falling back to highly optimized simulated results.");
    } else {
      console.warn("Search API general warning:", err.message || err);
    }
    const fallback = getMockSearchResults(query);
    return res.json({
      ...fallback,
      error: "Using simulated intelligence (Gemini API quota exceeded or temporary issue)."
    });
  }
});

// Generate personalized outreach using Gemini
app.post("/api/outreach", async (req, res) => {
  const { lead, goal, notes } = req.body;
  if (!lead || !goal) {
    return res.status(400).json({ error: "Lead details and Goal are required" });
  }

  try {
    const db = await readDb();
    const settings = db.userSettings || {};

    const myCompanyName = settings.myCompanyName || "EcoPack Solutions";
    const myCompanySector = settings.myCompanySector || "Sustainable Supply Chains";
    const myValueProposition = settings.myValueProposition || "Eco-friendly retail packaging Consultancy";

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log("No API Key, returning realistic mock outreach email.");
      const mockOutreach = getMockOutreach(lead, goal, myCompanyName, myCompanySector, myValueProposition, notes);
      return res.json(mockOutreach);
    }

    const client = getAiClient();

    const prompt = `
    You are a professional B2B copywriter and business development expert.
    Write a highly personalized, natural-sounding, high-conversion outreach email template based on the following details.
    
    My Company Profile:
    - Name: ${myCompanyName}
    - Industry/Sector: ${myCompanySector}
    - Value Proposition: ${myValueProposition}

    Recipient Lead Profile:
    - Company/Expert Name: ${lead.name}
    - Sector/Industry: ${lead.industry}
    - Location: ${lead.location}
    - Description/Capabilities: ${lead.description}
    - Target Outreach Goal: ${goal} (e.g. Request Quote, Partnership, Expert Interview, Sales Pitch)
    - Additional Custom Context/Notes: ${notes || "None"}

    Your goal is to write an email that is warm, respectful, concise, and highly personalized. It should connect the dots between what we do (Value Proposition) and what the lead does (Capabilities), explaining exactly why a connection makes immense strategic sense.
    Avoid dry corporate jargon or pushy sales pitches. Sound like a real business professional reaching out to another.

    Output a JSON object ONLY, with no markdown formatting or backticks:
    {
      "subject": "The email subject line, compelling and personalized",
      "body": "The complete email body text, using [My Name] or [My Title] as placeholders where appropriate. Include clean line breaks.",
      "strategyPoints": [
        "Strategy point 1: Explanation of why this specific opening or hook was used",
        "Strategy point 2: Explanation of how we connected our business value with their operations"
      ]
    }
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text response from Gemini outreach writer.");
    }

    let parsedData;
    try {
      const cleanJson = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
      parsedData = JSON.parse(cleanJson);
    } catch (parseErr) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to extract JSON structure from outreach response");
      }
    }

    return res.json(parsedData);

  } catch (err: any) {
    if (err.status === 429 || err.message?.includes("429") || err.message?.includes("quota") || err.message?.includes("RESOURCE_EXHAUSTED")) {
      console.warn("Outreach API Quota Exceeded (429). Falling back to highly optimized simulated results.");
    } else {
      console.warn("Outreach API general warning:", err.message || err);
    }
    const db = await readDb();
    const settings = db.userSettings || {};
    const mockOutreach = getMockOutreach(lead, goal, settings.myCompanyName, settings.myCompanySector, settings.myValueProposition, notes);
    return res.json({
      ...mockOutreach,
      error: "Using simulated copywriter (Gemini API quota exceeded or temporary issue)."
    });
  }
});

// Save or Update Lead in CRM
app.post("/api/crm", async (req, res) => {
  const { lead } = req.body;
  if (!lead) {
    return res.status(400).json({ error: "Lead object is required" });
  }

  const db = await readDb();
  
  if (lead.id) {
    // Update existing lead
    const index = db.crmLeads.findIndex((l: any) => l.id === lead.id);
    if (index !== -1) {
      db.crmLeads[index] = {
        ...db.crmLeads[index],
        ...lead,
        updatedAt: new Date().toISOString()
      };
      await writeDb(db);
      return res.json({ success: true, lead: db.crmLeads[index] });
    }
  }

  // Create new lead
  const newLead = {
    ...lead,
    id: lead.id || generateId(),
    status: lead.status || "Discovered",
    notes: lead.notes || "",
    addedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.crmLeads.push(newLead);
  await writeDb(db);
  res.json({ success: true, lead: newLead });
});

// Delete lead from CRM
app.delete("/api/crm/:id", async (req, res) => {
  const { id } = req.params;
  const db = await readDb();
  const initialLength = db.crmLeads.length;
  db.crmLeads = db.crmLeads.filter((l: any) => l.id !== id);
  await writeDb(db);
  res.json({ success: db.crmLeads.length < initialLength });
});

// Add Outreach Log
app.post("/api/logs", async (req, res) => {
  const { log } = req.body;
  if (!log) {
    return res.status(400).json({ error: "Log object is required" });
  }

  const db = await readDb();
  const newLog = {
    ...log,
    id: "log_" + Math.random().toString(36).substring(2, 11),
    timestamp: new Date().toISOString(),
    status: log.status || "Sent"
  };

  db.outreachLogs.push(newLog);
  
  // Also auto-update lead status if it is in CRM
  if (log.leadId) {
    const leadIndex = db.crmLeads.findIndex((l: any) => l.id === log.leadId);
    if (leadIndex !== -1) {
      db.crmLeads[leadIndex].status = "Contacted";
      db.crmLeads[leadIndex].updatedAt = new Date().toISOString();
      
      // Append outreach history to lead notes
      const historyLine = `\n[${new Date().toLocaleDateString()}] Sent outreach: "${log.subject}"`;
      db.crmLeads[leadIndex].notes = (db.crmLeads[leadIndex].notes || "") + historyLine;
    }
  }

  await writeDb(db);
  res.json({ success: true, log: newLog });
});

// Clear log/history endpoint for user convenience
app.post("/api/crm/clear", async (req, res) => {
  const db = await readDb();
  db.crmLeads = [];
  db.outreachLogs = [];
  await writeDb(db);
  res.json({ success: true });
});

// -----------------------------------------------------------------------------
// VITE DEV SERVER & STATIC ASSETS SETUP
// -----------------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Production static files serving configuration loaded.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
  });
}

startServer();
