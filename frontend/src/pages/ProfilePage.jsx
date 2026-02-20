import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Grid, Card, CardContent, Avatar, Chip, Stack,
    CircularProgress, Divider
} from '@mui/material';
import {
    Email, School, Phone, CalendarMonth, Event, CheckCircle, TrendingUp, Edit, Badge
} from '@mui/icons-material';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [attendance, setAttendance] = useState([]);

    useEffect(() => {
        api.get('/api/auth/me').then(r => setProfile(r.data.data)).catch(() => { });
        api.get('/api/registrations/my').then(r => setRegistrations(r.data.data || [])).catch(() => { });
        api.get('/api/attendance/my').then(r => setAttendance(r.data.data || [])).catch(() => { });
    }, []);

    if (!profile) return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress sx={{ color: '#C62828' }} /></Box>
        </DashboardLayout>
    );

    const attendanceRate = registrations.length > 0 ? Math.round((attendance.length / registrations.length) * 100) : 0;
    const roleLabels = { ADMIN: 'Administrator', ORGANIZER: 'Organizer', STUDENT: 'Student' };

    const infoItems = [
        { icon: <Email sx={{ fontSize: 20 }} />, label: 'Email', value: profile.email },
        { icon: <Badge sx={{ fontSize: 20 }} />, label: 'Student ID', value: profile.studentId || '—' },
        { icon: <School sx={{ fontSize: 20 }} />, label: 'Department', value: profile.department || '—' },
        { icon: <Phone sx={{ fontSize: 20 }} />, label: 'Phone', value: profile.phone || '—' },
        { icon: <CalendarMonth sx={{ fontSize: 20 }} />, label: 'Member Since', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
    ];

    const stats = [
        { label: 'Registered', value: registrations.length, icon: <Event sx={{ fontSize: 22 }} /> },
        { label: 'Attended', value: attendance.length, icon: <CheckCircle sx={{ fontSize: 22 }} /> },
        { label: 'Rate', value: `${attendanceRate}%`, icon: <TrendingUp sx={{ fontSize: 22 }} /> },
    ];

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/auth/me/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(res.data.data);
            updateUser(res.data.data);
        } catch (err) {
            console.error("Failed to upload profile picture", err);
        }
    };

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up">
                {/* Profile Header */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: { xs: 'center', md: 'flex-start' }, gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={profile.profilePicture ? `/${profile.profilePicture}` : undefined}
                                    sx={{
                                        width: 80, height: 80, bgcolor: '#C62828',
                                        fontSize: '2rem', fontWeight: 700, color: '#FFFFFF',
                                        cursor: 'pointer', border: '2px solid white', boxShadow: 2
                                    }} onClick={() => document.getElementById('profile-upload').click()}>
                                    {profile.fullName?.charAt(0)}
                                </Avatar>
                                <input
                                    type="file"
                                    id="profile-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Box sx={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    bgcolor: 'white', borderRadius: '50%', p: 0.5,
                                    boxShadow: 1, cursor: 'pointer', display: 'flex'
                                }} onClick={() => document.getElementById('profile-upload').click()}>
                                    <Edit sx={{ fontSize: 16, color: '#C62828' }} />
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121' }}>{profile.fullName}</Typography>
                                <Chip label={roleLabels[profile.role] || profile.role} size="small" sx={{
                                    mt: 1, bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828', fontWeight: 600,
                                }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* Activity Stats */}
                    <Grid item xs={12} md={4} className="animate-fade-in-up stagger-1">
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 3,
                                }}>Activity</Typography>
                                <Stack spacing={2.5}>
                                    {stats.map((s, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: '10px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: 'rgba(198,40,40,0.06)', color: '#C62828',
                                            }}>{s.icon}</Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1 }}>{s.value}</Typography>
                                                <Typography variant="caption" sx={{ color: '#757575' }}>{s.label}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>

                                {/* Attendance Progress */}
                                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E0E0E0', textAlign: 'center' }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress variant="determinate" value={100} size={90} thickness={5}
                                            sx={{ color: '#E0E0E0' }} />
                                        <CircularProgress variant="determinate" value={attendanceRate} size={90}
                                            thickness={5} sx={{ color: '#C62828', position: 'absolute', left: 0, '& circle': { strokeLinecap: 'round' } }} />
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>{attendanceRate}%</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#757575' }}>
                                        Attendance Rate
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Personal Info */}
                    <Grid item xs={12} md={8} className="animate-fade-in-up stagger-2">
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 3,
                                }}>Personal Information</Typography>
                                <Stack spacing={0}>
                                    {infoItems.map((item, i) => (
                                        <Box key={i}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                                <Box sx={{
                                                    width: 36, height: 36, borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: '#FAFAFA', color: '#757575',
                                                }}>{item.icon}</Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: '0.7rem' }}>{item.label}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#212121' }}>{item.value}</Typography>
                                                </Box>
                                            </Box>
                                            {i < infoItems.length - 1 && <Divider sx={{ borderColor: '#E0E0E0' }} />}
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </DashboardLayout>
    );
};

export default ProfilePage;
