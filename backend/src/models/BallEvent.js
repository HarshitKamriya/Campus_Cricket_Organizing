'use strict';

const { Model } = require('sequelize');

/**
 * BallEvent model — represents a single delivery in an innings.
 * This is the most granular unit of cricket scoring.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {typeof Model}
 */
module.exports = (sequelize, DataTypes) => {
  class BallEvent extends Model {
    /**
     * Define associations.
     * @param {Object} models - All registered models
     */
    static associate(models) {
      BallEvent.belongsTo(models.Innings, {
        foreignKey: 'innings_id',
        as: 'innings',
      });
      BallEvent.belongsTo(models.Match, {
        foreignKey: 'match_id',
        as: 'match',
      });
      BallEvent.belongsTo(models.Player, {
        foreignKey: 'batsman_id',
        as: 'Batsman',
      });
      BallEvent.belongsTo(models.Player, {
        foreignKey: 'non_striker_id',
        as: 'NonStriker',
      });
      BallEvent.belongsTo(models.Player, {
        foreignKey: 'bowler_id',
        as: 'Bowler',
      });
      BallEvent.belongsTo(models.Player, {
        foreignKey: 'dismissed_player_id',
        as: 'DismissedPlayer',
      });
      BallEvent.belongsTo(models.User, {
        foreignKey: 'scorer_id',
        as: 'Scorer',
      });
    }
  }

  BallEvent.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      match_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'matches',
          key: 'id',
        },
      },
      innings_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'innings',
          key: 'id',
        },
      },
      over_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      ball_in_over: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
        },
      },
      runs_scored: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 6,
        },
      },
      is_boundary_four: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_boundary_six: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      extras_type: {
        type: DataTypes.ENUM('none', 'wide', 'no_ball', 'bye', 'leg_bye'),
        defaultValue: 'none',
      },
      extras_runs: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      is_wicket: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      wicket_type: {
        type: DataTypes.ENUM(
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
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
      },
      non_striker_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'id',
        },
      },
      bowler_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'players',
          key: 'id',
        },
      },
      dismissed_player_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'players',
          key: 'id',
        },
      },
      scorer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      is_undone: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      commentary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'BallEvent',
      tableName: 'ball_events',
      underscored: true,
      timestamps: true,
    }
  );

  return BallEvent;
};
