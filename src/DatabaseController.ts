import mysql, { Pool } from "mysql2/promise";
import { Entity } from "./Entity";
import { ModelRepository } from "./ModelRepository";

interface IDatabaseController {
    readonly host: string,
    readonly db_name: string,
    readonly user_name: string,
    readonly password: string,
    readonly port?: number,
    readonly entities: Entity[]
}


export class DatabaseController {
    protected mysql: Pool;
    protected entities: Entity[];
    protected db_name: string;

    public constructor(input: IDatabaseController){
        this.mysql = mysql.createPool({
            host: input.host,
            database: input.db_name,
            user: input.user_name,
            password: input.password,
            port: input.port || 3306,
        });
        this.connection()
            .then((_) => console.log("Connected to the database on port: "+input.port || 3306))
            .catch((err) => console.error(err));
        
        this.db_name = input.db_name;

        // entities initialization
        this.entities = input.entities;
        this.processEntities(this.entities);
    }

    private async connection(){
        await this.mysql.getConnection()
    }

    protected async processEntities(entities: Entity[]){
        if(this.entities.length === 0) throw new Error(`There are no entities to initialize`);
        const promises = entities.map(async (entity) => {
            const query: string = entity.initializeColumns();
            if(!query) throw new Error(`Error while creating the query for Entity: ${entity.getName()}`);
            console.log(query);
            try {
                await this.mysql.query(query);
            }catch(err){
                console.error(err);
            }
        });

        try{
            await Promise.all(promises);
        }catch(err){
            console.error(err);
        }
    }

    public getModelRepository(model: Entity): ModelRepository {
        return new ModelRepository({
            db_name: this.db_name, 
            model: model, 
            mysql: this.mysql 
        }); 
    }

}