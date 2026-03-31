const getPagination = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;
    return {
        page,
        limit,
        skip
    };
};

const paginationMeta = (total, page, limit) => {
    return {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
    };
};

module.exports = {
    getPagination,
    paginationMeta
};