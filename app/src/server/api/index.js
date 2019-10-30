const OsController = require( './controllers/os-controller');
const ConfigController = require( './controllers/config-controller');

const express = require('express');

const api = express();

// OS Endpoints
api.get('/username', OsController.getUsername);

// Config Endpoints
api.get('/config/:key', ConfigController.getConfig);
api.post('/config/:key/:value', ConfigController.updateOrCreateConfig);
api.get('/map/available', ConfigController.isMapLoadAvailable);
api.post('/map/upload-finished', ConfigController.updateMapUpload);

exports.api = api;