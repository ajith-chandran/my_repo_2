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
    sourceName: UserAPI
    sourceTypeName: Query
    sourceFieldName: getUserByEmail
    requiredSelectionSet: |
      {
        userId
      }
    result: |
      async (root, args, context, info) => {
        // 1. fetch user by email
        const user = await context.UserAPI.Query.getUserByEmail({
          email: args.email
        }, context, info);

        if (!user) return [];

        // 2. fetch orders using user.userId
        const criteria = `accountNumber:${user.userId}`;
        const orders = await context.OrderAPI.Query.getOrder({
          criteria
        }, context, info);

        return orders;
      }