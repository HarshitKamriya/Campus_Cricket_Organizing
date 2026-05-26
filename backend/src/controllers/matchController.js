'use strict';

const db = require('../models');
const { Match, Team, Innings, User, BallEvent, Player } = db;
const scoringEngine = require('../services/scoringEngine');

/**
 * Create a new match and its two innings records.
 * POST /api/matches
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function createMatch(req, res) {
  const t = await db.sequelize.transaction();
  try {
    const {
      title,
      venue,
      total_overs,
      team_a,
      team_b,
      toss_winner,   // 'team_a' or 'team_b'
      toss_decision, // 'bat' or 'bowl'
      start_time,
    } = req.body;

    if (!title || !team_a || !team_b) {
      return res.status(400).json({ error: 'title, team_a, and team_b are required.' });
    }

    if (!team_a.name || !team_b.name) {
      return res.status(400).json({ error: 'Both teams must have a name.' });
    }

    if (!team_a.players || team_a.players.length !== 11) {
      return res.status(400).json({ error: 'Team A must have exactly 11 players.' });
    }

    if (!team_b.players || team_b.players.length !== 11) {
      return res.status(400).json({ error: 'Team B must have exactly 11 players.' });
    }

    // Create Team A
    const teamA = await Team.create({
      name: team_a.name,
      short_name: team_a.short_name || team_a.name.substring(0, 5).toUpperCase(),
    }, { transaction: t });

    // Create Team B
    const teamB = await Team.create({
      name: team_b.name,
      short_name: team_b.short_name || team_b.name.substring(0, 5).toUpperCase(),
    }, { transaction: t });

    // Create players for Team A
    const teamAPlayers = team_a.players.map(p => ({
      name: p.name,
      role: p.role || 'all-rounder',
      team_id: teamA.id,
    }));
    await Player.bulkCreate(teamAPlayers, { transaction: t });

    // Create players for Team B
    const teamBPlayers = team_b.players.map(p => ({
      name: p.name,
      role: p.role || 'all-rounder',
      team_id: teamB.id,
    }));
    await Player.bulkCreate(teamBPlayers, { transaction: t });

    // Determine batting order from toss
    let firstBattingTeamId = teamA.id;
    let firstBowlingTeamId = teamB.id;

    const tossWinnerId = toss_winner === 'team_b' ? teamB.id : teamA.id;

    if (toss_winner && toss_decision) {
      if (toss_decision === 'bat') {
        firstBattingTeamId = tossWinnerId;
        firstBowlingTeamId = tossWinnerId === teamA.id ? teamB.id : teamA.id;
      } else {
        firstBowlingTeamId = tossWinnerId;
        firstBattingTeamId = tossWinnerId === teamA.id ? teamB.id : teamA.id;
      }
    }

    const match = await Match.create({
      title,
      venue: venue || 'NIT Srinagar',
      total_overs: total_overs || 20,
      team_a_id: teamA.id,
      team_b_id: teamB.id,
      toss_winner_id: tossWinnerId || null,
      toss_decision: toss_decision || null,
      created_by: req.user.id,
      start_time: start_time || null,
    }, { transaction: t });

    // Create two innings records
    await Innings.bulkCreate([
      {
        match_id: match.id,
        batting_team_id: firstBattingTeamId,
        bowling_team_id: firstBowlingTeamId,
        innings_number: 1,
        status: 'upcoming',
      },
      {
        match_id: match.id,
        batting_team_id: firstBowlingTeamId,
        bowling_team_id: firstBattingTeamId,
        innings_number: 2,
        status: 'upcoming',
      },
    ], { transaction: t });

    await t.commit();

    // Fetch complete match with associations
    const fullMatch = await Match.findByPk(match.id, {
      include: [
        { model: Team, as: 'TeamA', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'TeamB', include: [{ model: Player, as: 'players' }] },
        { model: Innings, as: 'innings' },
        { model: User, as: 'Creator', attributes: ['id', 'username', 'name'] },
      ],
    });

    return res.status(201).json({ match: fullMatch });
  } catch (err) {
    await t.rollback();
    console.error('createMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get all matches with team info.
 * GET /api/matches
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getAllMatches(req, res) {
  try {
    const matches = await Match.findAll({
      include: [
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
        { model: Team, as: 'Winner' },
      ],
      order: [['created_at', 'DESC']],
    });

    return res.json({ matches });
  } catch (err) {
    console.error('getAllMatches error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get a single match by ID with all associations.
 * GET /api/matches/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getMatch(req, res) {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [
        { model: Team, as: 'TeamA', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'TeamB', include: [{ model: Player, as: 'players' }] },
        { model: Team, as: 'TossWinner' },
        { model: Team, as: 'Winner' },
        { model: Innings, as: 'innings', order: [['innings_number', 'ASC']] },
        { model: User, as: 'Creator', attributes: ['id', 'username', 'name'] },
      ],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    return res.json({ match });
  } catch (err) {
    console.error('getMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Update match fields.
 * PUT /api/matches/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function updateMatch(req, res) {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const allowedFields = [
      'title',
      'venue',
      'status',
      'total_overs',
      'toss_winner_id',
      'toss_decision',
      'winner_id',
      'result_summary',
      'start_time',
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    await match.update(updates);

    const updatedMatch = await Match.findByPk(match.id, {
      include: [
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
        { model: Innings, as: 'innings' },
      ],
    });

    return res.json({ match: updatedMatch });
  } catch (err) {
    console.error('updateMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Start a match — set status to 'live' and first innings to 'in_progress'.
 * POST /api/matches/:id/start
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function startMatch(req, res) {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [{ model: Innings, as: 'innings', order: [['innings_number', 'ASC']] }],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (match.status !== 'upcoming') {
      return res.status(400).json({ error: `Cannot start a match with status '${match.status}'.` });
    }

    // Update match status
    await match.update({
      status: 'live',
      start_time: new Date(),
    });

    // Set first innings to in_progress
    const firstInnings = match.innings.find((i) => i.innings_number === 1);
    if (firstInnings) {
      await firstInnings.update({ status: 'in_progress' });
    }

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${match.id}`).emit('match:update', {
        type: 'match_started',
        matchId: match.id,
        status: 'live',
      });
    }

    const updatedMatch = await Match.findByPk(match.id, {
      include: [
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
        { model: Innings, as: 'innings' },
      ],
    });

    return res.json({ match: updatedMatch, message: 'Match started successfully.' });
  } catch (err) {
    console.error('startMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * End the current innings. If 1st innings, start the 2nd. If 2nd, complete the match.
 * POST /api/matches/:id/end-innings
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function endInnings(req, res) {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [
        { model: Innings, as: 'innings', order: [['innings_number', 'ASC']] },
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
      ],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    // Find the current in-progress innings
    const currentInnings = match.innings.find((i) => i.status === 'in_progress');
    if (!currentInnings) {
      return res.status(400).json({ error: 'No innings currently in progress.' });
    }

    // Recalculate totals from events
    const events = await BallEvent.findAll({
      where: { innings_id: currentInnings.id, is_undone: false },
      order: [['over_number', 'ASC'], ['ball_in_over', 'ASC']],
    });

    const totals = scoringEngine.calculateInningsTotals(events);

    // Complete current innings
    await currentInnings.update({
      status: 'completed',
      total_runs: totals.totalRuns,
      total_wickets: totals.totalWickets,
      total_overs: totals.totalOvers,
      total_balls: totals.totalBalls,
      extras_wide: totals.extras.wide,
      extras_noball: totals.extras.noBall,
      extras_bye: totals.extras.bye,
      extras_legbye: totals.extras.legBye,
    });

    let message = '';

    if (currentInnings.innings_number === 1) {
      // Start second innings with target
      const secondInnings = match.innings.find((i) => i.innings_number === 2);
      if (secondInnings) {
        const target = totals.totalRuns + 1;
        await secondInnings.update({
          status: 'in_progress',
          target,
        });
        message = `First innings completed. ${totals.totalRuns}/${totals.totalWickets}. Target: ${target}`;
      }
    } else {
      // Second innings ended — determine winner
      const firstInnings = match.innings.find((i) => i.innings_number === 1);
      const firstInningsRuns = firstInnings.total_runs;
      const secondInningsRuns = totals.totalRuns;

      let winnerId = null;
      let resultSummary = '';

      if (secondInningsRuns > firstInningsRuns) {
        winnerId = currentInnings.batting_team_id;
        const wicketsRemaining = 10 - totals.totalWickets;
        const winnerTeam = match.TeamA && match.TeamA.id === winnerId ? match.TeamA : match.TeamB;
        resultSummary = `${winnerTeam.name} won by ${wicketsRemaining} wickets`;
      } else if (firstInningsRuns > secondInningsRuns) {
        winnerId = firstInnings.batting_team_id;
        const runDiff = firstInningsRuns - secondInningsRuns;
        const winnerTeam = match.TeamA && match.TeamA.id === winnerId ? match.TeamA : match.TeamB;
        resultSummary = `${winnerTeam.name} won by ${runDiff} runs`;
      } else {
        resultSummary = 'Match tied';
      }

      await match.update({
        status: 'completed',
        winner_id: winnerId,
        result_summary: resultSummary,
      });

      message = `Match completed. ${resultSummary}`;
    }

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${match.id}`).emit('match:update', {
        type: 'innings_ended',
        matchId: match.id,
        inningsNumber: currentInnings.innings_number,
        message,
      });
    }

    const updatedMatch = await Match.findByPk(match.id, {
      include: [
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
        { model: Team, as: 'Winner' },
        { model: Innings, as: 'innings' },
      ],
    });

    return res.json({ match: updatedMatch, message });
  } catch (err) {
    console.error('endInnings error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * End a match (force-complete or abandon).
 * POST /api/matches/:id/end
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function endMatch(req, res) {
  try {
    const match = await Match.findByPk(req.params.id, {
      include: [
        { model: Innings, as: 'innings' },
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
      ],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const { status, winner_id, result_summary } = req.body;

    // Complete all in-progress innings
    for (const innings of match.innings) {
      if (innings.status === 'in_progress') {
        const events = await BallEvent.findAll({
          where: { innings_id: innings.id, is_undone: false },
          order: [['over_number', 'ASC'], ['ball_in_over', 'ASC']],
        });
        const totals = scoringEngine.calculateInningsTotals(events);

        await innings.update({
          status: 'completed',
          total_runs: totals.totalRuns,
          total_wickets: totals.totalWickets,
          total_overs: totals.totalOvers,
          total_balls: totals.totalBalls,
          extras_wide: totals.extras.wide,
          extras_noball: totals.extras.noBall,
          extras_bye: totals.extras.bye,
          extras_legbye: totals.extras.legBye,
        });
      }
    }

    await match.update({
      status: status || 'completed',
      winner_id: winner_id || null,
      result_summary: result_summary || 'Match ended',
    });

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${match.id}`).emit('match:update', {
        type: 'match_ended',
        matchId: match.id,
        status: match.status,
        resultSummary: match.result_summary,
      });
    }

    const updatedMatch = await Match.findByPk(match.id, {
      include: [
        { model: Team, as: 'TeamA' },
        { model: Team, as: 'TeamB' },
        { model: Team, as: 'Winner' },
        { model: Innings, as: 'innings' },
      ],
    });

    return res.json({ match: updatedMatch, message: 'Match ended.' });
  } catch (err) {
    console.error('endMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Delete a match by ID.
 * DELETE /api/matches/:id
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function deleteMatch(req, res) {
  try {
    const match = await Match.findByPk(req.params.id);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }
    
    await match.destroy();
    
    return res.json({ message: 'Match deleted successfully.' });
  } catch (err) {
    console.error('deleteMatch error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  createMatch,
  getAllMatches,
  getMatch,
  updateMatch,
  startMatch,
  endInnings,
  endMatch,
  deleteMatch,
};
