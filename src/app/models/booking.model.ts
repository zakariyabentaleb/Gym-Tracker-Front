export interface BookingResponse {
  id: number | null;
  scheduleId: number;
  memberId: number;
  status: string; // CONFIRMED, CANCELLED, WAITING
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingCreateRequest {
  scheduleId: number;
  memberId?: number; // optional when using /me endpoint
}
