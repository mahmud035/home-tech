const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('colors');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 5000;

//* Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('HomeTech server is running');
});

app.listen(port, () => {
  console.log('Server up and running'.cyan.bold);
});
