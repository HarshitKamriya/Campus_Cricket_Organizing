'use strict';

const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

/**
 * @route   GET /api/players/:id
 * @desc    Get player by ID
 * @access  Public
 */
router.get('/:id', playerController.getPlayer);

/**
 * @route   GET /api/players/:id/stats
 * @desc    Get player stats across all matches
 * @access  Public
 */
router.get('/:id/stats', playerController.getPlayerStats);

module.exports = router;
