/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckSquare, Plus, Trash2, Filter, AlertCircle, FileSearch } from 'lucide-react';
import { TaxpayerProfile, ChecklistItem } from '../types';

interface ChecklistViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
}

export default function ChecklistView({
  profile,
  darkMode,
  onUpdateProfile,
}: ChecklistViewProps) {
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Income Verification');
  const [activeFilter, setActiveFilter] = useState<string>('All');

  // Toggle item
  const handleToggleItem = (id: string) => {
    const updatedChecklist = profile.checklist.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });

    onUpdateProfile({
      ...profile,
      checklist: updatedChecklist
    });
  };

  // Add custom checklist item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem: ChecklistItem = {
      id: `custom-c-${Date.now()}`,
      text: newItemText.trim(),
      completed: false,
      category: newItemCategory
    };

    onUpdateProfile({
      ...profile,
      checklist: [...profile.checklist, newItem]
    });

    setNewItemText('');
  };

  // Delete checklist item
  const handleDeleteItem = (id: string) => {
    const updatedChecklist = profile.checklist.filter(item => item.id !== id);
    onUpdateProfile({
      ...profile,
      checklist: updatedChecklist
    });
  };

  // Grouped unique categories
  const categories = ['All', ...new Set(profile.checklist.map(item => item.category))];

  // Filter checklist items
  const filteredChecklist = profile.checklist.filter(item => {
    if (activeFilter === 'All') return true;
    return item.category === activeFilter;
  });

  // Checklist counts
  const total = profile.checklist.length;
  const completed = profile.checklist.filter(i => i.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Dynamic ITR Checklist</h2>
          <p className="text-sm opacity-60">
            Checklist updates automatically based on details declared for <span className="text-indigo-500 font-semibold">{profile.name}</span>
          </p>
        </div>
        
        {/* Progress indicator card */}
        <div className={`p-4 rounded-xl border flex items-center gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="relative h-12 w-12 shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path className="text-slate-800" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="text-indigo-500" strokeWidth="3" strokeDasharray={`${percentage}, 100`} strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
              {percentage}%
            </div>
          </div>
          <div>
            <p className="text-xs font-mono uppercase opacity-50">Checklist progress</p>
            <p className="text-sm font-semibold">{completed} of {total} completed</p>
          </div>
        </div>
      </div>

      {/* Category selector filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              activeFilter === cat
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/10'
                : darkMode
                  ? 'border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Checklist List Table (Col Span 2) */}
        <div className="lg:col-span-2 space-y-3">
          {filteredChecklist.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                item.completed
                  ? 'bg-emerald-950/10 border-emerald-500/15 opacity-70'
                  : darkMode
                    ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                {/* Custom Styled Checklist Checkbox */}
                <button
                  onClick={() => handleToggleItem(item.id)}
                  className={`h-5 w-5 rounded border mt-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                    item.completed
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : darkMode 
                        ? 'border-slate-700 hover:border-indigo-500 hover:bg-indigo-500/5' 
                        : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20'
                  }`}
                >
                  {item.completed && <span className="text-xs font-bold">✓</span>}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium leading-relaxed ${item.completed ? 'line-through opacity-50' : 'text-slate-200'}`}>
                    {item.text}
                  </p>
                  <span className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full inline-block mt-1 ${
                    item.category === 'Identity' ? 'bg-purple-500/10 text-purple-400' :
                    item.category === 'Income Verification' ? 'bg-indigo-500/10 text-indigo-400' :
                    item.category === 'Deductions' ? 'bg-amber-500/10 text-amber-400' : 'bg-teal-500/10 text-teal-400'
                  }`}>
                    {item.category}
                  </span>
                </div>
              </div>

              {/* Delete button (only allow deletion for custom added items or keep it for flexibility) */}
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="text-slate-500 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/5 transition-all cursor-pointer shrink-0 ml-4"
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {filteredChecklist.length === 0 && (
            <div className="text-center py-16 opacity-50 text-xs">
              No checklist items matching filter choice.
            </div>
          )}
        </div>

        {/* Add Checklist Item Card (Col Span 1) */}
        <div className={`p-5 rounded-2xl border h-fit ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className="font-display font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-400" />
            Add ITR Requirement
          </h3>
          
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-70">Requirement Text / Action</label>
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="e.g., Get Home Loan Interest certificate"
                className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium opacity-70">Filing Stage Category</label>
              <select
                value={newItemCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                <option value="Identity">Identity (PAN, Aadhaar)</option>
                <option value="Income Verification">Income Verification (Forms/Slips)</option>
                <option value="Deductions">Deductions (80C proofs, Bills)</option>
                <option value="Filing">Filing & E-Verify</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 cursor-pointer"
            >
              Add Requirement
            </button>
          </form>

          {/* Quick guide alerts inside checklist sidebar */}
          <div className="mt-6 pt-5 border-t border-slate-800/50 space-y-3">
            <div className="flex gap-2.5 text-[10px] opacity-75">
              <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0" />
              <p className="leading-normal">
                Any changes in your Income Sources in the <span className="font-semibold text-indigo-400">Tax Wizard</span> will dynamically add/remove statutory checklists here.
              </p>
            </div>
            <div className="flex gap-2.5 text-[10px] opacity-75">
              <FileSearch className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="leading-normal">
                Double check Form 16 details directly against Form 26AS matching records to avoid automated mismatch notices from the department.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
