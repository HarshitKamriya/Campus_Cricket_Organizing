require('dotenv').config();

/**
 * Parses a PostgreSQL connection URL into its components.
 * @param {string} url - The DATABASE_URL connection string
 * @returns {Object} Parsed connection parameters
 */
function parseDbUrl(url) {
  const parsed = new URL(url);
  return {
    username: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 5432,
    database: parsed.pathname.replace(/^\//, ''),
  };
}

const dbUrl = process.env.DATABASE_URL || 'postgres://cricket_user:cricket_pass@localhost:5432/campus_cricket';
const parsed = parseDbUrl(dbUrl);

module.exports = {
  development: {
    username: parsed.username,
    password: parsed.password,
    database: parsed.database,
    host: parsed.host,
    port: parsed.port,
    dialect: 'postgres',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    username: parsed.username,
    password: parsed.password,
    database: `${parsed.database}_test`,
    host: parsed.host,
    port: parsed.port,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 60000,
      idle: 10000,
    },
  },
};
