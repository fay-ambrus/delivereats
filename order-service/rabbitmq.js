const amqp = require('amqplib');

let connection, channel;

async function connect() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  connection = await amqp.connect(rabbitmqUrl);
  channel = await connection.createChannel();
  await channel.assertExchange('orders', 'topic', { durable: true });
  console.log('Connected to RabbitMQ');
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
