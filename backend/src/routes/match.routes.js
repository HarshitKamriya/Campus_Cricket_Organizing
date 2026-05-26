'use strict';

const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/matches
 * @desc    Create a new match
 * @access  Private (admin, scorer)
 */
router.post('/', authenticate, authorize('admin'), matchController.createMatch);

/**
 * @route   GET /api/matches
 * @desc    Get all matches
 * @access  Public
 */
router.get('/', matchController.getAllMatches);

/**
 * @route   GET /api/matches/:id
 * @desc    Get match by ID
 * @access  Public
 */
router.get('/:id', matchController.getMatch);

/**
 * @route   PUT /api/matches/:id
 * @desc    Update match
 * @access  Private (admin, scorer)
 */
router.put('/:id', authenticate, authorize('admin'), matchController.updateMatch);

/**
 * @route   POST /api/matches/:id/start
 * @desc    Start a match
 * @access  Private (admin, scorer)
 */
router.post('/:id/start', authenticate, authorize('admin', 'scorer'), matchController.startMatch);

/**
 * @route   POST /api/matches/:id/end-innings
 * @desc    End the current innings
 * @access  Private (admin, scorer)
 */
router.post('/:id/end-innings', authenticate, authorize('admin', 'scorer'), matchController.endInnings);

/**
 * @route   POST /api/matches/:id/end
 * @desc    End the match
 * @access  Private (admin, scorer)
 */
router.post('/:id/end', authenticate, authorize('admin', 'scorer'), matchController.endMatch);

/**
 * @route   DELETE /api/matches/:id
 * @desc    Delete the match
 * @access  Private (admin, scorer)
 */
router.delete('/:id', authenticate, authorize('admin'), matchController.deleteMatch);

module.exports = router;
