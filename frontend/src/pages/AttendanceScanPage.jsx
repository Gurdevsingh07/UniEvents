import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Grid, TextField, Button, Alert, Snackbar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Stack,
    LinearProgress, CircularProgress, Paper, IconButton, Tabs, Tab, Skeleton, alpha, Avatar, Divider
} from '@mui/material';
import {
    FaceRetouchingNatural, Search, CheckCircle, ErrorOutline, PersonSearch,
    ArrowBack, Event as EventIcon, LocationOn, People, Timer, Bolt, CalendarMonth, CameraAlt, Key
} from '@mui/icons-material';
// QR Scanner removed
import * as faceapi from 'face-api.js';

const AttendanceScanPage = () => {
    const { eventId: paramEventId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [eventId, setEventId] = useState(paramEventId || '');
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [studentId, setStudentId] = useState('');
    const [otp, setOtp] = useState('');
    const [tab, setTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [sessionStatus, setSessionStatus] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const faceVideoRef = useRef();
    const faceCanvasRef = useRef();
    const [faceLoading, setFaceLoading] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [faceStream, setFaceStream] = useState(null);
    const faceStreamRef = useRef(null);
    const lastRecognizedRef = useRef(null);
    const lastCheckInTime = useRef(0);

    const isAdmin = user?.role === 'ADMIN';

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const endpoint = isAdmin ? '/api/events' : '/api/events/my';
                const r = await api.get(endpoint);
                setEvents(r.data.data || []);
            } catch (err) {
                console.error('Events load error:', err);
                setSnackbar({ open: true, message: 'We could not load the events. Please try again.', severity: 'error' });
            } finally {
                setDataLoading(false);
            }
        };
        fetchEvents();
    }, [isAdmin]);

    useEffect(() => {
        if (eventId) {
            loadStats();
            loadAttendance();
            loadSessionStatus();
        }
    }, [eventId]);

    useEffect(() => {
        const loadModels = async () => {
            const URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(URL),
                    faceapi.nets.faceLandmark68Net.loadFromUri(URL),
                    faceapi.nets.faceRecognitionNet.loadFromUri(URL)
                ]);
                setModelsLoaded(true);
            } catch (err) { console.error('Face models error:', err); }
        };
        loadModels();
    }, []);

    useEffect(() => {
        let interval;
        const startFaceSync = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error("Camera API not available (Face Sync). Insecure context?");
                setSnackbar({
                    open: true,
                    message: 'Camera requires a secure (HTTPS) connection or localhost.',
                    severity: 'error'
                });
                return;
            }
            try {
                const s = await navigator.mediaDevices.getUserMedia({ video: true });
                setFaceStream(s);
                faceStreamRef.current = s;
                if (faceVideoRef.current) faceVideoRef.current.srcObject = s;

                interval = setInterval(async () => {
                    if (!faceVideoRef.current || !modelsLoaded || faceLoading) return;

                    const now = Date.now();
                    if (now - lastCheckInTime.current < 3000) return; // 3s cool-down

                    const detections = await faceapi.detectSingleFace(
                        faceVideoRef.current,
                        new faceapi.TinyFaceDetectorOptions()
                    ).withFaceLandmarks().withFaceDescriptor();

                    if (detections) {
                        // Very simple Liveness Check: Ensure both eyes are somewhat open and face size is reasonable
                        const landmarks = detections.landmarks;
                        const leftEye = landmarks.getLeftEye();
                        const rightEye = landmarks.getRightEye();

                        const leftEyeHeight = Math.abs(leftEye[4].y - leftEye[2].y);
                        const rightEyeHeight = Math.abs(rightEye[4].y - rightEye[2].y);
                        const eyeDist = Math.abs(rightEye[0].x - leftEye[3].x);

                        // If eye height is extremely low compared to eye distance, might be a blink/photo
                        const EAR = (leftEyeHeight + rightEyeHeight) / (2.0 * eyeDist);

                        // EAR threshold for a blink is typically < 0.2. 
                        // If it's too high or extremely low consistently, reject. For a fast scan, we just ensure it's > 0.15.
                        if (EAR < 0.15) {
                            console.log("Liveness check failed: Possible blink or flat image");
                            return;
                        }

                        const { descriptor } = detections;
                        setFaceLoading(true);
                        try {
                            const r = await api.post(`/api/events/${eventId}/check-in/face`, {
                                embedding: Array.from(descriptor)
                            });

                            setSnackbar({
                                open: true,
                                message: `FACE SYNC: ${r.data.user.fullName} checked in!`,
                                severity: 'success'
                            });
                            lastCheckInTime.current = Date.now();
                            loadStats();
                            loadAttendance();
                        } catch (err) {
                            const msg = err.response?.data?.message || 'Face match failed or error';
                            const status = err.response?.data?.status;
                            if (status === 'ALREADY_CHECKED_IN') {
                                setSnackbar({ open: true, message: msg, severity: 'info' });
                            } else if (err.response?.status !== 404) {
                                // Don't show snackbar for NO_MATCH (404) since it's normal during scanning
                                setSnackbar({ open: true, message: msg, severity: 'warning' });
                            }
                        } finally {
                            setFaceLoading(false);
                        }
                    }
                }, 800);
            } catch (err) {
                console.error('Camera error:', err);
                const msg = err.name === 'NotReadableError'
                    ? 'Camera is in use by another tab or application. Close other tabs using the camera and refresh.'
                    : err.name === 'NotAllowedError'
                        ? 'Camera permission denied. Please allow camera access in your browser settings.'
                        : 'Could not access camera. Please check your device.';
                setSnackbar({ open: true, message: msg, severity: 'error' });
            }
        };

        if (tab === 0 && eventId && sessionStatus?.status === 'ACTIVE') {
            startFaceSync();
        } else {
            if (faceStreamRef.current) {
                faceStreamRef.current.getTracks().forEach(t => t.stop());
                faceStreamRef.current = null;
                setFaceStream(null);
            }
            clearInterval(interval);
        }
        return () => {
            if (faceStreamRef.current) {
                faceStreamRef.current.getTracks().forEach(t => t.stop());
                faceStreamRef.current = null;
            }
            clearInterval(interval);
        };
    }, [tab, eventId, modelsLoaded, sessionStatus]);

    // QR Scanner lifecycle removed

    const loadSessionStatus = async () => {
        try {
            const res = await api.get(`/api/attendance/session/status/${eventId}`);
            setSessionStatus(res.data);
        } catch (err) {
            console.error("Failed to load session status", err);
        }
    };

    const handleSessionAction = async (action) => {
        try {
            const res = await api.post(`/api/attendance/session/${action}/${eventId}`);
            setSessionStatus(res.data);
            setSnackbar({ open: true, message: `Session ${action}ed successfully!`, severity: 'success' });
        } catch (err) {
            const msg = err.response?.data?.message || `Failed to ${action} session`;
            setSnackbar({ open: true, message: msg, severity: 'error' });
        }
    };

    const loadStats = () => {
        api.get(`/api/events/${eventId}/stats`).then(r => setStats(r.data.data)).catch(() => { });
    };

    const loadAttendance = () => {
        api.get(`/api/attendance/event/${eventId}`).then(r => setAttendance(r.data.data || [])).catch(() => { });
    };

    const handleManualCheckIn = async () => {
        if (!studentId.trim() || !eventId) return;
        await handleCheckIn({ studentId: studentId.trim(), eventId: parseInt(eventId), sessionToken: sessionStatus?.token });
        setStudentId('');
    };

    const handleOtpCheckIn = async () => {
        if (!studentId.trim() || !otp.trim() || !eventId) return;
        setLoading(true);
        try {
            const res = await api.post('/api/attendance/verify-otp', {
                studentId: studentId.trim(),
                otp: otp.trim(),
                eventId: parseInt(eventId),
                sessionToken: sessionStatus?.token
            });
            setSnackbar({ open: true, message: `${res.data.data.userName} checked in via OTP!`, severity: 'success' });
            loadStats();
            loadAttendance();
            setStudentId('');
            setOtp('');
        } catch (err) {
            const msg = err.response?.data?.message || 'OTP verification failed';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (data) => {
        setLoading(true);
        try {
            const res = await api.post('/api/attendance/checkin', data);
            setSnackbar({ open: true, message: `${res.data.data.userName} checked in successfully!`, severity: 'success' });
            loadStats();
            loadAttendance();
        } catch (err) {
            const msg = err.response?.data?.message || 'We could not check you in. Please try again.';
            setSnackbar({ open: true, message: msg, severity: msg.includes('Already') ? 'warning' : 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (!eventId) {
        return (
            <DashboardLayout>
                {/* Premium Header */}
                <Box className="animate-fade-in-up" sx={{
                    mb: 4, p: 4, borderRadius: 1.5,
                    bgcolor: '#212121',
                    color: '#FFF', position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px', position: 'relative', zIndex: 1, color: '#fff' }}>
                        Attendance Check-in
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                        <FaceRetouchingNatural sx={{ fontSize: 20 }} /> Select an event to begin attendance check-in
                    </Typography>
                </Box>

                {dataLoading ? (
                    <Grid container spacing={3}>
                        {[1, 2, 3].map(i => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 1.5 }} />
                            </Grid>
                        ))}
                    </Grid>
                ) : events.length > 0 ? (
                    <Grid container spacing={3}>
                        {events.map(ev => (
                            <Grid item xs={12} sm={6} md={4} key={ev.id}>
                                <Card className="hover-lift" sx={{
                                    cursor: 'pointer', borderRadius: 1.5,
                                    border: '1px solid #eef2f6', transition: 'all 0.3s ease',
                                    '&:hover': { borderColor: '#D32F2F', bgcolor: alpha('#D32F2F', 0.01) }
                                }} onClick={() => setEventId(String(ev.id))}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Chip label={ev.status} size="small" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.65rem' }} />
                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarMonth sx={{ fontSize: 14 }} /> {new Date(ev.eventDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: '#1a1d23', lineHeight: 1.2 }}>{ev.title}</Typography>
                                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                            <LocationOn sx={{ fontSize: 14 }} /> {ev.venue}
                                        </Typography>
                                        <Divider sx={{ mb: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#101010' }}>{ev.registeredCount} Registered</Typography>
                                            <IconButton size="small" sx={{ bgcolor: '#f8f9fa' }}><Bolt sx={{ fontSize: 18, color: '#D32F2F' }} /></IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 1.5, bgcolor: '#f8f9fa', border: '1px dashed #dee2e6' }}>
                        <Typography variant="body1" color="text.secondary">No events found for attendance tracking.</Typography>
                    </Paper>
                )}
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <IconButton onClick={() => setEventId('')} sx={{ bgcolor: '#fff', border: '1px solid #eef2f6' }}>
                    <ArrowBack />
                </IconButton>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5, letterSpacing: '-1.5px' }}>Check-in Console</Typography>
                    <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700 }}>{stats?.eventTitle || 'Loading event details...'}</Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                {sessionStatus && sessionStatus.status !== 'NO_SESSION' && sessionStatus.status !== 'CLOSED' && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {sessionStatus.status === 'ACTIVE' ? (
                            <Button variant="contained" color="warning" onClick={() => handleSessionAction('pause')} sx={{ fontWeight: 800 }}>
                                Pause Scanning
                            </Button>
                        ) : (
                            <Button variant="contained" color="success" onClick={() => handleSessionAction('resume')} sx={{ fontWeight: 800 }}>
                                Resume Scanning
                            </Button>
                        )}
                        <Button variant="outlined" color="error" onClick={() => handleSessionAction('close')} sx={{ fontWeight: 800 }}>
                            End Session
                        </Button>
                    </Box>
                )}
                {sessionStatus?.status === 'NO_SESSION' && (
                    <Button variant="contained" color="primary" onClick={() => handleSessionAction('start')} sx={{ fontWeight: 800 }}>
                        Start Scanning Session
                    </Button>
                )}
                {sessionStatus?.status === 'CLOSED' && (
                    <Chip label="Session Closed" color="error" variant="outlined" sx={{ fontWeight: 800 }} />
                )}
            </Box>

            {/* Stats Bar */}
            {stats && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {[
                        { label: 'Registered', value: stats.totalRegistered, color: '#6366f1' },
                        { label: 'Present', value: stats.totalPresent, color: '#10b981' },
                        { label: 'Absent', value: stats.totalAbsent, color: '#D32F2F' },
                        { label: 'Attendance', value: `${stats.attendancePercentage}%`, color: '#f59e0b' },
                    ].map((s, i) => (
                        <Grid item xs={6} sm md key={i}>
                            <Card sx={{ borderRadius: 1.5, borderLeft: `4px solid ${s.color}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <CardContent sx={{ py: 2.5, px: 3 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 900, color: s.color }}>{s.value}</Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Grid container spacing={4}>
                <Grid item xs={12} md={5}>
                    <Card sx={{ borderRadius: 1.5, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid #f0f0f0' }}>
                                <Tab sx={{ fontWeight: 800 }} icon={<FaceRetouchingNatural />} iconPosition="start" label="Face Scanner" />
                                <Tab sx={{ fontWeight: 800 }} icon={<Key />} iconPosition="start" label="OTP" />
                                <Tab sx={{ fontWeight: 800 }} icon={<PersonSearch />} iconPosition="start" label="Admin" />
                            </Tabs>
                            {tab === 0 ? (
                                <Box sx={{ position: 'relative' }}>
                                    {sessionStatus?.status !== 'ACTIVE' ? (
                                        <Box sx={{
                                            position: 'relative', width: '100%', aspectRatio: '1/1', bgcolor: '#f1f5f9',
                                            borderRadius: 3, overflow: 'hidden', border: '2px solid #e2e8f0',
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <CameraAlt sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
                                            <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 800 }}>Camera Paused</Typography>
                                            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>{sessionStatus?.status === 'NO_SESSION' ? 'Start a session to begin scanning' : 'Session is currently paused or closed'}</Typography>
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            position: 'relative', width: '100%', aspectRatio: '1/1', bgcolor: '#000',
                                            borderRadius: 3, overflow: 'hidden', border: '2px solid #10b981'
                                        }}>
                                            <video ref={faceVideoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                            <canvas ref={faceCanvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }} />
                                            {faceLoading && (
                                                <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
                                                    <CircularProgress sx={{ color: '#fff' }} />
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                    <Typography variant="caption" sx={{ textAlign: 'center', display: 'block', mt: 2, color: '#64748b', fontWeight: 700 }}>
                                        BIOMETRIC SCAN: Multi-pose face identification
                                    </Typography>
                                </Box>
                            ) : tab === 1 ? (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 800, color: '#101010' }}>Verify Anti-Proxy OTP</Typography>
                                    <TextField fullWidth label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)}
                                        sx={{ mb: 2 }} placeholder="Enter student ID..." />
                                    <TextField fullWidth label="6-Digit OTP" value={otp} onChange={e => setOtp(e.target.value)}
                                        sx={{ mb: 3 }} placeholder="000000" inputProps={{ maxLength: 6, style: { fontSize: '1.5rem', textAlign: 'center', letterSpacing: '8px', fontWeight: 900 } }} />
                                    <Button fullWidth variant="contained" size="large" onClick={handleOtpCheckIn}
                                        disabled={loading || !studentId.trim() || !otp.trim() || sessionStatus?.status !== 'ACTIVE'} sx={{ fontWeight: 800, py: 1.5 }}>
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify & Check-in'}
                                    </Button>
                                    <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem', fontWeight: 600 }}>
                                        Use OTP if a student's face scan fails or for low-connectivity backup.
                                    </Alert>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 800, color: '#101010' }}>Administrative Override</Typography>
                                    <TextField fullWidth label="Student ID / Roll Number" value={studentId} onChange={e => setStudentId(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleManualCheckIn()} sx={{ mb: 2 }}
                                        placeholder="Enter student ID..." disabled={sessionStatus?.status !== 'ACTIVE'} />
                                    <Button fullWidth variant="contained" size="large" onClick={handleManualCheckIn}
                                        disabled={loading || !studentId.trim() || sessionStatus?.status !== 'ACTIVE'} sx={{ fontWeight: 800, py: 1.5 }}>
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Confirm Check-in'}
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={7}>
                    <Card sx={{ borderRadius: 1.5, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ p: 3, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6" sx={{ fontWeight: 900 }}>Check-in Log</Typography>
                                <Chip label={`${attendance.length} Total`} size="small" sx={{ fontWeight: 800 }} />
                            </Box>
                            <TableContainer sx={{ maxHeight: 450 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Student</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }}>Details</TableCell>
                                            <TableCell sx={{ fontWeight: 800, bgcolor: '#f8f9fa' }} align="right">Time</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {attendance.map((a, i) => {
                                            const isPresent = a.status === 'PRESENT';
                                            return (
                                                <TableRow key={a.userId} hover>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: isPresent ? '#10b981' : '#e2e8f0' }}>{a.userName[0]}</Avatar>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{a.userName}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{a.studentId || '—'}</TableCell>
                                                    <TableCell align="right">
                                                        {isPresent ? (
                                                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#10b981' }}>{new Date(a.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Typography>
                                                        ) : (
                                                            <Chip label={a.status} size="small" variant="outlined" color={a.status === 'ABSENT' ? 'error' : 'default'} sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {attendance.length === 0 && (
                                <Box sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>No check-in activity recorded yet.</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1, width: '100%', fontSize: '0.9rem', fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout >
    );
};

export default AttendanceScanPage;
