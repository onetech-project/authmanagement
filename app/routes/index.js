import { Router } from "express";
import Controllers from "../controllers/index.js";
import utils from "../utils/index.js";
import * as Constants from "../constants/index.js";
const router = Router();

const parameterVerify = (email, phonenumber, username, password) => {
  const error = [];
  if (!email && !phonenumber && !username)
    error.push(
      "either email or phonenumber or username is prohibited to be empty"
    );
  if (!password) error.push("password is prohibited to be empty");
  return error;
};

router.post("/api/login", async (req, res) => {
  try {
    const { email, phonenumber, username, password } = req.body;
    const isBadRequest = parameterVerify(
      email,
      phonenumber,
      username,
      password
    );
    if (isBadRequest.length) {
      return res
        .status(Constants.HTTP_CODE.BAD_REQUEST)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
    }

    const auth = await Controllers.Authentication.getAuthenticationByKey({
      email,
      phonenumber,
      username,
    });

    const { encrypted } = utils.cipher(password, auth.salt);

    if (encrypted !== auth.password) {
      return res.status(Constants.HTTP_CODE.SUCCESS).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message: "Username or Password does not match",
      });
    }

    const id = email || phonenumber || username;
    return res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      token: utils.JWTGenerator({ id, role: "admin" }),
    });
  } catch (error) {
    return res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
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
      return res
        .status(Constants.HTTP_CODE.BAD_REQUEST)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
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
      return res.status(Constants.HTTP_CODE.SUCCESS).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message: `${email || phonenumber || username} already registered`,
      });
    }

    const auth = await Controllers.Authentication.insertAuthentication({
      email,
      phonenumber,
      username,
      password: encrypted,
      salt,
    });

    return res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      message: `${
        auth.email || auth.phonenumber || auth.username
      } has been successfully registered`,
    });
  } catch (error) {
    return res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
});

router.post("/api/forgotpassword", async (req, res) => {
  try {
    const { email, phonenumber, username } = req.body;

    if (!email && !phonenumber && !username) {
      return res.status(Constants.HTTP_CODE.BAD_REQUEST).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message:
          "either email or phonenumber or username is prohibited to be empty",
      });
    }

    const auth = await Controllers.Authentication.getAuthenticationByKey({
      email,
      phonenumber,
      username,
    });

    const html = `<p>Click <a href="https://localhost:3000/resetpassword?email=${auth.email}&key=${auth.password}" target="_blank">here</a></p>`;

    await utils.mailer.maintest(auth.email, "Hello", html, "Reset Password");

    return res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      message: `Success send email to ${auth.email}`,
    });
  } catch (error) {
    return res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
});

router.post("/api/resetpassword", async (req, res) => {
  try {
    const {
      email,
      phonenumber,
      username,
      encryptedOldPassword,
      newPassword,
    } = req.body;

    const isBadRequest = parameterVerify(
      email,
      phonenumber,
      username,
      newPassword
    );

    if (!encryptedOldPassword)
      isBadRequest.push("Encrypted Old Password is prohibited to be empty");

    const auth = await Controllers.Authentication.getAuthenticationByKey({
      email,
      phonenumber,
      username,
    });

    if (auth.password !== encryptedOldPassword)
      isBadRequest.push("Cannot update the password. Access restricted");

    if (isBadRequest.length) {
      return res
        .status(Constants.HTTP_CODE.BAD_REQUEST)
        .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: isBadRequest });
    }

    const { encrypted, salt } = utils.cipher(newPassword);

    await Controllers.Authentication.updateAuthenticationByKey(
      {
        email,
        phonenumber,
        username,
      },
      {
        password: encrypted,
        salt,
      }
    );

    return res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      message: "Password has been changed",
    });
  } catch (error) {
    return res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
});

router.post("/api/logout", async (req, res) => {
  try {
    const jwtverified = utils.verifyJWT(req.header("Authorization"));
    return res
      .status(Constants.HTTP_CODE.SUCCESS)
      .send({ ...Constants.RESPONSE_OBJECT_SUCCESS, ...jwtverified });
  } catch (error) {
    return res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
});

router.post("/api/updatepassword", async (req, res) => {
  try {
    const { id } = utils.verifyJWT(req.header("Authorization"));
    const { newPassword, oldPassword, confirmNewPassword } = req.body;

    const error = [];
    if (!newPassword) error.push("New Password cannot be empty");
    if (!oldPassword) error.push("Old Password cannot be empty");
    if (!confirmNewPassword) error.push("Confirm New Password cannot be empty");
    if (newPassword !== confirmNewPassword)
      error.push("New Password and Confirm New Password not match");
    if (error.length) {
      return res.status(Constants.HTTP_CODE.BAD_REQUEST).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message: error,
      });
    }

    const oldAuth = await Controllers.Authentication.getAuthenticationByKey({
      email: id,
    });

    const oldEncrypted = utils.cipher(oldPassword, oldAuth.salt);

    if (oldEncrypted.encrypted !== oldAuth.password) {
      return res.status(Constants.HTTP_CODE.SUCCESS).send({
        ...Constants.RESPONSE_OBJECT_FAILED,
        message: "Username or Password does not match",
      });
    }

    const newEncrypted = utils.cipher(newPassword);
    await Controllers.Authentication.updateAuthenticationByKey(
      { email: id },
      { password: newEncrypted.encrypted, salt: newEncrypted.salt }
    );

    return res.status(Constants.HTTP_CODE.SUCCESS).send({
      ...Constants.RESPONSE_OBJECT_SUCCESS,
      message: "Password has been changed",
    });
  } catch (error) {
    res
      .status(Constants.HTTP_CODE.INTERNAL_SERVER_ERROR)
      .send({ ...Constants.RESPONSE_OBJECT_FAILED, message: error.message });
  }
});

export default router;
