import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CoachResponse, CoachCreateRequest } from '../../models/coach.model';
import { CourseScheduleResponse } from '../../models/course.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private base = `${environment.apiUrl}/coaches`;

  constructor(private http: HttpClient) {}

  create(req: CoachCreateRequest): Observable<CoachResponse> {
    return this.http.post<CoachResponse>(this.base, req);
  }

  listAll(): Observable<CoachResponse[]> {
    return this.http.get<CoachResponse[]>(this.base);
  }

  listActive(): Observable<CoachResponse[]> {
    return this.http.get<CoachResponse[]>(`${this.base}/active`);
  }

  getById(id: number): Observable<CoachResponse> {
    return this.http.get<CoachResponse>(`${this.base}/${id}`);
  }

  myProfile(): Observable<CoachResponse> {
    return this.http.get<CoachResponse>(`${this.base}/me`);
  }

  update(id: number, req: CoachCreateRequest): Observable<CoachResponse> {
    return this.http.put<CoachResponse>(`${this.base}/${id}`, req);
  }

  updateMyProfile(req: CoachCreateRequest): Observable<CoachResponse> {
    return this.http.put<CoachResponse>(`${this.base}/me`, req);
  }
  
  confirmMySchedule(scheduleId: number): Observable<CourseScheduleResponse> {
    return this.http.post<CourseScheduleResponse>(`${this.base}/me/schedules/${scheduleId}/confirm`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
