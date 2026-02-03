const { error } = require('../utils/response');

/**
 * Validate request body fields
 * @param {Object} schema - Validation schema
 * @param {Array} schema.required - Required fields
 * @param {Object} schema.fields - Field validation rules
 */
function validateBody(schema) {
    return (req, res, next) => {
        const errors = [];
        const { required = [], fields = {} } = schema;

        // Check required fields
        for (const field of required) {
            if (!req.body[field]) {
                errors.push({
                    field,
                    message: `${field} is required`,
                });
            }
        }

        // Validate field rules
        for (const [field, rules] of Object.entries(fields)) {
            const value = req.body[field];

            // Skip if field is not provided and not required
            if (!value && !required.includes(field)) {
                continue;
            }

            // Type validation
            if (rules.type) {
                const actualType = typeof value;
                if (actualType !== rules.type) {
                    errors.push({
                        field,
                        message: `${field} must be of type ${rules.type}`,
                    });
                    continue;
                }
            }

            // Min length validation
            if (rules.minLength && value.length < rules.minLength) {
                errors.push({
                    field,
                    message: `${field} must be at least ${rules.minLength} characters`,
                });
            }

            // Max length validation
            if (rules.maxLength && value.length > rules.maxLength) {
                errors.push({
                    field,
                    message: `${field} must not exceed ${rules.maxLength} characters`,
                });
            }

            // Pattern validation (regex)
            if (rules.pattern && !rules.pattern.test(value)) {
                errors.push({
                    field,
                    message: rules.patternMessage || `${field} has invalid format`,
                });
            }

            // Enum validation
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push({
                    field,
                    message: `${field} must be one of: ${rules.enum.join(', ')}`,
                });
            }

            // Custom validation
            if (rules.custom) {
                const customError = rules.custom(value, req.body);
                if (customError) {
                    errors.push({
                        field,
                        message: customError,
                    });
                }
            }
        }

        if (errors.length > 0) {
            return error(res, {
                message: 'Validation failed',
                statusCode: 400,
                errors,
            });
        }

        next();
    };
}

/**
 * Validate query parameters
 * @param {Object} schema - Validation schema
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const errors = [];
        const { required = [], fields = {} } = schema;

        // Check required fields
        for (const field of required) {
            if (!req.query[field]) {
                errors.push({
                    field,
                    message: `${field} is required`,
                });
            }
        }

        // Validate field rules
        for (const [field, rules] of Object.entries(fields)) {
            const value = req.query[field];

            if (!value && !required.includes(field)) {
                continue;
            }

            // Type conversion and validation for numbers
            if (rules.type === 'number') {
                const numValue = Number(value);
                if (isNaN(numValue)) {
                    errors.push({
                        field,
                        message: `${field} must be a valid number`,
                    });
                    continue;
                }

                if (rules.min !== undefined && numValue < rules.min) {
                    errors.push({
                        field,
                        message: `${field} must be at least ${rules.min}`,
                    });
                }

                if (rules.max !== undefined && numValue > rules.max) {
                    errors.push({
                        field,
                        message: `${field} must not exceed ${rules.max}`,
                    });
                }
            }
        }

        if (errors.length > 0) {
            return error(res, {
                message: 'Validation failed',
                statusCode: 400,
                errors,
            });
        }

        next();
    };
}

module.exports = {
    validateBody,
    validateQuery,
};
