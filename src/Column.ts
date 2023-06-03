export type ColumnType = 
    `STRING`
    | "INTEGER"
    | "FLOAT"
    | "BOOLEAN"
    | "DATE";

type IntegerBetweenZeroAnd255 = number & { __integerBetweenZeroAnd255__: true; };

export type ConstraintsType = {
    NOT_NULL?: boolean | false;
    UNIQUE?: boolean | false;
    DEFAULT?: ColumnType | false;
    AUTO_INCREMENT?: boolean | false;
};

interface IColumnInput {
    readonly name: string,
    readonly type: ColumnType,
    readonly typeLength?: IntegerBetweenZeroAnd255,
    readonly constraints?: ConstraintsType,
    value?: any,
};

export class Column {
    protected name: string;
    protected type: ColumnType;
    protected typeLength: number;
    protected constraints: ConstraintsType | undefined;
    protected value?: any;

    public constructor(input: IColumnInput){
        this.name = input.name;
        this.type = input.type;
        this.typeLength = input.typeLength || 50,
        this.constraints = input.constraints;
        this.value = input.value || null;
    }

    public getName(){ return this.name; }
    public getConf(){ return { type: this.type, typeLength: this.typeLength, constraints: this.constraints } }
    public getValue(){ return this.value; }
    public setValue(value: any){ this.value = value; }
}