/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Plus, Trash2, ArrowRight, UserPlus, Info, CheckCircle2 } from 'lucide-react';
import { TaxpayerProfile, FilingStatus } from '../types';

interface ProfilesViewProps {
  profiles: TaxpayerProfile[];
  activeProfileId: string;
  darkMode: boolean;
  onSwitchProfile: (id: string) => void;
  onAddProfile: (name: string, relation: string) => void;
  onDeleteProfile: (id: string) => void;
  onAddNotification: (text: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export default function ProfilesView({
  profiles,
  activeProfileId,
  darkMode,
  onSwitchProfile,
  onAddProfile,
  onDeleteProfile,
  onAddNotification,
}: ProfilesViewProps) {
  const [profileName, setProfileName] = useState('');
  const [relation, setRelation] = useState('Client 1');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;

    onAddProfile(profileName.trim(), relation);
    onAddNotification(`New profile created: ${profileName.trim()} (${relation})`, 'success');
    
    // Reset
    setProfileName('');
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'E-Verified': return 'text-teal-500 bg-teal-500/10 border-teal-500/20';
      case 'Filed': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'Ready to File': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
      case 'Waiting for Documents': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Taxpayer Profiles</h2>
          <p className="text-sm opacity-60">
            Switch between or manage multiple taxpayer profiles. Each taxpayer possesses fully isolated workspaces.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" /> Create New Taxpayer
        </button>
      </div>

      {/* Add Profile Form Panel */}
      {showAddForm && (
        <form 
          onSubmit={handleSubmit}
          className={`p-5 rounded-2xl border max-w-xl space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <h3 className="font-display font-bold text-sm text-slate-100 flex items-center gap-2">
            <UserPlus className="h-4.5 w-4.5 text-indigo-400" />
            Enter Taxpayer Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-70">Taxpayer Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g., Rajesh Kumar Sharma"
                required
                className={`w-full text-xs px-3.5 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-70">Relationship / Role</label>
              <select
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                className={`w-full text-xs px-3.5 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Myself">Myself</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Brother">Brother</option>
                <option value="Wife">Wife</option>
                <option value="Client 1">Client 1</option>
                <option value="Client 2">Client 2</option>
                <option value="Client 3">Client 3</option>
                <option value="Chartered Accountant">CA Collaborator</option>
                <option value="Other">Other Family / Client</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-800/30 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md cursor-pointer"
            >
              Create Profile
            </button>
          </div>
        </form>
      )}

      {/* Profiles list grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId;
          const completedTasks = p.checklist.filter(item => item.completed).length;
          const totalTasks = p.checklist.length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between h-56 transition-all relative ${
                isActive
                  ? 'border-indigo-600 bg-indigo-950/10 shadow-lg shadow-indigo-600/5'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Active ribbon */}
              {isActive && (
                <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                  Active Taxpayer
                </span>
              )}

              {/* Top Row info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl ${p.avatarColor || 'bg-indigo-600'} flex items-center justify-center font-display font-bold text-white text-sm shrink-0 shadow-md`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-200 truncate pr-16">{p.name}</h3>
                    <p className="text-[10px] font-mono opacity-50 mt-0.5">{p.relation}</p>
                  </div>
                </div>

                {/* Progress Mini Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-baseline text-[10px]">
                    <span className="opacity-55">Filing Complete</span>
                    <span className="font-mono font-semibold text-indigo-400">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>

              {/* Status and Action Row */}
              <div className="border-t border-slate-800/40 pt-4 mt-2 flex items-center justify-between">
                <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase ${getStatusColor(p.filingStatus)}`}>
                  {p.filingStatus}
                </span>

                <div className="flex items-center gap-1.5">
                  {!isActive ? (
                    <button
                      onClick={() => onSwitchProfile(p.id)}
                      className="text-xs text-indigo-400 hover:text-white hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      Load Workspace <ArrowRight className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-emerald-500 font-bold font-mono flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Open
                    </span>
                  )}
                  
                  {/* Delete button (block deletion of active or default primary yourself) */}
                  {profiles.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete profile: ${p.name}? All associated documents, chats, notes will be lost permanently.`)) {
                          onDeleteProfile(p.id);
                        }
                      }}
                      className="text-slate-500 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/5 cursor-pointer ml-1.5"
                      title="Delete taxpayer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info warning */}
      <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-950/20 flex gap-3 text-xs opacity-80 leading-normal max-w-2xl">
        <Info className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <p className="text-[10px]">
          Filing status badges represent active filing schedules. Each profile generates an independent timeline. Selecting 'Load Workspace' swaps folders, checklist registries, documents, and historical notes dynamically.
        </p>
      </div>
    </div>
  );
}
