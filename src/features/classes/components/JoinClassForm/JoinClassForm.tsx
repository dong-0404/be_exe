import { useState } from 'react'
import { Form, Button, Alert, Spinner, Card } from 'react-bootstrap'
import type { ClassInfo } from '../../types'
import { classesApi } from '../../api/classesApi'
import './JoinClassForm.css'

interface JoinClassFormProps {
    onJoined?: (joinedClass: ClassInfo) => void
}

export const JoinClassForm = ({ onJoined }: JoinClassFormProps) => {
    const [inviteCode, setInviteCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<ClassInfo | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteCode.trim()) {
            setError('Vui lòng nhập mã mời')
            return
        }
        try {
            setLoading(true)
            setError(null)
            setSuccess(null)
            const res = await classesApi.joinClass({ inviteCode: inviteCode.trim() })
            if (res.success) {
                setSuccess(res.data.class)
                setInviteCode('')
                onJoined?.(res.data.class)
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Không thể tham gia lớp học'
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="join-class-card">
            <Card.Body>
                <div className="join-class-card__header">
                    <div className="join-class-card__icon">🔑</div>
                    <div>
                        <h6 className="join-class-card__title">Tham gia lớp học</h6>
                        <p className="join-class-card__desc">
                            Nhập mã mời từ gia sư để tham gia lớp học
                        </p>
                    </div>
                </div>

                {success && (
                    <Alert
                        variant="success"
                        dismissible
                        onClose={() => setSuccess(null)}
                        className="py-2 mb-3"
                    >
                        <strong>Tham gia thành công!</strong> Bạn đã vào lớp <strong>{success.name}</strong>
                    </Alert>
                )}

                {error && (
                    <Alert variant="danger" dismissible onClose={() => setError(null)} className="py-2 mb-3">
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit} className="d-flex gap-2">
                    <Form.Control
                        type="text"
                        value={inviteCode}
                        onChange={e => { setInviteCode(e.target.value.toUpperCase()); setError(null) }}
                        placeholder="Nhập mã mời (VD: ABC1234)"
                        maxLength={10}
                        style={{ letterSpacing: 2, fontWeight: 600, textTransform: 'uppercase' }}
                    />
                    <Button type="submit" variant="primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                        {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Tham gia'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    )
}
