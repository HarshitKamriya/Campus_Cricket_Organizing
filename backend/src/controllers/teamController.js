'use strict';

const db = require('../models');
const { Team, Player } = db;

/**
 * Get all teams with their players.
 * GET /api/teams
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getAllTeams(req, res) {
  try {
    const teams = await Team.findAll({
      include: [{ model: Player, as: 'players' }],
      order: [['name', 'ASC']],
    });

    return res.json({ teams });
  } catch (err) {
    console.error('getAllTeams error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get a single team by ID with players.
 * GET /api/teams/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getTeam(req, res) {
  try {
    const team = await Team.findByPk(req.params.id, {
      include: [{ model: Player, as: 'players' }],
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found.' });
    }

    return res.json({ team });
  } catch (err) {
    console.error('getTeam error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  getAllTeams,
  getTeam,
};
