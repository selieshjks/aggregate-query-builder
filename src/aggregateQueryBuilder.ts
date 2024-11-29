import mongoose, { Model, PipelineStage } from 'mongoose';

/**
 * Interface representing a sub-pipeline.
 */
interface SubPipeline {
    [key: string]: PipelineStage[];
}

/**
 * A utility class for building MongoDB aggregation pipelines dynamically.
 */
class AggregateQueryBuilder {
    private model: Model<any>; // Mongoose model 
    private pipeline: PipelineStage[];// Main pipeline stages
    private subPipeline: SubPipeline; // Named sub-pipelines for reusable queries
    private subPipelineCounter: number;

    /**
     * Creates an instance of the AggregateQueryBuilder.
     * @param model - The Mongoose model to build the aggregation pipeline for.
     */
    constructor(model: Model<any>) {
        this.model = model;
        this.pipeline = [];
        this.subPipeline = {};
        this.subPipelineCounter = 0;
    }

    /**
     * Adds a match stage to filter documents based on an equality condition.
     * @param field - The field to match on.
     * @param value - The value to match.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    matchEqual(field: string, value: any, subPipelineName?: string): this {
        const matchStage: PipelineStage.Match = { $match: { [field]: value } };
        this.addToPipeline(matchStage, subPipelineName);
        return this;
    }

    /**
     * Adds a match stage for range conditions (e.g., greater than, less than).
     * @param field - The field to apply the range condition on.
     * @param operator - The range operator (`$gt`, `$lt`, `$gte`, `$lte`).
     * @param value - The value for the condition.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    matchRange(field: string, operator: string, value: any, subPipelineName?: string): this {
        const matchStage: PipelineStage.Match = { $match: { [field]: { [operator]: value } } };
        this.addToPipeline(matchStage, subPipelineName);
        return this;
    }

    /**
     * Adds a match stage to filter documents where a field is less than a value.
     * @param field - The field to filter.
     * @param value - The upper limit value.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */

    matchLessThan(field: string, value: any, subPipelineName?: string): this {
        return this.matchRange(field, '$lt', value, subPipelineName);
    }

    /**
     * Adds a match stage to filter documents where a field is greater than a value.
     * @param field - The field to filter.
     * @param value - The lower limit value.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    matchGreaterThan(field: string, value: any, subPipelineName?: string): this {
        return this.matchRange(field, '$gt', value, subPipelineName);
    }

    /**
     * Adds a conditional match stage using `$cond`.
     * @param conditionSubPipelineName - Name of the sub-pipeline defining the condition.
     * @param trueMatchSubPipelineName - Name of the sub-pipeline for `then` condition.
     * @param falseMatchSubPipelineName - Name of the sub-pipeline for `else` condition.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    matchIf(
        conditionPipelineName: string,
        trueMatchPipelineName: string,
        falseMatchPipelineName: string,
        subPipelineName?: string
    ): this {
        const condition = this.getAndRemoveSubPipeline(conditionPipelineName);
        const trueMatch = this.getAndRemoveSubPipeline(trueMatchPipelineName);
        const falseMatch = this.getAndRemoveSubPipeline(falseMatchPipelineName);

        if (!condition || !trueMatch || !falseMatch) {
            throw new Error(
                `One or more sub-pipelines not found: ${conditionPipelineName}, ${trueMatchPipelineName}, ${falseMatchPipelineName}`
            );
        }

        const condStage: PipelineStage.Match = {
            $match: {
                $expr: {
                    $cond: {
                        if: { $and: condition },
                        then: { $and: trueMatch },
                        else: { $and: falseMatch },
                    },
                },
            },
        };

        this.addToPipeline(condStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$switch` stage to the pipeline, allowing case-like conditional filtering.
     * @param switchField - The field to evaluate for switching.
     * @param cases - An array of case conditions with corresponding actions.
     * Each case should be an object with `caseCondition` and `then` properties.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    matchSwitch (
        switchField: string,
        cases: Array<{ caseCondition: any; then: any }>,
        subPipelineName?: string
    ): this {
        const switchStages = {
            $switch: {
                branches: cases.map((item) => ({
                    case: item.caseCondition,
                    then: item.then,
                })),
                default: null,
            },
        };

        const condStage = {
            $addFields: {
                [switchField]: switchStages,
            },
        };

        this.addToPipeline(condStage, subPipelineName);

        return this;
    }

    /**
     * Adds a `$lookup` stage for referencing related documents in other collections.
     * @param fields - Array of field names to lookup.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns A promise resolving to the current instance for method chaining.
     */
    async lookup(fields: string[], subPipelineName?: string): Promise<this> {
        for (const field of fields) {
            const schema = this.model.schema.path(field) as any;
            if (schema?.options?.ref) {
                const refModel = mongoose.model(schema.options.ref);
                const from = refModel.collection.collectionName;
                const localField = field;
                const foreignField = '_id';
                const as = `${field}Details`;

                const lookupStage: PipelineStage.Lookup = {
                    $lookup: {
                        from,
                        localField,
                        foreignField,
                        as,
                    },
                };

                this.addToPipeline(lookupStage, subPipelineName);
            }
        }
        return this;
    }

    /**
     * Adds an `$unwind` stage to deconstruct an array field.
     * @param fields - Array of field names to unwind.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    unwind(fields: string[], subPipelineName?: string): this {
        fields.forEach((field) => {
            const unwindStage: PipelineStage.Unwind = { $unwind: `$${field}Details` };
            this.addToPipeline(unwindStage, subPipelineName);
        });
        return this;
    }

    /**
     * Adds a `$group` stage for aggregating data.
     * @param groupConditions - Conditions for grouping and aggregating data.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    group(groupConditions: any, subPipelineName?: string): this {
        const groupStage: PipelineStage.Group = { $group: groupConditions };
        this.addToPipeline(groupStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$project` stage for including or excluding specific fields.
     * @param fields - Fields to include/exclude.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    project(fields: any, subPipelineName?: string): this {
        const projectStage: PipelineStage.Project = { $project: fields };
        this.addToPipeline(projectStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$sort` stage to sort documents.
     * @param sortConditions - Sort conditions.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    sort(sortConditions: any, subPipelineName?: string): this {
        const sortStage: PipelineStage.Sort = { $sort: sortConditions };
        this.addToPipeline(sortStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$skip` stage to skip a number of documents.
     * @param skipValue - Number of documents to skip.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    skip(skipValue: number, subPipelineName?: string): this {
        const skipStage: PipelineStage.Skip = { $skip: skipValue };
        this.addToPipeline(skipStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$limit` stage to limit the number of documents.
     * @param limitValue - Maximum number of documents to return.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    limit(limitValue: number, subPipelineName?: string): this {
        const limitStage: PipelineStage.Limit = { $limit: limitValue };
        this.addToPipeline(limitStage, subPipelineName);
        return this;
    }

    /**
     * Adds a `$facet` stage to run multiple aggregations in parallel.
     * @param facets - An object with multiple pipeline definitions.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which this stage will be added.
     * @returns The current instance for method chaining.
     */
    facet(facets: any, subPipelineName?: string): this {
        const facetStage: PipelineStage.Facet = { $facet: facets };
        this.addToPipeline(facetStage, subPipelineName);
        return this;
    }

    /**
     * Appends a sub-pipeline to the main pipeline.
     * @param subPipelineName - The name of the sub-pipeline to append.
     * @returns The current instance for method chaining.
     */
    appendSubPipeline(name: string): this {
        if (this.subPipeline[name]) {
            this.pipeline.push(...this.subPipeline[name]);
            delete this.subPipeline[name];
        }
        return this;
    }

    /**
     * Retrieves a sub-pipeline by name and removes it from the sub-pipelines.
     * @param subPipelineName - The name of the sub-pipeline to retrieve.
     * @returns The retrieved sub-pipeline.
     */
    getAndRemoveSubPipeline(name: string): PipelineStage[] | null {
        const sub = this.subPipeline[name] || null;
        if (sub) delete this.subPipeline[name];
        return sub;
    }

    /**
     * Adds a stage to either the main pipeline or a specified sub-pipeline.
     * @param stage - The aggregation stage to add.
     * @param subPipelineName - (Optional) The name of the sub-pipeline to which the stage should be added.
     * If not provided, the stage is added to the main pipeline.
     * @returns The current instance for method chaining.
     */
    private addToPipeline(stage: PipelineStage, subPipelineName?: string): void {
        if (subPipelineName) {
            if (!this.subPipeline[subPipelineName]) {
                this.subPipeline[subPipelineName] = [];
            }
            this.subPipeline[subPipelineName].push(stage);
        } else {
            this.pipeline.push(stage);
        }
    }

    /**
     * Builds and returns the complete aggregation pipeline.
     * @returns The final aggregation pipeline as an array of stages.
     */
    build(): PipelineStage[] {
        return this.pipeline;
    }

    /**
     * Generates a unique default name for a sub-pipeline.
     * @returns A string representing the unique name for the sub-pipeline.
     */
    private generateDefaultSubPipelineName(): string {
        return `subPipeline_${++this.subPipelineCounter}`;
    }
}

export default AggregateQueryBuilder;
