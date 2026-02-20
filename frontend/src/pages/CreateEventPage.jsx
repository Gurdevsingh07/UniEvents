import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, TextField, Button, Card, CardContent, Grid, Alert, Snackbar, CircularProgress,
    InputAdornment, Paper, Divider, IconButton
} from '@mui/material';
import { Event, Description, CalendarToday, AccessTime, Place, Group, ArrowBack, Timer } from '@mui/icons-material';

const CreateEventPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ title: '', description: '', eventDate: '', startTime: '', endTime: '', venue: '', capacity: '', entryStartTime: '', entryEndTime: '' });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const update = (f) => (e) => {
        setForm({ ...form, [f]: e.target.value });
        // Clear error when user types
        if (errors[f]) setErrors({ ...errors, [f]: '' });
    };

    const validate = () => {
        const newErrors = {};
        if (!form.title.trim()) newErrors.title = 'Title is required';
        if (!form.eventDate) newErrors.eventDate = 'Date is required';
        if (!form.startTime) newErrors.startTime = 'Start time is required';
        if (!form.venue.trim()) newErrors.venue = 'Venue is required';
        if (!form.capacity || Number(form.capacity) <= 0) newErrors.capacity = 'Capacity must be a positive number';

        if (form.startTime && form.endTime) {
            if (form.endTime <= form.startTime) {
                newErrors.endTime = 'End time must be after start time';
            }
        }

        if (form.entryStartTime && form.entryEndTime) {
            if (form.entryEndTime <= form.entryStartTime) {
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
                ...form,
                capacity: parseInt(form.capacity),
                eventDate: form.eventDate || null,
                startTime: form.startTime || null,
                endTime: form.endTime || null,
                entryStartTime: form.entryStartTime || null,
                entryEndTime: form.entryEndTime || null,
            };
            await api.post('/api/events', payload);
            setSnackbar({ open: true, message: 'Event created successfully!', severity: 'success' });

            // Role-based redirect
            const redirectPath = user?.role === 'ADMIN' ? '/admin' : '/organizer';
            setTimeout(() => navigate(redirectPath), 1500);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to create event', severity: 'error' });
        } finally { setLoading(false); }
    };

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
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Event Title"
                                        value={form.title}
                                        onChange={update('title')}
                                        error={!!errors.title}
                                        helperText={errors.title}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Event color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="e.g., Annual Tech Symposium"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Description"
                                        multiline
                                        rows={4}
                                        value={form.description}
                                        onChange={update('description')}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                                    <Description color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="Describe the event details..."
                                    />
                                </Grid>

                                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Date"
                                        type="date"
                                        value={form.eventDate}
                                        onChange={update('eventDate')}
                                        error={!!errors.eventDate}
                                        helperText={errors.eventDate}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarToday color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Start Time"
                                        type="time"
                                        value={form.startTime}
                                        onChange={update('startTime')}
                                        error={!!errors.startTime}
                                        helperText={errors.startTime}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AccessTime color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="End Time"
                                        type="time"
                                        value={form.endTime}
                                        onChange={update('endTime')}
                                        error={!!errors.endTime}
                                        helperText={errors.endTime}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <AccessTime color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption" sx={{ color: 'text.secondary' }}>ENTRY CONTROL (OPTIONAL)</Typography></Divider></Grid>

                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Entry Start Time"
                                        type="time"
                                        value={form.entryStartTime}
                                        onChange={update('entryStartTime')}
                                        error={!!errors.entryStartTime}
                                        helperText={errors.entryStartTime || "When scanning begins"}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Timer color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Entry End Time"
                                        type="time"
                                        value={form.entryEndTime}
                                        onChange={update('entryEndTime')}
                                        error={!!errors.entryEndTime}
                                        helperText={errors.entryEndTime || "When scanning stops"}
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Timer color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

                                <Grid item xs={12} sm={8}>
                                    <TextField
                                        fullWidth
                                        label="Venue"
                                        value={form.venue}
                                        onChange={update('venue')}
                                        error={!!errors.venue}
                                        helperText={errors.venue}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Place color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        placeholder="e.g., Auditorium A"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Capacity"
                                        type="number"
                                        value={form.capacity}
                                        onChange={update('capacity')}
                                        error={!!errors.capacity}
                                        helperText={errors.capacity}
                                        inputProps={{ min: 1 }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Group color="action" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        size="large"
                                        disabled={loading}
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
