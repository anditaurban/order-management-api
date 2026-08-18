const authService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

class AuthController {
    /**
     * POST /api/v1/auth/register
     */
    register = asyncHandler(async (req, res) => {
        const { name, email, password } = req.body;
        const result = await authService.register({ name, email, password });
        return successResponse(res, 201, 'User registered successfully.', result);
    });

    /**
     * POST /api/v1/auth/login
     */
    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const result = await authService.login({ email, password });
        return successResponse(res, 200, 'Authentication successful.', result);
    });

    /**
     * GET /api/v1/auth/me
     */
    getMe = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const user = await authService.getProfile(userId);
        return successResponse(res, 200, 'User profile retrieved successfully.', { user });
    });
}

module.exports = new AuthController();
