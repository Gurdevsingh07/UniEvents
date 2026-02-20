import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Stack, Button, Alert, Snackbar, Skeleton, IconButton
} from '@mui/material';
import {
    CalendarMonth, LocationOn, Event, ArrowForward, ConfirmationNumber, CheckCircle, Cancel
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';

const StudentRegistrations = () => {
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadRegistrations = async () => {
        try {
            const res = await api.get('/api/registrations/my');
            setRegistrations(res.data.data || []);
        } catch (err) {
            console.error('Failed to load registrations', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load registrations', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadRegistrations(); }, []);
    useAutoRefresh(loadRegistrations);

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up" sx={{
                mb: 4, p: 4, borderRadius: 2,
                background: '#101010',
                color: '#FFF', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(211, 47, 47, 0.15)', filter: 'blur(40px)' }} />
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px', position: 'relative', zIndex: 1, color: '#FFFFFF' }}>
                    My Tickets
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                    <ConfirmationNumber sx={{ fontSize: 20 }} /> {registrations.length} Total Registrations
                </Typography>
            </Box>

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : registrations.length === 0 ? (
                <Card sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA', border: '1px dashed #E0E0E0', boxShadow: 'none' }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Event sx={{ fontSize: 48, color: '#E0E0E0', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#757575', mb: 1, fontWeight: 600 }}>No registrations found</Typography>
                        <Typography variant="body2" sx={{ color: '#9E9E9E', mb: 3 }}>
                            You haven't registered for any events yet.
                        </Typography>
                        <Button variant="contained" endIcon={<ArrowForward />} onClick={() => navigate('/events')}
                            sx={{ bgcolor: '#212121', borderRadius: 1, px: 4, py: 1, '&:hover': { bgcolor: '#000000' } }}>
                            Browse Events
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {registrations.map((reg, i) => (
                        <Grid item xs={12} sm={6} md={4} key={reg.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                            <Card className="hover-lift" sx={{
                                height: '100%', borderRadius: 1.5, border: '1px solid #e2e8f0',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { boxShadow: '0 20px 25px -5px rgba(0,0,0,0.08)', transform: 'translateY(-10px)' }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                        <Chip
                                            label={reg.attendanceStatus || (reg.attended ? 'PRESENT' : 'REGISTERED')}
                                            size="small"
                                            sx={{
                                                fontWeight: 900,
                                                bgcolor: reg.attendanceStatus === 'PRESENT' ? 'rgba(16,185,129,0.1)' :
                                                    reg.attendanceStatus === 'ABSENT' ? 'rgba(211,47,47,0.1)' : '#f1f5f9',
                                                color: reg.attendanceStatus === 'PRESENT' ? '#10B981' :
                                                    reg.attendanceStatus === 'ABSENT' ? '#D32F2F' : '#64748b',
                                                border: reg.attendanceStatus === 'REGISTERED' ? '1px solid #e2e8f0' : 'none'
                                            }}
                                        />
                                        <IconButton size="small" onClick={() => navigate(`/events/${reg.eventId}`)}><ArrowForward sx={{ fontSize: 18 }} /></IconButton>
                                    </Box>

                                    <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, fontSize: '1.2rem', lineHeight: 1.2, color: '#1e293b' }}>
                                        {reg.eventTitle}
                                    </Typography>

                                    <Stack spacing={1.5} sx={{ mb: 4 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <CalendarMonth sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                                                {new Date(reg.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <LocationOn sx={{ fontSize: 18, color: '#64748b' }} />
                                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>{reg.eventVenue}</Typography>
                                        </Box>
                                    </Stack>

                                    {reg.attendanceStatus !== 'ABSENT' && reg.attendanceStatus !== 'PRESENT' ? (
                                        <Box sx={{
                                            textAlign: 'center', p: 3, bgcolor: '#f8fafc', borderRadius: 1.5,
                                            border: '1px solid #e2e8f0', position: 'relative'
                                        }}>
                                            <QRCodeSVG value={reg.qrCodeData} size={150} level="H" />
                                            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Entry Pass
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, bgcolor: reg.attendanceStatus === 'PRESENT' ? 'rgba(16,185,129,0.04)' : '#f8fafc', borderRadius: 1, border: '1px dashed #cbd5e1' }}>
                                            {reg.attendanceStatus === 'PRESENT' ? <CheckCircle sx={{ color: '#10B981' }} /> : <Cancel sx={{ color: '#64748b' }} />}
                                            <Typography variant="body2" sx={{ color: reg.attendanceStatus === 'PRESENT' ? '#10B981' : '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {reg.attendanceStatus === 'PRESENT' ? 'Attended' : 'Missed'}
                                            </Typography>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default StudentRegistrations;
