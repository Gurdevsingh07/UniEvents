import { useState, useEffect } from 'react';
import { Chip, Box } from '@mui/material';
import { getEventLiveStatus } from '../utils/eventStatus';

/**
 * A chip that shows the live status of an event, updating every 30 seconds.
 * Shows a pulsing dot for active statuses (Happening Now, Starting Soon, Ending Soon).
 */
const LiveStatusChip = ({ event, size = 'small', sx = {} }) => {
    const [status, setStatus] = useState(() => getEventLiveStatus(event));

    useEffect(() => {
        setStatus(getEventLiveStatus(event));
        const interval = setInterval(() => {
            setStatus(getEventLiveStatus(event));
        }, 1000); // refresh every 1s
        return () => clearInterval(interval);
    }, [event?.eventDate, event?.startTime, event?.endTime, event?.status]);

    if (!status) return null;

    return (
        <Chip
            size={size}
            label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {status.pulse && (
                        <span className="live-dot" style={{ backgroundColor: status.color }} />
                    )}
                    {status.label}
                </Box>
            }
            sx={{
                fontWeight: 600,
                fontSize: size === 'small' ? '0.7rem' : '0.8rem',
                bgcolor: status.bgColor,
                color: status.color,
                borderRadius: 1,
                ...sx,
            }}
        />
    );
};

export default LiveStatusChip;
