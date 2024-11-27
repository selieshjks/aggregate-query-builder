import mongoose, { Model, PipelineStage } from 'mongoose';

interface SubPipeline {
    [key: string]: PipelineStage[];
}

class AggregateQueryBuilder {
    private model: Model<any>;
    private pipeline: PipelineStage[];
    private subPipeline: SubPipeline;
    private subPipelineCounter: number;

    constructor(model: Model<any>) {
        this.model = model;
        this.pipeline = [];
        this.subPipeline = {};
        this.subPipelineCounter = 0;
    }

    // Match stage: Apply equality condition
    matchEqual(field: string, value: any, subPipelineName?: string): this {
        const matchStage: PipelineStage.Match = { $match: { [field]: value } };
        this.addToPipeline(matchStage, subPipelineName);
        return this;
    }

    // Match stage: Apply range condition (greater than, less than, etc.)
    matchRange(field: string, operator: string, value: any, subPipelineName?: string): this {
        const matchStage: PipelineStage.Match = { $match: { [field]: { [operator]: value } } };
        this.addToPipeline(matchStage, subPipelineName);
        return this;
    }

    // Match stage: Apply less than condition
    matchLessThan(field: string, value: any, subPipelineName?: string): this {
        return this.matchRange(field, '$lt', value, subPipelineName);
    }

    // Match stage: Apply greater than condition
    matchGreaterThan(field: string, value: any, subPipelineName?: string): this {
        return this.matchRange(field, '$gt', value, subPipelineName);
    }

    // Match stage: Apply conditional match, accepting subPipeline names
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

    // Lookup stage: Fetch reference collections
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

    // Unwind stage: Deconstruct arrays
    unwind(fields: string[], subPipelineName?: string): this {
        fields.forEach((field) => {
            const unwindStage: PipelineStage.Unwind = { $unwind: `$${field}Details` };
            this.addToPipeline(unwindStage, subPipelineName);
        });
        return this;
    }

    // Group stage: Group documents
    group(groupConditions: any, subPipelineName?: string): this {
        const groupStage: PipelineStage.Group = { $group: groupConditions };
        this.addToPipeline(groupStage, subPipelineName);
        return this;
    }

    // Project stage: Specify fields
    project(fields: any, subPipelineName?: string): this {
        const projectStage: PipelineStage.Project = { $project: fields };
        this.addToPipeline(projectStage, subPipelineName);
        return this;
    }

    // Sort stage: Sort documents
    sort(sortConditions: any, subPipelineName?: string): this {
        const sortStage: PipelineStage.Sort = { $sort: sortConditions };
        this.addToPipeline(sortStage, subPipelineName);
        return this;
    }

    // Skip stage: Skip documents
    skip(skipValue: number, subPipelineName?: string): this {
        const skipStage: PipelineStage.Skip = { $skip: skipValue };
        this.addToPipeline(skipStage, subPipelineName);
        return this;
    }

    // Limit stage: Limit documents
    limit(limitValue: number, subPipelineName?: string): this {
        const limitStage: PipelineStage.Limit = { $limit: limitValue };
        this.addToPipeline(limitStage, subPipelineName);
        return this;
    }

    // Facet stage: Run multiple aggregations
    facet(facets: any, subPipelineName?: string): this {
        const facetStage: PipelineStage.Facet = { $facet: facets };
        this.addToPipeline(facetStage, subPipelineName);
        return this;
    }

    // Append sub-pipeline to main pipeline
    appendSubPipeline(name: string): this {
        if (this.subPipeline[name]) {
            this.pipeline.push(...this.subPipeline[name]);
            delete this.subPipeline[name];
        }
        return this;
    }

    // Retrieve and remove a sub-pipeline by key
    getAndRemoveSubPipeline(name: string): PipelineStage[] | null {
        const sub = this.subPipeline[name] || null;
        if (sub) delete this.subPipeline[name];
        return sub;
    }

    // Add stage to appropriate pipeline
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

    // Build the final pipeline
    build(): PipelineStage[] {
        return this.pipeline;
    }

    // Generate default name for unnamed sub-pipelines
    private generateDefaultSubPipelineName(): string {
        return `subPipeline_${++this.subPipelineCounter}`;
    }
}

export default AggregateQueryBuilder;
