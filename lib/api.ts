// API configuration for backend integration
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
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
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
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }
};

// Cases API
export const casesAPI = {
  getAll: async (filters: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    return await apiRequest(`/cases?${queryParams.toString()}`);
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

  getByCategory: async (category: string, subcategory?: string) => {
    const queryParams = new URLSearchParams();
    if (subcategory) queryParams.append('subcategory', subcategory);
    
    return await apiRequest(`/cases/category/${category}?${queryParams.toString()}`);
  },

  getStats: async () => {
    return await apiRequest('/cases/stats/overview');
  }
};

// Hearings API
export const hearingsAPI = {
  getByCaseId: async (caseId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    return await apiRequest(`/hearings/case/${caseId}?${queryParams.toString()}`);
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
  },

  getUpcoming: async (days: number = 14) => {
    return await apiRequest(`/hearings/upcoming?days=${days}`);
  }
};

// Documents API
export const documentsAPI = {
  getByCaseId: async (caseId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    return await apiRequest(`/documents/case/${caseId}?${queryParams.toString()}`);
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

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }

    return data;
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
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/documents/${id}`, {
      method: 'DELETE',
    });
  }
};

// Notes API
export const notesAPI = {
  getByCaseId: async (caseId: string, filters: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    return await apiRequest(`/notes/case/${caseId}?${queryParams.toString()}`);
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
  },

  getRecentActivity: async (days: number = 7) => {
    return await apiRequest(`/dashboard/recent-activity?days=${days}`);
  }
};

// Users API
export const usersAPI = {
  getAll: async (filters: any = {}) => {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    return await apiRequest(`/users?${queryParams.toString()}`);
  },

  getById: async (id: string) => {
    return await apiRequest(`/users/${id}`);
  },

  update: async (id: string, updates: any) => {
    return await apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  delete: async (id: string) => {
    return await apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};

// Export utility function
export { apiRequest };