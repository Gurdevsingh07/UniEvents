import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Autocomplete, CircularProgress,
    Box, Typography, Avatar, Stack
} from '@mui/material';
import api from '../api/axios';

const AssignTaskDialog = ({ open, onClose, onAssigned, isOrganizer, adminMode }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [deadline, setDeadline] = useState('');

    // Assignee selection
    const [assigneeQuery, setAssigneeQuery] = useState('');
    const [assigneeOptions, setAssigneeOptions] = useState([]);
    const [searching, setSearching] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    // Dynamic search for users
    const searchUsers = async (q) => {
        setAssigneeQuery(q);
        if (q.length < 2) {
            setAssigneeOptions([]);
            return;
        }

        setSearching(true);
        try {
            // If the current user is an admin, they can search for anyone.
            // If the current user is an organizer, they should only search for students (team members).
            // We use the existing members search endpoint with the correct filter.
            let filtered = [];

            if (adminMode) {
                // Admin endpoint gets all users, no search param supported
                const res = await api.get('/api/admin/users');
                const allUsers = res.data.data || [];
                // Filter locally by search query and remove admins
                filtered = allUsers.filter(u =>
                    u.role !== 'ADMIN' &&
                    (u.fullName?.toLowerCase().includes(q.toLowerCase()) ||
                        u.email?.toLowerCase().includes(q.toLowerCase()))
                );
            } else {
                // Organizer endpoint supports search param
                const res = await api.get('/api/team/members', {
                    params: { search: q.trim(), filter: 'STUDENT' }
                });
                filtered = (res.data.data || []).map(m => m.user || m);
                // Note: /api/team/members returns TeamMemberResponse which wraps User in .user
            }

            setAssigneeOptions(filtered);
        } catch {
            setAssigneeOptions([]);
        } finally {
            setSearching(false);
        }
    };

    const handleSubmit = async () => {
        if (!title || selectedUsers.length === 0) return;

        setSubmitting(true);
        try {
            // TaskRequest: title, description, assignedToIds, eventId, clubId, deadline
            const payload = {
                title,
                description,
                assignedToIds: selectedUsers.map(u => u.id),
                deadline: deadline ? `${deadline}T23:59:59` : null // End of day
            };

            await api.post('/api/tasks', payload);
            if (onAssigned) onAssigned();
            handleClose();
        } catch (err) {
            console.error('Failed to assign task', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDescription('');
        setDeadline('');
        setSelectedUsers([]);
        setAssigneeQuery('');
        setAssigneeOptions([]);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 800, color: '#212121', pb: 1 }}>
                Assign New Task
            </DialogTitle>
            <DialogContent sx={{ pt: '8px !important' }}>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    <TextField
                        label="Task Title"
                        fullWidth
                        size="small"
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="e.g., Check sound equipment"
                    />

                    <Autocomplete
                        multiple
                        options={assigneeOptions}
                        getOptionLabel={(option) => option.fullName || option.email}
                        filterOptions={(x) => x} // Disable local filtering (we do server-side)
                        inputValue={assigneeQuery}
                        onInputChange={(_, newInputValue) => searchUsers(newInputValue)}
                        value={selectedUsers}
                        onChange={(_, newValue) => setSelectedUsers(newValue)}
                        loading={searching}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label={adminMode ? "Assign To (Search Organizers & Students)" : "Assign To (Search Students)"}
                                size="small"
                                required
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {searching ? <CircularProgress color="inherit" size={16} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: option.role === 'ORGANIZER' ? '#1565C0' : '#212121' }}>
                                    {option.fullName?.[0]}
                                </Avatar>
                                <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{option.fullName}</Typography>
                                    <Typography variant="caption" sx={{ color: '#757575' }}>
                                        {option.email} • {option.role === 'ORGANIZER' ? 'Organizer' : 'Student'}
                                        {option.studentId && ` • ${option.studentId}`}
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                        noOptionsText={assigneeQuery.length < 2 ? "Type to search..." : "No users found"}
                    />

                    <TextField
                        label="Description (Optional)"
                        fullWidth
                        multiline
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Provide details about the task..."
                    />

                    <TextField
                        label="Deadline (Optional)"
                        type="date"
                        fullWidth
                        size="small"
                        value={deadline}
                        onChange={e => setDeadline(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={handleClose} disabled={submitting} sx={{ color: '#757575', fontWeight: 700, textTransform: 'none' }}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!title || selectedUsers.length === 0 || submitting}
                    sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}
                >
                    {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Assign Task'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignTaskDialog;
