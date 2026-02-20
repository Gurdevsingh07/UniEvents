import StatCard from '../components/StatCard';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Grid, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, Stack, CircularProgress
} from '@mui/material';
import { PictureAsPdf, TableChart, Assessment, People, CheckCircle, Event, ArrowForward } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const ReportsPage = () => {
    // ... existing hooks ...
    const { eventId: paramEventId } = useParams();
    const navigate = useNavigate();
    const [eventId, setEventId] = useState(paramEventId || '');
    const [events, setEvents] = useState([]);
    const [stats, setStats] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/api/events/my').then(r => setEvents(r.data.data || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (eventId) {
            api.get(`/api/events/${eventId}/stats`).then(r => setStats(r.data.data)).catch(() => { });
            api.get(`/api/events/${eventId}/registrations`).then(r => setRegistrations(r.data.data || [])).catch(() => { });
            api.get(`/api/attendance/event/${eventId}`).then(r => setAttendance(r.data.data || [])).catch(() => { });
        }
    }, [eventId]);

    const downloadReport = async (format) => {
        setLoading(true);
        try {
            const url = format === 'pdf' ? `/api/reports/events/${eventId}/pdf` :
                format === 'csv' ? `/api/reports/events/${eventId}/csv` :
                    `/api/reports/events/${eventId}/excel`;
            const res = await api.get(url, { responseType: 'blob' });
            const ext = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xlsx';
            const blob = new Blob([res.data]);
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `attendance_report_${eventId}.${ext}`;
            link.click();
        } catch { }
        finally { setLoading(false); }
    };

    if (!eventId) {
        return (
            <DashboardLayout>
                <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#212121', textAlign: 'center' }}>
                        Select Event Report
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#757575', mb: 5, textAlign: 'center' }}>
                        Choose an event to view detailed attendance analytics and export data.
                    </Typography>

                    <Grid container spacing={3}>
                        {events.map((ev, i) => (
                            <Grid item xs={12} sm={6} key={ev.id} className={`animate-fade-in-up stagger-${i + 1}`}>
                                <Card className="hover-lift"
                                    sx={{
                                        cursor: 'pointer', borderRadius: 1.5,
                                        border: '1px solid rgba(0,0,0,0.08)', boxShadow: 'none'
                                    }}
                                    onClick={() => setEventId(String(ev.id))}>
                                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                                        <Box sx={{
                                            width: 60, height: 60, borderRadius: '50%', mx: 'auto', mb: 2,
                                            bgcolor: 'rgba(33, 150, 243, 0.1)', color: '#2196F3',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            <Assessment fontSize="large" />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#212121' }}>{ev.title}</Typography>
                                        <Typography variant="body2" sx={{ color: '#9E9E9E', mb: 3 }}>
                                            {new Date(ev.eventDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </Typography>
                                        <Chip
                                            label={`${ev.registeredCount} Registered`}
                                            size="small"
                                            sx={{ bgcolor: '#F5F5F5', color: '#616161', fontWeight: 600 }}
                                        />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </DashboardLayout>
        );
    }

    const chartData = stats ? [
        { name: 'Present', value: stats.totalPresent, color: '#10b981' },
        { name: 'Absent', value: stats.totalAbsent, color: '#ef4444' },
    ] : [];

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Attendance Report</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>{stats?.eventTitle}</Typography>
                </Box>
                <Stack direction="row" spacing={1.5}>
                    <Button variant="contained" startIcon={<PictureAsPdf />} onClick={() => downloadReport('pdf')} disabled={loading} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>PDF</Button>
                    <Button variant="contained" startIcon={<TableChart />} onClick={() => downloadReport('csv')} disabled={loading} sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>CSV</Button>
                    <Button variant="contained" startIcon={<Assessment />} onClick={() => downloadReport('excel')} disabled={loading} sx={{ bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>Excel</Button>
                </Stack>
            </Box>

            {stats && (
                <Grid container spacing={3} sx={{ mb: 5 }}>
                    {/* Stats Row */}
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {[
                                { label: 'Total Registered', value: stats.totalRegistered, color: '#6366f1', icon: <People sx={{ fontSize: 28 }} /> },
                                { label: 'Total Present', value: stats.totalPresent, color: '#10b981', icon: <CheckCircle sx={{ fontSize: 28 }} /> },
                                { label: 'Total Absent', value: stats.totalAbsent, color: '#ef4444', icon: <Event sx={{ fontSize: 28 }} /> }, // Using Event icon as placeholder for Absent or maybe something else
                                { label: 'Attendance Rate', value: `${stats.attendancePercentage}%`, color: '#f59e0b', icon: <Assessment sx={{ fontSize: 28 }} /> },
                            ].map((s, i) => (
                                <Grid item xs={12} sm={6} md={3} key={i}>
                                    <StatCard label={s.label} value={s.value} color={s.color} icon={s.icon} delay={i + 1} />
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>

                    {/* Chart Section */}
                    <Grid item xs={12}>
                        <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', overflow: 'visible' }}>
                            <CardContent sx={{ p: 4 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 4, color: '#212121' }}>Attendance Overview</Typography>
                                <Box sx={{ height: 350, width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#757575', fontSize: 14 }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#757575', fontSize: 12 }} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                                                contentStyle={{ borderRadius: 4, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                            />
                                            <Bar dataKey="value" radius={[2, 2, 0, 0]} barSize={60}>
                                                {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            <Card sx={{ borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <CardContent sx={{ p: 0 }}>
                    <Box sx={{ p: 3, borderBottom: '1px solid #F5F5F5' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#212121' }}>Detailed Attendance List</Typography>
                    </Box>
                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>#</TableCell>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>Name</TableCell>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>Student ID</TableCell>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>Department</TableCell>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>Status</TableCell>
                                    <TableCell sx={{ bgcolor: '#FAFAFA', fontWeight: 700, color: '#616161' }}>Check-in Time</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendance.map((att, i) => {
                                    const isPresent = att.status === 'PRESENT';
                                    const isAbsent = att.status === 'ABSENT';
                                    return (
                                        <TableRow key={att.userId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell sx={{ color: '#9E9E9E' }}>{i + 1}</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#212121' }}>
                                                {att.userName}
                                            </TableCell>
                                            <TableCell sx={{ color: '#616161' }}>{att.studentId || '—'}</TableCell>
                                            <TableCell sx={{ color: '#616161' }}>{att.department || '—'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={att.status}
                                                    size="small"
                                                    sx={{
                                                        fontWeight: 600,
                                                        bgcolor: isPresent ? 'rgba(76, 175, 80, 0.1)' :
                                                            isAbsent ? 'rgba(239, 83, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                                                        color: isPresent ? '#2E7D32' :
                                                            isAbsent ? '#D32F2F' : '#2196F3'
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: '#616161', fontFamily: 'monospace' }}>
                                                {isPresent ? new Date(att.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {registrations.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body1" sx={{ color: '#9E9E9E', mb: 1 }}>No registrations found</Typography>
                            <Typography variant="caption" sx={{ color: '#BDBDBD' }}>Waiting for students to register...</Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </DashboardLayout>
    );
};

export default ReportsPage;
