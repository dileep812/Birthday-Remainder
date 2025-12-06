export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'You must be logged in' });
  }
  next();
};
