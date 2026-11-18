/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Initial profiles mock to seed the database
const DEFAULT_PROFILES = [
  {
    id: "p1",
    name: "Divyansh Sharma",
    relation: "Myself",
    filingStatus: "In Progress",
    avatarColor: "bg-indigo-600",
    step: 4,
    basicDetails: {
      name: "Divyansh Sharma",
      pan: "ABCDE1234F",
      aadhaar: "1234-5678-9012",
      dob: "1994-08-12",
      mobile: "+91 98765 43210",
      email: "sharmadivyansh.5008@gmail.com",
      address: "102, Shanti Kunj, Sector 4, Dwarka, New Delhi - 110075"
    },
    residentialStatus: "Resident",
    employmentType: "Salary",
    incomeSources: ["Salary", "Interest", "Dividend"],
    taxRegime: "New",
    checklist: [
      { id: "c1", text: "Verify basic details & PAN", completed: true, category: "Identity" },
      { id: "c2", text: "Link Aadhaar with PAN", completed: true, category: "Identity" },
      { id: "c3", text: "Download Form 26AS", completed: true, category: "Income Verification" },
      { id: "c4", text: "Download Annual Information Statement (AIS)", completed: false, category: "Income Verification" },
      { id: "c5", text: "Collect Salary Slips", completed: true, category: "Income Verification" },
      { id: "c6", text: "Upload Form 16", completed: true, category: "Income Verification" },
      { id: "c7", text: "Verify Bank Savings & FD Interest", completed: false, category: "Income Verification" },
      { id: "c8", text: "Choose Tax Regime", completed: true, category: "Filing" },
      { id: "c9", text: "Review Tax Computation", completed: false, category: "Filing" },
      { id: "c10", text: "File Income Tax Return (ITR-1)", completed: false, category: "Filing" }
    ],
    documents: [
      { id: "d1", name: "PAN Card.pdf", category: "PAN", status: "Uploaded", uploadDate: "2026-06-15", fileSize: "245 KB", fileType: "pdf" },
      { id: "d2", name: "Aadhaar Card.pdf", category: "Aadhaar", status: "Uploaded", uploadDate: "2026-06-15", fileSize: "512 KB", fileType: "pdf" },
      { id: "d3", name: "Form 16 - FY 2025-26.pdf", category: "Form 16", status: "Uploaded", uploadDate: "2026-06-28", fileSize: "1.2 MB", fileType: "pdf" },
      { id: "d4", name: "Form 26AS.pdf", category: "Form 26AS", status: "Uploaded", uploadDate: "2026-07-01", fileSize: "840 KB", fileType: "pdf" },
      { id: "d5", name: "AIS (Annual Information Statement).pdf", category: "AIS", status: "Missing", uploadDate: "", fileSize: "", fileType: "" },
      { id: "d6", name: "Bank Interest Certificate.pdf", category: "Interest Certificates", status: "Missing", uploadDate: "", fileSize: "", fileType: "" }
    ],
    aiChats: [
      { id: "chat1", role: "user", text: "Do I need Form 16 if my company didn't deduct tax?", timestamp: "2026-07-02T10:15:00Z" },
      { id: "chat2", role: "model", text: "Yes, Divyansh! Even if your employer did not deduct tax (TDS), they are still required to issue Form 16 if your income exceeds the basic exemption limit. If they don't provide it, you can still file your taxes using your monthly salary slips, bank statements, and Form 26AS to calculate your gross salary.", timestamp: "2026-07-02T10:16:00Z" }
    ],
    queries: [
      { id: "q1", question: "Can I claim HRA if I live with my parents?", answer: "Yes, you can claim HRA by paying rent to your parents. However, there must be a genuine landlord-tenant relationship: you should transfer rent to their account, have a rent agreement, and they must declare this rental income in their tax filing. You cannot claim HRA if you are a co-owner of the property.", category: "HRA & Rent", timestamp: "2026-07-02T11:00:00Z", bookmarked: true }
    ],
    tasks: [
      { id: "t1", text: "Download Form 26AS and check for mismatches", completed: true, dueDate: "2026-07-05", priority: "medium" },
      { id: "t2", text: "Download Annual Information Statement (AIS) from IT portal", completed: false, dueDate: "2026-07-04", priority: "high" },
      { id: "t3", text: "Obtain bank interest certificates from HDFC and SBI", completed: false, dueDate: "2026-07-10", priority: "low" }
    ],
    notifications: [
      { id: "n1", text: "Form 16 uploaded successfully for Divyansh Sharma.", type: "success", timestamp: "2026-06-28T14:30:00Z", read: false },
      { id: "n2", text: "AIS document is still pending download and verification.", type: "warning", timestamp: "2026-07-02T09:00:00Z", read: false }
    ],
    notes: "Waiting for Form 16 from the company (Completed). Now need to double check AIS for bank interest accuracy before choosing final filing summary.",
    incomeData: {
      salary: 1250000,
      rental: 180000,
      business: 0,
      interest: 24500,
      other: 12000,
      deductions80c: 150000,
      deductions80d: 25000,
      otherDeductions: 50000
    },
    recommendations: [
      { id: "r1", type: "opportunity", title: "Claim Section 80TTA Interest Deduction", description: "You have bank savings interest of ₹24,500. Under Section 80TTA, you can claim a deduction up to ₹10,000 in the Old Regime.", impactValue: "₹10,000", status: "pending" },
      { id: "r2", type: "missing_proof", title: "Verify Rent Receipts for HRA", description: "You mentioned rental payments in HRA details. Ensure you have landlord's PAN if annual rent exceeds ₹1,00,000.", impactValue: "TDS Compliance", status: "pending" }
    ]
  },
  {
    id: "p2",
    name: "Rajesh Sharma",
    relation: "Father",
    filingStatus: "Not Started",
    avatarColor: "bg-emerald-600",
    step: 1,
    basicDetails: {
      name: "Rajesh Sharma",
      pan: "PQRTS5678Z",
      aadhaar: "9876-5432-1098",
      dob: "1959-11-20",
      mobile: "+91 98222 33344",
      email: "rajesh.sharma@example.com",
      address: "102, Shanti Kunj, Sector 4, Dwarka, New Delhi - 110075"
    },
    residentialStatus: "Resident",
    employmentType: "Retired",
    incomeSources: ["Pension", "Interest", "Dividend"],
    taxRegime: "Not sure",
    checklist: [
      { id: "c1", text: "Verify basic details & PAN", completed: false, category: "Identity" },
      { id: "c2", text: "Link Aadhaar with PAN", completed: true, category: "Identity" },
      { id: "c3", text: "Download Form 26AS", completed: false, category: "Income Verification" },
      { id: "c4", text: "Download Annual Information Statement (AIS)", completed: false, category: "Income Verification" },
      { id: "c5", text: "Collect Pension Slips", completed: false, category: "Income Verification" },
      { id: "c6", text: "Verify Senior Citizen Savings Schemes Interest", completed: false, category: "Income Verification" }
    ],
    documents: [
      { id: "d1", name: "Aadhaar Rajesh.pdf", category: "Aadhaar", status: "Uploaded", uploadDate: "2026-06-20", fileSize: "420 KB", fileType: "pdf" },
      { id: "d2", name: "PAN Rajesh.pdf", category: "PAN", status: "Missing", uploadDate: "", fileSize: "", fileType: "" }
    ],
    aiChats: [],
    queries: [],
    tasks: [
      { id: "t1", text: "Locate Father's physical PAN card to scan", completed: false, dueDate: "2026-07-08", priority: "high" }
    ],
    notifications: [
      { id: "n1", text: "Profile created for Father (Rajesh Sharma)", type: "info", timestamp: "2026-07-02T12:00:00Z", read: false }
    ],
    notes: "Father is a retired senior citizen. Need to assess Senior Citizen Savings Scheme interest statements and check if Section 80TTB is applicable.",
    incomeData: {
      salary: 0,
      rental: 0,
      business: 0,
      interest: 185000,
      other: 480000, // Pension
      deductions80c: 120000,
      deductions80d: 50000, // Senior Health Insurance
      otherDeductions: 50000 // Standard Deduction for pension
    },
    recommendations: [
      { id: "r1", type: "deduction", title: "Claim Section 80TTB Senior Interest Deduction", description: "As a senior citizen, father can claim deduction up to ₹50,000 on savings and FD interest under 80TTB.", impactValue: "₹50,000", status: "pending" }
    ]
  }
];

const STORE_PATH = path.join(process.cwd(), "profiles_store.json");

// Helper to load profiles
function loadProfiles(): any[] {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf8");
      return JSON.parse(data);
    } else {
      // Seed default profiles
      fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_PROFILES, null, 2));
      return DEFAULT_PROFILES;
    }
  } catch (error) {
    console.error("Error loading profiles store, resetting to defaults", error);
    return DEFAULT_PROFILES;
  }
}

// Helper to save profiles
function saveProfiles(profiles: any[]) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(profiles, null, 2));
  } catch (error) {
    console.error("Error saving profiles store", error);
  }
}

// Lazy Gemini Initializer
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not defined. AI functionality will run in offline rule-based simulation mode.");
    return null;
  }
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
    return aiClient;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API 1: Get profiles
  app.get("/api/profiles", (req, res) => {
    const profiles = loadProfiles();
    res.json(profiles);
  });

  // API 2: Save or Update Profiles
  app.post("/api/profiles", (req, res) => {
    const updatedProfiles = req.body;
    if (Array.isArray(updatedProfiles)) {
      saveProfiles(updatedProfiles);
      res.json({ success: true, count: updatedProfiles.length });
    } else {
      res.status(400).json({ error: "Invalid payload: Expected an array of profiles." });
    }
  });

  // API 3: Reset Profiles to default
  app.post("/api/profiles/reset", (req, res) => {
    saveProfiles(DEFAULT_PROFILES);
    res.json({ success: true, profiles: DEFAULT_PROFILES });
  });

  // API 4: Interactive Tax AI Guide Chat
  app.post("/api/tax-ai/chat", async (req, res) => {
    const { message, history, profileName, currentStepName, profileData } = req.body;
    
    const client = getGeminiClient();
    if (!client) {
      // Elegant rule-based fallback when API key is missing
      return res.json({
        text: `[OFFLINE DEMO MODE] Thank you for your question, ${profileName}! Because your Gemini API key is currently loading, here is a helpful automated guide:
        
- **AIS/26AS**: Download Form 26AS and your AIS (Annual Information Statement) from the official e-filing portal to check details.
- **Tax Regimes**: The **New Regime** offers lower tax slabs with fewer deductions (default limit ₹7 Lakhs is tax-free). The **Old Regime** lets you claim HRA, 80C, 80D, etc.
- **HRA**: Geniune tenancy is required, with rent receipts, rent agreement, and landlord PAN.
- **Standard Deduction**: A flat ₹50,000 standard deduction is available to salaried/pensioners in both regimes.
        
Please connect your API key in **Settings > Secrets** to unlock full conversational tax consulting!`
      });
    }

    try {
      const stepContext = currentStepName ? `Currently, the taxpayer is at Step: "${currentStepName}".` : "";
      const infoContext = profileData ? `Taxpayer profile info:\n${JSON.stringify(profileData, null, 2)}` : "";
      
      const systemInstruction = `You are TaxPilot AI, an elite tax consulting assistant representing Indian Income Tax rules (ITR-1/ITR-2 filing guidelines, Section 80C, 80D, 80TTA, standard deductions, HRA guidelines, Old vs New tax regime calculations, Form 16, AIS, and Form 26AS matching).
Your primary target is to offer extremely clear, objective, accurate, and easy-to-understand explanations of complex tax terms.
The taxpayer name is "${profileName}". ${stepContext}
Keep your answers brief, actionable, and formatted in clean markdown. Speak directly to the user as a friendly personal CA.
If they ask about old vs new regime, compare them dynamically.
${infoContext}`;

      // Convert conversation history into GoogleGenAI format
      const formattedContents = history ? history.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      })) : [];

      // Add the new user message
      formattedContents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Gemini Chat Error:", err);
      res.status(500).json({ error: "Failed to fetch answer from TaxPilot AI. Error: " + err.message });
    }
  });

  // API 5: Smart Tax Recommendations Engine (JSON Schema generated by Gemini)
  app.post("/api/tax-ai/recommendations", async (req, res) => {
    const { profile } = req.body;
    const client = getGeminiClient();

    if (!client) {
      // Rule-based fallback suggestions
      const fallbackRecs = [
        {
          id: "fr1",
          type: "deduction",
          title: "Verify Section 80C Investment Limit",
          description: "Max out Section 80C deductions up to ₹1,50,000 using PPF, ELSS, NPS, or School Fees under the Old Regime.",
          impactValue: "Up to ₹1.5L",
          status: "pending"
        },
        {
          id: "fr2",
          type: "missing_proof",
          title: "Double check interest from all banks",
          description: "Most bank savings accounts interest isn't fully reported on Form 16. Match your savings book with your AIS.",
          impactValue: "Section 80TTA/B",
          status: "pending"
        }
      ];
      return res.json({ recommendations: fallbackRecs });
    }

    try {
      const prompt = `Analyze this taxpayer profile and generate highly specific, real tax-saving recommendations, missing proof alerts, potential issues, or warnings based on their financial and personal details.
Taxpayer details:
${JSON.stringify(profile, null, 2)}

Provide up to 4 highly precise and tailored items that match Indian Income Tax laws (such as 80C, 80D health insurance, standard deduction, 80TTA/80TTB for seniors, regime analysis, or HRA proofs).
Return exclusively as a valid JSON array complying with the requested response schema.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { 
                      type: Type.STRING, 
                      enum: ["deduction", "warning", "missing_proof", "opportunity"] 
                    },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    impactValue: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ["pending"] }
                  },
                  required: ["id", "type", "title", "description", "impactValue", "status"]
                }
              }
            },
            required: ["recommendations"]
          }
        }
      });

      const parsed = JSON.parse(response.text || "{}");
      res.json(parsed);
    } catch (err: any) {
      console.error("Gemini Recommendations Error:", err);
      res.status(500).json({ error: "Failed to generate AI recommendations: " + err.message });
    }
  });

  // API 6: Direct Tax Regime Compare Advisor
  app.post("/api/tax-ai/regime-compare", async (req, res) => {
    const { incomeData, profileName } = req.body;
    const client = getGeminiClient();

    if (!client) {
      return res.json({
        analysis: `### regime comparison for ${profileName}

Based on standard offline calculations:
- **Gross Salary/Income**: ₹${(incomeData.salary + incomeData.interest + incomeData.rental + incomeData.other).toLocaleString()}
- **Total Deductions**: ₹${(incomeData.deductions80c + incomeData.deductions80d + incomeData.otherDeductions).toLocaleString()}

**Recommendation**:
- Since your income is robust and you have considerable 80C/80D investments, you should do a custom math comparison. Usually, if your total deductions exceed ₹2.5 Lakhs, the **Old Regime** yields a lower tax; otherwise, the lower slabs of the **New Regime** are significantly more beneficial without investment blockages.`
      });
    }

    try {
      const prompt = `Taxpayer Name: ${profileName}
Income Details:
- Salary: ₹${incomeData.salary}
- House Rent Income (Rental): ₹${incomeData.rental}
- Bank/FD Interest: ₹${incomeData.interest}
- Other Sources: ₹${incomeData.other}

Deductions under Old Regime:
- Section 80C: ₹${incomeData.deductions80c}
- Section 80D (Health Insurance): ₹${incomeData.deductions80d}
- Other deductions: ₹${incomeData.otherDeductions}

Perform a rigorous, dynamic comparative calculation between the Indian Old Tax Regime and New Tax Regime (FY 2025-26 rules: Standard deduction of ₹50,000 for salaried, slab levels). Explain clearly which regime saves more money and exactly why. Keep it elegant, numeric, and easy to read.`;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (err: any) {
      console.error("Gemini Regime Compare Error:", err);
      res.status(500).json({ error: "Failed to calculate tax regime compare: " + err.message });
    }
  });

  // Vite development server middleware setup or production static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TaxPilot AI Fullstack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
