/**
 * Async handler wrapper for Express controllers
 * Eliminates need for try-catch in each controller
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class
 */
export class AppError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.status = status;
    }
}
