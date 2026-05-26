'use strict';

const db = require('../models');
const { BallEvent, Innings, Match, Team, Player, User } = db;
const scoringEngine = require('../services/scoringEngine');

/**
 * Build a player map (id -> player object) for a match.
 * @param {number} matchId
 * @returns {Object} Player map with _teams metadata
 */
async function buildPlayerMap(matchId) {
  const match = await Match.findByPk(matchId, {
    include: [
      { model: Team, as: 'TeamA', include: [{ model: Player, as: 'players' }] },
      { model: Team, as: 'TeamB', include: [{ model: Player, as: 'players' }] },
    ],
  });

  const playerMap = {};
  const allPlayers = [
    ...(match.TeamA?.players || []),
    ...(match.TeamB?.players || []),
  ];

  for (const p of allPlayers) {
    playerMap[p.id] = { id: p.id, name: p.name, role: p.role, teamId: p.team_id };
  }

  // Attach teams info for scoreboard building
  playerMap._teams = {};
  if (match.TeamA) {
    playerMap._teams[match.TeamA.id] = {
      id: match.TeamA.id,
      name: match.TeamA.name,
      shortName: match.TeamA.short_name,
    };
  }
  if (match.TeamB) {
    playerMap._teams[match.TeamB.id] = {
      id: match.TeamB.id,
      name: match.TeamB.name,
      shortName: match.TeamB.short_name,
    };
  }

  return playerMap;
}

/**
 * Build the full scoreboard for a match.
 * @param {number} matchId
 * @returns {Object} Complete scoreboard
 */
async function buildFullScoreboard(matchId) {
  const match = await Match.findByPk(matchId, {
    include: [
      { model: Team, as: 'TeamA' },
      { model: Team, as: 'TeamB' },
      { model: Team, as: 'TossWinner' },
      { model: Team, as: 'Winner' },
      { model: Innings, as: 'innings', order: [['innings_number', 'ASC']] },
    ],
  });

  const allInnings = match.innings || [];
  const playerMap = await buildPlayerMap(matchId);

  // Build events map: innings_id -> events[]
  const eventsMap = {};
  for (const inning of allInnings) {
    const events = await BallEvent.findAll({
      where: { innings_id: inning.id, is_undone: false },
      order: [
        ['over_number', 'ASC'],
        ['ball_in_over', 'ASC'],
        ['id', 'ASC'],
      ],
    });
    eventsMap[inning.id] = events.map((e) => e.toJSON());
  }

  return scoringEngine.buildScoreboard(match, allInnings, eventsMap, playerMap);
}

/**
 * Add a new ball event (delivery) to the current innings.
 * POST /api/matches/:id/events
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function addBallEvent(req, res) {
  try {
    const matchId = parseInt(req.params.id, 10);

    // Find the match
    const match = await Match.findByPk(matchId, {
      include: [{ model: Innings, as: 'innings' }],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    if (match.status !== 'live') {
      return res.status(400).json({ error: 'Match is not live.' });
    }

    // Find in-progress innings
    const currentInnings = match.innings.find((i) => i.status === 'in_progress');
    if (!currentInnings) {
      return res.status(400).json({ error: 'No innings currently in progress.' });
    }

    const {
      runs_scored,
      is_boundary_four,
      is_boundary_six,
      extras_type,
      extras_runs,
      is_wicket,
      wicket_type,
      batsman_id,
      non_striker_id,
      bowler_id,
      dismissed_player_id,
    } = req.body;

    // Validate required fields
    if (batsman_id === undefined || bowler_id === undefined) {
      return res.status(400).json({ error: 'batsman_id and bowler_id are required.' });
    }

    // Determine over_number and ball_in_over from last event
    const lastEvent = await BallEvent.findOne({
      where: { innings_id: currentInnings.id, is_undone: false },
      order: [
        ['over_number', 'DESC'],
        ['ball_in_over', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    let overNumber = 0;
    let ballInOver = 1;

    if (lastEvent) {
      const lastExtrasType = lastEvent.extras_type;
      const isLastLegal = lastExtrasType !== 'wide' && lastExtrasType !== 'no_ball';

      if (isLastLegal && lastEvent.ball_in_over >= 6) {
        // Over completed, move to next over
        overNumber = lastEvent.over_number + 1;
        ballInOver = 1;
      } else if (isLastLegal) {
        // Same over, increment ball
        overNumber = lastEvent.over_number;
        ballInOver = lastEvent.ball_in_over + 1;
      } else {
        // Last ball was illegal (wide/no-ball), same ball number continues
        overNumber = lastEvent.over_number;
        ballInOver = lastEvent.ball_in_over;
      }
    }

    // Check if overs exceeded
    if (overNumber >= match.total_overs) {
      return res.status(400).json({ error: 'All overs have been bowled in this innings.' });
    }

    // Build player map for commentary
    const playerMap = await buildPlayerMap(matchId);

    // Prepare event data
    const eventData = {
      match_id: matchId,
      innings_id: currentInnings.id,
      over_number: overNumber,
      ball_in_over: ballInOver,
      runs_scored: runs_scored || 0,
      is_boundary_four: is_boundary_four || false,
      is_boundary_six: is_boundary_six || false,
      extras_type: extras_type || 'none',
      extras_runs: extras_runs || 0,
      is_wicket: is_wicket || false,
      wicket_type: is_wicket ? wicket_type : null,
      batsman_id,
      non_striker_id: non_striker_id || null,
      bowler_id,
      dismissed_player_id: is_wicket ? dismissed_player_id : null,
      scorer_id: req.user.id,
      is_undone: false,
    };

    // Generate commentary
    eventData.commentary = scoringEngine.generateCommentary(eventData, playerMap);

    // Create ball event
    const ballEvent = await BallEvent.create(eventData);

    // Recalculate innings totals
    const allEvents = await BallEvent.findAll({
      where: { innings_id: currentInnings.id, is_undone: false },
      order: [['over_number', 'ASC'], ['ball_in_over', 'ASC'], ['id', 'ASC']],
    });

    const totals = scoringEngine.calculateInningsTotals(allEvents);

    // Update innings record
    await currentInnings.update({
      total_runs: totals.totalRuns,
      total_wickets: totals.totalWickets,
      total_overs: totals.totalOvers,
      total_balls: totals.totalBalls,
      extras_wide: totals.extras.wide,
      extras_noball: totals.extras.noBall,
      extras_bye: totals.extras.bye,
      extras_legbye: totals.extras.legBye,
    });

    // Build updated scoreboard
    const scoreboard = await buildFullScoreboard(matchId);

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('event:new', {
        event: ballEvent.toJSON(),
        commentary: eventData.commentary,
      });
      io.to(`match:${matchId}`).emit('match:update', scoreboard);
    }

    return res.status(201).json({
      event: ballEvent,
      scoreboard,
    });
  } catch (err) {
    console.error('addBallEvent error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get all ball events for a match, optionally filtered by innings.
 * GET /api/matches/:id/events
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getEvents(req, res) {
  try {
    const matchId = parseInt(req.params.id, 10);
    const { innings_id } = req.query;

    const where = { match_id: matchId, is_undone: false };
    if (innings_id) {
      where.innings_id = parseInt(innings_id, 10);
    }

    const events = await BallEvent.findAll({
      where,
      include: [
        { model: Player, as: 'Batsman', attributes: ['id', 'name'] },
        { model: Player, as: 'NonStriker', attributes: ['id', 'name'] },
        { model: Player, as: 'Bowler', attributes: ['id', 'name'] },
        { model: Player, as: 'DismissedPlayer', attributes: ['id', 'name'] },
        { model: User, as: 'Scorer', attributes: ['id', 'username', 'name'] },
      ],
      order: [
        ['over_number', 'ASC'],
        ['ball_in_over', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    return res.json({ events });
  } catch (err) {
    console.error('getEvents error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Undo the last ball event in the current innings.
 * POST /api/matches/:id/undo
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function undoLastEvent(req, res) {
  try {
    const matchId = parseInt(req.params.id, 10);

    const match = await Match.findByPk(matchId, {
      include: [{ model: Innings, as: 'innings' }],
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    // Find the in-progress innings
    const currentInnings = match.innings.find((i) => i.status === 'in_progress');
    if (!currentInnings) {
      return res.status(400).json({ error: 'No innings currently in progress.' });
    }

    // Find the last non-undone event
    const lastEvent = await BallEvent.findOne({
      where: { innings_id: currentInnings.id, is_undone: false },
      order: [
        ['over_number', 'DESC'],
        ['ball_in_over', 'DESC'],
        ['id', 'DESC'],
      ],
    });

    if (!lastEvent) {
      return res.status(400).json({ error: 'No events to undo.' });
    }

    // Mark as undone
    await lastEvent.update({ is_undone: true });

    // Recalculate innings totals
    const allEvents = await BallEvent.findAll({
      where: { innings_id: currentInnings.id, is_undone: false },
      order: [['over_number', 'ASC'], ['ball_in_over', 'ASC'], ['id', 'ASC']],
    });

    const totals = scoringEngine.calculateInningsTotals(allEvents);

    await currentInnings.update({
      total_runs: totals.totalRuns,
      total_wickets: totals.totalWickets,
      total_overs: totals.totalOvers,
      total_balls: totals.totalBalls,
      extras_wide: totals.extras.wide,
      extras_noball: totals.extras.noBall,
      extras_bye: totals.extras.bye,
      extras_legbye: totals.extras.legBye,
    });

    // Build updated scoreboard
    const scoreboard = await buildFullScoreboard(matchId);

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`match:${matchId}`).emit('match:update', scoreboard);
    }

    return res.json({
      message: 'Last event undone.',
      undoneEvent: lastEvent,
      scoreboard,
    });
  } catch (err) {
    console.error('undoLastEvent error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get the full scoreboard for a match.
 * GET /api/matches/:id/scoreboard
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getScoreboard(req, res) {
  try {
    const matchId = parseInt(req.params.id, 10);

    const match = await Match.findByPk(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }

    const scoreboard = await buildFullScoreboard(matchId);
    return res.json({ scoreboard });
  } catch (err) {
    console.error('getScoreboard error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * Get a comprehensive match report.
 * GET /api/matches/:id/report
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function getMatchReport(req, res) {
  try {
    const matchId = parseInt(req.params.id, 10);

    const match = await Match.findByPk(matchId, {
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

    const playerMap = await buildPlayerMap(matchId);
    const scoreboard = await buildFullScoreboard(matchId);

    // Build event log for each innings
    const eventLog = {};
    for (const innings of match.innings) {
      const events = await BallEvent.findAll({
        where: { innings_id: innings.id, is_undone: false },
        include: [
          { model: Player, as: 'Batsman', attributes: ['id', 'name'] },
          { model: Player, as: 'Bowler', attributes: ['id', 'name'] },
          { model: Player, as: 'DismissedPlayer', attributes: ['id', 'name'] },
        ],
        order: [['over_number', 'ASC'], ['ball_in_over', 'ASC'], ['id', 'ASC']],
      });
      eventLog[`innings_${innings.innings_number}`] = events;
    }

    const report = {
      generatedAt: new Date().toISOString(),
      match: {
        id: match.id,
        title: match.title,
        venue: match.venue,
        status: match.status,
        totalOvers: match.total_overs,
        startTime: match.start_time,
        teamA: match.TeamA ? { id: match.TeamA.id, name: match.TeamA.name } : null,
        teamB: match.TeamB ? { id: match.TeamB.id, name: match.TeamB.name } : null,
        tossWinner: match.TossWinner ? match.TossWinner.name : null,
        tossDecision: match.toss_decision,
        winner: match.Winner ? match.Winner.name : null,
        resultSummary: match.result_summary,
        createdBy: match.Creator ? match.Creator.name : null,
      },
      scoreboard,
      eventLog,
    };

    return res.json(report);
  } catch (err) {
    console.error('getMatchReport error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = {
  addBallEvent,
  getEvents,
  undoLastEvent,
  getScoreboard,
  getMatchReport,
};
