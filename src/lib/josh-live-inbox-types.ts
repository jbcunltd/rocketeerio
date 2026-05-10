export type QualificationStatus = "New" | "Qualifying" | "Qualified" | "Unqualified";
export type LeadTemperature = "Cold" | "Warm" | "Hot";
export type MessageDirection = "inbound" | "outbound";

export type LiveConversationMessage = {
  id: string;
  direction: MessageDirection;
  content: string;
  timestampLabel: string;
  timestampIso: string | null;
};

export type StructuredQualificationFields = {
  budget?: string | null;
  authority?: string | null;
  need?: string | null;
  timeline?: string | null;
  location?: string | null;
};

export type StructuredLeadDecision = {
  leadStage?: string | null;
  confidence?: number | null;
  qualificationFields: StructuredQualificationFields;
  missingFields: string[];
  nextAction?: string | null;
  ownerAlert?: boolean | null;
  riskFlags: string[];
  updatedAtLabel?: string | null;
};

export type LiveConversation = {
  id: string;
  leadPsid: string;
  leadName: string;
  leadAvatarUrl?: string | null;
  lastMessagePreview: string;
  timestampLabel: string;
  qualificationStatus: QualificationStatus;
  isHot?: boolean;
  leadTemperature?: LeadTemperature;
  messages: LiveConversationMessage[];
  decision?: StructuredLeadDecision | null;
};
