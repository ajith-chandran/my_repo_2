HIVE_TOKEN="your-token-here" \
HIVE_API_ENDPOINT="https://hive.mycompany.com/graphql" \
npx hive schema:publish users \
  --service=users \
  --url=https://subgraph-users.mycompany.com/graphql \
  --author="ci-bot@company.com" \
  --commit=$(git rev-parse HEAD)




--commit=$(git rev-parse HEAD)
--author="$(git log -1 --pretty=format:'%an <%ae>')"


curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ __schema { queryType { name } types { name } } }"}'



npx hive schema:check users-schema.graphql \
  --service users \
  --url http://localhost:3001/graphql




