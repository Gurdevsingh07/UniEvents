import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import StatCard from '../components/StatCard';
import LiveStatusChip from '../components/LiveStatusChip';
import {
    Box, Typography, Grid, Card, CardContent, Button, Stack,
    Skeleton, Snackbar, Alert, Divider, IconButton, Avatar,
    Collapse, CircularProgress, Paper, Chip
} from '@mui/material';
import {
    Event, People, CheckCircle, Add, Assessment,
    Dashboard as DashboardIcon, FaceRetouchingNatural, Notifications,
    Delete, Edit, GroupAdd, ExpandMore, ExpandLess,
    TrendingUp, Visibility
} from '@mui/icons-material';
import NotificationBell from '../components/NotificationBell';
import MemberPermissionDialog from '../components/MemberPermissionDialog';

const OrganizerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Team Management State
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState({});
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [membersLoading, setMembersLoading] = useState({});

    // Permission Dialog State
    const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [memberForm, setMemberForm] = useState({
        userId: '', position: 'Volunteer',
        canScanAttendance: true, canViewAttendanceSheet: false, canManualOverride: false,
        canViewLiveStats: true, canManageTeam: false, canManageEvent: false,
    });
    const [savingMember, setSavingMember] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [dialogFeedback, setDialogFeedback] = useState(null);

    const isAdmin = user?.role === 'ADMIN';

    const loadData = async () => {
        try {
            const endpoint = isAdmin ? '/api/events' : '/api/events/my';
            const res = await api.get(endpoint);
            setEvents(res.data.data || []);
            loadTeams();
        } catch (err) {
            console.error('Dashboard load error:', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'We could not load your dashboard. Please try again.', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    const loadTeams = async () => {
        if (isAdmin) return; // Admins handle users differently
        setLoadingTeams(true);
        try {
            const res = await api.get('/api/teams/my-teams');
            setTeams(res.data.data || []);
        } catch (err) {
            console.error('Failed to load teams', err);
        } finally {
            setLoadingTeams(false);
        }
    };

    const fetchMembers = async (teamId) => {
        setMembersLoading(prev => ({ ...prev, [teamId]: true }));
        try {
            const res = await api.get(`/api/teams/${teamId}/members`);
            setTeamMembers(prev => ({ ...prev, [teamId]: res.data.data || [] }));
        } catch (err) {
            console.error('Failed to load members', err);
        } finally {
            setMembersLoading(prev => ({ ...prev, [teamId]: false }));
        }
    };

    const toggleTeam = (teamId) => {
        if (expandedTeamId === teamId) {
            setExpandedTeamId(null);
        } else {
            setExpandedTeamId(teamId);
            if (!teamMembers[teamId]) fetchMembers(teamId);
        }
    };

    const searchStudents = async (q) => {
        setSearchQuery(q);
        if (q.trim().length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await api.get('/api/team/members', { params: { search: q.trim(), filter: 'STUDENT' } });
            setSearchResults(res.data.data || []);
        } catch (err) { console.error(err); } finally { setSearching(false); }
    };

    const openEditMember = (teamId, member) => {
        setSelectedTeamId(teamId);
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
        setDialogFeedback(null);
        setPermissionDialogOpen(true);
    };

    const handleSaveMember = async () => {
        setSavingMember(true);
        try {
            if (editMode) {
                await api.put(`/api/teams/${selectedTeamId}/members/${editingMemberId}`, memberForm);
                setSnackbar({ open: true, message: 'Permissions updated!', severity: 'success' });
            }
            setPermissionDialogOpen(false);
            fetchMembers(selectedTeamId);
        } catch (err) {
            setDialogFeedback({ type: 'error', msg: err.response?.data?.message || 'Operation failed.' });
        } finally { setSavingMember(false); }
    };

    const handleRemoveMember = async (teamId, memberId) => {
        if (!window.confirm('Remove this member?')) return;
        try {
            await api.delete(`/api/teams/${teamId}/members/${memberId}`);
            setSnackbar({ open: true, message: 'Member removed.', severity: 'success' });
            fetchMembers(teamId);
        } catch (err) {
            setSnackbar({ open: true, message: 'Failed to remove member.', severity: 'error' });
        }
    };

    useEffect(() => { loadData(); }, [isAdmin]);
    // Auto-refresh for real-time feel
    useAutoRefresh(loadData, 10000); // Reduced frequency for dashboard teams

    const stats = useMemo(() => {
        const totalRegistered = events.reduce((s, e) => s + (e.registeredCount || 0), 0);
        const totalAttended = events.reduce((s, e) => s + (e.attendedCount || 0), 0);
        const rate = totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
        const activeStatusList = ['CREATED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ATTENDANCE_ACTIVE', 'ATTENDANCE_PAUSED'];
        const activeEvents = events.filter(e => activeStatusList.includes(e.status)).length;
        return {
            total: events.length,
            active: activeEvents,
            registered: totalRegistered,
            attended: totalAttended,
            rate
        };
    }, [events]);

    const activeStatusList = ['CREATED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'ATTENDANCE_ACTIVE', 'ATTENDANCE_PAUSED'];
    const activeEvents = events.filter(e => activeStatusList.includes(e.status)).slice(0, 4);
    const recentEvents = events.slice(0, 5);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <Box sx={{
                mb: 4, p: { xs: 3, md: 4 }, borderRadius: 1.5,
                background: '#101010',
                color: '#FFF',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
            }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                        <Avatar sx={{
                            width: { xs: 56, md: 72 },
                            height: { xs: 56, md: 72 },
                            bgcolor: '#D32F2F',
                            fontSize: { xs: '1.25rem', md: '1.75rem' },
                            fontWeight: 900,
                            border: '3px solid rgba(255,255,255,0.1)'
                        }}>
                            {user?.fullName?.[0]}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5, color: '#fff', fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                                {getGreeting()}, {user?.fullName?.split(' ')[0]}
                            </Typography>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.8, color: 'inherit', fontWeight: 600 }}>
                                    <DashboardIcon sx={{ fontSize: 18 }} /> {isAdmin ? 'System Administrator' : 'Event Organizer'}
                                </Typography>
                                <NotificationBell />
                            </Stack>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: { xs: '100%', sm: 'auto' } }}>
                        <Typography variant="h3" sx={{ fontWeight: 900, color: '#D32F2F', lineHeight: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>{stats.rate}%</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>Check-in Rate</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Quick Actions Bar */}
            <Box sx={{ mb: 3, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<Add />} onClick={() => navigate(isAdmin ? '/admin/create-event' : '/organizer/create-event')}
                    sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}>
                    Create Event
                </Button>
                <Button variant="outlined" startIcon={<FaceRetouchingNatural />} onClick={() => navigate('/organizer/scan')}
                    sx={{ borderColor: '#e0e0e0', color: '#212121', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { borderColor: '#212121' } }}>
                    Start Scanner
                </Button>
                <Button variant="outlined" startIcon={<Notifications />} onClick={() => navigate(isAdmin ? '/admin/notices' : '/organizer/notices')}
                    sx={{ borderColor: '#e0e0e0', color: '#212121', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { borderColor: '#212121' } }}>
                    Notices
                </Button>
            </Box>

            {/* Stats Row */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                    <StatCard label="Total Events" value={stats.total} icon={<Event />} color="#2196F3" delay={1} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard label="Active Now" value={stats.active} icon={<TrendingUp />} color="#10B981" delay={2} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard label="Registrations" value={stats.registered} icon={<People />} color="#FF9800" delay={3} />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <StatCard label="Check-ins" value={stats.attended} icon={<CheckCircle />} color="#D32F2F" delay={4} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Left: Active Events + Recent */}
                <Grid item xs={12} lg={8}>
                    {/* Active Events */}
                    {activeEvents.length > 0 && (
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121', mb: 2.5 }}>Active Events</Typography>
                            <Grid container spacing={2}>
                                {activeEvents.map(ev => (
                                    <Grid item xs={12} sm={6} key={ev.id}>
                                        <Card sx={{
                                            borderRadius: 1.5, border: '1px solid #e8e8e8',
                                            transition: 'border-color 0.15s',
                                            '&:hover': { borderColor: '#D32F2F' },
                                        }}>
                                            <CardContent sx={{ p: '16px 20px !important' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2, flex: 1, mr: 1 }}>{ev.title}</Typography>
                                                    <LiveStatusChip event={ev} />
                                                </Box>
                                                <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
                                                    <Typography variant="caption" sx={{ color: '#757575', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <People sx={{ fontSize: 14 }} /> {ev.registeredCount} reg.
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CheckCircle sx={{ fontSize: 14 }} /> {ev.attendedCount} in
                                                    </Typography>
                                                </Stack>
                                                <Stack direction="row" spacing={1}>
                                                    <Button size="small" variant="text" sx={{ fontWeight: 700, fontSize: '0.75rem', p: '2px 8px', minWidth: 0 }}
                                                        onClick={() => navigate(`/organizer/scan/${ev.id}`)}>
                                                        Scan
                                                    </Button>
                                                    <Button size="small" variant="text" sx={{ fontWeight: 700, fontSize: '0.75rem', p: '2px 8px', minWidth: 0 }}
                                                        onClick={() => navigate(`/organizer/events/${ev.id}`)}>
                                                        Live Monitor
                                                    </Button>
                                                </Stack>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    )}

                    {/* Recent Events */}
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>Recent Events</Typography>
                            <Button size="small" variant="text" onClick={() => navigate('/organizer/events')} sx={{ fontWeight: 700 }}>View All</Button>
                        </Box>
                        {loading ? <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} /> : (
                            <Stack spacing={1.5}>
                                {recentEvents.length > 0 ? recentEvents.map((ev) => (
                                    <Card key={ev.id} sx={{
                                        borderRadius: 1.5, border: '1px solid #e8e8e8',
                                        transition: 'border-color 0.15s',
                                        '&:hover': { borderColor: '#D32F2F' },
                                    }}>
                                        <CardContent sx={{ p: '14px 20px !important', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                                <Box sx={{ textAlign: 'center', minWidth: 48 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1 }}>{new Date(ev.eventDate).getDate()}</Typography>
                                                    <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#D32F2F', fontSize: '0.65rem' }}>
                                                        {new Date(ev.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                                                    </Typography>
                                                </Box>
                                                <Divider orientation="vertical" flexItem />
                                                <Box>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212121' }}>{ev.title}</Typography>
                                                    <Stack direction="row" spacing={2}>
                                                        <Typography variant="caption" sx={{ color: '#757575' }}>
                                                            {ev.registeredCount} reg. · {ev.attendedCount} check-ins
                                                        </Typography>
                                                    </Stack>
                                                </Box>
                                            </Box>
                                            <IconButton size="small" onClick={() => navigate('/organizer/events')} sx={{ bgcolor: '#f5f5f5' }}>
                                                <Visibility sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </CardContent>
                                    </Card>
                                )) : (
                                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                        <Typography variant="body2" color="text.secondary">No events created yet.</Typography>
                                        <Button variant="text" size="small" sx={{ mt: 1, fontWeight: 700 }}
                                            onClick={() => navigate(isAdmin ? '/admin/create-event' : '/organizer/create-event')}>
                                            Create your first event
                                        </Button>
                                    </Box>
                                )}
                            </Stack>
                        )}
                    </Box>

                    {/* Team Permissions Management */}
                    {!isAdmin && teams.length > 0 && (
                        <Box sx={{ mt: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>Team Permissions</Typography>
                                <Button size="small" variant="text" onClick={() => navigate('/organizer/my-teams')} sx={{ fontWeight: 700 }}>Manage Teams</Button>
                            </Box>
                            <Stack spacing={2}>
                                {teams.map(team => (
                                    <Card key={team.id} sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8' }}>
                                        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', '&:hover': { bgcolor: '#fafafa' } }}
                                            onClick={() => toggleTeam(team.id)}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#C62828', fontSize: '0.8rem', fontWeight: 800 }}>{team.name?.[0] || 'T'}</Avatar>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{team.name}</Typography>
                                            </Box>
                                            <IconButton size="small">
                                                {expandedTeamId === team.id ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                        <Collapse in={expandedTeamId === team.id}>
                                            <Box sx={{ p: 2, borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                                                {membersLoading[team.id] ? (
                                                    <Box sx={{ textAlign: 'center', py: 2 }}><CircularProgress size={20} /></Box>
                                                ) : (!teamMembers[team.id] || teamMembers[team.id].length === 0) ? (
                                                    <Typography variant="caption" sx={{ color: '#9e9e9e', display: 'block', textAlign: 'center' }}>No members in this team.</Typography>
                                                ) : (
                                                    <Stack spacing={1}>
                                                        {teamMembers[team.id].map(member => (
                                                            <Paper key={member.id} variant="outlined" sx={{ p: 1.5, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#212121', fontSize: '0.7rem' }}>{member.user?.fullName?.[0]}</Avatar>
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>{member.user?.fullName}</Typography>
                                                                        <Stack direction="row" spacing={0.5}>
                                                                            {member.canScanAttendance && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} title="Scan" />}
                                                                            {member.canViewAttendanceSheet && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#3B82F6' }} title="Sheet" />}
                                                                            {member.canManualOverride && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#F59E0B' }} title="Override" />}
                                                                            {member.canViewLiveStats && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#8B5CF6' }} title="Stats" />}
                                                                        </Stack>
                                                                    </Box>
                                                                </Box>
                                                                <Box>
                                                                    <IconButton size="small" onClick={() => openEditMember(team.id, member)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                                                                    <IconButton size="small" onClick={() => handleRemoveMember(team.id, member.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
                                                                </Box>
                                                            </Paper>
                                                        ))}
                                                    </Stack>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </Card>
                                ))}
                            </Stack>
                        </Box>
                    )}
                </Grid>

                {/* Right: Summary */}
                <Grid item xs={12} lg={4}>
                    {/* Check-in Health */}
                    <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', mb: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#757575', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem', mb: 2 }}>
                                Check-in Health
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                                <Box sx={{ position: 'relative', width: 56, height: 56 }}>
                                    <Box sx={{
                                        width: 56, height: 56, borderRadius: '50%',
                                        background: `conic-gradient(#10B981 ${stats.rate * 3.6}deg, #f0f0f0 0deg)`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.7rem' }}>{stats.rate}%</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{stats.attended} checked in</Typography>
                                    <Typography variant="caption" sx={{ color: '#757575' }}>of {stats.registered} registered</Typography>
                                </Box>
                            </Box>
                            <Stack direction="row" spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981' }} />
                                    <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, fontSize: '0.65rem' }}>Present</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f0f0f0' }} />
                                    <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, fontSize: '0.65rem' }}>Pending</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>

                    {/* Event Reports Quick Link */}
                    <Card sx={{ borderRadius: 1.5, bgcolor: '#1a1d23', overflow: 'hidden' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box sx={{ p: 0.8, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.1)', display: 'flex' }}>
                                    <Assessment sx={{ color: '#FFCA28', fontSize: 20 }} />
                                </Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#fff' }}>Reports & Export</Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mb: 2 }}>
                                View detailed attendance reports and export data for your events.
                            </Typography>
                            <Button fullWidth variant="outlined" size="small" onClick={() => navigate('/organizer/events')}
                                sx={{ borderColor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 700, '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' } }}>
                                View Reports
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snackbar.message}</Alert>
            </Snackbar>

            <MemberPermissionDialog
                open={permissionDialogOpen}
                onClose={() => setPermissionDialogOpen(false)}
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
                loading={savingMember}
                feedback={dialogFeedback}
            />
        </DashboardLayout>
    );
};

export default OrganizerDashboard;
