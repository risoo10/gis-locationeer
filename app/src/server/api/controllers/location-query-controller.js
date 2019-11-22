const express = require('express');
const router = express.Router();
const pool = require('../query-pool').pool;


router.get('/', function (req, res, next) {
    const query = `select ST_AsGeoJSON(st_transform(way, 4326)) as wayGeo, way_area as area, name, place, osm_id as id from planet_osm_polygon p \
where p.place in ('quarter', 'suburb', 'village')`;
    console.log('[LOCATION] areaExample', query);
    pool.query(query, (errors, results) => {

        if (errors || !results || !results.rows || results.rows.length === 0) {
            res.status(404).send('Configuration not found.');
        } else {
            res.status(200).json(results.rows);
        }

    });
});


module.exports = router;