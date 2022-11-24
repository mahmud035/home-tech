const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

//* Mongodb Atlas
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.yeflywl.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const dbConnect = async () => {
  try {
    await client.connect();
    console.log('Database connected'.yellow.italic);
  } catch (error) {
    console.log(error.name.bgRed, error.message.bold);
  }
};

dbConnect();

//* Collections
const productCategoriesCollection = client
  .db('homeTechDB')
  .collection('productCategories');
const usersCollection = client.db('homeTechDB').collection('users');

//* -------------------------GET(READ)-------------------------
app.get('/categories', async (req, res) => {
  const query = {};
  const categories = await productCategoriesCollection.find(query).toArray();
  res.send(categories);
});

//* -------------------------POST(CREATE)-------------------------
app.post('/users', async (req, res) => {
  const user = req.body;
  const result = await usersCollection.insertOne(user);
  res.send(result);
  console.log(result);
});

app.listen(port, () => {
  console.log('Server up and running'.cyan.bold);
});
