import { Entity } from "../../src/Entity";
import { Column } from "../../src/Column";
import { User } from "./User";

export class Profile extends Entity {

    // initialize new columns
    public id: Column;
    public followers: Column;
    public bio: Column;

    public constructor(){
        super({
            entityName: "profile", 
            columns: [],
        });

        this.id = new Column({ name: "id", type: "INTEGER", constraints: { NOT_NULL: true, AUTO_INCREMENT: true } });
        this.followers = new Column({ name: "followers", type: "STRING", constraints: { NOT_NULL: true } });
        this.bio = new Column({ name: "bio", type: "STRING"});

        this.primary_key = this.id;

        this.addColumns(this.id, this.followers, this.bio);
        this.manyToMany(User);
    }

}