import { useState, useEffect } from 'react'
import { Button, Card, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap'
import type { ClassInfo } from '../../types'
import { classesApi } from '../../api/classesApi'
import { CreateClassModal } from '../CreateClassModal'
import './ClassList.css'

interface ClassListProps {
    onSelectClass: (classId: string) => void
}

export const ClassList = ({ onSelectClass }: ClassListProps) => {
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    const loadClasses = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await classesApi.getMyClasses()
            if (res.success) setClasses(res.data)
        } catch {
            setError('Không thể tải danh sách lớp học')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadClasses()
    }, [])

    const handleCopyCode = (cls: ClassInfo, e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(cls.inviteCode).then(() => {
            setCopiedId(cls._id)
            setTimeout(() => setCopiedId(null), 2000)
        })
    }

    const handleCreated = (newClass: ClassInfo) => {
        setClasses(prev => [...prev, newClass])
    }

    const isFull = (cls: ClassInfo) => cls.currentStudents >= cls.maxStudents

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
                <Spinner animation="border" variant="primary" />
                <span className="ms-3 text-muted">Đang tải...</span>
            </div>
        )
    }

    return (
        <div className="class-list-container">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h5 style={{ fontWeight: 600, margin: 0 }}>Danh sách lớp học</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                        {classes.length} lớp học
                    </p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    + Tạo lớp học
                </Button>
            </div>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {classes.length === 0 ? (
                <div className="class-list-empty">
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                    <h6>Chưa có lớp học nào</h6>
                    <p className="text-muted">Tạo lớp học đầu tiên để bắt đầu dạy học</p>
                    <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                        + Tạo lớp học
                    </Button>
                </div>
            ) : (
                <Row className="g-3">
                    {classes.map(cls => (
                        <Col key={cls._id} xs={12} md={6} xl={4}>
                            <Card
                                className={`class-card ${isFull(cls) ? 'class-card--full' : ''}`}
                                onClick={() => onSelectClass(cls._id)}
                            >
                                <Card.Body>
                                    <div className="class-card__header">
                                        <div className="class-card__icon">📚</div>
                                        {isFull(cls) && (
                                            <Badge bg="danger" className="class-card__badge">Đầy</Badge>
                                        )}
                                    </div>
                                    <h6 className="class-card__name">{cls.name}</h6>
                                    {cls.subjectName && (
                                        <div className="class-card__meta">
                                            <Badge bg="light" text="dark" className="me-1">{cls.subjectName}</Badge>
                                            {cls.gradeName && <Badge bg="light" text="dark">{cls.gradeName}</Badge>}
                                        </div>
                                    )}
                                    <div className="class-card__stats">
                                        <div className="class-card__stat">
                                            <span className="class-card__stat-icon">👥</span>
                                            <span>
                                                <strong>{cls.currentStudents}</strong>/{cls.maxStudents} học sinh
                                            </span>
                                        </div>
                                    </div>
                                    <div className="class-card__invite">
                                        <span className="class-card__invite-label">Mã mời:</span>
                                        <span className="class-card__invite-code">{cls.inviteCode}</span>
                                        <button
                                            className={`class-card__copy-btn ${copiedId === cls._id ? 'copied' : ''}`}
                                            onClick={(e) => handleCopyCode(cls, e)}
                                            title="Sao chép mã mời"
                                        >
                                            {copiedId === cls._id ? '✓' : '⧉'}
                                        </button>
                                    </div>
                                    <div className="class-card__footer">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            className="w-100"
                                            onClick={(e) => { e.stopPropagation(); onSelectClass(cls._id) }}
                                        >
                                            Vào lớp
                                        </Button>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <CreateClassModal
                show={showCreateModal}
                onHide={() => setShowCreateModal(false)}
                onCreated={handleCreated}
            />
        </div>
    )
}
