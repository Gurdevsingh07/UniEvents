import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import LiveStatusChip from '../components/LiveStatusChip';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Grid, Card, CardContent, Chip, Stack, TextField, MenuItem,
    InputAdornment, Skeleton, Snackbar, Alert
} from '@mui/material';
import { CalendarMonth, AccessTime, LocationOn, People, Search, EventBusy } from '@mui/icons-material';

const StudentEvents = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadEvents = async () => {
        try {
            const res = await api.get('/api/events');
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

    useEffect(() => { loadEvents(); }, []);
    useAutoRefresh(loadEvents);

    const filtered = events
        .filter(e => {
            if (filter === 'all') return e.status !== 'CANCELLED';
            if (filter === 'upcoming') return e.status === 'UPCOMING' || e.status === 'ONGOING';
            return e.status === 'COMPLETED';
        })
        .filter(e => search === '' ? true : e.title.toLowerCase().includes(search.toLowerCase()) || e.venue?.toLowerCase().includes(search.toLowerCase()));

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up" sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, color: '#212121', mb: 0.5 }}>
                            Browse Events
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#757575' }}>
                            Discover and register for upcoming university events.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                        <TextField placeholder="Search events..." size="small" value={search}
                            onChange={e => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 220, bgcolor: '#FFFFFF' }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment>
                            }} />
                        <TextField select size="small" value={filter} onChange={e => setFilter(e.target.value)} sx={{ minWidth: 150, bgcolor: '#FFFFFF' }}>
                            <MenuItem value="all">All Events</MenuItem>
                            <MenuItem value="upcoming">Upcoming</MenuItem>
                            <MenuItem value="completed">Past Events</MenuItem>
                        </TextField>
                    </Box>
                </Box>
            </Box>

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={240} sx={{ borderRadius: 1.5 }} />
                        </Grid>
                    ))}
                </Grid>
            ) : filtered.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }} className="animate-fade-in">
                    <EventBusy sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }} />
                    <Typography variant="h6" sx={{ color: '#757575', mb: 0.5 }}>No events found</Typography>
                    <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
                        {search ? 'Try adjusting your search or filter' : 'Check back later for new events'}
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {filtered.map((ev, i) => (
                        <Grid item xs={12} sm={6} md={4} key={ev.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                            <Card className="hover-lift" sx={{ height: '100%', cursor: 'pointer', borderRadius: 1.5 }}
                                onClick={() => navigate(`/events/${ev.id}`)}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <LiveStatusChip event={ev} />
                                        <Chip icon={<People sx={{ fontSize: 14 }} />}
                                            label={`${ev.registeredCount}/${ev.capacity}`} size="small" variant="outlined"
                                            sx={{ borderColor: '#E0E0E0', fontSize: '0.75rem', fontWeight: 600, color: '#757575' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, lineHeight: 1.3, fontSize: '1.05rem', color: '#212121' }}>
                                        {ev.title}
                                    </Typography>
                                    <Stack spacing={0.8}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#757575' }}>
                                            <CalendarMonth sx={{ fontSize: 17 }} />
                                            <Typography variant="body2" sx={{ color: '#757575' }}>
                                                {new Date(ev.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#757575' }}>
                                            <AccessTime sx={{ fontSize: 17 }} />
                                            <Typography variant="body2" sx={{ color: '#757575' }}>{ev.startTime}{ev.endTime ? ` - ${ev.endTime}` : ''}</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#757575' }}>
                                            <LocationOn sx={{ fontSize: 17 }} />
                                            <Typography variant="body2" sx={{ color: '#757575' }}>{ev.venue}</Typography>
                                        </Box>
                                    </Stack>
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

export default StudentEvents;
