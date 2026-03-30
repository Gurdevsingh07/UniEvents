import { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, Chip, CircularProgress,
    Stack, IconButton, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Notifications, CheckCircle, Info, Warning, Error as ErrorIcon, Add, SortByAlpha, Schedule } from '@mui/icons-material';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const NoticeBoardPage = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [filterType, setFilterType] = useState('ALL');
    const [sortBy, setSortBy] = useState('date');

    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('GENERAL');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notices');
            setNotices(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch notices', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/notices', {
                title: newTitle,
                content: newContent,
                noticeType: newType,
                targets: [{ targetType: 'UNIVERSITY' }]
            });
            setCreateOpen(false);
            setNewTitle('');
            setNewContent('');
            fetchNotices();
        } catch (err) {
            console.error('Failed to create notice', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.post(`/api/notices/${id}/read`);
            setNotices(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'URGENT': return '#C62828';
            case 'EVENT': return '#1565C0';
            case 'CLUB': return '#E65100';
            default: return '#2E7D32';
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'URGENT': return <ErrorIcon sx={{ color: '#C62828' }} />;
            case 'EVENT': return <Info sx={{ color: '#1565C0' }} />;
            case 'CLUB': return <Warning sx={{ color: '#E65100' }} />;
            default: return <Notifications sx={{ color: '#2E7D32' }} />;
        }
    };

    const canCreate = user?.role === 'ADMIN';

    const filterTypes = ['ALL', 'GENERAL', 'URGENT', 'EVENT', 'CLUB'];

    const filteredNotices = useMemo(() => {
        let result = [...notices];

        // Filter
        if (filterType !== 'ALL') {
            result = result.filter(n => n.noticeType === filterType);
        }

        // Sort
        if (sortBy === 'priority') {
            const priorityOrder = { URGENT: 0, EVENT: 1, CLUB: 2, GENERAL: 3 };
            result.sort((a, b) => (priorityOrder[a.noticeType] || 3) - (priorityOrder[b.noticeType] || 3));
        } else {
            result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        return result;
    }, [notices, filterType, sortBy]);

    const getExpiryBadge = (notice) => {
        if (!notice.expiresAt) return null;
        const now = new Date();
        const exp = new Date(notice.expiresAt);
        const daysLeft = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) return { label: 'Expired', color: '#9e9e9e' };
        if (daysLeft <= 3) return { label: `Expires in ${daysLeft}d`, color: '#E65100' };
        return null;
    };

    const unreadCount = notices.filter(n => !n.isRead).length;

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: '#212121', mb: 0.25 }}>
                        Notice Board
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                        Official announcements and important updates.
                        {unreadCount > 0 && <Box component="span" sx={{ ml: 1, fontWeight: 700, color: '#D32F2F' }}>{unreadCount} unread</Box>}
                    </Typography>
                </Box>
                {canCreate && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setCreateOpen(true)}
                        sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}
                    >
                        New Notice
                    </Button>
                )}
            </Box>

            {/* Filter + Sort Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1.5 }}>
                <Stack direction="row" spacing={0.75}>
                    {filterTypes.map(type => (
                        <Chip
                            key={type}
                            label={type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                            size="small"
                            onClick={() => setFilterType(type)}
                            sx={{
                                fontWeight: 700, fontSize: '0.75rem',
                                bgcolor: filterType === type ? '#212121' : '#f5f5f5',
                                color: filterType === type ? '#fff' : '#757575',
                                '&:hover': { bgcolor: filterType === type ? '#212121' : '#e0e0e0' },
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </Stack>
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 600 }}>Sort:</Typography>
                    <Chip label="Newest" size="small" onClick={() => setSortBy('date')}
                        sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: sortBy === 'date' ? '#212121' : '#f5f5f5', color: sortBy === 'date' ? '#fff' : '#757575', cursor: 'pointer' }} />
                    <Chip label="Priority" size="small" onClick={() => setSortBy('priority')}
                        sx={{ fontWeight: 700, fontSize: '0.7rem', bgcolor: sortBy === 'priority' ? '#212121' : '#f5f5f5', color: sortBy === 'priority' ? '#fff' : '#757575', cursor: 'pointer' }} />
                </Stack>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: '#D32F2F' }} />
                </Box>
            ) : filteredNotices.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #e0e0e0' }}>
                    <Notifications sx={{ fontSize: 40, color: '#bdbdbd', mb: 1.5 }} />
                    <Typography variant="body1" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                        {filterType !== 'ALL' ? `No ${filterType.toLowerCase()} notices.` : 'There are no notices to display right now.'}
                    </Typography>
                </Box>
            ) : (
                <Stack spacing={1.5}>
                    {filteredNotices.map(notice => {
                        const expiry = getExpiryBadge(notice);
                        return (
                            <Card key={notice.id} sx={{
                                borderRadius: 1.5,
                                border: '1px solid',
                                borderColor: notice.isRead ? '#f0f0f0' : `${getTypeColor(notice.noticeType)}25`,
                                borderLeft: notice.isRead ? '1px solid #f0f0f0' : `4px solid ${getTypeColor(notice.noticeType)}`,
                                bgcolor: notice.isRead ? '#fafafa' : '#fff',
                                transition: 'border-color 0.15s',
                            }}>
                                <CardContent sx={{ p: '16px 20px !important', display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <Box sx={{ mt: 0.5, opacity: notice.isRead ? 0.4 : 1 }}>
                                        {getTypeIcon(notice.noticeType)}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                                            <Typography variant="subtitle1" sx={{
                                                fontWeight: notice.isRead ? 600 : 700,
                                                color: notice.isRead ? '#757575' : '#212121',
                                                lineHeight: 1.2,
                                            }}>
                                                {notice.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#bdbdbd', whiteSpace: 'nowrap', ml: 2 }}>
                                                {new Date(notice.createdAt).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{
                                            color: notice.isRead ? '#9e9e9e' : '#424242',
                                            mb: 1.5, whiteSpace: 'pre-wrap',
                                        }}>
                                            {notice.content}
                                        </Typography>

                                        <Stack direction="row" spacing={1} alignItems="center">
                                            <Chip label={notice.noticeType} size="small" sx={{
                                                fontSize: '0.65rem', fontWeight: 700,
                                                bgcolor: `${getTypeColor(notice.noticeType)}10`,
                                                color: getTypeColor(notice.noticeType),
                                            }} />
                                            {expiry && (
                                                <Chip label={expiry.label} size="small" sx={{
                                                    fontSize: '0.65rem', fontWeight: 700,
                                                    bgcolor: `${expiry.color}12`, color: expiry.color,
                                                }} />
                                            )}
                                            <Typography variant="caption" sx={{ color: '#bdbdbd' }}>
                                                by {notice.createdBy?.fullName || 'Admin'}
                                            </Typography>
                                        </Stack>
                                    </Box>
                                    {!notice.isRead && (
                                        <IconButton
                                            onClick={(e) => handleMarkRead(notice.id, e)}
                                            title="Mark as read"
                                            size="small"
                                            sx={{ color: '#4CAF50', bgcolor: 'rgba(76, 175, 80, 0.08)', '&:hover': { bgcolor: 'rgba(76, 175, 80, 0.15)' } }}
                                        >
                                            <CheckCircle fontSize="small" />
                                        </IconButton>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </Stack>
            )}

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1.5 } }}>
                <DialogTitle sx={{ fontWeight: 700 }}>Create Notice</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField label="Title" fullWidth value={newTitle} onChange={(e) => setNewTitle(e.target.value)} variant="outlined" />
                        <TextField select label="Notice Type" fullWidth value={newType} onChange={(e) => setNewType(e.target.value)} variant="outlined">
                            <MenuItem value="GENERAL">General Announcement</MenuItem>
                            <MenuItem value="URGENT">Urgent Alert</MenuItem>
                            <MenuItem value="EVENT">Event Update</MenuItem>
                            <MenuItem value="CLUB">Club News</MenuItem>
                        </TextField>
                        <TextField label="Content" fullWidth multiline rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} variant="outlined" />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setCreateOpen(false)} sx={{ color: '#757575', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={submitting || !newTitle.trim() || !newContent.trim()}
                        sx={{ bgcolor: '#D32F2F', '&:hover': { bgcolor: '#B71C1C' }, fontWeight: 700, textTransform: 'none' }}
                    >
                        {submitting ? 'Publishing…' : 'Publish'}
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

export default NoticeBoardPage;
