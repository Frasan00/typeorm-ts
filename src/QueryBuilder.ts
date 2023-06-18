import mysql from "mysql2/promise";
import { Entity } from "./Entity";

interface IQueryBuilderInput {
    readonly model: Entity,
    mysql: mysql.Pool
};

type ColumnNameType = string;

type SortType = `ASC` | `DESC`;

type OrderByType = {
    column: ColumnNameType;
    sort?: SortType | "";
};

type GetQueryResultType = {
    limit?: number;
    orderBy?: OrderByType[];
};

type QueryOutputType = {
    result: any;
    status: "accepted" | "refused"; 
    query: string;
    params: any;
};

export class QueryBuilder {

    protected model: Entity;
    protected mysql: mysql.Pool;
    protected query: string;
    protected params: any[];
    protected whereConditions: string;
    protected joins: string;
    protected firstCondition: boolean;
    protected index: number;

    public constructor(input: IQueryBuilderInput){
        this.model = input.model;
        this.mysql = input.mysql;
        this.query = `SELECT * FROM ${this.model.getName()} table1 `;
        this.params = [];
        this.whereConditions = ``;
        this.joins = ``;
        this.firstCondition = true; 
        this.index = 2;
    };

    public where(query: string, valueInput: any[]): QueryBuilder{
        if(this.firstCondition === false) throw new Error("Where can only be used as the first condition");
        this.whereConditions+=`\n WHERE ${query} ` ;
        this.params.push(...valueInput);
        this.firstCondition = false;
        return this;
    };

    public andWhere(query: string, valueInput: any[]): QueryBuilder{
        if(this.firstCondition === true) throw new Error("andWhere can only be used as a chain for others conditions");
        this.whereConditions+=`\n AND ${query} ` ;
        this.params.push(...valueInput);
        return this;
    };

    public orWhere(query: string, valueInput: any[]): QueryBuilder{
        if(this.firstCondition === true) throw new Error("orWhere can only be used as a chain for others conditions");
        this.whereConditions+=`\n OR ${query} ` ;
        this.params.push(...valueInput);
        return this;
    };

    public leftJoin(relatedTableName: string): QueryBuilder{
        const relation = this.model.getEntityInfo().relations.find((rel) => rel.entity_name === relatedTableName || rel.relatedEntity1_name === relatedTableName);
        if(!relation) throw new Error("The model "+this.model.getName()+" doesn't have a relation with the given table");
        const primary_key = this.model.getEntityInfo().primary_key?.getName();
        if (relation.relation === "OneToOne") {
            this.joins += ` \n LEFT JOIN ${relation.entity_name} table${this.index} ON table1.${relation.foreign_key} = table${this.index}.${relation.entity_primary_key}`;
            this.index++;
          } else if (relation.relation === "OneToMany") {
                this.joins += ` \n LEFT JOIN ${relation.entity_name} table${this.index} ON table1.${primary_key} = table${this.index}.${relation.foreign_key}`;
                this.index++;
          } else if (relation.relation === "ManyToOne") {
                this.joins += ` \n LEFT JOIN ${relation.entity_name} table${this.index} ON table1.${relation.foreign_key} = table${this.index}.${primary_key}`;
                this.index++; }
            else{
                this.joins+= `\n LEFT JOIN ${relation.relatedEntity1_name} table${this.index} ON table1.${relation.relatedEntity1_foreign_key} = table${this.index}.${relation.relatedEntity1_key} `;
                this.index++;
                this.joins+= `\n LEFT JOIN ${relation.relatedEntity2_name} table${this.index} ON table1.${relation.relatedEntity2_foreign_key} = table${this.index}.${relation.relatedEntity2_key} `;
                this.index++;
            }
        return this;
    };

    public innerJoin(relatedTableName: string): QueryBuilder{
        const relation = this.model.getEntityInfo().relations.find((rel) => rel.entity_name === relatedTableName);
        if(!relation) throw new Error("The model "+this.model.getName()+" doesn't have a relation with the given table");
        const primary_key = this.model.getEntityInfo().primary_key?.getName();
        if (relation.relation === "OneToOne") {
            this.joins += ` \n INNER JOIN ${relation.entity_name} table${this.index} ON table1.${relation.foreign_key} = table${this.index}.${relation.entity_primary_key}`;
            this.index++;
          } else if (relation.relation === "OneToMany") {
                this.joins += ` \n INNER JOIN ${relation.entity_name} table${this.index} ON table1.${primary_key} = table${this.index}.${relation.foreign_key}`;
                this.index++;
          } else if (relation.relation === "ManyToOne") {
                this.joins += ` \n INNER JOIN ${relation.entity_name} table${this.index} ON table1.${relation.foreign_key} = table${this.index}.${primary_key}`;
                this.index++; }
            else{
                this.joins+= `\n INNER JOIN ${relation.relatedEntity1_name} table${this.index} ON table1.${relation.relatedEntity1_foreign_key} = table${this.index}.${relation.relatedEntity1_key} `;
                this.index++;
                this.joins+= `\n INNER JOIN ${relation.relatedEntity2_name} table${this.index} ON table1.${relation.relatedEntity2_foreign_key} = table${this.index}.${relation.relatedEntity2_key} `;
                this.index++;
            }
        return this;
    };

    public async getQueryResult(input?: GetQueryResultType): Promise<QueryOutputType>{
        this.query+=this.joins;
        this.query+=this.whereConditions;
        if(this.validateBrackets(this.query) === false) { 
            return {
                result: "Invalid brackets in the query",
                status: "refused",
                query: this.query,
                params: this.params,
            }
        }

        if (input && input.orderBy) {
            this.query += `\n ORDER BY `;
            input.orderBy.map((order, index) => {
              this.query += ` ${order.column} ${order.sort}`;
              if (input.orderBy && index !== input.orderBy.length - 1) {
                this.query += ",";
              }
            });
        }

        if(input?.limit) this.query+=` \n LIMIT ${input.limit} `

        try{
            const [rows] = await this.mysql.query(this.query, this.params); 
            return {
                result: rows,
                status: "accepted",
                query: this.query,
                params: this.params,
            }
        }catch(err){
            console.error(err);
            return {
                result: err,
                status: "refused",
                query: this.query,
                params: this.params,
            }
        }
    };

    private validateBrackets(input: String): boolean{
        let count = 0;
        for(let char in input){
            if(char === "(") count++;
            if(char === ")"){
                count--;
                if(count<0) return false
            }
        }
        return true;
    };
};