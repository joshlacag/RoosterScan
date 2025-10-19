import { 
  Rooster, 
  Scan, 
  HealthReport, 
  CreateReportRequest, 
  EducationalContent, 
  EducationFilters, 
  UserProgress,
  ApiError,
  ApiResponse,
  CreateRoosterRequest,
  UpdateRoosterRequest,
  CreateScanRequest,
  AuthResponse
} from "../../shared/api";
import { getSession } from "./auth";

const API_BASE = "/api";

class ApiClient {
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const session = await getSession();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add Supabase JWT token if user is authenticated
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
  }

  // Rooster methods
  async getRoosters(): Promise<Rooster[]> {
    return this.request<Rooster[]>("/roosters");
  }

  async createRooster(data: CreateRoosterRequest): Promise<Rooster> {
    return this.request<Rooster>("/roosters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateRooster(id: string, data: UpdateRoosterRequest): Promise<Rooster> {
    return this.request<Rooster>(`/roosters/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteRooster(id: string): Promise<{ deleted: true }> {
    return this.request<{ deleted: true }>(`/roosters/${id}`, {
      method: "DELETE",
    });
  }

  // Scan methods
  async getScans(): Promise<Scan[]> {
    return this.request<Scan[]>("/scans");
  }

  async getScan(id: string): Promise<Scan> {
    return this.request<Scan>(`/scans/${id}`);
  }

  async createScan(data: CreateScanRequest): Promise<Scan> {
    return this.request<Scan>("/scans", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Report methods
  async getReports(): Promise<HealthReport[]> {
    return this.request<HealthReport[]>("/reports");
  }

  async createReport(data: CreateReportRequest): Promise<HealthReport> {
    return this.request<HealthReport>("/reports", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Auth methods
  async getSession(): Promise<AuthResponse> {
    const response = await this.request('/auth/session');
    return response as AuthResponse;
  }

  // Upload image
  async uploadImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer dev-token`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const result = await response.json();
    return result.data;
  }

  // Educational Content API methods
  async getEducationalContent(filters?: EducationFilters): Promise<EducationalContent[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.search) params.append('search', filters.search);

    const session = await getSession();
    const response = await fetch(`${API_BASE}/education?${params}`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ''}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch educational content');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getEducationalContentById(id: string): Promise<EducationalContent> {
    const session = await getSession();
    const response = await fetch(`${API_BASE}/education/${id}`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ''}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch educational content');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getEducationCategories(): Promise<string[]> {
    const session = await getSession();
    const response = await fetch(`${API_BASE}/education/categories`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ''}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const result = await response.json();
    return result.data;
  }

  async updateUserProgress(contentId: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    const session = await getSession();
    const response = await fetch(`${API_BASE}/education/${contentId}/progress`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token || ''}`
      },
      body: JSON.stringify(progress),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update progress');
    }
    
    const result = await response.json();
    return result.data;
  }

  async getUserProgress(): Promise<UserProgress[]> {
    const session = await getSession();
    const response = await fetch(`${API_BASE}/education/user/progress`, {
      headers: {
        "Authorization": `Bearer ${session?.access_token || ''}`
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user progress');
    }
    
    const result = await response.json();
    return result.data;
  }
}

export const api = new ApiClient();
export const apiClient = api; // Alias for backward compatibility
