/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, FileEdit, AlertCircle, Save } from 'lucide-react';
import { TaxpayerProfile, TaxTask } from '../types';

interface TasksViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
  onAddNotification: (text: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export default function TasksView({
  profile,
  darkMode,
  onUpdateProfile,
  onAddNotification,
}: TasksViewProps) {
  const [taskText, setTaskText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [notesText, setNotesText] = useState(profile.notes);
  const [isNotesSaved, setIsNotesSaved] = useState(true);

  // Toggle Task Completed
  const handleToggleTask = (id: string) => {
    const updatedTasks = profile.tasks.map(task => {
      if (task.id === id) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    onUpdateProfile({
      ...profile,
      tasks: updatedTasks
    });
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask: TaxTask = {
      id: `task-${Date.now()}`,
      text: taskText.trim(),
      completed: false,
      priority,
      dueDate: dueDate || undefined
    };

    onUpdateProfile({
      ...profile,
      tasks: [...profile.tasks, newTask]
    });

    onAddNotification(`Task added: "${taskText.trim()}"`, 'info');
    setTaskText('');
    setDueDate('');
  };

  // Delete Task
  const handleDeleteTask = (id: string) => {
    const updatedTasks = profile.tasks.filter(task => task.id !== id);
    onUpdateProfile({
      ...profile,
      tasks: updatedTasks
    });
  };

  // Save Notes
  const handleSaveNotes = () => {
    onUpdateProfile({
      ...profile,
      notes: notesText
    });
    setIsNotesSaved(true);
    onAddNotification("Taxpayer notes saved successfully.", "success");
  };

  // Handle Notes edit
  const handleNotesChange = (val: string) => {
    setNotesText(val);
    setIsNotesSaved(false);

    // Autosave note in profile state
    onUpdateProfile({
      ...profile,
      notes: val
    });
  };

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'high': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      default: return 'text-slate-400 bg-slate-800/50 border-slate-700/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight">Filing Tasks & Notes</h2>
        <p className="text-sm opacity-60">
          Track preparation actions, set priorities, and save annotations for <span className="font-semibold text-indigo-500">{profile.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Task Tracker (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-display font-bold text-sm text-slate-200 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400" />
              Preparer Checklist ({profile.tasks.filter(t => !t.completed).length} pending)
            </h3>

            {/* Task list */}
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
              {profile.tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                    task.completed 
                      ? 'bg-slate-950/20 border-slate-900 opacity-60' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Toggle */}
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      className="mt-0.5 text-slate-500 hover:text-indigo-400 transition-all cursor-pointer shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-500" />
                      ) : (
                        <Circle className="h-4.5 w-4.5 text-slate-600 hover:text-indigo-400" />
                      )}
                    </button>
                    
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.text}
                      </p>
                      {task.dueDate && (
                        <p className="text-[9px] opacity-50 font-mono mt-1">Due Date: {task.dueDate}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-4">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-slate-500 hover:text-rose-500 p-1.5 rounded hover:bg-rose-500/5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {profile.tasks.length === 0 && (
                <div className="text-center py-16 opacity-50 text-xs">
                  All préparation tasks are completed!
                </div>
              )}
            </div>

            {/* Add Task Form */}
            <form onSubmit={handleAddTask} className="border-t border-slate-800/50 pt-4 mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[10px] font-mono opacity-50 uppercase">New Prep Task</label>
                <input 
                  type="text"
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  placeholder="e.g., Request rent agreement copy..."
                  className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-50 uppercase">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className={`w-full text-xs px-2.5 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono opacity-50 uppercase">Action</label>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1 shadow-lg shadow-indigo-600/10 cursor-pointer h-9"
                >
                  <Plus className="h-4 w-4" /> Add Task
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Notes annotations area (Col Span 1) */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border flex flex-col h-[350px] ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
                <FileEdit className="h-4.5 w-4.5 text-indigo-400" />
                Taxpayer Notes
              </h3>

              {!isNotesSaved && (
                <button 
                  onClick={handleSaveNotes}
                  className="text-xs text-indigo-400 hover:text-white flex items-center gap-1 font-bold animate-pulse"
                >
                  <Save className="h-3 w-3" /> Save Note
                </button>
              )}
            </div>

            <textarea 
              value={notesText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Jot down notes, correction details, expected documents, employer queries..."
              className={`flex-1 text-xs p-3 rounded-xl border resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-100 border-slate-200'
              }`}
            />
            
            <p className="text-[9px] font-mono opacity-40 mt-2 shrink-0">
              * Notes are autosaved in session, click 'Save Note' to force commit.
            </p>
          </div>

          {/* Guidelines info card */}
          <div className="p-4 rounded-xl border border-slate-800/40 bg-slate-950/20 flex gap-3 text-xs opacity-80 leading-normal">
            <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px]">
              Notes and tasks are completely sandboxed under this profile. Switching profiles saves these inputs instantly.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
