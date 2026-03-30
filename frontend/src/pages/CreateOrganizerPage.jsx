import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, TextField, Button, Card, CardContent, Alert, Snackbar,
    CircularProgress, InputAdornment, Grid, Avatar
} from '@mui/material';
import { Person, Email, Lock, School, Phone } from '@mui/icons-material';

const CreateOrganizerPage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: '', email: '', password: '', department: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const update = (f) => (e) => setForm({ ...form, [f]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(form)], { type: 'application/json' }));
        if (profilePicture) {
            formData.append('file', profilePicture);
        }

        try {
            await api.post('/api/admin/organizers', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSnackbar({ open: true, message: 'Organizer created successfully!', severity: 'success' });
            setTimeout(() => navigate('/admin'), 1500);
        } catch (err) {
            setSnackbar({ open: true, message: err.response?.data?.message || 'We could not create the account. Please try again.', severity: 'error' });
        } finally { setLoading(false); }
    };

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up">
                {/* Premium Header */}
                <Box sx={{
                    mb: 5, p: 4, borderRadius: 2,
                    bgcolor: '#212121',
                    color: '#FFF', position: 'relative', overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                    <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Avatar
                            sx={{
                                width: 80, height: 80, bgcolor: '#D32F2F'
                            }}
                        >
                            <Person sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.5px', color: '#FFF' }}>
                                Create Organizer
                            </Typography>
                            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                Set up a new account for event management.
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Form Card */}
                <Card sx={{
                    maxWidth: 700, mx: 'auto', borderRadius: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    border: '1px solid #E0E0E0',
                    overflow: 'visible'
                }}>
                    <CardContent sx={{ p: '40px !important' }}>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Full Name"
                                        required
                                        value={form.fullName}
                                        onChange={update('fullName')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 2 }
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Email Address"
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={update('email')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Email sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 2 }
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Password"
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={update('password')}
                                        helperText="Must be at least 6 characters"
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 2 }
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Department"
                                        value={form.department}
                                        onChange={update('department')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><School sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 2 }
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Phone Number"
                                        value={form.phone}
                                        onChange={update('phone')}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Phone sx={{ color: 'text.secondary' }} /></InputAdornment>,
                                            sx: { borderRadius: 2 }
                                        }}
                                        sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f8f9fa' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} sx={{ mt: 2 }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        fullWidth
                                        size="large"
                                        disabled={loading}
                                        sx={{
                                            py: 1.8,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            borderRadius: 2,
                                            bgcolor: '#D32F2F',
                                            transition: 'background-color 0.2s ease',
                                            '&:hover': {
                                                bgcolor: '#B71C1C'
                                            }
                                        }}
                                    >
                                        {loading ? <CircularProgress size={26} color="inherit" /> : 'Create Account'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </form>
                    </CardContent>
                </Card>
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2, fontWeight: 600 }}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default CreateOrganizerPage;
