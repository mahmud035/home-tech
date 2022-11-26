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
const productsCollection = client.db('homeTechDB').collection('products');
const usersCollection = client.db('homeTechDB').collection('users');
const bookingsCollection = client.db('homeTechDB').collection('bookings');
const sellerProductsCollection = client
  .db('homeTechDB')
  .collection('sellerProducts');

//* -------------------------GET(READ)-------------------------
// get all categories
app.get('/categories', async (req, res) => {
  try {
    const query = {};
    const categories = await productCategoriesCollection.find(query).toArray();
    res.send(categories);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// Get specific category products
app.get('/categories/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { categoryId: Number(id) };
    const result = await productsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// Get a specific user
app.get('/users/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    res.send(user);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// get all orders of a specific user using his/her Email address
app.get('/orders', async (req, res) => {
  try {
    const email = req.query.email;
    const query = { userEmail: email };
    const orders = await bookingsCollection.find(query).toArray();
    res.send(orders);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// check if a specific user is an Admin or Not? (using dynamic email)
app.get('/users/admin/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    res.send({ isAdmin: user?.role === 'Admin' });
  } catch (error) {
    console.log(error.message.bold);
  }
});

// check if a specific user is a Seller or Not? (using dynamic email)
app.get('/users/seller/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const user = await usersCollection.findOne(query);
    res.send({ isSeller: user?.role === 'Seller' });
  } catch (error) {
    console.log(error.message.bold);
  }
});

//* -------------------------POST(CREATE)-------------------------
// Save registered user information in the database
app.post('/users', async (req, res) => {
  try {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// Insert booking data
app.post('/bookings', async (req, res) => {
  try {
    const booking = req.body;

    const query = {
      userEmail: booking.userEmail,
      productName: booking.productName,
    };

    const alreadyBooked = await bookingsCollection.find(query).toArray();

    if (alreadyBooked.length > 0) {
      const message = 'You have already booked this product.';
      return res.send({
        acknowledged: false,
        message: message,
      });
    }

    const result = await bookingsCollection.insertOne(booking);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// Insert Seller Product
app.post('/seller/products', async (req, res) => {
  try {
    const product = req.body;
    const result = await sellerProductsCollection.insertOne(product);
    res.send(result);
  } catch (error) {
    console.log(error.message.name);
  }
});

//* --------------------PUT/PATCH(UPDATE)-----------------------
// update a specific user information. Give him a Seller role
app.put('/users/seller/:email', async (req, res) => {
  const email = req.params.email;
  const filter = {
    email: email,
  };
  const options = { upsert: true };
  const updatedUser = {
    $set: {
      role: 'Seller',
    },
  };
  const result = await usersCollection.updateOne(filter, updatedUser, options);
  res.send(result);
});

//* -------------------------DELETE(DELETE)-------------------------

app.listen(port, () => {
  console.log('Server up and running'.cyan.bold);
});
