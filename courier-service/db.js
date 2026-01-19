const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongodb:27017';
const dbName = 'couriers';
let db, eventsCollection;

async function connect() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  eventsCollection = db.collection('courier_events');
  console.log('Connected to MongoDB (couriers database)');
}

async function rebuildCourierState(courierId) {
  const events = await eventsCollection.find({ courierId }).sort({ timestamp: 1 }).toArray();
  let state = null;

  for (const event of events) {
    if (event.type === 'CourierCreated') {
      state = { id: event.courierId, ...event.data };
    } else if (event.type === 'CourierUpdated' && state) {
      state = { ...state, ...event.data };
    } else if (event.type === 'CourierDeleted') {
      state = null;
    }
  }

  return state;
}

async function createCourier(courier) {
  const event = {
    type: 'CourierCreated',
    courierId: courier.id,
    timestamp: new Date(),
    data: { name: courier.name }
  };

  await eventsCollection.insertOne(event);
  return await rebuildCourierState(courier.id);
}

async function getAllCouriers() {
  const allCourierIds = await eventsCollection.distinct('courierId');
  const couriers = [];

  for (const courierId of allCourierIds) {
    const state = await rebuildCourierState(courierId);
    if (state) {
      couriers.push(state);
    }
  }

  return couriers;
}

async function getCourierById(id) {
  return await rebuildCourierState(id);
}

async function updateCourier(id, courier) {
  const existing = await rebuildCourierState(id);
  if (!existing) return null;

  const event = {
    type: 'CourierUpdated',
    courierId: id,
    timestamp: new Date(),
    data: { name: courier.name }
  };

  await eventsCollection.insertOne(event);
  return await rebuildCourierState(id);
}

async function deleteCourier(id) {
  const existing = await rebuildCourierState(id);
  if (!existing) return false;

  const event = {
    type: 'CourierDeleted',
    courierId: id,
    timestamp: new Date(),
    data: {}
  };

  await eventsCollection.insertOne(event);
  return true;
}

module.exports = {
  connect,
  createCourier,
  getAllCouriers,
  getCourierById,
  updateCourier,
  deleteCourier
};
