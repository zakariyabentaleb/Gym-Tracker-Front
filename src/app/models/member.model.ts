export interface MemberResponse {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  birthDate?: string | null; // "YYYY-MM-DD"
  active?: boolean;
}

export interface MemberCreateRequest {
  userId: number;
  firstName: string;
  lastName: string;
  phone?: string | null;
  birthDate?: string | null;
  active?: boolean;
}

export interface MemberUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  birthDate?: string | null;
  active?: boolean;
}

// PagedResponse generic — supports both custom and Spring Boot formats
export interface PagedResponse<T> {
  items?: T[];
  content?: T[];        // Spring Boot field name
  total?: number;
  totalElements?: number; // Spring Boot field name
  page?: number;
  number?: number;       // Spring Boot field name
  size: number;
}
