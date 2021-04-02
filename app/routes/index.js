import { Router } from "express";
import Controllers from "../controllers/index.js";
import utils from "../utils/index.js";
import * as Constants from "../constants/index.js";
const router = Router();

const parameterVerify = (email, phonenumber, username, password) => {
  const error = [];
  if (!email && !phonenumber && !username) {
    error.push(
      "either email or phonenumber or username is prohibited to empty"
    );
  }
  if (!password) {
    error.push("password is prohibited to empty");
  }
  return error;
};

router.post("/api/login", (req, res) => {
  const { email, phonenumber, username, password } = req.body;
  const isBadRequest = parameterVerify(email, phonenumber, username, password);
  if (isBadRequest.length) {
    res
      .status(Constants.HTTP_CODE.BAD_REQUEST)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
    return;
  }
  Controllers.Authentication.getAuthenticationByKey({
    email,
    phonenumber,
    username,
  })
    .then((auth) => {
      const { encrypted } = utils.cipher(password, auth.salt);
      if (encrypted === auth.password) {
        const id = email || phonenumber || username;
        res.status(Constants.HTTP_CODE.SUCCESS).send({
          ...Constants.RESPONSE_OBJECT_SUCCESS,
          token: utils.JWTGenerator({ id, role: "admin" }),
        });
      } else {
        res.status(Constants.HTTP_CODE.SUCCESS).send({
          ...Constants.RESPONSE_OBJECT_FAILED,
          message: "Username or Password does not match",
        });
      }
    })
    .catch((error) =>
      res
        .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, ...error })
    );
});

router.post("/api/signup", async (req, res) => {
  try {
    const { email, phonenumber, username, password } = req.body;
    const isBadRequest = parameterVerify(
      email,
      phonenumber,
      username,
      password
    );
    if (isBadRequest.length) {
      res
        .status(Constants.HTTP_CODE.BAD_REQUEST)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
      return;
    }
    const { encrypted, salt } = utils.cipher(password);
    const checkAuthentication = await Controllers.Authentication.getAuthenticationByKey(
      {
        email,
        phonenumber,
        username,
      }
    );
    if (checkAuthentication) {
      res.status(Constants.HTTP_CODE.SUCCESS).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message: `${email || phonenumber || username} already registered`,
      });
      return;
    }
    const auth = await Controllers.Authentication.insertAuthentication({
      email,
      phonenumber,
      username,
      password: encrypted,
      salt,
    });
    res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      message: `${
        auth.email || auth.phonenumber || auth.username
      } has been successfully registered`,
    });
  } catch (error) {
    res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, ...error });
  }
});

router.post("/api/resetpassword", (req, res) => {
  const { email, phonenumber, username, newPassword } = req.body;
  const isBadRequest = parameterVerify(
    email,
    phonenumber,
    username,
    newPassword
  );
  if (isBadRequest.length) {
    res
      .status(Constants.HTTP_CODE.BAD_REQUEST)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
    return;
  }
  const { encrypted, salt } = utils.cipher(newPassword);
  Controllers.Authentication.updateAuthenticationByKey(
    {
      email,
      phonenumber,
      username,
    },
    {
      password: encrypted,
      salt,
    }
  )
    .then(() =>
      res.status(Constants.HTTP_CODE.SUCCESS).send({
        ...Constants.RESPONSE_OBJECT_SUCCESS,
        message: "Password has been changed",
      })
    )
    .catch((error) =>
      res
        .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, ...error })
    );
});

export default router;
