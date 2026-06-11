import React, { useState, useEffect } from 'react';
import { dbService, secureHash } from '../lib/db';
import { Domain, EmailPattern, NameRecord, GeneratedEmail } from '../types';
import {
  Copy, Download, Search, Sparkles, Filter, RefreshCw, Layers, Check, ChevronLeft, ChevronRight, User, HelpCircle, Eye
} from 'lucide-react';
import { useToast } from './Toast';
import { motion, AnimatePresence } from 'motion/react';

export default function EmailGenerator() {
  const { toast } = useToast();
  
  // DB States
  const [activeDomains, setActiveDomains] = useState<Domain[]>([]);
  const [activePatterns, setActivePatterns] = useState<EmailPattern[]>([]);
  const [maleNames, setMaleNames] = useState<NameRecord[]>([]);
  const [femaleNames, setFemaleNames] = useState<NameRecord[]>([]);
  const [lastNames, setLastNames] = useState<NameRecord[]>([]);

  // Generator Options
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | 'mixed'>('mixed');
  const [selectedDomainId, setSelectedDomainId] = useState<string>('all');
  const [selectedPatternId, setSelectedPatternId] = useState<string>('all');
  const [generationCount, setGenerationCount] = useState<number>(50);
  const [customRange, setCustomRange] = useState<string>('');

  // Generated Outputs
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmail[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [filterPattern, setFilterPattern] = useState<string>('all');
  
  // Pagination & Sorting States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);
  const [sortBy, setSortBy] = useState<'email' | 'pattern' | 'name'>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    loadDbState();
  }, []);

  const loadDbState = () => {
    setActiveDomains(dbService.getActiveDomains());
    setActivePatterns(dbService.getActivePatterns());
    setMaleNames(dbService.getNames('male'));
    setFemaleNames(dbService.getNames('female'));
    setLastNames(dbService.getNames('last'));
  };

  // Helper to resolve pattern templates
  const applyPattern = (
    first: string,
    last: string,
    patternStr: string,
    domain: string
  ): string => {
    let emailUser = patternStr.toLowerCase();
    
    // Replace custom tokens
    emailUser = emailUser.replace(/\[first\]/g, first.toLowerCase());
    emailUser = emailUser.replace(/\[last\]/g, last.toLowerCase());
    emailUser = emailUser.replace(/\[f\]/g, first.charAt(0).toLowerCase());
    emailUser = emailUser.replace(/\[l\]/g, last.charAt(0).toLowerCase());
    
    // Seed standard random modifiers
    if (emailUser.includes('[num]')) {
      const randNum = Math.floor(Math.random() * 899) + 100; // 100 to 999
      emailUser = emailUser.replace(/\[num\]/g, randNum.toString());
    }
    if (emailUser.includes('[year]')) {
      const currentYear = new Date().getFullYear();
      const years = [currentYear, currentYear - 1, currentYear - 2, 1998, 1999, 2000, 2001, 2002, 2003, 2004, 2005];
      const randYear = years[Math.floor(Math.random() * years.length)];
      emailUser = emailUser.replace(/\[year\]/g, randYear.toString());
    }

    // fallback sanity cleanup to prevent invalid email characters
    emailUser = emailUser.replace(/[^a-zA-Z0-9._-]/g, '');
    
    return `${emailUser}${domain}`;
  };

  // Handle core email bulk generation
  const handleGenerate = () => {
    if (activeDomains.length === 0) {
      toast('No active email domains found in the registry. Please configure them in the Admin Panel.', 'warning');
      return;
    }
    if (activePatterns.length === 0) {
      toast('No active email patterns found. Please configure them in the Admin Panel.', 'warning');
      return;
    }

    const availableFirstNames =
      selectedGender === 'male'
        ? maleNames
        : selectedGender === 'female'
        ? femaleNames
        : [...maleNames, ...femaleNames];

    if (availableFirstNames.length === 0) {
      toast(`No first name data available for selection: ${selectedGender}`, 'warning');
      return;
    }
    if (lastNames.length === 0) {
      toast('No last name data available in registry.', 'warning');
      return;
    }

    setIsGenerating(true);
    let countToGenerate = generationCount;
    if (customRange.trim() !== '') {
      const customNum = parseInt(customRange);
      if (!isNaN(customNum) && customNum > 0 && customNum <= 2000) {
        countToGenerate = customNum;
      } else {
        toast('Please specify a custom bulk range between 1 and 2,000.', 'warning');
        setIsGenerating(false);
        return;
      }
    }

    setTimeout(() => {
      const resultPool: GeneratedEmail[] = [];
      const usedEmails = new Set<string>();

      for (let i = 0; i < countToGenerate; i++) {
        // Pick individual parts randomly
        const firstRecord = availableFirstNames[Math.floor(Math.random() * availableFirstNames.length)];
        const lastRecord = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        let targetDomain = '';
        if (selectedDomainId === 'all') {
          targetDomain = activeDomains[Math.floor(Math.random() * activeDomains.length)].name;
        } else {
          const domObj = activeDomains.find(d => d.id === selectedDomainId);
          targetDomain = domObj ? domObj.name : activeDomains[0].name;
        }

        let targetPattern: EmailPattern;
        if (selectedPatternId === 'all') {
          targetPattern = activePatterns[Math.floor(Math.random() * activePatterns.length)];
        } else {
          const patObj = activePatterns.find(p => p.id === selectedPatternId);
          targetPattern = patObj ? patObj : activePatterns[0];
        }

        const emailString = applyPattern(firstRecord.name, lastRecord.name, targetPattern.pattern, targetDomain);
        
        // Prevent simple duplicates in this individual generation session
        if (usedEmails.has(emailString) && i < 1000) {
          // let duplicate attempt retry minor modifications
          const saltyEmail = emailString.replace('@', `${Math.floor(Math.random() * 9)}@`);
          resultPool.push({
            id: `gen-${Date.now()}-${i}`,
            email: saltyEmail,
            firstName: firstRecord.name,
            lastName: lastRecord.name,
            domain: targetDomain,
            patternName: targetPattern.name
          });
          usedEmails.add(saltyEmail);
        } else {
          resultPool.push({
            id: `gen-${Date.now()}-${i}`,
            email: emailString,
            firstName: firstRecord.name,
            lastName: lastRecord.name,
            domain: targetDomain,
            patternName: targetPattern.name
          });
          usedEmails.add(emailString);
        }
      }

      setGeneratedEmails(resultPool);
      dbService.incrementGeneratedCount(resultPool.length);
      setIsGenerating(false);
      setCurrentPage(1);
      toast(`Successfully generated ${resultPool.length} customized email profiles!`, 'success');
    }, 400);
  };

  // Prepopulate generated emails list on initial mount so user is greeted by interactive results
  useEffect(() => {
    if (activeDomains.length > 0 && activePatterns.length > 0 && (maleNames.length > 0 || femaleNames.length > 0) && lastNames.length > 0) {
      handleGenerate();
    }
  }, [activeDomains.length, activePatterns.length, maleNames.length, lastNames.length]);

  // Copy Actions
  const handleCopySingle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyAll = () => {
    if (generatedEmails.length === 0) return;
    const text = generatedEmails.map(item => item.email).join('\n');
    navigator.clipboard.writeText(text);
    toast(`Copied all ${generatedEmails.length} emails to your clipboard!`, 'success');
  };

  // Export File Handles
  const handleExportTxt = () => {
    if (generatedEmails.length === 0) return;
    const textRows = generatedEmails.map(item => item.email).join('\r\n');
    const blob = new Blob([textRows], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `generated_emails_${Date.now()}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Plain text (.txt) list exported successfully.', 'success');
  };

  const handleExportCsv = () => {
    if (generatedEmails.length === 0) return;
    let csvContent = 'First Name,Last Name,Domain,Pattern Preset,Email Address\r\n';
    generatedEmails.forEach(item => {
      const row = `"${item.firstName}","${item.lastName}","${item.domain}","${item.patternName}","${item.email}"`;
      csvContent += row + '\r\n';
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `generated_emails_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('Spreadsheet CSV list exported successfully.', 'success');
  };

  // Filtering & Sorting Computed Lists
  const computedList = generatedEmails
    .filter(item => {
      const matchSearch =
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDomain = filterDomain === 'all' || item.domain === filterDomain;
      const matchPattern = filterPattern === 'all' || item.patternName === filterPattern;
      
      return matchSearch && matchDomain && matchPattern;
    })
    .sort((a, b) => {
      let valA = '';
      let valB = '';
      
      if (sortBy === 'email') {
        valA = a.email;
        valB = b.email;
      } else if (sortBy === 'pattern') {
        valA = a.patternName;
        valB = b.patternName;
      } else if (sortBy === 'name') {
        valA = `${a.firstName} ${a.lastName}`;
        valB = `${b.firstName} ${b.lastName}`;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination bounds
  const totalPages = Math.ceil(computedList.length / itemsPerPage) || 1;
  const paginatedList = computedList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleSort = (column: 'email' | 'pattern' | 'name') => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div id="email-generator-app" className="space-y-8 animate-fade-in">
      {/* Visual Header Grid Accent */}
      <div className="relative overflow-hidden bg-radial from-blue-500/10 via-zinc-900/0 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 backdrop-blur-md">
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs font-semibold text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            Highly Customizable Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-sans font-bold tracking-tight text-white">
            Email Pool Generator Pro
          </h1>
          <p className="text-sm md:text-base text-zinc-400 leading-relaxed">
            Generate unlimited customized, real-format emails for test vectors, customer rosters, marketing mockup maps, or structural validation datasets in seconds.
          </p>
        </div>
      </div>

      {/* Main Options & Result Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Generator Control Panel */}
        <div className="lg:col-span-4 bg-zinc-900/60 border border-zinc-800 p-6 rounded-2xl gap-6 flex flex-col backdrop-blur-lg shadow-xl">
          <h2 className="font-sans font-bold text-lg text-zinc-100 flex items-center gap-2 border-b border-zinc-800 pb-3">
            <Layers className="h-5 w-5 text-blue-500" />
            Config Options
          </h2>

          {/* Profile Name Set Filter */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Names Base Set</label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
              {(['mixed', 'male', 'female'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={`text-xs font-medium py-2 px-3 rounded-lg capitalize transition-all ${
                    selectedGender === g
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-zinc-450 hover:text-zinc-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Email Domain Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Target Service Domain</label>
            <select
              value={selectedDomainId}
              onChange={(e) => setSelectedDomainId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2.5 px-3 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">Distribute All Active Domains</option>
              {activeDomains.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pattern Style Selection */}
          <div className="space-y-2 font-sans">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Email Pattern Preset</label>
            <select
              value={selectedPatternId}
              onChange={(e) => setSelectedPatternId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2.5 px-3 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="all">Distribute All Active Patterns</option>
              {activePatterns.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.pattern})
                </option>
              ))}
            </select>
          </div>

          {/* Generator Limit */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">Bulk Count Quantity</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-850">
              {([10, 50, 100, 500] as const).map(c => (
                <button
                  key={c}
                  onClick={() => {
                    setGenerationCount(c);
                    setCustomRange('');
                  }}
                  className={`text-xs py-1.5 rounded-lg font-medium transition-colors ${
                    generationCount === c && customRange === ''
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            
            <input
              type="number"
              placeholder="Or custom size (max 2,000)"
              value={customRange}
              onChange={(e) => {
                setCustomRange(e.target.value);
                setGenerationCount(0);
              }}
              min="1"
              max="2000"
              className="w-full mt-2 bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-600 cursor-pointer shadow-lg hover:shadow-blue-500/20 disabled:bg-blue-800/55 disabled:text-zinc-400 flex items-center justify-center gap-2 group"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : 'group-hover:rotate-45 transition-transform'}`} />
            {isGenerating ? 'Synthesizing...' : 'Generate Emails'}
          </button>
        </div>

        {/* Right Side: Results Sandbox Board */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* List Headers Utilities bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/40 border border-zinc-850 p-4 rounded-xl backdrop-blur-md">
            <div className="text-xs text-zinc-450">
              Found <span className="font-semibold text-zinc-200">{computedList.length}</span> matching targets of <span className="text-zinc-350">{generatedEmails.length}</span>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyAll}
                disabled={generatedEmails.length === 0}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5"
              >
                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                Copy All
              </button>
              <button
                onClick={handleExportTxt}
                disabled={generatedEmails.length === 0}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                TXT
              </button>
              <button
                onClick={handleExportCsv}
                disabled={generatedEmails.length === 0}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-40 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                CSV Sheet
              </button>
            </div>
          </div>

          {/* Filter & Live Search Toolbar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-905 p-3 rounded-xl border border-zinc-850">
            {/* Live Search String */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                placeholder="Search usernames, names or suffixes..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-350 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Quick Live Filter by domain */}
            <div className="md:col-span-3">
              <select
                value={filterDomain}
                onChange={(e) => {
                  setFilterDomain(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2 px-3 text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="all">Filter Domain: All</option>
                {activeDomains.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Quick Live Filter by pattern */}
            <div className="md:col-span-3">
              <select
                value={filterPattern}
                onChange={(e) => {
                  setFilterPattern(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl text-xs py-2 px-3 text-zinc-400 focus:outline-none cursor-pointer"
              >
                <option value="all">Filter Pattern: All</option>
                {activePatterns.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Emails Table / Card Deck view */}
          <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl overflow-hidden shadow-xl min-h-[300px] flex flex-col justify-between">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/80 border-b border-zinc-850">
                    <th
                      className="p-4 text-xs font-semibold text-zinc-400 select-none cursor-pointer hover:bg-zinc-900/60 transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Mock Profile Senders
                        {sortBy === 'name' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th
                      className="p-4 text-xs font-semibold text-zinc-400 select-none cursor-pointer hover:bg-zinc-900/60 transition-colors"
                      onClick={() => toggleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email Address Suggestions
                        {sortBy === 'email' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th
                      className="p-4 text-xs font-semibold text-zinc-400 select-none cursor-pointer hover:bg-zinc-900/60 transition-colors hidden md:table-cell"
                      onClick={() => toggleSort('pattern')}
                    >
                      <div className="flex items-center gap-1">
                        Pattern Layout
                        {sortBy === 'pattern' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                      </div>
                    </th>
                    <th className="p-4 text-xs font-semibold text-zinc-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850/40">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-zinc-500 font-sans">
                        <HelpCircle className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
                        No mock addresses match your search/filter settings.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map(item => (
                      <tr key={item.id} className="hover:bg-zinc-850/15 transition-colors group">
                        {/* Mock Senders Profile */}
                        <td className="p-4 text-sm font-medium text-zinc-200">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="truncate max-w-[120px] sm:max-w-none">
                              {item.firstName} {item.lastName}
                            </span>
                          </div>
                        </td>

                        {/* Structured email */}
                        <td className="p-4">
                          <code className="text-zinc-100 font-mono text-xs sm:text-sm bg-zinc-950/60 px-2 py-1.5 rounded-lg border border-zinc-850">
                            {item.email}
                          </code>
                        </td>

                        {/* Tag details */}
                        <td className="p-4 hidden md:table-cell">
                          <span className="inline-flex py-1 px-2.5 bg-zinc-800/80 border border-zinc-750 text-xxs font-semibold text-zinc-400 rounded-md">
                            {item.patternName}
                          </span>
                        </td>

                        {/* Copy controls */}
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleCopySingle(item.id, item.email)}
                            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors relative cursor-pointer inline-flex items-center justify-center"
                            title="Copy Suggestion"
                          >
                            {copiedId === item.id ? (
                              <Check className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-zinc-400 group-hover:text-zinc-200" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Segment footer */}
            {totalPages > 1 && (
              <div className="p-4 bg-zinc-950/40 border-t border-zinc-850/60 flex items-center justify-between">
                <span className="text-xs text-zinc-500">
                  Showing page <span className="text-zinc-350">{currentPage}</span> of <span className="text-zinc-350">{totalPages}</span>
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-30 rounded-lg text-zinc-350 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-750 disabled:opacity-30 rounded-lg text-zinc-350 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
