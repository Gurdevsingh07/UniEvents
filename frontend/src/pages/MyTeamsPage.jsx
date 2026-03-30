import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Chip, Stack, TextField, Grid,
    CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControlLabel, Checkbox, Alert, IconButton, Divider, Paper,
    InputAdornment, Collapse, Avatar
} from '@mui/material';
import {
    People, Add, ExpandMore, ExpandLess, PersonAdd, Delete, Edit, Search,
    Shield, Security, Visibility, TouchApp, Settings, Event as EventIcon
} from '@mui/icons-material';
import MemberPermissionDialog from '../components/MemberPermissionDialog';

// POSITION_OPTIONS removed as they are now in MemberPermissionDialog

const MyTeamsPage = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState({});
    const [membersLoading, setMembersLoading] = useState({});

    // Create Team Dialog
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '', purpose: '' });
    const [creating, setCreating] = useState(false);

    // Add Member Dialog
    const [addMemberOpen, setAddMemberOpen] = useState(false);
    const [addMemberTeamId, setAddMemberTeamId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [memberForm, setMemberForm] = useState({
        userId: '', position: 'Volunteer',
        canScanAttendance: true, canViewAttendanceSheet: false, canManualOverride: false,
        canViewLiveStats: true, canManageTeam: false, canManageEvent: false,
    });
    const [addingMember, setAddingMember] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const [feedback, setFeedback] = useState(null);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/teams/my-teams');
            setTeams(res.data.data || []);
        } catch (err) {
            console.error('Failed to load teams', err);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    const fetchMembers = async (teamId) => {
        setMembersLoading(prev => ({ ...prev, [teamId]: true }));
        try {
            const res = await api.get(`/api/teams/${teamId}/members`);
            setTeamMembers(prev => ({ ...prev, [teamId]: res.data.data || [] }));
        } catch (err) {
            console.error('Failed to load team members', err);
        } finally { setMembersLoading(prev => ({ ...prev, [teamId]: false })); }
    };

    const toggleExpand = (teamId) => {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(teamId);
            if (!teamMembers[teamId]) fetchMembers(teamId);
        }
    };

    // ── Create Team ──
    const handleCreateTeam = async () => {
        if (!createForm.name.trim()) return;
        setCreating(true);
        try {
            await api.post('/api/teams', createForm);
            setFeedback({ type: 'success', msg: `Team "${createForm.name}" created successfully!` });
            setCreateOpen(false);
            setCreateForm({ name: '', description: '', purpose: '' });
            fetchTeams();
        } catch (err) {
            setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to create team.' });
        } finally { setCreating(false); }
    };

    // ── Delete Team ──
    const handleDeleteTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to delete this team?')) return;
        try {
            await api.delete(`/api/teams/${teamId}`);
            setFeedback({ type: 'success', msg: 'Team deleted.' });
            fetchTeams();
        } catch (err) {
            setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to delete team.' });
        }
    };

    // ── Search Students ──
    const searchStudents = async (q) => {
        setSearchQuery(q);
        if (q.trim().length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await api.get('/api/team/members', { params: { search: q.trim(), filter: 'STUDENT' } });
            setSearchResults(res.data.data || []);
        } catch (err) { console.error(err); } finally { setSearching(false); }
    };

    // ── Add/Update Member ──
    const handleSaveMember = async () => {
        if (!memberForm.userId && !editMode) return;
        setAddingMember(true);
        try {
            if (editMode) {
                await api.put(`/api/teams/${addMemberTeamId}/members/${editingMemberId}`, memberForm);
                setFeedback({ type: 'success', msg: 'Member permissions updated!' });
            } else {
                await api.post(`/api/teams/${addMemberTeamId}/members`, memberForm);
                setFeedback({ type: 'success', msg: 'Member added to team!' });
            }
            setAddMemberOpen(false);
            fetchMembers(addMemberTeamId);
            setMemberForm({
                userId: '', position: 'Volunteer',
                canScanAttendance: true, canViewAttendanceSheet: false, canManualOverride: false,
                canViewLiveStats: true, canManageTeam: false, canManageEvent: false,
            });
            setSearchQuery('');
            setSearchResults([]);
            setEditMode(false);
            setEditingMemberId(null);
        } catch (err) {
            setFeedback({ type: 'error', msg: err.response?.data?.message || 'Operation failed.' });
        } finally { setAddingMember(false); }
    };

    // ── Remove Member ──
    const handleRemoveMember = async (teamId, memberId) => {
        if (!window.confirm('Remove this member from the team?')) return;
        try {
            await api.delete(`/api/teams/${teamId}/members/${memberId}`);
            setFeedback({ type: 'success', msg: 'Member removed.' });
            fetchMembers(teamId);
        } catch (err) {
            setFeedback({ type: 'error', msg: err.response?.data?.message || 'Failed to remove member.' });
        }
    };

    const openAddMember = (teamId) => {
        setAddMemberTeamId(teamId);
        setEditMode(false);
        setEditingMemberId(null);
        setMemberForm({
            userId: '', position: 'Volunteer',
            canScanAttendance: true, canViewAttendanceSheet: false, canManualOverride: false,
            canViewLiveStats: true, canManageTeam: false, canManageEvent: false,
        });
        setSearchQuery('');
        setSearchResults([]);
        setFeedback(null);
        setAddMemberOpen(true);
    };

    const openEditMember = (teamId, member) => {
        setAddMemberTeamId(teamId);
        setEditMode(true);
        setEditingMemberId(member.id);
        setMemberForm({
            userId: member.user?.id || '',
            position: member.position || 'Volunteer',
            canScanAttendance: member.canScanAttendance || false,
            canViewAttendanceSheet: member.canViewAttendanceSheet || false,
            canManualOverride: member.canManualOverride || false,
            canViewLiveStats: member.canViewLiveStats || false,
            canManageTeam: member.canManageTeam || false,
            canManageEvent: member.canManageEvent || false,
        });
        setSearchQuery(member.user?.fullName || '');
        setSearchResults([]);
        setFeedback(null);
        setAddMemberOpen(true);
    };

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
                                My Teams
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#757575' }}>
                                Create and manage your event collaboration teams
                            </Typography>
                        </Box>
                    </Box>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                        sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}>
                        Create Team
                    </Button>
                </Box>

                {/* Feedback */}
                {feedback && (
                    <Alert severity={feedback.type} sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setFeedback(null)}>
                        {feedback.msg}
                    </Alert>
                )}

                {/* Teams Grid */}
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#C62828' }} /></Box>
                ) : teams.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                        <People sx={{ fontSize: 48, color: '#E0E0E0', mb: 1 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#9E9E9E', mb: 0.5 }}>No Teams Yet</Typography>
                        <Typography variant="body2" sx={{ color: '#BDBDBD', mb: 2 }}>Create your first team to start collaborating on events.</Typography>
                        <Button variant="outlined" startIcon={<Add />} onClick={() => setCreateOpen(true)}
                            sx={{ color: '#C62828', borderColor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}>
                            Create Your First Team
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={2}>
                        {teams.map(team => (
                            <Grid item xs={12} key={team.id}>
                                <Card sx={{ borderRadius: 2, overflow: 'hidden', border: expandedTeam === team.id ? '1.5px solid #C62828' : '1px solid #E0E0E0', transition: 'border 0.2s' }}>
                                    {/* Team Header */}
                                    <Box sx={{
                                        p: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer',
                                        '&:hover': { bgcolor: '#FAFAFA' }
                                    }} onClick={() => toggleExpand(team.id)}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: '#C62828', width: 42, height: 42, fontWeight: 800, fontSize: '1rem' }}>
                                                {team.name?.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body1" sx={{ fontWeight: 700, color: '#212121' }}>{team.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#9E9E9E' }}>
                                                    {team.description || 'No description'} {team.purpose && `· ${team.purpose}`}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip label={teamMembers[team.id] ? `${teamMembers[team.id].length} members` : 'View members'}
                                                size="small" sx={{ fontWeight: 600, fontSize: '0.7rem', bgcolor: '#F5F5F5', color: '#757575' }} />
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }}
                                                sx={{ color: '#BDBDBD', '&:hover': { color: '#C62828' } }}>
                                                <Delete sx={{ fontSize: 18 }} />
                                            </IconButton>
                                            {expandedTeam === team.id ? <ExpandLess sx={{ color: '#757575' }} /> : <ExpandMore sx={{ color: '#757575' }} />}
                                        </Stack>
                                    </Box>

                                    {/* Expanded Members */}
                                    <Collapse in={expandedTeam === team.id}>
                                        <Divider />
                                        <Box sx={{ p: 2.5, bgcolor: '#FAFAFA' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                                                    Team Members
                                                </Typography>
                                                <Button size="small" startIcon={<PersonAdd sx={{ fontSize: 16 }} />} onClick={() => openAddMember(team.id)}
                                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', color: '#C62828', borderColor: '#E0E0E0', borderRadius: 1.5, '&:hover': { borderColor: '#C62828' } }}
                                                    variant="outlined">
                                                    Add Member
                                                </Button>
                                            </Box>

                                            {membersLoading[team.id] ? (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} sx={{ color: '#C62828' }} /></Box>
                                            ) : (!teamMembers[team.id] || teamMembers[team.id].length === 0) ? (
                                                <Typography variant="body2" sx={{ color: '#9E9E9E', textAlign: 'center', py: 3 }}>No members yet. Add students to your team.</Typography>
                                            ) : (
                                                <Stack spacing={1.5}>
                                                    {teamMembers[team.id].map(member => (
                                                        <Paper key={member.id} variant="outlined" sx={{ p: 2, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#212121', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                    {member.user?.fullName?.charAt(0) || '?'}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121' }}>{member.user?.fullName || 'Unknown'}</Typography>
                                                                    <Typography variant="caption" sx={{ color: '#9E9E9E' }}>{member.user?.email} · {member.position || 'Member'}</Typography>
                                                                </Box>
                                                            </Box>
                                                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" useFlexGap>
                                                                {member.canScanAttendance && <Chip label="Scan" size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 20, bgcolor: 'rgba(16,185,129,0.08)', color: '#10B981' }} />}
                                                                {member.canViewAttendanceSheet && <Chip label="Sheet" size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 20, bgcolor: 'rgba(59,130,246,0.08)', color: '#3B82F6' }} />}
                                                                {member.canManualOverride && <Chip label="Override" size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 20, bgcolor: 'rgba(245,158,11,0.08)', color: '#F59E0B' }} />}
                                                                {member.canViewLiveStats && <Chip label="Stats" size="small" sx={{ fontWeight: 600, fontSize: '0.6rem', height: 20, bgcolor: 'rgba(139,92,246,0.08)', color: '#8B5CF6' }} />}
                                                                <IconButton size="small" onClick={() => openEditMember(team.id, member)}
                                                                    sx={{ color: '#BDBDBD', '&:hover': { color: '#C62828' } }}>
                                                                    <Edit sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => handleRemoveMember(team.id, member.id)}
                                                                    sx={{ color: '#BDBDBD', '&:hover': { color: '#C62828' } }}>
                                                                    <Delete sx={{ fontSize: 16 }} />
                                                                </IconButton>
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Collapse>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}

                {/* ──── CREATE TEAM DIALOG ──── */}
                <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
                    <DialogTitle sx={{ fontWeight: 800, color: '#212121', pb: 0 }}>Create New Team</DialogTitle>
                    <DialogContent sx={{ pt: 2 }}>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <TextField label="Team Name" fullWidth size="small" required value={createForm.name}
                                onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="e.g., Tech Fest Core Team" />
                            <TextField label="Description" fullWidth size="small" multiline rows={2} value={createForm.description}
                                onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                                placeholder="What does this team do?" />
                            <TextField label="Purpose (optional)" fullWidth size="small" value={createForm.purpose}
                                onChange={e => setCreateForm(p => ({ ...p, purpose: e.target.value }))}
                                placeholder="e.g., Event operations, Media coverage" />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2.5 }}>
                        <Button onClick={() => setCreateOpen(false)} sx={{ color: '#757575', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
                        <Button variant="contained" onClick={handleCreateTeam} disabled={!createForm.name.trim() || creating}
                            sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}>
                            {creating ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Create Team'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ──── MEMBER PERMISSION DIALOG ──── */}
                <MemberPermissionDialog
                    open={addMemberOpen}
                    onClose={() => setAddMemberOpen(false)}
                    editMode={editMode}
                    memberForm={memberForm}
                    setMemberForm={setMemberForm}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    searching={searching}
                    searchResults={searchResults}
                    onSearch={searchStudents}
                    onSelectStudent={(s) => {
                        if (!s) {
                            setMemberForm(p => ({ ...p, userId: '' }));
                            setSearchQuery('');
                        } else {
                            setMemberForm(p => ({ ...p, userId: s.id }));
                            setSearchQuery(s.fullName);
                            setSearchResults([]);
                        }
                    }}
                    onSave={handleSaveMember}
                    loading={addingMember}
                    feedback={feedback}
                />
            </Box>
        </DashboardLayout>
    );
};

export default MyTeamsPage;
