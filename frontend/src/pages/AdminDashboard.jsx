import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Grid, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Stack, Skeleton
} from '@mui/material';
import {
    People, Event, Assessment, HowToReg, TrendingUp, School, Add,
    Notifications, History
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            const [dashRes, usersRes] = await Promise.all([
                api.get('/api/admin/dashboard'),
                api.get('/api/admin/users'),
            ]);
            setStats(dashRes.data.data);
            setUsers(usersRes.data.data || []);

            // Try fetching audit logs if the endpoint exists
            try {
                const auditRes = await api.get('/api/audit?limit=5');
                setAuditLogs(auditRes.data.data.content || []);
            } catch {
                // Audit endpoint may not exist yet
            }
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const statCards = stats ? [
        { label: 'Students', value: stats.totalStudents, color: '#6366f1', icon: <School sx={{ fontSize: 28 }} /> },
        { label: 'Organizers', value: stats.totalOrganizers, color: '#ec4899', icon: <People sx={{ fontSize: 28 }} /> },
        { label: 'Events', value: stats.totalEvents, color: '#3b82f6', icon: <Event sx={{ fontSize: 28 }} /> },
        { label: 'Registrations', value: stats.totalRegistrations, color: '#10b981', icon: <HowToReg sx={{ fontSize: 28 }} /> },
    ] : [];

    const roleColors = { ADMIN: '#ef4444', ORGANIZER: '#f59e0b', STUDENT: '#10b981' };
    const pieData = stats ? [
        { name: 'Students', value: Number(stats.totalStudents), color: roleColors.STUDENT },
        { name: 'Organizers', value: Number(stats.totalOrganizers), color: roleColors.ORGANIZER },
    ].filter(d => d.value > 0) : [];

    return (
        <DashboardLayout>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.25, color: '#212121' }}>Admin Dashboard</Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>System overview and management.</Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/admin/create-organizer')}
                        sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}>
                        Create Organizer
                    </Button>
                    <Button variant="outlined" startIcon={<Notifications />} onClick={() => navigate('/admin/notices')}
                        sx={{ borderColor: '#e0e0e0', color: '#212121', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { borderColor: '#212121' } }}>
                        Notices
                    </Button>
                </Stack>
            </Box>

            {/* Stats */}
            <Grid container spacing={2.5} sx={{ mb: 4 }}>
                {statCards.map((s, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', borderTop: `3px solid ${s.color}` }}>
                            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                                <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                <Typography variant="caption" sx={{ color: '#757575', fontWeight: 600 }}>{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                {/* Left: Users Table + Audit Logs */}
                <Grid item xs={12} md={8}>
                    {/* Recent Users */}
                    <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', mb: 3 }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Users</Typography>
                                <Button size="small" onClick={() => navigate('/admin/users')} sx={{ fontWeight: 700 }}>View All</Button>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem' }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem' }}>Role</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#757575', fontSize: '0.75rem' }}>Department</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.slice(0, 5).map(u => (
                                            <TableRow key={u.id} hover>
                                                <TableCell>
                                                    <Box>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.fullName}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip label={u.role} size="small" sx={{
                                                        bgcolor: `${roleColors[u.role]}18`, color: roleColors[u.role],
                                                        fontWeight: 700, fontSize: '0.7rem', height: 22
                                                    }} />
                                                </TableCell>
                                                <TableCell sx={{ color: '#757575', fontSize: '0.8rem' }}>{u.department || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Audit Logs */}
                    {auditLogs.length > 0 && (
                        <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8' }}>
                            <CardContent sx={{ p: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <History sx={{ fontSize: 18, color: '#757575' }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Activity</Typography>
                                    </Box>
                                </Box>
                                <Stack spacing={1}>
                                    {auditLogs.map((log, i) => (
                                        <Box key={i} sx={{ p: 1.5, bgcolor: '#fafafa', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{log.action}</Typography>
                                                <Typography variant="caption" sx={{ color: '#9e9e9e' }}>{log.performedBy} · {log.entityType}</Typography>
                                            </Box>
                                            <Typography variant="caption" sx={{ color: '#bdbdbd' }}>
                                                {new Date(log.timestamp).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </CardContent>
                        </Card>
                    )}
                </Grid>

                {/* Right: User Distribution */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ borderRadius: 1.5, border: '1px solid #e8e8e8', height: '100%' }}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5 }}>User Distribution</Typography>
                            {pieData.length > 0 ? (
                                <Box>
                                    <Box sx={{ position: 'relative', height: 200, mb: 2 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={pieData} cx="50%" cy="50%" innerRadius="65%" outerRadius="85%" paddingAngle={5} dataKey="value" cornerRadius={4}>
                                                    {pieData.map((entry, i) => (
                                                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip cursor={false} content={() => null} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#212121' }}>
                                                {pieData.reduce((a, b) => a + b.value, 0)}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#9e9e9e', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Total</Typography>
                                        </Box>
                                    </Box>
                                    <Stack spacing={1.5}>
                                        {pieData.map((entry, i) => (
                                            <Box key={i} sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                p: 1.5, borderRadius: 1, bgcolor: '#fafafa', border: '1px solid #f0f0f0',
                                                transition: 'background-color 0.15s', '&:hover': { bgcolor: '#f5f5f5' },
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: entry.color }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                                                </Box>
                                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: entry.color }}>
                                                    {entry.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                </Box>
                            ) : (
                                <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdbd' }}>
                                    No data available
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </DashboardLayout>
    );
};

export default AdminDashboard;
