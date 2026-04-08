export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface RegisterRequest {
  correo: string;
  usuario: string;
  password: string;
  oficina: string;
  rol: string;
}

export interface RegisterResponse {
  idusuario: number;
  usuario: string;
  correo: string;
  oficina: string;
  rol: string;
}

export interface UserProfile {
  idusuario: number;
  username: string;
  email: string;
  oficina?: string;
  rol?: string;
  password?: string;
}
