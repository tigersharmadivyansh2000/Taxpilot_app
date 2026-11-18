/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  ArrowRight,
  RefreshCw,
  FolderOpen,
  MessageSquare,
  CheckSquare,
  User,
  Info
} from 'lucide-react';
import { TaxpayerProfile, FilingStatus, TaxDocument, ChecklistItem, TaxTask, TaxNotification } from './types';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import WizardView from './components/WizardView';
import ChecklistView from './components/ChecklistView';
import DocumentsView from './components/DocumentsView';
import AiChatView from './components/AiChatView';
import TasksView from './components/TasksView';
import ProfilesView from './components/ProfilesView';
import TaxSummaryView from './components/TaxSummaryView';

export default function App() {
  const [profiles, setProfiles] = useState<TaxpayerProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Global Search state
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    profiles: any[];
    documents: any[];
    checklist: any[];
    tasks: any[];
    queries: any[];
    notes: any[];
  }>({ profiles: [], documents: [], checklist: [], tasks: [], queries: [], notes: [] });

  // Notifications toggle list
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  // Fetch initial profiles from server
  useEffect(() => {
    async function initProfiles() {
      try {
        const res = await fetch("/api/profiles");
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProfiles(data);
          setActiveProfileId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load profiles, falling back to local fallback state", err);
      } finally {
        setIsLoading(false);
      }
    }
    initProfiles();
  }, []);

  // Sync / Autosave to server whenever profiles state changes
  const saveProfilesToServer = async (updatedProfiles: TaxpayerProfile[]) => {
    try {
      await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfiles)
      });
    } catch (err) {
      console.error("Autosave profiles request failed:", err);
    }
  };

  const handleUpdateProfile = (updated: TaxpayerProfile) => {
    const updatedProfiles = profiles.map(p => p.id === updated.id ? updated : p);
    setProfiles(updatedProfiles);
    saveProfilesToServer(updatedProfiles);
  };

  const handleSwitchProfile = (id: string) => {
    setActiveProfileId(id);
    addNotification(`Loaded workspace folder for ${profiles.find(p => p.id === id)?.name}`, 'info');
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId) || null;

  // Add notification to active profile
  const addNotification = (text: string, type: 'info' | 'warning' | 'success' | 'error' = 'info') => {
    if (!activeProfile) return;
    const newNotif: TaxNotification = {
      id: `notif-${Date.now()}`,
      text,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedProfile = {
      ...activeProfile,
      notifications: [newNotif, ...activeProfile.notifications]
    };
    handleUpdateProfile(updatedProfile);
  };

  // Switch tabs cleanly
  const handleSetTab = (tab: string) => {
    setCurrentTab(tab);
    setGlobalSearchQuery(''); // clear search
  };

  // Task adding helper from dashboard shortcut
  const handleAddTaskFromDashboard = (text: string) => {
    if (!activeProfile) return;
    const newTask: TaxTask = {
      id: `task-${Date.now()}`,
      text,
      completed: false,
      priority: 'medium'
    };
    handleUpdateProfile({
      ...activeProfile,
      tasks: [newTask, ...activeProfile.tasks]
    });
    addNotification(`Filing task listed: "${text}"`, 'info');
  };

  const handleToggleTaskFromDashboard = (id: string) => {
    if (!activeProfile) return;
    const updated = activeProfile.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    handleUpdateProfile({
      ...activeProfile,
      tasks: updated
    });
  };

  // Profile manager actions
  const handleAddProfile = (name: string, relation: string) => {
    const randomColors = ['bg-indigo-600', 'bg-emerald-600', 'bg-purple-600', 'bg-teal-600', 'bg-pink-600', 'bg-amber-600'];
    const color = randomColors[Math.floor(Math.random() * randomColors.length)];
    
    const newProfile: TaxpayerProfile = {
      id: `profile-${Date.now()}`,
      name,
      relation,
      filingStatus: 'Not Started',
      avatarColor: color,
      step: 1,
      basicDetails: {
        name,
        pan: '',
        aadhaar: '',
        dob: '',
        mobile: '',
        email: '',
        address: ''
      },
      residentialStatus: '',
      employmentType: '',
      incomeSources: [],
      taxRegime: '',
      checklist: [
        { id: `c-new-1-${Date.now()}`, text: "Verify basic details & PAN", completed: false, category: "Identity" },
        { id: `c-new-2-${Date.now()}`, text: "Link Aadhaar with PAN", completed: false, category: "Identity" },
        { id: `c-new-3-${Date.now()}`, text: "Download Form 26AS", completed: false, category: "Income Verification" },
        { id: `c-new-4-${Date.now()}`, text: "Download Annual Information Statement (AIS)", completed: false, category: "Income Verification" },
        { id: `c-new-5-${Date.now()}`, text: "Review deductions", completed: false, category: "Deductions" },
        { id: `c-new-6-${Date.now()}`, text: "Choose tax regime", completed: false, category: "Filing" },
        { id: `c-new-7-${Date.now()}`, text: "File return & E-verify", completed: false, category: "Filing" }
      ],
      documents: [
        { id: `doc-new-1-${Date.now()}`, name: '', category: 'PAN', status: 'Missing' },
        { id: `doc-new-2-${Date.now()}`, name: '', category: 'Aadhaar', status: 'Missing' },
        { id: `doc-new-3-${Date.now()}`, name: '', category: 'Form 16', status: 'Missing' },
        { id: `doc-new-4-${Date.now()}`, name: '', category: 'AIS', status: 'Missing' },
        { id: `doc-new-5-${Date.now()}`, name: '', category: 'Form 26AS', status: 'Missing' }
      ],
      aiChats: [],
      queries: [],
      tasks: [
        { id: `task-new-1-${Date.now()}`, text: `Obtain income proofs for ${name}`, completed: false, priority: 'high' }
      ],
      notifications: [
        { id: `notif-new-1-${Date.now()}`, text: `Profile folder established for ${name} (${relation}).`, type: 'success', timestamp: new Date().toISOString(), read: false }
      ],
      notes: `Fresh tax folder for ${name}. Track active investments under Section 80C.`,
      incomeData: {
        salary: 0,
        rental: 0,
        business: 0,
        interest: 0,
        other: 0,
        deductions80c: 0,
        deductions80d: 0,
        otherDeductions: 0
      },
      recommendations: [
        { id: `rec-new-1-${Date.now()}`, type: 'opportunity', title: 'Compare Slabs', description: 'Complete step 1-5 in Wizard to trigger automated slab calculations.', impactValue: 'Regime check', status: 'pending' }
      ]
    };

    const updatedProfiles = [...profiles, newProfile];
    setProfiles(updatedProfiles);
    setActiveProfileId(newProfile.id);
    saveProfilesToServer(updatedProfiles);
  };

  const handleDeleteProfile = (id: string) => {
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    if (activeProfileId === id && updated.length > 0) {
      setActiveProfileId(updated[0].id);
    }
    saveProfilesToServer(updated);
  };

  // Reset profiles store to original mock seed
  const handleResetProfiles = async () => {
    if (confirm("Reset taxpayers store to initial demonstration profiles? All custom profiles, tasks, and documents will be cleared.")) {
      setIsLoading(true);
      try {
        const res = await fetch("/api/profiles/reset", { method: "POST" });
        const data = await res.json();
        if (data.success) {
          setProfiles(data.profiles);
          setActiveProfileId(data.profiles[0].id);
          addNotification("Profiles reset to demonstration defaults.", "info");
        }
      } catch (err) {
        console.error("Reset request failed:", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Perform Global Search across all models
  useEffect(() => {
    if (!globalSearchQuery.trim()) {
      setSearchResults({ profiles: [], documents: [], checklist: [], tasks: [], queries: [], notes: [] });
      return;
    }

    const query = globalSearchQuery.toLowerCase();
    
    const matchedProfiles = profiles.filter(p => 
      p.name.toLowerCase().includes(query) || p.relation.toLowerCase().includes(query)
    );

    const matchedDocs: any[] = [];
    const matchedChecklist: any[] = [];
    const matchedTasks: any[] = [];
    const matchedQueries: any[] = [];
    const matchedNotes: any[] = [];

    profiles.forEach(p => {
      // Documents
      p.documents.forEach(d => {
        if ((d.name && d.name.toLowerCase().includes(query)) || d.category.toLowerCase().includes(query)) {
          matchedDocs.push({ ...d, profileId: p.id, profileName: p.name });
        }
      });

      // Checklist
      p.checklist.forEach(c => {
        if (c.text.toLowerCase().includes(query)) {
          matchedChecklist.push({ ...c, profileId: p.id, profileName: p.name });
        }
      });

      // Tasks
      p.tasks.forEach(t => {
        if (t.text.toLowerCase().includes(query)) {
          matchedTasks.push({ ...t, profileId: p.id, profileName: p.name });
        }
      });

      // Queries
      p.queries.forEach(q => {
        if (q.question.toLowerCase().includes(query) || q.answer.toLowerCase().includes(query)) {
          matchedQueries.push({ ...q, profileId: p.id, profileName: p.name });
        }
      });

      // Notes
      if (p.notes.toLowerCase().includes(query)) {
        matchedNotes.push({ content: p.notes, profileId: p.id, profileName: p.name });
      }
    });

    setSearchResults({
      profiles: matchedProfiles,
      documents: matchedDocs,
      checklist: matchedChecklist,
      tasks: matchedTasks,
      queries: matchedQueries,
      notes: matchedNotes
    });

  }, [globalSearchQuery, profiles]);

  // Handle Search item clicks
  const handleSearchResultClick = (profileId: string, tab: string) => {
    setActiveProfileId(profileId);
    setCurrentTab(tab);
    setGlobalSearchQuery('');
  };

  const hasSearchResults = 
    searchResults.profiles.length > 0 ||
    searchResults.documents.length > 0 ||
    searchResults.checklist.length > 0 ||
    searchResults.tasks.length > 0 ||
    searchResults.queries.length > 0 ||
    searchResults.notes.length > 0;

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-4">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        <p className="text-sm font-mono tracking-wider text-indigo-400">LOADING TAXPILOT WORKSPACE...</p>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex overflow-hidden font-sans ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Dynamic Sidebar navigation */}
      <Sidebar 
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        activeProfile={activeProfile}
        profiles={profiles}
        onSwitchProfile={handleSwitchProfile}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main content viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Universal Header */}
        <header className={`h-16 px-6 border-b shrink-0 flex items-center justify-between z-20 ${
          darkMode ? 'bg-slate-950/80 border-slate-900' : 'bg-white border-slate-100'
        } backdrop-blur-sm`}>
          
          {/* Search bar layout */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={globalSearchQuery}
              onChange={(e) => setGlobalSearchQuery(e.target.value)}
              placeholder="Search documents, profiles, queries, notes..."
              className={`w-full text-xs pl-9 pr-8 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                darkMode ? 'bg-slate-900/60 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
            {globalSearchQuery && (
              <button 
                onClick={() => setGlobalSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Global Search Results Dropdown Overlay */}
            {globalSearchQuery && (
              <div className={`absolute top-11 left-0 w-[420px] max-h-[400px] overflow-y-auto rounded-xl border p-4 shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              } backdrop-blur-lg z-50`}>
                <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
                  <span className="text-[10px] font-mono opacity-50 uppercase">Global Search Results</span>
                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded font-mono">Index active</span>
                </div>

                {!hasSearchResults && (
                  <p className="text-center py-6 text-xs opacity-50 font-mono">No matching records found.</p>
                )}

                {/* Profiles results */}
                {searchResults.profiles.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] font-mono uppercase opacity-55 text-indigo-400">Profiles</h5>
                    {searchResults.profiles.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSearchResultClick(p.id, 'profiles')}
                        className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/50 flex items-center justify-between"
                      >
                        <span className="font-semibold">{p.name} ({p.relation})</span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Documents results */}
                {searchResults.documents.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] font-mono uppercase opacity-55 text-indigo-400">Filing Documents</h5>
                    {searchResults.documents.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchResultClick(d.profileId, 'documents')}
                        className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/50 flex items-center justify-between"
                      >
                        <span className="truncate pr-4 flex items-center gap-1.5">
                          <FolderOpen className="h-3.5 w-3.5 text-indigo-400" />
                          {d.category} {d.name && `(${d.name})`} • <span className="opacity-50 text-[10px]">{d.profileName}</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Tasks results */}
                {searchResults.tasks.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] font-mono uppercase opacity-55 text-indigo-400">Action Tasks</h5>
                    {searchResults.tasks.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchResultClick(t.profileId, 'tasks')}
                        className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/50 flex items-center justify-between"
                      >
                        <span className="truncate pr-4 flex items-center gap-1.5">
                          <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                          {t.text} • <span className="opacity-50 text-[10px]">{t.profileName}</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Saved Queries results */}
                {searchResults.queries.length > 0 && (
                  <div className="space-y-1.5">
                    <h5 className="text-[9px] font-mono uppercase opacity-55 text-indigo-400">Archived Tax Queries</h5>
                    {searchResults.queries.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchResultClick(q.profileId, 'assistant')}
                        className="w-full text-left text-xs p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/50 flex items-center justify-between"
                      >
                        <span className="truncate pr-4 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />
                          {q.question} • <span className="opacity-50 text-[10px]">{q.profileName}</span>
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Area: active profile status + alerts */}
          <div className="flex items-center gap-4">
            
            {/* Quick profiles reset developer option */}
            <button
              onClick={handleResetProfiles}
              className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 flex items-center gap-1.5 transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}
              title="Reset Database to Demonstration defaults"
            >
              <RefreshCw className="h-3 w-3" /> Reset default profiles
            </button>

            {activeProfile && (
              <div className="hidden md:flex items-center gap-2">
                <span className="text-xs opacity-60 font-medium">Currently preparing:</span>
                <span className="text-xs font-semibold text-indigo-500">{activeProfile.name}</span>
                <span className="text-[10px] font-mono opacity-50 bg-slate-800 px-1.5 py-0.5 rounded">
                  {activeProfile.relation}
                </span>
              </div>
            )}

            {/* Notifications Alert Center */}
            {activeProfile && (
              <div className="relative">
                <button
                  onClick={() => setShowNotificationsList(!showNotificationsList)}
                  className={`p-2 rounded-lg border transition-all cursor-pointer relative ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="h-4.5 w-4.5 text-slate-400" />
                  {activeProfile.notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-slate-950 animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotificationsList && (
                  <div className={`absolute top-11 right-0 w-80 rounded-xl border p-4 shadow-2xl space-y-3 ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  } z-50`}>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800/40">
                      <h4 className="text-xs font-bold flex items-center gap-2">
                        <Bell className="h-4 w-4 text-indigo-400" /> Actions Center
                      </h4>
                      <button 
                        onClick={() => {
                          const cleared = activeProfile.notifications.map(n => ({ ...n, read: true }));
                          handleUpdateProfile({ ...activeProfile, notifications: cleared });
                        }}
                        className="text-[10px] text-indigo-400 hover:underline font-bold"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="divide-y divide-slate-800/30 max-h-56 overflow-y-auto pr-1">
                      {activeProfile.notifications.map((notif) => (
                        <div key={notif.id} className="py-2.5 text-[11px] leading-relaxed flex gap-2.5 items-start">
                          <span className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                            notif.type === 'success' ? 'bg-emerald-500' :
                            notif.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'
                          }`} />
                          <div>
                            <p className="opacity-85">{notif.text}</p>
                            <p className="text-[9px] font-mono opacity-40 mt-1">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                      {activeProfile.notifications.length === 0 && (
                        <p className="text-center py-8 text-xs opacity-50 font-mono">No recent notifications.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* View switching panel wrapper */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeProfile ? (
            <React.Fragment>
              {currentTab === 'dashboard' && (
                <DashboardView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  setCurrentTab={handleSetTab}
                  onAddTask={handleAddTaskFromDashboard}
                  onToggleTask={handleToggleTaskFromDashboard}
                />
              )}
              {currentTab === 'profiles' && (
                <ProfilesView 
                  profiles={profiles}
                  activeProfileId={activeProfileId}
                  darkMode={darkMode}
                  onSwitchProfile={handleSwitchProfile}
                  onAddProfile={handleAddProfile}
                  onDeleteProfile={handleDeleteProfile}
                  onAddNotification={addNotification}
                />
              )}
              {currentTab === 'wizard' && (
                <WizardView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
              {currentTab === 'checklist' && (
                <ChecklistView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
              {currentTab === 'documents' && (
                <DocumentsView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                  onAddNotification={addNotification}
                />
              )}
              {currentTab === 'assistant' && (
                <AiChatView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
              {currentTab === 'tasks' && (
                <TasksView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                  onAddNotification={addNotification}
                />
              )}
              {currentTab === 'summary' && (
                <TaxSummaryView 
                  profile={activeProfile}
                  darkMode={darkMode}
                  onUpdateProfile={handleUpdateProfile}
                  onAddNotification={addNotification}
                />
              )}
            </React.Fragment>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-xs max-w-sm mx-auto">
              <User className="h-10 w-10 text-indigo-400 mb-4 animate-bounce" />
              <p className="font-bold">No Active Taxpayer profile found</p>
              <p className="opacity-60 mt-1 leading-normal">
                Please add a default profile folder to activate your tax filing dashboard.
              </p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
