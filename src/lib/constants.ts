import { Domain, EmailPattern, AppSettings } from '../types';

export const DEFAULT_MALE_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua',
  'Kenneth', 'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan',
  'Jacob', 'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon'
];

export const DEFAULT_FEMALE_NAMES = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Lisa', 'Nancy', 'Betty', 'Sandra', 'Margaret', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
  'Kathleen', 'Amy', 'Shirley', 'Angela', 'Helen', 'Anna', 'Brenda', 'Pamela', 'Nicole', 'Emma'
];

export const DEFAULT_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

export const DEFAULT_DOMAINS: Domain[] = [
  { id: 'dom-1', name: '@gmail.com', enabled: true, createdAt: 1770000000000 },
  { id: 'dom-2', name: '@outlook.com', enabled: true, createdAt: 1770000000000 },
  { id: 'dom-3', name: '@hotmail.com', enabled: true, createdAt: 1770000000000 },
  { id: 'dom-4', name: '@icloud.com', enabled: true, createdAt: 1770000100000 },
  { id: 'dom-5', name: '@yahoo.com', enabled: true, createdAt: 1770000200000 },
  { id: 'dom-6', name: '@proton.me', enabled: true, createdAt: 1770000300000 },
  { id: 'dom-7', name: '@aol.com', enabled: true, createdAt: 1770000400000 },
  { id: 'dom-8', name: '@live.com', enabled: true, createdAt: 1770000500000 }
];

export const DEFAULT_PATTERNS: EmailPattern[] = [
  {
    id: 'pat-1',
    name: 'First + Last',
    pattern: '[first][last]',
    enabled: true,
    description: 'Concated: johnsmith@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-2',
    name: 'First + Dot + Last',
    pattern: '[first].[last]',
    enabled: true,
    description: 'Dotted: john.smith@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-3',
    name: 'First + Underscore + Last',
    pattern: '[first]_[last]',
    enabled: true,
    description: 'Underscored: john_smith@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-4',
    name: 'Last + First',
    pattern: '[last][first]',
    enabled: true,
    description: 'Reverse: smithjohn@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-5',
    name: 'First + Random Number',
    pattern: '[first][num]',
    enabled: true,
    description: 'First name with numeric tag: john325@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-6',
    name: 'First + Last + Year',
    pattern: '[first][last][year]',
    enabled: true,
    description: 'Full name with current year: johnsmith2026@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-7',
    name: 'First Initial + Last',
    pattern: '[f][last]',
    enabled: true,
    description: 'Initial + Last: jsmith@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-8',
    name: 'Last + Dot + First',
    pattern: '[last].[first]',
    enabled: true,
    description: 'Dotted reverse: smith.john@domain.com',
    createdAt: 1770000000000
  },
  {
    id: 'pat-9',
    name: 'First Initial + Underscore + Last + Num',
    pattern: '[f]_[last][num]',
    enabled: true,
    description: 'Initial + Underscore + Last + Num: j_smith41@domain.com',
    createdAt: 1770000100000
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  general: {
    websiteName: 'InboxCraft Pro',
    logoText: 'InboxCraft',
    websiteDescription: 'Generate professional mock, contact, and marketing address pools instantly. A comprehensive tool for bulk design lists and clean formats.',
    faviconText: '✉️'
  },
  appearance: {
    themeColor: '#3b82f6', // blue-500
    mode: 'dark',
    customCss: ''
  },
  security: {
    sessionTimeout: 30, // minutes
    loginProtection: true,
    activityMonitoring: true
  },
  seo: {
    metaTitle: 'InboxCraft Pro - Professional Email Address Generator',
    metaDescription: 'Generate unlimited free mock and testing email addresses in bulk with highly customizable names, domains, and combinations.',
    keywords: 'email generator, custom email creator, mass contact builder, mock accounts, address lists, professional patterns',
    ogTitle: 'InboxCraft Pro - Email Generator Web App',
    ogDescription: 'Generate clean email addresses with robust profile patterns and custom templates.'
  },
  advanced: {
    customJs: '',
    analyticsId: 'UA-12345678-9'
  }
};
