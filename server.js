import express from "express";
import { config } from "dotenv";
import routes from "./app/routes/index.js";
import Configs from "./app/configs/index.js";

config();

const server = express();
const { PORT } = process.env;

Configs.database
  .authenticate()
  .then(() => {
    console.log("Connection to database has been established successfully.");
    Configs.database.sync();
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

server.use(express.json());

server.use(routes);

server.get("/", (req, res) => {
  res.send("Hello World!!!");
});

server.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
