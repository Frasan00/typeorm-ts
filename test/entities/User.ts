import { Entity } from "../../src/Entity";
import { Column } from "../../src/Column";

export class User extends Entity {

    // initialize new columns
    protected id: Column;
    protected name: Column;
    protected age: Column;

    public constructor(){
        super({
            entityName: "user", 
            columns: []
        });

        this.id = new Column({ name: "id", type: "VARCHAR(30)", constraints: { primary_key: true, not_null: true } });
        this.name = new Column({ name: "name", type: "VARCHAR(30)", constraints: { not_null: true } });
        this.age = new Column({ name: "age", type: "INTEGER(30)"});

        this.addColumns(this.id, this.name, this.age);
    }

}