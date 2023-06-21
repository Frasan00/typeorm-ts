# typeorm-ts

- Typeorm is build for node.js and simplifies SQL Tables and Queries abstracting the SQL language in typescript
- This project has a /src folder with all the classes needed to work and a /test folder with an example of implementation
- This is to be considered an amateur project with limitations and possible bugs
- Also, sync is supported, so if you choose to enable it, every change made in the logic of your classes in your code will be updated on the database
- For now, It supports mysql databases

# How to run

- You can implement this Typeorm in your project using it's own classes
- This project also has a docker-compose file and two bash files to automate running docker containers with the test server and a database mysql

# What this Typeorm does

- This Typeorm allows you to easily setup the connection to your database
- You can create your own classes extending the Entity.ts class to create tables in your Database automatically
- The creation process has all you need to create simple or complex tables for all your needs

# Supported relation

- All relations are supported (one-to-one, one-to-many, many-to-one, many-to-many)
- For an in-deept explanation of how they're used check the examples made in the /test folder
- I tried to make them in the more easy and intuitive way possible

# Types of queries

- There are two types of possible queries:

1) Simple queries; you can use the basic methods like find() or findOne() to quickly query your tables

2) Querybuilder; you can create your queries in a more SQL-like way building more complex queries based on your needs