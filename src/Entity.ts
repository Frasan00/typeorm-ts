import { Column, ColumnType } from "./Column";

type ForeignKeysType = [string, string, string, RelationsType][]; // [Entity name, foreign key, entity_primary_key, type of relation]

type RelationsType = "OneToOne" | "OneToMany" | "ManyToMany";

interface IEntityInput {
  readonly entityName: string;
  readonly columns?: Column[];
  readonly primary_key?: Column;
}

export abstract class Entity {
  protected entityName: string;
  protected columns: Column[];
  protected primary_key?: Column;
  protected foreign_keys: ForeignKeysType;

  public constructor(input: IEntityInput) {
    this.entityName = input.entityName;
    this.columns = input.columns || [];
    this.primary_key = input.primary_key;
    this.foreign_keys = [];
  }

  public getName() {
    return this.entityName;
  }

  public getEntityInfo() {
    const columns = this.columns;
    const primary_key = this.primary_key;
    const foreign_keys = this.foreign_keys;
    return { columns, primary_key, foreign_keys };
  }

  protected addColumns(...columns: Column[]) {
    this.columns.push(...columns);
  }

  public initializeColumns() {
    if (this.columns.length === 0) {0
      throw new Error(`There are no columns to initialize in Entity ${this.entityName}`);
    }

    let query = `
      CREATE TABLE IF NOT EXISTS ${this.entityName} (
        ${this.columns
          .map((column) => {
            const columnName = column.getName();
            const type = this.selectType(column.getConf().type, column.getConf().typeLength);
            const constraints = column.getConf().constraints;
            if (!constraints) return `${columnName} ${type}`;

            // constraints initialization
            const auto_increment = constraints.AUTO_INCREMENT === true ? "AUTO_INCREMENT" : "";
            const not_null = constraints.NOT_NULL === true ? "NOT NULL" : "";
            const default_var = constraints.DEFAULT ? `DEFAULT ${constraints.DEFAULT}` : "";
            const unique = constraints.UNIQUE === true ? "UNIQUE" : "";

            return `${columnName} ${type} ${auto_increment} ${not_null} ${default_var} ${unique} \n`;
          })}
        `;

    if (this.primary_key) query += `\n ,PRIMARY KEY (${this.primary_key.getName()}) `;

    if (this.foreign_keys && this.foreign_keys.length > 0) {
      this.foreign_keys.forEach(([entityName, foreign_key, entity_primary_key, relationType]) => {
        if(relationType === "OneToOne"){
          query += `\n,FOREIGN KEY (${foreign_key}) REFERENCES ${entityName}(${entity_primary_key}) `;
        }
      });
    }

    query += "\n);";

    return query;
  }

  private selectType(input: string, length: number): string{
    switch(input){
      case "STRING":
        return `VARCHAR(${length})`;

      case "INTEGER":
        return `INTEGER(${length})`;

      case "FLOAT":
        return `FLOAT(${length})`;

      case "BOOLEAN":
        return `BOOLEAN(${length})`;

      case "DATE":
        return `DATE`;
      
      default:
        return "Invalid type for the input type "+input+" for the entity "+this.entityName;
    }
  }

  /*
  * Relations
  */
  protected oneToOne(entity: new () =>  Entity, entity_primaryKey: any, input?: { not_null: boolean }): Column{
    const newEntity = new entity();
    const foreign_key = `${newEntity.getName()}_${entity_primaryKey}`;
    const entity_key = newEntity.getEntityInfo().primary_key?.getName();
    const entity_type = newEntity.getEntityInfo().primary_key?.getConf().type;
    if(!entity_key) throw new Error("The passed entity does not have a primary key to be referenced");
    if(!entity_type) throw new Error("The passed primary_key type isn't correct");

    const column = new Column({
      name: foreign_key,
      type: entity_type,
      typeLength: 50,
      constraints: {
        NOT_NULL: input?.not_null || false,
        UNIQUE: true,
      }
    });

    this.foreign_keys.push([newEntity.getName(), foreign_key, entity_key, "OneToOne"]);

    return column;
  }

  protected oneToMany(entity: new () =>  Entity, newEntityForeignKey: string, input?: { not_null: boolean }){
    const newEntity = new entity();
    const entity_type = this.primary_key?.getConf().type;
    const thisEntityPrimaryKey = this.primary_key?.getName();
    if(!thisEntityPrimaryKey) throw new Error("The target entity has no primary key");
    if(!entity_type) throw new Error("The passed primary_key type isn't correct");

    this.foreign_keys.push([newEntity.getName(), thisEntityPrimaryKey, newEntityForeignKey, "OneToMany"]);
  }

  protected manyToMany(){

  }
}
