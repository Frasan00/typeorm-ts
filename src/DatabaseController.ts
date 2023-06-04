import mysql, { Pool } from "mysql2/promise";
import { Entity } from "./Entity";
import { ModelRepository } from "./ModelRepository";

interface IDatabaseController {
    readonly host: string,
    readonly db_name: string,
    readonly user_name: string,
    readonly password: string,
    readonly port?: number,
    readonly synchronize?: boolean,
    readonly entities: Array<new () => Entity>,
};


export class DatabaseController {
    protected mysql: Pool;
    protected entities: Array<new () => Entity>;
    protected synchronize: boolean; // to do

    public constructor(input: IDatabaseController){
        this.mysql = mysql.createPool({
            host: input.host,
            database: input.db_name,
            user: input.user_name,
            password: input.password,
            port: input.port || 3306,
        });
        this.entities = input.entities;
        this.synchronize = input.synchronize || false;
    }

    public async connection(){
        await this.mysql.getConnection();
        await this.processEntities()
            .then(async (_) => {
                await this.initializeRelations()
                console.log("Entities were initialized correctly")
            })
    }

    protected async initializeRelations(){
        if (this.entities.length === 0) throw new Error(`There are no entities to initialize`);
        const promises = this.entities.map(async (entity) => {

            const entityInstance = new entity();

            if (!(entityInstance instanceof Entity)) {
              throw new Error(`Entity class "${entity.name}" does not extend the Entity base class`);
            }

            const query: string = entityInstance.initializeRelations();
            console.log(query);

            try {
                if (query === "") return;
                await this.mysql.query(query);
            } catch (err) {
                console.error(err);
            }
            });
        
            try {
                await Promise.all(promises);
            } catch (err) {
                console.error(err);
            }
    }

    protected async processEntities() {
        if (this.entities.length === 0) throw new Error(`There are no entities to initialize`);
        const promises = this.entities.map(async (entity) => {

            const entityInstance = new entity();

            if (!(entityInstance instanceof Entity)) {
              throw new Error(`Entity class "${entity.name}" does not extend the Entity base class`);
            }

            const query: string = entityInstance.initializeColumns();
            if (!query) throw new Error(`Error while creating the query for Entity: ${entity.name}`);
            console.log(query);

            try {
                await this.mysql.query(query);
            } catch (err) {
                console.error(err);
            }
            });
        
            try {
            await Promise.all(promises);
            } catch (err) {
            console.error(err);
            }
      }

    public getModelRepository(model: new () => Entity): ModelRepository {
        return new ModelRepository({
            model: model, 
            mysql: this.mysql
        }); 
    }
}