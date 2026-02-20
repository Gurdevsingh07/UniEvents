import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Button, IconButton,
    Snackbar, Alert, Skeleton
} from '@mui/material';
import {
    Event, Delete
} from '@mui/icons-material';

import { useAuth } from '../context/AuthContext';

const OrganizerHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [pastEvents, setPastEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = user?.role === 'ADMIN';

    const loadEvents = async () => {
        try {
            const res = await api.get('/api/events/history');
            setPastEvents(res.data.data || []);
        } catch (err) {
            console.error('Failed to load history', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load event history', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadEvents(); }, []);
    useAutoRefresh(loadEvents);

    const handleDelete = async (ev) => {
        if (!window.confirm(`Permanently delete "${ev.title}"?`)) return;
        try {
            await api.delete(`/api/events/${ev.id}`);
            setSnackbar({ open: true, message: 'Event deleted forever.', severity: 'success' });
            loadEvents();
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to delete event.', severity: 'error' });
        }
    };

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up" sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#212121', mb: 0.5 }}>
                    {isAdmin ? 'Manage History' : 'Event History'}
                </Typography>
                <Typography variant="body1" sx={{ color: '#757575' }}>
                    {isAdmin ? 'Comprehensive record of all past system events.' : 'View your past and cancelled events (last 6 months).'}
                </Typography>
            </Box>

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : pastEvents.length === 0 ? (
                <Card sx={{ borderRadius: 1.5, bgcolor: '#FAFAFA', border: '1px dashed #E0E0E0', boxShadow: 'none' }}>
                    <CardContent sx={{ textAlign: 'center', py: 6 }}>
                        <Event sx={{ fontSize: 48, color: '#E0E0E0', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#757575', mb: 1, fontWeight: 600 }}>No history found</Typography>
                        <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
                            Past events will appear here.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {pastEvents.map((ev, i) => (
                        <Grid item xs={12} sm={6} md={4} key={ev.id} className={`animate-fade-in-up stagger-${i + 1}`}>
                            <Card sx={{ height: '100%', borderRadius: 1.5, bgcolor: '#F5F5F5', border: '1px solid #E0E0E0', boxShadow: 'none' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Chip label={ev.status} size="small"
                                            sx={{
                                                bgcolor: ev.status === 'CANCELLED' ? '#FFEBEE' : '#E0E0E0',
                                                color: ev.status === 'CANCELLED' ? '#D32F2F' : '#616161',
                                                fontWeight: 600, height: 24
                                            }} />
                                        <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                                            {new Date(ev.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                        </Typography>
                                    </Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: '#616161', textDecoration: ev.status === 'CANCELLED' ? 'line-through' : 'none' }}>
                                        {ev.title}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                                        <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 600 }}>
                                            {ev.attendedCount} Present
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#D32F2F', fontWeight: 600 }}>
                                            {ev.registeredCount - ev.attendedCount} Absent
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button size="small" onClick={() => navigate(`/organizer/reports/${ev.id}`)}
                                            sx={{ flex: 1, color: '#616161', borderColor: '#BDBDBD' }} variant="outlined">
                                            Report
                                        </Button>
                                        <IconButton size="small" onClick={() => handleDelete(ev)}
                                            sx={{ border: '1px solid #EF9A9A', borderRadius: 1, color: '#D32F2F' }}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1 }} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default OrganizerHistory;
