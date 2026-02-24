import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { HomePage } from '../pages/Home/HomePage'
import { AboutPage } from '../pages/About/AboutPage'
import { ContactPage } from '../pages/Contact'
import { PrivacyPolicyPage } from '../pages/PrivacyPolicy'
import { FindTutorPage } from '../pages/FindTutor/FindTutorPage'
import { TutorDetailPage } from '../pages/TutorDetail'
import { CommunityPage } from '../pages/Community'
import { ChatPage } from '../pages/Chat'
import { LoginPage, RegisterPage, OTPVerificationPage } from '../pages/Auth'
import {
    StudentProfilePage,
    TutorProfilePage,
    ParentProfilePage,
    ProfileRedirect
} from '../pages/Profile'
import { StudentSetupPage, TutorSetupPage, ParentSetupPage } from '../pages/Setup'
import { NotFoundPage } from '../pages/NotFoundPage'
import { routes } from '../config/routes'

export const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path={routes.home} element={<HomePage />} />
                <Route path={routes.about} element={<AboutPage />} />
                <Route path={routes.contact} element={<ContactPage />} />
                <Route path={routes.privacyPolicy} element={<PrivacyPolicyPage />} />
                <Route path={routes.findTutor} element={<FindTutorPage />} />
                <Route path={routes.tutorDetail} element={<TutorDetailPage />} />
                
                {/* Protected Routes - Require Authentication */}
                <Route 
                    path={routes.community} 
                    element={
                        <ProtectedRoute>
                            <CommunityPage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path={routes.chat} 
                    element={
                        <ProtectedRoute>
                            <ChatPage />
                        </ProtectedRoute>
                    } 
                />

                {/* Profile Routes (with MainLayout - Header & Footer) */}
                <Route 
                    path={routes.profile} 
                    element={
                        <ProtectedRoute>
                            <ProfileRedirect />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path={routes.studentProfile} 
                    element={
                        <ProtectedRoute>
                            <StudentProfilePage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path={routes.tutorProfile} 
                    element={
                        <ProtectedRoute>
                            <TutorProfilePage />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path={routes.parentProfile} 
                    element={
                        <ProtectedRoute>
                            <ParentProfilePage />
                        </ProtectedRoute>
                    } 
                />
            </Route>

            {/* Auth Routes (without MainLayout) */}
            <Route path={routes.login} element={<LoginPage />} />
            <Route path={routes.register} element={<RegisterPage />} />
            <Route path={routes.otpVerification} element={<OTPVerificationPage />} />

            {/* Setup Routes (first-time form after OTP - without MainLayout) */}
            <Route path={routes.setupStudent} element={<StudentSetupPage />} />
            <Route path={routes.setupTutor} element={<TutorSetupPage />} />
            <Route path={routes.setupParent} element={<ParentSetupPage />} />

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}

