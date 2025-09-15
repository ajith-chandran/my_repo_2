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

  extend type User {
    orders: [Order]
  }

additionalResolvers:
  - targetTypeName: Query
    targetFieldName: ordersByEmail
    result: ./resolvers/ordersByEmail.js

  - targetTypeName: User
    targetFieldName: orders
    result: ./resolvers/userOrders.js
    
    
    
    
    
=======




module.exports = {
  Query: {
    ordersByEmail: async (_, { email }, context, info) => {
      // Step 1: Get user by email
      const user = await context.UserAPI.Query.getUserByEmail(
        { email },
        context,
        info
      );

      if (!user) return [];

      // Step 2: Construct criteria
      const criteria = `accountNumber:${user.userId}`;

      // Step 3: Fetch orders
      return context.OrderAPI.Query.getOrder({ criteria }, context, info);
    },
  },
};





======




module.exports = {
  User: {
    orders: async (user, _, context, info) => {
      if (!user?.userId) return [];

      const criteria = `accountNumber:${user.userId}`;

      return context.OrderAPI.Query.getOrder({ criteria }, context, info);
    },
  },
};






====




query {
  ordersByEmail(email: "abc@test.com") {
    id
    amount
    status
  }
}




====


query {
  getUserByEmail(email: "abc@test.com") {
    id
    name
    email
    orders {
      id
      amount
      status
    }
  }
}



===