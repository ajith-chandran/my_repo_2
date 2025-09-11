import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { readFileSync } from 'node:fs';
import { createHttpTerminator } from 'http-terminator';
import pino from 'pino';
import { orders } from './data.js';

const logger = pino({ name: 'orders', level: process.env.LOG_LEVEL || 'info' });
const typeDefs = readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8');

const resolvers = {
  Query: {
    order: (_, { id }) => orders.find(o => o.id === id) || null,
    ordersByUser: (_, { userId }) => orders.filter(o => o.userId === userId),
    orders: () => orders
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

async function main() {
  await server.start();
  const app = express();

  app.use(cors());
  app.use('/healthz', (_, res) => res.status(200).json({ ok: true }));
  app.use('/graphql', bodyParser.json(), expressMiddleware(server));

  const port = process.env.PORT || 4002;
  const httpServer = app.listen(port, () => {
    logger.info({ port }, 'Orders service listening');
  });

  const httpTerminator = createHttpTerminator({ server: httpServer });
  const shutdown = async (signal) => {
    logger.warn({ signal }, 'Shutting down orders');
    await httpTerminator.terminate();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Orders service failed to start');
  process.exit(1);
});