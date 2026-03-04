import { Nav } from 'react-bootstrap'
import { UserRole } from '../../auth/types'
import { getCurrentUser } from '../../auth/utils/authHelpers'
import './ProfileSidebar.css'

interface ProfileSidebarProps {
    role: UserRole
    activeTab: string
    onTabChange: (tab: string) => void
}

export const ProfileSidebar = ({ role, activeTab, onTabChange }: ProfileSidebarProps) => {
    const currentUser = getCurrentUser()

    // Menu items theo role
    const getMenuItems = () => {
        const commonItems = [
            { id: 'profile', label: 'Hồ sơ', icon: '👤', section: 'account' },
            { id: 'password', label: 'Đổi mật khẩu', icon: '🔑', section: 'account' }
        ]

        const roleSpecificItems = {
            [UserRole.STUDENT]: [
                { id: 'schedule', label: 'Quản lý lịch học', icon: '📋', section: 'other' }
            ],
            [UserRole.TUTOR]: [
                { id: 'classes', label: 'Lớp học', icon: '📚', section: 'other' },
                { id: 'schedule', label: 'Quản lý lịch dạy', icon: '📅', section: 'other' },
                { id: 'students', label: 'Quản lý học viên', icon: '👥', section: 'other' },
                { id: 'earnings', label: 'Thống kê thu nhập', icon: '💰', section: 'other' }
            ],
            [UserRole.PARENT]: [
                { id: 'children', label: 'Quản lý con cái', icon: '👨‍👩‍👧', section: 'other' },
                { id: 'schedule', label: 'Lịch học của con', icon: '📋', section: 'other' },
                { id: 'payment', label: 'Quản lý thanh toán', icon: '💳', section: 'other' }
            ]
        }

        return [...commonItems, ...(roleSpecificItems[role] || [])]
    }

    const accountMenuItems = getMenuItems().filter(item => item.section === 'account')
    const otherMenuItems = getMenuItems().filter(item => item.section === 'other')

    return (
        <div className="profile-sidebar">
            {/* User Info */}
            <div className="sidebar-user-info">
                <div className="user-avatar-wrapper">
                    <div className="user-avatar">
                        <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none">
                            <circle cx="50" cy="50" r="50" fill="#E0E7FF" />
                            <circle cx="50" cy="35" r="15" fill="#6366F1" />
                            <path d="M20 75 Q20 55 50 55 Q80 55 80 75" fill="#6366F1" />
                        </svg>
                    </div>
                </div>
                <h6 className="user-name">{currentUser?.email || 'User'}</h6>
                <button className="btn-edit-profile">
                    Sửa hồ sơ 📝
                </button>
            </div>

            {/* Menu */}
            <div className="sidebar-menu">
                <div className="menu-section">
                    <h6 className="menu-section-title">
                        <span className="menu-icon">👤</span>
                        Tài khoản của tôi
                    </h6>
                    <Nav className="flex-column">
                        {accountMenuItems.map(item => (
                            <Nav.Link
                                key={item.id}
                                className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => onTabChange(item.id)}
                            >
                                <span className="menu-label">{item.label}</span>
                            </Nav.Link>
                        ))}
                    </Nav>
                </div>

                {otherMenuItems.length > 0 && otherMenuItems.map(item => (
                    <div key={item.id} className="menu-section">
                        <Nav className="flex-column">
                            <Nav.Link
                                className={`sidebar-menu-item ${activeTab === item.id ? 'active' : ''}`}
                                onClick={() => onTabChange(item.id)}
                            >
                                <span className="menu-icon">{item.icon}</span>
                                <span className="menu-label">{item.label}</span>
                            </Nav.Link>
                        </Nav>
                    </div>
                ))}
            </div>
        </div>
    )
}
