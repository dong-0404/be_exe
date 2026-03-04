// ============ CLASS TYPES ============

export interface ClassInfo {
    _id: string
    tutorId: string
    name: string
    maxStudents: number
    currentStudents: number
    inviteCode: string
    subjectId?: string
    subjectName?: string
    gradeId?: string
    gradeName?: string
    createdAt: string
    updatedAt: string
}

export interface ClassMember {
    _id: string
    classId: string
    studentProfileId: string
    fullName: string
    email?: string
    phone?: string
    avatarUrl?: string
    joinedAt: string
}

export interface ClassSchedule {
    _id: string
    classId: string
    className?: string
    date: string         // YYYY-MM-DD
    startTime: string    // HH:mm
    endTime: string      // HH:mm
    title?: string
    createdAt?: string
}

export interface Attendance {
    _id: string
    scheduleId: string
    studentId: string
    status: 'present' | 'absent'
    checkedAt: string
}

// Extended types with nested data
export interface ClassWithDetails extends ClassInfo {
    members: ClassMember[]
    schedules: ClassSchedule[]
}

// Aggregated types for total views
export interface TutorAllStudents {
    studentId: string
    fullName: string
    email?: string
    phone?: string
    avatarUrl?: string
    classId: string
    className: string
    joinedAt: string
}

// ============ REQUEST TYPES ============

export interface CreateClassPayload {
    name: string
    maxStudents: number
    subjectId?: string
    gradeId?: string
}

export interface UpdateClassPayload {
    name?: string
    maxStudents?: number
}

export interface CreateSchedulePayload {
    classId: string
    date: string
    startTime: string
    endTime: string
    title?: string
}

export interface UpdateSchedulePayload {
    date?: string
    startTime?: string
    endTime?: string
    title?: string
}

export interface JoinClassPayload {
    inviteCode: string
}

// ============ RESPONSE TYPES ============

export interface ClassResponse {
    success: boolean
    message?: string
    data: ClassInfo
}

export interface ClassListResponse {
    success: boolean
    message?: string
    data: ClassInfo[]
}

export interface ClassDetailResponse {
    success: boolean
    message?: string
    data: ClassWithDetails
}

export interface ScheduleResponse {
    success: boolean
    message?: string
    data: ClassSchedule
}

export interface ScheduleListResponse {
    success: boolean
    message?: string
    data: ClassSchedule[]
}

export interface AttendanceResponse {
    success: boolean
    message?: string
    data: Attendance
}

export interface AttendanceListResponse {
    success: boolean
    message?: string
    data: Attendance[]
}

export interface TutorAllStudentsResponse {
    success: boolean
    message?: string
    data: TutorAllStudents[]
}

export interface JoinClassResponse {
    success: boolean
    message?: string
    data: {
        class: ClassInfo
        member: ClassMember
    }
}

// Student schedule view (joined schedule with attendance status)
export interface StudentScheduleItem {
    schedule: ClassSchedule
    classId: string
    className: string
    attended: boolean
    attendance?: Attendance
}

export interface StudentMyClassesResponse {
    success: boolean
    message?: string
    data: ClassWithDetails[]
}
