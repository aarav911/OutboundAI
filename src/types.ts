export interface Lead {
  id: string;
  name: string;
  website: string;
  location: string;
  industry: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  relevanceScore: number;
  matchReason: string;
  status?: "Discovered" | "Shortlisted" | "Contacted" | "In Conversation" | "Closed-Won";
  notes?: string;
  addedAt?: string;
  updatedAt?: string;
}

export interface OutreachLog {
  id: string;
  leadId: string;
  leadName: string;
  subject: string;
  body: string;
  goal: string;
  timestamp: string;
  status: "Sent" | "Bounced" | "Opened" | "Replied";
}

export interface UserSettings {
  myCompanyName: string;
  myCompanySector: string;
  myValueProposition: string;
}

export interface SearchAnalysis {
  queryIntent: string;
  targetSector: string;
  geographicFocus: string;
  keyChallenges: string[];
}

export interface Citation {
  title: string;
  uri: string;
}

export interface SearchResult {
  analysis: SearchAnalysis;
  leads: Lead[];
  marketSummary: string;
  suggestedNextActions: string[];
  citations?: Citation[];
  searchQueries?: string[];
  error?: string;
}

export interface OutreachResult {
  subject: string;
  body: string;
  strategyPoints: string[];
  error?: string;
}
