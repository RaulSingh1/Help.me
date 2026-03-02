const router = require("express").Router();

const controller = require("../controllers/default_controller.js")
const authRoutes = require('./auth_routes');
const ticketsRoutes = require('./tickets_routes');
const commentsRoutes = require('./comments_routes');

router.get("/", controller.index_render);
router.use('/auth', authRoutes);
router.use('/tickets', ticketsRoutes);
router.use('/', commentsRoutes);

module.exports = router;

