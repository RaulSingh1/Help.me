const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

router.get('/', ticketController.index);
router.get('/resolved', ticketController.resolved);
router.get('/new', ticketController.new);
router.post('/', ticketController.create);
router.get('/search', ticketController.search);
router.get('/:id', ticketController.show);
router.get('/:id/edit', ticketController.edit);
router.put('/:id', ticketController.update);
router.delete('/:id', ticketController.delete);
router.post('/:id/resolve', ticketController.resolve);
router.post('/:id/approve-solution/:commentId', ticketController.approveSolution);
router.post('/:id/reject-solution', ticketController.rejectSolution);

module.exports = router;
