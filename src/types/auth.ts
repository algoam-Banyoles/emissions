export interface AuthUser {
  userId: string;
  organitzacioId: string;
  rol: string;
  email: string;
}

export interface AuthOrganization {
  id: string;
  nom: string;
  codi: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
  organitzacio?: AuthOrganization;
}
