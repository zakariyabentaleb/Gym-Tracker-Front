import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaymentResponse } from '../../models/payment.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private api = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  listAll(): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(this.api);
  }

  getByMember(memberId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.api}/member/${memberId}`);
  }

  getBySubscription(subscriptionId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.api}/subscription/${subscriptionId}`);
  }
}
