/**
 * Generates a unique Special ID for a confirmed registration ticket.
 * Format: EF-<YEAR>-<EVENTCODE>-<RANDOM6>
 * Example: EF-2026-TECH-A3F9K2
 */
const generateSpecialId = (eventTitle = '') => {
    const year = new Date().getFullYear();
    const code = eventTitle
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4) || 'EVNT';
    const rand = Math.random().toString(36).toUpperCase().slice(2, 8);
    return `EF-${year}-${code}-${rand}`;
};

module.exports = {
    generateSpecialId
};