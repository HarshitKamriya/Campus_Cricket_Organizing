'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Catch errors in case the enum values already exist or DB is not Postgres
    try {
      await queryInterface.sequelize.query(`ALTER TYPE "enum_players_role" ADD VALUE 'batting-all-rounder';`);
      await queryInterface.sequelize.query(`ALTER TYPE "enum_players_role" ADD VALUE 'bowling-all-rounder';`);
    } catch (e) {
      console.log('ENUM values may already exist or DB does not support ALTER TYPE:', e.message);
    }
  },

  async down (queryInterface, Sequelize) {
    // Postgres doesn't easily support dropping ENUM values, so we do nothing here.
  }
};
