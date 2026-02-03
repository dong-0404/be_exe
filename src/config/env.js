const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Database
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/be_exe',

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

    // Security
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),

    // Email
    email: {
        service: process.env.EMAIL_SERVICE, // 'gmail', 'sendgrid', etc.
        user: process.env.EMAIL_USER,
        password: process.env.EMAIL_PASSWORD,
        fromEmail: process.env.EMAIL_FROM || 'noreply@tutorplatform.com',
        fromName: process.env.EMAIL_FROM_NAME || 'Tutor Platform',
    },

    // Cloudinary
    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        apiSecret: process.env.CLOUDINARY_API_SECRET,
        uploadFolder: process.env.CLOUDINARY_UPLOAD_FOLDER || 'tutor-certificates',
    },
};

// Validate required environment variables in production
if (config.nodeEnv === 'production') {
    const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
}

module.exports = config;
