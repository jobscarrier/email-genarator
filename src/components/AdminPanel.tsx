import React, { useState, useEffect, useRef } from 'react';
import { dbService, secureHash } from '../lib/db';
import { Domain, EmailPattern, NameRecord, NameGender, ActivityLog, AppSettings } from '../types';
import {
  Users, Globe, FileText, Settings, ShieldAlert, KeyRound, Database, RefreshCw, Trash2, Edit2, Plus, Download, Upload, Shield, LogOut, Check, Search, Filter, Play, Info, AlertTriangle, Eye, HelpCircle, UserPlus, EyeOff
} from 'lucide-react';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const { toast } = useToast();
  
  // Dashboard overall statuses
  const [stats, setStats] = useState({
    male: 0,
    female: 0,
    last: 0,
    domains: 0,
    generated: 0,
    recentLogs: [] as ActivityLog[]
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'names' | 'domains' | 'patterns' | 'settings' | 'logs'>('overview');

  // --- Names Management States ---
  const [nameGenderTab, setNameGenderTab] = useState<NameGender>('male');
  const [nameSearch, setNameSearch] = useState<string>('');
  const [newNameInput, setNewNameInput] = useState<string>('');
  const [bulkNamesInput, setBulkNamesInput] = useState<string>('');
  const [showBulkNameModal, setShowBulkNameModal] = useState<boolean>(false);

  // --- Domains States ---
  const [domainSearch, setDomainSearch] = useState<string>('');
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [bulkDomainsInput, setBulkDomainsInput] = useState<string>('');
  const [showBulkDomainModal, setShowBulkDomainModal] = useState<boolean>(false);

  // --- Patterns States ---
  const [showPatternModal, setShowPatternModal] = useState<boolean>(false);
  const [patternIdEdit, setPatternIdEdit] = useState<string | null>(null);
  const [patternName, setPatternName] = useState<string>('');
  const [patternStr, setPatternStr] = useState<string>('');
  const [patternDesc, setPatternDesc] = useState<string>('');

  // --- Settings States ---
  const [settingsTab, setSettingsTab] = useState<'general' | 'appearance' | 'security' | 'seo' | 'database'>('general');
  const [settingsState, setSettingsState] = useState<AppSettings>(dbService.getSettings());
  const [adminUser, setAdminUser] = useState<string>(dbService.getAdminUser());
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordStrength, setPasswordStrength] = useState<string>('');

  // --- Database operations ---
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Logs Filter ---
  const [logFilterType, setLogFilterType] = useState<string>('all');

  useEffect(() => {
    refreshStats();
  }, [activeTab, nameGenderTab]);

  const refreshStats = () => {
    setStats(dbService.getStats());
  };

  // --- Password Strength Evaluator ---
  const handlePasswordChange = (val: string) => {
    setNewPassword(val);
    if (!val) {
      setPasswordStrength('');
      return;
    }
    if (val.length < 6) {
      setPasswordStrength('Weak (needs 6+ chars)');
    } else if (/\d/.test(val) && /[A-Z]/.test(val)) {
      setPasswordStrength('Strong Option');
    } else {
      setPasswordStrength('Moderate');
    }
  };

  // --- Credentials Change ---
  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === '') {
      toast('Username cannot be empty.', 'error');
      return;
    }

    if (newPassword !== '') {
      if (newPassword !== confirmPassword) {
        toast('New passwords do not match.', 'error');
        return;
      }
      if (newPassword.length < 6) {
        toast('Password must be at least 6 characters.', 'warning');
        return;
      }
    }

    await dbService.updateAdminCredentials(adminUser, newPassword);
    setNewPassword('');
    setConfirmPassword('');
    toast('Admin security credentials successfully updated!', 'success');
    refreshStats();
  };

  // --- Add Single Name ---
  const handleAddName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNameInput.trim() === '') return;
    try {
      dbService.addName(newNameInput, nameGenderTab);
      setNewNameInput('');
      toast(`Added name: ${newNameInput}`, 'success');
      refreshStats();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  // --- Delete Name ---
  const handleDeleteName = (id: string) => {
    dbService.deleteName(id);
    toast('Name record removed.', 'success');
    refreshStats();
  };

  // --- Name Bulk Import ---
  const handleBulkImportNames = () => {
    if (bulkNamesInput.trim() === '') return;
    const added = dbService.bulkImportNames(bulkNamesInput, nameGenderTab);
    setBulkNamesInput('');
    setShowBulkNameModal(false);
    toast(`Successfully registered ${added} new names to ${nameGenderTab} set!`, 'success');
    refreshStats();
  };

  // --- Export Names List ---
  const handleExportNames = () => {
    const list = dbService.getNames(nameGenderTab).map(n => n.name).join('\r\n');
    const blob = new Blob([list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${nameGenderTab}_names_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast(`Exported ${nameGenderTab} names.`, 'success');
  };

  // --- Add Domain ---
  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomainInput.trim() === '') return;
    try {
      dbService.addDomain(newDomainInput);
      setNewDomainInput('');
      toast(`Registered domain: ${newDomainInput}`, 'success');
      refreshStats();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  // --- Toggle Domain Status ---
  const handleToggleDomain = (id: string, currentStatus: boolean, name: string) => {
    dbService.editDomain(id, name, !currentStatus);
    toast(`Domain status updated.`, 'success');
    refreshStats();
  };

  // --- Delete Domain ---
  const handleDeleteDomain = (id: string) => {
    dbService.deleteDomain(id);
    toast('Domain removed.', 'success');
    refreshStats();
  };

  // --- Bulk Import Domains ---
  const handleBulkImportDomains = () => {
    if (bulkDomainsInput.trim() === '') return;
    const added = dbService.bulkImportDomains(bulkDomainsInput);
    setBulkDomainsInput('');
    setShowBulkDomainModal(false);
    toast(`Successfully active registered ${added} custom domains!`, 'success');
    refreshStats();
  };

  // --- Export Domains ---
  const handleExportDomains = () => {
    const list = dbService.getDomains().map(d => d.name).join('\r\n');
    const blob = new Blob([list], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `domain_list_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Exported domains list.', 'success');
  };

  // --- Add/Edit Pattern ---
  const handleOpenPatternModal = (idToEdit: string | null = null) => {
    setPatternIdEdit(idToEdit);
    if (idToEdit) {
      const target = dbService.getPatterns().find(p => p.id === idToEdit);
      if (target) {
        setPatternName(target.name);
        setPatternStr(target.pattern);
        setPatternDesc(target.description);
      }
    } else {
      setPatternName('');
      setPatternStr('');
      setPatternDesc('');
    }
    setShowPatternModal(true);
  };

  const handleSavePattern = (e: React.FormEvent) => {
    e.preventDefault();
    if (patternName.trim() === '' || patternStr.trim() === '') {
      toast('Please complete pattern name and syntax blocks.', 'error');
      return;
    }

    try {
      if (patternIdEdit) {
        dbService.editPattern(patternIdEdit, patternName, patternStr, true, patternDesc);
        toast('Pattern settings updated successfully.', 'success');
      } else {
        dbService.addPattern(patternName, patternStr, patternDesc);
        toast('Created code-layout email pattern template.', 'success');
      }
      setShowPatternModal(false);
      refreshStats();
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleTogglePattern = (id: string, enabled: boolean) => {
    const target = dbService.getPatterns().find(p => p.id === id);
    if (target) {
      dbService.editPattern(id, target.name, target.pattern, !enabled, target.description);
      toast('Pattern status toggled successfully.', 'success');
      refreshStats();
    }
  };

  const handleDeletePattern = (id: string) => {
    dbService.deletePattern(id);
    toast('Pattern removed from active engine.', 'success');
    refreshStats();
  };

  // --- Save Application Settings ---
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    dbService.saveSettings(settingsState);
    toast('Application settings updated successfully.', 'success');
    refreshStats();
  };

  // --- Export backup data (JSON) ---
  const handleDownloadBackup = () => {
    const jsonStr = dbService.backupDatabase();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `email_gen_backup_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('JSON database backup exported successfully.', 'success');
  };

  // --- Restore bulk backup (JSON Upload) ---
  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const success = dbService.restoreDatabase(text);
      if (success) {
        toast('Database backup successfully restored and reloaded!', 'success');
        setSettingsState(dbService.getSettings());
        setAdminUser(dbService.getAdminUser());
        refreshStats();
        // Clear input element
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        toast('Failed to restore backup. Invalid JSON file format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // --- Clear Activity Logs ---
  const handleClearLogs = () => {
    dbService.clearLogs();
    toast('Cleared activity audit logs.', 'success');
    refreshStats();
  };

  // Filter lists based on searches
  const filteredNamesList = dbService.getNames(nameGenderTab).filter(n =>
    n.name.toLowerCase().includes(nameSearch.toLowerCase())
  );

  const filteredDomainsList = dbService.getDomains().filter(d =>
    d.name.toLowerCase().includes(domainSearch.toLowerCase())
  );

  const filteredLogsList = dbService.getLogs().filter(log => {
    if (logFilterType === 'all') return true;
    return log.type === logFilterType;
  });

  return (
    <div id="admin-panel-app" className="space-y-8 animate-fade-in">
      {/* Navigation Admin Controls Panel Header bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-zinc-850 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-sans font-bold text-white flex items-center gap-2">
              Management Portal
              <span className="text-xxs font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                ADMIN AUTHENTICATED
              </span>
            </h1>
            <p className="text-xs text-zinc-400">Configure datasets, formula layouts, domains registry, and system backups.</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="py-2 px-4 bg-zinc-850 hover:bg-zinc-800 border border-zinc-750 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition-colors duration-150"
        >
          <LogOut className="h-4 w-4 text-zinc-400" />
          Exit Portal Session
        </button>
      </div>

      {/* Main Grid: Split Navigation sidebar + Tabs Stage board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Sidebar navigation modules */}
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Users },
            { id: 'names', label: 'Name Library', icon: UserPlus },
            { id: 'domains', label: 'Domains Registry', icon: Globe },
            { id: 'patterns', label: 'Pattern Blueprints', icon: FileText },
            { id: 'settings', label: 'System Configuration', icon: Settings },
            { id: 'logs', label: 'Security & Action Logs', icon: ShieldAlert }
          ].map(tab => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left py-3 px-4 rounded-xl text-xs font-semibold transition-all flex items-center gap-3 border ${
                  activeTab === tab.id
                    ? 'bg-blue-600/10 border-blue-500/20 text-blue-400 font-medium'
                    : 'bg-zinc-900/30 border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                }`}
              >
                <IconComp className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Side: Tab Stage Board */}
        <div className="lg:col-span-9 bg-zinc-900/40 border border-zinc-850 p-6 rounded-2xl min-h-[500px] backdrop-blur-xl">
          <AnimatePresence mode="wait">
            
            {/* TAB: Dashboard Overview */}
            {activeTab === 'overview' && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <h2 className="font-sans font-bold text-lg text-zinc-100 pb-2 border-b border-zinc-800">Overview Dashboard</h2>
                
                {/* 4 Cards statistics board */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/60">
                    <span className="text-xxs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Male Profiles</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">{stats.male}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/60">
                    <span className="text-xxs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Female Profiles</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">{stats.female}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/60">
                    <span className="text-xxs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Last Names</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">{stats.last}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850/60">
                    <span className="text-xxs text-zinc-500 font-bold uppercase tracking-wider block mb-1">Total Domains</span>
                    <span className="text-xl font-bold font-mono text-zinc-100">{stats.domains}</span>
                  </div>
                  <div className="bg-zinc-950 p-4 rounded-xl col-span-2 md:col-span-1 border border-zinc-850/60 bg-radial from-blue-500/5 to-zinc-950">
                    <span className="text-xxs text-blue-400 font-bold uppercase tracking-wider block mb-1">Total Generated</span>
                    <span className="text-xl font-bold font-mono text-blue-400">{stats.generated}</span>
                  </div>
                </div>

                {/* Info summary */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  {/* System details */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850/60 space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-200">Session Environment</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between py-1.5 border-b border-zinc-900 text-zinc-400">
                          <span>Developer Administrator</span>
                          <span className="font-mono text-zinc-200">{adminUser}</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 border-b border-zinc-900 text-zinc-400">
                          <span>Secure Node Hashing Engine</span>
                          <span className="font-mono text-zinc-200">SHA-256 (WebCrypto)</span>
                        </div>
                        <div className="flex items-center justify-between py-1.5 text-zinc-400">
                          <span>Database Instance Status</span>
                          <span className="text-emerald-450 font-semibold flex items-center gap-1">● Online Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick recent audit trace list */}
                  <div className="md:col-span-15 space-y-4">
                    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-850/60 space-y-3">
                      <h3 className="text-sm font-semibold text-zinc-200">Recent User Actions Log</h3>
                      
                      <div className="space-y-3">
                        {stats.recentLogs.length === 0 ? (
                          <p className="text-xs text-zinc-500">No recent activities found.</p>
                        ) : (
                          stats.recentLogs.map(log => (
                            <div key={log.id} className="text-xs space-y-1 py-1 border-b border-zinc-900/60 last:border-0">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-zinc-250 truncate block max-w-[160px]">{log.action}</span>
                                <span className="font-mono text-xxs text-zinc-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-zinc-500 text-xxs truncate">{log.details || 'No structural details.'}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: Name Library */}
            {activeTab === 'names' && (
              <motion.div
                key="tab-names"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="font-sans font-bold text-lg text-zinc-100">Profile Names Pool</h2>
                  
                  {/* Category switcher */}
                  <div className="flex p-0.5 bg-zinc-950 rounded-xl border border-zinc-850 mt-3 sm:mt-0">
                    {(['male', 'female', 'last'] as const).map(g => (
                      <button
                        key={g}
                        onClick={() => setNameGenderTab(g)}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg capitalize transition-all ${
                          nameGenderTab === g
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-zinc-450 hover:text-zinc-200'
                        }`}
                      >
                        {g === 'last' ? 'Surnames' : `${g} First`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Operations Toolbar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  {/* Single Name Add Form */}
                  <form onSubmit={handleAddName} className="md:col-span-5 flex gap-2">
                    <input
                      type="text"
                      placeholder={`Add single ${nameGenderTab} name...`}
                      value={newNameInput}
                      onChange={(e) => setNewNameInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="py-2 px-3 bg-blue-650 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </button>
                  </form>

                  {/* Separator / Tools */}
                  <div className="md:col-span-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter library list..."
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Bulk import & download */}
                  <div className="md:col-span-4 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowBulkNameModal(true)}
                      className="py-2 px-3 bg-zinc-800 hover:bg-zinc-750 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Bulk Register
                    </button>
                    <button
                      onClick={handleExportNames}
                      className="p-2 bg-zinc-800 hover:bg-zinc-750 rounded-xl text-zinc-300 hover:text-white cursor-pointer"
                      title="Download List"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Names Output Cards List */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-[350px] overflow-y-auto pr-2">
                    {filteredNamesList.length === 0 ? (
                      <p className="col-span-full py-8 text-center text-zinc-500 text-xs">No records correspond inside the list.</p>
                    ) : (
                      filteredNamesList.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between py-1.5 px-2 bg-zinc-900 border border-zinc-850 rounded-lg group text-xs text-zinc-250 font-medium"
                        >
                          <span className="truncate">{item.name}</span>
                          <button
                            onClick={() => handleDeleteName(item.id)}
                            className="text-zinc-500 hover:text-rose-450 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            title="Remove Record"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Info banner */}
                <p className="text-xxs text-zinc-500">
                  Registered profiles are distributed during combinations synthesis. The generator operates optimally with 10+ values per category.
                </p>
              </motion.div>
            )}

            {/* TAB: Domains Registry */}
            {activeTab === 'domains' && (
              <motion.div
                key="tab-domains"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h2 className="font-sans font-bold text-lg text-zinc-100">Enabled Domains Registry</h2>
                </div>

                {/* Operations bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                  <form onSubmit={handleAddDomain} className="md:col-span-5 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add custom domain (e.g. @company.com)..."
                      value={newDomainInput}
                      onChange={(e) => setNewDomainInput(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      className="py-2 px-3 bg-blue-650 hover:bg-blue-600 text-white font-semibold rounded-xl text-xs cursor-pointer"
                    >
                      Register
                    </button>
                  </form>

                  <div className="md:col-span-3 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search domains registry..."
                      value={domainSearch}
                      onChange={(e) => setDomainSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-4 flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setShowBulkDomainModal(true)}
                      className="py-2 px-3 bg-zinc-800 hover:bg-zinc-750 rounded-xl text-xs font-semibold text-zinc-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Bulk Registry
                    </button>
                    <button
                      onClick={handleExportDomains}
                      className="p-2 bg-zinc-800 hover:bg-zinc-750 rounded-xl text-zinc-300 hover:text-white cursor-pointer"
                      title="Download domains"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Domains Listing table */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-850 text-zinc-400">
                        <th className="p-3">Email Domain Name</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Action Controls</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900">
                      {filteredDomainsList.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-zinc-500">No domains correspond.</td>
                        </tr>
                      ) : (
                        filteredDomainsList.map(dom => (
                          <tr key={dom.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="p-3 font-medium text-zinc-250">{dom.name}</td>
                            <td className="p-3">
                              <button
                                onClick={() => handleToggleDomain(dom.id, dom.enabled, dom.name)}
                                className={`py-1 px-2.5 rounded-full text-xxs font-bold uppercase cursor-pointer border ${
                                  dom.enabled
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-zinc-800/65 border-zinc-700 text-zinc-500'
                                }`}
                              >
                                {dom.enabled ? 'Active Enabled' : 'Disabled'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleDeleteDomain(dom.id)}
                                className="text-zinc-500 hover:text-rose-450 p-1 cursor-pointer inline-block"
                                title="Delete Domain"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB: Pattern Blueprints */}
            {activeTab === 'patterns' && (
              <motion.div
                key="tab-patterns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h2 className="font-sans font-bold text-lg text-zinc-100">Formula Configurations</h2>
                    <p className="text-xxs text-zinc-400">Manage structure mappings using variables: <code>[first]</code>, <code>[last]</code>, <code>[f]</code>, <code>[l]</code>, <code>[num]</code>, and <code>[year]</code>.</p>
                  </div>
                  
                  <button
                    onClick={() => handleOpenPatternModal(null)}
                    className="py-2 px-3 bg-blue-650 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Pattern
                  </button>
                </div>

                {/* Patterns Card deck layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbService.getPatterns().map(pat => (
                    <div
                      key={pat.id}
                      className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3 relative group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="font-sans font-bold text-sm text-zinc-150">{pat.name}</h3>
                          <span className="font-mono text-xxs text-zinc-500 uppercase">Formula Blueprint</span>
                        </div>

                        {/* Control buttons */}
                        <div className="flex items-center gap-1 border-l border-zinc-850 pl-2">
                          <button
                            onClick={() => handleOpenPatternModal(pat.id)}
                            className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-white cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePattern(pat.id)}
                            className="p-1 hover:bg-zinc-900 rounded text-zinc-400 hover:text-rose-450 cursor-pointer"
                            title="Delete Configuration"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-2 border border-zinc-900 bg-zinc-900/40 rounded-lg">
                        <code className="font-mono text-xs text-blue-400">{pat.pattern}</code>
                      </div>

                      <p className="text-xxs text-zinc-400 font-sans italic">{pat.description || 'No formula details summary.'}</p>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-900/60 text-xxs text-zinc-500">
                        <span>Created: {new Date(pat.createdAt).toLocaleDateString()}</span>
                        
                        <button
                          onClick={() => handleTogglePattern(pat.id, pat.enabled)}
                          className={`py-0.5 px-2 border rounded-full font-bold uppercase cursor-pointer ${
                            pat.enabled
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-805 border-zinc-800 text-zinc-650'
                          }`}
                        >
                          {pat.enabled ? 'Enabled' : 'Disabled'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB: System Configuration */}
            {activeTab === 'settings' && (
              <motion.div
                key="tab-settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap border-b border-zinc-850 pb-2 gap-2">
                  {[
                    { id: 'general', label: 'General Site' },
                    { id: 'security', label: 'Security Admin' },
                    { id: 'seo', label: 'Meta SEO' },
                    { id: 'database', label: 'Database Backup' }
                  ].map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => setSettingsTab(sec.id as any)}
                      className={`text-xs pb-1.5 font-bold uppercase font-sans border-b-2 tracking-wider transition-colors ${
                        settingsTab === sec.id
                          ? 'border-blue-500 text-blue-400'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {sec.label}
                    </button>
                  ))}
                </div>

                {/* Sub Tab General Content */}
                {settingsTab === 'general' && (
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">Site Name Header</label>
                        <input
                          type="text"
                          value={settingsState.general.websiteName}
                          onChange={(e) => setSettingsState({
                            ...settingsState,
                            general: { ...settingsState.general, websiteName: e.target.value }
                          })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">Logo Brand text</label>
                        <input
                          type="text"
                          value={settingsState.general.logoText}
                          onChange={(e) => setSettingsState({
                            ...settingsState,
                            general: { ...settingsState.general, logoText: e.target.value }
                          })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">Site Marketing Pitch description</label>
                      <textarea
                        value={settingsState.general.websiteDescription}
                        onChange={(e) => setSettingsState({
                          ...settingsState,
                          general: { ...settingsState.general, websiteDescription: e.target.value }
                        })}
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2.5 px-4 bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold font-sans rounded-xl cursor-pointer"
                    >
                      Save General Changes
                    </button>
                  </form>
                )}

                {/* Sub Tab: Security Admin Settings */}
                {settingsTab === 'security' && (
                  <div className="space-y-6">
                    {/* User profile details modifications */}
                    <form onSubmit={handleUpdateAdminProfile} className="space-y-4 border-b border-zinc-850/60 pb-6">
                      <h3 className="text-sm font-semibold text-zinc-200">Change Admin Access Credentials</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">Portal Username</label>
                          <input
                            type="text"
                            value={adminUser}
                            onChange={(e) => setAdminUser(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">New Password (leave blank to keep current)</label>
                          <input
                            type="password"
                            placeholder="••••••"
                            value={newPassword}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          {passwordStrength && (
                            <span className="text-xxs text-amber-400 block">{passwordStrength}</span>
                          )}
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                          <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">Confirm New Password</label>
                          <input
                            type="password"
                            placeholder="••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2 px-4 bg-zinc-200 hover:bg-white text-zinc-900 font-sans font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Commit Credentials Updates
                      </button>
                    </form>

                    {/* Checkboxes controls */}
                    <form onSubmit={handleSaveSettings} className="space-y-4">
                      <h3 className="text-sm font-semibold text-zinc-200">System Logs & Integrity Protection</h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider block">Admin Session Lock (minutes)</label>
                          <input
                            type="number"
                            value={settingsState.security.sessionTimeout}
                            onChange={(e) => setSettingsState({
                              ...settingsState,
                              security: { ...settingsState.security, sessionTimeout: Number(e.target.value) }
                            })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex flex-col gap-3 justify-center pt-2">
                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-350 font-medium">
                            <input
                              type="checkbox"
                              checked={settingsState.security.loginProtection}
                              onChange={(e) => setSettingsState({
                                ...settingsState,
                                security: { ...settingsState.security, loginProtection: e.target.checked }
                              })}
                              className="rounded border-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Apply Brute-Force login throttling protection
                          </label>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-350 font-medium">
                            <input
                              type="checkbox"
                              checked={settingsState.security.activityMonitoring}
                              onChange={(e) => setSettingsState({
                                ...settingsState,
                                security: { ...settingsState.security, activityMonitoring: e.target.checked }
                              })}
                              className="rounded border-zinc-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            Enable Background Activity Monitoring logs
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-2 px-4 bg-blue-650 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl cursor-pointer"
                      >
                        Save Security Params
                      </button>
                    </form>
                  </div>
                )}

                {/* Sub Tab: SEO parameters */}
                {settingsTab === 'seo' && (
                  <form onSubmit={handleSaveSettings} className="space-y-4 font-sans text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">SEO Title Meta-Tag</label>
                        <input
                          type="text"
                          value={settingsState.seo.metaTitle}
                          onChange={(e) => setSettingsState({
                            ...settingsState,
                            seo: { ...settingsState.seo, metaTitle: e.target.value }
                          })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-250 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">SEO Target Keywords (comma-sep)</label>
                        <input
                          type="text"
                          value={settingsState.seo.keywords}
                          onChange={(e) => setSettingsState({
                            ...settingsState,
                            seo: { ...settingsState.seo, keywords: e.target.value }
                          })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-250 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 col-span-2">
                      <label className="text-xxs font-bold uppercase text-zinc-400 tracking-wider">SEO Meta Description tag</label>
                      <textarea
                        value={settingsState.seo.metaDescription}
                        onChange={(e) => setSettingsState({
                          ...settingsState,
                          seo: { ...settingsState.seo, metaDescription: e.target.value }
                        })}
                        rows={2}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2 px-4 bg-blue-650 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl cursor-pointer"
                    >
                      Save SEO Coordinates
                    </button>
                  </form>
                )}

                {/* Sub Tab: Database Backup JSON operations */}
                {settingsTab === 'database' && (
                  <div className="space-y-6">
                    <div className="p-4 border border-zinc-850 bg-zinc-950 rounded-xl space-y-4">
                      <h3 className="text-sm font-semibold text-zinc-200">Database Safety Syncs</h3>
                      <p className="text-xxs text-zinc-400 leading-relaxed">
                        To preserve domains combinations, loaded names collections, and system options configurations across sandbox deployments, export or restore from JSON coordinates.
                      </p>

                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleDownloadBackup}
                          className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition"
                        >
                          <Download className="h-4 w-4" />
                          Download JSON Backup file
                        </button>

                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="py-2.5 px-4 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 hover:text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition"
                        >
                          <Upload className="h-4 w-4" />
                          Restore from backup file
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleUploadBackup}
                          accept=".json"
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: Security & Action Logs */}
            {activeTab === 'logs' && (
              <motion.div
                key="tab-logs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 font-sans text-xs"
              >
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between pb-2 border-b border-zinc-800">
                  <div>
                    <h2 className="font-bold text-lg text-zinc-100 font-sans">Operation Audit Logs</h2>
                    <p className="text-xxs text-zinc-400">Activity timestamps, user classifications, and security indicators.</p>
                  </div>

                  <button
                    onClick={handleClearLogs}
                    className="py-1.5 px-3 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-rose-400 border border-zinc-850 rounded-lg text-xxs font-bold uppercase transition"
                  >
                    Wipe Audit Logs
                  </button>
                </div>

                {/* Filter list */}
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'All Records' },
                    { id: 'login', label: 'Auth Logins' },
                    { id: 'action', label: 'Actions' },
                    { id: 'system', label: 'System status' }
                  ].map(lf => (
                    <button
                      key={lf.id}
                      onClick={() => setLogFilterType(lf.id)}
                      className={`py-1 px-3.5 border rounded-full text-xxs font-semibold cursor-pointer transition ${
                        logFilterType === lf.id
                          ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                          : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {lf.label}
                    </button>
                  ))}
                </div>

                {/* Listing of logs */}
                <div className="bg-zinc-950 border border-zinc-850 rounded-xl max-h-[350px] overflow-y-auto">
                  {filteredLogsList.length === 0 ? (
                    <p className="p-8 text-center text-zinc-500 font-sans">No log records correspond to standard markers.</p>
                  ) : (
                    <div className="divide-y divide-zinc-900 border-collapse">
                      {filteredLogsList.map(log => (
                        <div key={log.id} className="p-4 hover:bg-zinc-900/10 flex items-start gap-4 transition text-zinc-350">
                          <span className={`py-0.5 px-2 text-xxs uppercase font-extrabold rounded select-none ${
                            log.type === 'login' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                            log.type === 'action' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' :
                            'bg-zinc-800 text-zinc-400'
                          }`}>
                            {log.type}
                          </span>

                          <div className="flex-1 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <p className="font-semibold text-zinc-200">{log.action}</p>
                              <span className="font-mono text-xxs text-zinc-500">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-zinc-500 text-xxs">{log.details || 'No action attachments.'}</p>
                            <span className="block font-mono text-xxs text-zinc-650">Operator IP: {log.ipAddress || 'Not registered'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* MODAL: Names Bulk Library Import */}
      {showBulkNameModal && (
        <div id="bulk-names-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 p-6 rounded-2xl max-w-md w-full border border-zinc-805 space-y-4">
            <h3 className="font-sans font-bold text-base text-zinc-200">Bulk Load: {nameGenderTab === 'last' ? 'Surnames' : `${nameGenderTab} Names`}</h3>
            
            <p className="text-xxs text-zinc-400">
              Input one profile name per row line. System checks profiles automatically to bypass duplicate registration.
            </p>

            <textarea
              placeholder={`John\nJames\nWilliam\n...`}
              value={bulkNamesInput}
              onChange={(e) => setBulkNamesInput(e.target.value)}
              rows={8}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowBulkNameModal(false)}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-lg transition font-semibold cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={handleBulkImportNames}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold cursor-pointer"
              >
                Perform Bulk Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Domains Bulk Library Import */}
      {showBulkDomainModal && (
        <div id="bulk-domains-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <div className="bg-zinc-900 p-6 rounded-2xl max-w-md w-full border border-zinc-805 space-y-4">
            <h3 className="font-sans font-bold text-base text-zinc-200">Bulk Registry: Custom Domains</h3>
            
            <p className="text-xxs text-zinc-400">
              Type custom services domains with or without @ prefix (one domain per line).
            </p>

            <textarea
              placeholder={`google.com\nyahoo.com\n@company.co.uk\n...`}
              value={bulkDomainsInput}
              onChange={(e) => setBulkDomainsInput(e.target.value)}
              rows={6}
              className="w-full bg-zinc-950 border border-zinc-805 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setShowBulkDomainModal(false)}
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-lg transition font-semibold cursor-pointer"
              >
                Abort
              </button>
              <button
                onClick={handleBulkImportDomains}
                className="py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold cursor-pointer"
              >
                Perform Custom Registry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pattern Edit / Add Form */}
      {showPatternModal && (
        <div id="pattern-edit-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
          <form onSubmit={handleSavePattern} className="bg-zinc-900 p-6 border border-zinc-805 rounded-2xl max-w-md w-full space-y-4 text-xs font-sans">
            <h3 className="font-sans font-bold text-base text-zinc-150">{patternIdEdit ? 'Edit Pattern Layout' : 'Add New Pattern Layout'}</h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xxs uppercase font-bold text-zinc-500">Pattern Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dotted layout"
                  value={patternName}
                  onChange={(e) => setPatternName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-250 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xxs uppercase font-bold text-zinc-505">Pattern Formula Syntax</label>
                <input
                  type="text"
                  placeholder="[first].[last][year]"
                  value={patternStr}
                  onChange={(e) => setPatternStr(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-250 font-mono tracking-wider focus:outline-none"
                />
                <span className="text-xxs text-zinc-500 block mt-1">Available placeholders: [first], [last], [f], [l], [num], [year]</span>
              </div>

              <div className="space-y-1">
                <label className="text-xxs uppercase font-bold text-zinc-505">Short Description</label>
                <input
                  type="text"
                  placeholder="Creates format: name.surname2026@domain.com"
                  value={patternDesc}
                  onChange={(e) => setPatternDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-250 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPatternModal(false)}
                className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-white rounded-lg transition font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-bold cursor-pointer"
              >
                Commit Formula Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
