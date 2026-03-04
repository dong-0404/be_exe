import { useState } from 'react'
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import type { ClassInfo, CreateClassPayload } from '../../types'
import { classesApi } from '../../api/classesApi'

interface CreateClassModalProps {
    show: boolean
    onHide: () => void
    onCreated: (newClass: ClassInfo) => void
}

export const CreateClassModal = ({ show, onHide, onCreated }: CreateClassModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        maxStudents: 5,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [createdClass, setCreatedClass] = useState<ClassInfo | null>(null)
    const [copied, setCopied] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxStudents' ? Number(value) : value,
        }))
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            setError('Vui lòng nhập tên lớp')
            return
        }
        if (formData.maxStudents < 1 || formData.maxStudents > 50) {
            setError('Số học sinh tối đa phải từ 1 đến 50')
            return
        }

        try {
            setLoading(true)
            setError(null)
            const payload: CreateClassPayload = {
                name: formData.name.trim(),
                maxStudents: formData.maxStudents,
            }
            const res = await classesApi.createClass(payload)
            if (res.success) {
                setCreatedClass(res.data)
                onCreated(res.data)
            }
        } catch {
            setError('Tạo lớp thất bại, vui lòng thử lại')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyCode = () => {
        if (!createdClass) return
        navigator.clipboard.writeText(createdClass.inviteCode).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleClose = () => {
        setFormData({ name: '', maxStudents: 5 })
        setError(null)
        setCreatedClass(null)
        setCopied(false)
        onHide()
    }

    return (
        <Modal show={show} onHide={handleClose} centered size="md">
            <Modal.Header closeButton>
                <Modal.Title style={{ fontSize: '18px', fontWeight: 600 }}>
                    {createdClass ? 'Lớp học đã được tạo!' : 'Tạo lớp học mới'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {createdClass ? (
                    <div className="text-center py-2">
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: '#e8f5e9', margin: '0 auto 16px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28,
                        }}>
                            ✅
                        </div>
                        <h5 className="mb-1">{createdClass.name}</h5>
                        <p className="text-muted mb-4">
                            Chia sẻ mã mời bên dưới để học sinh tham gia lớp
                        </p>
                        <div style={{
                            background: '#f0f4ff',
                            border: '2px dashed #0066cc',
                            borderRadius: 12,
                            padding: '20px 24px',
                            marginBottom: 20,
                        }}>
                            <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Mã mời lớp học</div>
                            <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: 6, color: '#0066cc' }}>
                                {createdClass.inviteCode}
                            </div>
                        </div>
                        <Button
                            variant={copied ? 'success' : 'outline-primary'}
                            className="w-100 mb-2"
                            onClick={handleCopyCode}
                        >
                            {copied ? '✓ Đã sao chép!' : 'Sao chép mã mời'}
                        </Button>
                        <div className="text-muted" style={{ fontSize: 13 }}>
                            Số học sinh tối đa: <strong>{createdClass.maxStudents}</strong> học sinh
                        </div>
                    </div>
                ) : (
                    <Form onSubmit={handleSubmit}>
                        {error && (
                            <Alert variant="danger" className="mb-3 py-2">
                                {error}
                            </Alert>
                        )}
                        <Form.Group className="mb-3">
                            <Form.Label style={{ fontWeight: 500 }}>
                                Tên lớp <span className="text-danger">*</span>
                            </Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="VD: Toán Lớp 10 - Nhóm A"
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label style={{ fontWeight: 500 }}>
                                Số học sinh tối đa <span className="text-danger">*</span>
                            </Form.Label>
                            <Row>
                                <Col xs={6}>
                                    <Form.Control
                                        type="number"
                                        name="maxStudents"
                                        value={formData.maxStudents}
                                        onChange={handleChange}
                                        min={1}
                                        max={50}
                                    />
                                </Col>
                                <Col xs={6} className="d-flex align-items-center">
                                    <span className="text-muted" style={{ fontSize: 14 }}>học sinh</span>
                                </Col>
                            </Row>
                        </Form.Group>
                        <div className="d-flex gap-2">
                            <Button variant="outline-secondary" onClick={handleClose} className="flex-fill">
                                Hủy
                            </Button>
                            <Button type="submit" variant="primary" className="flex-fill" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Spinner as="span" size="sm" animation="border" className="me-2" />
                                        Đang tạo...
                                    </>
                                ) : 'Tạo lớp học'}
                            </Button>
                        </div>
                    </Form>
                )}
            </Modal.Body>
            {createdClass && (
                <Modal.Footer>
                    <Button variant="primary" onClick={handleClose} className="w-100">
                        Xong
                    </Button>
                </Modal.Footer>
            )}
        </Modal>
    )
}
