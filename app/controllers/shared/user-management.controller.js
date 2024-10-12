require("dotenv").config();

const { createCompany, createUser } = require("../../../users/functions");
const {
  sanitizeInput,
  generateToken,
  hashPassword,
  deTokenize,
} = require("../../auth/security");
const { findRecordsSQL, modifyAllSQL } = require("../../SQLite/functions");
const jwt = require('jsonwebtoken');

function userManagementController() {
  this.createCompany = async function (req, res) {
    const { company, DEVun, DEVpw } = req.body;

    if (!company || !DEVun || !DEVpw) {
      return res
        .status(400)
        .json({ message: "Company, username, and password are required" });
    }

    if (company.length > 50) {
      return res.status(400).json({ message: "Company name too long" });
    }

    if (DEVun !== process.env.DEVun || DEVpw !== process.env.DEVpw) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if the company already exists
    findRecordsSQL("company", [{ company: company }])
      .then((records) => {
        if (records.length > 0) {
          // Company already exists, return company information
          console.log("Company exists");
          return { type: "company", data: records[0] };
        } else {
          // Create the new company
          console.log("Company creation STARTED");
          return createCompany(company).then((companyData) => ({
            type: "company",
            data: companyData,
          }));
        }
      })
      .then((result) => {
        if (result.type === "company") {
          // Handle the company information result
          res.status(200).json({
            message: "Company processed successfully",
            company: result.data.company,
            apiKey: result.data.apiKey,
          });
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        res.status(500).json({ message: error.message });
      });
  };

  this.companyUsers = async function (req, res) {
    try {
      const username = req.user.userName;
      const apiKey = req.user.apiKey;
      const companyId = req.user.companyId;
      const userQuery = [{ companyId }];
      const users = await findRecordsSQL("users", userQuery);
      if (users.length === 0) {
        return res.status(404).json({ message: "no users found" });
      } else {
        const userArray = users.map((user) => ({
          username: user.username,
          access: user.access,
        }));
        return res.status(200).json({
          message: "users found",
          userArray,
        });
      }
    } catch (err) {
      // If there's an error in sending the email, return an error response
      res
        .status(500)
        .json({ message: "Error getting company users", error: err.message });
    }
  };

  this.createUser = async function (req, res) {
    let { apiKey = '', userName = '' } = req?.user || {};
    const userAccess = req?.user?.access;
    const { newUserName, newPassword, accessLevel } = req.body;
    if (!newUserName || !newPassword) {
      return res
        .status(400)
        .json({ message: "userName, password for new user are required" });
    }

    if (newUserName.length > 120 || newPassword.length > 120) {
      return res.status(400).json({ message: "userName or password too long" });
    }

    if (!apiKey){
      apiKey = req.body.apiKey;
    }
    
    if (userAccess === "dev") {
      //CREATE
      const newUserAccess = accessLevel || "standard";
      try {
        // Call the createUser function
        const reset = false;
        const newUser = await createUser(
          apiKey,
          newUserName,
          newPassword,
          newUserAccess,
          reset
        );
        res.status(201).json({
          message: "User created successfully.",
        });
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    } else {
      //creators access level
      // if (userAccess !== "admin" && userAccess !== "dev") {
      //   console.error("access error: Insufficient Access Level", userAccess);
      //   return res
      //     .status(400)
      //     .json({ message: "Insufficient credentials to create user" });
      // }

      //creators intented access level for new useraccess level
      if (accessLevel === "dev") {
        console.error("access error: Admin users cannot create dev users");
        return res
          .status(400)
          .json({ message: "Insufficient credentials to create dev user" });
      }

      //CREATE
      const newUserAccess = accessLevel || "standard";
      try {
        // Call the createUser function
        const newUser = await createUser(
          apiKey,
          newUserName,
          newPassword,
          newUserAccess
        );
        // const newUserToken = generateToken(
        //   apiKey,
        //   newUser.username,
        //   newUserAccess
        // );
        res
          .status(201)
          .json({ message: "User created successfully" });
      } catch (error) {
        console.error("Creation error:", error);
        res.status(500).json({ message: error.message });
      }
    }
  };

  this.updateUser = async function (req, res) {
    const { userId, access } = req.user;
    const {
      newPassword,
      newAccessLevel,
      newReset,
      newFileMakerID,
      newVerified,
      userToken,
    } = req.body;
    let companyId = "";
    let userName = "";
    try {
      const userInfo = deTokenize(userToken);
      //console.log({userInfo});
      const userCompanyInfo = await findRecordsSQL("company", [
        { apiKey: userInfo.decoded.apiKey },
      ]);
      //console.log({userCompanyInfo});
      companyId = userCompanyInfo[0].id;
      userName = userInfo.decoded.userName;
    } catch (error) {
      console.error("Error collecting user data:", error);
      res.status(500).json({ message: error.message });
    }

    // Basic validation
    if (
      !newPassword &&
      !newAccessLevel &&
      !newReset &&
      !newFileMakerID &&
      !newVerified
    ) {
      return res.status(400).json({ message: "no updated values provided" });
    }
    if (!companyId || !userName) {
      return res.status(400).json({ message: "no updated values provided" });
    }

    try {
      // Confirm the user making the request has sufficient privileges
      if (
        (newPassword || newAccessLevel) &&
        (userId !== "dev" || access !== "admin")
      ) {
        console.error("access denied: access level", access, "devUser", userId);
        return res.status(403).json({ message: "Insufficient privileges" });
      }

      // const requesterInfo = await findRecordsSQL('users', [{ id: userId }]);

      // Prepare modifications for updateUser function
      const modifications = {};
      if (newPassword) {
        const hashedPassword = await hashPassword(newPassword);
        modifications.password = hashedPassword;
      }
      if (newAccessLevel) {
        modifications.access = newAccessLevel;
      }
      if (newReset) {
        modifications.resetPassword = newReset;
      }
      if (newFileMakerID) {
        modifications.filemakerId = newFileMakerID;
      }
      if (newVerified) {
        modifications.verified = true;
      }

      // Update user details in the database
      await modifyAllSQL(
        "users",
        [{ username: userName, companyId }],
        modifications
      );
      res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message });
    }
  };

  this.userToken = async function (req, res) {
    try {
      const accessUserName = req.user.userName;
      const accessAccessLevel = req.user.access;

      if (accessUserName !== process.env.DEVun || accessAccessLevel !== "dev") {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      console.log(
        "raw.username",
        req.body.username,
        "raw.access",
        req.body.access
      );
      const username = sanitizeInput(req.body.username);
      if (!username || username.length < 3 || username.length > 30) {
        return res.status(400).json({ message: "Invalid username" });
      }
      console.log("username", username);
      const access = sanitizeInput(req.body.access);
      if (!access || typeof access !== "string") {
        // Adjust this according to what 'access' represents
        return res.status(400).json({ message: "Invalid access level" });
      }
      console.log("access", access);
      const id = (await findRecordsSQL("users", [{ username }]))[0].companyId;
      const apiKey = (await findRecordsSQL("company", [{ id }]))[0].apiKey;
      console.log("apiKey", apiKey);
      const token = generateToken(apiKey, username, access);
      return res.status(200).json({
        message: "token generated",
        token,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
}

module.exports = new userManagementController();
