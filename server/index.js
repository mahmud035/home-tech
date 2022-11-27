const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
app.get('/categories/:categoryname', async (req, res) => {
  try {
    const categoryName = req.params.categoryname;
    const query = { categoryName: categoryName };
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

// get specific Seller All Products
app.get('/products/seller', async (req, res) => {
  try {
    const email = req.query.email;
    const query = {
      email: email,
    };
    const products = await productsCollection.find(query).toArray();
    res.send(products);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// get all advertise items
app.get('/advertiseitems', async (req, res) => {
  try {
    const query = {
      isAdvertise: true,
      salesStatus: 'available',
    };
    const result = await productsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// get all buyers
app.get('/buyers', async (req, res) => {
  try {
    const query = { role: 'User' };
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// get all Sellers
app.get('/sellers', async (req, res) => {
  try {
    const query = { role: 'Seller' };
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// get all reported items
app.get('/reporteditems', async (req, res) => {
  try {
    const query = { reported: true };
    const result = await productsCollection.find(query).toArray();
    res.send(result);
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
app.post('/products', async (req, res) => {
  try {
    const product = req.body;
    const result = await productsCollection.insertOne(product);
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

// advertise a specific product
app.put('/seller/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        isAdvertise: true,
      },
    };
    const result = await productsCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// report a specific product
app.put('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        reported: true,
      },
    };
    const result = await productsCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// verify a seller
app.put('/sellers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        verified: true,
      },
    };
    const result = await usersCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// update Seller verify status in the productsCollection
app.put('/products/verify/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const filter = { email: email };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        verified: true,
      },
    };
    const result = await productsCollection.updateOne(
      filter,
      updatedDoc,
      options
    );
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

//* -------------------------DELETE(DELETE)-------------------------
// delete a seller product
app.delete('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await productsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// delete a buyer / Normal User
app.delete('/buyers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// delete a seller
app.delete('/sellers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await usersCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// delete reported items
app.delete('/reporteditems/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const result = await productsCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

app.listen(port, () => {
  console.log('Server up and running'.cyan.bold);
});
