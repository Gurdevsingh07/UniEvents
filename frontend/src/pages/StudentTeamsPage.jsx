import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Stack, Avatar, Chip, Collapse,
    CircularProgress, Paper, Divider, IconButton, Grid, Alert
} from '@mui/material';
import { Groups, ExpandMore, ExpandLess, Person, Shield } from '@mui/icons-material';

const PERMISSION_LABELS = {
    canScanAttendance: { label: 'Scan Attendance', color: '#10B981' },
    canViewAttendanceSheet: { label: 'View Sheet', color: '#3B82F6' },
    canManualOverride: { label: 'Override', color: '#F59E0B' },
    canViewLiveStats: { label: 'Live Stats', color: '#8B5CF6' },
    canManageTeam: { label: 'Manage Team', color: '#D32F2F' },
    canManageEvent: { label: 'Manage Event', color: '#EC4899' },
};

const StudentTeamsPage = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedTeam, setExpandedTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState({});
    const [membersLoading, setMembersLoading] = useState({});

    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                const res = await api.get('/api/teams/my-teams');
                setTeams(res.data.data || []);
            } catch (err) {
                setError('Failed to load your teams. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const fetchMembers = async (teamId) => {
        setMembersLoading(prev => ({ ...prev, [teamId]: true }));
        try {
            const res = await api.get(`/api/teams/${teamId}/members`);
            setTeamMembers(prev => ({ ...prev, [teamId]: res.data.data || [] }));
        } catch (err) {
            setTeamMembers(prev => ({ ...prev, [teamId]: [] }));
        } finally {
            setMembersLoading(prev => ({ ...prev, [teamId]: false }));
        }
    };

    const toggleExpand = (teamId) => {
        if (expandedTeam === teamId) {
            setExpandedTeam(null);
        } else {
            setExpandedTeam(teamId);
            if (!teamMembers[teamId]) fetchMembers(teamId);
        }
    };

    const getPermissionChips = (member) =>
        Object.entries(PERMISSION_LABELS)
            .filter(([key]) => member[key])
            .map(([key, { label, color }]) => (
                <Chip key={key} label={label} size="small" sx={{
                    fontWeight: 700, fontSize: '0.6rem', height: 20,
                    bgcolor: `${color}14`, color
                }} />
            ));

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up">
                {/* Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{
                        width: 40, height: 40, borderRadius: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(211,47,47,0.08)', color: '#D32F2F'
                    }}>
                        <Groups />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#212121', lineHeight: 1.2 }}>
                            My Teams
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#757575' }}>
                            Teams you have been assigned to by organizers
                        </Typography>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                        <CircularProgress sx={{ color: '#D32F2F' }} />
                    </Box>
                ) : teams.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: { xs: 5, md: 8 }, textAlign: 'center', borderRadius: 2, borderStyle: 'dashed' }}>
                        <Groups sx={{ fontSize: 60, color: '#E0E0E0', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#9E9E9E', mb: 1 }}>
                            No Teams Yet
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#BDBDBD', maxWidth: 300, mx: 'auto' }}>
                            You haven't been added to any teams by an organizer yet.
                        </Typography>
                    </Paper>
                ) : (
                    <Stack spacing={2}>
                        {teams.map(team => (
                            <Card key={team.id} sx={{
                                borderRadius: 2, overflow: 'hidden',
                                border: expandedTeam === team.id ? '1.5px solid #D32F2F' : '1px solid #E0E0E0',
                                transition: 'border 0.2s'
                            }}>
                                {/* Team Header Row */}
                                <Box sx={{
                                    p: 2.5, display: 'flex', alignItems: 'center',
                                    justifyContent: 'space-between', cursor: 'pointer',
                                    '&:hover': { bgcolor: '#FAFAFA' }
                                }} onClick={() => toggleExpand(team.id)}>
                                    <Stack direction="row" spacing={2} alignItems="center">
                                        <Avatar sx={{
                                            bgcolor: '#D32F2F', width: 46, height: 46,
                                            fontWeight: 900, fontSize: '1.1rem'
                                        }}>
                                            {team.name?.charAt(0)}
                                        </Avatar>
                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 900, color: '#212121', fontSize: { xs: '1rem', md: '1.25rem' } }}>
                                                {team.name}
                                            </Typography>
                                            {team.description && (
                                                <Typography variant="caption" sx={{ color: '#757575', display: 'block', mt: 0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {team.description}
                                                    {team.purpose && ` · ${team.purpose}`}
                                                </Typography>
                                            )}
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                                                <Chip
                                                    label={team.position || 'Member'}
                                                    size="small"
                                                    icon={<Shield sx={{ fontSize: '12px !important' }} />}
                                                    sx={{
                                                        height: 22, fontWeight: 700, fontSize: '0.68rem',
                                                        bgcolor: 'rgba(211,47,47,0.08)', color: '#D32F2F',
                                                        border: '1px solid rgba(211,47,47,0.2)',
                                                    }}
                                                />
                                                {team.createdBy?.fullName && (
                                                    <Typography variant="caption" sx={{ color: '#9E9E9E', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                                        <Person sx={{ fontSize: 12 }} />
                                                        {team.createdBy.fullName}
                                                    </Typography>
                                                )}
                                            </Stack>
                                        </Box>
                                    </Stack>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                                        <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {expandedTeam === team.id ? 'Hide' : 'View'} members
                                        </Typography>
                                        {expandedTeam === team.id
                                            ? <ExpandLess sx={{ color: '#757575', fontSize: 20 }} />
                                            : <ExpandMore sx={{ color: '#757575', fontSize: 20 }} />}
                                    </Stack>
                                </Box>

                                {/* Expanded Members Panel */}
                                <Collapse in={expandedTeam === team.id}>
                                    <Divider />
                                    <Box sx={{ p: 2.5, bgcolor: '#FAFAFA' }}>
                                        <Typography variant="caption" sx={{
                                            fontWeight: 700, textTransform: 'uppercase',
                                            letterSpacing: 1, color: '#757575', fontSize: '0.68rem'
                                        }}>
                                            Team Members
                                        </Typography>

                                        {membersLoading[team.id] ? (
                                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                                <CircularProgress size={22} sx={{ color: '#D32F2F' }} />
                                            </Box>
                                        ) : !teamMembers[team.id] || teamMembers[team.id].length === 0 ? (
                                            <Typography variant="body2" sx={{ color: '#9E9E9E', py: 2 }}>
                                                No other members found.
                                            </Typography>
                                        ) : (
                                            <Grid container spacing={2.5} sx={{ mt: 1 }}>
                                                {teamMembers[team.id].map(member => {
                                                    const isMe = member.user?.id === user?.id;
                                                    return (
                                                        <Grid item xs={12} sm={6} lg={4} key={member.id}>
                                                            <Paper variant="outlined" sx={{
                                                                p: 2, borderRadius: 1.5,
                                                                border: isMe ? '1.5px solid #D32F2F' : '1px solid #E8E8E8',
                                                                bgcolor: isMe ? 'rgba(211,47,47,0.02)' : '#fff',
                                                                display: 'flex', flexDirection: 'column', gap: 1.5,
                                                                height: '100%',
                                                                boxShadow: isMe ? '0 4px 6px -1px rgba(211, 47, 47, 0.1)' : 'none',
                                                            }}>
                                                                <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
                                                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                                                        <Avatar sx={{
                                                                            width: 36, height: 36, fontSize: '0.8rem',
                                                                            fontWeight: 800,
                                                                            bgcolor: isMe ? '#D32F2F' : '#212121'
                                                                        }}>
                                                                            {member.user?.fullName?.charAt(0) || '?'}
                                                                        </Avatar>
                                                                        <Box>
                                                                            <Typography component="div" variant="body2" sx={{ fontWeight: 800, color: '#212121', display: 'flex', alignItems: 'center' }}>
                                                                                {member.user?.fullName || 'Unknown'}
                                                                                {isMe && (
                                                                                    <Chip label="You" size="small" sx={{
                                                                                        ml: 0.8, height: 16, fontSize: '0.55rem',
                                                                                        fontWeight: 900, bgcolor: '#D32F2F', color: '#fff'
                                                                                    }} />
                                                                                )}
                                                                            </Typography>
                                                                            <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600 }}>
                                                                                {member.position || 'Member'}
                                                                            </Typography>
                                                                        </Box>
                                                                    </Stack>
                                                                </Stack>
                                                                <Divider sx={{ borderStyle: 'dashed', opacity: 0.6 }} />
                                                                <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                                                                    {getPermissionChips(member)}
                                                                </Stack>
                                                            </Paper>
                                                        </Grid>
                                                    );
                                                })}
                                            </Grid>
                                        )}
                                    </Box>
                                </Collapse>
                            </Card>
                        ))}
                    </Stack>
                )}
            </Box>
        </DashboardLayout>
    );
};

export default StudentTeamsPage;
