const HelpTicket = require('../models/help-ticket-model');

const getShowDeletedState = (req) => {
  const showDeleted = Boolean(req.session && req.session.isAdmin && req.query.showDeleted === '1');
  return { showDeleted };
};

exports.index = async (req, res) => {
  try {
    const { showDeleted } = getShowDeletedState(req);
    const tickets = await HelpTicket.find({ status: { $nin: ['resolved', 'closed'] } }).populate('user', 'username');
    res.render('tickets/index', { tickets, showDeleted });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.show = async (req, res) => {
  try {
    const { showDeleted } = getShowDeletedState(req);
    const ticket = await HelpTicket.findById(req.params.id).populate('user', 'username');
    if (!ticket) return res.status(404).send('Fant ikke saken');
    
    // Get comments for this ticket with populated upvotes/downvotes
    const comments = await require('../models/comment-model').find({ ticket: req.params.id })
      .populate('user', 'username isAdmin')
      .populate('upvotes', 'username')
      .populate('downvotes', 'username')
      .sort({ createdAt: -1 });
    
    res.render('tickets/show', { ticket, comments, showDeleted });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.new = (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('tickets/new');
};

exports.create = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const { title, description, priority } = req.body;
    const ticket = new HelpTicket({
      title,
      description,
      priority,
      user: req.session.userId
    });
    await ticket.save();
    res.redirect('/tickets');
  } catch (error) {
    res.status(400).render('tickets/new', { error: error.message });
  }
};

exports.edit = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Fant ikke saken');
    if (ticket.deletedAt) return res.status(400).send('Slettede saker kan ikke redigeres');
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.session.userId) {
      return res.status(403).send('Du kan bare redigere dine egne saker');
    }
    
    res.render('tickets/edit', { ticket });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.update = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Fant ikke saken');
    if (ticket.deletedAt) return res.status(400).send('Slettede saker kan ikke redigeres');
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.session.userId) {
      return res.status(403).send('Du kan bare redigere dine egne saker');
    }

    const { title, description, priority, status } = req.body;
    await HelpTicket.findByIdAndUpdate(req.params.id, { title, description, priority, status });
    res.redirect('/tickets');
  } catch (error) {
    const ticket = await HelpTicket.findById(req.params.id);
    res.status(400).render('tickets/edit', { error: error.message, ticket });
  }
};

exports.delete = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const { showDeleted } = getShowDeletedState(req);
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Fant ikke saken');
    
    // Check if user owns this ticket or is admin
    const isOwner = ticket.user.toString() === req.session.userId;
    const isAdmin = Boolean(req.session.isAdmin);
    if (!isOwner && !isAdmin) {
      return res.status(403).send('Du har ikke tilgang til å slette denne saken');
    }

    if (ticket.deletedAt) {
      return res.redirect(`/tickets/${req.params.id}`);
    }
    
    ticket.deletedAt = new Date();
    ticket.deletedBy = req.session.userId;
    await ticket.save();

    res.redirect(`/tickets${showDeleted ? '?showDeleted=1' : ''}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.search = async (req, res) => {
  try {
    const { showDeleted } = getShowDeletedState(req);
    const query = req.query.q;
    if (!query) {
      return res.render('tickets/search', { tickets: [], query: undefined, showDeleted });
    }
    
    // First, find users matching the query
    const User = require('../models/user-model');
    const matchingUsers = await User.find({ username: new RegExp(query, 'i') }).select('_id');
    const matchingUserIds = matchingUsers.map(user => user._id);
    
    // Search in tickets by title, description OR by user ID
    const tickets = await HelpTicket.find({
      $or: [
        { title: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { user: { $in: matchingUserIds } }
      ]
    }).populate('user', 'username');
    
    res.render('tickets/search', { tickets, query, showDeleted });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Resolve ticket (admin only)
exports.resolve = async (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).send('Bare administratorer kan løse saker');
  }
  
  try {
    const { showDeleted } = getShowDeletedState(req);
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Fant ikke saken');
    if (ticket.deletedAt) return res.status(400).send('Slettede saker kan ikke markeres som løst');
    
    // Update ticket to resolved
    ticket.status = 'resolved';
    ticket.resolvedBy = req.session.userId;
    ticket.resolvedAt = new Date();
    
    await ticket.save();
    res.redirect(`/tickets${showDeleted ? '?showDeleted=1' : ''}`);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Show resolved tickets
exports.resolved = async (req, res) => {
  try {
    const { showDeleted } = getShowDeletedState(req);
    const tickets = await HelpTicket.find({ status: { $in: ['resolved', 'closed'] } }).populate('user', 'username');
    res.render('tickets/resolved', { tickets, showDeleted });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
