import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import LiveStatusChip from '../components/LiveStatusChip';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Container, Typography, Grid, Card, CardContent, Chip, Stack, TextField, MenuItem,
    InputAdornment
} from '@mui/material';
import { CalendarMonth, AccessTime, LocationOn, People, Search, EventBusy } from '@mui/icons-material';

const EventsListPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    const loadEvents = () => {
        api.get('/api/events').then(r => setEvents(r.data.data || [])).catch(() => { });
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

    const statusColors = {
        UPCOMING: { bg: 'rgba(198,40,40,0.08)', color: '#C62828' },
        COMPLETED: { bg: 'rgba(46,125,50,0.08)', color: '#2E7D32' },
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#FAFAFA' }}>
            <Navbar />
            <Container maxWidth="lg" sx={{ pt: 12, pb: 6 }}>
                <Box className="animate-fade-in-up" sx={{ mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#212121', mb: 0.5 }}>
                        Browse Events
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#757575', mb: 3 }}>
                        Find and register for university events
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

                <Typography variant="body2" sx={{ color: '#757575', mb: 2 }}>
                    Showing <Box component="span" sx={{ color: '#212121', fontWeight: 600 }}>{filtered.length}</Box> event{filtered.length !== 1 ? 's' : ''}
                </Typography>

                <Grid container spacing={3}>
                    {filtered.map((ev, i) => (
                        <Grid item xs={12} sm={6} md={4} key={ev.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                            <Card className="hover-lift" sx={{ height: '100%', cursor: 'pointer' }}
                                onClick={() => navigate(`/events/${ev.id}`)}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <LiveStatusChip event={ev} />
                                        <Chip icon={<People sx={{ fontSize: 14 }} />}
                                            label={`${ev.registeredCount}/${ev.capacity}`} size="small" variant="outlined"
                                            sx={{ borderColor: '#E0E0E0', fontSize: '0.75rem' }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ mb: 1.5, fontWeight: 600, lineHeight: 1.3, fontSize: '1.05rem', color: '#212121' }}>
                                        {ev.title}
                                    </Typography>
                                    {ev.description && (
                                        <Typography variant="body2" sx={{
                                            color: '#757575', mb: 2, lineHeight: 1.5,
                                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        }}>{ev.description}</Typography>
                                    )}
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

                {filtered.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 10 }} className="animate-fade-in">
                        <EventBusy sx={{ fontSize: 64, color: '#E0E0E0', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#757575', mb: 0.5 }}>No events found</Typography>
                        <Typography variant="body2" sx={{ color: '#9E9E9E' }}>
                            {search ? 'Try adjusting your search or filter' : 'Check back later for new events'}
                        </Typography>
                    </Box>
                )}
            </Container>
        </Box>
    );
};

export default EventsListPage;
