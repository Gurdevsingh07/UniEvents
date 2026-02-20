import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import theme from './theme';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventsListPage from './pages/EventsListPage';
import EventDetailPage from './pages/EventDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import CreateEventPage from './pages/CreateEventPage';
import AttendanceScanPage from './pages/AttendanceScanPage';
import ReportsPage from './pages/ReportsPage';
import CreateOrganizerPage from './pages/CreateOrganizerPage';
import ProfilePage from './pages/ProfilePage';

import StudentRegistrations from './pages/StudentRegistrations';
import StudentAttendance from './pages/StudentAttendance';
import OrganizerEvents from './pages/OrganizerEvents';
import OrganizerHistory from './pages/OrganizerHistory';

import StudentEvents from './pages/StudentEvents';

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                    <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/events" element={<EventsListPage />} />
                        <Route path="/events/:id" element={<EventDetailPage />} />

                        {/* Student routes */}
                        <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
                        <Route path="/student/events" element={<ProtectedRoute roles={['STUDENT']}><StudentEvents /></ProtectedRoute>} />
                        <Route path="/student/registrations" element={<ProtectedRoute roles={['STUDENT']}><StudentRegistrations /></ProtectedRoute>} />
                        <Route path="/student/attendance" element={<ProtectedRoute roles={['STUDENT']}><StudentAttendance /></ProtectedRoute>} />
                        <Route path="/student/profile" element={<ProtectedRoute roles={['STUDENT']}><ProfilePage /></ProtectedRoute>} />

                        {/* Organizer routes */}
                        <Route path="/organizer" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerDashboard /></ProtectedRoute>} />
                        <Route path="/organizer/events" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerEvents /></ProtectedRoute>} />
                        <Route path="/organizer/history" element={<ProtectedRoute roles={['ORGANIZER']}><OrganizerHistory /></ProtectedRoute>} />
                        <Route path="/organizer/create-event" element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><CreateEventPage /></ProtectedRoute>} />
                        <Route path="/organizer/scan" element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><AttendanceScanPage /></ProtectedRoute>} />
                        <Route path="/organizer/scan/:eventId" element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><AttendanceScanPage /></ProtectedRoute>} />
                        <Route path="/organizer/reports/:eventId" element={<ProtectedRoute roles={['ORGANIZER', 'ADMIN']}><ReportsPage /></ProtectedRoute>} />
                        <Route path="/organizer/profile" element={<ProtectedRoute roles={['ORGANIZER']}><ProfilePage /></ProtectedRoute>} />

                        {/* Admin routes */}
                        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
                        <Route path="/admin/events" element={<ProtectedRoute roles={['ADMIN']}><OrganizerEvents /></ProtectedRoute>} />
                        <Route path="/admin/history" element={<ProtectedRoute roles={['ADMIN']}><OrganizerHistory /></ProtectedRoute>} />
                        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagement /></ProtectedRoute>} />
                        <Route path="/admin/create-organizer" element={<ProtectedRoute roles={['ADMIN']}><CreateOrganizerPage /></ProtectedRoute>} />
                        <Route path="/admin/create-event" element={<ProtectedRoute roles={['ADMIN']}><CreateEventPage /></ProtectedRoute>} />
                        <Route path="/admin/profile" element={<ProtectedRoute roles={['ADMIN']}><ProfilePage /></ProtectedRoute>} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
