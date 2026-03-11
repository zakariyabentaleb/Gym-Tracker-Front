export interface PlanResponse {
  id: number;
  name: string;
  durationDays: number;
  priceCents: number;
  includesClasses: boolean;
  description: string | null;
  active: boolean;
}

export interface PlanCreateRequest {
  name: string;
  durationDays: number;
  priceCents: number;
  includesClasses?: boolean;
  description?: string | null;
}

export interface PlanUpdateRequest {
  name?: string;
  durationDays?: number;
  priceCents?: number;
  includesClasses?: boolean;
  description?: string | null;
  active?: boolean;
}
