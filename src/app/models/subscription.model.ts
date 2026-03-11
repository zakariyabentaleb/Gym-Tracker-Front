export interface SubscriptionResponse {
  id: number;
  memberId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: string;       // ACTIVE | EXPIRED | CANCELLED | SUSPENDED
  autoRenew: boolean;
}

export interface SubscriptionCreateRequest {
  planId: number;
  memberId?: number;
  startDate?: string;
  autoRenew?: boolean;
}
