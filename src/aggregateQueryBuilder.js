// src/aggregateQueryBuilder.js
const mongoose = require('mongoose');

class AggregateQueryBuilder {
    constructor(model) {
        this.model = model;
        this.pipeline = [];             // Main pipeline
        this.subPipeline = {};          // Sub-pipeline as an object (key-value pairs)
        this.subPipelineCount = 1;      // Counter to generate default sub-pipeline names
    }

    // Helper function to generate default sub-pipeline name
    generateSubPipelineName() {
        return `subPipeline${this.subPipelineCount++}`;
    }

    // Match stage: Apply equality condition
    matchEqual(field, value, isSubPipeline = false, name = '') {
        const matchStage = { $match: { [field]: value } };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = matchStage; // Store in sub-pipeline object by key
        } else {
            this.pipeline.push(matchStage);
        }
        return this; // Allow method chaining
    }

    // Match stage: Apply range condition (greater than, less than, etc.)
    matchRange(field, operator, value, isSubPipeline = false, name = '') {
        const rangeCondition = { [field]: { [operator]: value } };
        const matchStage = { $match: rangeCondition };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = matchStage;
        } else {
            this.pipeline.push(matchStage);
        }
        return this; // Allow method chaining
    }

    // Match stage: Apply less than condition
    matchLessThan(field, value, isSubPipeline = false, name = '') {
        return this.matchRange(field, '$lt', value, isSubPipeline, name); // Reusing matchRange for less than
    }

    // Match stage: Apply greater than condition
    matchGreaterThan(field, value, isSubPipeline = false, name = '') {
        return this.matchRange(field, '$gt', value, isSubPipeline, name); // Reusing matchRange for greater than
    }

    // Match stage: Apply conditional match based on some condition
    matchIf(condition, trueMatch, falseMatch, isSubPipeline = false, name = '') {
        const condStage = {
            $match: {
                $cond: {
                    if: condition,
                    then: trueMatch,
                    else: falseMatch,
                },
            },
        };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = condStage;
        } else {
            this.pipeline.push(condStage);
        }
        return this; // Allow method chaining
    }

    // Match stage: Apply a switch condition (like a case statement)
    matchSwitch(switchField, cases, isSubPipeline = false, name = '') {
        const switchStage = {
            $match: {
                $switch: {
                    branches: cases.map(({ caseCondition, then }) => ({
                        case: caseCondition,
                        then,
                    })),
                    default: null, // Default if no case matches
                },
            },
        };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = switchStage;
        } else {
            this.pipeline.push(switchStage);
        }
        return this; // Allow method chaining
    }

    // Lookup stage: Automatically fetch reference collections based on model schema
    async lookup(fields, isSubPipeline = false, name = '') {
        if (Array.isArray(fields)) {
            for (const field of fields) {
                const schema = this.model.schema.path(field);
                if (schema && schema.options && schema.options.ref) {
                    const refModel = mongoose.model(schema.options.ref);
                    const from = refModel.collection.collectionName;
                    const localField = field;
                    const foreignField = '_id';
                    const as = `${field}Details`;

                    const lookupStage = {
                        $lookup: {
                            from,
                            localField,
                            foreignField,
                            as,
                        },
                    };
                    if (isSubPipeline) {
                        const pipelineName = name || this.generateSubPipelineName();
                        this.subPipeline[pipelineName] = lookupStage;
                    } else {
                        this.pipeline.push(lookupStage);
                    }
                }
            }
        }
        return this; // Allow method chaining
    }

    // Unwind stage: Deconstruct arrays from lookup stage
    unwind(fields, isSubPipeline = false, name = '') {
        if (Array.isArray(fields)) {
            fields.forEach((field) => {
                const unwindStage = { $unwind: `$${field}Details` };
                if (isSubPipeline) {
                    const pipelineName = name || this.generateSubPipelineName();
                    this.subPipeline[pipelineName] = unwindStage;
                } else {
                    this.pipeline.push(unwindStage);
                }
            });
        }
        return this; // Allow method chaining
    }

    // Group stage: Group documents and compute aggregate values
    group(groupConditions, isSubPipeline = false, name = '') {
        const groupStage = { $group: groupConditions };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = groupStage;
        } else {
            this.pipeline.push(groupStage);
        }
        return this; // Allow method chaining
    }

    // Project stage: Specify fields to include/exclude
    project(fields, isSubPipeline = false, name = '') {
        const projectStage = { $project: fields };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = projectStage;
        } else {
            this.pipeline.push(projectStage);
        }
        return this; // Allow method chaining
    }

    // Sort stage: Sort documents
    sort(sortConditions, isSubPipeline = false, name = '') {
        const sortStage = { $sort: sortConditions };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = sortStage;
        } else {
            this.pipeline.push(sortStage);
        }
        return this; // Allow method chaining
    }

    // Skip stage: For pagination
    skip(skipValue, isSubPipeline = false, name = '') {
        const skipStage = { $skip: skipValue };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = skipStage;
        } else {
            this.pipeline.push(skipStage);
        }
        return this; // Allow method chaining
    }

    // Limit stage: For pagination
    limit(limitValue, isSubPipeline = false, name = '') {
        const limitStage = { $limit: limitValue };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = limitStage;
        } else {
            this.pipeline.push(limitStage);
        }
        return this; // Allow method chaining
    }

    // Facet stage: Run multiple aggregations in parallel
    facet(facets, isSubPipeline = false, name = '') {
        const facetStage = { $facet: facets };
        if (isSubPipeline) {
            const pipelineName = name || this.generateSubPipelineName();
            this.subPipeline[pipelineName] = facetStage;
        } else {
            this.pipeline.push(facetStage);
        }
        return this; // Allow method chaining
    }

    // Append sub-pipeline to main pipeline
    appendSubPipeline() {
        Object.values(this.subPipeline).forEach(subStage => {
            this.pipeline.push(subStage); // Append each sub-pipeline stage to the main pipeline
        });
        this.subPipeline = {};  // Clear sub-pipeline after appending
        return this; // Allow method chaining
    }

    // Get a sub-pipeline by key and remove it from sub-pipeline
    getSubPipelineByKey(key) {
        const subPipeline = this.subPipeline[key];
        if (subPipeline) {
            delete this.subPipeline[key];  // Remove the sub-pipeline from the object
        }
        return subPipeline;  // Return the retrieved sub-pipeline
    }

    // Build the final pipeline
    build() {
        return this.pipeline;
    }
}

module.exports = AggregateQueryBuilder;