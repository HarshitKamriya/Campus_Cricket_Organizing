'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../models');
const { User } = db;

const JWT_SECRET = process.env.JWT_SECRET || 'nit-srinagar-campus-cricket-secret-2026';
const JWT_EXPIRY = '24h';

/**
 * Login validation rules.
 */
const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * Register validation rules.
 */
const registerValidation = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be 3-50 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'scorer'])
    .withMessage('Role must be admin or scorer'),
];

/**
 * Authenticate user and return JWT token.
 * POST /api/auth/login
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Register a new user (admin only).
 * POST /api/auth/register
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, name, password, role } = req.body;

    // Check if username already exists
    const existing = await User.findOne({ where: { username } });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username,
      name,
      password_hash,
      role: role || 'scorer',
    });

    return res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get current authenticated user profile.
 * GET /api/auth/me
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getMe(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'name', 'role', 'created_at'],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('GetMe error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  login,
  register,
  getMe,
  loginValidation,
  registerValidation,
};
