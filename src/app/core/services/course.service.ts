import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CourseResponse, CourseCreateRequest } from '../../models/course.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private base = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  list(): Observable<CourseResponse[]> {
    return this.http.get<CourseResponse[]>(this.base);
  }

  getById(id: number): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${this.base}/${id}`);
  }

  create(req: CourseCreateRequest): Observable<CourseResponse> {
    return this.http.post<CourseResponse>(this.base, req);
  }

  update(id: number, req: CourseCreateRequest): Observable<CourseResponse> {
    return this.http.put<CourseResponse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
