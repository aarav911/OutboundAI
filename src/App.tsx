import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronRight,
  TrendingUp,
  Briefcase,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Settings,
  Mail,
  BarChart3,
  FileSpreadsheet,
  ExternalLink,
  Lock,
  Building2,
  Globe,
  Sparkles,
  Check,
  RotateCcw,
  FileText,
  Send,
  Edit3,
  Filter
} from "lucide-react";
import { Lead, OutreachLog, UserSettings, SearchResult, OutreachResult } from "./types";

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<"search" | "crm" | "outreach" | "analytics" | "settings">("search");

  // Global Sourcing State
  const [searchQuery, setSearchQuery] = useState("I need manufacturers of biodegradable packaging in India.");
  const [weights, setWeights] = useState({ relevance: 85, location: 60, scale: 75 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);

  // DB Sync State
  const [crmLeads, setCrmLeads] = useState<Lead[]>([]);
  const [outreachLogs, setOutreachLogs] = useState<OutreachLog[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    myCompanyName: "EcoPack Solutions",
    myCompanySector: "Sustainable Supply Chains",
    myValueProposition: "We provide sustainable retail packaging consultancy and distribution services to direct-to-consumer eco-brands."
  });

  // Active Outreach Setup
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [outreachGoal, setOutreachGoal] = useState<string>("Request Quote");
  const [outreachNotes, setOutreachNotes] = useState<string>("");
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");

  // UI state
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [crmFilter, setCrmFilter] = useState<string>("All");

  // Search stages for interactive loading
  const searchSteps = [
    "Interpreting business intent and search parameters...",
    "Searching online public sources via Google Search Grounding...",
    "Extracting match specifications, locations, and contact info...",
    "Applying ranking weights and operational compatibility scores...",
    "Structuring curated strategic recommendations..."
  ];

  // Fetch initial database status on mount
  useEffect(() => {
    fetchDatabaseState();
  }, []);

  const showNotification = (message: string, type: "success" | "error" | "info" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchDatabaseState = async () => {
    try {
      const response = await fetch("/api/db");
      if (response.ok) {
        const data = await response.json();
        setCrmLeads(data.crmLeads || []);
        setOutreachLogs(data.outreachLogs || []);
        if (data.userSettings) {
          setUserSettings(data.userSettings);
        }
      }
    } catch (err) {
      console.error("Failed to sync database:", err);
    }
  };

  // Launch AI sourcing pipeline
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchStep(0);
    setSearchResults(null);

    // Dynamic timer to simulate realistic pipeline stages
    const stepInterval = setInterval(() => {
      setSearchStep((prev) => {
        if (prev < searchSteps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1800);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, weights })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (data.leads) {
        setSearchResults(data);
        if (data.error) {
          showNotification(data.error, "info");
        } else {
          showNotification(`Successfully discovered and ranked ${data.leads.length} matches!`, "success");
        }
      } else if (data.error) {
        showNotification(data.error, "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("Sourcing query failed. Fallback list loaded.", "info");
    } finally {
      setIsSearching(false);
    }
  };

  // Save lead to CRM
  const handleAddToCrm = async (lead: Lead) => {
    const alreadySaved = crmLeads.some((l) => l.name === lead.name);
    if (alreadySaved) {
      showNotification("Lead already added to your CRM pipeline", "info");
      return;
    }

    try {
      const response = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead: {
            ...lead,
            status: "Discovered"
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCrmLeads((prev) => [...prev, data.lead]);
          showNotification(`Saved "${lead.name}" to CRM Pipeline`, "success");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not save to CRM", "error");
    }
  };

  // Update CRM Lead properties (status, notes)
  const handleUpdateCrmLead = async (updatedLead: Lead) => {
    try {
      const response = await fetch("/api/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead: updatedLead })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCrmLeads((prev) =>
            prev.map((l) => (l.id === updatedLead.id ? data.lead : l))
          );
          showNotification(`Updated details for "${updatedLead.name}"`, "success");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not update lead on server", "error");
    }
  };

  // Delete lead from CRM
  const handleDeleteCrmLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from your pipeline?`)) return;

    try {
      const response = await fetch(`/api/crm/${id}`, { method: "DELETE" });
      if (response.ok) {
        setCrmLeads((prev) => prev.filter((l) => l.id !== id));
        showNotification(`Removed "${name}" from CRM`, "success");
        if (selectedLeadId === id) setSelectedLeadId("");
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not delete lead", "error");
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userSettings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserSettings(data.userSettings);
          showNotification("Corporate Settings saved successfully!", "success");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not save settings", "error");
    }
  };

  // Generate Outreach message
  const handleGenerateOutreach = async () => {
    const lead = crmLeads.find((l) => l.id === selectedLeadId) || 
                 (searchResults && searchResults.leads.find((l) => l.id === selectedLeadId));

    if (!lead) {
      showNotification("Please select a target lead first.", "error");
      return;
    }

    setIsGeneratingOutreach(true);
    setOutreachResult(null);

    try {
      const response = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          goal: outreachGoal,
          notes: outreachNotes
        })
      });

      if (response.ok) {
        const data: OutreachResult = await response.json();
        setOutreachResult(data);
        setEditedSubject(data.subject);
        setEditedBody(data.body);
        if (data.error) {
          showNotification(data.error, "info");
        } else {
          showNotification("AI personalized outreach template created!", "success");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Outreach generation failed", "error");
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // Record a simulated sent email
  const handleSendSimulatedEmail = async () => {
    const lead = crmLeads.find((l) => l.id === selectedLeadId);
    if (!lead) {
      showNotification("Selected lead must be saved in CRM to track dispatch.", "error");
      return;
    }

    try {
      const newLog = {
        leadId: lead.id,
        leadName: lead.name,
        subject: editedSubject,
        body: editedBody,
        goal: outreachGoal,
        status: "Sent" as const
      };

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ log: newLog })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setOutreachLogs((prev) => [data.log, ...prev]);
          
          // Auto update CRM lead state locally
          setCrmLeads((prev) =>
            prev.map((l) => {
              if (l.id === lead.id) {
                return {
                  ...l,
                  status: "Contacted",
                  notes: (l.notes || "") + `\n[${new Date().toLocaleDateString()}] Sent outreach: "${editedSubject}"`
                };
              }
              return l;
            })
          );
          
          showNotification(`Outreach sent to "${lead.name}"! Status updated to 'Contacted'.`, "success");
          setOutreachResult(null);
          setOutreachNotes("");
          setActiveTab("crm");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not record outreach log", "error");
    }
  };

  // Clean DB pipeline
  const handleClearDb = async () => {
    if (!confirm("Are you sure you want to completely clear your pipeline and campaign history?")) return;
    try {
      const response = await fetch("/api/crm/clear", { method: "POST" });
      if (response.ok) {
        setCrmLeads([]);
        setOutreachLogs([]);
        showNotification("All records successfully cleared.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export pipeline to CSV
  const exportToCSV = () => {
    if (crmLeads.length === 0) {
      showNotification("No CRM data to export", "info");
      return;
    }

    const headers = ["ID", "Name", "Website", "Location", "Industry", "Description", "Email", "Phone", "Status", "Notes", "AddedAt"];
    const rows = crmLeads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      l.website,
      `"${l.location}"`,
      `"${l.industry}"`,
      `"${l.description.replace(/"/g, '""').substring(0, 100)}..."`,
      l.contactEmail,
      l.contactPhone,
      l.status || "Discovered",
      `"${(l.notes || "").replace(/"/g, '""')}"`,
      l.addedAt || ""
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Connecting_The_Dots_CRM_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("CRM Pipeline exported successfully!", "success");
  };

  // Quick setup helper to try outreach if CRM is empty
  const loadMockLeadForOutreach = () => {
    const mockLead: Lead = {
      id: "lead-biodeg-1",
      name: "Ecoware India",
      website: "https://www.ecoware.in",
      location: "New Delhi, India",
      industry: "Eco-Friendly Food Packaging",
      description: "India's largest manufacturer of certified 100% biodegradable, compostable tableware. Made from sugarcane bagasse waste.",
      contactEmail: "sales@ecoware.in",
      contactPhone: "+91 11 4050 4550",
      relevanceScore: 98,
      matchReason: "Direct match with active international compliance certifications."
    };
    handleAddToCrm(mockLead);
    setSelectedLeadId(mockLead.id);
    showNotification("Mock Lead 'Ecoware India' loaded into pipeline", "info");
  };

  // Count leads in CRM lanes
  const getLaneCount = (status: string) => {
    return crmLeads.filter((l) => (l.status || "Discovered") === status).length;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row antialiased">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in flex items-center gap-3 bg-white border border-slate-200 shadow-xl rounded-xl px-4 py-3 max-w-sm">
          {notification.type === "success" && (
            <div className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
          )}
          {notification.type === "info" && (
            <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-100" />
          )}
          {notification.type === "error" && (
            <div className="h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-100" />
          )}
          <span className="text-sm font-medium text-slate-700">{notification.message}</span>
        </div>
      )}

      {/* Left Sidebar Navigation (Desktop) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 hidden md:flex">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-md shadow-blue-100">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-slate-800 leading-tight">DotConnect AI</span>
            <span className="text-[10px] text-slate-400 font-medium">B2B Sourcing Intelligence</span>
          </div>
        </div>

        {/* Sidebar Menu Options */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            id="sidebar-search"
            onClick={() => setActiveTab("search")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
              activeTab === "search"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Search className="w-4 h-4" />
            Sourcing Engine
          </button>
          <button
            id="sidebar-crm"
            onClick={() => setActiveTab("crm")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
              activeTab === "crm"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="flex items-center gap-3">
              <Briefcase className="w-4 h-4" />
              CRM Pipeline
            </span>
            {crmLeads.length > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                activeTab === "crm" ? "bg-blue-200 text-blue-800" : "bg-slate-100 text-slate-600"
              }`}>
                {crmLeads.length}
              </span>
            )}
          </button>
          <button
            id="sidebar-outreach"
            onClick={() => setActiveTab("outreach")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
              activeTab === "outreach"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Mail className="w-4 h-4" />
            AI Outreach
          </button>
          <button
            id="sidebar-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
              activeTab === "analytics"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            id="sidebar-settings"
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
              activeTab === "settings"
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings className="w-4 h-4" />
            My Brand
          </button>
        </nav>

        {/* Sidebar Footer User Info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-blue-600 text-sm">
              SJ
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 truncate">Sarah Jenkins</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">Enterprise Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Column */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Mobile Header (visible only on mobile) */}
        <header className="bg-white border-b border-slate-200 flex items-center justify-between p-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base text-slate-800 tracking-tight">DotConnect AI</span>
          </div>
          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> AI Active
          </span>
        </header>

        {/* Mobile Navigation Rail */}
        <div className="md:hidden bg-white border-b border-slate-100 flex overflow-x-auto py-2 px-4 gap-1.5">
          <button
            onClick={() => setActiveTab("search")}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === "search" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            Sourcing
          </button>
          <button
            onClick={() => setActiveTab("crm")}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === "crm" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            CRM ({crmLeads.length})
          </button>
          <button
            onClick={() => setActiveTab("outreach")}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === "outreach" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            Outreach
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === "analytics" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg ${
              activeTab === "settings" ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-600 border border-slate-100"
            }`}
          >
            My Brand
          </button>
        </div>

        {/* Desktop Header panel (visible only on desktop) */}
        <header className="h-16 border-b border-slate-200 bg-white items-center justify-between px-8 shrink-0 hidden md:flex">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-lg">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-full pl-10 pr-4 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-2.5" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> AI Active
            </span>
            {activeTab === "search" && (
              <button
                onClick={() => {
                  setSearchQuery("I need manufacturers of biodegradable packaging in India.");
                  setSearchResults(null);
                }}
                className="text-xs bg-slate-850 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                Reset Search
              </button>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* TAB 1: SOURCING FINDER (SEARCH) */}
        {activeTab === "search" && (
          <div className="space-y-8 animate-fade-in">
            {/* Lead Sourcing Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="max-w-3xl">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-600" />
                  Intelligent Public Sourcing Finder
                </h2>
                <p className="text-sm text-slate-500 mt-1 mb-6">
                  Enter any complex business problem, sourcing requirement, or expert search query. Gemini will analyze your intent, search public web indexes, extract entity credentials, and compile structured leads.
                </p>
              </div>

              <form onSubmit={handleSearch} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    What are you looking for?
                  </label>
                  <div className="relative">
                    <input
                      id="search-input"
                      type="text"
                      className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-3.5 pl-12 pr-4 text-slate-800 font-medium shadow-inner transition-all duration-200 outline-none placeholder-slate-400"
                      placeholder="e.g. manufacturers of biodegradable packaging in India"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>

                {/* Sourcing Weight Sliders */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                    <Filter className="h-3 w-3 text-blue-500" />
                    Configure Sourcing Priority Filters
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                        <span>Relevance Match</span>
                        <span className="font-mono text-blue-600 font-bold">{weights.relevance}%</span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-blue-600 cursor-pointer"
                        min="20"
                        max="100"
                        value={weights.relevance}
                        onChange={(e) => setWeights({ ...weights, relevance: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                        <span>Geographic Alignment</span>
                        <span className="font-mono text-blue-600 font-bold">{weights.location}%</span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-blue-600 cursor-pointer"
                        min="20"
                        max="100"
                        value={weights.location}
                        onChange={(e) => setWeights({ ...weights, location: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                        <span>Industrial Scale Sourcing</span>
                        <span className="font-mono text-blue-600 font-bold">{weights.scale}%</span>
                      </div>
                      <input
                        type="range"
                        className="w-full accent-blue-600 cursor-pointer"
                        min="20"
                        max="100"
                        value={weights.scale}
                        onChange={(e) => setWeights({ ...weights, scale: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-slate-400 font-medium">
                    Powered by <strong className="text-slate-600">Gemini 3.5 & Google Search Grounding</strong>
                  </div>
                  <button
                    id="search-btn"
                    type="submit"
                    disabled={isSearching}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 rounded-xl flex items-center gap-2 cursor-pointer transition shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Researching Public Networks...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Search & Analyze
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Loading Terminal Animation */}
            {isSearching && (
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl animate-pulse">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <div className="h-3 w-3 rounded-full bg-amber-500" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">ai_agent_sourcing_pipeline.sh</span>
                </div>
                <div className="space-y-3 font-mono text-xs text-blue-400 leading-relaxed">
                  <p className="text-emerald-400"># Initializing B2B intelligence matrix...</p>
                  {searchSteps.map((step, idx) => (
                    <div key={idx} className={`flex items-center gap-2 ${idx > searchStep ? "opacity-30" : ""}`}>
                      {idx < searchStep ? (
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : idx === searchStep ? (
                        <Loader2 className="h-3 w-3 animate-spin text-amber-400 flex-shrink-0" />
                      ) : (
                        <span className="h-3 w-3 rounded-full bg-slate-700 flex-shrink-0" />
                      )}
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sourcing Results Matrix */}
            {searchResults && (
              <div className="space-y-8 animate-fade-in">
                {/* Intent & Overview Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Analysis Summary */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 md:col-span-2 space-y-4">
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      Query Intent analysis
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">
                      "{searchResults.analysis.queryIntent}"
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 pt-3">
                      <div>
                        <span className="text-slate-400 text-xs block">Target Sector</span>
                        <span className="font-semibold text-slate-800">{searchResults.analysis.targetSector}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Geographic Focus</span>
                        <span className="font-semibold text-slate-800">{searchResults.analysis.geographicFocus}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sourcing Challenges */}
                  <div className="bg-slate-900 text-blue-100 rounded-2xl p-5 space-y-3 shadow-inner">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                      Critical Evaluation parameters
                    </h4>
                    <ul className="space-y-2 text-xs">
                      {searchResults.analysis.keyChallenges.map((challenge, idx) => (
                        <li key={idx} className="flex gap-2">
                          <AlertCircle className="h-4 w-4 text-blue-300 flex-shrink-0" />
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Sourcing Citations */}
                {searchResults.citations && searchResults.citations.length > 0 && (
                  <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        Google Search Grounding sources
                      </h4>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="h-3 w-3" /> Grounding Verified
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchResults.citations.map((cite, idx) => (
                        <a
                          key={idx}
                          href={cite.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-700 flex items-center gap-1 transition"
                        >
                          <FileText className="h-3 w-3 text-blue-400" />
                          {cite.title.length > 40 ? `${cite.title.substring(0, 40)}...` : cite.title}
                          <ExternalLink className="h-2.5 w-2.5 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Leads List */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Ranked Sourcing Leads Recommendations
                  </h3>

                  <div className="grid grid-cols-1 gap-6">
                    {searchResults.leads.map((lead) => {
                      const inCrm = crmLeads.some((l) => l.name === lead.name);
                      return (
                        <div
                          key={lead.id}
                          className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row gap-6 relative"
                        >
                          {/* Score Metric Gauge */}
                          <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-xl p-4 lg:w-36 text-center">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Relevance</span>
                            <div className="text-3xl font-black font-mono text-blue-600">
                              {lead.relevanceScore}%
                            </div>
                            <span className="text-[10px] text-blue-500 font-semibold mt-1 bg-blue-50 px-2 py-0.5 rounded-full">
                              Match Index
                            </span>
                          </div>

                          {/* Lead Information */}
                          <div className="flex-grow space-y-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-lg font-bold text-slate-900">{lead.name}</h4>
                                {lead.website && (
                                  <a
                                    href={lead.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center gap-0.5"
                                  >
                                    Visit site <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                                  {lead.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                                  {lead.industry}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed">
                              {lead.description}
                            </p>

                            <div className="bg-blue-50/50 p-3 rounded-lg text-blue-900 border border-blue-50/50">
                              <strong className="text-blue-950 block mb-1">AI Recommendation Context:</strong>
                              {lead.matchReason}
                            </div>

                            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              {lead.contactEmail && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Mail className="h-3.5 w-3.5 text-blue-400" />
                                  {lead.contactEmail}
                                </span>
                              )}
                              {lead.contactPhone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Globe className="h-3.5 w-3.5 text-blue-400" />
                                  {lead.contactPhone}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Sourcing Controls */}
                          <div className="flex lg:flex-col gap-3 justify-center items-stretch lg:w-44 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                            <button
                              onClick={() => handleAddToCrm(lead)}
                              disabled={inCrm}
                              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition shadow-sm ${
                                inCrm
                                  ? "bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200"
                                  : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                              }`}
                            >
                              {inCrm ? (
                                <>
                                  <Check className="h-4 w-4" />
                                  In CRM Pipeline
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  Add to Pipeline
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                // Auto save to CRM if not there
                                if (!inCrm) {
                                  handleAddToCrm(lead);
                                }
                                setSelectedLeadId(lead.id);
                                setActiveTab("outreach");
                              }}
                              className="bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-700 hover:text-blue-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition"
                            >
                              <Mail className="h-4 w-4 text-blue-500" />
                              Write Outreach
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Market Summary & Sourcing Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {/* Synthesis Report */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                      Strategic Sourcing Analysis
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {searchResults.marketSummary}
                    </p>
                  </div>

                  {/* Sourcing Actions */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-md font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Suggested Operational Steps
                    </h3>
                    <ul className="space-y-3.5">
                      {searchResults.suggestedNextActions.map((action, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start">
                          <span className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 font-bold font-mono text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-slate-600 leading-normal">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CRM SALES PIPELINE (KANBAN BOARD) */}
        {activeTab === "crm" && (
          <div className="space-y-8 animate-fade-in">
            {/* Header Toolbar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  CRM Sales & Sourcing Pipeline
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage saved manufacturer and expert leads. Add notes, track deal stages, and export logs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Clear Database button */}
                <button
                  onClick={handleClearDb}
                  className="bg-white hover:bg-rose-50 border border-slate-200 text-slate-600 hover:text-rose-700 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear All
                </button>

                {/* Export button */}
                <button
                  onClick={exportToCSV}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Empty State */}
            {crmLeads.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Your CRM Pipeline is Empty</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Start by using our Sourcing Finder to search public web directories. Once you find highly relevant leads, click "Add to Pipeline" to track them here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <button
                    onClick={() => setActiveTab("search")}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Go to Sourcing Engine
                  </button>
                  <button
                    onClick={loadMockLeadForOutreach}
                    className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl transition"
                  >
                    Quick-Load Sample Lead
                  </button>
                </div>
              </div>
            ) : (
              /* KANBAN BOARD */
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {/* STAGES */}
                {["Discovered", "Shortlisted", "Contacted", "In Conversation", "Closed-Won"].map((stage) => {
                  const stageLeads = crmLeads.filter((l) => (l.status || "Discovered") === stage);
                  return (
                    <div
                      key={stage}
                      className="bg-slate-100 rounded-2xl p-3 border border-slate-200 flex flex-col min-h-[500px]"
                    >
                      {/* Lane Title */}
                      <div className="flex justify-between items-center mb-3 px-1">
                        <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider">
                          {stage === "Closed-Won" ? "🎉 Closed-Won" : stage}
                        </h4>
                        <span className="bg-slate-200 text-slate-700 font-mono text-xs font-bold px-2 py-0.5 rounded-full">
                          {stageLeads.length}
                        </span>
                      </div>

                      {/* Lane Cards Container */}
                      <div className="flex-grow space-y-3 overflow-y-auto">
                        {stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl p-4 shadow-sm hover:shadow transition space-y-3"
                          >
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-900 text-sm leading-tight hover:text-blue-600 transition">
                                {lead.name}
                              </h5>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                <MapPin className="h-3 w-3" />
                                {lead.location}
                              </div>
                            </div>

                            {/* Score Tag */}
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                Fit: {lead.relevanceScore}%
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {lead.website ? lead.website.replace("https://", "").replace("www.", "").split("/")[0] : ""}
                              </span>
                            </div>

                            {/* Collapsible notes editor */}
                            <div className="border-t border-slate-100 pt-2 space-y-2">
                              {expandedLeadId === lead.id ? (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-400 uppercase">Interactive Logs & Notes</label>
                                  <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500"
                                    rows={4}
                                    placeholder="Add follow-up notes, phone call logs or deal updates here..."
                                    value={lead.notes || ""}
                                    onChange={(e) =>
                                      setCrmLeads((prev) =>
                                        prev.map((l) =>
                                          l.id === lead.id ? { ...l, notes: e.target.value } : l
                                        )
                                      )
                                    }
                                    onBlur={() => handleUpdateCrmLead(lead)}
                                  />
                                  <p className="text-[9px] text-slate-400">Notes auto-save on blur.</p>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setExpandedLeadId(lead.id)}
                                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  {lead.notes ? "Edit Logs & Notes" : "Add Logs & Notes"}
                                </button>
                              )}
                            </div>

                            {/* Move Column dropdown */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                              <select
                                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600 rounded-md p-1 outline-none cursor-pointer"
                                value={lead.status || "Discovered"}
                                onChange={(e) => {
                                  const newStatus = e.target.value as Lead["status"];
                                  handleUpdateCrmLead({ ...lead, status: newStatus });
                                }}
                              >
                                <option value="Discovered">Discovered</option>
                                <option value="Shortlisted">Shortlisted</option>
                                <option value="Contacted">Contacted</option>
                                <option value="In Conversation">In Conversation</option>
                                <option value="Closed-Won">Closed-Won</option>
                              </select>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLeadId(lead.id);
                                    setActiveTab("outreach");
                                  }}
                                  title="Write outreach template"
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition"
                                >
                                  <Mail className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCrmLead(lead.id, lead.name)}
                                  title="Remove from CRM"
                                  className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: AI OUTREACH CENTER */}
        {activeTab === "outreach" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
            {/* Left Sidebar Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Personalized AI Outreach
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Draft highly tailored, commercial outreach emails powered by Gemini copywriting intelligence.
                </p>
              </div>

              {/* Lead Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Target Lead
                </label>
                {crmLeads.length === 0 ? (
                  <div className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center space-y-2">
                    <span>No leads in pipeline yet to write campaigns for.</span>
                    <button
                      onClick={loadMockLeadForOutreach}
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold block mx-auto px-3 py-1.5 rounded-lg text-xs"
                    >
                      Quick-Load Sample Lead
                    </button>
                  </div>
                ) : (
                  <select
                    id="lead-select"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                    value={selectedLeadId}
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value);
                      setOutreachResult(null);
                    }}
                  >
                    <option value="">-- Choose saved lead --</option>
                    {crmLeads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.location})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Campaign Goal */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Campaign Goal
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
                  value={outreachGoal}
                  onChange={(e) => setOutreachGoal(e.target.value)}
                >
                  <option value="Request Quote">Request Sourcing Quote (RFQ)</option>
                  <option value="Partnership Proposal">Strategic Channel Partnership</option>
                  <option value="Industry Sourcing Survey">Expert Interview / Research</option>
                  <option value="Consultation Sales Pitch">Direct Value Presentation</option>
                </select>
              </div>

              {/* Custom notes instructions */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Special Instructions
                </label>
                <textarea
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
                  rows={4}
                  placeholder="e.g. Highlight our ISO-9001 compliance, ask about small MOQ samples, or request their export catalog..."
                  value={outreachNotes}
                  onChange={(e) => setOutreachNotes(e.target.value)}
                />
              </div>

              {/* Generate button */}
              <button
                id="outreach-generate-btn"
                onClick={handleGenerateOutreach}
                disabled={isGeneratingOutreach || !selectedLeadId}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition shadow-sm disabled:cursor-not-allowed"
              >
                {isGeneratingOutreach ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Writing Outreach Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Personalize Outreach
                  </>
                )}
              </button>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <span className="font-bold text-slate-600 block">Personalization Context:</span>
                <p className="text-slate-500 leading-normal">
                  Outreach copywriting uses your <strong className="text-blue-600">My Brand Settings</strong> (Company: {userSettings.myCompanyName || "None"}) to contextualize how you solve challenges together.
                </p>
                <button
                  onClick={() => setActiveTab("settings")}
                  className="text-blue-600 hover:underline font-bold text-[11px]"
                >
                  Configure corporate profile &rarr;
                </button>
              </div>
            </div>

            {/* Right Display Area */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:col-span-2 flex flex-col justify-between min-h-[500px]">
              {outreachResult ? (
                <div className="space-y-6 flex-grow flex flex-col">
                  {/* Subject and Body Area */}
                  <div className="space-y-4 flex-grow flex flex-col">
                    <h3 className="text-md font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      AI Copywriting Generation
                    </h3>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Subject Line</label>
                      <input
                        type="text"
                        className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                      />
                    </div>

                    <div className="flex-grow flex flex-col">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email Message Body</label>
                      <textarea
                        className="w-full flex-grow bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg p-4 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 font-sans leading-relaxed"
                        rows={12}
                        value={editedBody}
                        onChange={(e) => setEditedBody(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Strategy Notes Panel */}
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 space-y-2">
                    <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-blue-600" />
                      AI Sourcing Sells Strategy Analysis
                    </h4>
                    <ul className="space-y-1.5 text-xs text-blue-900">
                      {outreachResult.strategyPoints.map((point, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dispatch simulation Controls */}
                  <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5 text-slate-400" />
                      Sending is a safe Sandbox simulation.
                    </span>

                    <button
                      id="outreach-send-btn"
                      onClick={handleSendSimulatedEmail}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 cursor-pointer transition shadow"
                    >
                      <Send className="h-4 w-4" />
                      Send Email (Simulated)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">No Outreach Draft Loaded</h3>
                  <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                    Select a Saved Lead on the left column, choose your goal, configure any custom specifications, and click <strong className="text-slate-700">"Personalize Outreach"</strong> to draft your high-conversion template.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STRATEGIC BUSINESS ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">CRM Lead Count</span>
                <div className="text-4xl font-black font-mono text-slate-900">{crmLeads.length}</div>
                <span className="text-[11px] text-blue-600 font-bold block">Total Saved Sourcing Fits</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Shortlisted Leads</span>
                <div className="text-4xl font-black font-mono text-slate-900">{getLaneCount("Shortlisted")}</div>
                <span className="text-[11px] text-amber-600 font-bold block">High Priority Deals</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Outreach Sent</span>
                <div className="text-4xl font-black font-mono text-slate-900">{outreachLogs.length}</div>
                <span className="text-[11px] text-emerald-600 font-bold block">Campaign Transmissions</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Closed contracts</span>
                <div className="text-4xl font-black font-mono text-slate-900">{getLaneCount("Closed-Won")}</div>
                <span className="text-[11px] text-blue-600 font-bold block">Completed Deals</span>
              </div>
            </div>

            {/* SVG Visualizations Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Funnel chart */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Sourcing Pipeline Stage distribution
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Lead status funnel density analysis</p>
                </div>

                <div className="space-y-4">
                  {["Discovered", "Shortlisted", "Contacted", "In Conversation", "Closed-Won"].map((stage, idx) => {
                    const count = getLaneCount(stage);
                    const percent = crmLeads.length > 0 ? (count / crmLeads.length) * 100 : 0;
                    
                    const colors = [
                      "bg-blue-200 border-blue-300 text-blue-900",
                      "bg-blue-300 border-blue-400 text-blue-950",
                      "bg-blue-400 border-blue-500 text-white",
                      "bg-blue-500 border-blue-600 text-white",
                      "bg-emerald-500 border-emerald-600 text-white"
                    ];

                    return (
                      <div key={stage} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                          <span>{stage}</span>
                          <span className="font-mono">{count} Leads ({Math.round(percent)}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-6 rounded-full overflow-hidden border border-slate-200 flex items-center">
                          <div
                            className={`h-full ${colors[idx]} border-r text-[10px] font-mono font-bold flex items-center justify-end pr-2 transition-all duration-500`}
                            style={{ width: `${percent > 5 ? percent : 5}%` }}
                          >
                            {count > 0 && `${count}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic Distribution Area list */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Geographical Match density
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">Regional analysis of compiled supplier directories</p>
                </div>

                <div className="flex-grow flex items-center justify-center p-4">
                  {/* Custom SVG World map illustration */}
                  <svg viewBox="0 0 400 200" className="w-full max-w-sm h-auto text-blue-100">
                    <rect width="400" height="200" fill="transparent" />
                    {/* Background world land outlines */}
                    <path
                      d="M20,60 C40,40 100,50 120,60 C140,70 160,80 180,90 C200,80 230,70 250,90 C270,110 290,120 310,130 C330,120 370,110 380,120 C390,130 380,150 360,160 C340,170 300,160 280,150 C260,140 240,150 220,160 C200,170 180,160 160,150 C140,140 100,130 80,140 C60,150 40,160 30,150 Z"
                      fill="#E2E8F0"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                    <path
                      d="M100,20 C120,10 150,15 170,25 C190,35 180,50 160,60 C140,70 110,65 90,55 Z"
                      fill="#E2E8F0"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                    {/* Dynamic Sourcing Fit points */}
                    {crmLeads.slice(0, 5).map((l, index) => {
                      const positions = [
                        { x: 260, y: 110 }, // India
                        { x: 140, y: 50 },  // North America
                        { x: 210, y: 40 },  // Europe
                        { x: 320, y: 130 }, // Australia
                        { x: 280, y: 70 }   // East Asia
                      ];
                      const pos = positions[index % positions.length];
                      return (
                        <g key={l.id} className="cursor-pointer group">
                          <circle cx={pos.x} cy={pos.y} r="8" fill="#3B82F6" fillOpacity="0.3" className="animate-ping" />
                          <circle cx={pos.x} cy={pos.y} r="4" fill="#2563EB" />
                          <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <rect x={pos.x - 45} y={pos.y - 30} width="90" height="20" rx="3" fill="#1E293B" />
                            <text x={pos.x} y={pos.y - 17} fill="#FFFFFF" fontSize="8" textAnchor="middle" fontWeight="bold">
                              {l.name.substring(0, 15)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <div className="flex justify-between items-center mb-1">
                    <span>Identified Hubs</span>
                    <span className="font-bold text-slate-700">{Array.from(new Set(crmLeads.map(l => l.location.split(",").pop()?.trim()))).join(", ") || "None"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Transmission History Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div>
                <h3 className="text-md font-bold text-slate-900 flex items-center gap-1.5">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Sent Campaign Transmissions History
                </h3>
                <p className="text-xs text-slate-400 mt-1">Audit log of simulated emails and responses</p>
              </div>

              {outreachLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  No outreach emails has been transmitted yet. Generate draft and click Send simulated email!
                </div>
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-bold">
                        <th className="py-3 px-1">Recipient Lead</th>
                        <th className="py-3 px-1">Goal</th>
                        <th className="py-3 px-1">Subject Line</th>
                        <th className="py-3 px-1">Timestamp</th>
                        <th className="py-3 px-1">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {outreachLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-1 font-bold text-slate-800">{log.leadName}</td>
                          <td className="py-3.5 px-1">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                              {log.goal}
                            </span>
                          </td>
                          <td className="py-3.5 px-1 font-medium text-slate-500 max-w-xs truncate">{log.subject}</td>
                          <td className="py-3.5 px-1 font-mono text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-1">
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                              <Check className="h-3 w-3" /> Transmitted
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CORPORATE SETTINGS (MY BRAND) */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="border-b border-slate-100 pb-4 mb-6">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  My Brand Settings
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your company identity and value statement. Gemini utilizes this profile to draft tailored, hyper-personalized emails.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    My Company Name
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-4 text-slate-800 font-semibold outline-none transition"
                    value={userSettings.myCompanyName}
                    onChange={(e) => setUserSettings({ ...userSettings, myCompanyName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    My Industry Sector
                  </label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-4 text-slate-800 font-semibold outline-none transition"
                    value={userSettings.myCompanySector}
                    onChange={(e) => setUserSettings({ ...userSettings, myCompanySector: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Corporate Value Proposition
                  </label>
                  <textarea
                    className="w-full bg-slate-50 hover:bg-slate-100 focus:bg-white border-2 border-slate-200 focus:border-blue-500 rounded-xl py-2.5 px-4 text-sm font-medium text-slate-700 outline-none transition"
                    rows={4}
                    value={userSettings.myValueProposition}
                    onChange={(e) => setUserSettings({ ...userSettings, myValueProposition: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl cursor-pointer transition shadow"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Connecting the Dots AI. Designed for elite strategic business Sourcing and Pipeline intelligence.</p>
          <p className="mt-1">Full Stack Sandbox Integration using React 19, Express, and Gemini 3.5 API.</p>
        </div>
      </footer>
    </div>
    </div>
  );
}
