'use strict';

const db = require('../models');
const { Player, Team, BallEvent } = db;
const scoringEngine = require('../services/scoringEngine');

/**
 * Get a single player by ID with team info.
 * GET /api/players/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getPlayer(req, res) {
  try {
    const player = await Player.findByPk(req.params.id, {
      include: [{ model: Team, as: 'team' }],
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    return res.json({ player });
  } catch (err) {
    console.error('getPlayer error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get comprehensive batting and bowling stats for a player across all matches.
 * GET /api/players/:id/stats
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getPlayerStats(req, res) {
  try {
    const playerId = parseInt(req.params.id, 10);

    const player = await Player.findByPk(playerId, {
      include: [{ model: Team, as: 'team' }],
    });

    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    // Get all non-undone events where this player was involved
    const { Op } = db.Sequelize;

    // Batting events: where player was the batsman
    const battingEvents = await BallEvent.findAll({
      where: {
        is_undone: false,
        [Op.or]: [{ batsman_id: playerId }, { dismissed_player_id: playerId }],
      },
      order: [['created_at', 'ASC']],
    });

    // Bowling events: where player was the bowler
    const bowlingEvents = await BallEvent.findAll({
      where: {
        is_undone: false,
        bowler_id: playerId,
      },
      order: [['created_at', 'ASC']],
    });

    // Group batting events by innings for per-innings breakdown
    const battingByInnings = {};
    for (const e of battingEvents) {
      if (!battingByInnings[e.innings_id]) {
        battingByInnings[e.innings_id] = [];
      }
      battingByInnings[e.innings_id].push(e.toJSON());
    }

    // Group bowling events by innings
    const bowlingByInnings = {};
    for (const e of bowlingEvents) {
      if (!bowlingByInnings[e.innings_id]) {
        bowlingByInnings[e.innings_id] = [];
      }
      bowlingByInnings[e.innings_id].push(e.toJSON());
    }

    // Calculate overall batting stats
    const allBattingEvents = battingEvents.map((e) => e.toJSON());
    const overallBatting = scoringEngine.calculateBatsmanStats(allBattingEvents, playerId);

    // Calculate overall bowling stats
    const allBowlingEvents = bowlingEvents.map((e) => e.toJSON());
    const overallBowling = scoringEngine.calculateBowlerStats(allBowlingEvents, playerId);

    // Per-innings batting breakdown
    const battingInnings = Object.entries(battingByInnings).map(([inningsId, events]) => ({
      inningsId: parseInt(inningsId, 10),
      ...scoringEngine.calculateBatsmanStats(events, playerId),
    }));

    // Per-innings bowling breakdown
    const bowlingInnings = Object.entries(bowlingByInnings).map(([inningsId, events]) => ({
      inningsId: parseInt(inningsId, 10),
      ...scoringEngine.calculateBowlerStats(events, playerId),
    }));

    // Aggregate stats
    const matchesPlayed = new Set([
      ...battingEvents.map((e) => e.match_id),
      ...bowlingEvents.map((e) => e.match_id),
    ]).size;

    return res.json({
      player: {
        id: player.id,
        name: player.name,
        role: player.role,
        team: player.team ? { id: player.team.id, name: player.team.name } : null,
      },
      matchesPlayed,
      batting: {
        overall: overallBatting,
        byInnings: battingInnings,
      },
      bowling: {
        overall: overallBowling,
        byInnings: bowlingInnings,
      },
    });
  } catch (err) {
    console.error('getPlayerStats error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getPlayer,
  getPlayerStats,
};
