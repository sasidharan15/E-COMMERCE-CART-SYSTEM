const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const method = process.env.AUTH_METHOD || 'jwt';
    if (method === 'session') {
      if (!req.session || !req.session.userId) return res.status(401).json({ msg: 'Not authenticated' });
      req.user = await User.findById(req.session.userId).select('-password');
      return next();
    }

    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ msg: 'Token invalid or session expired' });
  }
};

module.exports = auth;
