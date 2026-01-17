const { MongoClient } = require('mongodb');

const mongoUrl = process.env.MONGO_URL || 'mongodb://mongodb:27017';
const dbName = 'orders';
let db, eventsCollection;

async function connect() {
  const client = new MongoClient(mongoUrl);
  await client.connect();
  db = client.db(dbName);
  eventsCollection = db.collection('order_events');
  console.log('Connected to MongoDB (orders database)');
}

async function rebuildOrderState(orderId) {
  const events = await eventsCollection.find({ orderId }).sort({ timestamp: 1 }).toArray();
  let state = null;
  
  for (const event of events) {
    if (event.type === 'OrderCreated') {
      state = { id: event.orderId, ...event.data, status: 'pending' };
    } else if (event.type === 'OrderStatusUpdated' && state) {
      state = { ...state, status: event.data.status };
    } else if (event.type === 'OrderDeleted') {
      state = null;
    }
  }
  
  return state;
}

async function createOrder(order) {
  const event = {
    type: 'OrderCreated',
    orderId: order.id,
    timestamp: new Date(),
    data: { customerId: order.customerId, restaurantId: order.restaurantId, items: order.items }
  };
  
  await eventsCollection.insertOne(event);
  return await rebuildOrderState(order.id);
}

async function getAllOrders(customerId, restaurantId) {
  const allOrderIds = await eventsCollection.distinct('orderId');
  const orders = [];
  
  for (const orderId of allOrderIds) {
    const state = await rebuildOrderState(orderId);
    if (state) {
      if ((!customerId || state.customerId === customerId) && 
          (!restaurantId || state.restaurantId === restaurantId)) {
        orders.push(state);
      }
    }
  }
  
  return orders;
}

async function getOrderById(id) {
  return await rebuildOrderState(id);
}

async function updateOrderStatus(id, status) {
  const existing = await rebuildOrderState(id);
  if (!existing) return null;
  
  const event = {
    type: 'OrderStatusUpdated',
    orderId: id,
    timestamp: new Date(),
    data: { status }
  };
  
  await eventsCollection.insertOne(event);
  return await rebuildOrderState(id);
}

async function deleteOrder(id) {
  const existing = await rebuildOrderState(id);
  if (!existing) return false;
  
  const event = {
    type: 'OrderDeleted',
    orderId: id,
    timestamp: new Date(),
    data: {}
  };
  
  await eventsCollection.insertOne(event);
  return true;
}

module.exports = {
  connect,
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder
};
