const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Add a comment to a ticket
router.post('/tickets/:ticketId/comments', commentController.addComment);

// Delete a comment (soft delete)
router.post('/tickets/:ticketId/comments/:commentId/delete', commentController.deleteComment);

// Upvote a comment (AJAX)
router.post('/comments/:commentId/upvote', commentController.upvoteComment);

// Downvote a comment (AJAX)
router.post('/comments/:commentId/downvote', commentController.downvoteComment);

module.exports = router;

