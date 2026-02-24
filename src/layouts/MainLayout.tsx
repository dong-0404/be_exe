import { Outlet, Link, useNavigate } from 'react-router-dom'
import { Dropdown } from 'react-bootstrap'
import { routes } from '../config/routes'
import { Footer } from './Footer'
import { getCurrentUser, isAuthenticated, clearAuthData } from '../features/auth/utils/authHelpers'
import { NotificationBell } from '../features/chat/components/NotificationBell'

export const MainLayout = () => {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const isLoggedIn = isAuthenticated()

  const handleLogout = () => {
    clearAuthData()
    navigate(routes.login, {
      replace: true,
      state: { message: 'Đã đăng xuất thành công' }
    })
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="bg-primary text-white sticky-top" style={{ zIndex: 1000 }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center py-3">
            <Link to={routes.home} className="text-white text-decoration-none d-flex align-items-center gap-2">
              <div className="bg-white text-primary rounded d-flex align-items-center justify-content-center fw-bold" style={{ width: '40px', height: '40px' }}>
                H
              </div>
              <span className="fs-4 fw-bold">Bridgy</span>
            </Link>
            <nav className="d-flex gap-4">
              <Link to={routes.home} className="text-white text-decoration-none">Trang chủ</Link>
              <Link to={routes.findTutor} className="text-white text-decoration-none">Tìm kiếm gia sư</Link>
              <Link to={routes.community} className="text-white text-decoration-none">Post bài</Link>
              <Link to={routes.schedule} className="text-white text-decoration-none">Lịch học</Link>
            </nav>

            {/* Conditional: Login button hoặc User profile */}
            {!isLoggedIn ? (
              <Link to={routes.login} className="bg-white text-primary px-4 py-2 rounded text-decoration-none fw-medium d-flex align-items-center gap-2">
                <span>Đăng nhập</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z" fill="currentColor" />
                  <path d="M10 12C5.58172 12 2 13.7909 2 16V20H18V16C18 13.7909 14.4183 12 10 12Z" fill="currentColor" />
                </svg>
              </Link>
            ) : (
              <div className="d-flex align-items-center gap-3">
                <NotificationBell />
                <Dropdown align="end">
                  <Dropdown.Toggle
                    variant="light"
                    id="user-dropdown"
                    className="d-flex align-items-center gap-2 border-0"
                    style={{ backgroundColor: 'white', color: '#0066cc' }}
                  >
                    <div
                      className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                      style={{ width: '36px', height: '36px', fontSize: '14px', fontWeight: 'bold' }}
                    >
                      {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="fw-medium">
                      {currentUser?.email?.split('@')[0] || 'User'}
                    </span>
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate(routes.profile)}>
                      👤 Hồ sơ của tôi
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate(routes.chat)}>
                      💬 Chat
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate('/settings')}>
                      ⚙️ Cài đặt
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      🚪 Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow-1" style={{ margin: 0, padding: 0, width: '100%' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

