const amqp = require('amqplib');

let connection, channel;
const orderCache = new Map();

async function connect() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createChannel();
  await channel.assertExchange('orders', 'topic', { durable: true });
  
  const queue = await channel.assertQueue('', { exclusive: true });
  await channel.bindQueue(queue.queue, 'orders', 'order.*');
  channel.consume(queue.queue, (msg) => {
    const event = JSON.parse(msg.content.toString());
    handleEvent(event);
    channel.ack(msg);
  });
  
  console.log('Courier-service subscribed to order events');
}

function handleEvent(event) {
  const { type, data } = event;
  
  if (type === 'order.created' || type === 'order.updated') {
    orderCache.set(data.id, data);
  } else if (type === 'order.deleted') {
    orderCache.delete(data.id);
  }
}

function getOrders() {
  return Array.from(orderCache.values());
}

async function initializeCache() {
  const response = await fetch('http://order-service:3000/api/order/orders');
  const orders = await response.json();
  orders.forEach(order => orderCache.set(order.id, order));
  console.log(`Initialized cache with ${orders.length} orders`);
}

async function publishEvent(eventType, data) {
  if (!channel) {
    console.error('RabbitMQ channel not initialized');
    return;
  }
  const message = JSON.stringify({ type: eventType, data, timestamp: new Date() });
  channel.publish('orders', eventType, Buffer.from(message));
  console.log(`Published event: ${eventType}`);
}

module.exports = {
  connect,
  getOrders,
  initializeCache,
  publishEvent
};
