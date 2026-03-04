import { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import type { ClassSchedule, UpdateSchedulePayload } from '../../types'

interface ScheduleFormProps {
    show: boolean
    onHide: () => void
    onSubmit: (data: {
        date: string
        startTime: string
        endTime: string
        title?: string
    }) => Promise<void>
    editData?: ClassSchedule | null
    title?: string
}

export const ScheduleForm = ({ show, onHide, onSubmit, editData, title }: ScheduleFormProps) => {
    const [formData, setFormData] = useState({
        date: '',
        startTime: '',
        endTime: '',
        title: '',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (editData) {
            setFormData({
                date: editData.date,
                startTime: editData.startTime,
                endTime: editData.endTime,
                title: editData.title ?? '',
            })
        } else {
            setFormData({ date: '', startTime: '', endTime: '', title: '' })
        }
        setError(null)
    }, [editData, show])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        setError(null)
    }

    const validate = (): string | null => {
        if (!formData.date) return 'Vui lòng chọn ngày'
        if (!formData.startTime) return 'Vui lòng chọn giờ bắt đầu'
        if (!formData.endTime) return 'Vui lòng chọn giờ kết thúc'
        if (formData.startTime >= formData.endTime) return 'Giờ kết thúc phải sau giờ bắt đầu'
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const err = validate()
        if (err) { setError(err); return }
        try {
            setLoading(true)
            setError(null)
            await onSubmit({
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                title: formData.title.trim() || undefined,
            })
            onHide()
        } catch {
            setError('Có lỗi xảy ra, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: 17, fontWeight: 600 }}>
                    {title ?? (editData ? 'Sửa buổi học' : 'Thêm buổi học')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {error && <Alert variant="danger" className="py-2 mb-3">{error}</Alert>}

                    <Form.Group className="mb-3">
                        <Form.Label style={{ fontWeight: 500 }}>
                            Ngày học <span className="text-danger">*</span>
                        </Form.Label>
                        <Form.Control
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                        />
                    </Form.Group>

                    <Row className="mb-3">
                        <Col>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 500 }}>
                                    Giờ bắt đầu <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label style={{ fontWeight: 500 }}>
                                    Giờ kết thúc <span className="text-danger">*</span>
                                </Form.Label>
                                <Form.Control
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Form.Group className="mb-4">
                        <Form.Label style={{ fontWeight: 500 }}>Nội dung buổi học</Form.Label>
                        <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="VD: Chương 1: Hàm số bậc nhất"
                        />
                    </Form.Group>

                    <div className="d-flex gap-2">
                        <Button variant="outline-secondary" onClick={onHide} className="flex-fill" type="button">
                            Hủy
                        </Button>
                        <Button type="submit" variant="primary" className="flex-fill" disabled={loading}>
                            {loading ? (
                                <>
                                    <Spinner as="span" size="sm" animation="border" className="me-2" />
                                    Đang lưu...
                                </>
                            ) : (editData ? 'Lưu thay đổi' : 'Thêm buổi học')}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    )
}

// Re-export UpdateSchedulePayload type for convenience
export type { UpdateSchedulePayload }
