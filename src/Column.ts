
type ColumnConfigType = {
    type: string | number | Date | boolean, // to update
    constraints: {
        not_null?: boolean | false;
        unique?: boolean | false;
        primary_key?: boolean | false;
        foreign_key?: boolean | false;
        default?: boolean | false;
    }
}

interface IColumnInput {
    readonly name: string,
    readonly config: ColumnConfigType,
};

export class Column {
    protected config: ColumnConfigType;
    protected name: string;

    public constructor(input: IColumnInput){
        this.config = input.config;
        this.name = input.name;
    }

    public getName(){ return this.name; }
    public getConf(){ return this.config }
}