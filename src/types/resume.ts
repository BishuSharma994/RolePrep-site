export type ResumeSection = {
  title: string;
  bullets: string[];
};

export type ResumeDocument = {
  summary: string;
  skills: string[];
  experience: ResumeSection[];
  projects: ResumeSection[];
};

export type ResumeGeneratePayload = {
  userId?: string | null;
  jdText: string;
  rawText?: string | null;
  sessionId?: string | null;
};

export type ResumeImprovePayload = {
  userId?: string | null;
  jdText: string;
  resumeJson?: ResumeDocument | null;
  rawText?: string | null;
  sessionId?: string | null;
};

export type ResumeResponse = {
  status: string;
  userId: string;
  jdText: string;
  resumeJson: ResumeDocument;
  createdAt: string;
  pdfBase64: string;
  pdfFilename: string;
  contentType: string;
};
