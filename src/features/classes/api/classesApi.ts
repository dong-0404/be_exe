import { apiClient } from '../../../api/client'
import type {
    ClassListResponse,
    ClassDetailResponse,
    ClassResponse,
    ScheduleResponse,
    ScheduleListResponse,
    AttendanceResponse,
    AttendanceListResponse,
    TutorAllStudentsResponse,
    JoinClassResponse,
    StudentMyClassesResponse,
    CreateClassPayload,
    UpdateClassPayload,
    CreateSchedulePayload,
    UpdateSchedulePayload,
    JoinClassPayload,
    Attendance,
} from '../types'

const ENDPOINTS = {
    // Tutor – Classes
    MY_CLASSES: '/tutors/me/classes',
    CLASSES: '/classes',
    CLASS_BY_ID: (id: string) => `/classes/${id}`,
    REGENERATE_INVITE: (id: string) => `/classes/${id}/regenerate-invite`,

    // Tutor – Schedules (aggregated)
    MY_SCHEDULES: '/tutors/me/schedules',

    // Class – Schedules
    CLASS_SCHEDULES: (classId: string) => `/classes/${classId}/schedules`,
    SCHEDULE_BY_ID: (classId: string, scheduleId: string) =>
        `/classes/${classId}/schedules/${scheduleId}`,

    // Tutor – Students (aggregated)
    MY_STUDENTS: '/tutors/me/students',

    // Student – Join & My Classes
    JOIN_CLASS: '/classes/join',
    MY_STUDENT_CLASSES: '/students/me/classes',
    MY_ATTENDANCES: '/students/me/attendances',

    // Attendance
    ATTEND: (classId: string, scheduleId: string) =>
        `/classes/${classId}/schedules/${scheduleId}/attend`,
    SCHEDULE_ATTENDANCE: (classId: string, scheduleId: string) =>
        `/classes/${classId}/schedules/${scheduleId}/attendance`,
} as const

export const classesApi = {
    // ============ TUTOR – CLASSES ============

    // GET /tutors/me/classes
    getMyClasses: (): Promise<ClassListResponse> =>
        apiClient.get<ClassListResponse>(ENDPOINTS.MY_CLASSES),

    // POST /classes
    createClass: (payload: CreateClassPayload): Promise<ClassResponse> =>
        apiClient.post<ClassResponse>(ENDPOINTS.CLASSES, payload),

    // GET /classes/:id
    getClassDetail: (classId: string): Promise<ClassDetailResponse> =>
        apiClient.get<ClassDetailResponse>(ENDPOINTS.CLASS_BY_ID(classId)),

    // PATCH /classes/:id
    updateClass: (classId: string, payload: UpdateClassPayload): Promise<ClassResponse> =>
        apiClient.patch<ClassResponse>(ENDPOINTS.CLASS_BY_ID(classId), payload),

    // POST /classes/:id/regenerate-invite
    regenerateInvite: (classId: string): Promise<{ success: boolean; data: { inviteCode: string } }> =>
        apiClient.post(ENDPOINTS.REGENERATE_INVITE(classId)),

    // ============ TUTOR – SCHEDULES (aggregated) ============

    // GET /tutors/me/schedules?from=&to=
    getAllSchedules: (from?: string, to?: string): Promise<ScheduleListResponse> =>
        apiClient.get<ScheduleListResponse>(ENDPOINTS.MY_SCHEDULES, {
            params: { ...(from && { from }), ...(to && { to }) },
        }),

    // GET /classes/:classId/schedules
    getClassSchedules: (classId: string): Promise<ScheduleListResponse> =>
        apiClient.get<ScheduleListResponse>(ENDPOINTS.CLASS_SCHEDULES(classId)),

    // POST /classes/:classId/schedules
    createSchedule: (payload: CreateSchedulePayload): Promise<ScheduleResponse> =>
        apiClient.post<ScheduleResponse>(
            ENDPOINTS.CLASS_SCHEDULES(payload.classId),
            {
                date: payload.date,
                startTime: payload.startTime,
                endTime: payload.endTime,
                title: payload.title,
            }
        ),

    // PATCH /classes/:classId/schedules/:scheduleId
    updateSchedule: (
        classId: string,
        scheduleId: string,
        payload: UpdateSchedulePayload
    ): Promise<ScheduleResponse> =>
        apiClient.patch<ScheduleResponse>(
            ENDPOINTS.SCHEDULE_BY_ID(classId, scheduleId),
            payload
        ),

    // DELETE /classes/:classId/schedules/:scheduleId
    deleteSchedule: (classId: string, scheduleId: string): Promise<{ success: boolean }> =>
        apiClient.delete(ENDPOINTS.SCHEDULE_BY_ID(classId, scheduleId)),

    // ============ TUTOR – STUDENTS (aggregated) ============

    // GET /tutors/me/students
    getAllStudents: (): Promise<TutorAllStudentsResponse> =>
        apiClient.get<TutorAllStudentsResponse>(ENDPOINTS.MY_STUDENTS),

    // ============ STUDENT – JOIN & MY CLASSES ============

    // POST /classes/join
    joinClass: (payload: JoinClassPayload): Promise<JoinClassResponse> =>
        apiClient.post<JoinClassResponse>(ENDPOINTS.JOIN_CLASS, {
            inviteCode: payload.inviteCode.toUpperCase(),
        }),

    // GET /students/me/classes
    getMyStudentClasses: (): Promise<StudentMyClassesResponse> =>
        apiClient.get<StudentMyClassesResponse>(ENDPOINTS.MY_STUDENT_CLASSES),

    // ============ ATTENDANCE ============

    // POST /classes/:classId/schedules/:scheduleId/attend
    attendSchedule: (classId: string, scheduleId: string): Promise<AttendanceResponse> =>
        apiClient.post<AttendanceResponse>(ENDPOINTS.ATTEND(classId, scheduleId)),

    // GET /students/me/attendances
    getMyAttendances: (): Promise<{ success: boolean; data: Attendance[] }> =>
        apiClient.get<{ success: boolean; data: Attendance[] }>(ENDPOINTS.MY_ATTENDANCES),

    // GET /classes/:classId/schedules/:scheduleId/attendance  (tutor xem)
    getScheduleAttendance: (classId: string, scheduleId: string): Promise<AttendanceListResponse> =>
        apiClient.get<AttendanceListResponse>(
            ENDPOINTS.SCHEDULE_ATTENDANCE(classId, scheduleId)
        ),
}
