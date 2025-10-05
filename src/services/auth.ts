import { apiService } from './api';
import {
  LoginData,
  RegisterData,
  AuthResponse,
  RefreshResponse,
  ProfileResponse,
  TagsResponse,
  TagsByTypeResponse,
  AIRecommendationRequest,
  AIRecommendationResponse,
  User,
} from '../types/auth';

class AuthService {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await apiService.login<AuthResponse>(data);
    if (response.success && response.data.accessToken) {
      apiService.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async register(data: RegisterData): Promise<{ success: boolean; message: string; data: { user: User } }> {
    return apiService.register<{ success: boolean; message: string; data: { user: User } }>(data);
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.logout<{ success: boolean; message: string }>();
      apiService.setAccessToken(null);
      return response;
    } catch (error) {
      apiService.setAccessToken(null);
      throw error;
    }
  }

  async refreshToken(): Promise<RefreshResponse> {
    const response = await apiService.refreshToken<RefreshResponse>();
    if (response.success && response.data.accessToken) {
      apiService.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async getProfile(): Promise<ProfileResponse> {
    return apiService.getProfile<ProfileResponse>();
  }

  async checkAuthStatus(): Promise<User | null> {
    try {
      const token = apiService.getAccessToken();
      if (!token) {
        return null;
      }

      const response = await this.getProfile();
      return response.data.user;
    } catch (error) {
      try {
        await this.refreshToken();
        const response = await this.getProfile();
        return response.data.user;
      } catch (refreshError) {
        apiService.setAccessToken(null);
        return null;
      }
    }
  }

  async getAllTags(): Promise<TagsResponse> {
    return apiService.get<TagsResponse>('/auth/tags');
  }

  async getTagsByType(): Promise<TagsByTypeResponse> {
    return apiService.get<TagsByTypeResponse>('/auth/tags/by-type');
  }

  async getS3Data(): Promise<any> {
    return apiService.get<any>('/files/map-data');
  }

  async getZipData(zipCode: string): Promise<any> {
    return apiService.get<any>(`/files/zip/${zipCode}`);
  }

  async getAIRecommendations(data: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    return apiService.post<AIRecommendationResponse>('/auth/requests', data);
  }

  isAuthenticated(): boolean {
    return !!apiService.getAccessToken();
  }
}

export const authService = new AuthService();
