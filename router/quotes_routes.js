const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

router.get('/', quoteController.index);
router.get('/new', quoteController.new);
router.post('/', quoteController.create);
router.get('/search', quoteController.search);
router.get('/:id', quoteController.show);
router.get('/:id/edit', quoteController.edit);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.delete);
router.post('/:id/like', quoteController.like);

module.exports = router;

