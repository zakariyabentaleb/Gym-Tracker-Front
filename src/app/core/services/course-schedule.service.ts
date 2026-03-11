import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CourseScheduleResponse, CourseScheduleCreateRequest } from '../../models/course.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CourseScheduleService {
  private base = `${environment.apiUrl}/course-schedules`;

  constructor(private http: HttpClient) {}

  listAll(): Observable<CourseScheduleResponse[]> {
    return this.http.get<CourseScheduleResponse[]>(this.base);
  }

  listByCourse(courseId: number): Observable<CourseScheduleResponse[]> {
    return this.http.get<CourseScheduleResponse[]>(`${this.base}/course/${courseId}`);
  }

  getById(id: number): Observable<CourseScheduleResponse> {
    return this.http.get<CourseScheduleResponse>(`${this.base}/${id}`);
  }

  create(req: CourseScheduleCreateRequest): Observable<CourseScheduleResponse> {
    return this.http.post<CourseScheduleResponse>(this.base, req);
  }

  update(id: number, req: CourseScheduleCreateRequest): Observable<CourseScheduleResponse> {
    return this.http.put<CourseScheduleResponse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
