import mysql from "mysql2/promise"; 
import { Entity } from "./Entity";
import { QueryBuilder } from "./QueryBuilder";

interface IModelRepositoryInput {
    readonly model: new () =>  Entity,
    mysql: mysql.Pool,
}

type ColumnNameType = string;

type FunctionsType = `COUNT(${string})` | `SUM(${string})` | `DISTINCT(${string})` | `MIN(${string})` | `MAX(${string})` | `AVG(${string})`;

type WhereConditionType = {
    [column: string]: any
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
    where?: WhereConditionType;
    joinAll?: Boolean | undefined;
    orderBy?: OrderByType[];
};

type QueryOutputType = {
    result: any;
    status: "accepted" | "refused";
    query: string;
    params: any;
};

type SetType = {
    column: ColumnNameType;
    value: any;
};

type UpdateInputType = {
    set: SetType[],
    where?: WhereConditionType[]
};

/* TO DO: GROUP BY */

export class ModelRepository {
    protected model: Entity;
    protected mysql: mysql.Pool;

    public constructor(input: IModelRepositoryInput){
        this.model = new input.model();
        this.mysql = input.mysql;
    }

    public async find(input?: FindInputType){
        const params = [];
        if (!input){
            try{
                const [rows] = await this.mysql.query(`SELECT * FROM ${this.model.getName()}`); 
                return {
                    result: rows,
                    status: "accepted",
                    query: `SELECT * FROM ${this.model.getName()}`,
                    params: null
                }
            }catch(err){
                console.error(err);
                return {
                    result: err,
                    status: "refused",
                    query: `SELECT * FROM ${this.model.getName()}`,
                    params: null
                }
            }
        };

        let query = `SELECT `;
        input.select.forEach((select) => {
            if(select.function) query+=`${select.function}(${select.column}) `
            else query+=`${select.column} `
        });

        query+=`\n FROM ${this.model.getName()} table1 \n `;

        if(input.joinAll){
            const primary_key = this.model.getEntityInfo().primary_key;
            const foreign_keys = this.model.getEntityInfo().foreign_keys;
            if(!foreign_keys) throw new Error("There are no relations for the entity "+process.env.MYSQL_DATABASE);
            if(!primary_key) throw new Error("There is no primary key for the entity "+process.env.MYSQL_DATABASE);

            foreign_keys.forEach((relation) => {
                query+=` \n LEFT JOIN ${relation[0]} table2 ON table1.${primary_key.getName()} = table2.${relation[1]} `;
            });
            query+=" \n ";
        };

        if(input.where) {
            query+=` WHERE 1=1 `; // flag always true

            const columns = Object.keys(input.where);
            const values = Object.values(input.where); 
            
            for (let i = 0; i<columns.length; i++){
                query+=` AND ${columns[i]} = ? `
                params.push(values[i]);
            };
        };
        
        if(input.orderBy) {
            query+=`\n ORDER BY `;
            input.orderBy.map((order) => {
                query+=` ${order.column} ${order.sort} `
            });
        };

        try{
            const [rows] = await this.mysql.query(query, params); 
            return {
                result: rows,
                status: "accepted",
                query: query,
                params: params,
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused",
                query: query,
                params: params,
            }
        }
    }

    public async findOne(input: FindInputType){
        const params = [];
        let query = `SELECT `;

        input.select.forEach((select) => {
            if(select.function) query+=`${select.function}(${select.column}) `
            else query+=`${select.column} `
        });

        query+=`\n FROM ${this.model.getName()} \n `;

        if(input.joinAll){
            const primary_key = this.model.getEntityInfo().primary_key;
            const foreign_keys = this.model.getEntityInfo().foreign_keys;
            if(!foreign_keys) throw new Error("There are no relations for the entity "+process.env.MYSQL_DATABASE);
            if(!primary_key) throw new Error("There is no primary key for the entity "+process.env.MYSQL_DATABASE);

            foreign_keys.forEach((relation) => {
                query+=` \n LEFT JOIN ${relation[0]} table2 ON table1.${primary_key.getName()} = table2.${relation[1]}`;
            });

            query+=" \n ";
        };

        if(input.where) {
            query+=` WHERE 1=1 `;

            const columns = Object.keys(input.where);
            const values = Object.values(input.where); 
            
            for (let i = 0; i<columns.length; i++){
                query+=` AND ${columns[i]} = ? `
                params.push(values[i]);
            };
        };
        
        if(input.orderBy) {
            query+=`\n ORDER BY `;
            input.orderBy.map((order) => {
                query+=` ${order.column} ${order.sort} `
            });
        };

        query+= `\n LIMIT 1`;

        try{
            const [rows] = await this.mysql.query(query, params); 
            return {
                result: rows,
                status: "accepted",
                query: query,
                params: params,
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused",
                query: query,
                params: params,
            }
        }
    }

    public async findOneById(input: { id: number | string }): Promise<QueryOutputType>{
        let query = `SELECT * FROM ${this.model.getName()} WHERE id = ?`;
        try{
            const [rows] = await this.mysql.query(query, input.id); 
            return {
                result: rows,
                status: "accepted",
                query: query,
                params: input.id,
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused",
                query: query,
                params: input.id
            }
        }
    }

    public async save(entity: Entity): Promise<Entity>{
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
        const params: any = [];
        let query = `UPDATE ${this.model.getName()} \n SET `;
        input.set.map((set) => {
          query += `${set.column} = ?, `;
          params.push(set.value);
        });
        query = query.slice(0, -2);
      
        if (input.where) {
          query += `\n WHERE `;
          input.where.map((where) => {
            query += ` ${where.column} ${where.operator} ? `;
            params.push(where.value);
          });
        }
      
        try {
          const [rows] = await this.mysql.query(query, params);
          return {
            result: rows,
            status: "accepted",
            query: query,
            params: params,
          };
        } catch (err) {
          console.error(err);
          return {
            result: err,
            status: "refused",
            query: query,
            params: params,
          };
        }
      }
      
      

    public async delete(input: { id: number | string }): Promise<QueryOutputType>{
        try{
            const query = `DELETE FROM ${this.model.getName()} WHERE id = ?`
            const [rows] = await this.mysql.query(query, input.id); 
            return {
                result: rows,
                status: "accepted",
                query: `DELETE FROM ${this.model.getName()} WHERE id = ?`,
                params: input.id,
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused",
                query: `DELETE FROM ${this.model.getName()} WHERE id = ?`,
                params: input.id,
            }
        }
    }

    public createQueryBuilder(): QueryBuilder{
        return new QueryBuilder({
            model: this.model,
            mysql: this.mysql 
        });
    };
}