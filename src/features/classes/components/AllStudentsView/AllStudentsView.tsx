import { useState, useEffect } from 'react'
import { Spinner, Alert, Form, Table, Badge, Button } from 'react-bootstrap'
import type { TutorAllStudents, ClassInfo } from '../../types'
import { classesApi } from '../../api/classesApi'
import './AllStudentsView.css'

interface AllStudentsViewProps {
    onGoToClass?: (classId: string) => void
}

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN')

export const AllStudentsView = ({ onGoToClass }: AllStudentsViewProps) => {
    const [students, setStudents] = useState<TutorAllStudents[]>([])
    const [classes, setClasses] = useState<ClassInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterClassId, setFilterClassId] = useState('')
    const [searchName, setSearchName] = useState('')

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true)
                setError(null)
                const [studRes, classRes] = await Promise.all([
                    classesApi.getAllStudents(),
                    classesApi.getMyClasses(),
                ])
                setStudents(studRes.data ?? [])
                setClasses(classRes.data ?? [])
            } catch {
                setError('Không thể tải danh sách học viên')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filtered = students.filter(s => {
        const matchClass = filterClassId ? s.classId === filterClassId : true
        const matchName = searchName
            ? s.fullName.toLowerCase().includes(searchName.toLowerCase()) ||
              (s.email ?? '').toLowerCase().includes(searchName.toLowerCase())
            : true
        return matchClass && matchName
    })

    // Unique students count (a student can be in multiple classes)
    const uniqueIds = new Set(filtered.map(s => s.studentId))

    return (
        <div className="all-students-container">
            {/* Toolbar */}
            <div className="all-students-toolbar">
                <div>
                    <h5 style={{ fontWeight: 600, margin: 0 }}>Danh sách học viên</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                        {filtered.length} học viên{uniqueIds.size !== filtered.length && ` (${uniqueIds.size} học sinh, ${filtered.length} lượt tham gia)`}
                    </p>
                </div>
                <div className="d-flex gap-2 flex-wrap align-items-center">
                    <Form.Control
                        size="sm"
                        placeholder="Tìm kiếm theo tên, email..."
                        value={searchName}
                        onChange={e => setSearchName(e.target.value)}
                        style={{ width: 220 }}
                    />
                    <Form.Select
                        size="sm"
                        style={{ width: 180 }}
                        value={filterClassId}
                        onChange={e => setFilterClassId(e.target.value)}
                    >
                        <option value="">Tất cả lớp</option>
                        {classes.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                    </Form.Select>
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
            ) : filtered.length === 0 ? (
                <div className="all-students-empty">
                    <div style={{ fontSize: 48 }}>👥</div>
                    <p className="text-muted mt-2">
                        {searchName || filterClassId ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên nào'}
                    </p>
                </div>
            ) : (
                <div className="all-students-table-wrap">
                    <Table hover responsive className="all-students-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Học viên</th>
                                <th>Email</th>
                                <th>Số điện thoại</th>
                                <th>Lớp học</th>
                                <th>Ngày tham gia</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, idx) => (
                                <tr key={`${s.studentId}-${s.classId}`}>
                                    <td style={{ color: '#888', fontSize: 13 }}>{idx + 1}</td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="student-avatar">
                                                {s.fullName.charAt(0)}
                                            </div>
                                            <span style={{ fontWeight: 500 }}>{s.fullName}</span>
                                        </div>
                                    </td>
                                    <td style={{ fontSize: 14, color: '#555' }}>{s.email ?? '—'}</td>
                                    <td style={{ fontSize: 14, color: '#555' }}>{s.phone ?? '—'}</td>
                                    <td>
                                        <Badge
                                            bg="light"
                                            text="dark"
                                            style={{ fontWeight: 500, fontSize: 12, cursor: onGoToClass ? 'pointer' : 'default' }}
                                            onClick={() => onGoToClass && onGoToClass(s.classId)}
                                        >
                                            {s.className}
                                        </Badge>
                                    </td>
                                    <td style={{ fontSize: 13, color: '#888' }}>{formatDate(s.joinedAt)}</td>
                                    <td>
                                        {onGoToClass && (
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0"
                                                style={{ fontSize: 13 }}
                                                onClick={() => onGoToClass(s.classId)}
                                            >
                                                Vào lớp →
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            )}
        </div>
    )
}
