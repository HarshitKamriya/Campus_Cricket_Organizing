'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const matchRoutes = require('./match.routes');
const eventRoutes = require('./event.routes');
const teamRoutes = require('./team.routes');
const playerRoutes = require('./player.routes');

/**
 * Mount all API routes under /api.
 *
 * Route structure:
 *   /api/auth      - Authentication (login, register, me)
 *   /api/matches   - Match CRUD and lifecycle
 *   /api/matches   - Ball events (nested under matches via event routes)
 *   /api/teams     - Team listing
 *   /api/players   - Player info and stats
 */
router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/', eventRoutes); // event routes have /matches/:id/events paths built in
router.use('/teams', teamRoutes);
router.use('/players', playerRoutes);

module.exports = router;
