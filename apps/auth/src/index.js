const express = require('express');
const { ApolloServer } = require('apollo-server-express');
import typeDefs from '@vanxa/database/src/typeDefs';
import { resolvers } from './resolvers';
import { PrismaClient } from '@prisma/client'
import isAuth from '@vanxa/middleware/is-auth';

const prisma = new PrismaClient();
async function startApolloServer() {
  const app = express();
  app.use(isAuth)
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ req, prisma }),
    path: '/'
  });
  await server.start();

  server.applyMiddleware({ app, path: '/' });
  
  await new Promise(resolve => app.listen({ port: 4001 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4001${server.graphqlPath}`);
  return { server, app };
}
startApolloServer()