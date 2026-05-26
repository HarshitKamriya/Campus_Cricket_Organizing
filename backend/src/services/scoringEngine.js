'use strict';

/**
 * Cricket Scoring Engine — pure functions for calculating cricket statistics.
 * This is the core logic module of the Campus Cricket application.
 *
 * @module scoringEngine
 */

/**
 * Calculate comprehensive innings totals from ball events.
 *
 * @param {Array<Object>} events - Array of BallEvent objects (raw or Sequelize instances)
 * @returns {Object} Innings totals breakdown
 */
function calculateInningsTotals(events) {
  // Filter out undone events
  const activeEvents = events.filter((e) => !e.is_undone);

  let totalRuns = 0;
  let totalWickets = 0;
  let legalBalls = 0;
  const extras = { wide: 0, noBall: 0, bye: 0, legBye: 0, total: 0 };

  for (const event of activeEvents) {
    // Total runs = runs scored by bat + extras runs
    totalRuns += (event.runs_scored || 0) + (event.extras_runs || 0);

    // Count wickets
    if (event.is_wicket) {
      totalWickets++;
    }

    // Legal balls: not wide and not no-ball
    if (event.extras_type !== 'wide' && event.extras_type !== 'no_ball') {
      legalBalls++;
    }

    // Extras breakdown
    switch (event.extras_type) {
      case 'wide':
        extras.wide += event.extras_runs || 0;
        break;
      case 'no_ball':
        extras.noBall += event.extras_runs || 0;
        break;
      case 'bye':
        extras.bye += event.extras_runs || 0;
        break;
      case 'leg_bye':
        extras.legBye += event.extras_runs || 0;
        break;
      default:
        break;
    }
  }

  extras.total = extras.wide + extras.noBall + extras.bye + extras.legBye;

  const totalOvers = Math.floor(legalBalls / 6);
  const totalBalls = legalBalls % 6;

  return {
    totalRuns,
    totalWickets,
    totalOvers,
    totalBalls,
    legalBalls,
    extras,
  };
}

/**
 * Calculate batting statistics for a specific player in an innings.
 *
 * @param {Array<Object>} events - All non-undone events in the innings
 * @param {number} playerId - The player's ID
 * @returns {Object} Batsman statistics
 */
function calculateBatsmanStats(events, playerId) {
  const activeEvents = events.filter((e) => !e.is_undone);

  // Events where this player was the striker
  const batsmanEvents = activeEvents.filter((e) => e.batsman_id === playerId);

  // Batsman runs: runs_scored is credited to batsman (byes/leg-byes have runs_scored = 0)
  let runs = 0;
  let ballsFaced = 0;
  let fours = 0;
  let sixes = 0;

  for (const event of batsmanEvents) {
    runs += event.runs_scored || 0;

    // Wides don't count as balls faced
    if (event.extras_type !== 'wide') {
      ballsFaced++;
    }

    if (event.is_boundary_four) {
      fours++;
    }
    if (event.is_boundary_six) {
      sixes++;
    }
  }

  // Check if dismissed (could be dismissed as non-striker in run-out)
  const dismissalEvent = activeEvents.find(
    (e) => e.is_wicket && e.dismissed_player_id === playerId
  );

  const isOut = !!dismissalEvent;
  const dismissalType = dismissalEvent ? dismissalEvent.wicket_type : null;
  const dismissalBowlerId = dismissalEvent ? dismissalEvent.bowler_id : null;

  const strikeRate = ballsFaced > 0 ? ((runs / ballsFaced) * 100).toFixed(2) : '0.00';

  return {
    runs,
    ballsFaced,
    fours,
    sixes,
    strikeRate: parseFloat(strikeRate),
    isOut,
    dismissalType,
    dismissalBowlerId,
  };
}

/**
 * Calculate bowling statistics for a specific player in an innings.
 *
 * @param {Array<Object>} events - All non-undone events in the innings
 * @param {number} playerId - The bowler's player ID
 * @returns {Object} Bowler statistics
 */
function calculateBowlerStats(events, playerId) {
  const activeEvents = events.filter((e) => !e.is_undone);
  const bowlerEvents = activeEvents.filter((e) => e.bowler_id === playerId);

  let legalBalls = 0;
  let runsConceded = 0;
  let wickets = 0;
  let dotBalls = 0;

  // Group events by over for maiden calculation
  const overMap = {};

  for (const event of bowlerEvents) {
    const isLegal = event.extras_type !== 'wide' && event.extras_type !== 'no_ball';

    if (isLegal) {
      legalBalls++;
    }

    // Runs conceded: all runs except byes and leg-byes (those don't count against bowler)
    if (event.extras_type === 'none' || event.extras_type === 'wide' || event.extras_type === 'no_ball') {
      runsConceded += (event.runs_scored || 0) + (event.extras_runs || 0);
    }

    // Wickets: exclude run-outs (not credited to bowler)
    if (event.is_wicket && event.wicket_type !== 'run_out') {
      wickets++;
    }

    // Dot balls: no runs scored and no extras
    if ((event.runs_scored || 0) === 0 && (event.extras_runs || 0) === 0) {
      dotBalls++;
    }

    // Group for maiden calculation
    if (!overMap[event.over_number]) {
      overMap[event.over_number] = [];
    }
    overMap[event.over_number].push(event);
  }

  // Calculate maidens: complete overs (6 legal balls) with 0 runs conceded
  let maidens = 0;
  for (const overNum of Object.keys(overMap)) {
    const overEvents = overMap[overNum];
    const overLegalBalls = overEvents.filter(
      (e) => e.extras_type !== 'wide' && e.extras_type !== 'no_ball'
    ).length;
    const overRuns = overEvents.reduce((sum, e) => {
      if (e.extras_type === 'none' || e.extras_type === 'wide' || e.extras_type === 'no_ball') {
        return sum + (e.runs_scored || 0) + (e.extras_runs || 0);
      }
      return sum;
    }, 0);

    if (overLegalBalls === 6 && overRuns === 0) {
      maidens++;
    }
  }

  const overs = Math.floor(legalBalls / 6);
  const oversBalls = legalBalls % 6;
  const totalOversDecimal = legalBalls / 6;
  const economy = totalOversDecimal > 0 ? (runsConceded / totalOversDecimal).toFixed(2) : '0.00';

  return {
    overs,
    oversBalls,
    oversDisplay: `${overs}.${oversBalls}`,
    maidens,
    runsConceded,
    wickets,
    economy: parseFloat(economy),
    dotBalls,
  };
}

/**
 * Calculate the current run rate.
 *
 * @param {number} runs - Total runs scored
 * @param {number} overs - Completed overs
 * @param {number} balls - Balls in current over
 * @returns {string} Current run rate formatted to 2 decimals
 */
function calculateRunRate(runs, overs, balls) {
  const totalOvers = overs + balls / 6;
  return totalOvers > 0 ? (runs / totalOvers).toFixed(2) : '0.00';
}

/**
 * Calculate the required run rate for a chase.
 *
 * @param {number} target - Target score to chase
 * @param {number} currentRuns - Runs scored so far
 * @param {number} totalOvers - Total overs in the match
 * @param {number} oversCompleted - Overs completed so far
 * @param {number} ballsInCurrentOver - Balls bowled in current over
 * @returns {string} Required run rate or 'N/A'
 */
function calculateRequiredRunRate(target, currentRuns, totalOvers, oversCompleted, ballsInCurrentOver) {
  const remainingRuns = target - currentRuns;
  const oversRemaining = totalOvers - oversCompleted - ballsInCurrentOver / 6;
  if (oversRemaining <= 0) return 'N/A';
  return (remainingRuns / oversRemaining).toFixed(2);
}

/**
 * Get the current over's ball-by-ball display data.
 *
 * @param {Array<Object>} events - All active events in the innings
 * @param {number} currentOver - The current over number (0-indexed)
 * @returns {Array<string>} Array of ball display strings (e.g., ['0', '1', '4', 'W', 'Wd', '6'])
 */
function getCurrentOverBalls(events, currentOver) {
  const activeEvents = events.filter((e) => !e.is_undone);
  const overEvents = activeEvents.filter((e) => e.over_number === currentOver);

  return overEvents.map((event) => {
    const parts = [];

    // Extras prefix
    if (event.extras_type === 'wide') {
      parts.push('Wd');
      if (event.extras_runs > 1) {
        parts.push(`+${event.extras_runs - 1}`);
      }
    } else if (event.extras_type === 'no_ball') {
      parts.push('Nb');
      if (event.runs_scored > 0) {
        parts.push(`+${event.runs_scored}`);
      }
    } else if (event.extras_type === 'bye') {
      parts.push(`${event.extras_runs}b`);
    } else if (event.extras_type === 'leg_bye') {
      parts.push(`${event.extras_runs}lb`);
    } else if (event.is_wicket) {
      parts.push('W');
    } else if (event.is_boundary_six) {
      parts.push('6');
    } else if (event.is_boundary_four) {
      parts.push('4');
    } else {
      parts.push(String(event.runs_scored || 0));
    }

    // Append wicket marker if also a wicket on extras
    if (event.is_wicket && event.extras_type !== 'none') {
      parts.push('+W');
    }

    return parts.join('');
  });
}

/**
 * Get fall of wickets data for an innings.
 *
 * @param {Array<Object>} events - All active events in the innings
 * @param {Object} playerMap - Map of player IDs to player objects { id: { name, ... } }
 * @returns {Array<Object>} Fall of wickets array sorted by order
 */
function getFallOfWickets(events, playerMap) {
  const activeEvents = events.filter((e) => !e.is_undone);
  const wicketEvents = activeEvents.filter((e) => e.is_wicket);

  // Calculate running total at each wicket
  let runningTotal = 0;
  let wicketNumber = 0;
  const fow = [];

  for (const event of activeEvents) {
    runningTotal += (event.runs_scored || 0) + (event.extras_runs || 0);

    if (event.is_wicket) {
      wicketNumber++;
      const dismissedPlayer = playerMap[event.dismissed_player_id];
      const legalBallsSoFar = activeEvents
        .filter(
          (e) =>
            (e.over_number < event.over_number ||
              (e.over_number === event.over_number && e.ball_in_over <= event.ball_in_over)) &&
            e.extras_type !== 'wide' &&
            e.extras_type !== 'no_ball'
        )
        .length;

      const overs = Math.floor(legalBallsSoFar / 6);
      const balls = legalBallsSoFar % 6;

      fow.push({
        wicketNumber,
        playerName: dismissedPlayer ? dismissedPlayer.name : 'Unknown',
        playerId: event.dismissed_player_id,
        score: runningTotal,
        oversDisplay: `${overs}.${balls}`,
        wicketType: event.wicket_type,
      });
    }
  }

  return fow;
}

/**
 * Build a comprehensive scoreboard object for a match.
 * This is the primary payload sent to clients via Socket.IO.
 *
 * @param {Object} match - Match instance with associations
 * @param {Array<Object>} allInnings - Innings records for the match
 * @param {Object} eventsMap - Map of innings_id to array of BallEvent objects
 * @param {Object} playerMap - Map of player IDs to player objects
 * @returns {Object} Full scoreboard data
 */
function buildScoreboard(match, allInnings, eventsMap, playerMap) {
  const scoreboard = {
    match: {
      id: match.id,
      title: match.title,
      venue: match.venue,
      status: match.status,
      totalOvers: match.total_overs,
      teamA: match.TeamA
        ? { id: match.TeamA.id, name: match.TeamA.name, shortName: match.TeamA.short_name }
        : null,
      teamB: match.TeamB
        ? { id: match.TeamB.id, name: match.TeamB.name, shortName: match.TeamB.short_name }
        : null,
      tossWinner: match.TossWinner
        ? { id: match.TossWinner.id, name: match.TossWinner.name }
        : null,
      tossDecision: match.toss_decision,
      winner: match.Winner ? { id: match.Winner.id, name: match.Winner.name } : null,
      resultSummary: match.result_summary,
      startTime: match.start_time,
    },
    innings: [],
  };

  for (const innings of allInnings) {
    const events = eventsMap[innings.id] || [];
    const activeEvents = events.filter((e) => !e.is_undone);
    const totals = calculateInningsTotals(events);

    // Build batting scorecard: find all unique batsmen
    const batsmanIds = [...new Set(activeEvents.map((e) => e.batsman_id))];
    // Also include dismissed players who might have been non-strikers (run-out)
    const dismissedIds = activeEvents
      .filter((e) => e.is_wicket && e.dismissed_player_id)
      .map((e) => e.dismissed_player_id);
    const allBatsmanIds = [...new Set([...batsmanIds, ...dismissedIds])];

    const battingScorecard = allBatsmanIds.map((pid) => {
      const stats = calculateBatsmanStats(activeEvents, pid);
      const player = playerMap[pid];
      return {
        playerId: pid,
        playerName: player ? player.name : 'Unknown',
        ...stats,
      };
    });

    // Build bowling scorecard: find all unique bowlers
    const bowlerIds = [...new Set(activeEvents.map((e) => e.bowler_id))];
    const bowlingScorecard = bowlerIds.map((pid) => {
      const stats = calculateBowlerStats(activeEvents, pid);
      const player = playerMap[pid];
      return {
        playerId: pid,
        playerName: player ? player.name : 'Unknown',
        ...stats,
      };
    });

    // Determine current over number
    const lastEvent = activeEvents.length > 0 ? activeEvents[activeEvents.length - 1] : null;
    let currentOverNumber = 0;
    if (lastEvent) {
      const isLastBallLegal =
        lastEvent.extras_type !== 'wide' && lastEvent.extras_type !== 'no_ball';
      // If the last legal ball was ball 6, we've moved to the next over
      if (isLastBallLegal && lastEvent.ball_in_over >= 6) {
        currentOverNumber = lastEvent.over_number + 1;
      } else {
        currentOverNumber = lastEvent.over_number;
      }
    }

    const currentOverBalls = getCurrentOverBalls(activeEvents, currentOverNumber);
    const fallOfWickets = getFallOfWickets(activeEvents, playerMap);

    const runRate = calculateRunRate(totals.totalRuns, totals.totalOvers, totals.totalBalls);

    // Current batsmen on crease (last two batsmen who haven't been dismissed)
    const dismissedPlayerIds = new Set(
      activeEvents.filter((e) => e.is_wicket).map((e) => e.dismissed_player_id)
    );
    const currentBatsmen = battingScorecard.filter((b) => !b.isOut).slice(-2);

    // Current bowler (last event's bowler)
    const currentBowler = lastEvent
      ? bowlingScorecard.find((b) => b.playerId === lastEvent.bowler_id)
      : null;

    const inningsData = {
      id: innings.id,
      inningsNumber: innings.innings_number,
      status: innings.status,
      battingTeam: playerMap._teams
        ? playerMap._teams[innings.batting_team_id]
        : { id: innings.batting_team_id },
      bowlingTeam: playerMap._teams
        ? playerMap._teams[innings.bowling_team_id]
        : { id: innings.bowling_team_id },
      totals: {
        runs: totals.totalRuns,
        wickets: totals.totalWickets,
        overs: totals.totalOvers,
        balls: totals.totalBalls,
        oversDisplay: `${totals.totalOvers}.${totals.totalBalls}`,
        extras: totals.extras,
      },
      runRate: parseFloat(runRate),
      target: innings.target,
      requiredRunRate:
        innings.target && innings.innings_number === 2
          ? parseFloat(
              calculateRequiredRunRate(
                innings.target,
                totals.totalRuns,
                match.total_overs,
                totals.totalOvers,
                totals.totalBalls
              )
            ) || null
          : null,
      battingScorecard,
      bowlingScorecard,
      currentOverBalls,
      currentBatsmen,
      currentBowler,
      fallOfWickets,
    };

    scoreboard.innings.push(inningsData);
  }

  return scoreboard;
}

/**
 * Generate auto-commentary for a ball event.
 *
 * @param {Object} event - The BallEvent data
 * @param {Object} playerMap - Map of player IDs to player objects
 * @returns {string} Commentary string
 */
function generateCommentary(event, playerMap) {
  const batsman = playerMap[event.batsman_id]?.name || 'Batsman';
  const bowler = playerMap[event.bowler_id]?.name || 'Bowler';
  const parts = [];

  parts.push(`${bowler} to ${batsman},`);

  if (event.is_wicket) {
    const dismissed = playerMap[event.dismissed_player_id]?.name || 'batsman';
    parts.push(`OUT! ${dismissed} is ${event.wicket_type}!`);
  } else if (event.extras_type === 'wide') {
    parts.push(`wide ball, ${event.extras_runs} run(s)`);
  } else if (event.extras_type === 'no_ball') {
    parts.push(`no ball! ${event.runs_scored} run(s) off the bat`);
  } else if (event.extras_type === 'bye') {
    parts.push(`${event.extras_runs} bye(s)`);
  } else if (event.extras_type === 'leg_bye') {
    parts.push(`${event.extras_runs} leg bye(s)`);
  } else if (event.is_boundary_six) {
    parts.push('SIX! Massive hit!');
  } else if (event.is_boundary_four) {
    parts.push('FOUR! Beautiful shot!');
  } else if (event.runs_scored === 0) {
    parts.push('dot ball');
  } else {
    parts.push(`${event.runs_scored} run(s)`);
  }

  return parts.join(' ');
}

module.exports = {
  calculateInningsTotals,
  calculateBatsmanStats,
  calculateBowlerStats,
  calculateRunRate,
  calculateRequiredRunRate,
  getCurrentOverBalls,
  getFallOfWickets,
  buildScoreboard,
  generateCommentary,
};
