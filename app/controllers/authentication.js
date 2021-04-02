import Models from "../models/index.js";
import utils from "../utils/index.js";

const getAllAuthentication = Models.Authentication.findAll;

const getAuthenticationByKey = (where = { email, phonenumber, username }) => {
  return Models.Authentication.findOne({ where: utils.cleanEmpty(where) });
};

const insertAuthentication = ({
  email,
  phonenumber,
  username,
  password,
  salt,
}) => {
  return Models.Authentication.create({
    email,
    phonenumber,
    username,
    password,
    salt,
  });
};

const deleteAuthenticationByKey = (
  where = { email, phonenumber, username }
) => {
  return Models.Authentication.destroy({ where: utils.cleanEmpty(where) });
};

const updateAuthenticationByKey = (
  where = { email, phonenumber, username },
  data = { email, phonenumber, username, password, salt }
) => {
  return Models.Authentication.update(utils.cleanEmpty(data), {
    where: utils.cleanEmpty(where),
  });
};

export default {
  getAllAuthentication,
  getAuthenticationByKey,
  deleteAuthenticationByKey,
  updateAuthenticationByKey,
  insertAuthentication,
};
