import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionResponse, SubscriptionCreateRequest } from '../../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private base = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  /** Member subscribes to a plan */
  subscribeMe(req: SubscriptionCreateRequest): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(`${this.base}/me`, req);
  }

  /** Get current member's subscriptions */
  mySubscriptions(): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(`${this.base}/me`);
  }

  /** Renew a subscription (admin) */
  renew(id: number): Observable<SubscriptionResponse> {
    return this.http.post<SubscriptionResponse>(`${this.base}/${id}/renew`, {});
  }

  /** List all subscriptions (admin) */
  listAll(): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(this.base);
  }

  /** Get subscriptions by member (admin) */
  getByMember(memberId: number): Observable<SubscriptionResponse[]> {
    return this.http.get<SubscriptionResponse[]>(`${this.base}/member/${memberId}`);
  }
}
