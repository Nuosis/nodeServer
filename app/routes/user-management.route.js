var userManagementCtrl = require("../controllers/shared/user-management.controller");
const { verifyToken } = require("../auth/security");

module.exports = {
  configure: function (app) {
    /**
     * Create company
     */
    app.route("/createCompany").post(function (req, res) {
      userManagementCtrl.createCompany(req, res);
    });
    /**
     * Get company users
     */
    app.route("/companyUsers").get(verifyToken, function (req, res) {
      userManagementCtrl.companyUsers(req, res);
    });
    /**
     * Create user
     */
    app.route("/createUser").post(function (req, res) {
      userManagementCtrl.createUser(req, res);
    });
    /**
     * Update user
     */
    app.route("/updateUser").post(verifyToken, function (req, res) {
      userManagementCtrl.updateUser(req, res);
    });
    /**
     * User token
     */
    app.route("/user_token").post(verifyToken, function (req, res) {
      userManagementCtrl.userToken(req, res);
    });
    /**
     * Reset Password
     */
    app.route("/reset-password").post(function (req, res) {
      userManagementCtrl.resetPassword(req, res);
    });
    /**
     * Change Password
     */
    app.route("/change-password").post(function (req, res) {
      userManagementCtrl.changePassword(req, res);
    });
    /**
     * Register
     */
    app.route("/register").post(function (req, res) {
      userManagementCtrl.register(req, res);
    });
  },
};
