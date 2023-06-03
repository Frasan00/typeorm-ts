import { Entity } from "../../src/Entity";
import { Column } from "../../src/Column";

export class User extends Entity {

    // initialize new columns
    public id: Column;
    public name: Column;
    public age: Column;

    public constructor(){
        super({
            entityName: "user", 
            columns: [],
        });

        this.id = new Column({ name: "id", type: "INTEGER", constraints: { NOT_NULL: true, AUTO_INCREMENT: true } });
        this.name = new Column({ name: "name", type: "STRING", constraints: { NOT_NULL: true } });
        this.age = new Column({ name: "age", type: "INTEGER"});

        this.primary_key = this.id;

        this.addColumns(this.id, this.name, this.age);
    }

}