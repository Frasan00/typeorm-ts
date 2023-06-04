import express from "express";
import cors from "cors";
import { DatabaseController } from "../src/DatabaseController";
import { User } from "./entities/User";
import { Profile } from "./entities/Profile";
import { Post } from "./entities/Post";

require("dotenv").config();
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
    entities: [Post, Profile, User]
});

mysql.connection()
.then(async () => {
    await initiDB()
        .then(async () => {
            await userRepo.find({
                joinAll: true
            })
                .then((data) => console.log(data))
                .catch((err) => {});
        })

    // some queries
    
    /*await const q1 = userRepo.findOneById({id: 2})
        .then((data) => console.log(data))
        .catch((err) => {}) ;*/

    /*await const q2 = userRepo.find()
        .then((data) => console.log(data))
        .catch((err) => {}) ;*/
    
    /*await userRepo.find({ select: [{ column: "id", function: "COUNT" }] })
        .then((_) => console.log(_))*/



    // query builder

    /*const query = userRepo.createQueryBuilder()
    .where("id", "=", { value: 1 })

    query.getQueryResult()
    .then((data) => console.log(data))
    .catch((err) => {}) ;*/
})

const userRepo = mysql.getModelRepository(User);
const profileRepo = mysql.getModelRepository(Profile);
const postRepo = mysql.getModelRepository(Post);

// user entity popuplation
async function initiDB() {

    const post1 = new Post();
    post1.title.setValue("New post 1");
    post1.user_id.setValue(1);

    const post2 = new Post();
    post1.title.setValue("New post 2");
    post1.user_id.setValue(1);

    await Promise.all([post1, post2]);

    const user = new User();
    user.name.setValue("Francesco");
    user.age.setValue(5);
    user.profile.setValue(1);

    const user2 = new User();
    user2.name.setValue("Francesco");
    user2.age.setValue(13);

    const user3 = new User();
    user3.name.setValue("Giovanni");
    user3.age.setValue(17);

    const user4 = new User();
    user4.name.setValue("Giovanni");
    user4.age.setValue(17);

    await Promise.all([userRepo.save(user),userRepo.save(user2),userRepo.save(user3),userRepo.save(user4)])

    const profile1 = new Profile();
    profile1.followers.setValue(49);
    profile1.bio.setValue("A good profile");

    await profileRepo.save(profile1);
}


app.listen(PORT, () => console.log("Listening on port "+PORT))