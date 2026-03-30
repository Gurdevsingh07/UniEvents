/**
 * Computes a real-time event status based on the current time, event date,
 * start time, and end time. Returns an object with label, color, bgColor,
 * and a priority for sorting.
 */

export function getEventLiveStatus(event) {
    if (!event) return null;

    const now = new Date();
    const eventDate = event.eventDate; // "YYYY-MM-DD"
    const startTime = event.startTime; // "HH:mm" or "HH:mm:ss"
    const endTime = event.endTime;     // "HH:mm" or "HH:mm:ss" or null

    // If backend says COMPLETED or CANCELLED, respect that
    if (event.status === 'COMPLETED') {
        return { label: 'Completed', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.1)', priority: 5 };
    }
    if (event.status === 'CANCELLED') {
        return { label: 'Cancelled', color: '#64748b', bgColor: 'rgba(100,116,139,0.08)', priority: 6 };
    }

    // Build start and end Date objects
    const startDateTime = parseDateTime(eventDate, startTime);
    const endDateTime = endTime ? parseDateTime(event.endDate || eventDate, endTime) : (event.endDate ? parseDateTime(event.endDate, '23:59:59') : null);

    if (!startDateTime) {
        return { label: 'Upcoming', color: '#D32F2F', bgColor: 'rgba(211,47,47,0.08)', priority: 3 };
    }

    const msUntilStart = startDateTime - now;
    const minutesUntilStart = msUntilStart / (1000 * 60);

    // Already past end time
    if (endDateTime && now >= endDateTime) {
        return { label: 'Completed', color: '#94A3B8', bgColor: 'rgba(148,163,184,0.1)', priority: 5 };
    }

    // Event is happening now (between start and end)
    if (now >= startDateTime) {
        if (endDateTime) {
            const msUntilEnd = endDateTime - now;
            const minutesUntilEnd = msUntilEnd / (1000 * 60);
            if (minutesUntilEnd <= 15) {
                return { label: 'Ending Soon', color: '#E65100', bgColor: 'rgba(230,81,0,0.08)', priority: 1, pulse: true };
            }
        }
        return { label: 'Ongoing', color: '#2E7D32', bgColor: 'rgba(46,125,50,0.10)', priority: 0, pulse: true };
    }

    // Starting within 30 minutes
    if (minutesUntilStart <= 30 && minutesUntilStart > 0) {
        return { label: 'Starting Soon', color: '#E65100', bgColor: 'rgba(230,81,0,0.08)', priority: 1, pulse: true };
    }

    // Starting today but more than 30 min away
    const todayStr = now.toISOString().split('T')[0];
    if (eventDate === todayStr) {
        return { label: 'Today', color: '#1565C0', bgColor: 'rgba(21,101,192,0.08)', priority: 2 };
    }

    // Tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (eventDate === tomorrowStr) {
        return { label: 'Tomorrow', color: '#6A1B9A', bgColor: 'rgba(106,27,154,0.08)', priority: 2 };
    }

    // Default upcoming
    return { label: 'Upcoming', color: '#C62828', bgColor: 'rgba(198,40,40,0.08)', priority: 3 };
}

function parseDateTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    try {
        return new Date(`${dateStr}T${timeStr}`);
    } catch {
        return null;
    }
}
