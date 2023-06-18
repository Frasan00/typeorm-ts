import { Column } from "./Column";
import { Entity, RelationsType } from "./Entity";

interface JoinTableInput {
    readonly entityName: string;
    readonly entity1: new () => Entity;
    readonly entity2: new () => Entity;
}

export abstract class JoinTable extends Entity{

    protected entity1: Entity;
    protected entity2: Entity;
    public column1: Column;
    public column2: Column;

    public constructor(input: JoinTableInput){
        super({
            entityName: input.entityName
        });

        this.entity1 = new input.entity1();
        this.entity2 = new input.entity2();

        const entity1_name = this.entity1.getName();
        const entity1_primary_key = this.entity1.getEntityInfo().primary_key;
        const entity2_name = this.entity2.getName();
        const entity2_primary_key = this.entity2.getEntityInfo().primary_key;

        if(!entity1_primary_key || !entity2_primary_key) throw new Error("Missing primary key in an Entity given to the "+this.entityName+" Table");

        this.primary_key = new Column({ name: `reference_id`, type: "INTEGER", constraints: { AUTO_INCREMENT: true } });
        this.column1 = new Column({ name: `${entity1_name}_${entity1_primary_key.getName()}`, type: entity1_primary_key.getConf().type });
        this.column2 = new Column({ name: `${entity2_name}_${entity2_primary_key.getName()}`, type: entity2_primary_key.getConf().type });

        this.columns.push(this.primary_key, this.column1, this.column2);

        this.manyToMany(entity1_name, entity1_primary_key, entity2_name, entity2_primary_key);
    }

    private manyToMany(entity1_name: string, entity1_primary_key: Column, entity2_name: string, entity2_primary_key: Column): void {
        const relation: RelationsType = {
          relation: "ManyToMany",
          entity_name: this.entityName,

          relatedEntity1_foreign_key: `${entity1_name}_${entity1_primary_key.getName()}`,
          relatedEntity1_name: entity1_name,
          relatedEntity1_key: entity1_primary_key.getName(),

          relatedEntity2_name: entity2_name,
          relatedEntity2_key: entity2_primary_key.getName(),
          relatedEntity2_foreign_key: `${entity2_name}_${entity2_primary_key.getName()}`,
        };
    
        this.relations.push(relation);
    }
}