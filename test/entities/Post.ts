import { Column } from "../../src/Column";
import { Entity } from "../../src/Entity";

export class Post extends Entity {
    public id: Column;
    public title: Column;
    public user_id: Column;
  
    public constructor() {
      super({
        entityName: "post",
        columns: [],
      });
  
      this.id = new Column({ name: "id", type: "INTEGER", constraints: { NOT_NULL: true, AUTO_INCREMENT: true } });
      this.title = new Column({ name: "title", type: "STRING" });
      this.user_id = new Column({ name: "user_id", type: "INTEGER" });
  
      this.primary_key = this.id;
  
      this.addColumns(this.id, this.title, this.user_id);
    }

  }
  