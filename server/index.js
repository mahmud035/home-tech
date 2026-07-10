const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('colors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

const port = process.env.PORT || 5000;

//* Middleware
app.use(cors());
app.use(express.json());

//* verify jwt token (1st Middleware function)
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized Access' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const user = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = user;

    // IMP: Must call the next() function
    next();
  } catch (error) {
    res.status(401).send({ message: 'Forbidden Access' });
  }
};

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
const paymentsCollection = client.db('homeTechDB').collection('payments');

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
    const query = {
      categoryName: categoryName,
      salesStatus: 'available',
    };
    console.log(query);
    const result = await productsCollection.find(query).toArray();
    res.send(result);
    console.log(result);
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
app.get('/orders', verifyJWT, async (req, res) => {
  try {
    const email = req.query.email; // query kore pathano email
    const userEmail = req.user.email; // verified user email (jwt token er vitore je email thake sei email ta.)

    if (email !== userEmail) {
      return res.status(403).send({ message: 'Forbidden Access' });
    }

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
app.get('/buyers', verifyJWT, async (req, res) => {
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

// get a specific order / product for Payment from bookingCollection
app.get('/products/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = { _id: ObjectId(id) };
    const product = await bookingsCollection.findOne(query);
    res.send(product);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// JWT Token {create JWT Token for Email/Password sign-up and login}
app.get('/jwt', async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const user = await usersCollection.findOne(query);

  // if the user is found in the database than {create/assign a JWT Token}
  if (user) {
    const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);
    return res.send({ accessToken2: token });
  }

  res.status(403).send({ accessToken2: '' });
});

// JWT Token {for Social Login}
app.post('/jwt', async (req, res) => {
  try {
    const user = req.body;
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
    res.send({ accessToken2: token });
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

// payment intents API to get client Secret from stripe
app.post('/create-payment-intent', async (req, res) => {
  try {
    const product = req.body;
    const price = Number(product.resalePrice);
    const amount = price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'usd',
      amount: amount,
      payment_method_types: ['card'],
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.log(error.message.bold);
  }
});

app.post('/payments', async (req, res) => {
  const payment = req.body;
  const result = await paymentsCollection.insertOne(payment);

  // update booking document (insert two new fields)
  const id = payment.bookingId;
  const filter = { _id: ObjectId(id) };
  const updatedDoc = {
    $set: {
      paid: true,
      transactionId: payment.transactionId,
    },
  };
  const updateResult = await bookingsCollection.updateOne(filter, updatedDoc);
  console.log(updateResult);

  res.send(result);
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
app.put('/seller/products/:id', verifyJWT, async (req, res) => {
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
    const result = await productsCollection.updateMany(
      filter,
      updatedDoc,
      options
    );
    res.send(result);
  } catch (error) {
    console.log(error.message.bold);
  }
});

// update products salesStatus (available / or) in the productCollections
app.put('/products/salesstatus/:name', async (req, res) => {
  try {
    const productName = req.params.name;
    const filter = { name: productName };
    const options = { upsert: true };
    const updatedDoc = {
      $set: {
        salesStatus: 'sold',
      },
    };
    const result = await productsCollection.updateMany(
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
