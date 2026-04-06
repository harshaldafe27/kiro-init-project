/**
 * Predefined allowed student emails for @jdcoem.ac.in domain.
 * Only these emails can register as students.
 */
const ALLOWED_STUDENT_EMAILS = new Set([
    'dafehd@jdcoem.ac.in',
    'khadevm@jdcoem.ac.in',
    'kurwadepp@jdcoem.ac.in',
    'bhisadegs@jdcoem.ac.in',
    'piyushgudhe@jdcoem.ac.in',
]);

const COLLEGE_DOMAIN = '@jdcoem.ac.in';

const isAllowedStudentEmail = (email) => {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    if (!lower.endsWith(COLLEGE_DOMAIN)) return false;
    return ALLOWED_STUDENT_EMAILS.has(lower);
};

module.exports = { ALLOWED_STUDENT_EMAILS, COLLEGE_DOMAIN, isAllowedStudentEmail };
