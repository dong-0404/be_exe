import { useState, useEffect } from 'react'
import { Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { ProfileLayout } from '../../layouts/ProfileLayout'
import { ProfileHeader } from '../../features/profile/components/ProfileHeader'
import { AvatarUpload } from '../../features/profile/components/AvatarUpload'
import { getCurrentUser } from '../../features/auth/utils/authHelpers'
import { UserRole } from '../../features/auth/types'
import { profileApi } from '../../features/profile/api/profileApi'
import { routes } from '../../config/routes'
import type { StudentProfileData } from '../../features/profile/types/studentProfile'
import { StudentScheduleView } from '../../features/classes/components/StudentScheduleView'
import './ProfilePage.css'

export const StudentProfilePage = () => {
    const navigate = useNavigate()
    const currentUser = getCurrentUser()
    const [activeTab, setActiveTab] = useState('profile')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [avatarFile, setAvatarFile] = useState<File | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        fullName: '',
        email: currentUser?.email || '',
        phone: currentUser?.phone || '',
        grade: '',
        school: '',
        gender: 1,
        dateOfBirth: '',
        address: '',
        avatar: ''
    })

    // Load profile data on mount
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await profileApi.getStudentProfile()

                if (response.success && response.data) {
                    const profile: StudentProfileData = response.data

                    // Format date for input[type="date"]
                    const formattedDate = profile.dateOfBirth
                        ? new Date(profile.dateOfBirth).toISOString().split('T')[0]
                        : ''

                    setFormData({
                        fullName: profile.fullName || '',
                        email: profile.userId.email || currentUser?.email || '',
                        phone: profile.userId.phone || '',
                        grade: profile.grade || '',
                        school: profile.school || '',
                        gender: Number(profile.gender) || 1,  // Ensure it's a number
                        dateOfBirth: formattedDate,
                        address: profile.address || '',
                        avatar: profile.avatarUrl || ''
                    })
                } else {
                    // Không có profile data, redirect về trang setup
                    navigate(routes.setupStudent, { replace: true })
                    return
                }
            } catch (err) {
                console.error('Load profile error:', err)
                // Nếu lỗi khi load profile (chưa có profile), redirect về setup
                navigate(routes.setupStudent, { replace: true })
                return
            } finally {
                setLoading(false)
            }
        }

        loadProfile()
    }, [currentUser?.email, navigate])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear messages when user types
        setError(null)
        setSuccessMessage(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            setSaving(true)
            setError(null)
            setSuccessMessage(null)

            // Prepare payload
            const payload = {
                fullName: formData.fullName,
                gender: Number(formData.gender),  // Ensure it's a number
                dateOfBirth: formData.dateOfBirth,
                grade: formData.grade,
                school: formData.school,
                address: formData.address,
            }

            const response = await profileApi.updateStudentProfile(payload, avatarFile || undefined)

            if (response.success) {
                setSuccessMessage('Cập nhật hồ sơ thành công!')

                // Update avatar preview if uploaded
                if (response.data.avatarUrl) {
                    setFormData(prev => ({ ...prev, avatar: response.data.avatarUrl || '' }))
                }

                // Clear avatar file after successful upload
                setAvatarFile(null)

                // Auto hide success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000)
            }
        } catch (err) {
            console.error('Save profile error:', err)
            const errorMessage = err instanceof Error ? err.message : 'Không thể lưu thông tin hồ sơ'
            setError(errorMessage)
        } finally {
            setSaving(false)
        }
    }

    const handleAvatarChange = (file: File) => {
        setAvatarFile(file)
        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setFormData(prev => ({ ...prev, avatar: previewUrl }))
    }

    // Loading state
    if (loading) {
        return (
            <ProfileLayout
                role={UserRole.STUDENT}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            >
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                    <Spinner animation="border" variant="primary" />
                    <span className="ms-3">Đang tải thông tin...</span>
                </div>
            </ProfileLayout>
        )
    }

    return (
        <ProfileLayout
            role={UserRole.STUDENT}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === 'profile' && (
                <>
                    <ProfileHeader
                        title="Hồ sơ của tôi"
                        description="Quản lý thông tin hồ sơ để bảo mật tài khoản"
                    />

                    {/* Success/Error Messages */}
                    {successMessage && (
                        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
                            {successMessage}
                        </Alert>
                    )}
                    {error && (
                        <Alert variant="danger" dismissible onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    )}

                    <Card className="profile-card">
                        <Card.Body>
                            <h5 className="section-title mb-4">Thông tin học sinh</h5>

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col lg={8}>
                                        {/* Họ và tên */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Họ và tên</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <Form.Control
                                                        type="text"
                                                        name="fullName"
                                                        value={formData.fullName}
                                                        onChange={handleChange}
                                                        placeholder="Nhập họ và tên"
                                                    />
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Học sinh lớp */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Học sinh lớp</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <Form.Control
                                                        type="text"
                                                        name="grade"
                                                        value={formData.grade}
                                                        onChange={handleChange}
                                                        placeholder="Lớp 10"
                                                    />
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Trường học */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Trường học</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <Form.Control
                                                        type="text"
                                                        name="school"
                                                        value={formData.school}
                                                        onChange={handleChange}
                                                        placeholder="Trung học cơ sở Yên Bình"
                                                    />
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Giới tính */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Giới tính</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <div className="d-flex gap-4">
                                                        <Form.Check
                                                            type="radio"
                                                            label="Nam"
                                                            name="gender"
                                                            value="1"
                                                            checked={formData.gender === 1}
                                                            onChange={() => setFormData(prev => ({ ...prev, gender: 1 }))}
                                                        />
                                                        <Form.Check
                                                            type="radio"
                                                            label="Nữ"
                                                            name="gender"
                                                            value="2"
                                                            checked={formData.gender === 2}
                                                            onChange={() => setFormData(prev => ({ ...prev, gender: 2 }))}
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Ngày sinh */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Ngày sinh</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <Form.Control
                                                        type="date"
                                                        name="dateOfBirth"
                                                        value={formData.dateOfBirth}
                                                        onChange={handleChange}
                                                    />
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Khu vực sống */}
                                        <Form.Group className="mb-3 profile-form-group">
                                            <Row>
                                                <Col sm={3}>
                                                    <Form.Label className="profile-label">Khu vực sống</Form.Label>
                                                </Col>
                                                <Col sm={9}>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <Form.Control
                                                            type="text"
                                                            name="address"
                                                            value={formData.address}
                                                            onChange={handleChange}
                                                            placeholder="123 Đường ABC, Quận 1, TP.HCM"
                                                        />
                                                    </div>
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        {/* Submit Button */}
                                        <div className="text-center">
                                            <Button
                                                type="submit"
                                                className="btn-save-profile"
                                                disabled={saving}
                                            >
                                                {saving ? (
                                                    <>
                                                        <Spinner
                                                            as="span"
                                                            animation="border"
                                                            size="sm"
                                                            role="status"
                                                            aria-hidden="true"
                                                            className="me-2"
                                                        />
                                                        Đang lưu...
                                                    </>
                                                ) : (
                                                    'Lưu'
                                                )}
                                            </Button>
                                        </div>
                                    </Col>

                                    {/* Avatar Upload */}
                                    <Col lg={4}>
                                        <AvatarUpload
                                            currentAvatar={formData.avatar}
                                            onAvatarChange={handleAvatarChange}
                                        />
                                    </Col>
                                </Row>
                            </Form>
                        </Card.Body>
                    </Card>
                </>
            )}

            {activeTab === 'password' && (
                <div>
                    <ProfileHeader
                        title="Đổi mật khẩu"
                        description="Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác"
                    />
                    {/* Password change form will be here */}
                    <Card className="profile-card">
                        <Card.Body>
                            <p>Đổi mật khẩu content here...</p>
                        </Card.Body>
                    </Card>
                </div>
            )}

            {activeTab === 'schedule' && (
                <div>
                    <ProfileHeader
                        title="Quản lý lịch học"
                        description="Xem lịch học, tham gia lớp và điểm danh của bạn"
                    />
                    <div style={{ marginTop: 24 }}>
                        <StudentScheduleView />
                    </div>
                </div>
            )}
        </ProfileLayout>
    )
}
