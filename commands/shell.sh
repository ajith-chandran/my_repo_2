HIVE_TOKEN="your-token-here" \
HIVE_API_ENDPOINT="https://hive.mycompany.com/graphql" \
npx hive schema:publish users \
  --service=users \
  --url=https://subgraph-users.mycompany.com/graphql \
  --author="ci-bot@company.com" \
  --commit=$(git rev-parse HEAD)




--commit=$(git rev-parse HEAD)
--author="$(git log -1 --pretty=format:'%an <%ae>')"