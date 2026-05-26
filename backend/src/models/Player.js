'use strict';

const { Model } = require('sequelize');

/**
 * Player model — represents a cricket player belonging to a team.
 *
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {typeof Model}
 */
module.exports = (sequelize, DataTypes) => {
  class Player extends Model {
    /**
     * Define associations.
     * @param {Object} models - All registered models
     */
    static associate(models) {
      Player.belongsTo(models.Team, {
        foreignKey: 'team_id',
        as: 'team',
      });
    }
  }

  Player.init(
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
      team_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'teams',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM('batsman', 'bowler', 'all-rounder', 'wicket-keeper'),
        defaultValue: 'all-rounder',
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Player',
      tableName: 'players',
      underscored: true,
      timestamps: true,
    }
  );

  return Player;
};
