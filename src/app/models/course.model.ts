export interface CourseResponse {
  id: number;
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  capacity?: number | null;
  active?: boolean;
  photoUrl?: string | null;
}

export interface CourseCreateRequest {
  name: string;
  description?: string | null;
  durationMinutes?: number | null;
  capacity?: number | null;
  active?: boolean;
  photoUrl?: string | null;
}

export interface CourseScheduleResponse {
  id: number;
  courseId: number;
  coachId?: number | null;
  room?: string | null;
  startTime: string; // ISO datetime
  endTime: string;
  capacity?: number | null;
  active?: boolean;
}

export interface CourseScheduleCreateRequest {
  courseId: number;
  coachId?: number | null;
  room?: string | null;
  startTime: string;
  endTime: string;
  capacity?: number | null;
  active?: boolean;
}
