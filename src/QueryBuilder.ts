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
    result: any
    status: "accepted" | "refused"; 
};

export class QueryBuilder {

    protected model: Entity;
    protected mysql: mysql.Pool;
    protected query: string;

    public constructor(input: IQueryBuilderInput){
        this.model = input.model;
        this.mysql = input.mysql;
        this.query = `SELECT * FROM ${this.model.getName()} table.1 \n`;
    };

    public where(): QueryBuilder{

        return this;
    };

    public async getQueryResult(input?: GetQueryResultType): Promise<QueryOutputType>{
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
};