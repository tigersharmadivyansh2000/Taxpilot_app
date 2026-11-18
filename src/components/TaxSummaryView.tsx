/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Coins, CheckCircle, Clock, AlertTriangle, Calculator, Sparkles, Sliders, ArrowRight } from 'lucide-react';
import { TaxpayerProfile, IncomeData } from '../types';

interface TaxSummaryViewProps {
  profile: TaxpayerProfile;
  darkMode: boolean;
  onUpdateProfile: (updated: TaxpayerProfile) => void;
  onAddNotification: (text: string, type: 'info' | 'warning' | 'success' | 'error') => void;
}

export default function TaxSummaryView({
  profile,
  darkMode,
  onUpdateProfile,
  onAddNotification,
}: TaxSummaryViewProps) {
  // Calculator inputs backed by profile's incomeData
  const [salary, setSalary] = useState(profile.incomeData.salary);
  const [rental, setRental] = useState(profile.incomeData.rental);
  const [interest, setInterest] = useState(profile.incomeData.interest);
  const [other, setOther] = useState(profile.incomeData.other);
  const [ded80c, setDed80c] = useState(profile.incomeData.deductions80c);
  const [ded80d, setDed80d] = useState(profile.incomeData.deductions80d);
  const [otherDed, setOtherDed] = useState(profile.incomeData.otherDeductions);

  // Sync inputs if active taxpayer shifts
  useEffect(() => {
    setSalary(profile.incomeData.salary);
    setRental(profile.incomeData.rental);
    setInterest(profile.incomeData.interest);
    setOther(profile.incomeData.other);
    setDed80c(profile.incomeData.deductions80c);
    setDed80d(profile.incomeData.deductions80d);
    setOtherDed(profile.incomeData.otherDeductions);
  }, [profile.id]);

  // Handle calculator saves to profile state (autosaves)
  const saveIncomeChanges = (updated: Partial<IncomeData>) => {
    const freshData = {
      ...profile.incomeData,
      ...updated
    };

    onUpdateProfile({
      ...profile,
      incomeData: freshData
    });
  };

  // Indian Tax Slab Calculations (FY 2025-26 Slabs)
  const calculateOldRegimeTax = (gross: number, deductions: number): number => {
    // Standard deduction of 50,000 for salaried/pensioners is part of deductions
    const taxable = Math.max(0, gross - deductions);
    if (taxable <= 250000) return 0;
    
    let tax = 0;
    if (taxable <= 500000) {
      tax = (taxable - 250000) * 0.05;
    } else if (taxable <= 1000000) {
      tax = 12500 + (taxable - 500000) * 0.20;
    } else {
      tax = 12500 + 100000 + (taxable - 1000000) * 0.30;
    }

    // Tax rebate under Section 87A (income <= 5 Lakhs is tax-free)
    if (taxable <= 500000) tax = 0;

    // Health & Education Cess at 4%
    return Math.round(tax * 1.04);
  };

  const calculateNewRegimeTax = (gross: number, isSalariedOrPensioner: boolean): number => {
    // Standard deduction of 50,000 in New Regime for salaried/pensioners
    const stdDed = isSalariedOrPensioner ? 50000 : 0;
    const taxable = Math.max(0, gross - stdDed);
    
    // FY 2025-26 New Regime slabs:
    // Up to 3,00,000: Nil
    // 3,00,001 to 7,00,000: 5%
    // 7,00,001 to 10,00,000: 10%
    // 10,00,001 to 12,00,000: 15%
    // 12,00,001 to 15,00,000: 20%
    // Above 15,00,000: 30%
    
    if (taxable <= 300000) return 0;
    
    let tax = 0;
    if (taxable <= 700000) {
      tax = (taxable - 300000) * 0.05;
    } else if (taxable <= 1000000) {
      tax = 20000 + (taxable - 700000) * 0.10;
    } else if (taxable <= 1200000) {
      tax = 20000 + 30000 + (taxable - 1000000) * 0.15;
    } else if (taxable <= 1500000) {
      tax = 20000 + 30000 + 30000 + (taxable - 1200000) * 0.20;
    } else {
      tax = 20000 + 30000 + 30000 + 60000 + (taxable - 1500000) * 0.30;
    }

    // Section 87A rebate for New Regime (taxable income up to ₹7,00,000 has zero tax)
    if (taxable <= 700000) tax = 0;

    return Math.round(tax * 1.04);
  };

  // Deductibles summing
  const totalGross = salary + rental + interest + other;
  
  // Standard Deduction Eligibility
  const isSalaried = profile.employmentType === 'Salary' || profile.employmentType === 'Retired';
  const stdDedValue = isSalaried ? 50000 : 0;
  
  // Old Regime Deductions cap check (80C is capped at 1.5L, 80D at 25K/50K)
  const cap80c = Math.min(150000, ded80c);
  const cap80d = profile.employmentType === 'Retired' ? Math.min(50000, ded80d) : Math.min(25000, ded80d);
  const totalOldDeductions = stdDedValue + cap80c + cap80d + otherDed;

  // Final Calculations
  const oldRegimeTax = calculateOldRegimeTax(totalGross, totalOldDeductions);
  const newRegimeTax = calculateNewRegimeTax(totalGross, isSalaried);

  const selectedTax = profile.taxRegime === 'Old' ? oldRegimeTax : newRegimeTax;
  
  // Estimate refund or due
  const mockTdsDeducted = Math.round(selectedTax * 0.85); // Simulation check
  const taxDue = Math.max(0, selectedTax - mockTdsDeducted);
  const taxRefund = Math.max(0, mockTdsDeducted - selectedTax);

  // Missing documents details
  const missingDocs = profile.documents.filter(d => d.status === 'Missing');
  const pendingTasks = profile.checklist.filter(item => !item.completed);

  // Readiness evaluation
  const getReadinessRating = () => {
    if (missingDocs.length === 0 && pendingTasks.length === 0) return { label: "100% - Ready to File", color: "text-emerald-500" };
    if (missingDocs.length > 1) return { label: "45% - Documents Pending", color: "text-amber-500" };
    return { label: "80% - Nearing Completion", color: "text-indigo-400" };
  };

  const readiness = getReadinessRating();

  const handleUpdateStatus = (newStatus: any) => {
    onUpdateProfile({
      ...profile,
      filingStatus: newStatus
    });
    onAddNotification(`Filing status updated to ${newStatus} for ${profile.name}`, 'success');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold tracking-tight">Tax summary Worksheet</h2>
          <p className="text-sm opacity-60">
            Compute actual liabilities, compare schedules, and update filing milestones for <span className="text-indigo-500 font-semibold">{profile.name}</span>
          </p>
        </div>

        {/* Manual filing status update dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold opacity-60">Filing Status:</span>
          <select
            value={profile.filingStatus}
            onChange={(e) => handleUpdateStatus(e.target.value as any)}
            className={`text-xs font-semibold py-2 px-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
            }`}
          >
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Documents">Waiting for Documents</option>
            <option value="Ready to File">Ready to File</option>
            <option value="Filed">Filed</option>
            <option value="E-Verified">E-Verified</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Tax Calculator Inputs Card (Col Span 1) */}
        <div className={`p-5 rounded-2xl border flex flex-col h-fit space-y-4 ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <h3 className="font-display font-bold text-sm text-slate-200 flex items-center gap-2">
            <Sliders className="h-4.5 w-4.5 text-indigo-400" />
            Parameter Adjuster
          </h3>
          
          <p className="text-[10px] opacity-50 font-mono uppercase tracking-wider">Dynamic tax simulator</p>

          <div className="space-y-3.5 pr-1 max-h-[350px] overflow-y-auto">
            {/* Salary */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">Salaried Gross Income</span>
                <span className="font-mono font-bold">₹{salary.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={3000000} 
                step={25000}
                value={salary} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSalary(val);
                  saveIncomeChanges({ salary: val });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Rent Income */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">House Rental Income</span>
                <span className="font-mono font-bold">₹{rental.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={1000000} 
                step={10000}
                value={rental} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRental(val);
                  saveIncomeChanges({ rental: val });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Interest Income */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">Interest Income (Bank/FD)</span>
                <span className="font-mono font-bold">₹{interest.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={500000} 
                step={5000}
                value={interest} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setInterest(val);
                  saveIncomeChanges({ interest: val });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Deductions 80C */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">Section 80C Investment</span>
                <span className="font-mono font-bold text-emerald-400">₹{ded80c.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={250000} 
                step={5000}
                value={ded80c} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDed80c(val);
                  saveIncomeChanges({ deductions80c: val });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>

            {/* Deductions 80D */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="opacity-70">Section 80D (Health Insurance)</span>
                <span className="font-mono font-bold text-emerald-400">₹{ded80d.toLocaleString()}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={100000} 
                step={2000}
                value={ded80d} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDed80d(val);
                  saveIncomeChanges({ deductions80d: val });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Side by side Regime calculation card (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50'
            }`}>
              <span className="text-[10px] opacity-55 font-mono uppercase">Total Gross Income</span>
              <span className="text-xl font-display font-bold font-mono">₹{totalGross.toLocaleString()}</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50'
            }`}>
              <span className="text-[10px] opacity-55 font-mono uppercase">Readiness Assessment</span>
              <span className={`text-xs font-semibold ${readiness.color}`}>{readiness.label}</span>
            </div>
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${
              darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50'
            }`}>
              <span className="text-[10px] opacity-55 font-mono uppercase">Active Selected Regime</span>
              <span className="text-xs font-semibold font-mono text-indigo-400">
                {profile.taxRegime === 'Not sure' ? 'None selected (Advisor recommended)' : `${profile.taxRegime} Regime`}
              </span>
            </div>
          </div>

          {/* Slabs Side-by-Side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Old Regime Card */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between h-64 relative ${
              profile.taxRegime === 'Old' 
                ? 'border-indigo-600 bg-indigo-950/5' 
                : 'bg-slate-900/30 border-slate-900/60 opacity-80'
            }`}>
              {profile.taxRegime === 'Old' && (
                <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Filing Choice
                </span>
              )}
              
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-indigo-400" />
                  Old Tax Regime Calculation
                </h4>
                
                <div className="divide-y divide-slate-800/50 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between py-1 opacity-70">
                    <span>Gross Income</span>
                    <span>₹{totalGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400">
                    <span>Standard Ded. eligibility</span>
                    <span>- ₹{stdDedValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400">
                    <span>Eligible Deducts (80C+80D)</span>
                    <span>- ₹{(cap80c + cap80d).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 opacity-70">
                    <span>Taxable Net</span>
                    <span>₹{Math.max(0, totalGross - totalOldDeductions).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-slate-800/40">
                <span className="text-xs opacity-60">Estimated Tax Cess Included</span>
                <span className="text-2xl font-display font-extrabold font-mono text-indigo-400">
                  ₹{oldRegimeTax.toLocaleString()}
                </span>
              </div>
            </div>

            {/* New Regime Card */}
            <div className={`p-5 rounded-2xl border flex flex-col justify-between h-64 relative ${
              profile.taxRegime === 'New' 
                ? 'border-indigo-600 bg-indigo-950/5' 
                : 'bg-slate-900/30 border-slate-900/60 opacity-80'
            }`}>
              {profile.taxRegime === 'New' && (
                <span className="absolute top-4 right-4 text-[9px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  Filing Choice
                </span>
              )}

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                  New Tax Regime (FY 2025-26)
                </h4>

                <div className="divide-y divide-slate-800/50 space-y-1.5 text-[11px] font-mono">
                  <div className="flex justify-between py-1 opacity-70">
                    <span>Gross Income</span>
                    <span>₹{totalGross.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 text-emerald-400">
                    <span>Standard Ded. (Flat)</span>
                    <span>- ₹{stdDedValue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 opacity-50">
                    <span>Exemptions (80C/80D/etc)</span>
                    <span>Not Eligible</span>
                  </div>
                  <div className="flex justify-between py-1 opacity-70">
                    <span>Taxable Net</span>
                    <span>₹{Math.max(0, totalGross - stdDedValue).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline justify-between pt-3 border-t border-slate-800/40">
                <span className="text-xs opacity-60">Estimated Tax Cess Included</span>
                <span className="text-2xl font-display font-extrabold font-mono text-indigo-400">
                  ₹{newRegimeTax.toLocaleString()}
                </span>
              </div>
            </div>

          </div>

          {/* Warnings & Next checklist details */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs ${
            missingDocs.length > 0 
              ? 'border-amber-500/10 bg-amber-950/5' 
              : 'border-emerald-500/10 bg-emerald-950/5'
          }`}>
            {missingDocs.length > 0 ? (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Pending Documentation Block</p>
                  <p className="opacity-70 leading-relaxed text-[11px]">
                    You cannot safely file return details right now because you have {missingDocs.length} pending documents ({missingDocs.map(d => d.category).join(', ')}). 
                    Ensure these are uploaded to prevent automated department mismatches or notifications.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-200">Filing Readiness Cleared</p>
                  <p className="opacity-70 leading-relaxed text-[11px]">
                    All key document upload categories are fulfilled for {profile.name}! You are ready to review calculations and file your Income Tax Return.
                  </p>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
