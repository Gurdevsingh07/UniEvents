import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, Chip, CircularProgress,
    Stack, Button, Tabs, Tab, Grid, Avatar, Collapse, Paper,
    IconButton, Snackbar, Alert, Divider, Tooltip, Badge,
    TextField, InputAdornment
} from '@mui/material';
import {
    Assignment, CheckCircle, Info, Pending, PlayArrow, Event,
    FaceRetouchingNatural, Assessment, Launch, People,
    QrCodeScanner, TableChart, BarChart, History,
    Edit, Delete, ExpandMore, ExpandLess, GroupWork,
    TouchApp, Visibility, Shield, Security, Settings,
    PersonAdd, Cancel, Group, Search
} from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import MemberPermissionDialog from '../components/MemberPermissionDialog';
import AssignTaskDialog from '../components/AssignTaskDialog';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ─── Tab Panel ─── */
const TabPanel = ({ children, value, index }) =>
    value === index ? <Box sx={{ pt: 2.5 }}>{children}</Box> : null;

/* ─── Status helpers ─── */
const STATUS_COLOR = { DONE: '#2E7D32', IN_PROGRESS: '#1565C0', CANCELLED: '#C62828', PENDING: '#E65100' };
const getStatusColor = (s) => STATUS_COLOR[s] ?? '#E65100';
const getStatusIcon = (s) => {
    const m = { DONE: <CheckCircle fontSize="small" />, IN_PROGRESS: <PlayArrow fontSize="small" />, CANCELLED: <Info fontSize="small" /> };
    return m[s] ?? <Pending fontSize="small" />;
};
const getDeadlineColor = (d) => {
    if (!d) return null;
    const h = (new Date(d) - new Date()) / 3600000;
    return h < 0 ? '#C62828' : h < 24 ? '#E65100' : null;
};

/* ─── Permission definitions ─── */
const PERMISSIONS = [
    { key: 'canScanAttendance', label: 'Scan Attendance', color: '#10B981', icon: <TouchApp sx={{ fontSize: 13 }} /> },
    { key: 'canViewAttendanceSheet', label: 'View Sheet', color: '#3B82F6', icon: <Visibility sx={{ fontSize: 13 }} /> },
    { key: 'canManualOverride', label: 'Manual Override', color: '#F59E0B', icon: <Shield sx={{ fontSize: 13 }} /> },
    { key: 'canViewLiveStats', label: 'Live Stats', color: '#8B5CF6', icon: <Security sx={{ fontSize: 13 }} /> },
    { key: 'canManageTeam', label: 'Manage Team', color: '#EC4899', icon: <Settings sx={{ fontSize: 13 }} /> },
    { key: 'canManageEvent', label: 'Manage Event', color: '#D32F2F', icon: <Event sx={{ fontSize: 13 }} /> },
];

const POSITION_COLORS = {
    'Team Lead': '#D32F2F', 'Coordinator': '#1565C0', 'Scanner': '#2E7D32',
    'Volunteer': '#E65100', 'Member': '#616161',
};
const posColor = (p) => POSITION_COLORS[p] || '#616161';

/* ─── Position sort order ─── */
const POSITION_ORDER = ['Team Lead', 'Coordinator', 'Scanner', 'Volunteer', 'Member'];

/* ─── Launch Card (student scanner/reports) ─── */
const LaunchCard = ({ icon, title, description, actions }) => (
    <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <Box sx={{ p: 1, borderRadius: 1, bgcolor: '#f5f5f5', display: 'flex' }}>{icon}</Box>
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
                    <Typography variant="caption" sx={{ color: '#757575' }}>{description}</Typography>
                </Box>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap">
                {actions.map((a, i) => (
                    <Button key={i} size="small"
                        variant={i === 0 ? 'contained' : 'outlined'}
                        startIcon={a.icon}
                        onClick={a.onClick}
                        sx={{
                            fontWeight: 700, textTransform: 'none', borderRadius: 1,
                            ...(i === 0 ? { bgcolor: '#101010', '&:hover': { bgcolor: '#D32F2F' } }
                                : { borderColor: '#e0e0e0', color: '#212121' })
                        }}>
                        {a.label}
                    </Button>
                ))}
            </Stack>
        </CardContent>
    </Card>
);


/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const VolunteerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <DashboardLayout>
            {user?.role === 'ADMIN' ? <AdminTaskView user={user} navigate={navigate} /> :
                user?.role === 'ORGANIZER' ? <OrganizerView user={user} navigate={navigate} /> :
                    <StudentView user={user} navigate={navigate} />}
        </DashboardLayout>
    );
};


/* ═══════════════════════════════════════════════════════════
   ORGANIZER VIEW
   ═══════════════════════════════════════════════════════════ */
const OrganizerView = ({ user, navigate }) => {
    const [tab, setTab] = useState(0);

    /* ── Team / member state ── */
    const [teams, setTeams] = useState([]);
    const [teamMembers, setTeamMembers] = useState({});
    const [expandedTeamId, setExpandedTeamId] = useState(null);
    const [membersLoading, setMembersLoading] = useState({});
    const [loadingTeams, setLoadingTeams] = useState(true);

    /* ── Assigned tasks ── */
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);

    /* ── Tasks assigned TO me ── */
    const [myTasks, setMyTasks] = useState([]);
    const [loadingMyTasks, setLoadingMyTasks] = useState(true);

    /* ── Dialog state ── */
    const [dlgOpen, setDlgOpen] = useState(false);
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [selectedTeamId, setSelectedTeamId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [saving, setSaving] = useState(false);
    const [dlgFeedback, setDlgFeedback] = useState(null);
    const [memberForm, setMemberForm] = useState({
        userId: '', position: 'Volunteer',
        canScanAttendance: true, canViewAttendanceSheet: false,
        canManualOverride: false, canViewLiveStats: true,
        canManageTeam: false, canManageEvent: false,
    });

    const [assignTaskOpen, setAssignTaskOpen] = useState(false);

    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
    const showSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    /* ── Fetch ── */
    useEffect(() => {
        fetchTeams();
        fetchAssignedTasks();
        fetchMyTasks();
    }, []);

    const fetchTeams = async () => {
        setLoadingTeams(true);
        try {
            const res = await api.get('/api/teams/my-teams');
            const teamList = res.data.data || [];
            setTeams(teamList);
            // Auto-expand first team and load all members
            for (const t of teamList) { fetchMembers(t.id); }
        } catch { /* silent */ } finally { setLoadingTeams(false); }
    };

    const fetchAssignedTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await api.get('/api/tasks/assigned-by-me');
            setAssignedTasks(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingTasks(false); }
    };

    const fetchMyTasks = async () => {
        setLoadingMyTasks(true);
        try {
            const res = await api.get('/api/tasks/my-tasks');
            setMyTasks(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingMyTasks(false); }
    };

    const updateMyTaskStatus = async (id, status) => {
        try {
            await api.patch(`/api/tasks/${id}/status`, { status });
            setMyTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
            showSnack('Task status updated!');
        } catch { showSnack('Failed to update status', 'error'); }
    };


    const fetchMembers = async (teamId) => {
        setMembersLoading(p => ({ ...p, [teamId]: true }));
        try {
            const res = await api.get(`/api/teams/${teamId}/members`);
            setTeamMembers(p => ({ ...p, [teamId]: res.data.data || [] }));
        } catch { /* silent */ } finally {
            setMembersLoading(p => ({ ...p, [teamId]: false }));
        }
    };

    const toggleTeam = (id) => {
        setExpandedTeamId(prev => prev === id ? null : id);
        if (!teamMembers[id]) fetchMembers(id);
    };

    /* ── Permission dialog ── */
    const openEdit = (teamId, member) => {
        setSelectedTeamId(teamId);
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
        setDlgFeedback(null);
        setDlgOpen(true);
    };

    const saveMember = async () => {
        setSaving(true);
        try {
            await api.put(`/api/teams/${selectedTeamId}/members/${editingMemberId}`, memberForm);
            showSnack('Permissions updated!');
            setDlgOpen(false);
            fetchMembers(selectedTeamId);
        } catch (err) {
            setDlgFeedback({ type: 'error', msg: err.response?.data?.message || 'Update failed.' });
        } finally { setSaving(false); }
    };

    const removeMember = async (teamId, memberId) => {
        if (!window.confirm('Remove this volunteer from the team?')) return;
        try {
            await api.delete(`/api/teams/${teamId}/members/${memberId}`);
            showSnack('Volunteer removed.');
            fetchMembers(teamId);
        } catch { showSnack('Failed to remove.', 'error'); }
    };

    const searchStudents = async (q) => {
        setSearchQuery(q);
        if (q.trim().length < 2) { setSearchResults([]); return; }
        setSearching(true);
        try {
            const res = await api.get('/api/team/members', { params: { search: q.trim(), filter: 'STUDENT' } });
            setSearchResults(res.data.data || []);
        } catch { /* silent */ } finally { setSearching(false); }
    };

    /* ── Computed: all members across teams ── */
    const allMembers = useMemo(() => Object.values(teamMembers).flat(), [teamMembers]);

    /* ── Computed: stats ── */
    const volunteerCount = allMembers.length;
    const tasksAssignedCount = assignedTasks.length;
    const myTasksPendingCount = myTasks.filter(t => t.status === 'PENDING').length;
    const tasksDoneCount = assignedTasks.filter(t => t.status === 'DONE').length;

    /* ── Computed: tasks grouped by volunteer ── */
    const tasksByVolunteer = useMemo(() => {
        const groups = {};
        assignedTasks.forEach(t => {
            const name = t.assignedTo?.fullName || 'Unknown';
            if (!groups[name]) groups[name] = { user: t.assignedTo, tasks: [] };
            groups[name].tasks.push(t);
        });
        return groups;
    }, [assignedTasks]);

    /* ── Computed: task count per user ID ── */
    const taskCountByUser = useMemo(() => {
        const map = {};
        assignedTasks.forEach(t => {
            const uid = t.assignedTo?.id;
            if (uid) map[uid] = (map[uid] || 0) + 1;
        });
        return map;
    }, [assignedTasks]);

    return (
        <>
            {/* Header */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mb: 0.25 }}>
                        Volunteer Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                        View and manage your volunteers, their permissions, and assigned tasks.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Assignment />}
                    onClick={() => setAssignTaskOpen(true)}
                    sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}
                >
                    Assign Task
                </Button>
            </Box>

            {/* Stats Strip */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Volunteers', value: volunteerCount, color: '#1565C0' },
                    { label: 'Total Assigned', value: tasksAssignedCount, color: '#212121' },
                    { label: 'My Tasks Pending', value: myTasksPendingCount, color: '#E65100' },
                    { label: 'Tasks Completed', value: tasksDoneCount, color: '#2E7D32' },
                ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', borderTop: `3px solid ${s.color}` }}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
                    <Tab icon={<Assignment sx={{ fontSize: 16 }} />} iconPosition="start" label="My Tasks"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                    <Tab icon={<People sx={{ fontSize: 16 }} />} iconPosition="start" label="My Volunteers"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                    <Tab icon={<Assignment sx={{ fontSize: 16 }} />} iconPosition="start" label="Assigned Tasks"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                </Tabs>
            </Box>

            {/* ────── TAB 0: MY TASKS ────── */}
            <TabPanel value={tab} index={0}>
                {loadingMyTasks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : myTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                        <Assignment sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                            No tasks assigned to you yet.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {myTasks.map(task => {
                            const dlColor = getDeadlineColor(task.deadline);
                            return (
                                <Card key={task.id} sx={{
                                    borderRadius: 1.5, border: '1px solid #e8e8e8',
                                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                                }}>
                                    <CardContent sx={{ p: '16px 20px !important' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2, flex: 1, mr: 1 }}>
                                                {task.title}
                                            </Typography>
                                            <Chip icon={getStatusIcon(task.status)} label={task.status.replace('_', ' ')} size="small"
                                                sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: `${getStatusColor(task.status)}12`, color: getStatusColor(task.status) }} />
                                        </Box>
                                        {task.description && (
                                            <Typography variant="body2" sx={{ color: '#424242', mb: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {task.description}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap"
                                            sx={{ mb: task.status !== 'DONE' && task.status !== 'CANCELLED' ? 1.5 : 0 }}>
                                            {task.eventTitle && (
                                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Event sx={{ fontSize: 12 }} /> {task.eventTitle}
                                                </Typography>
                                            )}
                                            {task.deadline && (
                                                <Typography variant="caption" sx={{ color: dlColor || '#757575', fontWeight: dlColor ? 700 : 600 }}>
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                    {dlColor === '#C62828' && ' (overdue)'}
                                                    {dlColor === '#E65100' && ' (due soon)'}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: '#bdbdbd' }}>
                                                by {task.assignedBy?.fullName}
                                            </Typography>
                                        </Stack>
                                        {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                                            <Stack direction="row" spacing={1}>
                                                {task.status === 'PENDING' && (
                                                    <Button size="small" variant="outlined" onClick={() => updateMyTaskStatus(task.id, 'IN_PROGRESS')}
                                                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Start Task
                                                    </Button>
                                                )}
                                                {task.status === 'IN_PROGRESS' && (
                                                    <Button size="small" variant="contained" color="success" onClick={() => updateMyTaskStatus(task.id, 'DONE')}
                                                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Mark Complete
                                                    </Button>
                                                )}
                                            </Stack>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </TabPanel>

            {/* ────── TAB 1: MY VOLUNTEERS ────── */}
            <TabPanel value={tab} index={1}>
                {/* Permission Legend */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px solid #f0f0f0' }}>
                    <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 700, mr: 0.5, alignSelf: 'center' }}>PERMISSIONS:</Typography>
                    {PERMISSIONS.map(p => (
                        <Chip key={p.key} icon={p.icon} label={p.label} size="small"
                            sx={{
                                fontSize: '0.68rem', fontWeight: 600, bgcolor: `${p.color}12`, color: p.color, height: 24,
                                '& .MuiChip-icon': { color: p.color }
                            }} />
                    ))}
                </Box>

                {loadingTeams ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : teams.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                        <People sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>No teams created yet.</Typography>
                        <Button variant="text" size="small" sx={{ mt: 1, fontWeight: 700 }} onClick={() => navigate('/organizer/team')}>
                            Create a Team
                        </Button>
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {teams.map(team => {
                            const isExpanded = expandedTeamId === team.id;
                            const members = teamMembers[team.id] || [];
                            const isLoading = membersLoading[team.id];

                            // Group by position & sort
                            const grouped = {};
                            members.forEach(m => {
                                const pos = m.position || 'Member';
                                if (!grouped[pos]) grouped[pos] = [];
                                grouped[pos].push(m);
                            });
                            const sortedPositions = Object.keys(grouped).sort((a, b) => {
                                const ia = POSITION_ORDER.indexOf(a);
                                const ib = POSITION_ORDER.indexOf(b);
                                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
                            });

                            return (
                                <Card key={team.id} sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                                    {/* Team header */}
                                    <Box onClick={() => toggleTeam(team.id)} sx={{
                                        p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        cursor: 'pointer', '&:hover': { bgcolor: '#fafafa' }, transition: 'background 0.15s',
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar sx={{ width: 38, height: 38, bgcolor: '#C62828', fontSize: '0.9rem', fontWeight: 800 }}>
                                                {team.name?.[0] || 'T'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{team.name}</Typography>
                                                <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                                                    {members.length} member{members.length !== 1 ? 's' : ''}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                            <Button size="small" variant="outlined"
                                                onClick={e => { e.stopPropagation(); navigate('/organizer/team'); }}
                                                sx={{ fontWeight: 700, textTransform: 'none', fontSize: '0.75rem', borderRadius: 1, borderColor: '#e0e0e0' }}>
                                                Full Management
                                            </Button>
                                            <IconButton size="small">
                                                {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                            </IconButton>
                                        </Box>
                                    </Box>

                                    {/* Members list */}
                                    <Collapse in={isExpanded}>
                                        <Divider />
                                        <Box sx={{ p: 2.5, bgcolor: '#fafafa' }}>
                                            {isLoading ? (
                                                <Box sx={{ textAlign: 'center', py: 3 }}><CircularProgress size={22} /></Box>
                                            ) : members.length === 0 ? (
                                                <Typography variant="body2" sx={{ color: '#9e9e9e', textAlign: 'center', py: 3 }}>
                                                    No volunteers in this team yet.
                                                </Typography>
                                            ) : (
                                                sortedPositions.map(position => (
                                                    <Box key={position} sx={{ mb: 2.5, '&:last-child': { mb: 0 } }}>
                                                        {/* Position heading */}
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                            <GroupWork sx={{ fontSize: 15, color: posColor(position) }} />
                                                            <Typography variant="caption" sx={{
                                                                fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2,
                                                                color: posColor(position), fontSize: '0.7rem',
                                                            }}>
                                                                {position} ({grouped[position].length})
                                                            </Typography>
                                                        </Box>

                                                        <Stack spacing={1.5}>
                                                            {grouped[position].map(member => {
                                                                const activePerms = PERMISSIONS.filter(p => member[p.key]);
                                                                const userTaskCount = taskCountByUser[member.user?.id] || 0;

                                                                return (
                                                                    <Paper key={member.id} variant="outlined" sx={{
                                                                        p: 2, borderRadius: 1.5, bgcolor: '#fff',
                                                                        borderLeft: `3px solid ${posColor(position)}`,
                                                                        transition: 'box-shadow 0.15s',
                                                                        '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                                                                    }}>
                                                                        {/* Row 1: Avatar, Name, Actions */}
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                                <Avatar sx={{ width: 36, height: 36, bgcolor: '#212121', fontSize: '0.8rem', fontWeight: 800 }}>
                                                                                    {member.user?.fullName?.[0]}
                                                                                </Avatar>
                                                                                <Box>
                                                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2 }}>
                                                                                        {member.user?.fullName}
                                                                                    </Typography>
                                                                                    <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                                                                                        {member.user?.email}
                                                                                        {member.user?.studentId && ` · ${member.user.studentId}`}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Box>
                                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                                {userTaskCount > 0 && (
                                                                                    <Chip label={`${userTaskCount} task${userTaskCount > 1 ? 's' : ''}`}
                                                                                        size="small" sx={{
                                                                                            fontSize: '0.68rem', fontWeight: 700, height: 22,
                                                                                            bgcolor: '#f5f5f5', color: '#616161', mr: 0.5,
                                                                                        }} />
                                                                                )}
                                                                                <Tooltip title="Edit Permissions">
                                                                                    <IconButton size="small" onClick={() => openEdit(team.id, member)}
                                                                                        sx={{ bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#e0e0e0' } }}>
                                                                                        <Edit sx={{ fontSize: 16 }} />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                                <Tooltip title="Remove from Team">
                                                                                    <IconButton size="small" onClick={() => removeMember(team.id, member.id)}
                                                                                        sx={{ '&:hover': { bgcolor: '#ffebee' } }}>
                                                                                        <Delete sx={{ fontSize: 16, color: '#e57373' }} />
                                                                                    </IconButton>
                                                                                </Tooltip>
                                                                            </Box>
                                                                        </Box>

                                                                        {/* Row 2: Permission chips */}
                                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                                            {activePerms.length > 0 ? activePerms.map(perm => (
                                                                                <Chip key={perm.key} icon={perm.icon} label={perm.label} size="small"
                                                                                    sx={{
                                                                                        fontSize: '0.68rem', fontWeight: 600, height: 24,
                                                                                        bgcolor: `${perm.color}12`, color: perm.color,
                                                                                        '& .MuiChip-icon': { color: perm.color },
                                                                                    }} />
                                                                            )) : (
                                                                                <Typography variant="caption" sx={{ color: '#bdbdbd', fontStyle: 'italic' }}>
                                                                                    No permissions granted
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    </Paper>
                                                                );
                                                            })}
                                                        </Stack>
                                                    </Box>
                                                ))
                                            )}
                                        </Box>
                                    </Collapse>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </TabPanel>

            {/* ────── TAB 2: ASSIGNED TASKS ────── */}
            <TabPanel value={tab} index={2}>
                {loadingTasks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : assignedTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                        <Assignment sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                            You haven't assigned any tasks yet.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={3}>
                        {Object.entries(tasksByVolunteer).map(([volName, { user: vol, tasks }]) => (
                            <Box key={volName}>
                                {/* Volunteer heading */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#212121', fontSize: '0.7rem', fontWeight: 800 }}>
                                        {volName[0]}
                                    </Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#212121' }}>
                                        {volName}
                                    </Typography>
                                    <Chip label={`${tasks.length} task${tasks.length > 1 ? 's' : ''}`} size="small"
                                        sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20, bgcolor: '#f5f5f5' }} />
                                </Box>

                                <Stack spacing={1}>
                                    {tasks.map(task => {
                                        const dlColor = getDeadlineColor(task.deadline);
                                        return (
                                            <Card key={task.id} sx={{
                                                borderRadius: 1.5, border: '1px solid #e8e8e8',
                                                borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                                '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
                                            }}>
                                                <CardContent sx={{ p: '14px 20px !important' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box sx={{ flex: 1, mr: 1 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2 }}>
                                                                {task.title}
                                                            </Typography>
                                                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                                                {task.eventTitle && (
                                                                    <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <Event sx={{ fontSize: 12 }} /> {task.eventTitle}
                                                                    </Typography>
                                                                )}
                                                                {task.deadline && (
                                                                    <Typography variant="caption" sx={{ color: dlColor || '#757575', fontWeight: dlColor ? 700 : 600 }}>
                                                                        Due: {new Date(task.deadline).toLocaleDateString()}
                                                                        {dlColor === '#C62828' && ' (overdue)'}
                                                                        {dlColor === '#E65100' && ' (due soon)'}
                                                                    </Typography>
                                                                )}
                                                            </Stack>
                                                        </Box>
                                                        <Chip icon={getStatusIcon(task.status)} label={task.status.replace('_', ' ')} size="small"
                                                            sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: `${getStatusColor(task.status)}12`, color: getStatusColor(task.status) }} />
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                )}
            </TabPanel>

            {/* Permission Edit Dialog */}
            <MemberPermissionDialog
                open={dlgOpen}
                onClose={() => setDlgOpen(false)}
                editMode={true}
                memberForm={memberForm}
                setMemberForm={setMemberForm}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searching={searching}
                searchResults={searchResults}
                onSearch={searchStudents}
                onSelectStudent={(s) => {
                    if (!s) { setMemberForm(p => ({ ...p, userId: '' })); setSearchQuery(''); }
                    else { setMemberForm(p => ({ ...p, userId: s.id })); setSearchQuery(s.fullName); setSearchResults([]); }
                }}
                onSave={saveMember}
                loading={saving}
                feedback={dlgFeedback}
            />

            <AssignTaskDialog
                open={assignTaskOpen}
                onClose={() => setAssignTaskOpen(false)}
                onAssigned={() => {
                    showSnack('Task assigned successfully!');
                    fetchAssignedTasks();
                }}
                isOrganizer={true}
                adminMode={false}
            />

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(p => ({ ...p, open: false }))}>
                <Alert severity={snack.sev} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snack.msg}</Alert>
            </Snackbar>
        </>
    );
};


/* ═══════════════════════════════════════════════════════════
   ADMIN TASK VIEW (Replacing Volunteer portal for admins)
   ═══════════════════════════════════════════════════════════ */
const AdminTaskView = ({ user, navigate }) => {
    const [tab, setTab] = useState(0);
    const [assignedTasks, setAssignedTasks] = useState([]);
    const [organizers, setOrganizers] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingTeams, setLoadingTeams] = useState(false);
    const [assignTaskOpen, setAssignTaskOpen] = useState(false);
    const [teamSearch, setTeamSearch] = useState('');
    const [lastSync, setLastSync] = useState(null);
    const [snack, setSnack] = useState({ open: false, msg: '', sev: 'success' });
    const showSnack = (msg, sev = 'success') => setSnack({ open: true, msg, sev });

    useEffect(() => {
        fetchAssignedTasks();
        fetchTeams();
        const interval = setInterval(fetchTeams, 30000); // Live sync every 30s
        return () => clearInterval(interval);
    }, []);

    const fetchTeams = async () => {
        setLoadingTeams(true);
        try {
            const res = await api.get('/api/admin/organizers-with-teams');
            setOrganizers(res.data.data || []);
            setLastSync(new Date().toLocaleTimeString());
        } catch { /* silent */ } finally { setLoadingTeams(false); }
    };

    const fetchAssignedTasks = async () => {
        setLoadingTasks(true);
        try {
            const res = await api.get('/api/tasks/assigned-by-me');
            setAssignedTasks(res.data.data || []);
        } catch { /* silent */ } finally { setLoadingTasks(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/api/tasks/${id}/status`, { status });
            setAssignedTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
        } catch { /* silent */ }
    };

    const tasksPending = assignedTasks.filter(t => t.status === 'PENDING').length;
    const tasksInProgress = assignedTasks.filter(t => t.status === 'IN_PROGRESS').length;
    const tasksDone = assignedTasks.filter(t => t.status === 'DONE').length;

    return (
        <>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mb: 0.25 }}>
                        Task Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                        Assign and track tasks designated for organizers and students across the system.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Assignment />}
                    onClick={() => setAssignTaskOpen(true)}
                    sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}
                >
                    Assign Task
                </Button>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Assigned', value: assignedTasks.length, color: '#212121' },
                    { label: 'Pending', value: tasksPending, color: '#E65100' },
                    { label: 'In Progress', value: tasksInProgress, color: '#1565C0' },
                    { label: 'Completed', value: tasksDone, color: '#2E7D32' },
                ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', borderTop: `3px solid ${s.color}` }}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Admin Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 44 }}>
                    <Tab icon={<Assignment sx={{ fontSize: 18 }} />} iconPosition="start" label="Assigned Tasks"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.9rem' }} />
                    <Tab icon={<Group sx={{ fontSize: 18 }} />} iconPosition="start" label="Teams & Organizers"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.9rem' }} />
                </Tabs>
            </Box>

            {/* TAB 0: ASSIGNED TASKS */}
            <TabPanel value={tab} index={0}>

                {loadingTasks ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : assignedTasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                        <Assignment sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                            No tasks assigned yet. Check back later or create a new assignment.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {assignedTasks.map(task => {
                            const dlColor = getDeadlineColor(task.deadline);
                            return (
                                <Card key={task.id} sx={{
                                    borderRadius: 1.5, border: '1px solid #e8e8e8',
                                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                                }}>
                                    <CardContent sx={{ p: '16px 20px !important' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Box sx={{ flex: 1, mr: 1 }}>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2 }}>
                                                    {task.title}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                                                    Assigned to: <strong style={{ color: '#212121' }}>{task.assignedTo?.fullName}</strong>
                                                </Typography>
                                            </Box>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                                                    <Button size="small" variant="text" color="error" onClick={() => updateStatus(task.id, 'CANCELLED')}
                                                        sx={{ fontWeight: 700, textTransform: 'none', minWidth: 0, p: '2px 8px' }}>
                                                        Cancel Task
                                                    </Button>
                                                )}
                                                <Chip icon={getStatusIcon(task.status)} label={task.status.replace('_', ' ')} size="small"
                                                    sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: `${getStatusColor(task.status)}12`, color: getStatusColor(task.status) }} />
                                            </Stack>
                                        </Box>
                                        {task.description && (
                                            <Typography variant="body2" sx={{ color: '#424242', mb: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {task.description}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                                            {task.eventTitle && (
                                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Event sx={{ fontSize: 12 }} /> {task.eventTitle}
                                                </Typography>
                                            )}
                                            {task.deadline && (
                                                <Typography variant="caption" sx={{ color: dlColor || '#757575', fontWeight: dlColor ? 700 : 600 }}>
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                    {dlColor === '#C62828' && ' (overdue)'}
                                                    {dlColor === '#E65100' && ' (due soon)'}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </TabPanel>

            {/* TAB 1: TEAMS & ORGANIZERS */}
            <TabPanel value={tab} index={1}>
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TextField
                        sx={{ width: 350 }}
                        placeholder="Search organizers or teams..."
                        value={teamSearch}
                        onChange={(e) => setTeamSearch(e.target.value)}
                        variant="outlined"
                        size="small"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#9e9e9e', fontSize: 20 }} />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: 2, bgcolor: '#fff' }
                        }}
                    />
                    {lastSync && (
                        <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>
                            Live Synced: {lastSync}
                        </Typography>
                    )}
                </Box>

                {loadingTeams && organizers.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : (
                    <Stack spacing={2}>
                        {organizers.filter(org =>
                            org.fullName.toLowerCase().includes(teamSearch.toLowerCase()) ||
                            org.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
                            org.teams.some(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
                        ).length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                <Group sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                                <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                                    No organizers or teams found.
                                </Typography>
                            </Box>
                        ) : (
                            <Grid container spacing={2}>
                                {organizers.filter(org =>
                                    org.fullName.toLowerCase().includes(teamSearch.toLowerCase()) ||
                                    org.email.toLowerCase().includes(teamSearch.toLowerCase()) ||
                                    org.teams.some(t => t.name.toLowerCase().includes(teamSearch.toLowerCase()))
                                ).map(org => (
                                    <Grid item xs={12} md={6} key={org.id}>
                                        <Card sx={{
                                            borderRadius: 2,
                                            border: '1px solid #eef2f6',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderColor: '#e0e0e0' }
                                        }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                    <Avatar sx={{ bgcolor: 'rgba(198, 40, 40, 0.1)', color: '#C62828', fontWeight: 800, mr: 2 }}>
                                                        {org.fullName.charAt(0)}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#212121', lineHeight: 1.2 }}>
                                                            {org.fullName}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: '#757575' }}>
                                                            {org.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Typography variant="subtitle2" sx={{ mb: 1.5, color: '#424242', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Group sx={{ fontSize: 18 }} /> Teams ({org.teams.length})
                                                </Typography>

                                                {org.teams.length > 0 ? (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {org.teams.map(team => (
                                                            <Chip
                                                                key={team.id}
                                                                label={team.name}
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    fontWeight: 600,
                                                                    bgcolor: '#f5f5f5',
                                                                    color: '#424242',
                                                                    border: '1px solid #e0e0e0'
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                ) : (
                                                    <Typography variant="body2" sx={{ color: '#bdbdbd', fontStyle: 'italic' }}>
                                                        No teams assigned yet.
                                                    </Typography>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Stack>
                )}
            </TabPanel >

            <AssignTaskDialog
                open={assignTaskOpen}
                onClose={() => setAssignTaskOpen(false)}
                onAssigned={() => {
                    showSnack('Task assigned successfully!');
                    fetchAssignedTasks();
                }}
                isOrganizer={false}
                adminMode={true}
            />

            <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack(p => ({ ...p, open: false }))}>
                <Alert severity={snack.sev} sx={{ borderRadius: 1.5, fontWeight: 700 }}>{snack.msg}</Alert>
            </Snackbar>
        </>
    );
};


/* ═══════════════════════════════════════════════════════════
   STUDENT VIEW
   ═══════════════════════════════════════════════════════════ */
const StudentView = ({ user, navigate }) => {
    const [mainTab, setMainTab] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    const canScan = user?.permissions?.includes('canScanAttendance') || user?.permissions?.includes('canManualOverride') || user?.permissions?.includes('canViewAttendanceSheet');
    const canReport = user?.permissions?.includes('canViewLiveStats') || user?.permissions?.includes('canManageEvent');

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/tasks/my-tasks');
            setTasks(res.data.data || []);
        } catch { /* silent */ } finally { setLoading(false); }
    };

    const updateStatus = async (id, status) => {
        try {
            await api.patch(`/api/tasks/${id}/status`, { status });
            setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
        } catch { /* silent */ }
    };

    const taskStats = useMemo(() => {
        const pending = tasks.filter(t => t.status === 'PENDING').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
        const done = tasks.filter(t => t.status === 'DONE').length;
        const total = tasks.length;
        return { pending, inProgress, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
    }, [tasks]);

    return (
        <>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mb: 0.25 }}>
                    Volunteer Portal
                </Typography>
                <Typography variant="body2" sx={{ color: '#757575' }}>
                    Manage your assigned tasks and volunteer responsibilities.
                </Typography>
            </Box>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Pending', value: taskStats.pending, color: '#E65100' },
                    { label: 'In Progress', value: taskStats.inProgress, color: '#1565C0' },
                    { label: 'Completed', value: taskStats.done, color: '#2E7D32' },
                    { label: 'Completion', value: `${taskStats.rate}%`, color: '#D32F2F' },
                ].map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', borderTop: `3px solid ${s.color}` }}>
                            <CardContent sx={{ textAlign: 'center', p: 2, '&:last-child': { pb: 2 } }}>
                                <Typography variant="h5" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)} sx={{ minHeight: 44 }}>
                    <Tab icon={<Assignment sx={{ fontSize: 16 }} />} iconPosition="start" label="My Tasks"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                    <Tab icon={<FaceRetouchingNatural sx={{ fontSize: 16 }} />} iconPosition="start" label="Scanner & Sheets"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                    <Tab icon={<Assessment sx={{ fontSize: 16 }} />} iconPosition="start" label="Event Reports"
                        sx={{ fontWeight: 700, textTransform: 'none', minHeight: 44, fontSize: '0.85rem' }} />
                </Tabs>
            </Box>

            {/* TAB 0: MY TASKS */}
            <TabPanel value={mainTab} index={0}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : tasks.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                        <Assignment sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                        <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                            No tasks assigned yet. Your organizer will add tasks here.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1.5}>
                        {tasks.map(task => {
                            const dlColor = getDeadlineColor(task.deadline);
                            return (
                                <Card key={task.id} sx={{
                                    borderRadius: 1.5, border: '1px solid #e8e8e8',
                                    borderLeft: `4px solid ${getStatusColor(task.status)}`,
                                    '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
                                }}>
                                    <CardContent sx={{ p: '16px 20px !important' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#212121', lineHeight: 1.2, flex: 1, mr: 1 }}>
                                                {task.title}
                                            </Typography>
                                            <Chip icon={getStatusIcon(task.status)} label={task.status.replace('_', ' ')} size="small"
                                                sx={{ fontSize: '0.7rem', fontWeight: 700, bgcolor: `${getStatusColor(task.status)}12`, color: getStatusColor(task.status) }} />
                                        </Box>
                                        {task.description && (
                                            <Typography variant="body2" sx={{ color: '#424242', mb: 1.5, whiteSpace: 'pre-wrap' }}>
                                                {task.description}
                                            </Typography>
                                        )}
                                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap"
                                            sx={{ mb: task.status !== 'DONE' && task.status !== 'CANCELLED' ? 1.5 : 0 }}>
                                            {task.eventTitle && (
                                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <Event sx={{ fontSize: 12 }} /> {task.eventTitle}
                                                </Typography>
                                            )}
                                            {task.deadline && (
                                                <Typography variant="caption" sx={{ color: dlColor || '#757575', fontWeight: dlColor ? 700 : 600 }}>
                                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                                    {dlColor === '#C62828' && ' (overdue)'}
                                                    {dlColor === '#E65100' && ' (due soon)'}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: '#bdbdbd' }}>
                                                by {task.assignedBy?.fullName}
                                            </Typography>
                                        </Stack>
                                        {task.status !== 'DONE' && task.status !== 'CANCELLED' && (
                                            <Stack direction="row" spacing={1}>
                                                {task.status === 'PENDING' && (
                                                    <Button size="small" variant="outlined" onClick={() => updateStatus(task.id, 'IN_PROGRESS')}
                                                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Start Task
                                                    </Button>
                                                )}
                                                {task.status === 'IN_PROGRESS' && (
                                                    <Button size="small" variant="contained" color="success" onClick={() => updateStatus(task.id, 'DONE')}
                                                        sx={{ fontWeight: 700, textTransform: 'none', borderRadius: 1 }}>
                                                        Mark Complete
                                                    </Button>
                                                )}
                                            </Stack>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Stack>
                )}
            </TabPanel>

            {/* TAB 1: SCANNER & SHEETS */}
            <TabPanel value={mainTab} index={1}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
                    Use the tools below to manage attendance for events you are assigned to.
                </Typography>
                <Grid container spacing={2.5}>
                    {canScan ? (
                        <>
                            <Grid item xs={12} sm={6}>
                                <LaunchCard icon={<QrCodeScanner sx={{ color: '#D32F2F', fontSize: 24 }} />}
                                    title="Face / QR Scanner" description="Scan attendees using face recognition."
                                    actions={[{ label: 'Open Scanner', icon: <Launch sx={{ fontSize: 16 }} />, onClick: () => navigate('/organizer/scan') }]} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LaunchCard icon={<TableChart sx={{ color: '#1565C0', fontSize: 24 }} />}
                                    title="Attendance Sheet" description="View the attendance sheet for your events."
                                    actions={[{ label: 'View Sheet', icon: <Launch sx={{ fontSize: 16 }} />, onClick: () => navigate('/organizer/scan') }]} />
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                <FaceRetouchingNatural sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                                <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>You do not have scanner permissions.</Typography>
                                <Typography variant="caption" sx={{ color: '#bdbdbd' }}>Ask your organizer to grant access.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>

            {/* TAB 2: EVENT REPORTS */}
            <TabPanel value={mainTab} index={2}>
                <Typography variant="body2" sx={{ color: '#757575', mb: 3 }}>
                    Access event analytics and reports for your assigned events.
                </Typography>
                <Grid container spacing={2.5}>
                    {canReport ? (
                        <>
                            <Grid item xs={12} sm={6}>
                                <LaunchCard icon={<BarChart sx={{ color: '#2E7D32', fontSize: 24 }} />}
                                    title="Live Monitor" description="Real-time check-in statistics for events."
                                    actions={[{ label: 'View Stats', icon: <Launch sx={{ fontSize: 16 }} />, onClick: () => navigate('/organizer/history') }]} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LaunchCard icon={<History sx={{ color: '#E65100', fontSize: 24 }} />}
                                    title="Event History" description="Browse past events and download reports."
                                    actions={[{ label: 'Open History', icon: <Launch sx={{ fontSize: 16 }} />, onClick: () => navigate('/organizer/history') }]} />
                            </Grid>
                        </>
                    ) : (
                        <Grid item xs={12}>
                            <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                                <Assessment sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                                <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>You do not have report access.</Typography>
                                <Typography variant="caption" sx={{ color: '#bdbdbd' }}>Ask your organizer to grant permissions.</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            </TabPanel>
        </>
    );
};


export default VolunteerDashboard;
