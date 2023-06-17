import { Column, ColumnType } from "./Column";
import mysql from "mysql2/promise";

type Relations = "OneToOne" | "OneToMany" | "ManyToOne"| "ManyToMany";

interface IEntityInput {
  readonly entityName: string;
  readonly columns?: Column[];
  readonly primary_key?: Column;
}

type RelationsType = {
  relation: Relations; // type of relation
  entity_name?: string; 
  entity_primary_key?: string
  foreign_key?: string; // the field that enstablishes the relation with the given entity

  // properties for manyToMany
  joinTable?: boolean; // it serves the manyToMany relation, explains the table that creates the new joinTable
  relatedEntity?: new () => Entity;
}

type RelationInputType = {
  NOT_NULL?: boolean | false;
  UNIQUE?: boolean | false;
}

type manyToManyInputType = {
  joinTable?: boolean; // it serves the manyToMany relation, explains the table that creates the new joinTable
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

  public async initializeColumns(mysql: mysql.Pool) {
    // Every time the DB restarts it's synched with latest changes dropping eevery existing constraint and rebuilding them
    const [constraintsShow]: any[] = await mysql.query(`
    SELECT *
    FROM information_schema.table_constraints
    `);
    const constraints: string[] = constraintsShow.map((row: any) => Object.values(row)[2]);
    for (const constraint of constraints){
      if(constraint !== "PRIMARY"){
        const sqlStatement = `
        ALTER TABLE ${this.entityName}
        DROP CONSTRAINT \`${constraint}\`;
        `;
        await mysql.query(sqlStatement);
        console.log(sqlStatement);
      }
    }

    if (this.columns.length === 0) {0
      throw new Error(`There are no columns to initialize in Entity ${this.entityName}`);
    }

    this.relations = [];

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

        if(relation.relation === "ManyToMany"){
            if(!relation.relatedEntity) throw new Error("Missing informations for many to many relation");
            if(!this.primary_key) throw new Error(`The entity ${this.entityName} does not have a primary key to be refered`);

            const entity = new relation.relatedEntity();
            if(!entity.primary_key) throw new Error(`The entity ${entity.entityName} does not have a primary key to be referred`);

            if (relation.joinTable === true){
              await mysql.query(`
              CREATE TABLE IF NOT EXISTS ref_${this.entityName}_${entity.entityName}(
                ${this.entityName}_${this.primary_key.getName()} ${this.selectType(this.primary_key.getConf().type, this.primary_key.getConf().typeLength)},
                ${entity.entityName}_${entity.primary_key?.getName()} ${this.selectType(entity.primary_key.getConf().type, entity.primary_key.getConf().typeLength)},
                PRIMARY KEY (${this.entityName}_${this.primary_key.getName()}, ${entity.entityName}_${entity.primary_key?.getName()}),
                FOREIGN KEY (${this.entityName}_${this.primary_key.getName()}) REFERENCES ${this.entityName}(${this.primary_key.getName()}),
                FOREIGN KEY (${entity.entityName}_${entity.primary_key?.getName()}) REFERENCES ${entity.entityName}(${entity.primary_key.getName()}));`)
           };
        }
  
        else if (result.length === 0 && relation.relation !== "OneToMany") {
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

  protected oneToMany(entity_name: string, foreign_key: string): void {
    if(!this.primary_key?.getName()) throw new Error(`The entity ${this.entityName} hasn't a primary key`);
  
    const relationType: RelationsType = {
      relation: "OneToMany",
      entity_name: entity_name,
      entity_primary_key: this.primary_key?.getName(),
      foreign_key: foreign_key,
    };
    
    this.relations.push(relationType);
  }

  protected manyToOne(Entity: new () => Entity, input?: RelationInputType): Column {
    const entity = new Entity();
    const entity_primary_key = entity.primary_key?.getName();
    if (!entity.primary_key) throw new Error(`The entity ${entity.getName()} does not have a primary key to be referred`);
  
    const foreign_key = `${entity.getName()}_${entity_primary_key}`;
  
    const relationType: RelationsType = {
      relation: "ManyToOne",
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

  protected manyToMany(EntityToRel: new () => Entity, input?: manyToManyInputType): void {
    if (!this.primary_key) throw new Error(`The entity ${this.entityName} does not have a primary key to be referred`);
    const relation: RelationsType = {
      relation: "ManyToMany",
      joinTable: input?.joinTable === true ? true : false,
      relatedEntity: EntityToRel,
    };

    this.relations.push(relation);
  }
}
