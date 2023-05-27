import mysql from "mysql2/promise"; 
import { Entity } from "./Entity";

interface IModelRepositoryInput {
    readonly model: Entity,
    readonly db_name: string,
    mysql: mysql.Pool
}

type ColumnNameType = string;

type OperatorType = "=" | "<" | ">" | "<=" | ">=" | "LIKE";

type FunctionsType = `COUNT(${string})` | `SUM(${string})` | `DISTINCT(${string})` | `MIN(${string})` | `MAX(${string})` | `AVG(${string})`

type WhereConditionType = {
    column: ColumnNameType;
    operator?: OperatorType | `=`;
    value: any;
};

type SelectType = {
    column: ColumnNameType;
    function?: FunctionsType | undefined;
};

type SortType = `ASC` | `DESC`;

type OrderByType = {
    column: ColumnNameType;
    sort?: SortType | "";
};

type FindInputType = {
    select: SelectType[];
    where?: WhereConditionType[];
    // relations to do
    orderBy?: OrderByType[];
};

type QueryOutputType = {
    result: any
    status: "accepted" | "refused"; 
};

type SetType = {
    column: ColumnNameType;
    value: any;
}

type UpdateInputType = {
    set: SetType[],
    where?: WhereConditionType[]
}

export class ModelRepository {
    protected model: Entity;
    protected db_name: string;
    protected mysql: mysql.Pool;

    public constructor(input: IModelRepositoryInput){
        this.db_name = input.db_name;
        this.model = input.model;
        this.mysql = input.mysql;
    }

    public async find(input?: FindInputType){
        if (!input){
            try{
                const [rows] = await this.mysql.query(`SELECT * FROM ${this.model.getName()}`); 
                return {
                    result: rows,
                    status: "accepted"
                }
            }catch(err){
                console.error(err);
                return {
                    result: err,
                    status: "refused"
                }
            }
        };

        let query = `SELECT `;
        input.select.map((select) => {
            if(select.function) query+=`${select.function}(${select.column}) `
            else query+=`${select.column} `
        });

        query+=`\n FROM ${this.model.getName()} \n `;

        if(input.where) {
            query+="Where";
            input.where.map((where) => {
                query+=` ${where.column} ${where.operator} ${where.value} `;
            });
            query+="\n"
        };
        
        if(input.orderBy) {
            query+=`ORDER BY `;
            input.orderBy.map((order) => {
                query+=` ${order.column} ${order.sort} `
            });
        };

        try{
            const [rows] = await this.mysql.query(query); 
            return {
                result: rows,
                status: "accepted"
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused"
            }
        }
    }

    public async findOne(input: FindInputType){
        let query = `SELECT `;
        input.select.map((select) => {
            if(select.function) query+=`${select.function}(${select.column}) `
            else query+=`${select.column} `
        });

        query+=`\n FROM ${this.model.getName()} \n `;

        if(input.where) {
            query+="Where";
            input.where.map((where) => {
                query+=` ${where.column} ${where.operator} ${where.value} `;
            });
            query+="\n"
        };
        
        if(input.orderBy) {
            query+=`ORDER BY `;
            input.orderBy.map((order) => {
                query+=` ${order.column} ${order.sort} `
            });
        };
        query+= `\n LIMIT 1`;

        try{
            const [rows] = await this.mysql.query(query); 
            return {
                result: rows,
                status: "accepted"
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused"
            }
        }
    }

    public async findOneById(input: { id: number | string }): Promise<QueryOutputType>{
        let query = `SELECT * FROM ${this.model.getName()} WHERE id = ?`;
        try{
            const [rows] = await this.mysql.query(query, input.id); 
            return {
                result: rows,
                status: "accepted"
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused"
            }
        }
    }

    public async save(entity: Entity): Promise<Entity>{
        if(entity.getName() !== this.model.getName()) throw new Error(`Invalid enitity for repository ${this.model.getName()}`);
        const params: any[] = [];
        let query = `INSERT INTO ${this.model.getName()}(`;
        entity.getEntityInfo().columns.map((column) => {
            query += column.getName()+",";
        });
        query = query.slice(0, -1);
        query += `) VALUES(`;

        entity.getEntityInfo().columns.map((column) => {
            query += "?, ";
            params.push(column.getValue());
        });
        query = query.slice(0, -2);
        query += `)`;

        try{
           await this.mysql.query(query, params); 
        }catch(err){
            console.error(err);
        }

        return entity;
    }

    public async update(input: UpdateInputType): Promise<QueryOutputType> {
        let query = `UPDATE ${this.model.getName()} \n SET `;
        input.set.map((set) => {
          query += `${set.column} = ${this.mysql.escape(set.value)}, `;
        });
        query = query.slice(0, -2);
      
        if (input.where) {
          query += `\n WHERE `;
          input.where.map((where) => {
            query += ` ${where.column} ${where.operator} ${this.mysql.escape(where.value)} `;
          });
        }
      
        try {
          const [rows] = await this.mysql.query(query);
          return {
            result: rows,
            status: "accepted",
          };
        } catch (err) {
          console.error(err);
          return {
            result: err,
            status: "refused",
          };
        }
      }
      
      

    public async delete(input: { id: number | string }): Promise<QueryOutputType>{
        try{
            const query = `DELETE FROM ${this.model.getName()} WHERE id = ?`
            const [rows] = await this.mysql.query(query, input.id); 
            return {
                result: rows,
                status: "accepted"
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused"
            }
        }
    }
}