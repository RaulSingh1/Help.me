const router = require("express").Router();

const controller = require("../controllers/default_controller.js")
const authRoutes = require('./auth_routes');
const ticketsRoutes = require('./tickets_routes');

router.get("/", controller.index_render);
router.use('/auth', authRoutes);
router.use('/tickets', ticketsRoutes);

module.exports = router;

