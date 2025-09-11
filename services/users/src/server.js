import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { readFileSync } from 'node:fs';
import { createHttpTerminator } from 'http-terminator';
import pino from 'pino';
import { users } from './data.js';

const logger = pino({ name: 'users', level: process.env.LOG_LEVEL || 'info' });
const typeDefs = readFileSync(new URL('./schema.graphql', import.meta.url), 'utf8');

const resolvers = {
  Query: {
    me: () => users[0],
    user: (_, { id }) => users.find(u => u.id === id) || null,
    users: () => users,
    userByEmail: (_, { email }) => users.find(u => u.email === email) || null
  }
};

const server = new ApolloServer({ typeDefs, resolvers });

async function main() {
  await server.start();
  const app = express();

  app.use(cors());
  app.use('/healthz', (_, res) => res.status(200).json({ ok: true }));
  app.use('/graphql', bodyParser.json(), expressMiddleware(server));

  const port = process.env.PORT || 4001;
  const httpServer = app.listen(port, () => {
    logger.info({ port }, 'Users service listening');
  });

  const httpTerminator = createHttpTerminator({ server: httpServer });
  const shutdown = async (signal) => {
    logger.warn({ signal }, 'Shutting down users');
    await httpTerminator.terminate();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Users service failed to start');
  process.exit(1);
});