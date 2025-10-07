import fs from 'fs';
import { buildClientSchema, printSchema } from 'graphql/utilities';

const introspection = JSON.parse(fs.readFileSync('schema.json', 'utf8'));
const schema = buildClientSchema(introspection.data || introspection);
const sdl = printSchema(schema);

fs.writeFileSync('schema.graphql', sdl);
console.log('✅ schema.graphql created');