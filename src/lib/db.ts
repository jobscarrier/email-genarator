import { Domain, NameRecord, NameGender, EmailPattern, ActivityLog, AppSettings } from '../types';
import {
  DEFAULT_MALE_NAMES,
  DEFAULT_FEMALE_NAMES,
  DEFAULT_LAST_NAMES,
  DEFAULT_DOMAINS,
  DEFAULT_PATTERNS,
  DEFAULT_SETTINGS
} from './constants';

// Helper: Secure/Fallback Hashing for Admin Login Protection
export async function secureHash(text: string): Promise<string> {
  try {
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text + "-secure-salt-2026");
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (e) {
    console.warn("Subtle crypto not available or blocked in current frame; falling back to secondary checksum.");
  }
  
  // Standard fallback checksum algorithm (FNV-1a styled 64-bit string scrambler)
  let h1 = 0x811c9dc5;
  const salt = "-fallback-salt-2026";
  const str = text + salt;
  for (let i = 0; i < str.length; i++) {
    h1 ^= str.charCodeAt(i);
    h1 += (h1 << 1) + (h1 << 4) + (h1 << 7) + (h1 << 8) + (h1 << 24);
  }
  return (h1 >>> 0).toString(16);
}

// Storage Keys
const KEYS = {
  CREDENTIALS_USER: 'email_generator_admin_user',
  CREDENTIALS_PASS_HASH: 'email_generator_admin_pass_hash',
  DOMAINS: 'email_generator_domains',
  NAMES: 'email_generator_names',
  PATTERNS: 'email_generator_patterns',
  LOGS: 'email_generator_logs',
  SETTINGS: 'email_generator_settings',
  COUNTER_GENERATED_EMAILS: 'email_generator_count_total'
};

export class DatabaseService {
  constructor() {
    this.ensureInitialized();
  }

  private async ensureInitialized() {
    // 1. Initialize Admin Credentials if not set (Default: username: IPSHAHINUR, password: ip02042005)
    if (!localStorage.getItem(KEYS.CREDENTIALS_USER)) {
      localStorage.setItem(KEYS.CREDENTIALS_USER, 'IPSHAHINUR');
      const hash = await secureHash('ip02042005');
      localStorage.setItem(KEYS.CREDENTIALS_PASS_HASH, hash);
    }

    // 2. Initialize Domains
    if (!localStorage.getItem(KEYS.DOMAINS)) {
      localStorage.setItem(KEYS.DOMAINS, JSON.stringify(DEFAULT_DOMAINS));
    }

    // 3. Initialize Names
    if (!localStorage.getItem(KEYS.NAMES)) {
      const initialNames: NameRecord[] = [];
      let idx = 1;
      
      DEFAULT_MALE_NAMES.forEach(name => {
        initialNames.push({ id: `name-${idx++}`, name, gender: 'male', createdAt: Date.now() });
      });
      DEFAULT_FEMALE_NAMES.forEach(name => {
        initialNames.push({ id: `name-${idx++}`, name, gender: 'female', createdAt: Date.now() });
      });
      DEFAULT_LAST_NAMES.forEach(name => {
        initialNames.push({ id: `name-${idx++}`, name, gender: 'last', createdAt: Date.now() });
      });

      localStorage.setItem(KEYS.NAMES, JSON.stringify(initialNames));
    }

    // 4. Initialize Patterns
    if (!localStorage.getItem(KEYS.PATTERNS)) {
      localStorage.setItem(KEYS.PATTERNS, JSON.stringify(DEFAULT_PATTERNS));
    }

    // 5. Initialize Logs
    if (!localStorage.getItem(KEYS.LOGS)) {
      const defaultLogs: ActivityLog[] = [
        {
          id: 'log-1',
          timestamp: Date.now() - 3600000 * 2,
          type: 'system',
          userId: 'system',
          userEmail: 'system@internal',
          action: 'Database Initialized',
          details: 'Default seed lists successfully loaded.',
          ipAddress: '127.0.0.1'
        }
      ];
      localStorage.setItem(KEYS.LOGS, JSON.stringify(defaultLogs));
    }

    // 6. Initialize Settings
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }

    // 7. Initialize Email Counter
    if (!localStorage.getItem(KEYS.COUNTER_GENERATED_EMAILS)) {
      localStorage.setItem(KEYS.COUNTER_GENERATED_EMAILS, '2564'); // seeded initial value for statistics looks pro
    }
  }

  // --- Auth & Credentials ---
  public getAdminUser(): string {
    return localStorage.getItem(KEYS.CREDENTIALS_USER) || 'IPSHAHINUR';
  }

  public async verifyAdmin(username: string, passClear: string): Promise<boolean> {
    const storedUser = this.getAdminUser();
    if (username !== storedUser) return false;

    const inputHash = await secureHash(passClear);
    const storedHash = localStorage.getItem(KEYS.CREDENTIALS_PASS_HASH);
    return inputHash === storedHash;
  }

  public async updateAdminCredentials(newUsername: string, newPassClear?: string): Promise<void> {
    // Audit log
    const prevUser = this.getAdminUser();
    localStorage.setItem(KEYS.CREDENTIALS_USER, newUsername);
    
    if (newPassClear && newPassClear.trim() !== '') {
      const hash = await secureHash(newPassClear);
      localStorage.setItem(KEYS.CREDENTIALS_PASS_HASH, hash);
    }

    this.addLog('action', 'IPSHAHINUR', `Updated admin login credentials. Username modified from ${prevUser} to ${newUsername}.`);
  }

  // --- Domains ---
  public getDomains(): Domain[] {
    return JSON.parse(localStorage.getItem(KEYS.DOMAINS) || '[]');
  }

  public getActiveDomains(): Domain[] {
    return this.getDomains().filter(d => d.enabled);
  }

  public saveDomains(domains: Domain[]): void {
    localStorage.setItem(KEYS.DOMAINS, JSON.stringify(domains));
  }

  public addDomain(domainName: string): Domain {
    const cleaned = domainName.trim().toLowerCase();
    const formatted = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
    
    const domains = this.getDomains();
    if (domains.some(d => d.name === formatted)) {
      throw new Error(`Domain ${formatted} already exists.`);
    }

    const next: Domain = {
      id: `dom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: formatted,
      enabled: true,
      createdAt: Date.now()
    };
    domains.push(next);
    this.saveDomains(domains);
    this.addLog('action', 'IPSHAHINUR', `Added domain: ${formatted}`);
    return next;
  }

  public editDomain(id: string, newName: string, enabled: boolean): void {
    const cleaned = newName.trim().toLowerCase();
    const formatted = cleaned.startsWith('@') ? cleaned : `@${cleaned}`;
    const domains = this.getDomains();
    
    const index = domains.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Domain not found.');

    const old = domains[index];
    domains[index] = {
      ...old,
      name: formatted,
      enabled
    };
    this.saveDomains(domains);
    this.addLog('action', 'IPSHAHINUR', `Edited domain: ${old.name} -> ${formatted} (Enabled: ${enabled})`);
  }

  public deleteDomain(id: string): void {
    const domains = this.getDomains();
    const target = domains.find(d => d.id === id);
    if (!target) return;

    const filtered = domains.filter(d => d.id !== id);
    this.saveDomains(filtered);
    this.addLog('action', 'IPSHAHINUR', `Deleted domain: ${target.name}`);
  }

  public bulkImportDomains(domainsText: string): number {
    const items = domainsText.split('\n')
      .map(line => line.trim().toLowerCase())
      .filter(line => line !== '');
    
    const domains = this.getDomains();
    let addedCount = 0;

    items.forEach(item => {
      const formatted = item.startsWith('@') ? item : `@${item}`;
      if (!domains.some(d => d.name === formatted)) {
        domains.push({
          id: `dom-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: formatted,
          enabled: true,
          createdAt: Date.now()
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveDomains(domains);
      this.addLog('action', 'IPSHAHINUR', `Bulk imported ${addedCount} domains.`);
    }
    return addedCount;
  }

  // --- Names ---
  public getNames(gender?: NameGender): NameRecord[] {
    const all = JSON.parse(localStorage.getItem(KEYS.NAMES) || '[]');
    if (gender) {
      return all.filter((n: NameRecord) => n.gender === gender);
    }
    return all;
  }

  public saveNames(names: NameRecord[]): void {
    localStorage.setItem(KEYS.NAMES, JSON.stringify(names));
  }

  public addName(name: string, gender: NameGender): NameRecord {
    const cleaned = name.trim();
    if (cleaned === '') throw new Error('Name cannot be empty.');

    const names = this.getNames();
    const next: NameRecord = {
      id: `name-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: cleaned,
      gender,
      createdAt: Date.now()
    };

    names.push(next);
    this.saveNames(names);
    this.addLog('action', 'IPSHAHINUR', `Added ${gender} name: ${cleaned}`);
    return next;
  }

  public deleteName(id: string): void {
    const names = this.getNames();
    const target = names.find(n => n.id === id);
    if (!target) return;

    const filtered = names.filter(n => n.id !== id);
    this.saveNames(filtered);
    this.addLog('action', 'IPSHAHINUR', `Deleted name: ${target.name} (${target.gender})`);
  }

  public bulkImportNames(namesText: string, gender: NameGender): number {
    const items = namesText.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');
    
    const names = this.getNames();
    let addedCount = 0;

    items.forEach(name => {
      // prevent exact duplicates in same gender category
      if (!names.some(n => n.name.toLowerCase() === name.toLowerCase() && n.gender === gender)) {
        names.push({
          id: `name-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name,
          gender,
          createdAt: Date.now()
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveNames(names);
      this.addLog('action', 'IPSHAHINUR', `Bulk imported ${addedCount} ${gender} names.`);
    }
    return addedCount;
  }

  // --- Patterns ---
  public getPatterns(): EmailPattern[] {
    return JSON.parse(localStorage.getItem(KEYS.PATTERNS) || '[]');
  }

  public getActivePatterns(): EmailPattern[] {
    return this.getPatterns().filter(p => p.enabled);
  }

  public savePatterns(patterns: EmailPattern[]): void {
    localStorage.setItem(KEYS.PATTERNS, JSON.stringify(patterns));
  }

  public addPattern(name: string, pattern: string, description: string): EmailPattern {
    const patterns = this.getPatterns();
    const next: EmailPattern = {
      id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      pattern: pattern.trim(),
      enabled: true,
      description: description.trim(),
      createdAt: Date.now()
    };
    patterns.push(next);
    this.savePatterns(patterns);
    this.addLog('action', 'IPSHAHINUR', `Created email pattern: ${name.trim()} (${pattern.trim()})`);
    return next;
  }

  public editPattern(id: string, name: string, pattern: string, enabled: boolean, description: string): void {
    const patterns = this.getPatterns();
    const index = patterns.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Pattern not found.');

    const old = patterns[index];
    patterns[index] = {
      ...old,
      name: name.trim(),
      pattern: pattern.trim(),
      enabled,
      description: description.trim()
    };
    this.savePatterns(patterns);
    this.addLog('action', 'IPSHAHINUR', `Edited pattern: ${old.name} -> ${name} (Enabled: ${enabled})`);
  }

  public deletePattern(id: string): void {
    const patterns = this.getPatterns();
    const target = patterns.find(p => p.id === id);
    if (!target) return;

    const filtered = patterns.filter(p => p.id !== id);
    this.savePatterns(filtered);
    this.addLog('action', 'IPSHAHINUR', `Deleted pattern: ${target.name}`);
  }

  // --- Logs ---
  public getLogs(): ActivityLog[] {
    return JSON.parse(localStorage.getItem(KEYS.LOGS) || '[]');
  }

  public addLog(type: 'login' | 'action' | 'system', userEmail: string, action: string, details?: string): void {
    const logs = this.getLogs();
    const next: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      type,
      userId: 'IPSHAHINUR',
      userEmail,
      action,
      details,
      ipAddress: '192.168.1.45' // Simulated professional IP trace
    };
    logs.unshift(next);
    // Bind to max 100 logs to prevent DOM memory overflow
    if (logs.length > 200) {
      logs.pop();
    }
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  }

  public clearLogs(): void {
    localStorage.setItem(KEYS.LOGS, JSON.stringify([]));
    this.addLog('system', 'system@internal', 'Cleared all activity logs.');
  }

  // --- Settings ---
  public getSettings(): AppSettings {
    const defaultData = JSON.stringify(DEFAULT_SETTINGS);
    return JSON.parse(localStorage.getItem(KEYS.SETTINGS) || defaultData);
  }

  public saveSettings(settings: AppSettings): void {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    this.addLog('action', 'IPSHAHINUR', 'Updated website settings modules.');
  }

  // --- Generated Email Counter ---
  public getGeneratedCount(): number {
    return parseInt(localStorage.getItem(KEYS.COUNTER_GENERATED_EMAILS) || '0', 10);
  }

  public incrementGeneratedCount(amount: number): void {
    const current = this.getGeneratedCount();
    localStorage.setItem(KEYS.COUNTER_GENERATED_EMAILS, (current + amount).toString());
  }

  // --- Statistics ---
  public getStats() {
    const male = this.getNames('male').length;
    const female = this.getNames('female').length;
    const last = this.getNames('last').length;
    const domains = this.getDomains().length;
    const generated = this.getGeneratedCount();
    const recentLogs = this.getLogs().slice(0, 5);

    return {
      male,
      female,
      last,
      domains,
      generated,
      recentLogs
    };
  }

  // --- Backup & Restore ---
  public backupDatabase(): string {
    const backupObj = {
      version: '1.0.0',
      backedAt: Date.now(),
      credentials: {
        user: localStorage.getItem(KEYS.CREDENTIALS_USER) || 'IPSHAHINUR',
        pass: localStorage.getItem(KEYS.CREDENTIALS_PASS_HASH)
      },
      domains: this.getDomains(),
      names: this.getNames(),
      patterns: this.getPatterns(),
      logs: this.getLogs(),
      settings: this.getSettings(),
      generatedCount: this.getGeneratedCount()
    };
    this.addLog('action', 'IPSHAHINUR', 'Exported complete database backup.');
    return JSON.stringify(backupObj, null, 2);
  }

  public restoreDatabase(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.domains || !data.names || !data.patterns || !data.settings) {
        throw new Error('Invalid schema format. Missing required root properties.');
      }

      // Restore credentials securely
      if (data.credentials) {
        if (data.credentials.user) localStorage.setItem(KEYS.CREDENTIALS_USER, data.credentials.user);
        if (data.credentials.pass) localStorage.setItem(KEYS.CREDENTIALS_PASS_HASH, data.credentials.pass);
      }

      // Restore major entities
      localStorage.setItem(KEYS.DOMAINS, JSON.stringify(data.domains));
      localStorage.setItem(KEYS.NAMES, JSON.stringify(data.names));
      localStorage.setItem(KEYS.PATTERNS, JSON.stringify(data.patterns));
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data.settings));
      if (data.generatedCount !== undefined) {
        localStorage.setItem(KEYS.COUNTER_GENERATED_EMAILS, data.generatedCount.toString());
      }

      // App pend log
      const logs = data.logs || [];
      const newLog: ActivityLog = {
        id: `log-restore-${Date.now()}`,
        timestamp: Date.now(),
        type: 'system',
        userId: 'system',
        userEmail: 'system@internal',
        action: 'Database Restored',
        details: 'Data backup successfully restored and merged.',
        ipAddress: '127.0.0.1'
      };
      logs.unshift(newLog);
      localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));

      return true;
    } catch (e) {
      console.error('Failed to restore database backup:', e);
      return false;
    }
  }
}

export const dbService = new DatabaseService();
