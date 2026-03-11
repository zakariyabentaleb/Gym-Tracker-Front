import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  MemberResponse,
  MemberCreateRequest,
  MemberUpdateRequest,
  PagedResponse
} from '../../models/member.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private base = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  create(req: MemberCreateRequest): Observable<MemberResponse> {
    return this.http.post<MemberResponse>(this.base, req);
  }

  listRaw(q?: string, page = 0, size = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (q) params = params.set('q', q);
    return this.http.get<any>(this.base, { params });
  }

  list(q?: string, page = 0, size = 20): Observable<{ items: MemberResponse[]; total: number }> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (q) params = params.set('q', q);
    return this.http.get<any>(this.base, { params }).pipe(
      map(res => {
        // Handle plain array response
        if (Array.isArray(res)) {
          return { items: res, total: res.length };
        }
        // Normalize: Spring Boot uses 'content'/'totalElements', custom uses 'items'/'total'
        const items: MemberResponse[] = res.content || res.items || [];
        const total: number = res.totalElements ?? res.total ?? items.length;
        return { items, total };
      })
    );
  }

  getById(id: number): Observable<MemberResponse> {
    return this.http.get<MemberResponse>(`${this.base}/${id}`);
  }

  update(id: number, req: MemberUpdateRequest): Observable<MemberResponse> {
    return this.http.patch<MemberResponse>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  me(): Observable<MemberResponse> {
    return this.http.get<MemberResponse>(`${this.base}/me`);
  }

  updateMe(req: MemberUpdateRequest): Observable<MemberResponse> {
    return this.http.patch<MemberResponse>(`${this.base}/me`, req);
  }
}
