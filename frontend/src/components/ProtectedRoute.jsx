import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, roles, permissions }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user) return <Navigate to="/login" replace />;

    const hasRole = roles ? roles.includes(user.role) : true;
    const hasPermission = permissions && user?.permissions ? permissions.some(p => user.permissions.includes(p)) : false;

    if (!hasRole && !hasPermission) {
        return <Navigate to="/" replace />;
    }
    return children;
};

export default ProtectedRoute;
