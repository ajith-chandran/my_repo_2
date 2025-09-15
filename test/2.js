sources:
  - name: UserAPI
    handler:
      graphql:
        endpoint: http://localhost:4001/graphql
  - name: OrderAPI
    handler:
      graphql:
        endpoint: http://localhost:4002/graphql

additionalTypeDefs: |
  extend type Query {
    ordersByEmail(email: String!): [Order]
  }

additionalResolvers:
  - targetTypeName: Query
    targetFieldName: ordersByEmail
    result: ./resolvers/ordersByEmail.js
    
    
    
======

module.exports = {
  Query: {
    ordersByEmail: async (_, { email }, context, info) => {
      // Step 1: Fetch user by email
      const user = await context.UserAPI.Query.getUserByEmail(
        { email },
        context,
        info
      );

      if (!user) return [];

      // Step 2: Use userId in criteria
      const criteria = `accountNumber:${user.userId}`;

      // Step 3: Fetch orders
      const orders = await context.OrderAPI.Query.getOrder(
        { criteria },
        context,
        info
      );

      return orders;
    },
  },
};



=====

query {
  ordersByEmail(email: "abc@test.com") {
    id
    amount
    status
  }
}