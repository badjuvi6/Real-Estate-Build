// real-estate-app/backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

// requireAuth: verifies the Authorization: Bearer <token> header and
// attaches the decoded user id as req.userId for downstream handlers.
// Responds 401 for anything wrong with the token rather than throwing,
// since an expired/malformed/missing token is an expected, routine
// condition for a protected route (not a server error).
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    const token = header.slice('Bearer '.length).trim();
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
        next();
    } catch (err) {
        // Covers both an expired token (TokenExpiredError) and a
        // malformed/tampered one (JsonWebTokenError) with the same
        // response - the client's remedy is the same either way (log in
        // again), and distinguishing them in the response doesn't help a
        // legitimate caller while giving an attacker a small amount of
        // extra information about why a forged token failed.
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// requireRole(...roles): use AFTER requireAuth on routes that should only
// be reachable by specific roles (e.g. only 'agent' can create listings).
// Kept separate from requireAuth so routes that just need "logged in,
// any role" don't have to pass a role list they don't care about.
function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.userRole)) {
            return res.status(403).json({ message: 'You do not have permission to perform this action' });
        }
        next();
    };
}

// optionalAuth: like requireAuth, but a missing/invalid token means
// "proceed as anonymous" rather than a 401. Used on routes that make sense
// either way (e.g. submitting a property inquiry) but behave slightly
// differently when the caller happens to be logged in (e.g. attaching
// req.userId so the inquiry can later show up in that user's dashboard).
function optionalAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next();
    }

    const token = header.slice('Bearer '.length).trim();
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = payload.sub;
        req.userRole = payload.role;
    } catch (err) {
        // Invalid/expired token on an optional route - fall through as
        // anonymous rather than blocking the request.
    }
    next();
}

module.exports = { requireAuth, requireRole, optionalAuth };
