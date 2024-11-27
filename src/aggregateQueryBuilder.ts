import { Model, Schema, Types } from 'mongoose';

type SubPipeline = Record<string, object[]>;

class AggregateQueryBuilder {
    private model: Model<any>;
    private pipeline: object[];
    private subPipeline: SubPipeline;
    private subPipelineCounter: number;

    constructor(model: Model<any>) {
        this.model = model;
        this.pipeline = [];
        this.subPipeline = {};
        this.subPipelineCounter = 0;
    }

    // Generate a default name for unnamed sub-pipelines
    private generateDefaultSubPipelineName(): string {
        return `subPipeline_${this.subPipelineCounter++}`;
    }

    // Match stage: Apply equality condition
    matchEqual(field: string, value: any, isSubPipeline: boolean = false, subPipelineName?: string): this {
        const matchStage = { $match: { [field]: value } };
        const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();

        if (isSubPipeline) {
            if (!this.subPipeline[pipelineName]) this.subPipeline[pipelineName] = [];
            this.subPipeline[pipelineName].push(matchStage);
        } else {
            this.pipeline.push(matchStage);
        }

        return this;
    }

    // Match stage: Apply range condition (greater than, less than, etc.)
    matchRange(field: string, operator: string, value: any, isSubPipeline: boolean = false, subPipelineName?: string): this {
        const rangeCondition = { [field]: { [operator]: value } };
        const matchStage = { $match: rangeCondition };
        const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();

        if (isSubPipeline) {
            if (!this.subPipeline[pipelineName]) this.subPipeline[pipelineName] = [];
            this.subPipeline[pipelineName].push(matchStage);
        } else {
            this.pipeline.push(matchStage);
        }

        return this;
    }

    // Match stage: Apply conditional match based on a condition
    matchIf(condition: object, truePipeline: string, falsePipeline: string, isSubPipeline: boolean = false, subPipelineName?: string): this {
        const trueStage = this.subPipeline[truePipeline];
        const falseStage = this.subPipeline[falsePipeline];

        if (!trueStage || !falseStage) {
            throw new Error('Sub-pipeline names for true and false conditions must exist.');
        }

        const condStage = {
            $match: {
                $cond: {
                    if: condition,
                    then: trueStage,
                    else: falseStage,
                },
            },
        };

        const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();

        if (isSubPipeline) {
            if (!this.subPipeline[pipelineName]) this.subPipeline[pipelineName] = [];
            this.subPipeline[pipelineName].push(condStage);
        } else {
            this.pipeline.push(condStage);
        }

        return this;
    }

    // Lookup stage: Automatically fetch reference collections based on model schema
    async lookup(fields: string[], isSubPipeline: boolean = false, subPipelineName?: string): Promise<this> {
        if (Array.isArray(fields)) {
            for (const field of fields) {
                const schema = this.model.schema.path(field) as any;

                if (schema && schema.options && schema.options.ref) {
                    const refModel = this.model.db.model(schema.options.ref);
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

                    const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();

                    if (isSubPipeline) {
                        if (!this.subPipeline[pipelineName]) this.subPipeline[pipelineName] = [];
                        this.subPipeline[pipelineName].push(lookupStage);
                    } else {
                        this.pipeline.push(lookupStage);
                    }
                }
            }
        }
        return this;
    }

    // Append sub-pipeline stages to the main pipeline
    appendSubPipeline(subPipelineName?: string): this {
        const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();
        const subPipeline = this.subPipeline[pipelineName];

        if (subPipeline) {
            this.pipeline.push(...subPipeline);
            delete this.subPipeline[pipelineName];
        }

        return this;
    }

    // Retrieve a sub-pipeline by name
    getSubPipeline(subPipelineName: string): object[] | null {
        const subPipeline = this.subPipeline[subPipelineName];
        if (subPipeline) {
            delete this.subPipeline[subPipelineName];
            return subPipeline;
        }
        return null;
    }

    // Group stage: Group documents and compute aggregate values
    group(groupConditions: object, isSubPipeline: boolean = false, subPipelineName?: string): this {
        const groupStage = { $group: groupConditions };
        const pipelineName = subPipelineName || this.generateDefaultSubPipelineName();

        if (isSubPipeline) {
            if (!this.subPipeline[pipelineName]) this.subPipeline[pipelineName] = [];
            this.subPipeline[pipelineName].push(groupStage);
        } else {
            this.pipeline.push(groupStage);
        }

        return this;
    }

    // Build the final pipeline
    build(): object[] {
        return this.pipeline;
    }
}

export default AggregateQueryBuilder;
