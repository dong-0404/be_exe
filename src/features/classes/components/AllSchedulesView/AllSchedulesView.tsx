import { useState, useEffect } from 'react'
import { Button, Spinner, Alert, Form, Badge, Modal } from 'react-bootstrap'
import type { ClassSchedule, ClassInfo } from '../../types'
import { classesApi } from '../../api/classesApi'
import { ScheduleForm } from '../ScheduleForm'
import './AllSchedulesView.css'

interface AllSchedulesViewProps {
    onGoToClass?: (classId: string) => void
}

const getWeekRange = (baseDate: Date) => {
    const date = new Date(baseDate)
    const day = date.getDay() === 0 ? 6 : date.getDay() - 1 // Mon=0
    const monday = new Date(date)
    monday.setDate(date.getDate() - day)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
        from: monday.toISOString().split('T')[0],
        to: sunday.toISOString().split('T')[0],
        monday,
        sunday,
    }
}

const formatDateHeader = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })
}

const isToday = (dateStr: string) => {
    return dateStr === new Date().toISOString().split('T')[0]
}

const isPast = (dateStr: string) => {
    return dateStr < new Date().toISOString().split('T')[0]
}

export const AllSchedulesView = ({ onGoToClass }: AllSchedulesViewProps) => {
    const [schedules, setSchedules] = useState<ClassSchedule[]>([])
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [weekBase, setWeekBase] = useState(new Date())
    const [filterClassId, setFilterClassId] = useState('')

    // Add schedule modal
    const [showAddModal, setShowAddModal] = useState(false)
    const [addClassId, setAddClassId] = useState('')
    const [showClassPicker, setShowClassPicker] = useState(false)

    const { from, to, monday, sunday } = getWeekRange(weekBase)

    const loadSchedules = async () => {
        try {
            setLoading(true)
            setError(null)
            const [schedRes, classRes] = await Promise.all([
                classesApi.getAllSchedules(from, to),
                classesApi.getMyClasses(),
            ])
            setSchedules(schedRes.data ?? [])
            setClasses(classRes.data ?? [])
        } catch {
            setError('Không thể tải lịch dạy')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadSchedules() }, [from, to])

    const prevWeek = () => {
        const d = new Date(weekBase)
        d.setDate(d.getDate() - 7)
        setWeekBase(d)
    }

    const nextWeek = () => {
        const d = new Date(weekBase)
        d.setDate(d.getDate() + 7)
        setWeekBase(d)
    }

    const todayWeek = () => setWeekBase(new Date())

    // Group schedules by date, filter by class if needed
    const filtered = filterClassId
        ? schedules.filter(s => s.classId === filterClassId)
        : schedules

    const grouped: Record<string, ClassSchedule[]> = {}
    filtered.forEach(s => {
        if (!grouped[s.date]) grouped[s.date] = []
        grouped[s.date].push(s)
    })
    const sortedDates = Object.keys(grouped).sort()

    const handleAddSchedule = async (data: { date: string; startTime: string; endTime: string; title?: string }) => {
        await classesApi.createSchedule({ ...data, classId: addClassId })
        await loadSchedules()
        setAddClassId('')
    }

    const handleOpenAddModal = (classId?: string) => {
        setAddClassId(classId ?? (classes[0]?._id ?? ''))
        setShowAddModal(true)
    }

    const formatWeekLabel = () => {
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit' }
        return `${monday.toLocaleDateString('vi-VN', options)} – ${sunday.toLocaleDateString('vi-VN', options)}`
    }

    return (
        <div className="all-schedules-container">
            {/* Toolbar */}
            <div className="all-schedules-toolbar">
                <div className="all-schedules-nav">
                    <button className="week-nav-btn" onClick={prevWeek} title="Tuần trước">‹</button>
                    <span className="week-label">Tuần {formatWeekLabel()}</span>
                    <button className="week-nav-btn" onClick={nextWeek} title="Tuần sau">›</button>
                    <button className="week-today-btn" onClick={todayWeek}>Tuần này</button>
                </div>

                <div className="d-flex gap-2 align-items-center flex-wrap">
                    {classes.length > 0 && (
                        <Form.Select
                            size="sm"
                            style={{ width: 200 }}
                            value={filterClassId}
                            onChange={e => setFilterClassId(e.target.value)}
                        >
                            <option value="">Tất cả lớp</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </Form.Select>
                    )}
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                            if (classes.length === 0) return
                            if (classes.length === 1) {
                                handleOpenAddModal(classes[0]._id)
                            } else {
                                setShowClassPicker(true)
                            }
                        }}
                        disabled={classes.length === 0}
                    >
                        + Thêm buổi dạy
                    </Button>
                </div>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)} className="mt-3">
                    {error}
                </Alert>
            )}

            {loading ? (
                <div className="d-flex justify-content-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <span className="ms-3 text-muted">Đang tải...</span>
                </div>
            ) : sortedDates.length === 0 ? (
                <div className="all-schedules-empty">
                    <div style={{ fontSize: 48 }}>📅</div>
                    <p className="text-muted mt-2">
                        {filterClassId ? 'Lớp này chưa có lịch dạy trong tuần' : 'Chưa có lịch dạy trong tuần này'}
                    </p>
                    {classes.length > 0 && (
                        <Button variant="outline-primary" size="sm" onClick={() => handleOpenAddModal()}>
                            + Thêm buổi dạy
                        </Button>
                    )}
                </div>
            ) : (
                <div className="all-schedules-list">
                    {sortedDates.map(date => (
                        <div key={date} className={`schedule-day-group ${isToday(date) ? 'today' : ''} ${isPast(date) ? 'past' : ''}`}>
                            <div className="schedule-day-header">
                                <span className="schedule-day-label">
                                    {formatDateHeader(date)}
                                    {isToday(date) && <Badge bg="primary" className="ms-2">Hôm nay</Badge>}
                                </span>
                                <span className="schedule-day-count">{grouped[date].length} buổi</span>
                            </div>
                            {grouped[date]
                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                .map(s => (
                                    <div key={s._id} className="schedule-row">
                                        <div className="schedule-row__time">
                                            {s.startTime} – {s.endTime}
                                        </div>
                                        <div className="schedule-row__body">
                                            <span className="schedule-row__class">
                                                {s.className ?? classes.find(c => c._id === s.classId)?.name ?? s.classId}
                                            </span>
                                            {s.title && (
                                                <span className="schedule-row__title"> · {s.title}</span>
                                            )}
                                        </div>
                                        {onGoToClass && (
                                            <button
                                                className="schedule-row__link"
                                                onClick={() => onGoToClass(s.classId)}
                                                title="Vào lớp"
                                            >
                                                Vào lớp →
                                            </button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Class picker modal (when >1 class) */}
            <Modal show={showClassPicker} onHide={() => setShowClassPicker(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title style={{ fontSize: 16 }}>Chọn lớp để thêm buổi</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="d-flex flex-column gap-2">
                        {classes.map(c => (
                            <Button
                                key={c._id}
                                variant="outline-primary"
                                className="text-start"
                                onClick={() => {
                                    setShowClassPicker(false)
                                    handleOpenAddModal(c._id)
                                }}
                            >
                                {c.name}
                            </Button>
                        ))}
                    </div>
                </Modal.Body>
            </Modal>

            {/* Add schedule form */}
            <ScheduleForm
                show={showAddModal}
                onHide={() => setShowAddModal(false)}
                onSubmit={handleAddSchedule}
                title={`Thêm buổi dạy — ${classes.find(c => c._id === addClassId)?.name ?? ''}`}
            />
        </div>
    )
}
