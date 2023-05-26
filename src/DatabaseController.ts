import mysql from "mysql2";
import { Entity } from "./Entity";

interface IDatabaseController {
    readonly host: string,
    readonly db_name: string,
    readonly user_name: string,
    readonly password: string,
    readonly port?: number,
    readonly entities: any[]
}


export class DatabaseController {
    protected mysql: mysql.Connection;
    protected entities: Entity[]

    public constructor(input: IDatabaseController){
        // mysql initialization
        this.mysql = mysql.createConnection({
            host: input.host,
            database: input.db_name,
            user: input.user_name,
            password: input.password,
            port: input.port || 3306,
        });

        this.mysql.connect((err) => {
            if(!err) return console.log("Connected to the database!");
            console.error({ 
            message: "Couldn't connect to the database",
            error: err
        })});
        
        // entities initialization
        this.entities = input.entities;
        this.processEntities(this.entities);
    }

    protected async processEntities(entities: Entity[]){
        
    }

    public getModel(){

    }

}