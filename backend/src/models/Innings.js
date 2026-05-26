'use strict';

const { Model } = require('sequelize');

/**
 * Innings model — represents one innings of a match (1st or 2nd).
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {typeof Model}
 */
module.exports = (sequelize, DataTypes) => {
  class Innings extends Model {
    /**
     * Define associations.
     * @param {Object} models - All registered models
     */
    static associate(models) {
      Innings.belongsTo(models.Match, {
        foreignKey: 'match_id',
        as: 'match',
      });
      Innings.belongsTo(models.Team, {
        foreignKey: 'batting_team_id',
        as: 'BattingTeam',
      });
      Innings.belongsTo(models.Team, {
        foreignKey: 'bowling_team_id',
        as: 'BowlingTeam',
      });
      Innings.hasMany(models.BallEvent, {
        foreignKey: 'innings_id',
        as: 'events',
      });
    }
  }

  Innings.init(
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
      batting_team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      bowling_team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      innings_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          isIn: [[1, 2]],
        },
      },
      status: {
        type: DataTypes.ENUM('upcoming', 'in_progress', 'completed'),
        defaultValue: 'upcoming',
        allowNull: false,
      },
      total_runs: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_wickets: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_overs: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_balls: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      extras_wide: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      extras_noball: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      extras_bye: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      extras_legbye: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      target: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Innings',
      tableName: 'innings',
      underscored: true,
      timestamps: true,
    }
  );

  return Innings;
};
