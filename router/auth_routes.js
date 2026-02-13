const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.registerPage);
router.post('/register', authController.register);

router.get('/login', authController.loginPage);
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.get('/user', authController.userPage);
router.post('/user/delete', authController.deleteUser);

module.exports = router;
