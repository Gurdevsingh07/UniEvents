import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import LiveStatusChip from '../components/LiveStatusChip';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Stack, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Alert, Snackbar, Divider, Skeleton, TextField, InputAdornment, MenuItem
} from '@mui/material';
import {
    Event as EventIcon, People, QrCodeScanner, Assessment, Add,
    CalendarMonth, LocationOn, Visibility, Delete, CheckCircle, Search
} from '@mui/icons-material';

const OrganizerEvents = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [deleteDialog, setDeleteDialog] = useState({ open: false, event: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isAdmin = user?.role === 'ADMIN';

    const loadEvents = async () => {
        try {
            const endpoint = isAdmin ? '/api/events' : '/api/events/my';
            const res = await api.get(endpoint);
            setEvents(res.data.data || []);
        } catch (err) {
            console.error('Failed to load events', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load events', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadEvents(); }, [isAdmin]);
    useAutoRefresh(loadEvents);

    const handleDeleteClick = (ev) => {
        setDeleteDialog({ open: true, event: ev });
    };

    const handleDeleteConfirm = async () => {
        const ev = deleteDialog.event;
        if (!ev) return;
        setDeleteDialog({ open: false, event: null });
        try {
            await api.delete(`/api/events/${ev.id}`);
            setSnackbar({ open: true, message: 'Event status updated.', severity: 'success' });
            loadEvents();
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to update event.', severity: 'error' });
        }
    };

    const createPath = isAdmin ? '/admin/create-event' : '/organizer/create-event';

    const filteredEvents = useMemo(() => {
        return events.filter(ev => {
            const matchesSearch = ev.title.toLowerCase().includes(search.toLowerCase()) ||
                ev.venue?.toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || ev.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [events, search, statusFilter]);

    const stats = useMemo(() => {
        const totalRegistered = events.reduce((s, e) => s + (e.registeredCount || 0), 0);
        const totalAttended = events.reduce((s, e) => s + (e.attendedCount || 0), 0);
        return {
            total: events.length,
            registered: totalRegistered,
            attended: totalAttended,
            absent: totalRegistered - totalAttended
        };
    }, [events]);

    const statCards = [
        { label: isAdmin ? 'Total Events' : 'My Events', value: stats.total, icon: <EventIcon sx={{ fontSize: 28 }} />, color: '#2196F3' },
        { label: 'Registrations', value: stats.registered, icon: <People sx={{ fontSize: 28 }} />, color: '#FF9800' },
        { label: 'Check-ins', value: stats.attended, icon: <CheckCircle sx={{ fontSize: 28 }} />, color: '#4CAF50' },
        { label: 'Unattended', value: stats.absent, icon: <EventIcon sx={{ fontSize: 28 }} />, color: '#F44336' },
    ];

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: '#212121' }}>
                        {isAdmin ? 'Manage Events' : 'My Events'}
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#757575' }}>
                        {isAdmin ? 'Comprehensive overview of all system events.' : 'Manage and track your active events.'}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate(createPath)}
                    sx={{ bgcolor: '#C62828', '&:hover': { bgcolor: '#B71C1C' }, height: 44, px: 3, borderRadius: 1 }}>
                    Create Event
                </Button>
            </Box>

            {/* Stats Section */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {loading ? (
                    [1, 2, 3].map((i) => (
                        <Grid item xs={12} sm={4} key={i}>
                            <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))
                ) : (
                    statCards.map((s, i) => (
                        <Grid item xs={6} sm={3} key={i}>
                            <StatCard icon={s.icon} label={s.label} value={s.value} color={s.color} delay={i + 1} />
                        </Grid>
                    ))
                )}
            </Grid>

            {/* Filter Section */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                <TextField
                    placeholder="Search events..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ flex: 1, minWidth: 280, bgcolor: '#FFF' }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#9E9E9E' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <TextField
                    select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 160, bgcolor: '#FFF' }}
                    label="Status Filter"
                >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value="UPCOMING">Upcoming</MenuItem>
                    <MenuItem value="ONGOING">Ongoing</MenuItem>
                    <MenuItem value="COMPLETED">Completed</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                </TextField>
            </Box>

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={260} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : filteredEvents.length === 0 ? (
                <Card sx={{ borderRadius: 1.5, border: '1px dashed #E0E0E0', boxShadow: 'none', bgcolor: '#FAFAFA' }}>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <EventIcon sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#757575', mb: 1, fontWeight: 600 }}>No events found</Typography>
                        <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
                            {search || statusFilter !== 'ALL' ? 'Try adjusting your filters.' : 'Check back later or create a new event.'}
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Grid container spacing={3}>
                    {filteredEvents.map((ev, i) => (
                        <Grid item xs={12} sm={6} md={4} key={ev.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                            <Card className="hover-lift" sx={{ height: '100%', borderRadius: 1.5, overflow: 'visible' }}>
                                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'flex-start' }}>
                                        <LiveStatusChip event={ev} />
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Chip label={`${ev.attendedCount}/${ev.registeredCount}`}
                                                size="small"
                                                icon={<CheckCircle sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    bgcolor: 'rgba(76,175,80,0.1)', color: '#2E7D32', fontWeight: 600, fontSize: '0.75rem',
                                                    '& .MuiChip-icon': { color: '#2E7D32' }
                                                }} />
                                            <Chip label={`${ev.registeredCount - ev.attendedCount}`}
                                                size="small"
                                                icon={<People sx={{ fontSize: 14 }} />}
                                                sx={{
                                                    bgcolor: 'rgba(211,47,47,0.1)', color: '#D32F2F', fontWeight: 600, fontSize: '0.75rem',
                                                    '& .MuiChip-icon': { color: '#D32F2F' }
                                                }} />
                                        </Box>
                                    </Box>

                                    <Typography variant="h6" sx={{
                                        fontWeight: 700, mb: 1, fontSize: '1.1rem', color: '#212121', lineHeight: 1.3,
                                        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                    }}>
                                        {ev.title}
                                    </Typography>

                                    <Stack spacing={1} sx={{ mb: 3, flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#616161' }}>
                                            <Box sx={{ p: 0.8, borderRadius: 1, bgcolor: 'rgba(33,150,243,0.1)', color: '#2196F3' }}><CalendarMonth sx={{ fontSize: 16 }} /></Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                {new Date(ev.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#616161' }}>
                                            <Box sx={{ p: 0.8, borderRadius: 1, bgcolor: 'rgba(255,152,0,0.1)', color: '#FF9800' }}><LocationOn sx={{ fontSize: 16 }} /></Box>
                                            <Typography variant="body2" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {ev.venue}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    <Divider sx={{ my: 2, borderColor: '#F5F5F5' }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                                        <Button variant="contained" size="small" startIcon={<QrCodeScanner />}
                                            onClick={() => navigate(`/organizer/scan/${ev.id}`)}
                                            sx={{
                                                flex: 1, bgcolor: '#212121', color: '#FFF', borderRadius: 1, textTransform: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', '&:hover': { bgcolor: '#424242' }
                                            }}>
                                            Scan
                                        </Button>

                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <IconButton size="small" onClick={() => navigate(`/organizer/reports/${ev.id}`)}
                                                sx={{
                                                    border: '1px solid #E0E0E0', borderRadius: 1, color: '#757575',
                                                    '&:hover': { bgcolor: '#F5F5F5', color: '#2196F3', borderColor: '#2196F3' }
                                                }}>
                                                <Assessment fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => navigate(`/events/${ev.id}`)}
                                                sx={{
                                                    border: '1px solid #E0E0E0', borderRadius: 1, color: '#757575',
                                                    '&:hover': { bgcolor: '#F5F5F5', color: '#4CAF50', borderColor: '#4CAF50' }
                                                }}>
                                                <Visibility fontSize="small" />
                                            </IconButton>

                                            <IconButton size="small" onClick={() => handleDeleteClick(ev)}
                                                sx={{
                                                    border: '1px solid #EF9A9A', borderRadius: 2, color: '#D32F2F',
                                                    '&:hover': { bgcolor: '#FFEBEE', borderColor: '#D32F2F' }
                                                }}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, event: null })}
                PaperProps={{ sx: { borderRadius: 1.5, maxWidth: 420 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>{deleteDialog.event?.status === 'UPCOMING' ? 'Cancel Event?' : 'Delete Forever?'}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to {deleteDialog.event?.status === 'UPCOMING' ? 'cancel' : 'permanently delete'} "<b>{deleteDialog.event?.title}</b>"?
                        This action is irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteDialog({ open: false, event: null })}>Keep</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteConfirm}>Confirm</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default OrganizerEvents;
