import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Chip, Stack, TextField,
    CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
    InputAdornment, Alert
} from '@mui/material';
import {
    People, Search, PersonAdd, Shield, Lock
} from '@mui/icons-material';

const TeamManagement = () => {
    const { user } = useAuth();
    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [assignOpen, setAssignOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [assignForm, setAssignForm] = useState({
        roleName: '', requiresAcceptance: true, validFrom: '', validUntil: ''
    });
    const [assigning, setAssigning] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter !== 'all') params.filter = filter;
            if (search.trim()) params.search = search.trim();
            const res = await api.get('/api/team/members', { params });
            setMembers(res.data.data || []);
        } catch (err) {
            console.error('Failed to load team members', err);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    const fetchAssignableRoles = useCallback(async () => {
        try {
            const res = await api.get('/api/team/assignable-roles');
            setRoles(res.data.data || []);
        } catch (err) {
            console.error('Failed to load assignable roles', err);
        }
    }, []);

    useEffect(() => { fetchMembers(); }, [fetchMembers]);
    useEffect(() => { fetchAssignableRoles(); }, [fetchAssignableRoles]);

    const openAssignModal = (member) => {
        setSelectedMember(member);
        setAssignForm({ roleName: '', requiresAcceptance: true, validFrom: '', validUntil: '' });
        setFeedback(null);
        setAssignOpen(true);
    };

    const handleAssign = async () => {
        if (!assignForm.roleName) return;
        setAssigning(true);
        setFeedback(null);
        try {
            const body = {
                roleName: assignForm.roleName,
                requiresAcceptance: assignForm.requiresAcceptance,
            };
            if (assignForm.validFrom) body.validFrom = assignForm.validFrom + ':00';
            if (assignForm.validUntil) body.validUntil = assignForm.validUntil + ':00';
            await api.post(`/api/team/members/${selectedMember.id}/assign-role`, body);
            setFeedback({ type: 'success', msg: `Role assigned to ${selectedMember.fullName}.` });
            setAssignOpen(false);
            fetchMembers();
        } catch (err) {
            setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to assign role.' });
        } finally {
            setAssigning(false);
        }
    };

    const filters = [
        { value: 'all', label: 'All Members' },
        { value: 'STUDENT', label: 'Students' },
        { value: 'ORGANIZER', label: 'Organizers' },
        { value: 'VOLUNTEER', label: 'Volunteers' },
    ];

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            width: 40, height: 40, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828'
                        }}>
                            <People />
                        </Box>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, color: '#212121', lineHeight: 1.2 }}>
                                Team Management
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#757575' }}>
                                Manage members within your department
                            </Typography>
                        </Box>
                    </Box>
                    <Chip icon={<Shield sx={{ fontSize: 14 }} />} label="Scoped Access" size="small"
                        sx={{ bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981', fontWeight: 700, fontSize: '0.7rem' }} />
                </Box>

                {/* Feedback */}
                {feedback && (
                    <Alert severity={feedback.type} sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setFeedback(null)}>
                        {feedback.msg}
                    </Alert>
                )}

                {/* Filters + Search */}
                <Card sx={{ mb: 3 }}>
                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                            <Stack direction="row" spacing={1}>
                                {filters.map(f => (
                                    <Chip key={f.value} label={f.label} size="small"
                                        variant={filter === f.value ? 'filled' : 'outlined'}
                                        onClick={() => setFilter(f.value)}
                                        sx={{
                                            fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                                            ...(filter === f.value
                                                ? { bgcolor: '#C62828', color: '#fff', '&:hover': { bgcolor: '#B71C1C' } }
                                                : { borderColor: '#E0E0E0', color: '#757575', '&:hover': { borderColor: '#C62828', color: '#C62828' } })
                                        }} />
                                ))}
                            </Stack>
                            <TextField
                                size="small" placeholder="Search by name or student ID..."
                                value={search} onChange={e => setSearch(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9E9E9E' }} /></InputAdornment>
                                }}
                                sx={{ flex: 1, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                        </Box>
                    </CardContent>
                </Card>

                {/* Members Table */}
                <Card>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                    <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Student ID</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>Roles</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }} align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <CircularProgress size={28} sx={{ color: '#C62828' }} />
                                        </TableCell>
                                    </TableRow>
                                ) : members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6, color: '#9E9E9E' }}>
                                            <Typography variant="body2">No members found in your scope.</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : members.map(m => (
                                    <TableRow key={m.id} sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}>
                                        <TableCell>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121' }}>{m.fullName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#9E9E9E' }}>{m.email}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#424242', fontWeight: 500 }}>{m.studentId || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ color: '#424242' }}>{m.department || '—'}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                                {(m.roles || []).map(r => (
                                                    <Chip key={r} label={r} size="small" sx={{
                                                        fontWeight: 600, fontSize: '0.65rem', height: 22,
                                                        bgcolor: r === 'ORGANIZER' ? 'rgba(198,40,40,0.08)' : r === 'VOLUNTEER' ? 'rgba(16,185,129,0.08)' : '#F5F5F5',
                                                        color: r === 'ORGANIZER' ? '#C62828' : r === 'VOLUNTEER' ? '#10B981' : '#757575',
                                                    }} />
                                                ))}
                                            </Stack>
                                        </TableCell>
                                        <TableCell align="right">
                                            {m.readOnly ? (
                                                <Chip icon={<Lock sx={{ fontSize: 12 }} />} label="Read Only" size="small"
                                                    sx={{ fontWeight: 600, fontSize: '0.65rem', bgcolor: '#F5F5F5', color: '#9E9E9E' }} />
                                            ) : (
                                                <Button size="small" startIcon={<PersonAdd sx={{ fontSize: 16 }} />}
                                                    onClick={() => openAssignModal(m)}
                                                    sx={{
                                                        textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
                                                        color: '#C62828', borderColor: '#E0E0E0', borderRadius: 1.5,
                                                        '&:hover': { borderColor: '#C62828', bgcolor: 'rgba(198,40,40,0.04)' }
                                                    }} variant="outlined">
                                                    Assign Role
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>

                {/* Assign Role Dialog */}
                <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 2 } }}>
                    <DialogTitle sx={{ fontWeight: 800, color: '#212121', pb: 0 }}>
                        Assign Role
                    </DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        {selectedMember && (
                            <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
                                Assigning role to <strong>{selectedMember.fullName}</strong> ({selectedMember.email})
                            </Typography>
                        )}

                        <Stack spacing={2.5}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Role</InputLabel>
                                <Select value={assignForm.roleName}
                                    onChange={e => setAssignForm(p => ({ ...p, roleName: e.target.value }))}
                                    label="Role">
                                    {roles.map(r => (
                                        <MenuItem key={r.id} value={r.name}>
                                            {r.name} <Typography component="span" sx={{ ml: 1, color: '#9E9E9E', fontSize: '0.75rem' }}>({r.scope})</Typography>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField label="Valid From" type="datetime-local" size="small" fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={assignForm.validFrom}
                                onChange={e => setAssignForm(p => ({ ...p, validFrom: e.target.value }))} />

                            <TextField label="Valid Until" type="datetime-local" size="small" fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={assignForm.validUntil}
                                onChange={e => setAssignForm(p => ({ ...p, validUntil: e.target.value }))} />

                            <FormControlLabel
                                control={<Switch checked={assignForm.requiresAcceptance}
                                    onChange={e => setAssignForm(p => ({ ...p, requiresAcceptance: e.target.checked }))}
                                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#C62828' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#C62828' } }} />}
                                label={<Typography variant="body2" sx={{ fontWeight: 600, color: '#424242' }}>Require Acceptance</Typography>} />

                            {feedback && feedback.type === 'error' && (
                                <Alert severity="error" sx={{ borderRadius: 1 }}>{feedback.msg}</Alert>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => setAssignOpen(false)} sx={{ color: '#757575', fontWeight: 700, textTransform: 'none' }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleAssign} disabled={!assignForm.roleName || assigning}
                            sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}>
                            {assigning ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Confirm Assignment'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
};

export default TeamManagement;
