const ApiModule = require('./api/index.js');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json())
app.use(express.static('dist'));
app.use('/api/v1', ApiModule.api);


app.listen(process.env.PORT || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));
