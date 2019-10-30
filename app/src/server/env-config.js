const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    PORT: process.env.PORT,
    MAPBOX_TOKEN: process.env.MAPBOX_TOKEN,
    PG_USER: process.env.PG_USER,
    PG_PASSWORD: process.env.PG_PASSWORD,
    PG_PORT: process.env.PG_PORT,
    PG_DATABASE: process.env.PG_DATABASE,
    PG_HOST: process.env.PG_HOST
};