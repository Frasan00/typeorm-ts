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

// user entity popuplation
const user = new User();
user.name.setValue("Francesco");
user.age.setValue(5);

const user2 = new User();
user2.name.setValue("Francesco");
user2.age.setValue(13);

const user3 = new User();
user3.name.setValue("Giovanni");
user3.age.setValue(17);

const user4 = new User();
user4.name.setValue("Giovanni");
user4.age.setValue(17);

/*const p1 = userRepo.save(user)
const p2 = userRepo.save(user2)
const p3 = userRepo.save(user3)
const p4 = userRepo.save(user4)

Promise.all([p1,p2,p3,p4])
.then((_) => console.log("Saving completed"))
.catch((err) => console.error(err));*/

// some queries
/*const p1 = userRepo.findOneById({id: 2})
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
.catch((err) => {}) ;*/

/*userRepo.find({ select: [{ column: "id", function: "COUNT" }] })
.then((_) => console.log(_))*/



// query builder
const query = userRepo.createQueryBuilder()
.where("id", "=", { value: 1 })

query.getQueryResult()
.then((data) => console.log(data))
.catch((err) => {}) ;


app.listen(PORT, () => console.log("Listening on port "+PORT))