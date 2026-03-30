import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import LiveStatusChip from '../components/LiveStatusChip';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Container, Typography, Button, Card, CardContent, Chip, Stack, Grid,
    Alert, Snackbar, CircularProgress, LinearProgress, Divider, Avatar, IconButton
} from '@mui/material';
import {
    CalendarMonth, AccessTime, LocationOn, People, Person,
    FaceRetouchingNatural, Share, Timer, CheckCircle
} from '@mui/icons-material';

const EventDetailPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [registration, setRegistration] = useState(null);
    const [loading, setLoading] = useState(true);
    const [regLoading, setRegLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [countdown, setCountdown] = useState('');

    useEffect(() => { loadData(); }, [id]);
    useAutoRefresh(() => loadData(), 5000);

    useEffect(() => {
        if (!event) return;

        // Check active status using utility or manual check
        const isUpcoming = event.status === 'UPCOMING';
        // Simple check: if backend says ONGOING or computed status suggests it's active
        // But for countdown, we rely on dates.

        const updateCountdown = () => {
            if (!event.eventDate) return;
            const now = new Date();
            const start = new Date(`${event.eventDate}T${event.startTime || '00:00'}`);
            if (isNaN(start.getTime())) return;

            let end = null;
            if (event.endTime) {
                end = new Date(`${event.endDate || event.eventDate}T${event.endTime}`);
            } else if (event.endDate) {
                end = new Date(`${event.endDate}T23:59:59`);
            }

            if (now < start) {
                // Upcoming
                const diff = start - now;
                setCountdown(`Starts in ${formatDiff(diff)}`);
            } else if (end && !isNaN(end.getTime()) && now < end) {
                // Ongoing
                const diff = end - now;
                setCountdown(`Ends in ${formatDiff(diff)}`);
            } else {
                setCountdown('');
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000); // Update every second for better precision
        return () => clearInterval(interval);
    }, [event]);

    const formatDiff = (diff) => {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / (1000 * 60)) % 60);
        const secs = Math.floor((diff / 1000) % 60);

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m ${secs}s`;
    };

    const loadData = async () => {
        try {
            const evRes = await api.get(`/api/events/${id}`);
            setEvent(evRes.data.data);
            if (user?.role === 'STUDENT') {
                try {
                    const regsRes = await api.get('/api/registrations/my');
                    const myReg = regsRes.data.data?.find(r => r.eventId === parseInt(id));
                    setRegistration(myReg || null);
                } catch { }
            }
        } catch { navigate('/events'); }
        finally { setLoading(false); }
    };

    const handleRegister = async () => {
        if (!user) { navigate('/login'); return; }
        setRegLoading(true);
        try {
            const res = await api.post(`/api/events/${id}/register`);
            setRegistration(res.data.data);
            setSnackbar({ open: true, message: 'Successfully registered!', severity: 'success' });
            loadData();
        } catch (err) {
            console.error('Registration error:', err);
            let msg = 'Registration failed';
            if (err.response) {
                msg = `Failed: ${err.response.status} - ${err.response.data?.message || err.response.statusText}`;
            } else if (err.request) {
                msg = 'Network Error: No response from server. Check your connection.';
            } else {
                msg = `Error: ${err.message}`;
            }
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally { setRegLoading(false); }
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({ title: event.title, url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            setSnackbar({ open: true, message: 'Link copied to clipboard!', severity: 'info' });
        }
    };

    const isRegistrationClosed = event && (
        ['ATTENDANCE_CLOSED', 'ARCHIVED', 'CANCELLED'].includes(event.status) ||
        (new Date() >= (event.endTime ? new Date(`${event.endDate || event.eventDate}T${event.endTime}`) : new Date(`${event.endDate || event.eventDate}T${event.startTime || '23:59:59'}`)))
    );
    const isFull = event && event.registeredCount >= event.capacity;

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 20 }}><CircularProgress sx={{ color: '#C62828' }} /></Box>;
    if (!event) return null;

    const capacityPercent = event.capacity ? ((event.registeredCount || 0) / event.capacity) * 100 : 0;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc' }}>
            <DashboardLayout>
                {/* Hero Header Section */}
                <Box className="animate-fade-in-up" sx={{
                    mb: 5, p: { xs: 3, md: 6 }, borderRadius: 2,
                    background: '#101010',
                    color: '#FFF', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)'
                }}>
                    <Box sx={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(211, 47, 47, 0.15)', filter: 'blur(80px)' }} />
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <LiveStatusChip event={event} sx={{ height: 32, fontWeight: 800, px: 2 }} />
                                {countdown && (
                                    <Chip
                                        icon={<Timer sx={{ fontSize: 16, color: '#f59e0b !important' }} />}
                                        label={countdown}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: '#f59e0b', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.2)' }}
                                    />
                                )}
                            </Box>
                            {(user?.role === 'ADMIN' || (user?.role === 'ORGANIZER' && user.id === event.createdById)) && (
                                <Stack direction="row" spacing={2}>
                                    {!['ATTENDANCE_CLOSED', 'ARCHIVED', 'CANCELLED'].includes(event.status) && (
                                        <>
                                            <Button variant="contained" sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontWeight: 800, borderRadius: 3, textTransform: 'none', px: 3 }}
                                                onClick={() => navigate(`/organizer/scan/${event.id}`)}>
                                                Start Scanning
                                            </Button>
                                            <Button variant="outlined" color="error" size="small"
                                                onClick={() => api.put(`/api/events/${event.id}/end`).then(loadData)}
                                                sx={{ fontWeight: 800, borderRadius: 3, textTransform: 'none', px: 3 }}>
                                                End Early
                                            </Button>
                                        </>
                                    )}
                                    <Button variant="outlined" sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff' }, fontWeight: 800, borderRadius: 3, textTransform: 'none', px: 3 }}
                                        onClick={() => navigate(`/organizer/reports/${event.id}`)}>
                                        View Reports
                                    </Button>
                                </Stack>
                            )}
                        </Box>

                        <Typography variant="h2" sx={{
                            fontWeight: 1000, mb: 3,
                            fontSize: { xs: '2.2rem', md: '3.8rem' },
                            lineHeight: 1.1, letterSpacing: '-2px',
                            color: '#FFFFFF'
                        }}>
                            {event.title}
                        </Typography>

                        <Grid container spacing={4}>
                            <Grid item xs={12} sm={4}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <CalendarMonth sx={{ color: '#D32F2F' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Date</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{new Date(event.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <AccessTime sx={{ color: '#cbd5e1' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Time</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{event.startTime} - {event.endTime || 'Late'}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ p: 1.5, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <LocationOn sx={{ color: '#D32F2F' }} />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>Location</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 800 }}>{event.venue}</Typography>
                                    </Box>
                                </Stack>
                            </Grid>
                        </Grid>
                    </Box>
                </Box>

                <Grid container spacing={4}>
                    {/* Left Side: Description */}
                    <Grid item xs={12} lg={8}>
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#101010', color: '#FFF', fontWeight: 900, fontSize: '1.2rem' }}>{event.createdByName?.[0]}</Avatar>
                                    <Box>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#101010' }}>{event.createdByName}</Typography>
                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800 }}>Event Organizer</Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }} />
                                    <IconButton onClick={handleShare} sx={{ bgcolor: '#f1f5f9' }}><Share /></IconButton>
                                </Box>

                                <Typography variant="h5" sx={{ mb: 2, fontWeight: 1000, color: '#1e293b', letterSpacing: '-0.5px' }}>About this event</Typography>
                                <Typography variant="body1" sx={{
                                    color: '#475569', lineHeight: 1.8, fontSize: '1.1rem',
                                    whiteSpace: 'pre-wrap', mb: 4
                                }}>
                                    {event.description || "No description provided for this event."}
                                </Typography>

                                <Divider sx={{ my: 4 }} />

                                <Box sx={{ p: 3, borderRadius: 1.5, bgcolor: '#f8fafc', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <People sx={{ color: '#D32F2F' }} />
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#475569' }}>
                                        Already {event.registeredCount} students have secured their spot.
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Right Side: Registration & Entry */}
                    <Grid item xs={12} lg={4}>
                        <Stack spacing={4}>
                            {/* Registration Box */}
                            <Card sx={{
                                borderRadius: 1.5, p: 1,
                                background: registration ? '#10B981' : '#fff',
                                color: registration ? '#fff' : 'inherit',
                                boxShadow: registration ? '0 20px 25px -5px rgba(16, 185, 129, 0.3)' : '0 10px 15px -3px rgba(0,0,0,0.1)'
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Typography variant="overline" sx={{ fontWeight: 1000, letterSpacing: 2, opacity: registration ? 0.8 : 0.6 }}>
                                        {registration ? 'Status: Registered' : 'Registration'}
                                    </Typography>
                                    <Box sx={{ my: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, alignItems: 'flex-end' }}>
                                            <Typography variant="h4" sx={{ fontWeight: 900, color: registration ? '#fff' : 'inherit' }}>{event.registeredCount} / {event.capacity}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.8, color: registration ? '#fff' : 'inherit' }}>SLOTS FILLED</Typography>
                                        </Box>
                                        <LinearProgress variant="determinate" value={Math.min(capacityPercent, 100)} sx={{
                                            height: 10, borderRadius: 1, bgcolor: registration ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                                            '& .MuiLinearProgress-bar': {
                                                borderRadius: 1,
                                                bgcolor: registration ? '#fff' : (capacityPercent >= 90 ? '#D32F2F' : '#101010'),
                                            }
                                        }} />
                                    </Box>

                                    {user?.role === 'STUDENT' && !registration && (
                                        <Button fullWidth variant="contained" size="large" onClick={handleRegister}
                                            disabled={regLoading || isFull || isRegistrationClosed}
                                            sx={{
                                                py: 2, borderRadius: 1, fontWeight: 1000, textTransform: 'none', fontSize: '1.1rem',
                                                bgcolor: '#101010', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                                                '&:hover': { bgcolor: '#000000' }
                                            }}>
                                            {regLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> :
                                                event.status === 'CANCELLED' ? 'Registration Cancelled' :
                                                    isRegistrationClosed ? 'Registration Closed' :
                                                        isFull ? 'Sold Out' : 'Register Now'}
                                        </Button>
                                    )}

                                    {registration && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1, color: '#fff' }}>
                                            <CheckCircle sx={{ fontSize: 24, color: '#fff' }} />
                                            <Typography variant="body1" sx={{ fontWeight: 800, color: '#fff' }}>You're on the list!</Typography>
                                        </Box>
                                    )}

                                    {!user && (
                                        <Button fullWidth variant="contained" size="large" onClick={() => navigate('/login')}
                                            sx={{ py: 2, borderRadius: 1, fontWeight: 900, bgcolor: '#1e293b' }}>
                                            Login to Join
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Entry Confirmation */}
                            {registration && (
                                <Card sx={{ borderRadius: 1.5, overflow: 'hidden', border: '1px solid #e8e8e8', bgcolor: '#fff' }}>
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <FaceRetouchingNatural sx={{ fontSize: 48, color: '#D32F2F', mb: 2 }} />
                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#212121', mb: 0.5 }}>Face Verification Entry</Typography>
                                        <Typography variant="body2" sx={{ color: '#757575', mb: 3, fontWeight: 600 }}>
                                            Your face scan will serve as your entry pass at the venue.
                                        </Typography>
                                        <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                            <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Registration Confirmed
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center' }}>
                                        <Stack direction="row" spacing={3}>
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" display="block" color="text.secondary">METHOD</Typography>
                                                <Typography variant="subtitle2" fontWeight={800}>FACE SCAN</Typography>
                                            </Box>
                                            <Divider orientation="vertical" flexItem />
                                            <Box sx={{ textAlign: 'center' }}>
                                                <Typography variant="caption" display="block" color="text.secondary">STATUS</Typography>
                                                <Typography variant="subtitle2" fontWeight={800} color="#10b981">VALID</Typography>
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Card>
                            )}
                        </Stack>
                    </Grid>
                </Grid>
            </DashboardLayout>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1, fontWeight: 800, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default EventDetailPage;
