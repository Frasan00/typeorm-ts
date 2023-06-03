export type ColumnType = 
    `VARCHAR(${number})` 
    | `CHAR(${number})` 
    | `TEXT(${number})` 
    | `BLOB(${number})` 
    | `ENUM<${string}>` 
    | `ENUM<${any}>` 
    | `BIT(${number})` 
    | `INTEGER(${number})` 
    | `BOOLEAN(${number})` 
    | `FLOAT(${number})` 
    | `DATE`;

export type ConstraintsType = {
    NOT_NULL?: boolean | false;
    UNIQUE?: boolean | false;
    DEFAULT?: ColumnType | false;
    AUTO_INCREMENT?: boolean | false;
}

interface IColumnInput {
    readonly name: string,
    readonly type: ColumnType,
    readonly constraints?: ConstraintsType,
    value?: any,
};

export class Column {
    protected name: string;
    protected type: ColumnType;
    protected constraints: ConstraintsType | undefined;
    protected value?: any;

    public constructor(input: IColumnInput){
        this.name = input.name;
        this.type = input.type;
        this.constraints = input.constraints;
        this.value = input.value || null;
    }

    public getName(){ return this.name; }
    public getConf(){ return { type: this.type, constraints: this.constraints } }
    public getValue(){ return this.value; }
    public setValue(value: any){ this.value = value; }
}