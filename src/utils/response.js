/**
 * Standardized success response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} options.data - Response data
 * @param {string} options.message - Success message
 * @param {number} options.statusCode - HTTP status code (default: 200)
 */
function success(res, { data = null, message = 'Success', statusCode = 200 } = {}) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}

/**
 * Standardized error response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {string} options.message - Error message
 * @param {number} options.statusCode - HTTP status code (default: 500)
 * @param {Array} options.errors - Validation errors array
 */
function error(res, { message = 'Internal Server Error', statusCode = 500, errors = null } = {}) {
    const response = {
        success: false,
        message,
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
}

/**
 * Paginated response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {Array} options.data - Response data array
 * @param {number} options.page - Current page
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total items count
 * @param {string} options.message - Success message
 */
function paginated(res, { data, page, limit, total, message = 'Success' }) {
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    });
}

module.exports = {
    success,
    error,
    paginated,
};
