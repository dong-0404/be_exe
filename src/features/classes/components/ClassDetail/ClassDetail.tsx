import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, Spinner, Alert, Table, Card, Modal } from 'react-bootstrap'
import type { ClassWithDetails, ClassSchedule, ClassMember, Attendance } from '../../types'
import { classesApi } from '../../api/classesApi'
import { ScheduleForm } from '../ScheduleForm'
import './ClassDetail.css'

interface ClassDetailProps {
    classId: string
    onBack: () => void
}

type SubTab = 'members' | 'schedules'

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatJoinDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN')
}

export const ClassDetail = ({ classId, onBack }: ClassDetailProps) => {
    const [classData, setClassData] = useState<ClassWithDetails | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [subTab, setSubTab] = useState<SubTab>('schedules')
    const [copiedCode, setCopiedCode] = useState(false)

    // Schedule modal
    const [showScheduleForm, setShowScheduleForm] = useState(false)
    const [editSchedule, setEditSchedule] = useState<ClassSchedule | null>(null)

    // Delete confirm
    const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Attendance per schedule (scheduleId -> Attendance[])
    const [scheduleAttendances, setScheduleAttendances] = useState<Record<string, Attendance[]>>({})
    const [loadingAttendances, setLoadingAttendances] = useState(false)
    const [selectedScheduleForAttendance, setSelectedScheduleForAttendance] = useState<ClassSchedule | null>(null)

    const loadDetail = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await classesApi.getClassDetail(classId)
            if (res.success) setClassData(res.data)
            else setError('Không tìm thấy lớp học')
        } catch {
            setError('Không thể tải thông tin lớp học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadDetail() }, [classId])

    // Load attendances for all schedules when class detail is ready (for schedules tab)
    const loadScheduleAttendances = useCallback(async () => {
        if (!classData?.schedules?.length) return
        try {
            setLoadingAttendances(true)
            const results = await Promise.all(
                classData.schedules.map((s) =>
                    classesApi.getScheduleAttendance(classId, s._id)
                )
            )
            const map: Record<string, Attendance[]> = {}
            classData.schedules.forEach((s, i) => {
                map[s._id] = results[i]?.success ? results[i].data ?? [] : []
            })
            setScheduleAttendances(map)
        } catch {
            setScheduleAttendances({})
        } finally {
            setLoadingAttendances(false)
        }
    }, [classId, classData?.schedules])

    useEffect(() => {
        if (subTab === 'schedules' && classData?.schedules?.length) {
            loadScheduleAttendances()
        }
    }, [subTab, classData?.schedules, loadScheduleAttendances])

    const handleCopyCode = () => {
        if (!classData) return
        navigator.clipboard.writeText(classData.inviteCode).then(() => {
            setCopiedCode(true)
            setTimeout(() => setCopiedCode(false), 2000)
        })
    }

    const handleAddSchedule = async (data: { date: string; startTime: string; endTime: string; title?: string }) => {
        await classesApi.createSchedule({ ...data, classId })
        await loadDetail()
    }

    const handleEditSchedule = async (data: { date: string; startTime: string; endTime: string; title?: string }) => {
        if (!editSchedule) return
        await classesApi.updateSchedule(classId, editSchedule._id, data)
        await loadDetail()
    }

    const handleDeleteSchedule = async () => {
        if (!deleteScheduleId) return
        try {
            setDeleting(true)
            await classesApi.deleteSchedule(classId, deleteScheduleId)
            await loadDetail()
        } catch {
            setError('Xóa buổi học thất bại')
        } finally {
            setDeleting(false)
            setDeleteScheduleId(null)
        }
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-muted">Đang tải...</span>
            </div>
        )
    }

    if (!classData) {
        return (
            <Alert variant="danger">
                {error ?? 'Không tìm thấy lớp học'}
                <Button variant="link" onClick={onBack}>Quay lại</Button>
            </Alert>
        )
    }

    const isFull = classData.currentStudents >= classData.maxStudents

    return (
        <div className="class-detail-container">
            {/* Back button + Header */}
            <div className="class-detail-header">
                <button className="class-detail__back-btn" onClick={onBack}>
                    ← Quay lại danh sách
                </button>
                <div className="class-detail__info">
                    <h5 className="class-detail__title">{classData.name}</h5>
                    <div className="class-detail__meta">
                        {classData.subjectName && (
                            <Badge bg="primary" className="me-2">{classData.subjectName}</Badge>
                        )}
                        {classData.gradeName && (
                            <Badge bg="secondary" className="me-2">{classData.gradeName}</Badge>
                        )}
                        <span className="text-muted" style={{ fontSize: 14 }}>
                            👥 {classData.currentStudents}/{classData.maxStudents} học sinh
                            {isFull && <Badge bg="danger" className="ms-2">Đầy</Badge>}
                        </span>
                    </div>
                </div>
                <div className="class-detail__invite-block">
                    <span style={{ fontSize: 13, color: '#666' }}>Mã mời:</span>
                    <span className="class-detail__invite-code">{classData.inviteCode}</span>
                    <Button
                        variant={copiedCode ? 'success' : 'outline-primary'}
                        size="sm"
                        onClick={handleCopyCode}
                    >
                        {copiedCode ? '✓ Đã sao chép' : 'Sao chép mã'}
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mt-3">
                    {error}
                </Alert>
            )}

            {/* Sub-tabs */}
            <div className="class-detail__tabs">
                <button
                    className={`class-detail__tab-btn ${subTab === 'schedules' ? 'active' : ''}`}
                    onClick={() => setSubTab('schedules')}
                >
                    📅 Lịch học ({classData.schedules.length})
                </button>
                <button
                    className={`class-detail__tab-btn ${subTab === 'members' ? 'active' : ''}`}
                    onClick={() => setSubTab('members')}
                >
                    👥 Thành viên ({classData.members.length})
                </button>
            </div>

            {/* === SCHEDULES TAB === */}
            {subTab === 'schedules' && (
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted" style={{ fontSize: 14 }}>
                            {classData.schedules.length} buổi học
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { setEditSchedule(null); setShowScheduleForm(true) }}
                        >
                            + Thêm buổi học
                        </Button>
                    </div>

                    {classData.schedules.length === 0 ? (
                        <Card className="text-center p-5">
                            <div style={{ fontSize: 40 }}>📅</div>
                            <p className="text-muted mt-2">Chưa có lịch học nào</p>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                className="mx-auto"
                                style={{ width: 'fit-content' }}
                                onClick={() => { setEditSchedule(null); setShowScheduleForm(true) }}
                            >
                                + Thêm buổi học đầu tiên
                            </Button>
                        </Card>
                    ) : (
                        <div className="class-schedule-list">
                            {loadingAttendances && (
                                <div className="text-muted small mb-2">Đang tải thông tin điểm danh...</div>
                            )}
                            {classData.schedules.map((s: ClassSchedule) => {
                                const attendances = scheduleAttendances[s._id] ?? []
                                const presentCount = attendances.filter((a) => a.status === 'present').length
                                const totalMembers = classData.members.length
                                return (
                                    <div key={s._id} className="class-schedule-item">
                                        <div className="class-schedule-item__date">
                                            <div className="class-schedule-item__day">
                                                {new Date(s.date).toLocaleDateString('vi-VN', { weekday: 'short' })}
                                            </div>
                                            <div className="class-schedule-item__num">
                                                {new Date(s.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        </div>
                                        <div className="class-schedule-item__body">
                                            <div className="class-schedule-item__time">
                                                🕐 {s.startTime} – {s.endTime}
                                            </div>
                                            {s.title && (
                                                <div className="class-schedule-item__title">{s.title}</div>
                                            )}
                                            <div className="class-schedule-item__attendance">
                                                <span className={presentCount === totalMembers && totalMembers > 0 ? 'text-success' : 'text-muted'}>
                                                    ✓ {presentCount}/{totalMembers} đã điểm danh
                                                </span>
                                                <button
                                                    type="button"
                                                    className="class-schedule-item__btn-attendance"
                                                    onClick={() => setSelectedScheduleForAttendance(s)}
                                                    title="Xem chi tiết điểm danh"
                                                >
                                                    Xem điểm danh
                                                </button>
                                            </div>
                                        </div>
                                        <div className="class-schedule-item__actions">
                                            <button
                                                className="class-schedule-item__btn edit"
                                                onClick={() => { setEditSchedule(s); setShowScheduleForm(true) }}
                                                title="Sửa"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="class-schedule-item__btn delete"
                                                onClick={() => setDeleteScheduleId(s._id)}
                                                title="Xóa"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* === MEMBERS TAB === */}
            {subTab === 'members' && (
                <div className="mt-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted" style={{ fontSize: 14 }}>
                            {classData.members.length}/{classData.maxStudents} học sinh
                        </span>
                        <div
                            style={{
                                background: '#f0f4ff',
                                border: '1px dashed #0066cc',
                                borderRadius: 8,
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <span style={{ fontSize: 13, color: '#555' }}>Mã mời để học sinh tham gia:</span>
                            <strong style={{ letterSpacing: 2, color: '#0066cc', fontSize: 15 }}>
                                {classData.inviteCode}
                            </strong>
                        </div>
                    </div>

                    {classData.members.length === 0 ? (
                        <Card className="text-center p-5">
                            <div style={{ fontSize: 40 }}>👥</div>
                            <p className="text-muted mt-2">
                                Chưa có học sinh nào. Chia sẻ mã mời <strong>{classData.inviteCode}</strong> để học sinh tham gia.
                            </p>
                        </Card>
                    ) : (
                        <Table hover responsive className="class-members-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Họ và tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classData.members.map((m: ClassMember, idx: number) => (
                                    <tr key={m._id}>
                                        <td>{idx + 1}</td>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="member-avatar">
                                                    {m.fullName.charAt(0)}
                                                </div>
                                                <span style={{ fontWeight: 500 }}>{m.fullName}</span>
                                            </div>
                                        </td>
                                        <td>{m.email ?? '—'}</td>
                                        <td>{m.phone ?? '—'}</td>
                                        <td>{formatJoinDate(m.joinedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </div>
            )}

            {/* Schedule Form Modal */}
            <ScheduleForm
                show={showScheduleForm}
                onHide={() => { setShowScheduleForm(false); setEditSchedule(null) }}
                onSubmit={editSchedule ? handleEditSchedule : handleAddSchedule}
                editData={editSchedule}
            />

            {/* Attendance Detail Modal */}
            <Modal
                show={!!selectedScheduleForAttendance}
                onHide={() => setSelectedScheduleForAttendance(null)}
                centered
                size="md"
            >
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16 }}>
                        Điểm danh — {selectedScheduleForAttendance
                            ? `${new Date(selectedScheduleForAttendance.date).toLocaleDateString('vi-VN')} ${selectedScheduleForAttendance.startTime}–${selectedScheduleForAttendance.endTime}`
                            : ''}
                        {selectedScheduleForAttendance?.title && (
                            <span className="d-block fw-normal text-muted small mt-1">
                                {selectedScheduleForAttendance.title}
                            </span>
                        )}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedScheduleForAttendance && (
                        <Table size="sm" hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Học sinh</th>
                                    <th>Trạng thái</th>
                                    <th>Thời gian điểm danh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classData.members.map((m: ClassMember, idx: number) => {
                                    const attendance = (scheduleAttendances[selectedScheduleForAttendance._id] ?? []).find(
                                        (a) => a.studentId === m.studentProfileId
                                    )
                                    const isPresent = attendance?.status === 'present'
                                    return (
                                        <tr key={m._id}>
                                            <td>{idx + 1}</td>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="member-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>
                                                        {m.fullName.charAt(0)}
                                                    </div>
                                                    {m.fullName}
                                                </div>
                                            </td>
                                            <td>
                                                {isPresent ? (
                                                    <Badge bg="success">Đã điểm danh</Badge>
                                                ) : (
                                                    <Badge bg="secondary">Chưa điểm danh</Badge>
                                                )}
                                            </td>
                                            <td style={{ fontSize: 13, color: '#666' }}>
                                                {isPresent && attendance?.checkedAt
                                                    ? new Date(attendance.checkedAt).toLocaleString('vi-VN')
                                                    : '—'}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </Table>
                    )}
                    {selectedScheduleForAttendance && classData.members.length === 0 && (
                        <p className="text-muted mb-0">Lớp chưa có học sinh nào.</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setSelectedScheduleForAttendance(null)}>
                        Đóng
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={() => loadScheduleAttendances()}>
                        Tải lại
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal
                show={!!deleteScheduleId}
                onHide={() => setDeleteScheduleId(null)}
                centered
                size="sm"
            >
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16 }}>Xóa buổi học</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa buổi học này không?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" size="sm" onClick={() => setDeleteScheduleId(null)}>
                        Hủy
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleDeleteSchedule} disabled={deleting}>
                        {deleting ? <Spinner size="sm" animation="border" /> : 'Xóa'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    )
}
