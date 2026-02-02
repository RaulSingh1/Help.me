const router = require("express").Router();

const controller = require("../controllers/default_controller.js")

router.get("/",controller.index_render)

module.exports = router