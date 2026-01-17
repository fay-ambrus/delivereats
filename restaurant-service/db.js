const { MongoClient } = require('mongodb');
const { randomUUID } = require('crypto');

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongodb:27017';
const dbName = 'delivereats';
let db, eventsCollection, restaurantsCollection;

async function connect() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  eventsCollection = db.collection('restaurant_events');
  restaurantsCollection = db.collection('restaurants');
  console.log('Connected to MongoDB');
}

async function rebuildRestaurantState(restaurantId) {
  const events = await eventsCollection.find({ restaurantId }).sort({ timestamp: 1 }).toArray();
  let state = null;

  for (const event of events) {
    if (event.type === 'RestaurantCreated') {
      state = { id: event.restaurantId, name: event.data.name, category: event.data.category || '' };
    } else if (event.type === 'RestaurantUpdated' && state) {
      state = { ...state, ...event.data };
    } else if (event.type === 'RestaurantDeleted') {
      state = null;
    }
  }

  return state;
}

async function createRestaurant(name, category) {
  const restaurantId = randomUUID();
  const event = {
    type: 'RestaurantCreated',
    restaurantId,
    timestamp: new Date(),
    data: { name: name, category: category || '' }
  };

  await eventsCollection.insertOne(event);
  const state = await rebuildRestaurantState(restaurantId);
  await restaurantsCollection.replaceOne({ id: restaurantId }, state, { upsert: true });

  return state;
}

async function getAllRestaurants() {
  const restaurants = await restaurantsCollection.find({}).toArray();
  return restaurants.map(r => ({ id: r.id, name: r.name, category: r.category }));
}

async function getRestaurantById(id) {
  return await restaurantsCollection.findOne({ id });
}

async function updateRestaurant(id, name, category) {
  const existing = await restaurantsCollection.findOne({ id });
  if (!existing) return null;

  const event = {
    type: 'RestaurantUpdated',
    restaurantId: id,
    timestamp: new Date(),
    data: { name, category }
  };

  await eventsCollection.insertOne(event);
  const state = await rebuildRestaurantState(id);
  await restaurantsCollection.replaceOne({ id }, state);

  return state;
}

async function deleteRestaurant(id) {
  const existing = await restaurantsCollection.findOne({ id });
  if (!existing) return false;

  const event = {
    type: 'RestaurantDeleted',
    restaurantId: id,
    timestamp: new Date(),
    data: {}
  };

  await eventsCollection.insertOne(event);
  await restaurantsCollection.deleteOne({ id });

  return true;
}

module.exports = {
  connect,
  createRestaurant,
  getAllRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant
};
