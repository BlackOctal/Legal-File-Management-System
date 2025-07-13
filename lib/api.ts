// API configuration and mock data management
// This file handles all data operations for the frontend-only application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'admin' | 'super_admin';
}

export interface Case {
  id: string;
  referenceNumber: string;
  fileNumber: string;
  caseNumber: string;
  title: string;
  clientNames: string[];
  category: string;
  subcategory: string;
  status: 'Active' | 'Pending' | 'Closed';
  priority: 'High' | 'Medium' | 'Low';
  description: string;
  createdDate: string;
  lastUpdated: string;
  assignedLawyer: string;
  nextHearingDate?: string;
  lastHearingDate?: string;
  courtName?: string;
  judgeAssigned?: string;
}

export interface Hearing {
  id: string;
  caseId: string;
  date: string;
  time: string;
  type: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Postponed';
  judge: string;
  courtroom: string;
  outcome?: string;
  notes?: string;
}

export interface Document {
  id: string;
  caseId: string;
  name: string;
  type: string;
  uploadDate: string;
  uploadedBy: string;
  size: string;
  status: 'Approved' | 'Pending Review' | 'In Review' | 'Required' | 'Rejected';
  hearingDate?: string;
}

export interface Note {
  id: string;
  caseId: string;
  content: string;
  author: string;
  date: string;
  time: string;
  type: string;
  tags: string[];
}

// Mock data storage
const STORAGE_KEYS = {
  CASES: 'law_cases',
  HEARINGS: 'law_hearings',
  DOCUMENTS: 'law_documents',
  NOTES: 'law_notes',
  USERS: 'law_users'
};

// Helper functions for localStorage operations
export const storage = {
  get: (key: string) => {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    }
    return [];
  },
  
  set: (key: string, data: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  },
  
  add: (key: string, item: any) => {
    const items = storage.get(key);
    items.push(item);
    storage.set(key, items);
    return item;
  },
  
  update: (key: string, id: string, updates: any) => {
    const items = storage.get(key);
    const index = items.findIndex((item: any) => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      storage.set(key, items);
      return items[index];
    }
    return null;
  },
  
  delete: (key: string, id: string) => {
    const items = storage.get(key);
    const filtered = items.filter((item: any) => item.id !== id);
    storage.set(key, filtered);
    return true;
  }
};

// API functions
export const api = {
  // Case operations
  cases: {
    getAll: (): Case[] => storage.get(STORAGE_KEYS.CASES),
    getById: (id: string): Case | null => {
      const cases = storage.get(STORAGE_KEYS.CASES);
      return cases.find((c: Case) => c.id === id) || null;
    },
    create: (caseData: Omit<Case, 'id' | 'createdDate' | 'lastUpdated'>): Case => {
      const newCase: Case = {
        ...caseData,
        id: Date.now().toString(),
        createdDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        referenceNumber: `LC-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
        fileNumber: `F-${String(Date.now()).slice(-3)}-${new Date().getFullYear()}`,
        caseNumber: `C-${String(new Date().getFullYear()).slice(-2)}-${String(Date.now()).slice(-3)}`
      };
      return storage.add(STORAGE_KEYS.CASES, newCase);
    },
    update: (id: string, updates: Partial<Case>): Case | null => {
      return storage.update(STORAGE_KEYS.CASES, id, {
        ...updates,
        lastUpdated: new Date().toISOString().split('T')[0]
      });
    },
    delete: (id: string): boolean => storage.delete(STORAGE_KEYS.CASES, id)
  },

  // Hearing operations
  hearings: {
    getByCaseId: (caseId: string): Hearing[] => {
      const hearings = storage.get(STORAGE_KEYS.HEARINGS);
      return hearings.filter((h: Hearing) => h.caseId === caseId);
    },
    create: (hearingData: Omit<Hearing, 'id'>): Hearing => {
      const newHearing: Hearing = {
        ...hearingData,
        id: Date.now().toString()
      };
      return storage.add(STORAGE_KEYS.HEARINGS, newHearing);
    },
    update: (id: string, updates: Partial<Hearing>): Hearing | null => {
      return storage.update(STORAGE_KEYS.HEARINGS, id, updates);
    },
    delete: (id: string): boolean => storage.delete(STORAGE_KEYS.HEARINGS, id)
  },

  // Document operations
  documents: {
    getByCaseId: (caseId: string): Document[] => {
      const documents = storage.get(STORAGE_KEYS.DOCUMENTS);
      return documents.filter((d: Document) => d.caseId === caseId);
    },
    create: (docData: Omit<Document, 'id' | 'uploadDate'>): Document => {
      const newDoc: Document = {
        ...docData,
        id: Date.now().toString(),
        uploadDate: new Date().toISOString().split('T')[0]
      };
      return storage.add(STORAGE_KEYS.DOCUMENTS, newDoc);
    },
    delete: (id: string): boolean => storage.delete(STORAGE_KEYS.DOCUMENTS, id)
  },

  // Note operations
  notes: {
    getByCaseId: (caseId: string): Note[] => {
      const notes = storage.get(STORAGE_KEYS.NOTES);
      return notes.filter((n: Note) => n.caseId === caseId);
    },
    create: (noteData: Omit<Note, 'id' | 'date' | 'time'>): Note => {
      const now = new Date();
      const newNote: Note = {
        ...noteData,
        id: Date.now().toString(),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        })
      };
      return storage.add(STORAGE_KEYS.NOTES, newNote);
    },
    update: (id: string, updates: Partial<Note>): Note | null => {
      return storage.update(STORAGE_KEYS.NOTES, id, updates);
    },
    delete: (id: string): boolean => storage.delete(STORAGE_KEYS.NOTES, id)
  }
};

// Initialize with sample data if storage is empty
export const initializeSampleData = () => {
  if (storage.get(STORAGE_KEYS.CASES).length === 0) {
    const sampleCases: Case[] = [
      {
        id: '1',
        referenceNumber: 'LC-2024-001',
        fileNumber: 'F-001-2024',
        caseNumber: 'C-24-001',
        title: 'Loan Settlement Dispute',
        clientNames: ['Johnson & Associates', 'ABC Corporation'],
        category: 'Financial',
        subcategory: 'Loan Settlement',
        status: 'Active',
        priority: 'High',
        description: 'Complex loan settlement case involving multiple parties and significant financial exposure.',
        createdDate: '2024-01-15',
        lastUpdated: '2024-12-15',
        assignedLawyer: 'Sarah Johnson',
        nextHearingDate: '2024-12-28',
        lastHearingDate: '2024-11-15',
        courtName: 'District Court Central',
        judgeAssigned: 'Hon. Michael Roberts'
      }
    ];
    storage.set(STORAGE_KEYS.CASES, sampleCases);
  }
};