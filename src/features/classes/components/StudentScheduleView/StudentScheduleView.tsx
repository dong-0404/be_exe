import { useState, useEffect } from 'react'
import { Spinner, Alert, Badge, Button } from 'react-bootstrap'
import type { ClassWithDetails, ClassSchedule, Attendance } from '../../types'
import { classesApi } from '../../api/classesApi'
import { JoinClassForm } from '../JoinClassForm'
import './StudentScheduleView.css'

const today = () => new Date().toISOString().split('T')[0]
const isPast = (date: string) => date < today()
const isToday = (date: string) => date === today()
const isFuture = (date: string) => date > today()

/** Giờ hiện tại dạng "HH:mm" (theo múi giờ local) */
const nowTime = () => {
    const d = new Date()
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * Buổi học còn trong khung giờ cho phép điểm danh không.
 * Chỉ cho phép khi: đã đến giờ bắt đầu và chưa quá giờ kết thúc.
 */
const isSlotWithinAttendanceWindow = (date: string, startTime: string, endTime: string) => {
    if (!isToday(date)) return false
    const now = nowTime()
    return now >= startTime && now <= endTime
}

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    })

interface ScheduleWithMeta extends ClassSchedule {
    classIdRef: string
    className: string
    attended: boolean
    canAttend: boolean
}

export const StudentScheduleView = () => {
    const [myClasses, setMyClasses] = useState<ClassWithDetails[]>([])
    const [attendances, setAttendances] = useState<Attendance[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [attendingId, setAttendingId] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'past'>('upcoming')

    const loadData = async () => {
        try {
            setLoading(true)
            setError(null)
            const [classRes, attRes] = await Promise.all([
                classesApi.getMyStudentClasses(),
                classesApi.getMyAttendances(),
            ])
            setMyClasses(classRes.data ?? [])
            setAttendances(attRes.data ?? [])
        } catch {
            setError('Không thể tải lịch học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadData() }, [])

    const handleAttend = async (classId: string, scheduleId: string, className: string) => {
        try {
            setAttendingId(scheduleId)
            await classesApi.attendSchedule(classId, scheduleId)
            const attRes = await classesApi.getMyAttendances()
            setAttendances(attRes.data)
            setSuccessMsg(`Điểm danh thành công buổi học — ${className}!`)
            setTimeout(() => setSuccessMsg(null), 3000)
        } catch {
            setError('Điểm danh thất bại, vui lòng thử lại')
        } finally {
            setAttendingId(null)
        }
    }

    // Build flat list of schedule items with attendance metadata
    const allSchedules: ScheduleWithMeta[] = myClasses
        .flatMap(cls =>
            cls.schedules.map(s => {
                const attended = attendances.some(a => a.scheduleId === s._id && a.status === 'present')
                // Chỉ cho điểm danh khi buổi học đang diễn ra (trong khung startTime–endTime), chưa điểm danh
                const canAttend =
                    !attended && isSlotWithinAttendanceWindow(s.date, s.startTime, s.endTime)
                return {
                    ...s,
                    classIdRef: cls._id,
                    className: cls.name,
                    attended,
                    canAttend,
                }
            })
        )
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))

    const filtered = allSchedules.filter(s => {
        if (filterType === 'upcoming') return !isPast(s.date)
        if (filterType === 'past') return isPast(s.date)
        return true
    })

    // Group by date
    const grouped: Record<string, ScheduleWithMeta[]> = {}
    filtered.forEach(s => {
        if (!grouped[s.date]) grouped[s.date] = []
        grouped[s.date].push(s)
    })
    const sortedDates = Object.keys(grouped).sort()

    return (
        <div className="student-schedule-container">
            {/* Join class section */}
            <JoinClassForm onJoined={() => loadData()} />

            {/* Filter tabs */}
            <div className="student-schedule-filters">
                {(['upcoming', 'all', 'past'] as const).map(f => (
                    <button
                        key={f}
                        className={`student-filter-btn ${filterType === f ? 'active' : ''}`}
                        onClick={() => setFilterType(f)}
                    >
                        {f === 'upcoming' ? 'Sắp tới' : f === 'all' ? 'Tất cả' : 'Đã qua'}
                    </button>
                ))}
            </div>

            {/* Summary pills */}
            <div className="d-flex gap-2 mb-3 flex-wrap">
                {myClasses.map(cls => (
                    <Badge key={cls._id} bg="light" text="dark" style={{ fontSize: 12, fontWeight: 500 }}>
                        📚 {cls.name} ({cls.schedules.length} buổi)
                    </Badge>
                ))}
                {myClasses.length === 0 && (
                    <span className="text-muted" style={{ fontSize: 13 }}>Chưa tham gia lớp học nào</span>
                )}
            </div>

            {successMsg && (
                <Alert variant="success" dismissible onClose={() => setSuccessMsg(null)} className="py-2 mb-3">
                    {successMsg}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="py-2 mb-3">
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <span className="ms-3 text-muted">Đang tải...</span>
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="student-schedule-empty">
                    <div style={{ fontSize: 48 }}>📅</div>
                    <p className="text-muted mt-2">
                        {filterType === 'upcoming' ? 'Không có lịch học sắp tới' :
                         filterType === 'past' ? 'Không có lịch học đã qua' :
                         'Chưa có lịch học nào'}
                    </p>
                </div>
            ) : (
                <div className="student-schedule-list">
                    {sortedDates.map(date => (
                        <div key={date} className={`student-day-group ${isToday(date) ? 'today' : ''}`}>
                            <div className="student-day-header">
                                <span className="student-day-label">
                                    {formatDate(date)}
                                    {isToday(date) && <Badge bg="primary" className="ms-2">Hôm nay</Badge>}
                                </span>
                            </div>
                            {grouped[date].map(s => (
                                <div
                                    key={s._id}
                                    className={`student-schedule-row ${s.attended ? 'attended' : ''} ${isPast(s.date) && !s.attended ? 'missed' : ''}`}
                                >
                                    <div className="student-schedule-row__status-dot">
                                        {s.attended ? '✅' : isPast(s.date) ? '⚪' : '🔵'}
                                    </div>
                                    <div className="student-schedule-row__body">
                                        <div className="student-schedule-row__class">{s.className}</div>
                                        <div className="student-schedule-row__time">
                                            🕐 {s.startTime} – {s.endTime}
                                            {s.title && <span className="ms-2 text-muted">· {s.title}</span>}
                                        </div>
                                    </div>
                                    <div className="student-schedule-row__action">
                                        {s.attended ? (
                                            <Badge bg="success">Đã điểm danh</Badge>
                                        ) : s.canAttend ? (
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                onClick={() => handleAttend(s.classIdRef, s._id, s.className)}
                                                disabled={attendingId === s._id}
                                            >
                                                {attendingId === s._id ? (
                                                    <Spinner as="span" size="sm" animation="border" />
                                                ) : 'Điểm danh'}
                                            </Button>
                                        ) : isPast(s.date) ? (
                                            <Badge bg="secondary" text="light">Vắng mặt</Badge>
                                        ) : isToday(s.date) ? (
                                            nowTime() < s.startTime ? (
                                                <Badge bg="light" text="dark">Chưa đến giờ</Badge>
                                            ) : (
                                                <Badge bg="secondary" text="light">Đã hết giờ</Badge>
                                            )
                                        ) : (
                                            <Badge bg="light" text="dark">Sắp diễn ra</Badge>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
