// real-estate-app/backend/controllers/authController.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const TOKEN_EXPIRY = '7d';

// Signs a JWT identifying `user`. `sub` (subject) is the standard JWT claim
// name for "who this token is about" - using it rather than a made-up
// field name like `userId` keeps this readable by any standard JWT tooling.
function signToken(user) {
    return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
        expiresIn: TOKEN_EXPIRY
    });
}

// POST /api/auth/register
async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'name, email, and password are required' });
        }

        // role defaults to 'user' for anything not explicitly 'agent' -
        // this also means a request can't sneak in some other arbitrary
        // string and have it stored as-is; the schema's enum would reject
        // it anyway, but failing that closed here gives a clearer error.
        const finalRole = role === 'agent' ? 'agent' : 'user';

        const user = new User({ name, email, password, role: finalRole });
        await user.save(); // pre-save hook hashes the password

        const token = signToken(user);
        res.status(201).json({ token, user });
    } catch (err) {
        if (err.code === 11000) {
            // Duplicate key on the unique email index. Also reachable via
            // a race condition even with a pre-check (two registrations
            // for the same email landing at nearly the same time), so this
            // catch is the actual source of truth, not just a fallback.
            return res.status(409).json({ message: 'An account with this email already exists' });
        }
        if (err.name === 'ValidationError') {
            const message = Object.values(err.errors).map((e) => e.message).join('; ');
            return res.status(400).json({ message });
        }
        res.status(500).json({ message: err.message });
    }
}

// POST /api/auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'email and password are required' });
        }

        // password has `select: false` on the schema (see models/User.js),
        // so it must be explicitly requested here to compare against it.
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

        // Same generic message whether the email doesn't exist or the
        // password is wrong. Distinguishing the two ("no account with that
        // email" vs. "wrong password") lets an attacker enumerate which
        // emails are registered - the extra clarity isn't worth that leak.
        const invalidCredentials = () => res.status(401).json({ message: 'Invalid email or password' });

        if (!user) return invalidCredentials();

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return invalidCredentials();

        const token = signToken(user);
        res.json({ token, user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

// GET /api/auth/me (protected - requireAuth middleware sets req.userId)
async function getMe(req, res) {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { register, login, getMe };
