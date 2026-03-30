import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, TextField, Button, Paper, Alert, CircularProgress,
    InputAdornment, IconButton
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(form.email.trim(), form.password.trim());
            navigate(data.role === 'ADMIN' ? '/admin' : data.role === 'ORGANIZER' ? '/organizer' : '/student');
        } catch (err) {
            setError(err.response?.data?.message || 'We could not sign you in. Please check your details.');
        } finally { setLoading(false); }
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2,
            bgcolor: '#FAFAFA',
        }}>
            <Paper className="animate-fade-in-up" sx={{ maxWidth: 420, width: '100%', p: { xs: 3, sm: 4 }, border: '1px solid #E0E0E0' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#212121', mb: 0.5 }}>
                        UniEvents
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575', mt: 1 }}>Welcome back! Sign in to your account</Typography>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField fullWidth label="Email" type="email" required value={form.email}
                        onChange={update('email')} sx={{ mb: 2.5 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Email sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment>
                        }} />
                    <TextField fullWidth label="Password" type={showPw ? 'text' : 'password'} required
                        value={form.password} onChange={update('password')} sx={{ mb: 3 }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment>,
                            endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                        }} />
                    <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}
                        sx={{ mb: 2.5, py: 1.4, fontWeight: 700, bgcolor: '#C62828', color: '#FFFFFF', '&:hover': { bgcolor: '#B71C1C' } }}>
                        {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
                    </Button>
                </form>
                <Typography variant="body2" textAlign="center" sx={{ color: '#757575' }}>
                    Don't have an account?{' '}
                    <Link to="/register" style={{ color: '#C62828', fontWeight: 600 }}>Create one</Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default LoginPage;
