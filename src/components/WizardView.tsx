/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Coins, 
  HelpCircle, 
  Bot, 
  Send, 
  Sparkles, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  HelpCircle as QuestionIcon,
  ChevronRight,
  TrendingUp,
  X,
  FileCheck
} from 'lucide-react';
import { TaxpayerProfile, BasicDetails, ResidentialStatus, EmploymentType } from '../types';

interface WizardViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
}

export default function WizardView({
  profile,
  darkMode,
  onUpdateProfile,
}: WizardViewProps) {
  // Stepper state
  const activeStep = profile.step;
  const [basic, setBasic] = useState<BasicDetails>({ ...profile.basicDetails });
  const [resStatus, setResStatus] = useState<ResidentialStatus>(profile.residentialStatus);
  const [empType, setEmpType] = useState<EmploymentType>(profile.employmentType);
  const [incomeList, setIncomeList] = useState<string[]>([...profile.incomeSources]);
  const [regime, setRegime] = useState<'Old' | 'New' | 'Not sure' | ''>(profile.taxRegime);

  // AI assistant integration
  const [aiMessage, setAiMessage] = useState('');
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiRegimeAdvisor, setShowAiRegimeAdvisor] = useState(false);
  const [regimeAdvisorText, setRegimeAdvisorText] = useState('');
  const [isRegimeLoading, setIsRegimeLoading] = useState(false);

  // Sync state if profile changes
  useEffect(() => {
    setBasic({ ...profile.basicDetails });
    setResStatus(profile.residentialStatus);
    setEmpType(profile.employmentType);
    setIncomeList([...profile.incomeSources]);
    setRegime(profile.taxRegime);
    setAiHistory([]);
  }, [profile.id]);

  // Handler for text inputs (autosave triggers on Blur or Navigation)
  const handleBasicChange = (field: keyof BasicDetails, val: string) => {
    const updated = { ...basic, [field]: val };
    setBasic(updated);
    
    // Autosave immediately for inputs
    onUpdateProfile({
      ...profile,
      basicDetails: updated
    });
  };

  const handleStepChange = (nextStep: number) => {
    if (nextStep < 1 || nextStep > 6) return;

    // Build the final updated checklist dynamically based on answers so far
    let dynamicChecklist = [...profile.checklist];

    // Example dynamic checklist modifications
    if (nextStep === 2) {
      // Step 1 basic verification
      const isStep1Done = !!(basic.name && basic.pan && basic.aadhaar);
      dynamicChecklist = dynamicChecklist.map(item => {
        if (item.category === "Identity") {
          if (item.text.includes("Verify basic details")) return { ...item, completed: isStep1Done };
          if (item.text.includes("Link Aadhaar")) return { ...item, completed: !!basic.aadhaar };
        }
        return item;
      });
    }

    if (nextStep === 5) {
      // Step 4 income source verification
      dynamicChecklist = dynamicChecklist.map(item => {
        if (item.text.includes("Upload Form 16") && !incomeList.includes("Salary")) {
          // If no salary, completed can be true or omitted, let's keep it clean
          return { ...item, completed: true };
        }
        return item;
      });
    }

    onUpdateProfile({
      ...profile,
      step: nextStep,
      basicDetails: basic,
      residentialStatus: resStatus,
      employmentType: empType,
      incomeSources: incomeList,
      taxRegime: regime,
      checklist: dynamicChecklist
    });
  };

  const toggleIncomeSource = (source: string) => {
    let updated: string[];
    if (incomeList.includes(source)) {
      updated = incomeList.filter(s => s !== source);
    } else {
      updated = [...incomeList, source];
    }
    setIncomeList(updated);
    onUpdateProfile({
      ...profile,
      incomeSources: updated
    });
  };

  const handleSelectRegime = (selected: 'Old' | 'New' | 'Not sure') => {
    setRegime(selected);
    onUpdateProfile({
      ...profile,
      taxRegime: selected
    });

    if (selected === 'Not sure') {
      triggerRegimeAdvisor();
    }
  };

  const triggerRegimeAdvisor = async () => {
    setShowAiRegimeAdvisor(true);
    setIsRegimeLoading(true);
    try {
      const res = await fetch("/api/tax-ai/regime-compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incomeData: profile.incomeData,
          profileName: profile.name
        })
      });
      const data = await res.json();
      setRegimeAdvisorText(data.analysis || "Could not analyze at this moment.");
    } catch (err) {
      setRegimeAdvisorText("An error occurred during comparison. Please check your network or API key.");
    } finally {
      setIsRegimeLoading(false);
    }
  };

  // Chat request
  const handleAiChatSubmit = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const queryText = customPrompt || aiMessage;
    if (!queryText.trim()) return;

    setAiMessage('');
    const newHistory = [...aiHistory, { role: 'user', text: queryText }];
    setAiHistory(newHistory);
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/tax-ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: queryText,
          history: aiHistory,
          profileName: profile.name,
          currentStepName: getStepName(activeStep),
          profileData: {
            basicDetails: basic,
            residentialStatus: resStatus,
            employmentType: empType,
            incomeSources: incomeList,
            taxRegime: regime
          }
        })
      });
      const data = await res.json();
      setAiHistory([...newHistory, { role: 'model', text: data.text }]);
    } catch (err) {
      setAiHistory([...newHistory, { role: 'model', text: "Error: AI Tax Guide is temporarily offline. Please check your server API logs or connection details." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const getStepName = (stepNum: number) => {
    switch (stepNum) {
      case 1: return "Basic Details & Identity";
      case 2: return "Residential Status Selection";
      case 3: return "Employment Profile Setup";
      case 4: return "Declare Income Sources";
      case 5: return "Select Tax Regime Slabs";
      default: return "Completed Wizard";
    }
  };

  const getStepDescription = (stepNum: number) => {
    switch (stepNum) {
      case 1: return "Enter legal PAN card, Aadhaar, and identity info to establish secure identity parameters.";
      case 2: return "Indian tax liability rests on physical residency constraints during the previous financial year.";
      case 3: return "Specify standard vocational profile to determine applicable standard deductions.";
      case 4: return "Check all active or passive income avenues you accrued in the past financial year.";
      case 5: return "Choose the filing schedule (Old vs New). AI can compare your financial calculations directly.";
      default: return "";
    }
  };

  // Step specific help questions
  const getQuickHelpQuestions = (stepNum: number) => {
    switch (stepNum) {
      case 1: return [
        "Why does TaxPilot need my PAN?",
        "How is my Aadhaar checked?",
        "Is my tax data secure?"
      ];
      case 2: return [
        "What is the physical day count for Resident?",
        "How does physical stay affect non-resident Indian tax?",
        "What is RNOR status?"
      ];
      case 3: return [
        "What qualifies as Salary versus Business Income?",
        "Am I eligible for a standard ₹50,000 deduction?",
        "How do retired senior citizens declare pensions?"
      ];
      case 4: return [
        "How are savings bank interest taxed?",
        "What is Form 26AS vs AIS?",
        "How do capital gains from mutual funds report?"
      ];
      case 5: return [
        "Which regime (Old vs New) is better?",
        "What deductions do I lose in the New Regime?",
        "Explain standard deductions in New Regime"
      ];
      default: return ["What are next recommended tasks?", "How do I file ITR now?"];
    }
  };

  const incomeSourcesAvailable = [
    { id: 'Salary', label: 'Salaried Income', desc: 'Form 16 provided by employer', group: 'Earned' },
    { id: 'Pension', label: 'Pension Paycheck', desc: 'Retired annuities or senior payout', group: 'Earned' },
    { id: 'Business Income', label: 'Business / Proprietorship', desc: 'Sole owner or professional store', group: 'Business' },
    { id: 'Freelancer', label: 'Freelancer / Gig Work', desc: '1099, contracts, or Section 44ADA', group: 'Business' },
    { id: 'Rental', label: 'House Rental Receipts', desc: 'Let-out property or co-shared rent', group: 'Capital' },
    { id: 'Capital Gains', label: 'Mutual Funds & Stock Capital Gains', desc: 'Broker transaction reports', group: 'Capital' },
    { id: 'Crypto', label: 'Virtual Assets / Crypto', desc: 'Flat 30% flat tax on VDA gains', group: 'Capital' },
    { id: 'Interest', label: 'Bank FD & Savings Interest', desc: 'Interest certificates or ledger passes', group: 'Savings' },
    { id: 'Dividend', label: 'Stock Dividend payouts', desc: 'TDS reported on stock distributions', group: 'Savings' },
    { id: 'Agriculture Income', label: 'Agricultural yield', desc: 'Tax exempt, used for rate integration', group: 'Other' },
    { id: 'Foreign Income', label: 'Offshore deposits/assets', desc: 'Schedule FA required in ITR-2', group: 'Other' },
    { id: 'Other Income', label: 'Other miscellaneous', desc: 'Lottery, gifts, or minor interests', group: 'Other' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Primary Wizard Area (Col Span 2) */}
      <div className="col-span-1 xl:col-span-2 space-y-6">
        
        {/* Progress Bar Steps Tracker */}
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'} flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            <h3 className="font-display font-semibold text-xs uppercase tracking-wider opacity-85">Filing Wizard progress</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <React.Fragment key={stepNum}>
                <button
                  onClick={() => handleStepChange(stepNum)}
                  className={`h-7 w-7 rounded-full text-xs font-mono font-bold flex items-center justify-center transition-all ${
                    activeStep === stepNum
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-110'
                      : activeStep > stepNum
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                        : darkMode ? 'bg-slate-800 text-slate-500 border border-slate-700' : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {activeStep > stepNum ? '✓' : stepNum}
                </button>
                {stepNum < 5 && <div className={`h-0.5 w-4 sm:w-8 rounded ${
                  activeStep > stepNum ? 'bg-emerald-500' : darkMode ? 'bg-slate-800' : 'bg-slate-200'
                }`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Dynamic Step Content Card */}
        <div className={`rounded-2xl p-6 glass-card border flex flex-col space-y-6 min-h-[460px] relative`}>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-400 tracking-widest">Wizard Step {activeStep} of 5</span>
            <h2 className="text-xl font-display font-bold mt-1">{getStepName(activeStep)}</h2>
            <p className="text-xs opacity-60 mt-1">{getStepDescription(activeStep)}</p>
          </div>

          <div className="flex-1">
            {/* Step 1 Content: Basic Details */}
            {activeStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Full Legal Name (as per PAN)</label>
                  <input
                    type="text"
                    value={basic.name}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    placeholder="Enter Name"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Permanent Account Number (PAN)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={basic.pan}
                    onChange={(e) => handleBasicChange('pan', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className={`w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                  <p className="text-[10px] opacity-40 font-mono">10 digit alphanumeric string</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Aadhaar Card Number</label>
                  <input
                    type="text"
                    value={basic.aadhaar}
                    onChange={(e) => handleBasicChange('aadhaar', e.target.value)}
                    placeholder="1234-5678-9012"
                    className={`w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Date of Birth</label>
                  <input
                    type="date"
                    value={basic.dob}
                    onChange={(e) => handleBasicChange('dob', e.target.value)}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Mobile Number</label>
                  <input
                    type="tel"
                    value={basic.mobile}
                    onChange={(e) => handleBasicChange('mobile', e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium opacity-80">Email Address</label>
                  <input
                    type="email"
                    value={basic.email}
                    onChange={(e) => handleBasicChange('email', e.target.value)}
                    placeholder="name@domain.com"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-medium opacity-80">Residential Address</label>
                  <textarea
                    rows={2}
                    value={basic.address}
                    onChange={(e) => handleBasicChange('address', e.target.value)}
                    placeholder="House details, block, street, pin, state..."
                    className={`w-full text-xs px-3.5 py-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Step 2 Content: Residential Status */}
            {activeStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                {[
                  { id: 'Resident', name: 'Resident Individual', desc: 'Stayed in India for 182 days or more during the financial year, or 365 days in previous 4 years plus 60 days in current year.' },
                  { id: 'Non-Resident', name: 'Non-Resident (NRI)', desc: 'Stayed in India for less than 182 days and less than 60 days during the financial year.' },
                  { id: 'RNOR', name: 'Resident but Not Ordinarily Resident', desc: 'Returned to India recently; non-resident in 9 out of 10 preceding years, or stays match specific RNOR statutory constraints.' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setResStatus(item.id as ResidentialStatus);
                      onUpdateProfile({ ...profile, residentialStatus: item.id as ResidentialStatus });
                    }}
                    className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer h-52 hover:border-indigo-500/50 ${
                      resStatus === item.id
                        ? 'border-indigo-600 bg-indigo-500/5 text-white ring-1 ring-indigo-500'
                        : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-100">{item.name}</h4>
                      <p className="text-[11px] opacity-70 leading-normal">{item.desc}</p>
                    </div>
                    {resStatus === item.id && (
                      <span className="text-xs text-indigo-400 font-bold flex items-center gap-1.5 mt-2">
                        ✓ Selected Status
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 Content: Employment Status */}
            {activeStep === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 py-4">
                {[
                  { id: 'Salary', name: 'Salaried Employee', desc: 'Received monthly paycheck and Form 16 from employer' },
                  { id: 'Freelancer', name: 'Freelancer / Contractor', desc: 'Provides skilled gig services, consultancies under Section 44ADA' },
                  { id: 'Business', name: 'Business Owner', desc: 'Sole proprietorship, merchants, or commercial trading' },
                  { id: 'Retired', name: 'Retired / Senior', desc: 'Received pension funds or interest distributions' },
                  { id: 'Student', name: 'Student Individual', desc: 'Receiving minor stipends or dividends only' },
                  { id: 'Other', name: 'Other vocational', desc: 'Agriculture, rent holders, or family trusts' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setEmpType(item.id as EmploymentType);
                      onUpdateProfile({ ...profile, employmentType: item.id as EmploymentType });
                    }}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-40 transition-all cursor-pointer hover:border-indigo-500/50 ${
                      empType === item.id
                        ? 'border-indigo-600 bg-indigo-500/5 text-white'
                        : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-100">{item.name}</h4>
                      <p className="text-[10px] opacity-65 leading-normal">{item.desc}</p>
                    </div>
                    {empType === item.id && (
                      <span className="text-[10px] text-indigo-400 font-bold">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Step 4 Content: Income Sources Multi Selector */}
            {activeStep === 4 && (
              <div className="space-y-4">
                <p className="text-xs opacity-65">Check all categories that apply to compile the tax computation matrix properly:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {incomeSourcesAvailable.map((source) => {
                    const isChecked = incomeList.includes(source.id);
                    return (
                      <button
                        key={source.id}
                        onClick={() => toggleIncomeSource(source.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex gap-3 cursor-pointer hover:border-indigo-500/50 ${
                          isChecked
                            ? 'border-indigo-600 bg-indigo-500/5'
                            : darkMode ? 'bg-slate-900/40 border-slate-800/60' : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className={`h-4.5 w-4.5 rounded border mt-0.5 flex items-center justify-center transition-all ${
                          isChecked 
                            ? 'bg-indigo-600 border-indigo-500 text-white' 
                            : 'border-slate-700'
                        }`}>
                          {isChecked && <CheckCircle className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-200 truncate leading-snug">{source.label}</p>
                          <p className="text-[10px] opacity-50 mt-0.5 leading-normal">{source.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5 Content: Tax Regime Selection */}
            {activeStep === 5 && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'Old', name: 'Old Tax Regime Slabs', desc: 'Slightly higher slab rates, but lets you deduct HRA, 80C investments, 80D medical bills, home loan interest (24b).' },
                    { id: 'New', name: 'New Tax Regime (Default)', desc: 'Substantially lower slabs (exemption up to ₹7 Lakhs). Flat and simplified, but almost no deductions allowed.' },
                    { id: 'Not sure', name: 'Not Sure - Let AI Advise', desc: 'Analyze your current registered details. AI computes standard deductions vs regime levels.' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectRegime(item.id as 'Old' | 'New' | 'Not sure')}
                      className={`p-5 rounded-2xl border text-left flex flex-col justify-between h-52 transition-all cursor-pointer hover:border-indigo-500/50 ${
                        regime === item.id
                          ? 'border-indigo-600 bg-indigo-500/5 text-white ring-1 ring-indigo-500'
                          : darkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-slate-100">{item.name}</h4>
                        <p className="text-[11px] opacity-70 leading-normal">{item.desc}</p>
                      </div>
                      {regime === item.id && (
                        <span className="text-xs text-indigo-400 font-bold mt-2">✓ Selected Choice</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Inline advisor report area */}
                {showAiRegimeAdvisor && (
                  <div className={`p-4 rounded-xl border border-indigo-500/10 bg-indigo-950/10 space-y-2 relative transition-all`}>
                    <button 
                      onClick={() => setShowAiRegimeAdvisor(false)}
                      className="absolute top-3 right-3 text-slate-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-400">AI Regime Advisor Analysis</h4>
                    </div>
                    {isRegimeLoading ? (
                      <div className="flex items-center gap-3 py-6 text-xs text-slate-400">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        <span>TaxPilot AI is computing dynamic Old vs New rates using slab ratios...</span>
                      </div>
                    ) : (
                      <div className="text-xs leading-relaxed max-h-56 overflow-y-auto font-mono text-slate-300 whitespace-pre-line p-2 border border-slate-800/40 rounded bg-slate-950/40">
                        {regimeAdvisorText}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="border-t border-slate-800/50 pt-4 flex justify-between items-center mt-6">
            <button
              disabled={activeStep === 1}
              onClick={() => handleStepChange(activeStep - 1)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 border transition-all ${
                activeStep === 1
                  ? 'opacity-40 cursor-not-allowed border-slate-800 text-slate-600'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <ArrowLeft className="h-4.5 w-4.5" /> Previous Step
            </button>

            {activeStep < 5 ? (
              <button
                onClick={() => handleStepChange(activeStep + 1)}
                className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-500/10 transition-all"
              >
                Save & Continue <ArrowRight className="h-4.5 w-4.5" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-500 font-mono flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" /> Ready to Review
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive AI Companion Sidebar (Col Span 1) */}
      <div className={`rounded-2xl border p-5 flex flex-col h-[550px] ${
        darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/50">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="font-display font-bold text-sm text-slate-200">Need Help?</h3>
              <p className="text-[10px] text-indigo-400 font-mono">Step Assistant Context</p>
            </div>
          </div>
          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
        </div>

        {/* Chat Conversation Stream */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs mb-4">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/40 text-[11px] leading-relaxed">
            Hi, {profile.name}! I am tuned to your step <span className="font-semibold text-indigo-400">"{getStepName(activeStep)}"</span>. 
            Ask me any doubt about physical staying limits, PAN issues, HRA deductions, etc.
          </div>

          {aiHistory.map((msg, idx) => (
            <div 
              key={idx}
              className={`flex flex-col max-w-[85%] ${
                msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
              }`}
            >
              <div className={`p-3 rounded-xl leading-relaxed text-[11px] whitespace-pre-line ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-slate-800/70 border border-slate-700/30 text-slate-200 rounded-bl-none'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}

          {isAiLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-[10px] italic">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce [animation-delay:0.2s]">●</span>
              <span className="animate-bounce [animation-delay:0.4s]">●</span>
              <span>TaxPilot AI consulting Indian Tax rules...</span>
            </div>
          )}
        </div>

        {/* Quick Help Suggestion Buttons */}
        <div className="space-y-1.5 mb-3.5">
          <p className="text-[10px] font-mono opacity-50 uppercase tracking-wider">Suggested Questions</p>
          <div className="flex flex-wrap gap-1.5">
            {getQuickHelpQuestions(activeStep).map((question, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleAiChatSubmit(undefined, question)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/30 text-indigo-400 hover:border-indigo-500/30 text-left hover:bg-slate-800/40 transition-all cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat input box */}
        <form onSubmit={handleAiChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={aiMessage}
            onChange={(e) => setAiMessage(e.target.value)}
            placeholder="Type tax query..."
            className={`flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center justify-center shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
