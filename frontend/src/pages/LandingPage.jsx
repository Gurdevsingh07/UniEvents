import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LiveStatusChip from '../components/LiveStatusChip';
import {
    Box, Container, Typography, Button, Card, CardContent, Grid, Chip, Stack,
    Divider
} from '@mui/material';
import {
    QrCodeScanner, Assessment, Speed, CalendarMonth,
    LocationOn, ArrowForward, People, Shield, School
} from '@mui/icons-material';

const useCountUp = (target, duration = 1800) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && !started.current) {
                started.current = true;
                const start = Date.now();
                const step = () => {
                    const elapsed = Date.now() - start;
                    const progress = Math.min(elapsed / duration, 1);
                    const eased = 1 - Math.pow(1 - progress, 3);
                    setCount(Math.floor(eased * target));
                    if (progress < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.3 });
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [target, duration]);
    return { count, ref };
};

const LandingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);

    useEffect(() => {
        api.get('/api/events/upcoming').then(r => setEvents(r.data.data?.slice(0, 6) || [])).catch(() => { });
    }, []);

    const studentCounter = useCountUp(500);
    const eventCounter = useCountUp(50);
    const attendanceCounter = useCountUp(95);

    const features = [
        { icon: <QrCodeScanner sx={{ fontSize: 36 }} />, title: 'QR Check-in', desc: 'Instant attendance verification with a single scan. No more paper sign-ins.' },
        { icon: <Assessment sx={{ fontSize: 36 }} />, title: 'Real-time Reports', desc: 'Generate PDF & Excel reports instantly with attendance analytics.' },
        { icon: <Speed sx={{ fontSize: 36 }} />, title: 'Live Dashboard', desc: 'Monitor registrations, check-ins, and event performance in real-time.' },
        { icon: <Shield sx={{ fontSize: 36 }} />, title: 'Secure & Reliable', desc: 'Built with robust authentication and role-based access control.' },
    ];

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
            <Navbar />

            {/* Hero */}
            <Box sx={{ pt: { xs: 14, md: 18 }, pb: { xs: 8, md: 12 }, px: 2, textAlign: 'center', bgcolor: '#FFFFFF', borderBottom: '1px solid #E0E0E0' }}>
                <Container maxWidth="md">
                    <Chip icon={<School sx={{ fontSize: 16 }} />} label="University Event Management" className="animate-fade-in-up" sx={{
                        mb: 3, bgcolor: '#FAFAFA', color: '#212121', fontWeight: 600, border: '1px solid #E0E0E0', borderRadius: 1,
                    }} />
                    <Typography variant="h2" component="h1" className="animate-fade-in-up stagger-1" sx={{
                        fontSize: { xs: '2rem', md: '3.2rem' }, fontWeight: 800, mb: 2.5, lineHeight: 1.15, color: '#212121',
                    }}>
                        Simplify Event Management.{' '}
                        <Box component="span" sx={{ color: '#C62828' }}>Build Engagement.</Box>
                    </Typography>
                    <Typography variant="h6" className="animate-fade-in-up stagger-2" sx={{
                        color: '#757575', mb: 4, fontWeight: 400, maxWidth: 580, mx: 'auto',
                        fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7,
                    }}>
                        Replace manual registers with instant QR-code scanning, real-time dashboards, and automated reports — all in one platform.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" className="animate-fade-in-up stagger-3">
                        {user ? (
                            <Button variant="contained" size="large" endIcon={<ArrowForward />}
                                onClick={() => navigate(user.role === 'ADMIN' ? '/admin' : user.role === 'ORGANIZER' ? '/organizer' : '/student')}
                                sx={{ px: 4, py: 1.5, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
                                Go to Dashboard
                            </Button>
                        ) : (
                            <>
                                <Button variant="contained" size="large" component={Link} to="/register"
                                    endIcon={<ArrowForward />} sx={{ px: 4, py: 1.5, bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' } }}>
                                    Get Started Free
                                </Button>
                                <Button variant="outlined" size="large" component={Link} to="/login"
                                    sx={{ px: 4, py: 1.5, borderColor: '#757575', color: '#757575', '&:hover': { borderColor: '#C62828', color: '#C62828' } }}>
                                    Sign In
                                </Button>
                            </>
                        )}
                    </Stack>

                    {/* Stats */}
                    <Stack direction="row" spacing={{ xs: 4, md: 8 }} justifyContent="center" sx={{ mt: 7 }} className="animate-fade-in-up stagger-4">
                        {[
                            { ref: studentCounter.ref, value: studentCounter.count, suffix: '+', label: 'Active Students' },
                            { ref: eventCounter.ref, value: eventCounter.count, suffix: '+', label: 'Events Hosted' },
                            { ref: attendanceCounter.ref, value: attendanceCounter.count, suffix: '%', label: 'Check-in Rate' },
                        ].map((s, i) => (
                            <Box key={i} ref={s.ref} sx={{ textAlign: 'center' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: '#C62828' }}>
                                    {s.value}{s.suffix}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 500 }}>{s.label}</Typography>
                            </Box>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* Features */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
                <Typography variant="h4" textAlign="center" sx={{ mb: 1, fontWeight: 700, color: '#212121' }}>
                    Everything you need
                </Typography>
                <Typography variant="body1" textAlign="center" sx={{ color: '#757575', mb: 6, maxWidth: 480, mx: 'auto' }}>
                    A complete toolkit for organizing, managing, and tracking university events.
                </Typography>
                <Grid container spacing={3}>
                    {features.map((f, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i} className={`animate-fade-in-up stagger-${i + 1}`}>
                            <Card className="hover-lift" sx={{ height: '100%', cursor: 'default', border: '1px solid #E0E0E0', borderRadius: 1.5 }}>
                                <CardContent sx={{ textAlign: 'center', py: 4, px: 2.5 }}>
                                    <Box sx={{
                                        color: '#C62828', mb: 2, width: 60, height: 60, borderRadius: 1.5,
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: 'rgba(198,40,40,0.06)',
                                    }}>{f.icon}</Box>
                                    <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem', fontWeight: 700, color: '#212121' }}>{f.title}</Typography>
                                    <Typography variant="body2" sx={{ color: '#757575', lineHeight: 1.6 }}>{f.desc}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* Upcoming Events */}
            {events.length > 0 && (
                <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF', borderTop: '1px solid #E0E0E0', borderBottom: '1px solid #E0E0E0' }}>
                    <Container maxWidth="lg">
                        <Typography variant="h4" textAlign="center" sx={{ mb: 1, fontWeight: 700, color: '#212121' }}>
                            Upcoming Events
                        </Typography>
                        <Typography variant="body1" textAlign="center" sx={{ color: '#757575', mb: 6 }}>
                            Browse and register for the latest university events
                        </Typography>
                        <Grid container spacing={3}>
                            {events.map((ev, i) => (
                                <Grid item xs={12} sm={6} md={4} key={ev.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                                    <Card className="hover-lift" sx={{ height: '100%', cursor: 'pointer', borderRadius: 1.5 }}
                                        onClick={() => navigate(`/events/${ev.id}`)}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                                <LiveStatusChip event={ev} />
                                                <Chip icon={<People sx={{ fontSize: 14 }} />}
                                                    label={`${ev.registeredCount}/${ev.capacity}`} size="small" variant="outlined"
                                                    sx={{ borderColor: '#E0E0E0' }} />
                                            </Box>
                                            <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, lineHeight: 1.3, color: '#212121' }}>{ev.title}</Typography>
                                            <Stack spacing={0.8}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#757575' }}>
                                                    <CalendarMonth sx={{ fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ color: '#757575' }}>
                                                        {new Date(ev.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#757575' }}>
                                                    <LocationOn sx={{ fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ color: '#757575' }}>{ev.venue}</Typography>
                                                </Box>
                                            </Stack>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Box sx={{ textAlign: 'center', mt: 5 }}>
                            <Button component={Link} to="/events" variant="outlined" endIcon={<ArrowForward />}
                                sx={{ borderColor: '#757575', color: '#757575', px: 4, '&:hover': { borderColor: '#C62828', color: '#C62828' } }}>
                                View All Events
                            </Button>
                        </Box>
                    </Container>
                </Box>
            )}

            {/* Footer */}
            <Box sx={{ py: 5, bgcolor: '#212121' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="flex-start">
                        <Grid item xs={12} md={4}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', mb: 1 }}>UniEvents</Typography>
                            <Typography variant="body2" sx={{ color: '#9E9E9E', lineHeight: 1.7 }}>
                                University Event Management System. Simplifying event organization with modern, reliable tools.
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: 1.5, mb: 1.5, display: 'block', fontWeight: 600 }}>
                                Quick Links
                            </Typography>
                            <Stack spacing={0.8}>
                                {[{ text: 'Browse Events', path: '/events' }, { text: 'Create Account', path: '/register' }, { text: 'Sign In', path: '/login' }].map(l => (
                                    <Typography key={l.text} variant="body2" component={Link} to={l.path}
                                        sx={{ color: '#9E9E9E', '&:hover': { color: '#EF5350' }, transition: 'color 0.15s' }}>
                                        {l.text}
                                    </Typography>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography variant="caption" sx={{ color: '#757575', textTransform: 'uppercase', letterSpacing: 1.5, mb: 1.5, display: 'block', fontWeight: 600 }}>
                                Features
                            </Typography>
                            <Stack spacing={0.8}>
                                {['QR Code Check-in', 'Real-time Analytics', 'Report Generation'].map(t => (
                                    <Typography key={t} variant="body2" sx={{ color: '#9E9E9E' }}>{t}</Typography>
                                ))}
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 3, borderColor: '#333333' }} />
                    <Typography variant="body2" sx={{ color: '#757575', textAlign: 'center' }}>
                        © {new Date().getFullYear()} UniEvents — University Event Management System
                    </Typography>
                </Container>
            </Box>
        </Box>
    );
};

export default LandingPage;
