import {
  buildSchema,
  graphql,
  parse,
  validate,
  getNamedType,
  isNonNullType,
  isListType,
  isObjectType,
} from "graphql";
import fs from "fs";

// 1. Load schema (SDL file)
const schemaSDL = fs.readFileSync("./schema.graphql", "utf8");
const schema = buildSchema(schemaSDL);

// 2. Load query
const query = `
  query($criteria: CriteriaInput!) {
    search(criteria: $criteria) {
      id
      name
    }
  }
`;

// 3. Load variables and response
const variables = JSON.parse(fs.readFileSync("./variables.json", "utf8"));
const response = JSON.parse(fs.readFileSync("./response.json", "utf8"));

// --- Step A: Validate query itself ---
const validationErrors = validate(schema, parse(query));
if (validationErrors.length > 0) {
  console.error("Query does not match schema:");
  console.error(validationErrors);
  process.exit(1);
}

// --- Step B: Validate variables ---
graphql({
  schema,
  source: query,
  variableValues: variables,
}).then((result) => {
  if (result.errors) {
    console.error("Variable validation errors:");
    console.error(result.errors);
  } else {
    console.log("Query & variables are valid.");
  }

  // --- Step C: Validate response payload ---
  console.log("\n🔍 Validating backend response...");

  if (!response.data) {
    console.error("Response missing 'data' field");
    process.exit(1);
  }

  // Walk schema recursively and check response
  const queryAST = parse(query);
  const operation = queryAST.definitions.find((d) => d.kind === "OperationDefinition");

  for (const selection of operation.selectionSet.selections) {
    validateSelection(selection, response.data, schema.getQueryType());
  }
});

/**
 * Recursively validate response fields against schema types
 */
function validateSelection(selection, data, parentType) {
  if (selection.kind !== "Field") return;

  const fieldName = selection.name.value;
  const fieldDef = parentType.getFields()[fieldName];
  if (!fieldDef) {
    console.warn(`Field '${fieldName}' not in schema for type '${parentType.name}'`);
    return;
  }

  const fieldType = fieldDef.type;
  const fieldValue = data[fieldName];

  checkValueAgainstType(fieldValue, fieldType, fieldName);

  // Recurse into objects if needed
  if (isObjectType(getNamedType(fieldType)) && fieldValue != null) {
    const subSelections = selection.selectionSet?.selections || [];
    for (const sub of subSelections) {
      validateSelection(sub, fieldValue, getNamedType(fieldType));
    }
  }
}

/**
 * Check a value against GraphQL type definition
 */
function checkValueAgainstType(value, type, fieldName) {
  if (isNonNullType(type)) {
    if (value === null || value === undefined) {
      console.error(`Field '${fieldName}' is NON-NULL but response returned null`);
      return;
    }
    return checkValueAgainstType(value, type.ofType, fieldName);
  }

  if (isListType(type)) {
    if (!Array.isArray(value)) {
      console.error(`Field '${fieldName}' is LIST but response returned non-list`);
      return;
    }
    value.forEach((v, i) => checkValueAgainstType(v, type.ofType, `${fieldName}[${i}]`));
  }

  // Scalars & nullable fields don’t need strict checking here
}