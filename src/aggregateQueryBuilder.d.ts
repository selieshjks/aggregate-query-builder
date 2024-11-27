import { Model } from 'mongoose';

export type SubPipeline = Record<string, object[]>;

export interface AggregateQueryBuilderInterface {
    matchEqual(field: string, value: any, isSubPipeline?: boolean): this;
    matchRange(field: string, operator: string, value: any, isSubPipeline?: boolean): this;
    matchLessThan(field: string, value: any, isSubPipeline?: boolean): this;
    matchGreaterThan(field: string, value: any, isSubPipeline?: boolean): this;
    matchIf(condition: object, truePipeline: string, falsePipeline: string, isSubPipeline?: boolean): this;
    matchSwitch(cases: { caseCondition: object; then: object }[], isSubPipeline?: boolean): this;
    lookup(fields: string[], isSubPipeline?: boolean): Promise<this>;
    unwind(fields: string[], isSubPipeline?: boolean): this;
    group(groupConditions: object, isSubPipeline?: boolean): this;
    project(fields: object, isSubPipeline?: boolean): this;
    sort(sortConditions: object, isSubPipeline?: boolean): this;
    skip(skipValue: number, isSubPipeline?: boolean): this;
    limit(limitValue: number, isSubPipeline?: boolean): this;
    facet(facets: object, isSubPipeline?: boolean): this;
    setSubPipeline(name: string, subPipeline: object[]): this;
    appendSubPipeline(): this;
    getSubPipeline(name: string): object[] | null;
    build(): object[];
}

declare class AggregateQueryBuilder implements AggregateQueryBuilderInterface {
    constructor(model: Model<any>);
    private pipeline: object[];
    private subPipeline: SubPipeline;
}

export default AggregateQueryBuilder;
