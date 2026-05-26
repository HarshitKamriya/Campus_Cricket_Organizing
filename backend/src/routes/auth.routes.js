'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post('/login', authController.loginValidation, authController.login);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user (admin only)
 * @access  Private (admin)
 */
router.post(
  '/register',
  authenticate,
  authorize('admin'),
  authController.registerValidation,
  authController.register
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getMe);

module.exports = router;
