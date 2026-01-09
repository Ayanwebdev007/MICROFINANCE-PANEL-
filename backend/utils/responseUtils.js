/**
 * Standardized response utility for Express routes.
 */
const ResponseUtils = {
    success(res, data, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data
        });
    },

    error(res, message = 'Internal Server Error', status = 500, details = null) {
        return res.status(status).json({
            success: false,
            error: message,
            details
        });
    },

    unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    },

    notFound(res, message = 'Not Found') {
        return this.error(res, message, 404);
    },

    badRequest(res, message = 'Bad Request') {
        return this.error(res, message, 400);
    }
};

module.exports = ResponseUtils;
