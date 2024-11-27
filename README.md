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

### matchEqual(field, value, isSubPipeline = false)
- Adds a `$match` stage for equality condition.
- **Parameters**:
  - `field`: The field to match.
  - `value`: The value to match against.
  - `isSubPipeline`: If `true`, the match is added to a sub-pipeline.
  
### matchRange(field, operator, value, isSubPipeline = false)
- Adds a `$match` stage for range conditions (e.g., `$gt`, `$lt`).
- **Parameters**:
  - `field`: The field to match.
  - `operator`: The operator (e.g., `$gt`, `$lt`).
  - `value`: The value to compare.
  - `isSubPipeline`: If `true`, the match is added to a sub-pipeline.

### matchIf(condition, trueMatch, falseMatch, isSubPipeline = false)
- Adds a `$match` stage with conditional logic.
- **Parameters**:
  - `condition`: The condition to evaluate.
  - `trueMatch`: The match stage if the condition is `true`.
  - `falseMatch`: The match stage if the condition is `false`.
  - `isSubPipeline`: If `true`, the match is added to a sub-pipeline.

### matchSwitch(switchField, cases, isSubPipeline = false)
- Adds a `$match` stage with a `switch` condition.
- **Parameters**:
  - `switchField`: The field to evaluate.
  - `cases`: The cases for the switch.
  - `isSubPipeline`: If `true`, the match is added to a sub-pipeline.

### lookup(fields, isSubPipeline = false)
- Adds `$lookup` stages based on Mongoose schema references.
- **Parameters**:
  - `fields`: The fields to lookup.
  - `isSubPipeline`: If `true`, the lookup is added to a sub-pipeline.

### unwind(fields, isSubPipeline = false)
- Adds `$unwind` stages to deconstruct arrays.
- **Parameters**:
  - `fields`: The fields to unwind.
  - `isSubPipeline`: If `true`, the unwind is added to a sub-pipeline.

### group(groupConditions, isSubPipeline = false)
- Adds a `$group` stage to group documents.
- **Parameters**:
  - `groupConditions`: The conditions for grouping.
  - `isSubPipeline`: If `true`, the group is added to a sub-pipeline.

### project(fields, isSubPipeline = false)
- Adds a `$project` stage to specify fields to include or exclude.
- **Parameters**:
  - `fields`: The fields to include or exclude.
  - `isSubPipeline`: If `true`, the project is added to a sub-pipeline.

### sort(sortConditions, isSubPipeline = false)
- Adds a `$sort` stage to sort documents.
- **Parameters**:
  - `sortConditions`: The sort conditions.
  - `isSubPipeline`: If `true`, the sort is added to a sub-pipeline.

### skip(skipValue, isSubPipeline = false)
- Adds a `$skip` stage for pagination.
- **Parameters**:
  - `skipValue`: The number of documents to skip.
  - `isSubPipeline`: If `true`, the skip is added to a sub-pipeline.

### limit(limitValue, isSubPipeline = false)
- Adds a `$limit` stage for pagination.
- **Parameters**:
  - `limitValue`: The maximum number of documents to return.
  - `isSubPipeline`: If `true`, the limit is added to a sub-pipeline.

### facet(facets, isSubPipeline = false)
- Adds a `$facet` stage to run multiple aggregations in parallel.
- **Parameters**:
  - `facets`: The facets to include.
  - `isSubPipeline`: If `true`, the facet is added to a sub-pipeline.

### appendSubPipeline()
- Appends the sub-pipeline to the main pipeline.
- Clears the sub-pipeline after appending.

### build()
- Builds the final aggregation pipeline.

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

