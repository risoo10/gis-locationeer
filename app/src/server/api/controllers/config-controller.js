const pool = require('../query-pool').pool;

exports.getConfig = (req, res) => {
    const configKey = req.params.key;
    pool.query(`select value from app_config where key=$1`, [configKey], (errors, results) => {

        if (errors || !results || !results.rows || results.rows.length === 0) {
            res.status(404).send('Configuration not found.');
        } else {
            console.log('[CONFIG] get', results);
            res.status(200).json(results.rows[0]);

        }

    })
};

exports.updateOrCreateConfig = (req, res) => {
    const newKey = req.params.key;
    const newValue = req.params.value;

    pool.query(`insert into app_config (key, value) values ($1, $2) \
    on duplicate key update \
    key = VALUES(key)\
    value = VALUES(value)`, [newKey, newValue], (errors, results) => {

        if (errors) {
            res.status(404).send('Update or creation was unsuccessful.');
        } else {
            res.status(200).send('Successfully updated configuration.');
        }

    })
};

exports.isMapLoadAvailable = (req, res) => {
    const KEYS = ['FINISHED_MAP_LOADS', 'MAX_MAP_LOADS'];

    pool.query('select * from app_config where key in ($1, $2)', KEYS, (err, results) => {
        if (err || !results || !results.rows) {
            res.status(404).send('Map configuration not available.');
        } else {

            const finishedLoads = results.rows.find(row => row.key === KEYS[0]);
            const finishedLoadsValue = finishedLoads && finishedLoads.value;

            const maxLoads = results.rows.find(row => row.key === KEYS[1]);
            const maxLoadsValue = maxLoads && maxLoads.value;


            res.status(200).json({ available: finishedLoadsValue < maxLoadsValue });
        }
    })
}

exports.updateMapUpload = (req, res) => {
    pool.query('update app_config set value=(value::numeric + 1) where key=$1', ['FINISHED_MAP_LOADS'], (err, results) => {
        if (err) {
            res.status(500).send('Map load not registered.');
        } else {
            res.status(200).send('Map load successfully registered.');
        }
    })
};