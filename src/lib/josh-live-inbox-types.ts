export type QualificationStatus = "New" | "Qualifying" | "Qualified" | "Unqualified";
export type LeadTemperature = "Cold" | "Warm" | "Hot";

export type LiveConversation = {
  id: string;
  leadName: string;
  leadAvatarUrl?: string | null;
  lastMessagePreview: string;
  timestampLabel: string;
  qualificationStatus: QualificationStatus;
  isHot?: boolean;
  leadTemperature?: LeadTemperature;
};
