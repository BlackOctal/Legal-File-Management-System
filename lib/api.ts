// lib/api.ts - Consolidated and enhanced API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// API utility functions
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`Making API call to: ${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${API_BASE_URL}${endpoint}:`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    
    if (response.success && response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  register: async (userData: any) => {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

// Cases API
export const casesAPI = {
  getAll: async (params?: URLSearchParams) => {
    const queryString = params ? `?${params.toString()}` : '';
    return await apiRequest(`/cases${queryString}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/cases/${id}`);
  },

  create: async (caseData: any) => {
    return await apiRequest('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/cases/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return await apiRequest('/cases/stats/overview');
  }
};

// Hearings API
export const hearingsAPI = {
  getByCaseId: async (caseId: string) => {
    return await apiRequest(`/hearings/case/${caseId}`);
  },

  create: async (caseId: string, hearingData: any) => {
    return await apiRequest(`/hearings/case/${caseId}`, {
      method: 'POST',
      body: JSON.stringify(hearingData),
    });
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/hearings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/hearings/${id}`, {
      method: 'DELETE',
    });
  }
};

// Documents API
export const documentsAPI = {
  getByCaseId: async (caseId: string) => {
    return await apiRequest(`/documents/case/${caseId}`);
  },

  upload: async (caseId: string, formData: FormData) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/documents/case/${caseId}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    return await response.json();
  },

  delete: async (id: string) => {
    return await apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  },

  download: async (id: string) => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/documents/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    return response.blob();
  }
};

// Notes API
export const notesAPI = {
  getByCaseId: async (caseId: string) => {
    return await apiRequest(`/notes/case/${caseId}`);
  },

  create: async (caseId: string, noteData: any) => {
    return await apiRequest(`/notes/case/${caseId}`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/notes/${id}`, {
      method: 'DELETE',
    });
  }
};

// Categories API (NEW)
export const categoriesAPI = {
  getAll: async () => {
    return await apiRequest('/categories');
  },

  create: async (categoryData: any) => {
    return await apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Subcategories
  createSubcategory: async (categoryId: string, subcategoryData: any) => {
    return await apiRequest(`/categories/${categoryId}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(subcategoryData),
    });
  },

  updateSubcategory: async (categoryId: string, subcategoryId: string, updates: any) => {
    return await apiRequest(`/categories/${categoryId}/subcategories/${subcategoryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  deleteSubcategory: async (categoryId: string, subcategoryId: string) => {
    return await apiRequest(`/categories/${categoryId}/subcategories/${subcategoryId}`, {
      method: 'DELETE',
    });
  }
};

// Dashboard API
export const dashboardAPI = {
  getOverview: async () => {
    return await apiRequest('/dashboard/overview');
  },

  getUpcomingHearings: async (days: number = 14) => {
    return await apiRequest(`/dashboard/upcoming-hearings?days=${days}`);
  },

  getInactiveCases: async () => {
    return await apiRequest('/dashboard/inactive-cases');
  }
};

export { apiRequest };