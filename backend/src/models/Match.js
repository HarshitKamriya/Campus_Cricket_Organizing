'use strict';

const { Model } = require('sequelize');

/**
 * Match model — represents a cricket match between two teams.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {typeof Model}
 */
module.exports = (sequelize, DataTypes) => {
  class Match extends Model {
    /**
     * Define associations.
     * @param {Object} models - All registered models
     */
    static associate(models) {
      Match.belongsTo(models.Team, {
        foreignKey: 'team_a_id',
        as: 'TeamA',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'team_b_id',
        as: 'TeamB',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'toss_winner_id',
        as: 'TossWinner',
      });
      Match.belongsTo(models.Team, {
        foreignKey: 'winner_id',
        as: 'Winner',
      });
      Match.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'Creator',
      });
      Match.hasMany(models.Innings, {
        foreignKey: 'match_id',
        as: 'innings',
      });
    }
  }

  Match.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      venue: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'NIT Srinagar',
      },
      status: {
        type: DataTypes.ENUM('upcoming', 'live', 'completed', 'abandoned'),
        defaultValue: 'upcoming',
        allowNull: false,
      },
      total_overs: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        validate: {
          min: 1,
          max: 50,
        },
      },
      team_a_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      team_b_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      toss_winner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      toss_decision: {
        type: DataTypes.ENUM('bat', 'bowl'),
        allowNull: true,
      },
      winner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      result_summary: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Match',
      tableName: 'matches',
      underscored: true,
      timestamps: true,
    }
  );

  return Match;
};
