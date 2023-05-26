import express from "express";
import cors from "cors";
import { DatabaseController } from "../src/DatabaseController";

const config = require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

// mysql
let port: number;
if(!process.env.MYSQL_PORT) port = 3306;
else port = parseInt(process.env.MYSQL_PORT);
const mysql = new DatabaseController({
    host: process.env.MYSQL_HOST || "database",
    db_name: process.env.MYSQL_DATABASE || "myDB",
    user_name: process.env.MYSQL_USER || "admin",
    password: process.env.MYSQL_PASSWORD || "password",
    port: port,
    Entities: []
});

app.listen(PORT, () => console.log("Listening on port "+PORT))