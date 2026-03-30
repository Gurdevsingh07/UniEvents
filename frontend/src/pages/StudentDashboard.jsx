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
    TrendingUp, ArrowForward, EmojiEvents, Assessment,
    Bolt, School, WorkspacePremium, Notifications, ErrorOutline, Groups
} from '@mui/icons-material';
import NotificationBell from '../components/NotificationBell';

const StudentDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [notices, setNotices] = useState([]);
    const [myTeams, setMyTeams] = useState([]);
    const [stats, setStats] = useState({ registered: 0, attended: 0, absent: 0, rate: 0 });
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const refreshData = async () => {
        try {
            const [regRes, attRes, upRes, noticeRes, teamRes, engagementRes] = await Promise.all([
                api.get('/api/registrations/my'),
                api.get('/api/attendance/my'),
                api.get('/api/events/upcoming'),
                api.get('/api/notices').catch(() => ({ data: { data: [] } })),
                api.get('/api/teams/my-teams').catch(() => ({ data: { data: [] } })),
                api.get('/api/analytics/student/engagement').catch(() => ({ data: { data: { engagementScore: 0 } } }))
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

            const allNotices = noticeRes.data.data || [];
            const unreadNotices = allNotices.filter(n => !n.isRead).slice(0, 2);

            const engagementData = engagementRes?.data?.data || { engagementScore: 0 };

            setStats({
                registered: regCount,
                attended: attCount,
                absent: absentCount,
                rate,
                engagement: Math.round(engagementData.engagementScore || 0)
            });
            setUpcomingEvents(recommendations);
            setMyRegistrations(myUpcoming);
            setNotices(unreadNotices);
            setMyTeams(teamRes.data?.data || []);
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'We could not load your dashboard. Please try again.', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { refreshData(); }, []);
    useAutoRefresh(refreshData);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const quickActions = [
        { label: 'Browse Events', path: '/events', icon: <Bolt />, color: '#101010', desc: 'Find new opportunities' },
        { label: 'Attendance', path: '/student/attendance', icon: <Assessment />, color: '#D32F2F', desc: 'Check your history' },
        { label: 'My Registrations', path: '/student/registrations', icon: <WorkspacePremium />, color: '#64748b', desc: 'View registrations' },
    ];

    const getNoticeTypeColor = (type) => {
        switch (type) {
            case 'URGENT': return '#C62828';
            case 'EVENT': return '#1565C0';
            case 'CLUB': return '#E65100';
            default: return '#2E7D32';
        }
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <Box sx={{
                mb: 4, p: { xs: 3, md: 4 }, borderRadius: 1.5,
                background: '#101010',
                color: '#FFF', position: 'relative', overflow: 'hidden',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Avatar
                            src={user?.profilePicture ? `/${user.profilePicture}` : undefined}
                            sx={{
                                width: { xs: 56, md: 72 },
                                height: { xs: 56, md: 72 },
                                bgcolor: '#D32F2F',
                                fontSize: { xs: '1.25rem', md: '1.75rem' },
                                fontWeight: 900,
                                border: '3px solid rgba(255,255,255,0.1)'
                            }}>
                            {user?.fullName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#fff', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                                {getGreeting()}, {user?.fullName?.split(' ')[0]}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'inherit', fontWeight: 600 }}>
                                    <School sx={{ fontSize: 18 }} /> {user?.department || 'University Student'}
                                </Typography>
                                <NotificationBell />
                            </Stack>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: { xs: '100%', sm: 'auto' } }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#D32F2F', lineHeight: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>{stats.rate}%</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Attendance Rate</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Notices Strip */}
            {notices.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <Stack spacing={1.5}>
                        {notices.map(notice => (
                            <Card key={notice.id} sx={{
                                borderRadius: 1.5, border: '1px solid', cursor: 'pointer',
                                borderColor: `${getNoticeTypeColor(notice.noticeType)}30`,
                                bgcolor: `${getNoticeTypeColor(notice.noticeType)}06`,
                                transition: 'border-color 0.15s',
                                '&:hover': { borderColor: getNoticeTypeColor(notice.noticeType) },
                            }} onClick={() => navigate(user?.role === 'STUDENT' ? '/student/notices' : '/notices')}>
                                <CardContent sx={{ p: '12px 16px !important', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: getNoticeTypeColor(notice.noticeType), flexShrink: 0 }} />
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121', flex: 1 }} noWrap>
                                        {notice.title}
                                    </Typography>
                                    <Chip label={notice.noticeType} size="small" sx={{
                                        fontSize: '0.65rem', fontWeight: 700, height: 20,
                                        bgcolor: `${getNoticeTypeColor(notice.noticeType)}12`,
                                        color: getNoticeTypeColor(notice.noticeType),
                                    }} />
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Box>
            )}

            <Grid container spacing={3}>
                {/* Left: Stats + Schedule */}
                <Grid item xs={12} lg={8}>
                    {/* Stats Row */}
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        <Grid item xs={6} sm={3}>
                            <StatCard label="Registered" value={stats.registered} icon={<Event />} color="#6366f1" delay={1} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard label="Attended" value={stats.attended} icon={<CheckCircle />} color="#10B981" delay={2} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard label="Rate" value={`${stats.rate}%`} icon={<TrendingUp />} color="#D32F2F" delay={3} />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <StatCard label="Engagement" value={Math.max(0, stats.engagement || 0)} icon={<EmojiEvents />} color="#f59e0b" delay={4} />
                        </Grid>
                    </Grid>

                    {/* My Schedule */}
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>My Schedule</Typography>
                            <Button size="small" variant="text" onClick={() => navigate('/student/registrations')} sx={{ fontWeight: 700 }}>See All</Button>
                        </Box>
                        {loading ? <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1.5 }} /> : (
                            <Stack spacing={1.5}>
                                {myRegistrations.length > 0 ? myRegistrations.map((reg) => (
                                    <Card key={reg.id} sx={{
                                        borderRadius: 1.5, border: '1px solid #e8e8e8',
                                        transition: 'border-color 0.15s',
                                        '&:hover': { borderColor: '#D32F2F' },
                                    }}>
                                        <CardContent sx={{ p: '16px 20px !important', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                            <Box sx={{ textAlign: 'center', minWidth: 48 }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: reg.registrationStatus === 'WAITLISTED' ? '#f59e0b' : '#6366f1', fontSize: '0.65rem' }}>
                                                    {reg.registrationStatus === 'WAITLISTED' ? 'Waitlist' : new Date(reg.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                                                </Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem />
                                            <Box sx={{ flex: 1 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212121' }}>{reg.eventTitle}</Typography>
                                                    {reg.registrationStatus === 'WAITLISTED' && (
                                                        <Chip label={`#${reg.waitlistPosition}`} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f59e0b12', color: '#f59e0b' }} />
                                                    )}
                                                </Box>
                                                <Typography variant="caption" sx={{ color: '#757575', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <LocationOn sx={{ fontSize: 12 }} /> {reg.eventVenue}
                                                </Typography>
                                            </Box>
                                            <IconButton size="small" onClick={() => navigate('/student/registrations')} sx={{ bgcolor: '#f5f5f5' }}>
                                                <ArrowForward sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                        <Typography variant="body2" color="text.secondary">No upcoming events on your schedule.</Typography>
                                        <Button variant="text" size="small" sx={{ mt: 1, fontWeight: 700 }} onClick={() => navigate('/events')}>Browse events</Button>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Grid>

                {/* Right: Quick Actions */}
                <Grid item xs={12} lg={4}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', mb: 2.5 }}>Quick Access</Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {quickActions.map((action, i) => (
                            <Card key={i} sx={{
                                borderRadius: 1.5, cursor: 'pointer', border: '1px solid #f0f0f0',
                                transition: 'border-color 0.15s', '&:hover': { borderColor: action.color },
                            }} onClick={() => navigate(action.path)}>
                                <CardContent sx={{ p: '16px 20px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha(action.color, 0.08), color: action.color, display: 'flex' }}>
                                        {action.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{action.label}</Typography>
                                        <Typography variant="caption" sx={{ color: '#757575' }}>{action.desc}</Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>
                </Grid>
            </Grid>

            {/* My Teams */}
            {!loading && myTeams.length > 0 && (
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', mb: 2 }}>My Teams &amp; Roles</Typography>
                    <Grid container spacing={2}>
                        {myTeams.map(team => (
                            <Grid item xs={12} sm={6} md={4} key={team.id}>
                                <Card sx={{
                                    borderRadius: 1.5,
                                    border: '1px solid #f0f0f0',
                                    bgcolor: 'white',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', borderColor: '#D32F2F' }
                                }}>
                                    <CardContent sx={{ p: 2 }}>
                                        <Stack direction="row" spacing={2} alignItems="center">
                                            <Avatar sx={{ bgcolor: '#FFEBEE', color: '#D32F2F' }}>
                                                <Groups />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{team.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#757575', display: 'block' }}>
                                                    Role: <strong>{team.position || 'Member'}</strong>
                                                </Typography>
                                                {team.createdBy?.fullName && (
                                                    <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block' }}>
                                                        Organizer: {team.createdBy.fullName}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                    <Button size="small" variant="text" onClick={() => navigate('/student/teams')}
                        sx={{ mt: 1.5, fontWeight: 700, color: '#D32F2F' }}>
                        View all team details →
                    </Button>
                </Box>
            )}

            {/* Recommended Events */}
            {!loading && upcomingEvents.length > 0 && (
                <Box sx={{ mt: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>Recommended Events</Typography>
                        <Button size="small" variant="text" onClick={() => navigate('/events')} sx={{ fontWeight: 700 }}>Browse all</Button>
                    </Box>
                    <Grid container spacing={2.5}>
                        {upcomingEvents.map(ev => (
                            <Grid item xs={12} sm={4} key={ev.id}>
                                <Card sx={{
                                    borderRadius: 1.5, height: '100%', border: '1px solid #f0f0f0', cursor: 'pointer',
                                    transition: 'border-color 0.15s', '&:hover': { borderColor: '#D32F2F' },
                                }} onClick={() => navigate(`/events/${ev.id}`)}>
                                    <CardContent sx={{ p: 2.5 }}>
                                        <Stack spacing={1.5}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <LiveStatusChip event={ev} />
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#757575' }}>
                                                    <CalendarMonth sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{new Date(ev.eventDate).toLocaleDateString()}</Typography>
                                                </Box>
                                            </Box>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#212121', lineHeight: 1.2 }}>{ev.title}</Typography>
                                            <Typography variant="body2" sx={{ color: '#757575', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <LocationOn sx={{ fontSize: 14 }} /> {ev.venue}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default StudentDashboard;
