import mysql from "mysql2";
import { Entity } from "./Entity";

interface IDatabaseController {
    readonly host: string,
    readonly db_name: string,
    readonly user_name: string,
    readonly password: string,
    readonly port?: number,
    readonly entities: Entity[]
}


export class DatabaseController {
    protected mysql: mysql.Connection;
    protected entities: Entity[]

    public constructor(input: IDatabaseController){
        // mysql connection
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
        if(this.entities.length === 0) throw new Error(`There are no entities to initialize`);
        const promises = entities.map(async (entity) => {
            const query: string = entity.initializeColumns();
            if(!query) throw new Error(`Error while creating the query for Entity: ${entity.getName()}`);

            return new Promise((resolve, reject) => {
                this.mysql.query(query, (err, result) => {
                    if(err) reject(`Error while applying the query for Entity: ${entity.getName()}`);
                    else resolve(result);
                });
                console.log(query);
            })
        });

        await Promise.all(promises);
        console.log("Entities initialized in the database");
    }

    public getModel(){

    }

}