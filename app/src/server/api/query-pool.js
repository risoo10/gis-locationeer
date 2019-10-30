const Pool = require('pg').Pool
const ENV = require('../env-config');

// console.log('[ENV]', ENV);

const pool = new Pool({
    user: ENV.PG_USER,
    host: ENV.PG_HOST,
    database: ENV.PG_DATABASE,
    password: ENV.PG_PASSWORD,
    port: ENV.PG_PORT,
})
exports.pool = pool;

