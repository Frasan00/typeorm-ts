import { Column, ColumnType } from "./Column";

type ForeignKeysType = [string, string][];

interface IEntityInput {
  readonly entityName: string;
  readonly columns?: Column[];
  readonly primary_key?: Column[];
  readonly foreign_keys?: ForeignKeysType; // [Entity name, Entity foreign key]
}

export abstract class Entity {
  protected entityName: string;
  protected columns: Column[];
  protected primary_key?: Column[];
  protected foreign_keys?: ForeignKeysType;

  public constructor(input: IEntityInput) {
    this.entityName = input.entityName;
    this.columns = input.columns || [];
    this.primary_key = input.primary_key;
    this.foreign_keys = input.foreign_keys;
  }

  public getName() {
    return this.entityName;
  }

  public getEntityInfo(){
    const columns = this.columns;
    const primary_key = this.primary_key;
    const foreign_keys = this.foreign_keys;
    return { columns, primary_key, foreign_keys }
  }

  protected addColumn(column: Column) {
    this.columns.push(column);
  }

  protected addColumns(...columns: Column[]) {
    columns.map((column) => this.columns.push(column));
  }

  public initializeColumns() {
    if (this.columns.length === 0) {
      throw new Error(`There are no columns to initialize in Entity ${this.entityName}`);
    }

    let query = `
      CREATE TABLE IF NOT EXISTS ${this.entityName} (
        ${this.columns
          .map((column) => {
            const columnName = column.getName();
            const type: ColumnType = column.getConf().type;
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

    if (this.primary_key && this.primary_key.length > 0) {
      const primaryKeyColumns = this.primary_key.map((column) => column.getName());
      query += `,PRIMARY KEY (${primaryKeyColumns}) \n`;
    }

    if (this.foreign_keys && this.foreign_keys.length > 0) {
      this.foreign_keys.forEach(([keyName, entityName]) => {
        query += `,FOREIGN KEY (${keyName}) REFERENCES ${entityName}(${keyName})`;
      });
    }

    query += "\n);";
    // TO DO query modification

    return query;
  }
}
