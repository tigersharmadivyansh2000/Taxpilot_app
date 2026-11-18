/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle2, 
  FileCheck, 
  Sparkles, 
  Clock, 
  Activity, 
  Plus, 
  ShieldCheck,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { TaxpayerProfile, ChecklistItem, TaxDocument } from '../types';

interface DashboardViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  setCurrentTab: (tab: string) => void;
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
}

export default function DashboardView({
  profile,
  darkMode,
  setCurrentTab,
  onAddTask,
  onToggleTask,
}: DashboardViewProps) {
  // Calculate dynamic progress
  const totalItems = profile.checklist.length;
  const completedItems = profile.checklist.filter(item => item.completed).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Next action logic
  const getNextAction = () => {
    // If some wizard details are missing, return related actions
    if (!profile.basicDetails.pan || !profile.basicDetails.name) {
      return { text: "Complete step 1: Enter Basic Details & PAN", tab: "wizard" };
    }
    const missingDocs = profile.documents.filter(doc => doc.status === 'Missing');
    if (missingDocs.length > 0) {
      // Find high priority document missing
      const form16 = missingDocs.find(d => d.category === 'Form 16');
      if (form16) return { text: "Upload your Form 16 immediately", tab: "documents" };
      const ais = missingDocs.find(d => d.category === 'AIS');
      if (ais) return { text: "Download and upload your AIS statement", tab: "documents" };
      return { text: `Upload missing: ${missingDocs[0].category}`, tab: "documents" };
    }
    if (profile.taxRegime === 'Not sure') {
      return { text: "Complete Tax Regime comparison in Wizard", tab: "wizard" };
    }
    const pendingChecklist = profile.checklist.find(item => !item.completed);
    if (pendingChecklist) {
      return { text: pendingChecklist.text, tab: "checklist" };
    }
    return { text: "Review tax summary and prepare to file", tab: "summary" };
  };

  const nextAction = getNextAction();

  // Deadline calculation
  const deadlineDate = new Date("2026-07-31T00:00:00");
  const today = new Date();
  const diffTime = Math.abs(deadlineDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Tax Health Score derivation
  const missingDocsCount = profile.documents.filter(d => d.status === 'Missing').length;
  const pendingTasksCount = profile.tasks.filter(t => !t.completed).length;
  const healthScore = Math.max(30, 100 - (missingDocsCount * 10) - (pendingTasksCount * 4) - (profile.step === 1 ? 20 : 0));
  
  const getRiskLevel = (score: number) => {
    if (score >= 80) return { label: 'Low', color: 'text-emerald-500 bg-emerald-500/10' };
    if (score >= 50) return { label: 'Medium', color: 'text-amber-500 bg-amber-500/10' };
    return { label: 'High', color: 'text-rose-500 bg-rose-500/10' };
  };

  const risk = getRiskLevel(healthScore);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">
            Tax Dashboard
          </h2>
          <p className="text-sm opacity-60">
            Filing guidance and status for <span className="font-semibold text-indigo-500">{profile.name}</span>
          </p>
        </div>
        <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs flex items-center gap-2 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <Clock className="h-4 w-4 text-indigo-500" />
          <span>Filing Deadline: July 31, 2026</span>
          <span className="bg-rose-500/10 text-rose-500 font-semibold px-1.5 py-0.5 rounded text-[10px]">
            {diffDays} Days Left
          </span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Large Progress Card (Col Span 2) */}
        <div className={`col-span-1 lg:col-span-2 rounded-2xl p-6 glass-card border transition-all ${
          darkMode ? 'hover:border-slate-800' : 'hover:border-slate-200'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">ITR Filing Journey</span>
                <h3 className="text-xl font-display font-bold leading-tight">Tax Filing Progress</h3>
              </div>

              {/* Progress Bar & Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm opacity-70">Overall Completion</span>
                  <span className="text-3xl font-display font-extrabold text-indigo-500">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-800/80 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-md shadow-indigo-500/50"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Next Action Box */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                darkMode ? 'bg-slate-900/60 border-indigo-500/20' : 'bg-indigo-50/20 border-indigo-200'
              }`}>
                <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-bold">Recommended Next Step</p>
                  <p className="text-sm font-semibold truncate mt-0.5">{nextAction.text}</p>
                  <button 
                    onClick={() => setCurrentTab(nextAction.tab)}
                    className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:underline mt-2"
                  >
                    Take Action Now <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Status Circular Graphic */}
            <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-44 bg-indigo-950/20 rounded-2xl p-4 border border-indigo-500/5">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800/60"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-indigo-500"
                    strokeWidth="3.5"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xs font-mono uppercase opacity-55 text-[9px]">WIZARD STEP</span>
                  <span className="text-xl font-bold font-display">{profile.step} / 5</span>
                </div>
              </div>
              <span className="text-xs font-semibold opacity-80 mt-3">{profile.relation}'s Status</span>
              <span className="text-xs font-mono opacity-50">{profile.filingStatus}</span>
            </div>
          </div>
        </div>

        {/* Tax Health Score Card */}
        <div className={`rounded-2xl p-6 glass-card border transition-all ${
          darkMode ? 'hover:border-slate-800' : 'hover:border-slate-200'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800/50 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-500" />
              <h3 className="font-display font-bold">Filing Health Index</h3>
            </div>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${risk.color}`}>
              {risk.label} Audit Risk
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-4">
            <span className="text-xs opacity-60">Filing Security Rating</span>
            <span className="text-4xl font-display font-extrabold text-emerald-500">{healthScore}%</span>
          </div>

          {/* Key Metrics Checklist inside health card */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/50">
              <span className="opacity-70">Missing Documents</span>
              <span className={`font-mono font-bold ${missingDocsCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {missingDocsCount} {missingDocsCount === 1 ? 'doc' : 'docs'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/50">
              <span className="opacity-70">Deduction Opportunities</span>
              <span className="font-mono font-bold text-indigo-400">
                {profile.recommendations.filter(r => r.type === 'deduction' || r.type === 'opportunity').length} found
              </span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded bg-slate-900/50">
              <span className="opacity-70">Pending Filing Tasks</span>
              <span className="font-mono font-bold text-slate-300">
                {pendingTasksCount} remaining
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Row Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Missing Documents Alert list */}
        <div className={`rounded-2xl p-6 glass-card border flex flex-col h-[340px] overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              Document Status
            </h4>
            <button 
              onClick={() => setCurrentTab('documents')}
              className="text-xs text-indigo-500 hover:underline font-medium"
            >
              Manager
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {profile.documents.map((doc) => (
              <div 
                key={doc.id}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs ${
                  doc.status === 'Uploaded' 
                    ? 'bg-emerald-500/5 border-emerald-500/10' 
                    : 'bg-amber-500/5 border-amber-500/10'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="font-semibold truncate">{doc.name || doc.category}</p>
                  <p className="text-[10px] opacity-50 font-mono mt-0.5">{doc.category}</p>
                </div>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  doc.status === 'Uploaded' 
                    ? 'text-emerald-500 bg-emerald-500/10' 
                    : 'text-amber-500 bg-amber-500/10'
                }`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Tax Insights Banner / Recommendations */}
        <div className={`rounded-2xl p-6 glass-card border flex flex-col h-[340px] overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
              Recent AI Suggestions
            </h4>
            <button 
              onClick={() => setCurrentTab('assistant')}
              className="text-xs text-indigo-500 hover:underline font-medium"
            >
              Ask AI
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {profile.recommendations.map((rec) => (
              <div 
                key={rec.id}
                className="p-3 rounded-xl border border-slate-800/40 bg-slate-900/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                    rec.type === 'deduction' ? 'bg-indigo-500/10 text-indigo-400' :
                    rec.type === 'missing_proof' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {rec.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-400">{rec.impactValue}</span>
                </div>
                <h5 className="text-xs font-semibold">{rec.title}</h5>
                <p className="text-[11px] opacity-75 leading-normal">{rec.description}</p>
              </div>
            ))}
            {profile.recommendations.length === 0 && (
              <div className="text-center py-12 text-xs opacity-50">
                No active recommendations. Complete filing wizard steps to let AI analyze your profile.
              </div>
            )}
          </div>
        </div>

        {/* Task Center */}
        <div className={`rounded-2xl p-6 glass-card border flex flex-col h-[340px] overflow-hidden`}>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-display font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
              Today's Tasks
            </h4>
            <button 
              onClick={() => setCurrentTab('tasks')}
              className="text-xs text-indigo-500 hover:underline font-medium"
            >
              All Tasks
            </button>
          </div>

          {/* Quick Task Adding form */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const input = (e.target as any).taskText;
              if (input.value.trim()) {
                onAddTask(input.value);
                input.value = '';
              }
            }}
            className="flex items-center gap-2 mb-3"
          >
            <input 
              name="taskText"
              type="text" 
              placeholder="Add checklist item..."
              className={`flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
            <button 
              type="submit"
              className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {profile.tasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => onToggleTask(task.id)}
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 cursor-pointer transition-all ${
                  task.completed 
                    ? 'bg-slate-950/20 border-slate-900/60 opacity-60 line-through' 
                    : 'bg-slate-900/50 border-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className={`h-4.5 w-4.5 rounded border shrink-0 flex items-center justify-center mt-0.5 transition-all ${
                  task.completed 
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400' 
                    : 'border-slate-700 hover:border-indigo-500'
                }`}>
                  {task.completed && <CheckCircle2 className="h-3 w-3" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[11px]">{task.text}</p>
                  {task.dueDate && (
                    <p className="text-[9px] font-mono opacity-50 mt-0.5">Due: {task.dueDate}</p>
                  )}
                </div>
              </div>
            ))}
            {profile.tasks.length === 0 && (
              <div className="text-center py-12 text-xs opacity-50">
                You're all caught up! No pending tasks.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Notifications Row */}
      {profile.notifications.length > 0 && (
        <div className={`rounded-2xl p-5 glass-card border`}>
          <h4 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-400 mb-3">Recent Activities & Alerts</h4>
          <div className="divide-y divide-slate-800/50">
            {profile.notifications.slice(0, 3).map((notif) => (
              <div key={notif.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    notif.type === 'success' ? 'bg-emerald-500' :
                    notif.type === 'warning' ? 'bg-amber-500' :
                    notif.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
                  }`} />
                  <span className="opacity-80">{notif.text}</span>
                </div>
                <span className="text-[10px] font-mono opacity-40">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
