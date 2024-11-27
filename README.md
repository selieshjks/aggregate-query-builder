# Aggregate Query Builder for MongoDB

## Overview

**Aggregate Query Builder** is a powerful and flexible library that simplifies the creation of MongoDB aggregation pipelines. With built-in support for sub-pipelines, conditional logic, and automatic handling of Mongoose schema references, it helps developers streamline complex aggregation operations.

Whether you’re working with simple filters or complex queries with multiple conditions, **Aggregate Query Builder** allows you to build, organize, and reuse MongoDB aggregation stages in a clean and readable way.

## Features

- **Sub-pipeline support**: Create sub-pipelines with custom names and reuse them.
- **Dynamic conditional logic**: Use `matchIf` with sub-pipelines for flexible condition-based queries.
- **Automatic `$lookup` handling**: Automatically fetch referenced collections based on Mongoose model schema.
- **Built-in aggregation stages**: Includes support for common aggregation stages like `$match`, `$group`, `$project`, `$sort`, `$facet`, and more.
- **TypeScript Support**: Full TypeScript support for type safety and autocompletion.
- **Chained API**: Build aggregation pipelines step by step with a clean and readable API.

## Installation

To get started, simply install the package from npm:

```bash
npm install @selieshjks/aggregate-query-builder
```

## Usage

### JavaScript Example

```javascript
const mongoose = require("mongoose");
const AggregateQueryBuilder = require("@selieshjks/aggregate-query-builder");

const model = mongoose.model("User", new mongoose.Schema({
  name: String,
  age: Number,
  city: String,
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: "Friend" }
}));

const builder = new AggregateQueryBuilder(model);

// Create sub-pipelines
builder.matchEqual("age", { $gte: 30 }, "ageFilter");
builder.matchEqual("city", "New York", "cityFilter");

// Use sub-pipelines in matchIf
builder.matchIf("ageFilter", "cityFilter", null);

// Build and output the final pipeline
const pipeline = builder.build();

console.log(JSON.stringify(pipeline, null, 2));
```

### TypeScript Example

```typescript
import mongoose, { Model } from "mongoose";
import AggregateQueryBuilder from "@selieshjks/aggregate-query-builder";

const model: Model<any> = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    age: Number,
    city: String,
    friendId: { type: mongoose.Schema.Types.ObjectId, ref: "Friend" },
  })
);

const builder = new AggregateQueryBuilder(model);

// Define sub-pipelines
builder.matchEqual("age", { $gte: 30 }, "ageFilter");
builder.matchEqual("city", "New York", "cityFilter");

// Use sub-pipelines in conditional match
builder.matchIf("ageFilter", "cityFilter", null);

// Build the pipeline and log it
const pipeline = builder.build();
console.log(JSON.stringify(pipeline, null, 2));
```

## API Methods

### `matchEqual(field, value, subPipelineName)`
- Adds a `$match` stage for equality condition.
- **Parameters**:
  - `field`: The field to match.
  - `value`: The value to match against.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `matchRange(field, operator, value, subPipelineName)`
- Adds a `$match` stage for range conditions (e.g., `$gt`, `$lt`).
- **Parameters**:
  - `field`: The field to match.
  - `operator`: The operator (e.g., `$gt`, `$lt`).
  - `value`: The value to compare.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `matchIf(subPipelineName, conditionKey, trueMatch, falseMatch)`
- Adds a `$match` stage with conditional logic using sub-pipelines.
- **Parameters**:
  - `subPipelineName`: The name of the sub-pipeline containing the condition (`trueMatch` and `falseMatch`).
  - `conditionKey`: The key used to retrieve the condition from the sub-pipeline.
  - `trueMatch`: The match condition to apply if the condition is `true`.
  - `falseMatch`: The match condition to apply if the condition is `false`.

### `matchSwitch(subPipelineName, switchField, cases)`
- Adds a `$match` stage with a `switch` condition, based on a field and set of cases.
- **Parameters**:
  - `subPipelineName`: The name of the sub-pipeline containing the cases.
  - `switchField`: The field to evaluate.
  - `cases`: An array of case objects where each object contains `caseCondition` and `then` condition.

### `lookup(fields, subPipelineName)`
- Adds `$lookup` stages based on Mongoose schema references.
- **Parameters**:
  - `fields`: The fields to lookup.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `unwind(fields, subPipelineName)`
- Adds `$unwind` stages to deconstruct arrays.
- **Parameters**:
  - `fields`: The fields to unwind.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `group(groupConditions, subPipelineName)`
- Adds a `$group` stage to group documents based on conditions.
- **Parameters**:
  - `groupConditions`: The conditions for grouping.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `project(fields, subPipelineName)`
- Adds a `$project` stage to specify fields to include or exclude.
- **Parameters**:
  - `fields`: The fields to include or exclude.
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `sort(sortConditions, subPipelineName)`
- Adds a `$sort` stage to sort documents based on specified conditions.
- **Parameters**:
  - `sortConditions`: The sort conditions (e.g., `{ age: 1 }` for ascending).
  - `subPipelineName`: The name of the sub-pipeline. This is a required parameter.

### `appendSubPipeline(subPipelineName)`
- Appends the sub-pipeline with the specified name to the main pipeline.
- **Parameters**:
  - `subPipelineName`: The name of the sub-pipeline to append.

### `build()`
- Builds and returns the complete aggregation pipeline, combining all stages and sub-pipelines.

## Example: Using Sub-Pipelines

Here’s a more complex example showing how to use sub-pipelines effectively:

```javascript
const builder = new AggregateQueryBuilder(model);

// Create sub-pipelines
builder.matchEqual("age", { $gte: 30 }, "ageFilter");
builder.matchEqual("city", "New York", "cityFilter");
builder.matchEqual("height",{$lte: 160}, "heightFilter");

// Use sub-pipelines in a matchIf stage
builder.matchIf("ageFilter", "cityFilter", "heightFilter");

// Append the sub-pipeline and build the final pipeline
builder.appendSubPipeline();
const pipeline = builder.build();

console.log(JSON.stringify(pipeline, null, 2));
```

## Contribution

If you’d like to contribute, feel free to fork the repo, open an issue, or submit a pull request. Contributions are always welcome!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## GitHub Repository

Check out the project on GitHub: [Aggregate Query Builder GitHub](https://github.com/selieshjks/aggregate-query-builder)

## npm Package

Install from npm: [@selieshjks/aggregate-query-builder](https://www.npmjs.com/package/@selieshjks/aggregate-query-builder)

