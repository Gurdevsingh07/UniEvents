import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack,
    Box, Typography, Grid, TextField, InputAdornment, Avatar,
    CircularProgress, Chip, Checkbox, Paper, Alert
} from '@mui/material';
import { Search, TouchApp, Visibility, Shield, Security, Settings, Event as EventIcon } from '@mui/icons-material';

const PERMISSION_OPTIONS = [
    { key: 'canScanAttendance', label: 'Take Attendance', icon: <TouchApp sx={{ fontSize: 16 }} />, desc: 'Can scan faces during events' },
    { key: 'canViewAttendanceSheet', label: 'View Attendance Sheet', icon: <Visibility sx={{ fontSize: 16 }} />, desc: 'Can see who attended' },
    { key: 'canManualOverride', label: 'Manual Override', icon: <Shield sx={{ fontSize: 16 }} />, desc: 'Can manually mark attendance' },
    { key: 'canViewLiveStats', label: 'View Live Stats', icon: <Security sx={{ fontSize: 16 }} />, desc: 'Can see real-time event stats' },
    { key: 'canManageTeam', label: 'Manage Team', icon: <Settings sx={{ fontSize: 16 }} />, desc: 'Can add/remove team members' },
    { key: 'canManageEvent', label: 'Manage Event', icon: <EventIcon sx={{ fontSize: 16 }} />, desc: 'Can edit event details' },
];

const POSITION_OPTIONS = ['Team Lead', 'Coordinator', 'Volunteer', 'Scanner', 'Member'];

const MemberPermissionDialog = ({
    open,
    onClose,
    editMode,
    memberForm,
    setMemberForm,
    searchQuery,
    setSearchQuery,
    searching,
    searchResults,
    onSearch,
    onSelectStudent,
    onSave,
    loading,
    feedback
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
            <DialogTitle sx={{ fontWeight: 800, color: '#212121', pb: 0 }}>
                {editMode ? 'Edit Member Permissions' : 'Add Team Member'}
            </DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
                <Stack spacing={2.5} sx={{ mt: 1 }}>
                    {/* Search students */}
                    <Box>
                        <TextField
                            label={editMode ? "User" : "Search Student"}
                            fullWidth
                            size="small"
                            value={searchQuery}
                            onChange={e => !editMode && onSearch(e.target.value)}
                            disabled={editMode}
                            placeholder="Type name or student ID..."
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 18, color: '#9E9E9E' }} /></InputAdornment>
                            }}
                        />
                        {!editMode && searching && <CircularProgress size={16} sx={{ mt: 1, color: '#C62828' }} />}
                        {!editMode && searchResults.length > 0 && (
                            <Paper variant="outlined" sx={{ mt: 1, maxHeight: 160, overflow: 'auto', borderRadius: 1.5 }}>
                                {searchResults.map(s => (
                                    <Box
                                        key={s.id}
                                        onClick={() => onSelectStudent(s)}
                                        sx={{
                                            p: 1.5, cursor: 'pointer', '&:hover': { bgcolor: '#FAFAFA' },
                                            display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F5F5F5'
                                        }}
                                    >
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#212121', fontSize: '0.7rem' }}>{s.fullName?.charAt(0)}</Avatar>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#212121', fontSize: '0.85rem' }}>{s.fullName}</Typography>
                                            <Typography variant="caption" sx={{ color: '#9E9E9E' }}>{s.email} {s.studentId && `· ${s.studentId}`}</Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Paper>
                        )}
                        {memberForm.userId && !editMode && (
                            <Chip
                                label={`Selected: ${searchQuery}`}
                                size="small"
                                onDelete={() => onSelectStudent(null)}
                                sx={{ mt: 1, fontWeight: 600, bgcolor: 'rgba(198,40,40,0.08)', color: '#C62828' }}
                            />
                        )}
                    </Box>

                    {/* Position */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', mb: 1, fontSize: '0.75rem' }}>Position</Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {POSITION_OPTIONS.map(pos => (
                                <Chip
                                    key={pos}
                                    label={pos}
                                    size="small"
                                    variant={memberForm.position === pos ? 'filled' : 'outlined'}
                                    onClick={() => setMemberForm(p => ({ ...p, position: pos }))}
                                    sx={{
                                        fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer',
                                        ...(memberForm.position === pos
                                            ? { bgcolor: '#C62828', color: '#fff' }
                                            : { borderColor: '#E0E0E0', color: '#757575', '&:hover': { borderColor: '#C62828' } })
                                    }}
                                />
                            ))}
                        </Stack>
                    </Box>

                    {/* Granular Permissions */}
                    <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#424242', mb: 1.5, fontSize: '0.75rem' }}>Permissions</Typography>
                        <Grid container spacing={1}>
                            {PERMISSION_OPTIONS.map(perm => (
                                <Grid item xs={6} key={perm.key}>
                                    <Paper
                                        variant="outlined"
                                        sx={{
                                            p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                                            border: memberForm[perm.key] ? '1.5px solid #C62828' : '1px solid #E0E0E0',
                                            bgcolor: memberForm[perm.key] ? 'rgba(198,40,40,0.04)' : 'transparent',
                                            transition: 'all 0.15s', '&:hover': { borderColor: '#C62828' }
                                        }}
                                        onClick={() => setMemberForm(p => ({ ...p, [perm.key]: !p[perm.key] }))}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Checkbox
                                                checked={memberForm[perm.key]}
                                                size="small"
                                                sx={{ p: 0, color: '#BDBDBD', '&.Mui-checked': { color: '#C62828' } }}
                                            />
                                            <Box sx={{ color: memberForm[perm.key] ? '#C62828' : '#9E9E9E' }}>{perm.icon}</Box>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#424242', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                                    {perm.label}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: '0.65rem' }}>{perm.desc}</Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {feedback && feedback.type === 'error' && (
                        <Alert severity="error" sx={{ borderRadius: 1 }}>{feedback.msg}</Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
                <Button onClick={onClose} sx={{ color: '#757575', fontWeight: 700, textTransform: 'none' }}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={onSave}
                    disabled={(!memberForm.userId && !editMode) || loading}
                    sx={{ bgcolor: '#C62828', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { bgcolor: '#B71C1C' } }}
                >
                    {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : (editMode ? 'Save Changes' : 'Add to Team')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default MemberPermissionDialog;
