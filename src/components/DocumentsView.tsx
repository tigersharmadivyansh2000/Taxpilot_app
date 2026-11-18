/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Eye, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  File, 
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import { TaxpayerProfile, TaxDocument } from '../types';

interface DocumentsViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
  onAddNotification: (text: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export default function DocumentsView({
  profile,
  darkMode,
  onUpdateProfile,
  onAddNotification,
}: DocumentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Uploaded' | 'Missing'>('All');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom categories for mock upload modal selector
  const [selectedCategory, setSelectedCategory] = useState('Form 16');

  // Trigger select file dialog
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Process uploaded files
  const handleUpload = (files: FileList) => {
    const newDocs = [...profile.documents];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const category = selectedCategory;
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;

      // Check if document already exists for this category
      const existingIdx = newDocs.findIndex(d => d.category === category);
      
      const uploadedDoc: TaxDocument = {
        id: `doc-${Date.now()}-${i}`,
        name: file.name,
        category: category,
        status: 'Uploaded',
        uploadDate: new Date().toISOString().split('T')[0],
        fileSize: sizeStr,
        fileType: file.name.split('.').pop() || 'pdf'
      };

      if (existingIdx > -1) {
        newDocs[existingIdx] = uploadedDoc;
      } else {
        newDocs.push(uploadedDoc);
      }

      onAddNotification(`Document "${file.name}" uploaded successfully for ${category}.`, 'success');
    }

    // Automatically update checklist item as well!
    let updatedChecklist = [...profile.checklist];
    updatedChecklist = updatedChecklist.map(item => {
      if (item.category === "Income Verification" && item.text.includes(selectedCategory)) {
        return { ...item, completed: true };
      }
      return item;
    });

    onUpdateProfile({
      ...profile,
      documents: newDocs,
      checklist: updatedChecklist
    });
  };

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Events
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files);
    }
  };

  // Delete document
  const handleDeleteDoc = (id: string, docName: string) => {
    const updatedDocs = profile.documents.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          name: '',
          status: 'Missing' as const,
          uploadDate: undefined,
          fileSize: undefined,
          fileType: undefined
        };
      }
      return doc;
    });

    onUpdateProfile({
      ...profile,
      documents: updatedDocs
    });

    onAddNotification(`Removed document: ${docName}`, 'info');
  };

  // All legal Indian tax documents
  const documentCategories = [
    'PAN',
    'Aadhaar',
    'Form 16',
    'AIS',
    'Form 26AS',
    'Salary Slips',
    'Capital Gains Report',
    'Bank Statements',
    'Interest Certificates',
    'Rent Receipts',
    'Insurance',
    '80C Proofs',
    'Home Loan',
    'NPS',
    'Medical Bills',
    'Donation Receipts',
    'Other Documents'
  ];

  // Map categories to list items
  const fullDocumentList = documentCategories.map(cat => {
    const found = profile.documents.find(d => d.category === cat);
    if (found) return found;
    return {
      id: `missing-${cat}`,
      name: '',
      category: cat,
      status: 'Missing' as const
    };
  });

  // Filter & Search docs
  const filteredDocs = fullDocumentList.filter(doc => {
    const matchesSearch = doc.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'All') return matchesSearch;
    if (activeFilter === 'Uploaded') return matchesSearch && doc.status === 'Uploaded';
    return matchesSearch && doc.status === 'Missing';
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-display font-bold tracking-tight">Filing Document Vault</h2>
        <p className="text-sm opacity-60">
          Upload and organize documents to safely backup your Indian ITR reporting data for <span className="font-semibold text-indigo-500">{profile.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Document List & Filters (Col Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search document categories or file names..."
                className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-1">
              {['All', 'Uploaded', 'Missing'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    activeFilter === filter
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : darkMode
                        ? 'border-slate-800 text-slate-400 hover:text-slate-100'
                        : 'border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Document list grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className={`p-4 rounded-xl border flex flex-col justify-between h-40 transition-all ${
                  doc.status === 'Uploaded'
                    ? 'bg-indigo-950/5 border-slate-800/80 hover:border-indigo-500/30'
                    : 'bg-slate-900/30 border-slate-900/40 opacity-70'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    doc.status === 'Uploaded' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-500'
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{doc.category}</p>
                    {doc.status === 'Uploaded' ? (
                      <div className="space-y-1 mt-1">
                        <p className="text-[10px] opacity-75 truncate text-indigo-400">{doc.name}</p>
                        <p className="text-[9px] font-mono opacity-50">Uploaded on {doc.uploadDate} • {doc.fileSize}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] opacity-40 mt-1">Status: Missing document</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/40 pt-2">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                    doc.status === 'Uploaded' 
                      ? 'text-emerald-500 bg-emerald-500/10' 
                      : 'text-amber-500 bg-amber-500/10'
                  }`}>
                    {doc.status}
                  </span>

                  {doc.status === 'Uploaded' ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => alert(`Reviewing mocked content for ${doc.category}`)}
                        className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800/40"
                        title="View Doc"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteDoc(doc.id, doc.name)}
                        className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/5"
                        title="Delete Doc"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedCategory(doc.category);
                        onButtonClick();
                      }}
                      className="text-[10px] text-indigo-400 hover:text-white hover:underline font-bold flex items-center gap-1.5"
                    >
                      Upload File
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Drag and Drop Uploader Side Panel (Col Span 1) */}
        <div className="space-y-4">
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <h3 className="font-display font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <FolderOpen className="h-4.5 w-4.5 text-indigo-400" />
              Upload Document
            </h3>

            {/* Category Select */}
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-mono opacity-50 uppercase">Select Target Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`w-full text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}
              >
                {documentCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Drag Area */}
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={onButtonClick}
              className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/5' 
                  : darkMode ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-850/20' : 'border-slate-200 hover:border-indigo-400'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                multiple 
                onChange={handleChange}
              />
              <UploadCloud className="h-10 w-10 text-indigo-500 animate-pulse mb-3" />
              <p className="text-xs font-semibold mb-1">Drag and drop file here</p>
              <p className="text-[10px] opacity-50 mb-3">Or click to select from file system</p>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950/60 opacity-60">PDF, PNG, JPG up to 10MB</span>
            </div>
          </div>

          {/* Quick Alert Warning */}
          <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-950/10 flex gap-3 text-xs opacity-85 leading-relaxed">
            <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[11px] text-amber-400">Security and Data Privacy Guard</p>
              <p className="text-[10px] opacity-80 mt-1">
                Your legal documents remain sandboxed entirely under <span className="font-semibold text-indigo-400">{profile.name}</span>'s taxpayer profile, completely inaccessible to any third party.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
