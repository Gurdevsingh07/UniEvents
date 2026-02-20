import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer,
    List, ListItem, ListItemButton, ListItemText, useMediaQuery, useTheme,
    Avatar, Divider, Chip, Menu, MenuItem, ListItemIcon, useScrollTrigger
} from '@mui/material';
import {
    Menu as MenuIcon, Close, Dashboard, Logout,
    Person, Event as EventIcon, Home
} from '@mui/icons-material';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const openMenu = Boolean(anchorEl);

    const trigger = useScrollTrigger({
        disableHysteresis: true,
        threshold: 10,
    });

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/');
    };

    const getDashboardLink = () => {
        if (!user) return '/login';
        if (user.role === 'ADMIN') return '/admin';
        if (user.role === 'ORGANIZER') return '/organizer';
        return '/student';
    };

    const links = [
        { text: 'Home', path: '/', icon: <Home fontSize="small" /> },
        { text: 'Events', path: '/events', icon: <EventIcon fontSize="small" /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <AppBar position="fixed" elevation={trigger ? 4 : 0}
            sx={{
                zIndex: 1300,
                bgcolor: trigger ? 'rgba(33, 33, 33, 0.85)' : '#212121', // Dark base, glass when scrolled
                backdropFilter: trigger ? 'blur(20px)' : 'none',
                borderBottom: '1px solid',
                borderColor: trigger ? 'rgba(255,255,255,0.08)' : 'transparent',
                transition: 'all 0.3s ease-in-out',
                backgroundImage: 'none'
            }}>
            <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 4 }, minHeight: { xs: 64, md: 72 } }}>
                {/* Logo Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 200 }}>
                    <Typography variant="h6" component={Link} to="/" sx={{
                        fontWeight: 800, color: '#FFFFFF', textDecoration: 'none',
                        letterSpacing: '-0.5px'
                    }}>
                        UniEvents
                    </Typography>
                </Box>

                {/* Centered Navigation */}
                {!isMobile && (
                    <Box sx={{ display: 'flex', gap: 1, flex: 1, justifyContent: 'center' }}>
                        {links.map(l => (
                            <Button key={l.text} component={Link} to={l.path}
                                startIcon={l.icon}
                                sx={{
                                    color: isActive(l.path) ? '#FFFFFF' : '#B0BEC5',
                                    px: 2.5, py: 1,
                                    borderRadius: 1,
                                    fontWeight: 600,
                                    fontSize: '0.9rem',
                                    position: 'relative',
                                    '&:hover': {
                                        color: '#FFFFFF',
                                        bgcolor: 'rgba(255,255,255,0.08)'
                                    },
                                    '&::after': isActive(l.path) ? {
                                        content: '""',
                                        position: 'absolute',
                                        bottom: 8,
                                        left: '20%',
                                        width: '60%',
                                        height: 3,
                                        bgcolor: '#FF5252',
                                        borderRadius: 0
                                    } : {}
                                }}>
                                {l.text}
                            </Button>
                        ))}
                    </Box>
                )}
                {isMobile && <Box sx={{ flex: 1 }} />}

                {/* Right Profile / Auth Section */}
                {!isMobile && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', minWidth: 200, alignItems: 'center' }}>
                        {user ? (
                            <>
                                <Button
                                    onClick={handleMenuClick}
                                    sx={{
                                        textTransform: 'none',
                                        color: '#FFFFFF',
                                        bgcolor: openMenu ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        borderRadius: 1,
                                        py: 0.5, px: 1.5,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ textAlign: 'right', display: { xs: 'none', lg: 'block' } }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                {user.fullName}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#B0BEC5', display: 'block' }}>
                                                {user.role}
                                            </Typography>
                                        </Box>
                                        <Avatar sx={{
                                            width: 36, height: 36,
                                            bgcolor: '#C62828',
                                            fontSize: '0.9rem',
                                            fontWeight: 700
                                        }}>
                                            {user.fullName?.charAt(0)}
                                        </Avatar>
                                    </Box>
                                </Button>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                    PaperProps={{
                                        elevation: 0,
                                        sx: {
                                            overflow: 'visible',
                                            filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.4))',
                                            mt: 1.5,
                                            bgcolor: 'rgba(33, 33, 33, 0.95)',
                                            backdropFilter: 'blur(20px)',
                                            color: '#FFFFF',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 1,
                                            minWidth: 200,
                                            '& .MuiMenuItem-root': {
                                                borderRadius: 1,
                                                mx: 1,
                                                my: 0.5,
                                                color: '#E0E0E0',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255,255,255,0.08)',
                                                    color: '#FFFFFF'
                                                }
                                            },
                                        },
                                    }}
                                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                                >
                                    <Box sx={{ px: 2.5, py: 1.5, mb: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        <Typography variant="subtitle2" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                                            Signed in as
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#B0BEC5', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                    <MenuItem onClick={() => { handleMenuClose(); navigate(getDashboardLink()); }}>
                                        <ListItemIcon>
                                            <Dashboard fontSize="small" sx={{ color: '#B0BEC5' }} />
                                        </ListItemIcon>
                                        Dashboard
                                    </MenuItem>
                                    <MenuItem onClick={() => { handleMenuClose(); /* navigate('/profile'); */ }}>
                                        <ListItemIcon>
                                            <Person fontSize="small" sx={{ color: '#B0BEC5' }} />
                                        </ListItemIcon>
                                        My Profile
                                    </MenuItem>
                                    <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                                    <MenuItem onClick={handleLogout} sx={{ color: '#FF5252!important', '&:hover': { bgcolor: 'rgba(255, 82, 82, 0.1)!important' } }}>
                                        <ListItemIcon>
                                            <Logout fontSize="small" sx={{ color: '#FF5252' }} />
                                        </ListItemIcon>
                                        Logout
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <Button component={Link} to="/login" sx={{ color: '#E0E0E0', fontWeight: 600, '&:hover': { color: '#FFFFFF' } }}>
                                    Sign In
                                </Button>
                                <Button component={Link} to="/register" variant="contained"
                                    sx={{
                                        bgcolor: '#C62828',
                                        borderRadius: 1,
                                        fontWeight: 700,
                                        px: 3,
                                        '&:hover': {
                                            bgcolor: '#B71C1C',
                                            transform: 'translateY(-1px)',
                                        },
                                        transition: 'all 0.2s'
                                    }}>
                                    Get Started
                                </Button>
                            </Box>
                        )}
                    </Box>
                )}

                {/* Mobile Menu Icon */}
                {isMobile && (
                    <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: '#FFFFFF' }}><MenuIcon /></IconButton>
                )}
            </Toolbar>

            {/* Mobile Drawer */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: 280, bgcolor: '#212121', color: '#FFFFFF', backgroundImage: 'none' }
                }}>
                <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                        UniEvents
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#9E9E9E' }}><Close /></IconButton>
                </Box>

                {user && (
                    <Box sx={{ px: 3, pb: 3 }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, p: 2,
                            borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <Avatar sx={{ width: 42, height: 42, bgcolor: '#C62828', fontSize: '1rem', fontWeight: 700 }}>
                                {user.fullName?.charAt(0)}
                            </Avatar>
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                                    {user.fullName}
                                </Typography>
                                <Chip label={user.role} size="small"
                                    sx={{
                                        height: 18, fontSize: '0.65rem',
                                        bgcolor: 'rgba(255,255,255,0.1)', color: '#B0BEC5',
                                        mt: 0.5
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}

                <List sx={{ px: 2 }}>
                    {links.map(l => (
                        <ListItem key={l.text} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton component={Link} to={l.path} onClick={() => setDrawerOpen(false)}
                                selected={isActive(l.path)}
                                sx={{
                                    borderRadius: 1, py: 1.5,
                                    '&.Mui-selected': { bgcolor: 'rgba(198, 40, 40, 0.15)', borderLeft: '3px solid #C62828' },
                                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                                }}>
                                <ListItemIcon sx={{ color: isActive(l.path) ? '#C62828' : '#9E9E9E', minWidth: 40 }}>
                                    {l.icon}
                                </ListItemIcon>
                                <ListItemText primary={l.text}
                                    primaryTypographyProps={{
                                        fontWeight: isActive(l.path) ? 700 : 500,
                                        color: isActive(l.path) ? '#FFFFFF' : '#E0E0E0'
                                    }} />
                            </ListItemButton>
                        </ListItem>
                    ))}

                    <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

                    {user ? (
                        <>
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <ListItemButton component={Link} to={getDashboardLink()} onClick={() => setDrawerOpen(false)}
                                    sx={{ borderRadius: 3, py: 1.5 }}>
                                    <ListItemIcon sx={{ color: '#9E9E9E', minWidth: 40 }}><Dashboard /></ListItemIcon>
                                    <ListItemText primary="Dashboard" primaryTypographyProps={{ color: '#E0E0E0', fontWeight: 600 }} />
                                </ListItemButton>
                            </ListItem>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => { setDrawerOpen(false); handleLogout(); }}
                                    sx={{ borderRadius: 3, py: 1.5, color: '#FF5252' }}>
                                    <ListItemIcon sx={{ color: '#FF5252', minWidth: 40 }}><Logout /></ListItemIcon>
                                    <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
                                </ListItemButton>
                            </ListItem>
                        </>
                    ) : (
                        <Box sx={{ p: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Button component={Link} to="/login" onClick={() => setDrawerOpen(false)} fullWidth
                                sx={{ color: '#E0E0E0', py: 1.5, borderRadius: 1, border: '1px solid rgba(255,255,255,0.2)' }}>
                                Sign In
                            </Button>
                            <Button component={Link} to="/register" onClick={() => setDrawerOpen(false)} fullWidth variant="contained"
                                sx={{ bgcolor: '#C62828', py: 1.5, borderRadius: 1, fontWeight: 700 }}>
                                Get Started
                            </Button>
                        </Box>
                    )}
                </List>
            </Drawer>
        </AppBar>
    );
};

export default Navbar;
