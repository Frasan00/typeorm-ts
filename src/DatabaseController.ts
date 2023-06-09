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
    protected synchronize: boolean;

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
        try{
            await this.mysql.getConnection();
            await this.processEntities();
            if(this.synchronize === true) await this.syncTables();
            // to correct
            /*await this.initializeRelations()
                .then((_) => console.log("Entities were initialized correctly"))*/
        }catch(err){
            console.error(err);
        }
    }

    /*
    * Syncs the database with latest entities changes
    */
    protected async syncTables(){
        let query = ``;
        const [databaseShow]: any[] = await this.mysql.query("SHOW TABLES");
        const databaseTables: any[] = databaseShow.map((row: any) => Object.values(row)[0]); // referes to the tables present in the database to be updated
        const entitiesNames = this.entities.map((entity) => new entity().getName())// referes to the latest entities written by the user

        /* It is given the new tables will be automaticaly created by processEntities, we just have to delete or update present tables and columns */

        /* Checks if there are new Entitites to DELETE */
        databaseTables.forEach((table) => {
            if(!entitiesNames.includes(table)) query+=`DROP TABLE ${table}; \n`
        });

        try {
            if (query !== ``) await this.mysql.query(query);
        } catch (err) {
            console.error("Error while deleting old tables", err);
        }

        /* updates the columns */
        this.entities.forEach(async (Entity) => {
            const entity = new Entity();
            const entityName = entity.getName();
            const [databaseColumnsShow]: any[] = await this.mysql.query(`SHOW COLUMNS FROM ${entityName}`);
            const databaseColumns: any[] = databaseColumnsShow.map((row: any) => Object.values(row)[0]);

            entity.getEntityInfo().columns.forEach((column) => {
                const columnName = column.getName();
                const type = entity.selectType(column.getConf().type, column.getConf().typeLength);
                const constraints = column.getConf().constraints;
                if(!databaseColumns.includes(columnName)){
                    const sqlStatement = `ALTER TABLE ${entityName} ADD COLUMN ${columnName} ${type} ${constraints?.AUTO_INCREMENT ? `AUTO_INCREMENT` : ""} ${constraints?.NOT_NULL ? `NOT NULL` : ""} ${constraints?.DEFAULT ? `DEFAULT ${constraints?.DEFAULT}` : ""} ${constraints?.UNIQUE ? `UNIQUE` : ""}; \n`;
                    query+= sqlStatement;
                    console.log(sqlStatement);
                }
                else {
                    const sqlStatement = `ALTER TABLE ${entityName} MODIFY COLUMN ${columnName} ${type} ${constraints?.AUTO_INCREMENT ? `AUTO_INCREMENT` : ""} ${constraints?.NOT_NULL ? `NOT NULL` : ""} ${constraints?.DEFAULT ? `DEFAULT ${constraints?.DEFAULT}` : ""} ${constraints?.UNIQUE ? `UNIQUE` : ""}; \n`;
                    query+= sqlStatement;
                    console.log(sqlStatement);
                }
            });
        });
        
        try {
            if (query === ``) return;
            return await this.mysql.query(query);
        } catch (err) {
            console.error("Error while updating tables", err);
        }
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