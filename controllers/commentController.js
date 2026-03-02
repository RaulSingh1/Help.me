const Comment = require('../models/comment-model');
const HelpTicket = require('../models/help-ticket-model');

const showDeletedQuerySuffix = (req) => {
  const showDeleted = Boolean(req.session && req.session.isAdmin && req.body.showDeleted === '1');
  return showDeleted ? '?showDeleted=1' : '';
};

// Add a comment to a ticket
exports.addComment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  
  try {
    const { text } = req.body;
    const ticketId = req.params.ticketId;
    
    // Check if ticket exists
    const ticket = await HelpTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).send('Ticket not found');
    }
    if (ticket.deletedAt) {
      return res.status(403).send('Cannot add comments to a deleted ticket');
    }
    
    // Create comment
    const comment = new Comment({
      text,
      ticket: ticketId,
      user: req.session.userId
    });
    
    await comment.save();
    
    // Update ticket status to "in-progress" if it's still "open"
    if (ticket.status === 'open') {
      ticket.status = 'in-progress';
      await ticket.save();
    }
    
    res.redirect(`/tickets/${ticketId}${showDeletedQuerySuffix(req)}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Delete a comment (soft delete - marks as deleted)
exports.deleteComment = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  
  try {
    const commentId = req.params.commentId;
    const ticketId = req.params.ticketId;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).send('Comment not found');
    }
    
    // Check if user is the author or admin
    const isAuthor = comment.user.toString() === req.session.userId.toString();
    const isAdmin = req.session.isAdmin;
    
    if (!isAuthor && !isAdmin) {
      return res.status(403).send('You are not authorized to delete this comment');
    }
    
    // Soft delete - set deletedAt timestamp
    comment.deletedAt = new Date();
    await comment.save();
    
    res.redirect(`/tickets/${ticketId}${showDeletedQuerySuffix(req)}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Upvote a comment
exports.upvoteComment = async (req, res) => {
  console.log('=== UPVOTE DEBUG ===');
  console.log('Session:', req.session);
  console.log('Session ID:', req.sessionID);
  console.log('User ID in session:', req.session.userId);
  console.log('Cookies:', req.headers.cookie);
  
  if (!req.session.userId) {
    console.log('User not logged in - returning 401');
    return res.status(401).json({ error: 'You must be logged in to vote' });
  }
  
  try {
    const commentId = req.params.commentId;
    const userId = req.session.userId.toString();
    
    console.log('Upvote - commentId:', commentId, 'userId:', userId);
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (comment.deletedAt) {
      return res.status(400).json({ error: 'Cannot vote on deleted comments' });
    }
    const ticket = await HelpTicket.findById(comment.ticket).select('deletedAt');
    if (ticket && ticket.deletedAt) {
      return res.status(400).json({ error: 'Cannot vote on comments in deleted tickets' });
    }
    
    console.log('Before - upvotes:', comment.upvotes, 'downvotes:', comment.downvotes);
    
    // Convert upvotes and downvotes to strings for comparison
    const upvoteStrings = comment.upvotes.map(id => id.toString());
    const downvoteStrings = comment.downvotes.map(id => id.toString());
    
    // Remove from downvotes if present
    const downIdx = downvoteStrings.indexOf(userId);
    if (downIdx !== -1) {
      comment.downvotes.splice(downIdx, 1);
    }
    
    // Toggle upvote
    const upIdx = upvoteStrings.indexOf(userId);
    if (upIdx === -1) {
      comment.upvotes.push(userId);
    } else {
      comment.upvotes.splice(upIdx, 1);
    }
    
    await comment.save();
    
    console.log('After - upvotes:', comment.upvotes, 'downvotes:', comment.downvotes);
    
    const score = comment.upvotes.length - comment.downvotes.length;
    const hasUpvoted = comment.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = comment.downvotes.some(id => id.toString() === userId);
    
    console.log('Response - score:', score, 'hasUpvoted:', hasUpvoted, 'hasDownvoted:', hasDownvoted);
    
    res.json({ 
      success: true, 
      score,
      hasUpvoted,
      hasDownvoted
    });
  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Downvote a comment
exports.downvoteComment = async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'You must be logged in to vote' });
  }
  
  try {
    const commentId = req.params.commentId;
    const userId = req.session.userId.toString();
    
    console.log('Downvote - commentId:', commentId, 'userId:', userId);
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    if (comment.deletedAt) {
      return res.status(400).json({ error: 'Cannot vote on deleted comments' });
    }
    const ticket = await HelpTicket.findById(comment.ticket).select('deletedAt');
    if (ticket && ticket.deletedAt) {
      return res.status(400).json({ error: 'Cannot vote on comments in deleted tickets' });
    }
    
    console.log('Before - upvotes:', comment.upvotes, 'downvotes:', comment.downvotes);
    
    // Convert upvotes and downvotes to strings for comparison
    const upvoteStrings = comment.upvotes.map(id => id.toString());
    const downvoteStrings = comment.downvotes.map(id => id.toString());
    
    // Remove from upvotes if present
    const upIdx = upvoteStrings.indexOf(userId);
    if (upIdx !== -1) {
      comment.upvotes.splice(upIdx, 1);
    }
    
    // Toggle downvote
    const downIdx = downvoteStrings.indexOf(userId);
    if (downIdx === -1) {
      comment.downvotes.push(userId);
    } else {
      comment.downvotes.splice(downIdx, 1);
    }
    
    await comment.save();
    
    console.log('After - upvotes:', comment.upvotes, 'downvotes:', comment.downvotes);
    
    const score = comment.upvotes.length - comment.downvotes.length;
    const hasUpvoted = comment.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = comment.downvotes.some(id => id.toString() === userId);
    
    console.log('Response - score:', score, 'hasUpvoted:', hasUpvoted, 'hasDownvoted:', hasDownvoted);
    
    res.json({ 
      success: true, 
      score,
      hasUpvoted,
      hasDownvoted
    });
  } catch (error) {
    console.error('Downvote error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get comments for a ticket (helper function)
exports.getCommentsForTicket = async (ticketId) => {
  return await Comment.find({ ticket: ticketId })
    .populate('user', 'username isAdmin')
    .sort({ createdAt: -1 });
};

module.exports = exports;
