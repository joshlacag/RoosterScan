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

const API_BASE = import.meta.env.VITE_API_URL || "/api";

class ApiClient {
  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const session = await getSession();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "User-Agent": "Mozilla/5.0", // Add user-agent to bypass ngrok blocking
      ...options.headers,
    };

    // Add Supabase JWT token if user is authenticated
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    // Ensure the URL is properly formatted
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for CORS with credentials
      });

      // Check if response is HTML (error page)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const text = await response.text();
        throw new Error(`Server returned HTML: ${text.substring(0, 100)}...`);
      }

      // Handle ngrok blocking
      if (response.status === 403) {
        const text = await response.text();
        if (text.includes('Blocked request')) {
          throw new Error('Blocked by ngrok: ' + text);
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText) as ApiError;
          throw new Error(error.error || `HTTP ${response.status}`);
        } catch (e) {
          throw new Error(errorText || `HTTP ${response.status}`);
        }
      }

      // Handle empty responses
      if (response.status === 204) {
        return null as unknown as T;
      }

      const result: ApiResponse<T> = await response.json();
      return result.data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
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
    
    // Use the request method to include all headers
    return this.request<{ url: string }>("/upload", {
      method: 'POST',
      body: formData
    });
  }

  // Educational Content API methods
  async getEducationalContent(filters?: EducationFilters): Promise<EducationalContent[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.featured) params.append('featured', 'true');
    if (filters?.search) params.append('search', filters.search);

    return this.request<EducationalContent[]>(`/api/education?${params}`);
  }

  async getEducationalContentById(id: string): Promise<EducationalContent> {
    return this.request<EducationalContent>(`/api/education/${id}`);
  }

  async getEducationCategories(): Promise<string[]> {
    return this.request<string[]>("/api/education/categories");
  }

  async updateUserProgress(contentId: string, progress: Partial<UserProgress>): Promise<UserProgress> {
    return this.request<UserProgress>(`/api/education/${contentId}/progress`, {
      method: 'PUT',
      body: JSON.stringify(progress),
    });
  }

  async getUserProgress(): Promise<UserProgress[]> {
    return this.request<UserProgress[]>("/api/education/user/progress");
  }
}

export const api = new ApiClient();
export const apiClient = api; // Alias for backward compatibility
