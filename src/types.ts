/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BasicDetails {
  name: string;
  pan: string;
  aadhaar: string;
  dob: string;
  mobile: string;
  email: string;
  address: string;
}

export type ResidentialStatus = 'Resident' | 'Non-Resident' | 'RNOR' | '';

export type EmploymentType = 'Salary' | 'Business' | 'Freelancer' | 'Retired' | 'Student' | 'Other' | '';

export type FilingStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Waiting for Documents'
  | 'Ready to File'
  | 'Filed'
  | 'E-Verified'
  | 'Completed';

export interface TaxDocument {
  id: string;
  name: string;
  category: string; // PAN, Aadhaar, Form 16, AIS, Form 26AS, Salary Slips, etc.
  status: 'Uploaded' | 'Missing' | 'Needs Review' | 'Expired';
  uploadDate?: string;
  fileSize?: string;
  fileType?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: string; // e.g. "Identity", "Deductions", "Income Verification", "Filing"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  contextStep?: string;
}

export interface QueryItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  timestamp: string;
  bookmarked: boolean;
}

export interface TaxTask {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TaxNotification {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
}

export interface IncomeData {
  salary: number;
  rental: number;
  business: number;
  interest: number;
  other: number;
  deductions80c: number;
  deductions80d: number;
  otherDeductions: number;
}

export interface AIRecommendation {
  id: string;
  type: 'deduction' | 'warning' | 'missing_proof' | 'opportunity';
  title: string;
  description: string;
  impactValue?: string;
  status: 'pending' | 'applied' | 'dismissed';
}

export interface TaxpayerProfile {
  id: string;
  name: string;
  relation: string; // "Myself", "Father", "Mother", "Wife", "Brother", "Client 1", etc.
  filingStatus: FilingStatus;
  avatarColor: string; // Hex or tailwind color class
  step: number; // 1-5 for wizard steps, 6 for Tax Summary/Final Review
  basicDetails: BasicDetails;
  residentialStatus: ResidentialStatus;
  employmentType: EmploymentType;
  incomeSources: string[]; // List of selected income sources
  taxRegime: 'Old' | 'New' | 'Not sure' | '';
  checklist: ChecklistItem[];
  documents: TaxDocument[];
  aiChats: ChatMessage[];
  queries: QueryItem[];
  tasks: TaxTask[];
  notifications: TaxNotification[];
  notes: string;
  incomeData: IncomeData;
  recommendations: AIRecommendation[];
}
