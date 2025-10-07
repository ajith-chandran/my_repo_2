import { buildSchema, graphql } from 'graphql';
import fs from 'fs';

// Load schema (SDL or introspection)
const schemaSDL = fs.readFileSync('./schema.graphql', 'utf8');
const schema = buildSchema(schemaSDL);

// Your query and variables
const query = `
  query($criteria: CriteriaInput!) {
    search(criteria: $criteria) {
      id
      name
    }
  }
`;

const variables = {
  criteria: null // <-- this would fail if non-nullable
};

graphql({ schema, source: query, variableValues: variables })
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
  });