// real-estate-app/backend/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['user', 'agent'];

// Loose but real email format check - not exhaustive RFC 5322 validation
// (nothing short of actually sending a confirmation email really is), just
// enough to reject obvious typos at signup.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true, // normalized here so "A@B.com" and "a@b.com" are the same account
        unique: true,
        validate: {
            validator: (v) => EMAIL_PATTERN.test(v),
            message: 'Please enter a valid email address'
        }
    },
    password: {
        type: String,
        required: true,
        minlength: [8, 'Password must be at least 8 characters'],
        // select: false means a normal User.find()/findById() will NOT
        // return this field, even though it's stored - callers that
        // genuinely need it (login's password check) must explicitly ask
        // for it with .select('+password'). This is defense in depth
        // alongside the toJSON transform below, which strips it a second
        // time from anything that IS fetched with it included.
        select: false
    },
    role: {
        type: String,
        enum: ROLES,
        default: 'user'
    },
    // Properties this user has bookmarked. Stored as a plain array of refs
    // rather than a separate join collection - simple, and favorites lists
    // are small enough per-user that this never needs its own pagination.
    favorites: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Re-hash the password only when it's actually new/changed. Without this
// guard, calling user.save() for an unrelated update (e.g. adding a
// favorite) would hash the ALREADY-HASHED password again on every save,
// silently breaking every future login for that user.
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Instance method: compares a plaintext candidate password against this
// user's stored hash. Only usable on a document fetched with
// .select('+password'), since `this.password` is otherwise unavailable.
userSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Second layer of defense against ever leaking the password hash: even if
// some future query forgets to omit it, JSON serialization (res.json(user))
// strips it here regardless. Also drops __v since clients have no use for
// Mongoose's internal version key.
userSchema.set('toJSON', {
    transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
    }
});

const User = mongoose.model('User', userSchema);
User.ROLES = ROLES;

module.exports = User;
