'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const bcrypt = require('bcryptjs');
    const now = new Date();

    // --- Users ---
    const adminHash = bcrypt.hashSync('admin#123', 10);
    const scorerHash = bcrypt.hashSync('scorer#123', 10);

    await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        name: 'Admin',
        role: 'admin',
        password_hash: adminHash,
        created_at: now,
        updated_at: now,
      },
      {
        username: 'scorer1',
        name: 'Scorer One',
        role: 'scorer',
        password_hash: scorerHash,
        created_at: now,
        updated_at: now,
      },
    ]);

    // --- Teams ---
    await queryInterface.bulkInsert('teams', [
      { name: 'CS XI', short_name: 'CS', created_at: now, updated_at: now },
      { name: 'ECE XI', short_name: 'ECE', created_at: now, updated_at: now },
    ]);

    // --- Players ---
    // CS XI (team_id = 1) — 11 players
    const csPlayers = [
      { name: 'Rahul Sharma', role: 'batsman' },
      { name: 'Amit Kumar', role: 'batsman' },
      { name: 'Vikas Singh', role: 'batsman' },
      { name: 'Deepak Verma', role: 'all-rounder' },
      { name: 'Karan Nair', role: 'all-rounder' },
      { name: 'Prashant Joshi', role: 'bowler' },
      { name: 'Saurabh Mishra', role: 'bowler' },
      { name: 'Nitin Gupta', role: 'bowler' },
      { name: 'Rohit Tiwari', role: 'wicket-keeper' },
      { name: 'Aakash Pandey', role: 'all-rounder' },
      { name: 'Mohit Chauhan', role: 'batsman' },
    ];

    // ECE XI (team_id = 2) — 11 players
    const ecePlayers = [
      { name: 'Ravi Patel', role: 'batsman' },
      { name: 'Suresh Yadav', role: 'batsman' },
      { name: 'Manoj Gupta', role: 'batsman' },
      { name: 'Ajay Thakur', role: 'all-rounder' },
      { name: 'Vikram Reddy', role: 'all-rounder' },
      { name: 'Ankit Saxena', role: 'bowler' },
      { name: 'Rajesh Dubey', role: 'bowler' },
      { name: 'Sandeep Jha', role: 'bowler' },
      { name: 'Pankaj Mehta', role: 'wicket-keeper' },
      { name: 'Gaurav Bhatt', role: 'all-rounder' },
      { name: 'Hemant Rawat', role: 'batsman' },
    ];

    const allPlayers = [
      ...csPlayers.map((p) => ({
        ...p,
        team_id: 1,
        created_at: now,
        updated_at: now,
      })),
      ...ecePlayers.map((p) => ({
        ...p,
        team_id: 2,
        created_at: now,
        updated_at: now,
      })),
    ];

    await queryInterface.bulkInsert('players', allPlayers);

    // --- Match ---
    await queryInterface.bulkInsert('matches', [
      {
        title: 'CS XI vs ECE XI — Campus Premier League',
        venue: 'NIT Srinagar',
        status: 'upcoming',
        total_overs: 20,
        team_a_id: 1,
        team_b_id: 2,
        toss_winner_id: null,
        toss_decision: null,
        winner_id: null,
        result_summary: null,
        created_by: 1,
        start_time: null,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface) {
    // Delete in reverse order to avoid FK violations
    await queryInterface.bulkDelete('matches', null, {});
    await queryInterface.bulkDelete('players', null, {});
    await queryInterface.bulkDelete('teams', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
