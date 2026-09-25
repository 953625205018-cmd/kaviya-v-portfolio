export type NavigationTab =
  | 'home'
  | 'communication-skills'
  | 'podcast'
  | 'listening-skill'
  | 'video-resume'
  | 'group-discussion'
  | 'mock-interview';

export interface MediaRecord {
  id: string;
  type: 'video' | 'audio' | 'image';
  title: string;
  topic?: string;
  date?: string;
  description: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  fileUrl: string; // Persistent cloud URL in database
  mediaBlobUrl?: string; // Kept for backwards compatibility
  isSample?: boolean;
  userId?: string;
  section?: string;
  uploadDate?: string;
  uploadTime?: string;
  uploadStatus?: 'saved' | 'uploading' | 'synced';
}

export interface ReflectionData {
  satoriTalkReflection?: string;
  podcastKeyMessage?: string;
  listeningWhatILearned?: string;
  mockInterviewWhatIDidWell?: string;
  mockInterviewWhatINeedToImprove?: string;
  mockInterviewWhatILearned?: string;
}
