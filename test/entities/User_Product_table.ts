import { JoinTable } from "../../src/JoinTable";
import { Product } from "./Product";
import { User } from "./User";

export class User_Product_table extends JoinTable {

    constructor(){ 
        super({ 
            entityName: "ref_user_product", 
            entity1: User, 
            entity2: Product 
        });
    }
}