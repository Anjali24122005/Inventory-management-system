const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/team — get all team members (admin only)
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const members = await User.find({})
      .select('-password -emailVerifyToken -phoneOtp -googleId')
      .sort({ createdAt: -1 });
    res.json(members);
  } catch (err) { next(err); }
});

// POST /api/team/invite — admin creates a staff member
router.post('/invite', protect, adminOnly, [
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('role').isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
], async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ message: errors.array()[0].msg });

  try {
    const { name, email, role, phone } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ message: 'Email already registered' });

    // Create user with temp password — they can change later
    const tempPassword = Math.random().toString(36).slice(-8);
    const user = await User.create({
      name, email, phone: phone || undefined, role,
      password: tempPassword,
      isEmailVerified: true, // admin-invited users are pre-verified
      isPhoneVerified: false,
    });

    res.status(201).json({
      message: `Team member added. Temp password: ${tempPassword}`,
      user: {
        _id: user._id, name: user.name, email: user.email, role: user.role,
        isEmailVerified: user.isEmailVerified, createdAt: user.createdAt,
      },
      tempPassword,
    });
  } catch (err) { next(err); }
});

// PUT /api/team/:id/role — change role
router.put('/:id/role', protect, adminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'staff'].includes(role))
      return res.status(400).json({ message: 'Invalid role' });

    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot change your own role' });

    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// PUT /api/team/:id/status — activate/deactivate
router.put('/:id/status', protect, adminOnly, async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot deactivate yourself' });

    const user = await User.findByIdAndUpdate(
      req.params.id, { isActive }, { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
});

// DELETE /api/team/:id — remove member
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot delete yourself' });

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Team member removed' });
  } catch (err) { next(err); }
});

module.exports = router;
