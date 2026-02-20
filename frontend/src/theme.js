import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: { main: '#C62828', light: '#EF5350', dark: '#B71C1C' },
        secondary: { main: '#757575', light: '#9E9E9E', dark: '#616161' },
        background: { default: '#FAFAFA', paper: '#FFFFFF' },
        success: { main: '#2E7D32' },
        warning: { main: '#F9A825' },
        error: { main: '#C62828' },
        info: { main: '#1565C0' },
        text: { primary: '#212121', secondary: '#757575' },
        divider: '#E0E0E0',
    },
    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        h1: { fontWeight: 700, color: '#212121' },
        h2: { fontWeight: 700, color: '#212121' },
        h3: { fontWeight: 600, color: '#212121' },
        h4: { fontWeight: 600, color: '#212121' },
        h5: { fontWeight: 600, color: '#212121' },
        h6: { fontWeight: 600, color: '#212121' },
        body1: { color: '#757575' },
        body2: { color: '#757575' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 4 },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 4,
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    boxShadow: 'none',
                },
                containedPrimary: {
                    background: '#C62828',
                    color: '#FFFFFF',
                    '&:hover': { background: '#B71C1C', boxShadow: '0 2px 8px rgba(198,40,40,0.25)' },
                },
                outlinedSecondary: {
                    borderColor: '#757575',
                    color: '#757575',
                    '&:hover': { borderColor: '#C62828', color: '#C62828', bgcolor: 'transparent' },
                },
                outlined: {
                    borderColor: '#757575',
                    color: '#757575',
                    '&:hover': { borderColor: '#C62828', color: '#C62828', bgcolor: 'rgba(198,40,40,0.04)' },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    background: '#FFFFFF',
                    border: '1px solid #E0E0E0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                    transition: 'box-shadow 0.2s ease',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: '#E0E0E0' },
                        '&:hover fieldset': { borderColor: '#9E9E9E' },
                        '&.Mui-focused fieldset': { borderColor: '#C62828' },
                    },
                    '& .MuiInputLabel-root.Mui-focused': { color: '#C62828' },
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: '#212121',
                    borderBottom: '1px solid #333333',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                    color: '#FFFFFF',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: '#212121',
                    borderRight: '1px solid #333333',
                    color: '#FFFFFF',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: { fontWeight: 500, borderRadius: 4 },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: { backgroundColor: '#E0E0E0' },
                barColorPrimary: { backgroundColor: '#C62828' },
            },
        },
    },
});

export default theme;
