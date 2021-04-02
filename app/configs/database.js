import { config } from "dotenv";
import Sequelize from "sequelize";

config();

const {
  POSTGRESDATABASE,
  POSTGRESHOST,
  POSTGRESUSER,
  POSTGRESPASSWORD,
  POSTGRESPORT,
} = process.env;

const dialect = "postgres";

const database = new Sequelize(
  `${dialect}://${POSTGRESUSER}:${POSTGRESPASSWORD}@${POSTGRESHOST}:${POSTGRESPORT}/${POSTGRESDATABASE}`
);

export default database;
