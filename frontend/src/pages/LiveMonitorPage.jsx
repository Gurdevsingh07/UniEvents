import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Card, CardContent, Grid, Button, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
    Avatar, Skeleton, LinearProgress, Paper, alpha
} from '@mui/material';
import {
    ArrowBack, People, CheckCircle, ErrorOutline, Timer,
    CameraAlt, Analytics
} from '@mui/icons-material';

const LiveMonitorPage = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [sessionStatus, setSessionStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!eventId) return;
        try {
            const [eventRes, statsRes, attendanceRes, sessionRes] = await Promise.all([
                api.get(`/api/events/${eventId}`),
                api.get(`/api/events/${eventId}/stats`),
                api.get(`/api/attendance/event/${eventId}`),
                api.get(`/api/attendance/session/status/${eventId}`)
            ]);
            setEvent(eventRes.data.data);
            setStats(statsRes.data.data);
            setAttendance(attendanceRes.data.data || []);
            setSessionStatus(sessionRes.data);
        } catch (err) {
            console.error("Failed to load monitor data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [eventId]);

    useAutoRefresh(loadData, 3000); // Polling every 3 seconds for live feel

    if (loading) {
        return (
            <DashboardLayout>
                <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1.5, mb: 3 }} />
                <Grid container spacing={3}>
                    {[1, 2, 3].map(i => (
                        <Grid item xs={12} md={4} key={i}>
                            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            </DashboardLayout>
        );
    }

    if (!event) {
        return (
            <DashboardLayout>
                <Typography variant="h6">Event not found.</Typography>
                <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>Go Back</Button>
            </DashboardLayout>
        );
    }

    const attendanceRate = stats?.totalRegistered > 0
        ? Math.round((stats.totalPresent / stats.totalRegistered) * 100)
        : 0;

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: '#fff', border: '1px solid #eef2f6' }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: '-1px' }}>Live Monitor</Typography>
                        <Chip
                            label="LIVE"
                            size="small"
                            color="error"
                            variant="filled"
                            sx={{
                                fontWeight: 900, fontSize: '0.65rem', height: 20,
                                animation: sessionStatus?.status === 'ACTIVE' ? 'pulse 2s infinite' : 'none',
                                '@keyframes pulse': {
                                    '0%': { opacity: 1 },
                                    '50%': { opacity: 0.4 },
                                    '100%': { opacity: 1 }
                                }
                            }}
                        />
                    </Box>
                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>
                        {event.title}
                    </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" color="primary" startIcon={<CameraAlt />}
                    onClick={() => navigate(`/organizer/scan/${eventId}`)} sx={{ fontWeight: 800 }}>
                    Open Scanner
                </Button>
            </Box>

            {/* Quick Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 1.5, borderTop: '4px solid #10b981', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <CardContent sx={{ p: '24px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Present</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#10b981', lineHeight: 1, mt: 0.5 }}>{stats?.totalPresent || 0}</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha('#10b981', 0.1), color: '#10b981', width: 56, height: 56 }}>
                                <CheckCircle fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 1.5, borderTop: '4px solid #6366f1', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <CardContent sx={{ p: '24px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Registered</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#6366f1', lineHeight: 1, mt: 0.5 }}>{stats?.totalRegistered || 0}</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha('#6366f1', 0.1), color: '#6366f1', width: 56, height: 56 }}>
                                <People fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                    <Card sx={{ borderRadius: 1.5, borderTop: '4px solid #f59e0b', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <CardContent sx={{ p: '24px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Attendance Rate</Typography>
                                <Typography variant="h3" sx={{ fontWeight: 900, color: '#f59e0b', lineHeight: 1, mt: 0.5 }}>{attendanceRate}%</Typography>
                            </Box>
                            <Avatar sx={{ bgcolor: alpha('#f59e0b', 0.1), color: '#f59e0b', width: 56, height: 56 }}>
                                <Analytics fontSize="large" />
                            </Avatar>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content Area */}
            <Grid container spacing={4}>
                {/* Real-time Log */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ borderRadius: 1.5, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', height: '100%' }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Real-Time Check-ins</Typography>
                                <Chip label={`${attendance.length} Total`} size="small" sx={{ fontWeight: 800 }} />
                            </Box>
                            <TableContainer sx={{ maxHeight: 500 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Student</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Method</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }} align="right">Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attendance.slice(0, 50).map((a) => {
                                            const isPresent = a.status === 'PRESENT';
                                            return (
                                                <TableRow key={a.userId} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: isPresent ? '#10b981' : '#D32F2F' }}>
                                                                {a.userName[0]}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{a.userName}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>{a.studentId || 'N/A'}</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={a.checkInMethod || 'UNKNOWN'}
                                                            size="small"
                                                            color={a.checkInMethod === 'FACE_SCAN' ? 'primary' : 'default'}
                                                            variant={a.checkInMethod === 'FACE_SCAN' ? 'filled' : 'outlined'}
                                                            sx={{ fontSize: '0.65rem', height: 20, fontWeight: 800 }}
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {isPresent ? (
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                                                                <Timer sx={{ fontSize: 14 }} />
                                                                {new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                            </Typography>
                                                        ) : (
                                                            <Chip label="ABSENT" size="small" color="error" variant="outlined" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {attendance.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} sx={{ textAlign: 'center', py: 6 }}>
                                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>No check-in activity recorded yet.</Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Status Column */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', mb: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#101010', mb: 2 }}>Session Status</Typography>
                            <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: sessionStatus?.status === 'ACTIVE' ? alpha('#10b981', 0.1) : alpha('#f59e0b', 0.1), border: `1px solid ${sessionStatus?.status === 'ACTIVE' ? '#10b981' : '#f59e0b'}`, mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 900, color: sessionStatus?.status === 'ACTIVE' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {sessionStatus?.status === 'ACTIVE' ? <CheckCircle /> : <ErrorOutline />}
                                    {sessionStatus?.status || 'UNKNOWN'}
                                </Typography>
                            </Box>

                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#101010', mb: 1.5 }}>Fill Progress</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>Capacity</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800 }}>{stats?.totalPresent || 0} / {event.maxCapacity || '∞'}</Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={event.maxCapacity ? Math.min((stats?.totalPresent / event.maxCapacity) * 100, 100) : 0}
                                sx={{ height: 8, borderRadius: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#10b981', borderRadius: 4 } }}
                            />
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </DashboardLayout>
    );
};

export default LiveMonitorPage;
