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
        h1: { fontWeight: 800, color: '#212121', letterSpacing: '-0.02em' },
        h2: { fontWeight: 800, color: '#212121', letterSpacing: '-0.01em' },
        h3: { fontWeight: 700, color: '#212121', letterSpacing: '-0.01em' },
        h4: { fontWeight: 700, color: '#212121' },
        h5: { fontWeight: 700, color: '#212121' },
        h6: { fontWeight: 700, color: '#212121' },
        body1: { color: '#4b5563', lineHeight: 1.6 },
        body2: { color: '#6b7280', lineHeight: 1.5 },
        caption: { lineHeight: 1.4 },
        button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.01em' },
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
                    transition: 'background-color 150ms ease',
                    '&:hover': { background: '#B71C1C' },
                },
                outlinedSecondary: {
                    borderColor: '#757575',
                    color: '#757575',
                    '&:hover': { borderColor: '#C62828', color: '#C62828', bgcolor: 'transparent' },
                },
                outlined: {
                    borderColor: '#757575',
                    color: '#757575',
                    transition: 'border-color 150ms ease, color 150ms ease',
                    '&:hover': { borderColor: '#212121', color: '#212121', bgcolor: 'transparent' },
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
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                    transition: 'border-color 150ms ease',
                    '&:hover': { borderColor: '#BDBDBD' },
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
                    background: '#FFFFFF',
                    borderBottom: '1px solid #E0E0E0',
                    boxShadow: 'none',
                    color: '#212121',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    background: '#FAFAFA',
                    borderRight: '1px solid #E0E0E0',
                    color: '#212121',
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
