import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import LiveStatusChip from '../components/LiveStatusChip';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import StatCard from '../components/StatCard';
import {
    Box, Typography, Grid, Card, CardContent, Stack, Button, Alert, Snackbar, Skeleton,
    useTheme, alpha, Avatar, IconButton, Divider, Chip
} from '@mui/material';
import {
    Event, CheckCircle, CalendarMonth, LocationOn,
    TrendingUp, ArrowForward, EmojiEvents, Add, Assessment,
    NotificationsActive, Bolt, School, WorkspacePremium
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [stats, setStats] = useState({ registered: 0, attended: 0, absent: 0, rate: 0 });
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const refreshData = async () => {
        try {
            const [regRes, attRes, upRes] = await Promise.all([
                api.get('/api/registrations/my'),
                api.get('/api/attendance/my'),
                api.get('/api/events/upcoming')
            ]);

            const regs = regRes.data.data || [];
            const regCount = regs.length;
            const attCount = (attRes.data.data || []).length;
            const absentCount = regs.filter(r => r.attendanceStatus === 'ABSENT').length;
            const rate = regCount > 0 ? Math.round((attCount / (attCount + absentCount || 1)) * 100) : 0;

            const registeredIds = new Set(regs.map(r => r.eventId));
            const recommendations = (upRes.data.data || [])
                .filter(ev => !registeredIds.has(ev.id) && ev.registeredCount < ev.capacity)
                .slice(0, 3);

            const myUpcoming = regs.filter(r => r.attendanceStatus === 'UPCOMING').slice(0, 3);

            setStats({ registered: regCount, attended: attCount, absent: absentCount, rate });
            setUpcomingEvents(recommendations);
            setMyRegistrations(myUpcoming);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load dashboard data', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshData(); }, []);
    useAutoRefresh(refreshData);

    const statCards = [
        { label: 'Registered', value: stats.registered, icon: <Event sx={{ fontSize: 24 }} />, color: '#64748b' },
        { label: 'Attended', value: stats.attended, icon: <CheckCircle sx={{ fontSize: 24 }} />, color: '#10B981' },
        { label: 'Absents', value: stats.absent, icon: <Event sx={{ fontSize: 24 }} />, color: '#D32F2F' },
        { label: 'Rate', value: `${stats.rate}%`, icon: <TrendingUp sx={{ fontSize: 24 }} />, color: '#D32F2F' },
    ];

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return { text: 'Good Morning' };
        if (hour < 17) return { text: 'Good Afternoon' };
        return { text: 'Good Evening' };
    };

    const greeting = getGreeting();

    const chartData = [
        { name: 'Attended', value: stats.attended, color: '#10B981' },
        { name: 'Absent', value: stats.absent, color: '#D32F2F' }
    ].filter(d => d.value > 0);

    // If no data, show a placeholder for the circle
    if (chartData.length === 0) chartData.push({ name: 'Empty', value: 1, color: '#e0e0e0' });

    const quickActions = [
        { label: 'Browse Events', path: '/events', icon: <Bolt />, color: '#101010', desc: 'Find new opportunities' },
        { label: 'Attendance', path: '/student/attendance', icon: <Assessment />, color: '#D32F2F', desc: 'Check your history' },
        { label: 'My Tickets', path: '/student/registrations', icon: <WorkspacePremium />, color: '#64748b', desc: 'View QR codes' },
    ];

    return (
        <DashboardLayout>
            {/* Premium Header */}
            <Box className="animate-fade-in-up" sx={{
                mb: 4, p: 4, borderRadius: 2,
                background: '#101010',
                color: '#FFF', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
                <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(211, 47, 47, 0.15)', filter: 'blur(60px)' }} />
                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                            src={user?.profilePicture ? `/${user.profilePicture}` : undefined}
                            sx={{ width: 80, height: 80, bgcolor: '#D32F2F', fontSize: '2rem', fontWeight: 900, border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 16px rgba(211, 47, 47, 0.4)' }}>
                            {user?.fullName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-1px', color: '#FFFFFF' }}>
                                {greeting.text}, {user?.fullName?.split(' ')[0]}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'inherit' }}>
                                    <School sx={{ fontSize: 18 }} /> {user?.department || 'University Student'}
                                </Typography>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'inherit' }}>
                                    <NotificationsActive sx={{ fontSize: 18 }} /> 2 New Notifications
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#D32F2F', lineHeight: 1 }}>{stats.rate}%</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Attendance Rate</Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Left Column: Stats & Events */}
                <Grid item xs={12} lg={8}>
                    {/* Stats & Chart Row */}
                    <Grid container spacing={3} sx={{ mb: 5 }}>
                        <Grid item xs={12} md={5}>
                            <Card sx={{ borderRadius: 1.5, height: '100%', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#6c757d', mb: 2, letterSpacing: 1 }}>Attendance Health</Typography>
                                    <Box sx={{ height: 180, position: 'relative' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                                            <Typography variant="h5" sx={{ fontWeight: 900, color: '#101010' }}>{stats.attended}</Typography>
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>PRESENT</Typography>
                                        </Box>
                                    </Box>
                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} /><Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>PRESENT</Typography></Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D32F2F' }} /><Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>ABSENT</Typography></Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <Grid container spacing={3} sx={{ height: '100%' }}>
                                <Grid item xs={6} sx={{ height: '50%' }}>
                                    <StatCard label="Registered" value={stats.registered} icon={<Event />} color="#6366f1" delay={1} />
                                </Grid>
                                <Grid item xs={6} sx={{ height: '50%' }}>
                                    <StatCard label="Absents" value={stats.absent} icon={<Event />} color="#f43f5e" delay={2} />
                                </Grid>
                                <Grid item xs={12} sx={{ height: '50%' }}>
                                    <Card sx={{
                                        borderRadius: 1.5, height: '100%', p: 1,
                                        display: 'flex', alignItems: 'center',
                                        background: `rgba(211, 47, 47, 0.04)`,
                                        border: '1px dashed rgba(211, 47, 47, 0.2)', boxShadow: 'none'
                                    }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                                            <Avatar sx={{ bgcolor: '#D32F2F', boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)' }}><TrendingUp /></Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#101010' }}>Keep it up!</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Your participation rate is excellent this month.</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* My Events Timeline */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1d23' }}>My Schedule</Typography>
                            <Button size="small" variant="text" onClick={() => navigate('/student/registrations')} sx={{ fontWeight: 700, borderRadius: 2 }}>See All</Button>
                        </Box>
                        {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 5 }} /> : (
                            <Stack spacing={2}>
                                {myRegistrations.length > 0 ? myRegistrations.map((reg, i) => (
                                    <Card key={reg.id} className="hover-lift" sx={{
                                        borderRadius: 1, position: 'relative', overflow: 'hidden',
                                        border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        '&:hover': { bgcolor: '#fcfcfc', borderColor: '#D32F2F' }
                                    }}>
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#101010' }} />
                                        <CardContent sx={{ p: '20px 24px', display: 'flex', alignItems: 'center', gap: 3 }}>
                                            <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                                                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>{new Date(reg.eventDate).getDate()}</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#6366f1' }}>
                                                    {new Date(reg.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem />
                                            <Box sx={{ flexGrow: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1d23', mb: 0.5 }}>{reg.eventTitle}</Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOn sx={{ fontSize: 14 }} /> {reg.eventVenue}
                                                </Typography>
                                            </Box>
                                            <IconButton onClick={() => navigate('/student/registrations')} sx={{ bgcolor: '#f8f9fa' }}>
                                                <ArrowForward />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 1, border: '1px dashed #dee2e6' }}>
                                        <Typography variant="body1" color="text.secondary">No upcoming events yet.</Typography>
                                        <Button variant="text" sx={{ mt: 1, fontWeight: 700 }} onClick={() => navigate('/events')}>Browse events</Button>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Grid>

                {/* Right Column: Actions & News */}
                <Grid item xs={12} lg={4}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1d23', mb: 3 }}>Quick Access</Typography>
                    <Grid container spacing={2} sx={{ mb: 4 }}>
                        {quickActions.map((action, i) => (
                            <Grid item xs={12} key={i}>
                                <Card className="hover-lift" sx={{
                                    borderRadius: 1, cursor: 'pointer', border: '1px solid #f0f0f0',
                                    transition: 'all 0.3s ease', '&:hover': { border: `1px solid ${action.color}`, bgcolor: alpha(action.color, 0.02) }
                                }} onClick={() => navigate(action.path)}>
                                    <CardContent sx={{ p: '20px 24px', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: alpha(action.color, 0.1), color: action.color, display: 'flex' }}>
                                            {action.icon}
                                        </Box>
                                        <Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>{action.label}</Typography>
                                            <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600 }}>{action.desc}</Typography>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Campus News / Insights */}
                    <Card sx={{ borderRadius: 2, background: '#1a1d23', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
                        <Box sx={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
                        <CardContent sx={{ p: 3.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <NotificationsActive sx={{ color: '#f59e0b' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Insights</Typography>
                            </Box>
                            <Stack spacing={3}>
                                {[
                                    { title: 'New Semester Schedule', desc: 'Spring semester dates confirmed.', type: 'Important' },
                                    { title: 'Library Renovation', desc: 'Floor 3 reopening soon!', type: 'Update' },
                                ].map((news, i) => (
                                    <Box key={i}>
                                        <Chip label={news.type} size="small" sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.1)', color: '#FFF', fontWeight: 700, fontSize: '0.6rem' }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#FFF' }}>{news.title}</Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{news.desc}</Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Recommendations Section */}
            <Box sx={{ mt: 6, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1d23' }}>Recommended Events</Typography>
                    <Button size="small" variant="text" onClick={() => navigate('/events')} sx={{ fontWeight: 700 }}>Browse all</Button>
                </Box>
                <Grid container spacing={3}>
                    {loading ? [1, 2, 3].map(i => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 4 }} /></Grid>) : (
                        upcomingEvents.map(ev => (
                            <Grid item xs={12} sm={4} key={ev.id}>
                                <Card className="hover-lift" sx={{
                                    borderRadius: 1, height: '100%', border: '1px solid #f0f0f0', cursor: 'pointer',
                                    transition: 'all 0.3s ease', '&:hover': { boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08)' }
                                }} onClick={() => navigate(`/events/${ev.id}`)}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Stack spacing={2}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <LiveStatusChip event={ev} />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#6c757d' }}>
                                                    <CalendarMonth sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{new Date(ev.eventDate).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 950, fontSize: '1.1rem', color: '#1a1d23', lineHeight: 1.2 }}>{ev.title}</Typography>
                                            <Typography variant="body2" sx={{ color: '#6c757d', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LocationOn sx={{ fontSize: 14 }} /> {ev.venue}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))
                    )}
                </Grid>
            </Box>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default StudentDashboard;
