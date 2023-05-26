import { Column } from "./Column";

interface IEntityInput {
    readonly name: string,
    readonly columns: Column[],
};

export abstract class Entity {
    protected name: string;
    protected columns: Column[];

    public constructor(input: IEntityInput){
        this.name = input.name;
        this.columns = input.columns;
    }

    public initializeColumns(){
        
    }

}