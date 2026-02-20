import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Grid, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material';
import {
    People, Event, Assessment, HowToReg, TrendingUp, School
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);

    const loadData = () => {
        api.get('/api/admin/dashboard').then(r => setStats(r.data.data)).catch(() => { });
        api.get('/api/admin/users').then(r => setUsers(r.data.data || [])).catch(() => { });
    };

    useEffect(() => { loadData(); }, []);

    const statCards = stats ? [
        { label: 'Total Students', value: stats.totalStudents, color: '#6366f1', icon: <School sx={{ fontSize: 36 }} /> },
        { label: 'Total Organizers', value: stats.totalOrganizers, color: '#ec4899', icon: <People sx={{ fontSize: 36 }} /> },
        { label: 'Total Events', value: stats.totalEvents, color: '#3b82f6', icon: <Event sx={{ fontSize: 36 }} /> },
        { label: 'Total Registrations', value: stats.totalRegistrations, color: '#10b981', icon: <HowToReg sx={{ fontSize: 36 }} /> },
        { label: 'Total Attendance', value: stats.totalAttendance, color: '#f59e0b', icon: <Assessment sx={{ fontSize: 36 }} /> },
        { label: 'Upcoming Events', value: stats.upcomingEvents, color: '#8b5cf6', icon: <TrendingUp sx={{ fontSize: 36 }} /> },
    ] : [];

    const roleColors = { ADMIN: '#ef4444', ORGANIZER: '#f59e0b', STUDENT: '#10b981' };
    const pieData = stats ? [
        { name: 'Students', value: Number(stats.totalStudents), color: roleColors.STUDENT },
        { name: 'Organizers', value: Number(stats.totalOrganizers), color: roleColors.ORGANIZER },
    ].filter(d => d.value > 0) : [];

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Admin Dashboard</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>System overview and management.</Typography>
                </Box>
                <Button variant="contained" onClick={() => navigate('/admin/create-organizer')}>Create Organizer</Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((s, i) => (
                    <Grid item xs={6} sm={4} md={2} key={i}>
                        <Card sx={{ background: `linear-gradient(135deg, ${s.color}15, ${s.color}08)`, borderTop: `3px solid ${s.color}`, height: '100%' }}>
                            <CardContent sx={{ textAlign: 'center', p: 2.5 }}>
                                <Box sx={{ color: s.color, opacity: 0.5, mb: 1 }}>{s.icon}</Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: s.color }}>{s.value}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s.label}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>Recent Users</Typography>
                                <Button size="small" onClick={() => navigate('/admin/users')}>View All</Button>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Name</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Department</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {users.slice(0, 5).map(u => (
                                            <TableRow key={u.id} hover>
                                                <TableCell sx={{ fontWeight: 500 }}>
                                                    <Box>
                                                        {u.fullName}
                                                        <Typography variant="caption" display="block" color="text.secondary">{u.email}</Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell><Chip label={u.role} size="small" sx={{ bgcolor: `${roleColors[u.role]}22`, color: roleColors[u.role], fontWeight: 600, fontSize: '0.75rem', height: 24 }} /></TableCell>
                                                <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{u.department || '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>User Distribution</Typography>
                            {pieData.length > 0 ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
                                    <Box sx={{ position: 'relative', height: 260, width: '100%', maxWidth: 260, flexShrink: 0 }}>
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="70%"
                                                    outerRadius="90%"
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    cornerRadius={4}
                                                >
                                                    {pieData.map((entry, i) => (
                                                        <Cell key={`cell-${i}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip cursor={false} content={<></>} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <Box sx={{
                                            position: 'absolute', top: '50%', left: '50%',
                                            transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none'
                                        }}>
                                            <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary' }}>
                                                {pieData.reduce((a, b) => a + b.value, 0)}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>Total</Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{ width: '100%' }}>
                                        {pieData.map((entry, i) => (
                                            <Box key={i} sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                mb: 1.5, p: 1.5, borderRadius: 1, bgcolor: 'background.default',
                                                border: '1px solid', borderColor: 'divider',
                                                transition: 'all 0.2s', '&:hover': { bgcolor: 'action.hover', transform: 'translateY(-2px)', boxShadow: 2 }
                                            }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: entry.color, boxShadow: `0 0 8px ${entry.color}66` }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{entry.name}</Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: entry.color, lineHeight: 1 }}>
                                                    {entry.value}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.disabled' }}>
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
