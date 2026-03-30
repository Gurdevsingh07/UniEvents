import { useState, useEffect, useCallback } from 'react';
import {
    Badge, IconButton, Popover, Box, Typography, Divider,
    List, ListItem, ListItemText, Button, Chip, CircularProgress
} from '@mui/material';
import { NotificationsActive, NotificationsNone, Event, CheckCircle, Warning } from '@mui/icons-material';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const NotificationBell = ({ sx = {} }) => {
    const { user } = useAuth();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchUnreadCount = useCallback(async () => {
        try {
            if (!user) return;
            const res = await api.get('/api/notices/unread-count');
            setUnreadCount(res.data.data || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    }, [user]);

    const buildNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notices');
            const notices = res.data.data || [];

            const notes = notices.map(n => ({
                id: n.id,
                type: n.noticeType.toLowerCase() === 'urgent' ? 'error' : n.noticeType.toLowerCase() === 'general' ? 'info' : n.noticeType.toLowerCase() === 'club' ? 'warning' : 'success',
                title: n.title,
                message: n.content,
                time: new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                isRead: n.isRead
            }));

            if (notes.length === 0) {
                notes.push({
                    id: 'empty', type: 'info',
                    title: 'All Clear',
                    message: 'No active notices right now',
                    time: '',
                    isRead: true
                });
            }

            setNotifications(notes);
            setUnreadCount(notes.filter(n => !n.isRead && n.id !== 'empty').length);
        } catch (err) {
            console.error('Notification fetch error:', err);
            setNotifications([{ id: 'error', type: 'error', title: 'Error', message: 'Could not load notifications', time: '', isRead: true }]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch on open
    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        buildNotifications();
    };

    const handleClose = () => setAnchorEl(null);

    // Background count check on mount
    useEffect(() => {
        fetchUnreadCount();
    }, [fetchUnreadCount]);

    const handleNoticeClick = async (note) => {
        if (note.id === 'empty' || note.id === 'error' || note.isRead) return;

        try {
            await api.post(`/api/notices/${note.id}/read`);
            setNotifications(prev => prev.map(n => n.id === note.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const open = Boolean(anchorEl);

    const typeColors = {
        warning: '#E65100',
        error: '#C62828',
        success: '#2E7D32',
        info: '#1565C0',
    };
    const typeIcons = {
        warning: <Warning sx={{ fontSize: 16 }} />,
        error: <Warning sx={{ fontSize: 16 }} />,
        success: <CheckCircle sx={{ fontSize: 16 }} />,
        info: <Event sx={{ fontSize: 16 }} />,
    };

    return (
        <>
            <IconButton onClick={handleOpen} sx={{ color: 'rgba(255,255,255,0.85)', ...sx }}>
                <Badge
                    badgeContent={unreadCount || null}
                    sx={{
                        '& .MuiBadge-badge': {
                            bgcolor: '#C62828', color: '#fff',
                            fontSize: '0.65rem', fontWeight: 700,
                            minWidth: 16, height: 16,
                        }
                    }}
                >
                    {unreadCount > 0
                        ? <NotificationsActive sx={{ fontSize: 20 }} />
                        : <NotificationsNone sx={{ fontSize: 20 }} />}
                </Badge>
            </IconButton>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: {
                        mt: 1, width: 320, borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        border: '1px solid #E0E0E0',
                    }
                }}
            >
                {/* Header */}
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #F0F0F0' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NotificationsActive sx={{ fontSize: 18, color: '#C62828' }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#212121' }}>
                            Notifications
                        </Typography>
                    </Box>
                    {unreadCount > 0 && (
                        <Chip
                            label={`${unreadCount} unread`}
                            size="small"
                            sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                        />
                    )}
                </Box>

                {/* Body */}
                {loading ? (
                    <Box sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress size={24} sx={{ color: '#C62828' }} />
                    </Box>
                ) : (
                    <List disablePadding>
                        {notifications.map((n, i) => (
                            <Box key={n.id}>
                                <ListItem button onClick={() => handleNoticeClick(n)} alignItems="flex-start" sx={{
                                    py: 1.5, px: 2,
                                    bgcolor: n.id === 'empty' ? 'transparent' : n.isRead ? 'transparent' : `${typeColors[n.type]}1A`,
                                    '&:hover': { bgcolor: n.isRead ? '#FAFAFA' : `${typeColors[n.type]}2A` },
                                    opacity: n.isRead ? 0.7 : 1,
                                    cursor: n.id === 'empty' ? 'default' : 'pointer'
                                }}>
                                    <Box sx={{ mr: 1.5, mt: 0.3, color: typeColors[n.type] }}>
                                        {typeIcons[n.type]}
                                    </Box>
                                    <ListItemText
                                        primaryTypographyProps={{ component: 'div' }}
                                        secondaryTypographyProps={{ component: 'div' }}
                                        primary={
                                            <Typography variant="caption" sx={{ fontWeight: 800, color: typeColors[n.type], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                {n.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" sx={{ color: '#424242', fontWeight: 500, lineHeight: 1.4, fontSize: '0.8rem' }}>
                                                    {n.message}
                                                </Typography>
                                                {n.time && (
                                                    <Typography variant="caption" sx={{ color: '#9E9E9E', fontWeight: 600 }}>
                                                        {n.time}
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                                {i < notifications.length - 1 && <Divider sx={{ borderColor: '#F5F5F5' }} />}
                            </Box>
                        ))}
                    </List>
                )}

                {/* Footer */}
                <Box sx={{ px: 2, py: 1, borderTop: '1px solid #F0F0F0', textAlign: 'center' }}>
                    <Button size="small" onClick={() => { buildNotifications(); }} sx={{ color: '#757575', fontWeight: 700, fontSize: '0.75rem' }}>
                        Refresh
                    </Button>
                </Box>
            </Popover>
        </>
    );
};

export default NotificationBell;
