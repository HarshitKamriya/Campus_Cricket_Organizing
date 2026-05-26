'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('innings', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'matches',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      batting_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      bowling_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      innings_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('upcoming', 'in_progress', 'completed'),
        defaultValue: 'upcoming',
        allowNull: false,
      },
      total_runs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_wickets: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_overs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      total_balls: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      extras_wide: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      extras_noball: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      extras_bye: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      extras_legbye: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      target: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('innings');
  },
};
