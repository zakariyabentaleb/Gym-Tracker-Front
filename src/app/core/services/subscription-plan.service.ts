import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PlanResponse, PlanCreateRequest, PlanUpdateRequest } from '../../models/subscription-plan.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionPlanService {
  private base = `${environment.apiUrl}/plans`;

  constructor(private http: HttpClient) {}

  list(): Observable<PlanResponse[]> {
    return this.http.get<PlanResponse[]>(this.base);
  }

  getById(id: number): Observable<PlanResponse> {
    return this.http.get<PlanResponse>(`${this.base}/${id}`);
  }

  create(req: PlanCreateRequest): Observable<PlanResponse> {
    return this.http.post<PlanResponse>(this.base, req);
  }

  update(id: number, req: PlanUpdateRequest): Observable<PlanResponse> {
    return this.http.patch<PlanResponse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
