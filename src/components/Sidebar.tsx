/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  Bot, 
  GitCommit, 
  CheckSquare2, 
  Coins, 
  HelpCircle, 
  FileEdit, 
  Settings, 
  Sun, 
  Moon,
  ChevronRight
} from 'lucide-react';
import { TaxpayerProfile } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeProfile: TaxpayerProfile | null;
  profiles: TaxpayerProfile[];
  onSwitchProfile: (id: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  activeProfile,
  profiles,
  onSwitchProfile,
  darkMode,
  setDarkMode,
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'profiles', name: 'Taxpayer Profiles', icon: Users, badge: profiles.length.toString() },
    { id: 'wizard', name: 'Tax Filing Wizard', icon: GitCommit },
    { id: 'checklist', name: 'Dynamic Checklist', icon: CheckSquare },
    { id: 'documents', name: 'Document Manager', icon: FileText, badge: activeProfile ? activeProfile.documents.filter(d => d.status === 'Uploaded').length.toString() : undefined },
    { id: 'assistant', name: 'AI Tax Assistant', icon: Bot },
    { id: 'tasks', name: 'Tasks & Notes', icon: CheckSquare2 },
    { id: 'summary', name: 'Tax Summary', icon: Coins },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-500';
      case 'E-Verified': return 'bg-teal-500';
      case 'Filed': return 'bg-blue-500';
      case 'Ready to File': return 'bg-indigo-500';
      case 'Waiting for Documents': return 'bg-amber-500';
      case 'In Progress': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <aside className={`w-64 border-r flex flex-col h-screen shrink-0 ${
      darkMode 
        ? 'bg-slate-900/80 border-slate-800 text-slate-200' 
        : 'bg-white border-slate-200 text-slate-800'
    } backdrop-blur-md z-10 transition-colors duration-200`}>
      {/* Brand Header */}
      <div className="p-6 border-b border-inherit flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-display font-semibold tracking-tight text-indigo-500">TaxPilot AI</h1>
          <p className="text-[10px] font-mono uppercase tracking-wider opacity-60">Filing Assistant</p>
        </div>
      </div>

      {/* Active Profile Quick Switcher */}
      {activeProfile && (
        <div className="p-4 border-b border-inherit bg-inherit/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider opacity-60">Active Taxpayer</span>
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${getStatusColor(activeProfile.filingStatus)}`} />
              <span className="text-[10px] font-mono tracking-tight opacity-75">{activeProfile.filingStatus}</span>
            </span>
          </div>
          <div className="relative group">
            <select
              value={activeProfile.id}
              onChange={(e) => onSwitchProfile(e.target.value)}
              className={`w-full text-xs font-semibold rounded-lg py-2 pl-3 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.relation})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 opacity-60">
              <ChevronRight className="h-4 w-4 transform rotate-90" />
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              id={`nav-item-${item.id}`}
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : darkMode
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'opacity-80'}`} />
              <span className="flex-1 text-left">{item.name}</span>
              {item.badge && (
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                  isActive 
                    ? 'bg-indigo-700 text-white' 
                    : darkMode 
                      ? 'bg-slate-800 text-slate-300' 
                      : 'bg-slate-200 text-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & User Info Footer */}
      <div className="p-4 border-t border-inherit space-y-4">
        {/* Theme switcher */}
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-medium opacity-70">Appearance</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg border transition-all ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* User Card */}
        <div className={`p-3 rounded-lg flex items-center gap-3 ${
          darkMode ? 'bg-slate-800/40' : 'bg-slate-50'
        }`}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            DS
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate leading-tight">sharmadivyansh.5008</p>
            <p className="text-[10px] font-mono opacity-60 truncate">Tax Agent Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
