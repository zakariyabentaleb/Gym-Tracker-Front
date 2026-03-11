export interface CoachResponse {
  id: number;
  userId: number;
  displayName: string;
  phone?: string | null;
  bio?: string | null;
  certifications?: string | null;
  photoUrl?: string | null;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CoachCreateRequest {
  userId?: number | null;
  displayName: string;
  phone?: string | null;
  bio?: string | null;
  certifications?: string | null;
  photoUrl?: string | null;
  active?: boolean | null;
}
