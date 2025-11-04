//src/utils/dateUtils.js
const { parseISO, formatISO, isValid } = require('date-fns');

function toISO(dateStr) {
    const d = parseISO(dateStr);
    if (!isValid(d)) {
        throw new Error(`Invalid date format: ${dateStr}`);
    }
    return formatISO(d);
}

/**
 * Build filter params for Conta Azul API endpoints.
 * Accepts query params: startDate, endDate
 * Returns an object with correctly formatted date filters.
 */
function buildDateFilters(query) {
    const filters = {};
    if (query.startDate) {
        filters.startDate = toISO(query.startDate);
    }
    if (query.endDate) {
        filters.endDate = toISO(query.endDate);
    }
    return filters;
}

module.exports = { toISO, buildDateFilters };
