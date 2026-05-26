'use strict';

const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/matches/:id/events
 * @desc    Add a new ball event
 * @access  Private (admin, scorer)
 */
router.post(
  '/matches/:id/events',
  authenticate,
  authorize('admin', 'scorer'),
  eventController.addBallEvent
);

/**
 * @route   GET /api/matches/:id/events
 * @desc    Get all events for a match
 * @access  Public
 */
router.get('/matches/:id/events', eventController.getEvents);

/**
 * @route   POST /api/matches/:id/undo
 * @desc    Undo the last ball event
 * @access  Private (admin, scorer)
 */
router.post(
  '/matches/:id/undo',
  authenticate,
  authorize('admin', 'scorer'),
  eventController.undoLastEvent
);

/**
 * @route   GET /api/matches/:id/scoreboard
 * @desc    Get the full scoreboard
 * @access  Public
 */
router.get('/matches/:id/scoreboard', eventController.getScoreboard);

/**
 * @route   GET /api/matches/:id/report
 * @desc    Get comprehensive match report
 * @access  Public
 */
router.get('/matches/:id/report', eventController.getMatchReport);

module.exports = router;
