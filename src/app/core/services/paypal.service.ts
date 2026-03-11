import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaypalService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createOrder(planId: number): Observable<{ orderId: string }> {
    return this.http.post<{ orderId: string }>(`${this.api}/paypal/create-order`, { planId });
  }

  captureOrder(orderId: string, planId: number): Observable<any> {
    return this.http.post(`${this.api}/paypal/capture-order`, { orderId, planId });
  }
}
