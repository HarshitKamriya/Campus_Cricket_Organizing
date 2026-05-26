'use strict';

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

/**
 * @route   GET /api/teams
 * @desc    Get all teams
 * @access  Public
 */
router.get('/', teamController.getAllTeams);

/**
 * @route   GET /api/teams/:id
 * @desc    Get team by ID
 * @access  Public
 */
router.get('/:id', teamController.getTeam);

module.exports = router;
