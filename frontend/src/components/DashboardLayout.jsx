import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AppBar, Toolbar, Typography, Button, IconButton, Avatar, Menu, MenuItem,
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Divider, useMediaQuery, useTheme, Tooltip
} from '@mui/material';
import {
    Menu as MenuIcon, Dashboard, Event, FaceRetouchingNatural, Assessment,
    People, Logout, Home, CalendarMonth, HowToReg, AccountCircle,
    School, Notifications, Assignment
} from '@mui/icons-material';

const DRAWER_WIDTH = 260;

const DashboardLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleLogout = () => { logout(); navigate('/login'); };

    const getProfilePath = () => {
        if (user?.role === 'ADMIN') return '/admin/profile';
        if (user?.role === 'ORGANIZER') return '/organizer/profile';
        return '/student/profile';
    };

    const getMenuGroups = () => {
        const groups = [];
        if (user?.role === 'ADMIN') {
            groups.push(
                {
                    section: null, items: [
                        { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
                        { text: 'Notices', icon: <Notifications />, path: '/admin/notices' },
                    ]
                },
                {
                    section: 'Events', items: [
                        { text: 'Manage Events', icon: <Event />, path: '/admin/events' },
                        { text: 'Event History', icon: <Assessment />, path: '/admin/history' },
                        { text: 'Create Event', icon: <CalendarMonth />, path: '/admin/create-event' },
                    ]
                },
                {
                    section: 'Operations', items: [
                        { text: 'Scanner', icon: <FaceRetouchingNatural />, path: '/organizer/scan' },
                    ]
                },
                {
                    section: 'Governance', items: [
                        { text: 'Manage Users', icon: <People />, path: '/admin/users' },
                        { text: 'Create Organizer', icon: <HowToReg />, path: '/admin/create-organizer' },
                    ]
                },
                {
                    section: 'Personal', items: [
                        { text: 'My Profile', icon: <AccountCircle />, path: '/admin/profile' },
                    ]
                },
            );
        } else if (user?.role === 'ORGANIZER') {
            groups.push(
                {
                    section: null, items: [
                        { text: 'Dashboard', icon: <Dashboard />, path: '/organizer' },
                        { text: 'Notices', icon: <Notifications />, path: '/organizer/notices' },
                    ]
                },
                {
                    section: 'Events', items: [
                        { text: 'My Events', icon: <Event />, path: '/organizer/events' },
                        { text: 'Event History', icon: <Assessment />, path: '/organizer/history' },
                        { text: 'Create Event', icon: <CalendarMonth />, path: '/organizer/create-event' },
                    ]
                },
                {
                    section: 'Operations', items: [
                        { text: 'Scanner', icon: <FaceRetouchingNatural />, path: '/organizer/scan' },
                    ]
                },
                {
                    section: 'Governance', items: [
                        { text: 'Team Management', icon: <People />, path: '/organizer/team' },
                        { text: 'My Teams', icon: <People />, path: '/organizer/my-teams' },
                    ]
                },
                {
                    section: 'Personal', items: [
                        { text: 'My Profile', icon: <AccountCircle />, path: '/organizer/profile' },
                    ]
                },
            );
        } else {
            groups.push(
                {
                    section: null, items: [
                        { text: 'Dashboard', icon: <Dashboard />, path: '/student' },
                        { text: 'Notices', icon: <Notifications />, path: '/student/notices' },
                    ]
                },
                {
                    section: 'Events', items: [
                        { text: 'Browse Events', icon: <Event />, path: '/student/events' },
                        { text: 'My Registrations', icon: <CalendarMonth />, path: '/student/registrations' },
                    ]
                },
                {
                    section: 'Records', items: [
                        { text: 'Attendance History', icon: <Assessment />, path: '/student/attendance' },
                        { text: 'My Teams', icon: <People />, path: '/student/teams' },
                    ]
                },
                {
                    section: 'Personal', items: [
                        { text: 'My Profile', icon: <AccountCircle />, path: '/student/profile' },
                    ]
                },
            );
        }

        const volunteerItems = [];

        if (user?.permissions?.includes('ACCESS_VOLUNTEER_PANEL')) {
            volunteerItems.push({ text: 'Volunteer Tasks', icon: <Assignment />, path: '/volunteer' });
        }

        // For Students, all volunteer actions (Scanner, Reports) are now inside the Volunteer Tasks page as tabs.
        // Only add Manage Teams if the student has canManageTeam (it's a separate management page)
        if (user?.role === 'STUDENT' && user?.permissions?.includes('canManageTeam')) {
            volunteerItems.push({ text: 'Manage Teams', icon: <People />, path: '/organizer/my-teams' });
        }

        if (volunteerItems.length > 0) {
            groups.push({
                section: user?.role === 'ADMIN' ? 'Task Management' : 'Volunteer Portal',
                items: volunteerItems
            });
        }

        return groups;
    };

    const portalLabels = { ADMIN: 'ADMIN PORTAL', ORGANIZER: 'ORGANIZER PORTAL', STUDENT: 'STUDENT PORTAL' };

    const renderNavItem = (item) => {
        const isActive = location.pathname === item.path;
        return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                    component={Link} to={item.path}
                    selected={isActive}
                    onClick={() => isMobile && setMobileOpen(false)}
                    sx={{
                        borderRadius: '0 4px 4px 0', py: 1.2,
                        mr: 2,
                        transition: 'all 0.15s ease',
                        position: 'relative',
                        '&.Mui-selected': {
                            bgcolor: 'rgba(211, 47, 47, 0.08)',
                            '& .MuiListItemIcon-root': { color: '#D32F2F' },
                            '& .MuiListItemText-primary': { fontWeight: 900, color: '#FFFFFF' },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: '15%',
                                height: '70%',
                                width: 4,
                                bgcolor: '#D32F2F',
                                borderRadius: '0 4px 4px 0',
                            }
                        },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                >
                    <ListItemIcon sx={{ minWidth: 36, color: isActive ? '#D32F2F' : '#94a3b8', transition: 'color 0.15s' }}>
                        {isActive ? item.icon : <Box sx={{ opacity: 0.6 }}>{item.icon}</Box>}
                    </ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: isActive ? 900 : 600, color: isActive ? '#FFFFFF' : '#94a3b8', letterSpacing: '0.2px' }} />
                </ListItemButton>
            </ListItem>
        );
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#101010' }}>
            {/* Logo */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 0.8, borderRadius: 1, bgcolor: '#D32F2F', display: 'flex' }}>
                        <School sx={{ fontSize: 20, color: '#FFF' }} />
                    </Box>
                    <Typography variant="h6" component={Link} to="/" sx={{
                        fontWeight: 900, color: '#FFFFFF', textDecoration: 'none', letterSpacing: '-0.5px'
                    }}>
                        UniEvents
                    </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#6c757d', fontWeight: 600, display: 'block', mt: 0.5, letterSpacing: '0.5px' }}>
                    {portalLabels[user?.role] || 'PORTAL'}
                </Typography>
            </Box>

            {/* Navigation */}
            <Box sx={{ flex: 1, px: 2, py: 2, overflowY: 'auto' }}>
                {getMenuGroups().map((group, gi) => (
                    <Box key={gi}>
                        {group.section && (
                            <Typography variant="caption" sx={{
                                display: 'block', color: '#6c757d', fontWeight: 700,
                                textTransform: 'uppercase', letterSpacing: '1.5px',
                                fontSize: '0.65rem', px: 1.5, pt: gi === 0 ? 0 : 2, pb: 1,
                            }}>
                                {group.section}
                            </Typography>
                        )}
                        {gi > 0 && !group.section && (
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', my: 1.5 }} />
                        )}
                        <List disablePadding>
                            {group.items.map(renderNavItem)}
                        </List>
                    </Box>
                ))}
            </Box>

            {/* User Panel */}
            <Divider sx={{ borderColor: '#333333' }} />
            <Box sx={{ p: 2 }}>
                <Box
                    onClick={() => { navigate(getProfilePath()); isMobile && setMobileOpen(false); }}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 1,
                        bgcolor: 'rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                    }}
                >
                    <Avatar
                        src={user?.profilePicture ? `/${user.profilePicture}?t=${new Date().getTime()}` : undefined}
                        sx={{ width: 36, height: 36, bgcolor: '#D32F2F', fontSize: '0.85rem', fontWeight: 900 }}
                    >
                        {user?.fullName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#FFFFFF' }}>
                            {user?.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9E9E9E' }}>{user?.role?.charAt(0) + user?.role?.slice(1).toLowerCase()}</Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAFAFA' }}>
            {isMobile ? (
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
                    sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#212121', borderRight: '1px solid #333333' } }}>{drawer}</Drawer>
            ) : (
                <Drawer variant="permanent" sx={{ width: DRAWER_WIDTH, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, bgcolor: '#212121', borderRight: '1px solid #333333' } }}>{drawer}</Drawer>
            )}

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
                <AppBar position="sticky" sx={{
                    zIndex: theme.zIndex.drawer - 1,
                    bgcolor: '#FFFFFF',
                    borderBottom: '1px solid #E0E0E0',
                    boxShadow: 'none',
                    color: '#212121'
                }}>
                    <Toolbar>
                        {isMobile && (
                            <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 2, color: '#1a1d23' }}><MenuIcon /></IconButton>
                        )}
                        {!isMobile && (
                            <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.3px' }}>
                                <Box component="span" sx={{ color: '#D32F2F', fontWeight: 900 }}>UNI</Box>EVENTS <Box component="span" sx={{ color: '#cbd5e1', mx: 1 }}>|</Box> Dashboard
                            </Typography>
                        )}
                        <Box sx={{ flex: 1 }} />
                        <Tooltip title="Account">
                            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ p: 0.5, border: '2px solid #f1f5f9' }}>
                                <Avatar
                                    src={user?.profilePicture ? `/${user.profilePicture}?t=${new Date().getTime()}` : undefined}
                                    sx={{ width: 32, height: 32, bgcolor: '#101010', fontSize: '0.8rem', fontWeight: 900, color: '#FFFFFF' }}
                                >
                                    {user?.fullName?.charAt(0)}
                                </Avatar>
                            </IconButton>
                        </Tooltip>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{ sx: { mt: 1.5, minWidth: 220, borderRadius: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #E0E0E0' } }}
                        >
                            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E0E0E0' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#212121' }}>{user?.fullName}</Typography>
                                <Typography variant="caption" sx={{ color: '#757575' }}>{user?.email}</Typography>
                            </Box>
                            <MenuItem component={Link} to={getProfilePath()} onClick={() => setAnchorEl(null)}>
                                <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} /> My Profile
                            </MenuItem>
                            <MenuItem component={Link} to="/" onClick={() => setAnchorEl(null)}>
                                <Home sx={{ mr: 1.5, fontSize: 20, color: '#757575' }} /> Home
                            </MenuItem>
                            <Divider sx={{ borderColor: '#E0E0E0', my: 0.5 }} />
                            <MenuItem onClick={() => { setAnchorEl(null); handleLogout(); }} sx={{ color: '#C62828' }}>
                                <Logout sx={{ mr: 1.5, fontSize: 20 }} /> Logout
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
                <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, overflow: 'auto' }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
};

export default DashboardLayout;
