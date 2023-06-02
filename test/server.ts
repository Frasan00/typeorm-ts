import express from "express";
import cors from "cors";
import { DatabaseController } from "../src/DatabaseController";
import { User } from "./entities/User";

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
    entities: [User]
});

const userRepo = mysql.getModelRepository(User);

const user = new User();
user.name.setValue("Giovanni");
user.age.setValue(17);
/*userRepo.save(user)
    .then((_) => console.log("Saving completed"))
    .catch((err) => console.error(err));*/
const p1 = userRepo.findOneById({id: 2})
.then((data) => console.log(data))
.catch((err) => {}) ;
const p2 = userRepo.find()
    .then((data) => console.log(data))
    .catch((err) => {}) ;

const p3 = userRepo.find({
    select: [{
        column: "name"
    }],
    where: {
        id: 3,
        name: "Giovanni",
        age: { moreThan: 2 }
    }
})
.then((data) => console.log(data))
.catch((err) => {}) ;

//const query = userRepo.createQueryBuilder()


app.listen(PORT, () => console.log("Listening on port "+PORT))