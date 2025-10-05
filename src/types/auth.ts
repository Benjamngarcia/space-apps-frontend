export interface Tag {
  tagId: number;
  tagName: string;
  tagType: string;
}

export interface User {
  uuid: string;
  email: string;
  name: string;
  surname: string;
  birthdate: string;
  zipCode: string;
  createdAt: string;
  tags?: Tag[];
}

export interface LoginData {
  email: string;
  userPss: string;
}

export interface RegisterData {
  email: string;
  userPss: string;
  name: string;
  surname: string;
  birthdate: string;
  zipCode: string;
  tagIds?: number[];
}

export interface TagsByType {
  [category: string]: {
    tagId: number;
    tagName: string;
  }[];
}

export interface TagsResponse {
  success: boolean;
  data: {
    tags: Tag[];
  };
}

export interface TagsByTypeResponse {
  success: boolean;
  data: {
    tagsByType: TagsByType;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
  };
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}

export interface ProfileResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface AIRecommendationRequest {
  tagIds: number[];
  outDate?: string;
  countryId: string;
}

export interface AIRecommendation {
  country: string;
  date: string;
  dominant_pollutant: string;
  risk_level_label: string;
  scores: {
    outdoor_suitability: number;
    health_risk: number;
    confidence: number;
  };
  pollutants: {
    NO2: number;
    O3: number;
    PM: number;
    CH2O: number;
    AI: number;
  };
  tailored_notes: string[];
  recommendations: string[];
  indoor_alternatives: string[];
  disclaimer: string;
}

export interface AIRecommendationResponse {
  success: boolean;
  data: {
    recommendation: AIRecommendation;
    summary: string;
  };
}
