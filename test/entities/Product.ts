import { Column } from "../../src/Column";
import { Entity } from "../../src/Entity";
import { User } from "./User";

export class Product extends Entity {

    public id: Column;
    public product_name: Column;
    public price: Column;

    public constructor(){
        super({
            entityName: "product",
            columns:[]
        });

        this.id = new Column({ name: "id", type: "INTEGER", typeLength: 50, constraints: { AUTO_INCREMENT: true } });
        this.product_name = new Column({ name: "name", type: "STRING", typeLength: 30 , constraints: { NOT_NULL: true }});
        this.price = new Column({ name: "price", type: "FLOAT", typeLength: 30 });
        this.primary_key = this.id;

        this.addColumns(this.id, this.product_name, this.price);
    }
}