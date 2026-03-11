import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { BookingResponse, BookingCreateRequest } from '../../models/booking.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  /** Member enrolls themselves into a schedule */
  enrollMe(scheduleId: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.base}/me`, { scheduleId });
  }

  /** Get all my bookings */
  myBookings(): Observable<BookingResponse[]> {
    return this.http.get<BookingResponse[]>(`${this.base}/me`);
  }

  /** Cancel a booking */
  cancel(bookingId: number): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.base}/${bookingId}/cancel`, {});
  }

  /** Get confirmed booking count for a schedule */
  getConfirmedCount(scheduleId: number): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.base}/schedule/${scheduleId}/confirmed-count`);
  }
}
