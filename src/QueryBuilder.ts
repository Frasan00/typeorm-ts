import mysql from "mysql2/promise";
import { Entity } from "./Entity";

interface IQueryBuilderInput {
    readonly model: Entity,
    mysql: mysql.Pool
};

type OperatorType = "=" | "<" | ">" | "<=" | ">=" | "LIKE";

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

    public constructor(input: IQueryBuilderInput){
        this.model = input.model;
        this.mysql = input.mysql;
        this.query = `SELECT * FROM ${this.model.getName()} table.1 \n `;
        this.params = [];
        this.whereConditions = ` \n WHERE 1=1 AND  `; // flag always true to initiate where condition
        this.joins = ` \n `;
    };

    public notNull(): QueryBuilder{
        
        return this;
    };

    public null(): QueryBuilder{

        return this;
    };

    public openBrackets(): QueryBuilder{
        this.whereConditions += ` ( `;
        return this;
    };

    public closeBrackets(): QueryBuilder {
        this.whereConditions += ` ) `;
        return this;
    };

    public andWhere(column: string, operator: OperatorType, value: any): QueryBuilder{

        return this;
    };

    public orWhere(column: string, operator: OperatorType, value: any): QueryBuilder{

        return this;
    };

    public leftJoin(entity1: new() => Entity, entity2: new() => Entity): QueryBuilder{

        return this;
    };

    public innerJoin(): QueryBuilder{

        return this;
    };

    public async getQueryResult(input?: GetQueryResultType): Promise<QueryOutputType>{
        this.query+=this.whereConditions;
        this.query+=this.joins;
        if(this.validateBrackets(this.query) === false) { 
            return {
                result: "Invalid brackets in the query",
                status: "refused",
                query: this.query,
                params: this.params,
            }
        }

        if(input?.orderBy){
            this.query+=`\n ORDER BY `;
            input.orderBy.map((order) => {
                this.query+=` ${order.column} ${order.sort} `
            });
        };

        if(input?.limit) this.query+=` \n LIMIT ${input.limit} `

        try{
            const [rows] = await this.mysql.query(`SELECT * FROM ${this.model.getName()}`); 
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