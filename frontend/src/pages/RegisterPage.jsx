import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Box, Typography, TextField, Button, Paper, Alert, CircularProgress,
    InputAdornment, IconButton, Grid, Divider, FormControlLabel, Checkbox
} from '@mui/material';
import { Person, Email, Lock, Badge, School, Phone, Visibility, VisibilityOff } from '@mui/icons-material';
import FaceScanner from '../components/FaceScanner';

const RegisterPage = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: Face Scan
    const [form, setForm] = useState({
        fullName: '', email: '', password: '',
        studentId: '', department: '', phone: '',
        role: 'STUDENT',
        faceEmbedding: null
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);

    const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const getRoleLabel = () => {
        switch (form.role) {
            case 'ORGANIZER': return 'Organizer ID / Staff Number';
            case 'ADMIN': return 'Administrator ID';
            default: return 'Student ID / Roll Number';
        }
    };

    const handleNext = (e) => {
        e.preventDefault();
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (!consentGiven) {
            setError('You must consent to biometric data processing to register.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleFaceComplete = async (embedding) => {
        setLoading(true);
        setError('');
        try {
            const registrationData = { ...form, faceEmbedding: embedding, consentGiven };
            await register(registrationData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'We could not create your account at this time. Please try again.');
            setStep(1);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 4,
            bgcolor: '#FAFAFA',
        }}>
            <Paper className="animate-fade-in-up" sx={{ maxWidth: 500, width: '100%', p: { xs: 3, sm: 4 }, border: '1px solid #E0E0E0', position: 'relative' }}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#212121', mb: 0.5 }}>
                        UniEvents
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575', mt: 1 }}>
                        {step === 1 ? 'Create your account' : 'Verify your identity'}
                    </Typography>

                    {/* Progress Bar */}
                    <Box sx={{ width: '100%', maxWidth: 180, mx: 'auto', mt: 3, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', justifyContent: 'space-between' }}>
                            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 8, bgcolor: '#E0E0E0', transform: 'translateY(-50%)', zIndex: 0, borderRadius: 4 }} />
                            <Box sx={{
                                position: 'absolute', top: '50%', left: 0,
                                width: step === 1 ? '50%' : '100%',
                                height: 8, bgcolor: '#C62828', transform: 'translateY(-50%)', zIndex: 1, borderRadius: 4,
                                transition: 'width 0.5s ease'
                            }} />

                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#C62828', zIndex: 2, boxShadow: '0 0 0 4px #fff' }} />
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: step === 2 ? '#C62828' : '#E0E0E0', zIndex: 2, boxShadow: '0 0 0 4px #fff', transition: 'background-color 0.5s' }} />
                        </Box>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {step === 1 ? (
                    <form onSubmit={handleNext}>
                        <Typography variant="caption" sx={{ color: '#C62828', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                            Personal Info
                        </Typography>
                        <TextField fullWidth label="Full Name" required value={form.fullName} onChange={update('fullName')} sx={{ mb: 2 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment> }} />
                        <TextField fullWidth label="Email" type="email" required value={form.email} onChange={update('email')} sx={{ mb: 2 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment> }} />

                        <TextField
                            select
                            fullWidth
                            label="Registration Type"
                            required
                            value={form.role}
                            onChange={update('role')}
                            sx={{ mb: 2 }}
                            SelectProps={{ native: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: '#9E9E9E', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            <option value="STUDENT">Student</option>
                            <option value="ORGANIZER">Organizer</option>
                            <option value="ADMIN">Administrator</option>
                        </TextField>

                        <Divider sx={{ my: 2.5, borderColor: '#E0E0E0' }} />

                        <Typography variant="caption" sx={{ color: '#C62828', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                            Academic Info
                        </Typography>
                        <TextField fullWidth label={getRoleLabel()} required value={form.studentId} onChange={update('studentId')} sx={{ mb: 2 }}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Badge sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment> }} />
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Department" value={form.department} onChange={update('department')}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><School sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Phone" value={form.phone} onChange={update('phone')}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment> }} />
                            </Grid>
                        </Grid>

                        <Divider sx={{ my: 2.5, borderColor: '#E0E0E0' }} />

                        <Typography variant="caption" sx={{ color: '#C62828', textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 600, mb: 1.5, display: 'block' }}>
                            Security
                        </Typography>
                        <TextField fullWidth label="Password" type={showPw ? 'text' : 'password'} required value={form.password}
                            onChange={update('password')} sx={{ mb: 3 }} helperText="Minimum 6 characters"
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#9E9E9E', fontSize: 20 }} /></InputAdornment>,
                                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>
                            }} />

                        <Box sx={{ p: 2, mb: 3, bgcolor: '#FFF3E0', borderRadius: 1.5, border: '1px solid #FFCC80' }}>
                            <FormControlLabel
                                control={<Checkbox checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} color="warning" />}
                                label={
                                    <Typography variant="body2" sx={{ color: '#E65100', fontWeight: 600 }}>
                                        I consent to the collection and processing of my biometric data (facial scans) for the purpose of event attendance verification.
                                    </Typography>
                                }
                            />
                        </Box>

                        <Button type="submit" fullWidth variant="contained" size="large"
                            disabled={!consentGiven}
                            sx={{ mb: 2.5, py: 1.4, fontWeight: 700, bgcolor: '#C62828', color: '#FFFFFF', '&:hover': { bgcolor: '#B71C1C' }, '&.Mui-disabled': { bgcolor: '#E57373', color: '#FFEBEE' } }}>
                            Continue to Face Scan
                        </Button>
                    </form>
                ) : (
                    <Box sx={{ position: 'relative' }}>
                        {loading && (
                            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.8)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 2 }}>
                                <CircularProgress sx={{ color: '#C62828', mb: 2 }} />
                                <Typography sx={{ fontWeight: 700 }}>Finalizing Registration...</Typography>
                            </Box>
                        )}
                        <FaceScanner
                            onComplete={handleFaceComplete}
                            onReset={() => { setError(''); setStep(1); }}
                        />
                    </Box>
                )}

                <Typography variant="body2" textAlign="center" sx={{ color: '#757575', mt: step === 2 ? 3 : 0 }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#C62828', fontWeight: 600 }}>Sign in</Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default RegisterPage;
