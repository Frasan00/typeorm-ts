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

        this.id = new Column({ name: "id", type: "INTEGER(30)", constraints: { NOT_NULL: true, AUTO_INCREMENT: true } });
        this.name = new Column({ name: "name", type: "VARCHAR(30)", constraints: { NOT_NULL: true } });
        this.age = new Column({ name: "age", type: "INTEGER(30)"});

        this.primary_key = [this.id];

        this.addColumns(this.id, this.name, this.age);
        
    }

}