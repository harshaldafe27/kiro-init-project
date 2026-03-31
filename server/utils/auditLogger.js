const logAudit = async ({
    actor,
    action,
    targetType,
    targetId,
    metadata,
    ip
}) => {
    const {
        AuditLogs
    } = require('../models/db');
    await AuditLogs.create({
        actor,
        action,
        targetType,
        targetId,
        metadata,
        ip
    });
};

module.exports = {
    logAudit
};