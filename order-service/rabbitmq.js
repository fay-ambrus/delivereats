const amqp = require('amqplib');
const db = require('./db');

let connection, channel;

async function connect() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createChannel();
  await channel.assertExchange('orders', 'topic', { durable: true });
  
  const queue = await channel.assertQueue('order-service-updates', { durable: true });
  await channel.bindQueue(queue.queue, 'orders', 'order.status_update');
  await channel.bindQueue(queue.queue, 'orders', 'order.courier_update');
  
  channel.consume(queue.queue, async (msg) => {
    const event = JSON.parse(msg.content.toString());
    await handleEvent(event);
    channel.ack(msg);
  });
  
  console.log('Order-service connected to RabbitMQ');
}

async function handleEvent(event) {
  const { type, data } = event;
  
  if (type === 'order.status_update') {
    const order = await db.updateOrderStatus(data.id, data.status);
    if (order) {
      await publishEvent('order.updated', order);
    }
  } else if (type === 'order.courier_update') {
    const order = await db.updateOrderStatus(data.id, data.status, data.courierId);
    if (order) {
      await publishEvent('order.updated', order);
    }
  }
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
  publishEvent
};
