'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ball_events', {
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
      innings_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'innings',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      over_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      ball_in_over: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      runs_scored: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_boundary_four: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_boundary_six: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      extras_type: {
        type: Sequelize.ENUM('none', 'wide', 'no_ball', 'bye', 'leg_bye'),
        defaultValue: 'none',
      },
      extras_runs: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_wicket: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      wicket_type: {
        type: Sequelize.ENUM(
          'bowled',
          'caught',
          'lbw',
          'run_out',
          'stumped',
          'hit_wicket',
          'retired'
        ),
        allowNull: true,
      },
      batsman_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      non_striker_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      bowler_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      dismissed_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      scorer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      is_undone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      commentary: {
        type: Sequelize.STRING,
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

    // Composite index for efficient ball lookup within an innings
    await queryInterface.addIndex('ball_events', ['innings_id', 'over_number', 'ball_in_over'], {
      name: 'ball_events_innings_over_ball_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ball_events', 'ball_events_innings_over_ball_idx');
    await queryInterface.dropTable('ball_events');
  },
};
