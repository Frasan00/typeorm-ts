import { Column } from "./Column";

interface IEntityInput {
    readonly entityName: string,
    readonly columns?: Column[],
};

export abstract class Entity {
    protected entityName: string;
    protected columns: Column[];

    public constructor(input: IEntityInput){
        this.entityName = input.entityName;
        this.columns = input.columns || [];
    }

    public getName(){ return this.entityName; }

    public addColumn(column: Column){ this.columns.push(column) }

    public addColumns(...columns: Column[]){ 
        columns.map((column) => this.columns.push(column));
     }

    public initializeColumns(){
        if(this.columns.length === 0) throw new Error(`There are no columns to initialize in Entity ${this.entityName}`);
        const query = `
        
        `;

        return query;
    }

}