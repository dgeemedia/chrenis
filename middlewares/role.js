//middlewares/role.js
module.exports = function(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (req.user['http://chrenis.example.com/role'] === role || req.user.role === role) return next();
    return res.status(403).json({ message: 'Forbidden' });
  };
};
