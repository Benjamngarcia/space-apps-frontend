export interface User {
  uuid: string;
  email: string;
  name: string;
  surname: string;
  birthdate: string;
  zipCode: string;
  createdAt: string;
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
