"use strict";

import Sequelize from "sequelize";
import Configs from "../configs/index.js";

const Model = Sequelize.Model;

class Authentication extends Model {}

Authentication.init(
  {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: Sequelize.TEXT },
    phonenumber: { type: Sequelize.BIGINT },
    username: { type: Sequelize.TEXT },
    password: { type: Sequelize.TEXT },
    salt: { type: Sequelize.TEXT },
  },
  { sequelize: Configs.database, modelName: "authentication", timestamps: true }
);

export default Authentication;

/**
 * If you want to create table from each model then call this method below
 * Authentication.sync({ force: true }).then((res) =>
 * 		console.log(`Table ${Authentication.tableName} has been created`)
 * );
 *
 * otherwise you can use Sequelize.sync() to sync all model to database
 */
