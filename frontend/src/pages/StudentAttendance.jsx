import { useState, useEffect } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import {
    Box, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Alert, Snackbar, Skeleton
} from '@mui/material';
import { CheckCircle, CalendarMonth, LocationOn } from '@mui/icons-material';

const StudentAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const loadAttendance = async () => {
        try {
            const res = await api.get('/api/attendance/my');
            setAttendance(res.data.data || []);
        } catch (err) {
            console.error('Failed to load attendance', err);
            if (err.name !== 'CanceledError') {
                setSnackbar({ open: true, message: 'Failed to load attendance history', severity: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAttendance(); }, []);
    useAutoRefresh(loadAttendance);

    return (
        <DashboardLayout>
            <Box className="animate-fade-in-up" sx={{
                mb: 4, p: 4, borderRadius: 2,
                background: '#101010',
                color: '#FFF', position: 'relative', overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(211, 47, 47, 0.15)', filter: 'blur(40px)' }} />
                <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-1px', position: 'relative', zIndex: 1, color: '#FFFFFF' }}>
                    Attendance Analytics
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                    <CheckCircle sx={{ fontSize: 20, color: '#D32F2F' }} /> {attendance.filter(a => a.status === 'PRESENT').length} Successful Check-ins
                </Typography>
            </Box>

            {loading ? (
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1.5 }} />
            ) : attendance.length === 0 ? (
                <Card sx={{ borderRadius: 1.5, bgcolor: '#fff', border: '1px dashed #e2e8f0', boxShadow: 'none' }}>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <CheckCircle sx={{ fontSize: 64, color: '#e2e8f0', mb: 2 }} />
                        <Typography variant="h5" sx={{ color: '#1e293b', mb: 1, fontWeight: 900 }}>No attendance logs found</Typography>
                        <Typography variant="body1" sx={{ color: '#64748b' }}>
                            Your attendance will be recorded here automatically once you check in at events.
                        </Typography>
                    </CardContent>
                </Card>
            ) : (
                <Card sx={{ borderRadius: 1.5, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' }} className="animate-fade-in-up">
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Event Analytics</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Schedule</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Verification</TableCell>
                                    <TableCell sx={{ fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>Timestamp</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {attendance.map((record) => (
                                    <TableRow key={record.eventId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                        <TableCell>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{record.eventTitle}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CalendarMonth sx={{ fontSize: 16, color: '#94a3b8' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {record.checkedInAt ? new Date(record.checkedInAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={record.status}
                                                size="small"
                                                sx={{
                                                    fontWeight: 900,
                                                    fontSize: '0.7rem',
                                                    height: 24,
                                                    bgcolor: record.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' : 'rgba(211,47,47,0.1)',
                                                    color: record.status === 'PRESENT' ? '#10B981' : '#D32F2F',
                                                    border: 'none'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ color: '#64748b', fontFamily: 'monospace', fontWeight: 600 }}>
                                            {record.checkedInAt ? new Date(record.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Card>
            )}

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 1, fontWeight: 800 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default StudentAttendance;
