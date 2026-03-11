export interface PaymentResponse {
  id: number;
  subscriptionId: number | null;
  memberId: number;
  amountCents: number;
  method: string;
  status: string;
  paymentDate: string;
  reference: string | null;
}
