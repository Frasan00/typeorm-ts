export type ColumnType = `VARCHAR(${number})` | `CHAR(${number})` | `TEXT(${number})` | `BLOB(${number})` | `ENUM<${string}>` | `ENUM<${any}>` | `BIT(${number})` | `INTEGER(${number})` | `BOOLEAN(${number})` | `FLOAT(${number})` | `DATE` | "YEAR";

export type ConstraintsType = {
    NOT_NULL?: boolean | false;
    UNIQUE?: boolean | false;
    DEFAULT?: ColumnType | false;
    AUTO_INCREMENT?: boolean | false;
}

interface IColumnInput {
    readonly name: string,
    readonly type: ColumnType,
    readonly constraints?: ConstraintsType
};

export class Column {
    protected name: string;
    protected type: any;
    protected constraints: ConstraintsType | undefined;

    public constructor(input: IColumnInput){
        this.name = input.name;
        this.type = input.type;
        this.constraints = input.constraints;
    }

    public getName(){ return this.name; }
    public getConf(){ return { type: this.type, constraints: this.constraints } }
}