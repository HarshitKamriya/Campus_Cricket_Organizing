'use strict';

const { Model } = require('sequelize');

/**
 * Team model — represents a cricket team.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {typeof Model}
 */
module.exports = (sequelize, DataTypes) => {
  class Team extends Model {
    /**
     * Define associations.
     * @param {Object} models - All registered models
     */
    static associate(models) {
      Team.hasMany(models.Player, {
        foreignKey: 'team_id',
        as: 'players',
      });
    }
  }

  Team.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      short_name: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      logo_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Team',
      tableName: 'teams',
      underscored: true,
      timestamps: true,
    }
  );

  return Team;
};
