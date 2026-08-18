const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/user.repository');
const { generateToken } = require('../utils/jwt');
const AppError = require('../utils/appError');

class AuthService {
    /**
     * Register a new user
     */
    async register({ name, email, password }) {
        // Check if user already exists
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError('Email address is already registered.', 409, 'EMAIL_EXISTS');
        }

        // Hash password securely using bcrypt
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Save user to database
        const newUser = await userRepository.create({
            name,
            email,
            password: hashedPassword
        });

        // Generate JWT token
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name
        });

        return {
            user: newUser,
            token
        };
    }

    /**
     * Authenticate user login credentials
     */
    async login({ email, password }) {
        // Find user by email
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        // Verify password hash
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        // Generate JWT token
        const token = generateToken({
            id: user.id,
            email: user.email,
            name: user.name
        });

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            token
        };
    }

    /**
     * Get user profile by user ID
     */
    async getProfile(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
        }
        return user;
    }
}

module.exports = new AuthService();
