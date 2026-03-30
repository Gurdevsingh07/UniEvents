import { Card, CardContent, Box, Typography, alpha } from '@mui/material';

const StatCard = ({ label, value, icon, color = '#212121', delay = 0 }) => {
    return (
        <Card className={`animate-fade-in-up stagger-${delay} hover-lift`}
            sx={{
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 1.5,
                background: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
                    borderColor: alpha('#D32F2F', 0.3),
                    '& .icon-box': {
                        bgcolor: '#D32F2F',
                        color: '#FFFFFF',
                        transform: 'scale(1.1)'
                    }
                }
            }}>
            <CardContent sx={{ p: { xs: 2.5, md: 3 }, position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{
                            color: '#64748b',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'block',
                            mb: 0.5,
                            fontSize: '0.65rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {label}
                        </Typography>
                        <Typography variant="h4" sx={{
                            fontWeight: 900,
                            color: '#101010',
                            letterSpacing: '-0.02em',
                            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.8rem' },
                            lineHeight: 1.1
                        }}>
                            {value}
                        </Typography>
                    </Box>
                    <Box className="icon-box" sx={{
                        p: { xs: 1.2, md: 1.5 },
                        borderRadius: 1,
                        bgcolor: '#f8fafc',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid #e2e8f0',
                        flexShrink: 0
                    }}>
                        {icon}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default StatCard;
