import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, TextField, Button, Card, CardContent, Grid, Alert, Snackbar, CircularProgress,
    InputAdornment, Paper, Divider, IconButton, Switch, FormControlLabel, Chip, Stack,
    ToggleButton, ToggleButtonGroup, Autocomplete
} from '@mui/material';
import { Event, Description, CalendarToday, AccessTime, Place, Group, ArrowBack, Timer, Bolt, Schedule, People, CheckCircle } from '@mui/icons-material';

const CreateEventPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '', description: '', eventDate: '', endDate: '', startTime: '', endTime: '',
        venue: '', capacity: '', entryStartTime: '', entryEndTime: '',
        eventMode: 'PRE_SCHEDULED', onSpotRegistrationEnabled: false, assignedTeamIds: []
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [teams, setTeams] = useState([]);
    const [teamsLoading, setTeamsLoading] = useState(false);

    useEffect(() => {
        const fetchTeams = async () => {
            setTeamsLoading(true);
            try {
                const res = await api.get('/api/teams/my-teams');
                setTeams(res.data.data || []);
            } catch (err) {
                console.error('Failed to load teams', err);
            } finally {
                setTeamsLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const update = (f) => (e) => {
        setForm({ ...form, [f]: e.target.value });
        if (errors[f]) setErrors({ ...errors, [f]: '' });
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.eventDate) newErrors.eventDate = 'Date is required';
        if (!form.startTime) newErrors.startTime = 'Start time is required';
        if (!form.venue.trim()) newErrors.venue = 'Venue is required';
        if (!form.capacity || Number(form.capacity) <= 0) newErrors.capacity = 'Capacity must be a positive number';

        const getFullDateTime = (dateStr, timeStr) => {
            if (!dateStr || !timeStr) return null;
            return new Date(`${dateStr}T${timeStr}`);
        };

        const startDT = getFullDateTime(form.eventDate, form.startTime);
        const endDT = getFullDateTime(form.endDate || form.eventDate, form.endTime);

        if (startDT && endDT) {
            if (endDT <= startDT) {
                newErrors.endTime = 'End time must be after start time';
            }
        }

        const entryStartDT = getFullDateTime(form.eventDate, form.entryStartTime);
        const entryEndDT = getFullDateTime(form.endDate || form.eventDate, form.entryEndTime);

        if (entryStartDT && entryEndDT) {
            if (entryEndDT <= entryStartDT) {
                newErrors.entryEndTime = 'Entry end time must be after entry start time';
            }
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                title: form.title,
                description: form.description,
                capacity: parseInt(form.capacity),
                eventDate: form.eventDate || null,
                endDate: form.endDate || null,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                venue: form.venue,
                entryStartTime: form.entryStartTime || null,
                entryEndTime: form.entryEndTime || null,
                eventMode: form.eventMode,
                onSpotRegistrationEnabled: form.onSpotRegistrationEnabled,
                assignedTeamIds: form.assignedTeamIds,
            };
            await api.post('/api/events', payload);
            setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });

            const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/organizer';
            setTimeout(() => navigate(redirectPath), 1500);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create event', severity: 'error' });
        } finally { setLoading(false); }
    };

    const selectedTeamObjects = teams.filter(t => form.assignedTeamIds.includes(t.id));

    return (
        <DashboardLayout>
            <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 3, color: 'text.secondary' }}
                >
                    Back
                </Button>

                <Paper elevation={0} sx={{ borderRadius: 1.5, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                    <Box sx={{ p: 4, bgcolor: '#212121', borderBottom: '1px solid #e0e0e0' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                            Create New Event
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}>
                            Fill in the details below to schedule a new event.
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: 4 }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                {/* ────── EVENT MODE TOGGLE ────── */}
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', mb: 1.5, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                                        Event Mode
                                    </Typography>
                                    <ToggleButtonGroup
                                        value={form.eventMode}
                                        exclusive
                                        onChange={(e, val) => { if (val) setForm({ ...form, eventMode: val }); }}
                                        sx={{
                                            width: '100%',
                                            '& .MuiToggleButton-root': {
                                                flex: 1, textTransform: 'none', fontWeight: 600,
                                                borderRadius: '8px !important', border: '1.5px solid #E0E0E0 !important', mx: 0.5,
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828',
                                                    borderColor: '#C62828 !important',
                                                    '&:hover': { bgcolor: 'rgba(198,40,40,0.12)' }
                                                }
                                            }
                                        }}
                                    >
                                        <ToggleButton value="PRE_SCHEDULED">
                                            <Schedule sx={{ mr: 1, fontSize: 20 }} />
                                            Pre-Scheduled
                                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
                                                — Students register first
                                            </Typography>
                                        </ToggleButton>
                                        <ToggleButton value="INSTANT">
                                            <Bolt sx={{ mr: 1, fontSize: 20 }} />
                                            Instant
                                            <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
                                                — Attendance starts immediately
                                            </Typography>
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Grid>

                                {/* ────── TITLE ────── */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Event Title" value={form.title} onChange={update('title')}
                                        error={!!errors.title} helperText={errors.title}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><Event color="action" /></InputAdornment>) }}
                                        placeholder="e.g., Annual Tech Symposium"
                                    />
                                </Grid>

                                {/* ────── DESCRIPTION ────── */}
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth label="Description" multiline rows={4}
                                        value={form.description} onChange={update('description')}
                                        InputProps={{ startAdornment: (<InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}><Description color="action" /></InputAdornment>) }}
                                        placeholder="Describe the event details..."
                                    />
                                </Grid>

                                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                                {/* ────── DATE / TIME ────── */}
                                <Grid item xs={12} sm={3}>
                                    <TextField fullWidth label="Start Date" type="date" value={form.eventDate} onChange={update('eventDate')}
                                        error={!!errors.eventDate} helperText={errors.eventDate} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarToday color="action" /></InputAdornment>) }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <TextField fullWidth label="End Date" type="date" value={form.endDate} onChange={update('endDate')}
                                        error={!!errors.endDate} helperText={errors.endDate || 'Optional, for multi-day events'} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><CalendarToday color="action" /></InputAdornment>) }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth label="Start Time" type="time" value={form.startTime} onChange={update('startTime')}
                                        error={!!errors.startTime} helperText={errors.startTime} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><AccessTime color="action" /></InputAdornment>) }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                    <TextField fullWidth label="End Time" type="time" value={form.endTime} onChange={update('endTime')}
                                        error={!!errors.endTime} helperText={errors.endTime} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><AccessTime color="action" /></InputAdornment>) }}
                                    />
                                </Grid>

                                {/* ────── ENTRY CONTROL ────── */}
                                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>ENTRY CONTROL (OPTIONAL)</Typography></Divider></Grid>

                                <Grid item xs={6}>
                                    <TextField fullWidth label="Entry Start Time" type="time" value={form.entryStartTime} onChange={update('entryStartTime')}
                                        error={!!errors.entryStartTime} helperText={errors.entryStartTime || "When scanning begins"} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><Timer color="action" /></InputAdornment>) }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Entry End Time" type="time" value={form.entryEndTime} onChange={update('entryEndTime')}
                                        error={!!errors.entryEndTime} helperText={errors.entryEndTime || "When scanning stops"} InputLabelProps={{ shrink: true }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><Timer color="action" /></InputAdornment>) }}
                                    />
                                </Grid>

                                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                                {/* ────── VENUE / CAPACITY ────── */}
                                <Grid item xs={12} sm={8}>
                                    <TextField fullWidth label="Venue" value={form.venue} onChange={update('venue')}
                                        error={!!errors.venue} helperText={errors.venue}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><Place color="action" /></InputAdornment>) }}
                                        placeholder="e.g., Auditorium A"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Capacity" type="number" value={form.capacity} onChange={update('capacity')}
                                        error={!!errors.capacity} helperText={errors.capacity} inputProps={{ min: 1 }}
                                        InputProps={{ startAdornment: (<InputAdornment position="start"><Group color="action" /></InputAdornment>) }}
                                    />
                                </Grid>

                                {/* ────── ON-SPOT REGISTRATION ────── */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>REGISTRATION SETTINGS</Typography></Divider>
                                </Grid>
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121' }}>
                                                Allow On-Spot Registration
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#757575' }}>
                                                Students can register at the event venue even if they didn't pre-register
                                            </Typography>
                                        </Box>
                                        <Switch
                                            checked={form.onSpotRegistrationEnabled}
                                            onChange={(e) => setForm({ ...form, onSpotRegistrationEnabled: e.target.checked })}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#C62828' },
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C62828' }
                                            }}
                                        />
                                    </Paper>
                                </Grid>

                                {/* ────── TEAM ASSIGNMENT ────── */}
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>TEAM COLLABORATION</Typography></Divider>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', mb: 1, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                                        Assign Teams to This Event
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'block', mb: 1.5 }}>
                                        Team members will receive notifications and gain event-level permissions based on their team role.
                                    </Typography>
                                    <Autocomplete
                                        multiple
                                        options={teams}
                                        getOptionLabel={(option) => option.name || ''}
                                        value={selectedTeamObjects}
                                        onChange={(e, newValue) => {
                                            setForm({ ...form, assignedTeamIds: newValue.map(t => t.id) });
                                        }}
                                        loading={teamsLoading}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip
                                                    {...getTagProps({ index })}
                                                    key={option.id}
                                                    icon={<People sx={{ fontSize: 14 }} />}
                                                    label={option.name}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600, fontSize: '0.75rem',
                                                        bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828',
                                                        '& .MuiChip-deleteIcon': { color: '#C62828' }
                                                    }}
                                                />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                placeholder={selectedTeamObjects.length === 0 ? "Search and select teams..." : ""}
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <>
                                                            <InputAdornment position="start"><People color="action" /></InputAdornment>
                                                            {params.InputProps.startAdornment}
                                                        </>
                                                    ),
                                                }}
                                            />
                                        )}
                                        noOptionsText={teamsLoading ? "Loading teams..." : "No teams found. Create one from 'My Teams'."}
                                    />
                                </Grid>

                                {/* ────── SUBMIT ────── */}
                                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit" variant="contained" size="large" disabled={loading}
                                        sx={{ minWidth: 150, fontWeight: 600 }}
                                    >
                                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Event'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Paper>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 1 }} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </DashboardLayout >
    );
};

export default CreateEventPage;
