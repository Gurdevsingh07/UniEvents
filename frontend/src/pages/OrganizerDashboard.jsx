import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import StatCard from '../components/StatCard';
import LiveStatusChip from '../components/LiveStatusChip';
import {
    Box, Typography, Grid, Card, CardContent, Stack, Button, Alert, Snackbar, Skeleton,
    useTheme, alpha, Avatar, IconButton, Divider, Chip
} from '@mui/material';
import {
    Event, People, CheckCircle, Add, Assessment,
    TrendingUp, ArrowForward, NotificationsActive, Visibility,
    Dashboard as DashboardIcon, QrCodeScanner, PieChart as PieChartIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const OrganizerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = user?.role === 'ADMIN';

    const loadData = async () => {
        try {
            const endpoint = isAdmin ? '/api/events' : '/api/events/my';
            const res = await api.get(endpoint);
            setEvents(res.data.data || []);
        } catch (err) {
            console.error('Dashboard load error:', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load dashboard data.', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [isAdmin]);
    useAutoRefresh(loadData);

    const stats = useMemo(() => {
        const totalRegistered = events.reduce((s, e) => s + (e.registeredCount || 0), 0);
        const totalAttended = events.reduce((s, e) => s + (e.attendedCount || 0), 0);
        const rate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
        return {
            total: events.length,
            registered: totalRegistered,
            attended: totalAttended,
            absent: totalRegistered - totalAttended,
            rate
        };
    }, [events]);

    const chartData = [
        { name: 'Checked-in', value: stats.attended, color: '#10B981' },
        { name: 'Pending', value: stats.absent, color: '#D32F2F' }
    ].filter(d => d.value > 0);

    if (chartData.length === 0) chartData.push({ name: 'Empty', value: 1, color: '#e2e8f0' });

    const quickActions = [
        { label: 'Create Event', path: isAdmin ? '/admin/create-event' : '/organizer/create-event', icon: <Add />, color: '#D32F2F', desc: 'Launch a new event' },
        { label: 'Manage Events', path: '/organizer/events', icon: <DashboardIcon />, color: '#101010', desc: 'Edit and monitor' },
        { label: 'Scanner', path: '/organizer/scan', icon: <QrCodeScanner />, color: '#2196F3', desc: 'Mark attendance via QR' },
    ];

    const recentEvents = events.slice(0, 3);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

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
                        <Avatar sx={{ width: 80, height: 80, bgcolor: '#D32F2F', fontSize: '2rem', fontWeight: 900, border: '4px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 16px rgba(211, 47, 47, 0.4)' }}>
                            {user?.fullName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-1px', color: '#fff' }}>
                                {getGreeting()}, {user?.fullName?.split(' ')[0]}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'inherit' }}>
                                    <PieChartIcon sx={{ fontSize: 18 }} /> {isAdmin ? 'System Administrator' : 'Event Organizer'}
                                </Typography>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'inherit' }}>
                                    <NotificationsActive sx={{ fontSize: 18 }} /> 3 Pending Tasks
                                </Typography>
                            </Stack>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#D32F2F', lineHeight: 1 }}>{stats.rate}%</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Check-in Rate</Typography>
                    </Box>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Left: Stats & Charts */}
                <Grid item xs={12} lg={8}>
                    <Grid container spacing={3} sx={{ mb: 5 }}>
                        <Grid item xs={12} md={5}>
                            <Card sx={{ borderRadius: 1.5, height: '100%', border: '1px solid #f0f0f0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#6c757d', mb: 2, letterSpacing: 1 }}>Check-in Health</Typography>
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
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>ATTENDED</Typography>
                                        </Box>
                                    </Box>
                                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981' }} /><Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>PRESENT</Typography></Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#D32F2F' }} /><Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b' }}>PENDING</Typography></Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={7}>
                            <Grid container spacing={3} sx={{ height: '100%' }}>
                                <Grid item xs={6}>
                                    <StatCard label="Total Events" value={stats.total} icon={<Event />} color="#2196F3" delay={1} />
                                </Grid>
                                <Grid item xs={6}>
                                    <StatCard label="Registrations" value={stats.registered} icon={<People />} color="#FF9800" delay={2} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Card sx={{
                                        borderRadius: 1.5, height: '100%', p: 1,
                                        display: 'flex', alignItems: 'center',
                                        background: `rgba(211, 47, 47, 0.04)`,
                                        border: '1px dashed rgba(211, 47, 47, 0.2)', boxShadow: 'none'
                                    }}>
                                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                                            <Avatar sx={{ bgcolor: '#D32F2F', boxShadow: '0 4px 8px rgba(211, 47, 47, 0.2)' }}><TrendingUp /></Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#101010' }}>Success Metric</Typography>
                                                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>Your event attendance rate is looking solid!</Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    {/* Recent Events List */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1d23' }}>Recent Events</Typography>
                            <Button size="small" variant="text" onClick={() => navigate('/organizer/events')} sx={{ fontWeight: 700 }}>View All</Button>
                        </Box>
                        {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} /> : (
                            <Stack spacing={2}>
                                {recentEvents.length > 0 ? recentEvents.map((ev, i) => (
                                    <Card key={ev.id} className="hover-lift" sx={{
                                        borderRadius: 1, position: 'relative', overflow: 'hidden',
                                        border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                        '&:hover': { borderColor: '#D32F2F', transform: 'scale(1.01)' }
                                    }}>
                                        <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, bgcolor: '#101010' }} />
                                        <CardContent sx={{ p: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                                <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                                                    <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1 }}>{new Date(ev.eventDate).getDate()}</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#D32F2F' }}>
                                                        {new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                                                    </Typography>
                                                </Box>
                                                <Divider orientation="vertical" flexItem />
                                                <Box>
                                                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1a1d23', mb: 0.5 }}>{ev.title}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <People sx={{ fontSize: 14 }} /> {ev.registeredCount} Reg.
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CheckCircle sx={{ fontSize: 14 }} /> {ev.attendedCount} Check-ins
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <IconButton onClick={() => navigate(`/organizer/events`)} sx={{ bgcolor: '#f8f9fa' }}>
                                                <Visibility />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 1.5, border: '1px dashed #dee2e6' }}>
                                        <Typography variant="body1" color="text.secondary">No events hosted yet.</Typography>
                                        <Button variant="text" sx={{ mt: 1, fontWeight: 700 }} onClick={() => navigate(isAdmin ? '/admin/create-event' : '/organizer/create-event')}>Start your first event</Button>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>
                </Grid>

                {/* Right: Quick Actions & Alerts */}
                <Grid item xs={12} lg={4}>
                    <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.5px', color: '#1a1d23', mb: 3 }}>Quick Actions</Typography>
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

                    <Card sx={{ borderRadius: 1.5, background: '#1a1d23', color: '#FFF', position: 'relative', overflow: 'hidden' }}>
                        <CardContent sx={{ p: 3.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                                <Assessment sx={{ color: '#f59e0b' }} />
                                <Typography variant="h6" sx={{ fontWeight: 800 }}>Reporting</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                                Looking for detailed insights? Export your event attendance data easily.
                            </Typography>
                            <Button fullWidth variant="outlined" onClick={() => navigate('/organizer/reports')}
                                sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 800, '&:hover': { borderColor: '#fff' } }}>
                                View Full Reports
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default OrganizerDashboard;
