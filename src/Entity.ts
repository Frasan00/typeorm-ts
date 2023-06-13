import { Column, ColumnType } from "./Column";
import mysql from "mysql2/promise";

type Relations = "OneToOne" | "OneToMany" | "ManyToMany";

interface IEntityInput {
  readonly entityName: string;
  readonly columns?: Column[];
  readonly primary_key?: Column;
}

type RelationsType = {
  relation: Relations; // type of relation
  entity_name: string; 
  entity_primary_key: string
  foreign_key: string; // the field that enstablishes the relation with the given entity
}

type RelationInputType = {
  NOT_NULL?: boolean | false;
  UNIQUE?: boolean | false;
}


export abstract class Entity {
  protected entityName: string;
  protected columns: Column[];
  protected primary_key?: Column;
  protected relations: RelationsType[];

  public constructor(input: IEntityInput) {
    this.entityName = input.entityName;
    this.columns = input.columns || [];
    this.primary_key = input.primary_key;
    this.relations = [];
  }

  public getName() {
    return this.entityName;
  }

  public getEntityInfo() {
    const columns = this.columns;
    const primary_key = this.primary_key;
    const relations = this.relations;
    return { columns, primary_key, relations };
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

    query += "\n);";

    return query;
  }

  public async initializeRelations(mysql: mysql.Pool) {
    const promises = this.relations.map(async (relation) => {
      try {
        const constraintName = `${this.entityName}_${relation.foreign_key}_constraint`;
        const checkConstraint = `
          SELECT constraint_name
          FROM information_schema.table_constraints
          WHERE table_name = '${this.entityName}'
          AND constraint_name = '${constraintName}'
          AND constraint_type = 'FOREIGN KEY';
        `;
        const [result]: any[] = await mysql.query(checkConstraint);
  
        if (result.length === 0) {
          const addConstraintQuery = `
            ALTER TABLE ${this.entityName} 
            ADD CONSTRAINT ${constraintName}
            FOREIGN KEY (${relation.foreign_key})
            REFERENCES ${relation.entity_name}(${relation.entity_primary_key});
          `;
          console.log(addConstraintQuery);
          await mysql.query(addConstraintQuery);
        } 
      } catch (err) {
        console.error("Error while initializing relations", err);
      }
    });
  
    await Promise.all(promises);
  }
  
  

  public selectType(input: string, length: number): string{
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

  protected oneToOne(Entity: new () => Entity, input?: RelationInputType): Column{
    const entity = new Entity();
    const entity_primary_key = entity.primary_key?.getName();
    if(!entity_primary_key) throw new Error(`The entity ${entity.getName()} does not have a primary key to be referred`);
    if(!entity.primary_key) throw new Error(`The entity ${entity.getName()} does not have a primary key to be referred`);

    const column = new Column({
      name: `${entity.getName()}_${entity_primary_key}`,
      type: entity.primary_key.getConf().type,
      constraints: {
        NOT_NULL: input?.NOT_NULL,
        UNIQUE: input?.UNIQUE,
      }
    });

    const entity_primary_key_name = entity_primary_key;
    const relationType: RelationsType = {
      relation: "OneToOne",
      entity_name: `${entity.getName()}`,
      entity_primary_key: `${entity_primary_key_name}`,
      foreign_key: `${entity.getName()}_${entity_primary_key}`,
    }
    this.relations.push(relationType);

    return column;
  }

  // to be inserted in the many table, it creates a foreign_key for the first table and returns a column
  protected oneToMany(Entity: new () => Entity, input?: RelationInputType): Column {
    const entity = new Entity();
    const entity_primary_key = entity.primary_key?.getName();
    if (!entity_primary_key) throw new Error(`The entity ${entity.getName()} does not have a primary key to be referred`);
    if (!entity.primary_key) throw new Error(`The entity ${entity.getName()} does not have a primary key to be referred`);
  
    const foreign_key = `${entity.getName()}_${entity_primary_key}`;
  
    const relationType: RelationsType = {
      relation: "OneToMany",
      entity_name: `${entity.getName()}`,
      entity_primary_key: `${entity_primary_key}`,
      foreign_key: `${foreign_key}`,
    };
  
    this.relations.push(relationType);
  
    const column = new Column({
      name: foreign_key,
      type: entity.primary_key.getConf().type,
      constraints: {
        NOT_NULL: input?.NOT_NULL,
        UNIQUE: input?.UNIQUE,
      },
    });
  
    return column
  }

  protected manyToMany(){

  }
}
