import { useState, useEffect } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import {
    Box, Typography, Card, CardContent, Button, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Select, MenuItem, FormControl, InputLabel, Alert, Snackbar, Tooltip,
    InputAdornment
} from '@mui/material';
import {
    Edit, Delete, Search, Refresh
} from '@mui/icons-material';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Dialog states
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '', department: '', role: '' });

    const loadUsers = () => {
        setLoading(true);
        api.get('/api/admin/users')
            .then(r => setUsers(r.data.data || []))
            .catch(() => setSnackbar({ open: true, message: 'Failed to load users', severity: 'error' }))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadUsers(); }, []);

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditForm({
            fullName: user.fullName || '',
            email: user.email || '',
            phone: user.phone || '',
            department: user.department || '',
            role: user.role || ''
        });
        setEditOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setDeleteOpen(true);
    };

    const handleUpdateUser = async () => {
        setLoading(true);
        try {
            await api.put(`/api/admin/users/${selectedUser.id}`, editForm);
            setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
            setEditOpen(false);
            loadUsers();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to update user',
                severity: 'error'
            });
        } finally { setLoading(false); }
    };

    const handleDeleteUser = async () => {
        setLoading(true);
        try {
            await api.delete(`/api/admin/users/${selectedUser.id}`);
            setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
            setDeleteOpen(false);
            loadUsers();
        } catch (err) {
            setSnackbar({
                open: true,
                message: err.response?.data?.message || 'Failed to delete user',
                severity: 'error'
            });
        } finally { setLoading(false); }
    };

    const roleColors = { ADMIN: '#ef4444', ORGANIZER: '#f59e0b', STUDENT: '#10b981' };

    const filteredUsers = users.filter(u =>
        u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Manage Users</Typography>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>View, edit, and remove system users.</Typography>
                </Box>
                <Button startIcon={<Refresh />} onClick={loadUsers} variant="outlined">Refresh</Button>
            </Box>

            <Card>
                <CardContent>
                    <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                        <TextField
                            placeholder="Search users..."
                            size="small"
                            fullWidth
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
                            }}
                        />
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Email</TableCell>
                                    <TableCell>Role</TableCell>
                                    <TableCell>Department</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.length > 0 ? filteredUsers.map(u => (
                                    <TableRow key={u.id} hover>
                                        <TableCell sx={{ fontWeight: 500 }}>{u.fullName}</TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{u.email}</TableCell>
                                        <TableCell><Chip label={u.role} size="small" sx={{ bgcolor: `${roleColors[u.role]}22`, color: roleColors[u.role], fontWeight: 600 }} /></TableCell>
                                        <TableCell sx={{ color: 'text.secondary' }}>{u.department || '—'}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Edit">
                                                <IconButton onClick={() => handleEditClick(u)} sx={{ color: 'primary.main' }}>
                                                    <Edit />
                                                </IconButton>
                                            </Tooltip>
                                            {u.role !== 'ADMIN' && (
                                                <Tooltip title="Delete">
                                                    <IconButton onClick={() => handleDeleteClick(u)} sx={{ color: 'error.main' }}>
                                                        <Delete />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                                            <Typography color="text.secondary">No users found</Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
                        <TextField label="Full Name" fullWidth value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                        <TextField label="Email" fullWidth value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                            <TextField label="Phone" fullWidth value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                            <TextField label="Department" fullWidth value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Role</InputLabel>
                            <Select value={editForm.role} label="Role" onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                <MenuItem value="STUDENT">Student</MenuItem>
                                <MenuItem value="ORGANIZER">Organizer</MenuItem>
                                <MenuItem value="ADMIN">Admin</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleUpdateUser} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Delete User?</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        This action cannot be undone.
                        {selectedUser?.role === 'ORGANIZER' && " All events created by this organizer will also be deleted."}
                        {selectedUser?.role === 'STUDENT' && " All registrations and attendance records for this student will be removed."}
                    </Alert>
                    <Typography>
                        Are you sure you want to permanently delete <b>{selectedUser?.fullName}</b>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDeleteUser} disabled={loading}>{loading ? 'Deleting...' : 'Delete Permanently'}</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
            </Snackbar>
        </DashboardLayout>
    );
};

export default UserManagement;
