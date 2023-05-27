import mysql from "mysql2/promise"; 
import { Entity } from "./Entity";

interface IModelRepositoryInput {
    readonly model: string,
    readonly db_name: string,
    mysql: mysql.Pool
}

export class ModelRepository {
    protected model: string;
    protected db_name: string;
    protected mysql: mysql.Pool;

    public constructor(input: IModelRepositoryInput){
        this.db_name = input.db_name;
        this.model = input.model;
        this.mysql = input.mysql;
    }

    public async find(){

    }

    public async findOne(){
        
    }

    public async findOneBy(input: { param: any }){
        
    }

    public async save(entity: Entity): Promise<Entity>{
        if(entity.getName() !== this.model) throw new Error(`Invalid enitity for repository ${this.model}`);
        const params: any[] = [];
        let query = `INSERT INTO ${this.model}(`;
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

        return entity
    }

    public async update(){
        
    }

    public async delete(){
        
    }
}