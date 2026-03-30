import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Grid, Card, CardContent, Avatar, Chip, Stack,
    CircularProgress, Divider, Button, Tooltip, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Snackbar, Alert
} from '@mui/material';
import {
    HourglassTop, Cancel, History, People, DeleteForever,
    Email, Badge, School, Phone, CalendarMonth, Event, CheckCircle, TrendingUp, Edit
} from '@mui/icons-material';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [roles, setRoles] = useState([]);
    const [myTeams, setMyTeams] = useState([]);
    const [deleteBiometricOpen, setDeleteBiometricOpen] = useState(false);
    const [deleteBiometricLoading, setDeleteBiometricLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        api.get('/api/auth/me').then(r => setProfile(r.data.data)).catch(() => { });
        api.get('/api/registrations/my').then(r => setRegistrations(r.data.data || [])).catch(() => { });
        api.get('/api/attendance/my').then(r => setAttendance(r.data.data || [])).catch(() => { });
        api.get('/api/roles/my-roles').then(r => setRoles(r.data.data || [])).catch(() => { });
        api.get('/api/teams/my-teams').then(r => setMyTeams(r.data.data || [])).catch(() => { });
    }, []);

    if (!profile) return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress sx={{ color: '#C62828' }} /></Box>
        </DashboardLayout>
    );

    const attendanceRate = registrations.length > 0 ? Math.round((attendance.length / registrations.length) * 100) : 0;
    const roleLabels = { ADMIN: 'Administrator', ORGANIZER: 'Organizer', STUDENT: 'Student' };

    const infoItems = [
        { icon: <Email sx={{ fontSize: 20 }} />, label: 'Email', value: profile.email },
        { icon: <Badge sx={{ fontSize: 20 }} />, label: 'Student ID', value: profile.studentId || '—' },
        { icon: <School sx={{ fontSize: 20 }} />, label: 'Department', value: profile.department || '—' },
        { icon: <Phone sx={{ fontSize: 20 }} />, label: 'Phone', value: profile.phone || '—' },
        { icon: <CalendarMonth sx={{ fontSize: 20 }} />, label: 'Member Since', value: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—' },
    ];

    const stats = [
        { label: 'Registered', value: registrations.length, icon: <Event sx={{ fontSize: 22 }} /> },
        { label: 'Attended', value: attendance.length, icon: <CheckCircle sx={{ fontSize: 22 }} /> },
        { label: 'Rate', value: `${attendanceRate}%`, icon: <TrendingUp sx={{ fontSize: 22 }} /> },
    ];

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/api/auth/me/picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(res.data.data);
            updateUser(res.data.data);
        } catch (err) {
            console.error("Failed to upload profile picture", err);
        }
    };

    const handleAcceptRole = async (id) => {
        try {
            await api.post(`/api/roles/invitations/${id}/accept`);
            api.get('/api/roles/my-roles').then(r => setRoles(r.data.data || []));
        } catch (err) {
            console.error("Failed to accept role", err);
        }
    };

    const handleRejectRole = async (id) => {
        try {
            await api.post(`/api/roles/invitations/${id}/reject`);
            api.get('/api/roles/my-roles').then(r => setRoles(r.data.data || []));
        } catch (err) {
            console.error("Failed to decline role", err);
        }
    };

    const handleDeleteBiometricData = async () => {
        setDeleteBiometricLoading(true);
        try {
            await api.delete('/api/face/my-data');
            setSnackbar({ open: true, message: 'Your biometric data has been permanently deleted.', severity: 'success' });
            // Update profile to mark as unenrolled visually if needed later
        } catch (err) {
            console.error('Failed to delete biometric data', err);
            setSnackbar({ open: true, message: 'Failed to delete biometric data. Please try again.', severity: 'error' });
        } finally {
            setDeleteBiometricLoading(false);
            setDeleteBiometricOpen(false);
        }
    };

    const getCountdown = (validUntil) => {
        if (!validUntil) return null;
        const diff = new Date(validUntil) - new Date();
        if (diff <= 0) return 'Expired';
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        if (days > 0) return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`;
    };

    const pendingRoles = roles.filter(r => r.status === 'PENDING');
    const activeRoles = roles.filter(r => r.status === 'ACTIVE');
    const pastRoles = roles.filter(r => r.status === 'EXPIRED' || r.status === 'REJECTED');

    const statusConfig = {
        PENDING: { label: 'Invitation Pending', color: '#f59e0b', bg: '#f59e0b12', icon: <HourglassTop sx={{ fontSize: 16 }} /> },
        ACTIVE: { label: 'Active Member', color: '#10B981', bg: '#10B98112', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
        EXPIRED: { label: 'Membership Ended', color: '#9e9e9e', bg: '#9e9e9e12', icon: <History sx={{ fontSize: 16 }} /> },
        REJECTED: { label: 'Declined', color: '#D32F2F', bg: '#D32F2F12', icon: <Cancel sx={{ fontSize: 16 }} /> },
    };

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up">
                {/* Profile Header */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: { xs: 'center', md: 'flex-start' }, gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={profile.profilePicture ? `/${profile.profilePicture}` : undefined}
                                    sx={{
                                        width: 80, height: 80, bgcolor: '#C62828',
                                        fontSize: '2rem', fontWeight: 700, color: '#FFFFFF',
                                        cursor: 'pointer', border: '2px solid white', boxShadow: 2
                                    }} onClick={() => document.getElementById('profile-upload').click()}>
                                    {profile.fullName?.charAt(0)}
                                </Avatar>
                                <input
                                    type="file"
                                    id="profile-upload"
                                    hidden
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Box sx={{
                                    position: 'absolute', bottom: 0, right: 0,
                                    bgcolor: 'white', borderRadius: '50%', p: 0.5,
                                    boxShadow: 1, cursor: 'pointer', display: 'flex'
                                }} onClick={() => document.getElementById('profile-upload').click()}>
                                    <Edit sx={{ fontSize: 16, color: '#C62828' }} />
                                </Box>
                            </Box>
                            <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121' }}>{profile.fullName}</Typography>
                                <Chip label={roleLabels[profile.role] || profile.role} size="small" sx={{
                                    mt: 1, bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828', fontWeight: 600,
                                }} />
                            </Box>
                        </Box>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* Activity Stats */}
                    <Grid item xs={12} md={4} className="animate-fade-in-up stagger-1">
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 3,
                                }}>Activity</Typography>
                                <Stack spacing={2.5}>
                                    {stats.map((s, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box sx={{
                                                width: 40, height: 40, borderRadius: '10px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                bgcolor: 'rgba(198,40,40,0.06)', color: '#C62828',
                                            }}>{s.icon}</Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1 }}>{s.value}</Typography>
                                                <Typography variant="caption" sx={{ color: '#757575' }}>{s.label}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>

                                {/* Attendance Progress */}
                                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E0E0E0', textAlign: 'center' }}>
                                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                        <CircularProgress variant="determinate" value={100} size={90} thickness={5}
                                            sx={{ color: '#E0E0E0' }} />
                                        <CircularProgress variant="determinate" value={attendanceRate} size={90}
                                            thickness={5} sx={{ color: '#C62828', position: 'absolute', left: 0, '& circle': { strokeLinecap: 'round' } }} />
                                        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>{attendanceRate}%</Typography>
                                        </Box>
                                    </Box>
                                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#757575' }}>
                                        Attendance Rate
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Personal Info */}
                    <Grid item xs={12} md={8} className="animate-fade-in-up stagger-2">
                        <Card sx={{ height: '100%' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle2" sx={{
                                    color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 3,
                                }}>Personal Information</Typography>
                                <Stack spacing={0}>
                                    {infoItems.map((item, i) => (
                                        <Box key={i}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2 }}>
                                                <Box sx={{
                                                    width: 36, height: 36, borderRadius: '8px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    bgcolor: '#FAFAFA', color: '#757575',
                                                }}>{item.icon}</Box>
                                                <Box>
                                                    <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: '0.7rem' }}>{item.label}</Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#212121' }}>{item.value}</Typography>
                                                </Box>
                                            </Box>
                                            {i < infoItems.length - 1 && <Divider sx={{ borderColor: '#E0E0E0' }} />}
                                        </Box>
                                    ))}
                                </Stack>

                                <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #E0E0E0' }}>
                                    <Typography variant="subtitle2" sx={{ color: '#D32F2F', fontWeight: 600, mb: 1 }}>Privacy Settings</Typography>
                                    <Typography variant="body2" sx={{ color: '#757575', mb: 2 }}>Manage your biometric data and privacy preferences.</Typography>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        startIcon={<DeleteForever />}
                                        onClick={() => setDeleteBiometricOpen(true)}
                                        sx={{ borderRadius: 1.5, fontWeight: 600, textTransform: 'none' }}
                                    >
                                        Delete My Biometric Data
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Memberships & Responsibilities */}
                {roles.length > 0 && (
                    <Box sx={{ mt: 3 }} className="animate-fade-in-up stagger-3">
                        <Typography variant="subtitle2" sx={{
                            color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 2,
                        }}>Memberships & Responsibilities</Typography>

                        {/* Pending Invitations */}
                        {pendingRoles.length > 0 && (
                            <Stack spacing={2} sx={{ mb: 2 }}>
                                {pendingRoles.map(role => (
                                    <Card key={role.id} sx={{ borderLeft: '4px solid #f59e0b', borderRadius: 1.5 }}>
                                        <CardContent sx={{ p: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#212121', mb: 0.5 }}>
                                                        You've been invited to join {role.clubName || role.departmentName || 'the organization'} as {role.roleName}
                                                    </Typography>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Chip
                                                            icon={statusConfig.PENDING.icon}
                                                            label={statusConfig.PENDING.label}
                                                            size="small"
                                                            sx={{ bgcolor: statusConfig.PENDING.bg, color: statusConfig.PENDING.color, fontWeight: 600 }}
                                                        />
                                                        {role.validUntil && (
                                                            <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                                                                {getCountdown(role.validUntil)}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>
                                                <Stack direction="row" spacing={1}>
                                                    <Button variant="contained" size="small" onClick={() => handleAcceptRole(role.id)}
                                                        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Accept
                                                    </Button>
                                                    <Button variant="outlined" size="small" onClick={() => handleRejectRole(role.id)}
                                                        sx={{ borderColor: '#e0e0e0', color: '#757575', fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Decline
                                                    </Button>
                                                </Stack>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}

                        {/* Active Roles */}
                        {activeRoles.length > 0 && (
                            <Stack spacing={1.5} sx={{ mb: 2 }}>
                                {activeRoles.map(role => (
                                    <Card key={role.id} sx={{ borderLeft: '4px solid #10B981', borderRadius: 1.5 }}>
                                        <CardContent sx={{ py: 2, px: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121' }}>
                                                        {role.roleName} — {role.clubName || role.departmentName || 'Global'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#757575' }}>
                                                        {role.validUntil ? `Active until ${new Date(role.validUntil).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'Active membership'}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    icon={statusConfig.ACTIVE.icon}
                                                    label={statusConfig.ACTIVE.label}
                                                    size="small"
                                                    sx={{ bgcolor: statusConfig.ACTIVE.bg, color: statusConfig.ACTIVE.color, fontWeight: 600 }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}

                        {/* Past Roles */}
                        {pastRoles.length > 0 && (
                            <Stack spacing={1} sx={{ opacity: 0.7 }}>
                                {pastRoles.map(role => (
                                    <Card key={role.id} sx={{ borderLeft: `4px solid ${statusConfig[role.status]?.color || '#9e9e9e'}`, borderRadius: 1.5 }}>
                                        <CardContent sx={{ py: 1.5, px: 2.5 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="body2" sx={{ color: '#757575', fontWeight: 600 }}>
                                                    {role.status === 'REJECTED'
                                                        ? `You declined the invitation for ${role.roleName}`
                                                        : `${role.roleName} — ${role.clubName || role.departmentName || 'Global'} (Ended)`
                                                    }
                                                </Typography>
                                                <Chip
                                                    label={statusConfig[role.status]?.label || role.status}
                                                    size="small"
                                                    sx={{ bgcolor: statusConfig[role.status]?.bg, color: statusConfig[role.status]?.color, fontWeight: 600, fontSize: '0.65rem' }}
                                                />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                ))}
                            </Stack>
                        )}
                    </Box>
                )}

                {/* Dynamic Team Memberships */}
                {myTeams.length > 0 && (
                    <Box sx={{ mt: 3 }} className="animate-fade-in-up stagger-4">
                        <Typography variant="subtitle2" sx={{
                            color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', fontWeight: 600, mb: 2,
                        }}>My Teams</Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {myTeams.map(team => (
                                <Chip
                                    key={team.id}
                                    icon={<People sx={{ fontSize: 16 }} />}
                                    label={team.name}
                                    sx={{
                                        fontWeight: 600, fontSize: '0.8rem', py: 2.5, px: 0.5,
                                        bgcolor: 'rgba(198,40,40,0.06)', color: '#C62828',
                                        border: '1px solid rgba(198,40,40,0.15)',
                                        '& .MuiChip-icon': { color: '#C62828' },
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}
            </Box>

            <Dialog
                open={deleteBiometricOpen}
                onClose={() => !deleteBiometricLoading && setDeleteBiometricOpen(false)}
                PaperProps={{ sx: { borderRadius: 2, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: '#C62828', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DeleteForever /> Delete Biometric Data
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: '#424242', fontWeight: 500 }}>
                        Are you sure you want to permanently delete your facial scan data?
                    </DialogContentText>
                    <DialogContentText sx={{ color: '#757575', mt: 1, fontSize: '0.85rem' }}>
                        This action cannot be undone. You will need to re-enroll your face to use the fast check-in feature at future events.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, pt: 0 }}>
                    <Button
                        onClick={() => setDeleteBiometricOpen(false)}
                        disabled={deleteBiometricLoading}
                        sx={{ color: '#757575', fontWeight: 600 }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteBiometricData}
                        color="error"
                        variant="contained"
                        disabled={deleteBiometricLoading}
                        sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    >
                        {deleteBiometricLoading ? <CircularProgress size={24} color="inherit" /> : 'Yes, Delete Data'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%', borderRadius: 1.5, fontWeight: 600 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
};


export default ProfilePage;
