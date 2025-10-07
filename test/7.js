/**
 * Universal GraphQL schema validator
 * Supports both .graphql (SDL) and introspection .json schema formats
 * Correctly unwraps NonNull and List types
 */

import fs from "fs";
import {
  buildSchema,
  buildClientSchema,
  graphql,
  parse,
  validate,
  getNamedType,
  isNonNullType,
  isListType,
  isObjectType,
} from "graphql";

// ---------- 1. Load Schema ----------
function loadSchema(schemaPath) {
  const content = fs.readFileSync(schemaPath, "utf8");
  if (schemaPath.endsWith(".json")) {
    console.log("Detected JSON introspection schema...");
    const introspection = JSON.parse(content);
    if (!introspection.data || !introspection.data.__schema) {
      throw new Error("Invalid introspection JSON. Expected `data.__schema`.");
    }
    return buildClientSchema(introspection.data);
  } else {
    console.log("Detected SDL (.graphql) schema...");
    return buildSchema(content);
  }
}

const schema = loadSchema("./schema.json"); // or schema.graphql

// ---------- 2. Load Query, Variables, and Response ----------
const query = `
  query($criteria: CriteriaInput!) {
    search(criteria: $criteria) {
      accounts {
        id
        name
      }
      products {
        id
        title
      }
    }
  }
`;

const variables = JSON.parse(fs.readFileSync("./variables.json", "utf8"));
const response = JSON.parse(fs.readFileSync("./response.json", "utf8"));

// ---------- 3. Validate Query ----------
const validationErrors = validate(schema, parse(query));
if (validationErrors.length > 0) {
  console.error("Query does not match schema:");
  console.error(validationErrors);
  process.exit(1);
}

// ---------- 4. Validate Variables ----------
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

  // ---------- 5. Validate Response ----------
  console.log("\n🔍 Validating backend response...");

  if (!response.data) {
    console.error("Response missing 'data' field");
    process.exit(1);
  }

  const queryAST = parse(query);
  const operation = queryAST.definitions.find((d) => d.kind === "OperationDefinition");

  for (const selection of operation.selectionSet.selections) {
    validateSelection(selection, response.data, schema.getQueryType());
  }

  console.log("Response structure validation complete.");
});

// ---------- Recursive Validation ----------
function validateSelection(selection, data, parentType) {
  if (selection.kind !== "Field") return;

  const fieldName = selection.name.value;
  const fieldDef = parentType.getFields()[fieldName];
  if (!fieldDef) {
    console.warn(`Field '${fieldName}' not found in schema for type '${parentType.name}'`);
    return;
  }

  const fieldType = fieldDef.type;
  const fieldValue = data[fieldName];

  checkValueAgainstType(fieldValue, fieldType, fieldName);

  const unwrapped = unwrapType(fieldType);
  if (isObjectType(unwrapped) && fieldValue != null) {
    const subSelections = selection.selectionSet?.selections || [];
    for (const sub of subSelections) {
      validateSelection(sub, fieldValue, unwrapped);
    }
  }
}

function unwrapType(type) {
  let unwrapped = type;
  while (isNonNullType(unwrapped) || isListType(unwrapped)) {
    unwrapped = unwrapped.ofType;
  }
  return unwrapped;
}

function checkValueAgainstType(value, type, fieldName) {
  // Handle NonNull
  if (isNonNullType(type)) {
    if (value === null || value === undefined) {
      console.error(`Field '${fieldName}' is NON-NULL but response returned null`);
      return;
    }
    return checkValueAgainstType(value, type.ofType, fieldName);
  }

  // Handle Lists
  if (isListType(type)) {
    if (!Array.isArray(value)) {
      console.error(`Field '${fieldName}' is LIST but response returned non-list (type=${typeof value})`);
      return;
    }
    value.forEach((v, i) => checkValueAgainstType(v, type.ofType, `${fieldName}[${i}]`));
    return;
  }

  // Handle Objects
  const namedType = getNamedType(type);
  if (isObjectType(namedType) && typeof value === "object" && value !== null) {
    const subFields = namedType.getFields();
    for (const key of Object.keys(value)) {
      if (!subFields[key]) continue;
      const subType = subFields[key].type;
      checkValueAgainstType(value[key], subType, `${fieldName}.${key}`);
    }
  }
}