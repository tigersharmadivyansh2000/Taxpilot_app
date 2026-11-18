/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Bookmark, 
  Search, 
  HelpCircle, 
  ChevronRight, 
  MessageSquare,
  BookMarked,
  FolderMinus,
  CheckCircle,
  Lightbulb
} from 'lucide-react';
import { TaxpayerProfile, ChatMessage, QueryItem } from '../types';

interface AiChatViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
}

export default function AiChatView({
  profile,
  darkMode,
  onUpdateProfile,
}: AiChatViewProps) {
  const [activeTab, setActiveTab] = useState<'assistant' | 'queries'>('assistant');
  const [inputMessage, setInputMessage] = useState('');
  const [isSearching, setIsSearching] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [isGenerating, setIsGenerating] = useState(false);

  // Send message to primary AI Chat stream
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const queryText = inputMessage.trim();
    setInputMessage('');

    // Append user message
    const userMsg: ChatMessage = {
      id: `chat-msg-${Date.now()}-u`,
      role: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    };

    const updatedChats = [...profile.aiChats, userMsg];
    onUpdateProfile({
      ...profile,
      aiChats: updatedChats
    });

    setIsGenerating(true);

    try {
      const res = await fetch("/api/tax-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: profile.aiChats,
          profileName: profile.name,
          profileData: profile
        })
      });
      const data = await res.json();
      
      const modelMsg: ChatMessage = {
        id: `chat-msg-${Date.now()}-m`,
        role: 'model',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      // Also automatically save under "Queries" in Query Center so it's persistent and searchable!
      const newQuery: QueryItem = {
        id: `query-${Date.now()}`,
        question: queryText,
        answer: data.text,
        category: determineCategory(queryText),
        timestamp: new Date().toISOString(),
        bookmarked: false
      };

      onUpdateProfile({
        ...profile,
        aiChats: [...updatedChats, modelMsg],
        queries: [newQuery, ...profile.queries]
      });

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `chat-msg-${Date.now()}-err`,
        role: 'model',
        text: "Error connecting to server-side AI model. Please verify your internet connection or API keys.",
        timestamp: new Date().toISOString()
      };
      onUpdateProfile({
        ...profile,
        aiChats: [...updatedChats, errorMsg]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper to categorize query based on keyword matching
  const determineCategory = (text: string): string => {
    const txt = text.toLowerCase();
    if (txt.includes('hra') || txt.includes('rent') || txt.includes('landlord')) return 'HRA & Rent';
    if (txt.includes('80c') || txt.includes('ppf') || txt.includes('deduct') || txt.includes('insurance')) return 'Deductions';
    if (txt.includes('regime') || txt.includes('old') || txt.includes('new')) return 'Tax Regime';
    if (txt.includes('interest') || txt.includes('bank') || txt.includes('savings')) return 'Interest & Savings';
    return 'General Tax';
  };

  // Bookmark toggle
  const toggleBookmark = (id: string) => {
    const updatedQueries = profile.queries.map(q => {
      if (q.id === id) {
        return { ...q, bookmarked: !q.bookmarked };
      }
      return q;
    });

    onUpdateProfile({
      ...profile,
      queries: updatedQueries
    });
  };

  // Filter queries
  const categoriesList = ['All', 'HRA & Rent', 'Deductions', 'Tax Regime', 'Interest & Savings', 'General Tax'];
  const filteredQueries = profile.queries.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(isSearching.toLowerCase()) || 
                          q.answer.toLowerCase().includes(isSearching.toLowerCase());
    
    if (activeCategory === 'All') return matchesSearch;
    return matchesSearch && q.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">AI Tax Guide & Query Center</h2>
          <p className="text-sm opacity-60">
            Consult TaxPilot AI regarding tax laws, exemptions, and deductions for <span className="font-semibold text-indigo-500">{profile.name}</span>
          </p>
        </div>

        {/* Tab Selector buttons */}
        <div className={`p-1.5 rounded-xl border flex gap-1 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assistant'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <Bot className="h-4 w-4" /> AI Tax Assistant
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'queries'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                : 'text-slate-400 hover:text-slate-100'
            }`}
          >
            <MessageSquare className="h-4 w-4" /> Saved Query Center
          </button>
        </div>
      </div>

      {/* Primary Layout */}
      {activeTab === 'assistant' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Chat Conversational Hub (Col Span 2) */}
          <div className={`xl:col-span-2 rounded-2xl border flex flex-col h-[500px] overflow-hidden ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 border-b border-slate-800/40 bg-indigo-950/5 flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">Interactive Chat Stream</span>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Chats Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 pr-3 text-xs">
              <div className="flex gap-3 max-w-[85%]">
                <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold">
                  AI
                </div>
                <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/40 leading-relaxed text-slate-300">
                  Welcome to your personalized AI Tax Guide, {profile.name}! 
                  <br /><br />
                  I can calculate tax regimes, check the list of Section 80C deductions, explain complex terms like **TDS**, **Form 26AS**, **AIS**, or walk you through HRA validation guidelines. Ask anything in conversational language below.
                </div>
              </div>

              {profile.aiChats.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex gap-3 max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto justify-end' : ''
                  }`}
                >
                  {msg.role !== 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 font-bold">
                      AI
                    </div>
                  )}
                  <div className={`p-3.5 rounded-xl leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none font-medium shadow-md shadow-indigo-600/10'
                      : 'bg-slate-800/70 border border-slate-700/30 text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-lg bg-slate-800 flex items-center justify-center text-white shrink-0 text-[10px] font-bold">
                      ME
                    </div>
                  )}
                </div>
              ))}

              {isGenerating && (
                <div className="flex gap-3 text-slate-400 text-xs italic">
                  <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                  <span>TaxPilot AI is checking tax databases...</span>
                </div>
              )}
            </div>

            {/* Quick prefilled buttons inside chat footer */}
            <div className="px-5 py-2.5 border-t border-slate-800/20 bg-slate-950/10 flex flex-wrap gap-1.5">
              {[
                "Can I claim LTA?",
                "What is Section 80D limit?",
                "Do I need AIS?",
                "How is FD interest taxed?"
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputMessage(q);
                  }}
                  className="text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/40 text-indigo-400 hover:border-indigo-500/20 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800/40 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`Ask ITR-1/2 advice for ${profile.name}...`}
                className={`flex-1 text-xs px-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg flex items-center justify-center gap-2 font-bold text-xs shadow-lg shadow-indigo-600/10 cursor-pointer"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </form>
          </div>

          {/* AI recommendations side bento list (Col Span 1) */}
          <div className={`p-5 rounded-2xl border flex flex-col h-[500px] overflow-hidden ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-display font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4.5 w-4.5 text-indigo-400" />
              TaxPilot Observations
            </h3>
            
            <p className="text-[11px] opacity-65 mb-4 leading-normal">
              Automated smart opportunities, warnings, and missing tax proofs detected in {profile.name}'s profile:
            </p>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {profile.recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-800/40 bg-slate-950/20 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      rec.type === 'deduction' ? 'bg-indigo-500/10 text-indigo-400' :
                      rec.type === 'missing_proof' ? 'bg-amber-500/10 text-amber-400' :
                      rec.type === 'warning' ? 'bg-rose-500/10 text-rose-400' :
                      'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {rec.type.toUpperCase().replace('_', ' ')}
                    </span>
                    <span className="font-mono font-bold text-indigo-400">{rec.impactValue}</span>
                  </div>
                  <h4 className="font-bold">{rec.title}</h4>
                  <p className="text-[10px] opacity-75 leading-normal">{rec.description}</p>
                </div>
              ))}
              {profile.recommendations.length === 0 && (
                <div className="text-center py-24 text-xs opacity-50">
                  Complete basic wizard parameters to trigger automated opportunities list.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Query Center Dashboard */
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={isSearching}
                onChange={(e) => setIsSearching(e.target.value)}
                placeholder="Search saved query topics or answers..."
                className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Categories filter list */}
            <div className="flex flex-wrap gap-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : darkMode
                        ? 'border-slate-800 text-slate-400 hover:text-slate-100'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Queries list container */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {filteredQueries.map((item) => (
              <div 
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  darkMode ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3 pb-2 border-b border-slate-800/30">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/5 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    <h3 className="text-xs font-bold text-slate-100 mt-1 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                      {item.question}
                    </h3>
                  </div>

                  {/* Bookmark button */}
                  <button 
                    onClick={() => toggleBookmark(item.id)}
                    className={`p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer ${
                      item.bookmarked ? 'text-amber-500' : 'text-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {item.bookmarked ? <BookMarked className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
                  </button>
                </div>

                <div className="text-xs leading-relaxed opacity-85 whitespace-pre-line text-slate-300">
                  {item.answer}
                </div>

                <p className="text-[9px] font-mono opacity-40 mt-3 text-right">
                  Asked on {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))}

            {filteredQueries.length === 0 && (
              <div className="text-center py-20 text-xs opacity-50">
                No archived queries match your search or filter criteria. Send questions inside the Assistant tab first to register queries!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
