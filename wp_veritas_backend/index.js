const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan'); // HTTP request logger middleware
const cors = require('cors');

const wp_sites = require('./routes/sites');

const app = express();

mongoose.connect('mongodb://localhost/wp_veritas').then(
    () => console.log('Connected to MongoDB ...')
).catch(err => console.error('Could not connect to MongoDB ....'));

//enables cors
app.use(cors({
    'allowedHeaders': ['sessionId', 'Content-Type'],
    'exposedHeaders': ['sessionId'],
    'origin': '*',
    'methods': 'GET,HEAD,PUT,PATCH,POST,DELETE',
    'preflightContinue': false
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // URL key=value&&key=value
app.use('/api/sites', wp_sites);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port} ...`));