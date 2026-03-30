import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Stack, Button, Alert, Snackbar, Skeleton, IconButton
} from '@mui/material';
import {
    CalendarMonth, LocationOn, Event, ArrowForward, ConfirmationNumber, CheckCircle, Cancel,
    FaceRetouchingNatural, Download, Key, Timer
} from '@mui/icons-material';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';

const StudentRegistrations = () => {
    const navigate = useNavigate();
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingCert, setDownloadingCert] = useState({});
    const [generatingOtp, setGeneratingOtp] = useState({});
    const [otpData, setOtpData] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadRegistrations = async () => {
        try {
            const res = await api.get('/api/registrations/my');
            const regs = res.data.data || [];

            // We also need certificates to map download tokens
            let certs = [];
            try {
                const certRes = await api.get('/api/certificates/my');
                certs = certRes.data || [];
            } catch (err) {
                console.error('Could not fetch certificates', err);
            }

            const certMap = {};
            certs.forEach(c => certMap[c.eventId] = c.downloadToken);

            const enrichedRegs = regs.map(r => ({
                ...r,
                certificateToken: certMap[r.eventId] || null
            }));

            setRegistrations(enrichedRegs);
        } catch (err) {
            console.error('Failed to load registrations', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'We could not load your registrations. Please try again.', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadCertificate = async (token, eventId) => {
        if (!token) return;
        setDownloadingCert(prev => ({ ...prev, [eventId]: true }));
        try {
            const response = await api.get(`/api/certificates/download/${token}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Certificate_${eventId}.html`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setSnackbar({ open: true, message: 'Certificate downloaded successfully!', severity: 'success' });
        } catch (err) {
            console.error('Certificate download failed', err);
            setSnackbar({ open: true, message: 'Failed to download certificate. Please try again.', severity: 'error' });
        } finally {
            setDownloadingCert(prev => ({ ...prev, [eventId]: false }));
        }
    };

    useEffect(() => { loadRegistrations(); }, []);
    useAutoRefresh(loadRegistrations);

    return (
        <DashboardLayout>
            {/* Header */}
            <Box sx={{
                mb: 3, p: 3.5, borderRadius: 1.5,
                background: '#101010',
                color: '#FFF',
            }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#fff' }}>
                    My Registrations
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ConfirmationNumber sx={{ fontSize: 18 }} /> {registrations.length} registered events
                </Typography>
            </Box>

            {loading ? (
                <Grid container spacing={2.5}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : registrations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                    <Event sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                    <Typography variant="body1" sx={{ color: '#757575', fontWeight: 600, mb: 1 }}>No registrations yet</Typography>
                    <Typography variant="body2" sx={{ color: '#9e9e9e', mb: 2 }}>
                        You haven't registered for any events yet.
                    </Typography>
                    <Button variant="text" size="small" endIcon={<ArrowForward />} onClick={() => navigate('/events')} sx={{ fontWeight: 700 }}>
                        Browse Events
                    </Button>
                </Box>
            ) : (
                <Grid container spacing={2.5}>
                    {registrations.map((reg) => (
                        <Grid item xs={12} sm={6} md={4} key={reg.id}>
                            <Card sx={{
                                height: '100%', borderRadius: 1.5, border: '1px solid #e8e8e8',
                                transition: 'border-color 0.15s',
                                '&:hover': { borderColor: '#D32F2F' },
                            }}>
                                <CardContent sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Chip
                                            label={reg.registrationStatus === 'WAITLISTED' ? `WAITLISTED #${reg.waitlistPosition}` : (reg.attendanceStatus || (reg.attended ? 'PRESENT' : 'REGISTERED'))}
                                            size="small"
                                            sx={{
                                                fontWeight: 700, fontSize: '0.7rem',
                                                bgcolor: reg.registrationStatus === 'WAITLISTED' ? '#f59e0b12' :
                                                    reg.attendanceStatus === 'PRESENT' ? '#10B98112' :
                                                        reg.attendanceStatus === 'ABSENT' ? '#D32F2F12' : '#f5f5f5',
                                                color: reg.registrationStatus === 'WAITLISTED' ? '#f59e0b' :
                                                    reg.attendanceStatus === 'PRESENT' ? '#10B981' :
                                                        reg.attendanceStatus === 'ABSENT' ? '#D32F2F' : '#757575',
                                            }}
                                        />
                                        <IconButton size="small" onClick={() => navigate(`/events/${reg.eventId}`)} sx={{ bgcolor: '#f5f5f5' }}>
                                            <ArrowForward sx={{ fontSize: 16 }} />
                                        </IconButton>
                                    </Box>

                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, lineHeight: 1.2, color: '#212121' }}>
                                        {reg.eventTitle}
                                    </Typography>

                                    <Stack spacing={1} sx={{ mb: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarMonth sx={{ fontSize: 16, color: '#757575' }} />
                                            <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                                                {new Date(reg.eventDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationOn sx={{ fontSize: 16, color: '#757575' }} />
                                            <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>{reg.eventVenue}</Typography>
                                        </Box>
                                    </Stack>

                                    {/* Face Verification Confirmation — replaces QR code */}
                                    {reg.attendanceStatus !== 'ABSENT' && reg.attendanceStatus !== 'PRESENT' ? (
                                        <Box sx={{
                                            textAlign: 'center', p: 2.5, bgcolor: '#fafafa', borderRadius: 1.5,
                                            border: '1px solid #f0f0f0',
                                        }}>
                                            <FaceRetouchingNatural sx={{ fontSize: 36, color: '#D32F2F', mb: 1 }} />
                                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Face Verification Required
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9e9e9e', display: 'block', mt: 0.5, mb: 2 }}>
                                                Check in at the event using face scan
                                            </Typography>
                                            <Button
                                                fullWidth
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                startIcon={<Key />}
                                                onClick={() => handleGenerateOtp(reg.eventId)}
                                                disabled={generatingOtp[reg.eventId] || reg.registrationStatus === 'WAITLISTED'}
                                                sx={{ fontWeight: 800, borderRadius: 1.5 }}
                                            >
                                                {generatingOtp[reg.eventId] ? 'Generating...' : 'Get Check-in OTP'}
                                            </Button>
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
                                            bgcolor: reg.attendanceStatus === 'PRESENT' ? '#10B98108' : '#fafafa',
                                            borderRadius: 1.5, border: '1px dashed #e0e0e0'
                                        }}>
                                            {reg.attendanceStatus === 'PRESENT' ? <CheckCircle sx={{ color: '#10B981' }} /> : <Cancel sx={{ color: '#9e9e9e' }} />}
                                            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: reg.attendanceStatus === 'PRESENT' ? '#10B981' : '#9e9e9e' }}>
                                                {reg.attendanceStatus === 'PRESENT' ? 'Attended' : 'Missed'}
                                            </Typography>
                                            {reg.attendanceStatus === 'PRESENT' && reg.certificateToken && (
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="success"
                                                    startIcon={<Download />}
                                                    onClick={() => handleDownloadCertificate(reg.certificateToken, reg.eventId)}
                                                    disabled={downloadingCert[reg.eventId]}
                                                    sx={{ mt: 1, fontWeight: 700, borderRadius: 1.5, fontSize: '0.7rem' }}
                                                >
                                                    {downloadingCert[reg.eventId] ? 'Downloading...' : 'Certificate'}
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>

            <Dialog open={!!otpData} onClose={() => setOtpData(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 900, textAlign: 'center', pb: 0 }}>Check-in OTP</DialogTitle>
                <DialogContent>
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: 8, color: '#D32F2F', mb: 2 }}>
                            {otpData?.otp}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <Timer sx={{ fontSize: 16 }} /> Valid for 5 minutes
                        </Typography>
                        <Alert severity="info" sx={{ mt: 3, fontWeight: 600, fontSize: '0.8rem', borderRadius: 1.5 }}>
                            Show this code to the event organizer if face scan is unavailable.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button fullWidth variant="contained" onClick={() => setOtpData(null)} sx={{ fontWeight: 800, borderRadius: 2 }}>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

export default StudentRegistrations;
