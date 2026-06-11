export interface Domain {
  id: string;
  name: string;
  enabled: boolean;
  createdAt: number;
}

export type NameGender = 'male' | 'female' | 'last';

export interface NameRecord {
  id: string;
  name: string;
  gender: NameGender; // 'male', 'female', or 'last'
  createdAt: number;
}

export interface EmailPattern {
  id: string;
  name: string;
  pattern: string; // e.g. "[first][last]", "[first].[last]", etc.
  enabled: boolean;
  description: string;
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  timestamp: number;
  type: 'login' | 'action' | 'system';
  userId: string;
  userEmail: string;
  action: string;
  details?: string;
  ipAddress?: string;
}

export interface AppSettings {
  general: {
    websiteName: string;
    logoText: string;
    websiteDescription: string;
    faviconText: string;
  };
  appearance: {
    themeColor: string; // e.g. '#3b82f6'
    mode: 'dark' | 'light' | 'system';
    customCss: string;
  };
  security: {
    sessionTimeout: number; // in minutes
    loginProtection: boolean;
    activityMonitoring: boolean;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
  };
  advanced: {
    customJs: string;
    analyticsId: string;
  };
}

export interface GeneratedEmail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  domain: string;
  patternName: string;
}
