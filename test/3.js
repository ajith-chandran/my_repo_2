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
  extend type User {
    orders: [Order]
  }

additionalResolvers:
  - targetTypeName: User
    targetFieldName: orders
    result: ./resolvers/userOrders.js
    
    
    
    
====
module.exports = {
  User: {
    orders: async (user, _, context, info) => {
      if (!user?.userId) return [];

      // Build criteria
      const criteria = `accountNumber:${user.userId}`;

      // Delegate to OrderAPI
      const orders = await context.OrderAPI.Query.getOrder(
        { criteria },
        context,
        info
      );

      return orders;
    },
  },
};


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