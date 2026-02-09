const HelpTicket = require('../models/help-ticket-model');
const authController = require('./authController');

exports.index = async (req, res) => {
  try {
    const tickets = await HelpTicket.find().populate('user', 'username');
    res.render('tickets/index', { tickets });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.show = async (req, res) => {
  try {
    const ticket = await HelpTicket.findById(req.params.id).populate('user', 'username');
    if (!ticket) return res.status(404).send('Ticket not found');
    res.render('tickets/show', { ticket });
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
    if (!ticket) return res.status(404).send('Ticket not found');
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only edit your own tickets');
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
    if (!ticket) return res.status(404).send('Ticket not found');
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only edit your own tickets');
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
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Ticket not found');
    
    // Check if user owns this ticket
    if (ticket.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only delete your own tickets');
    }
    
    await HelpTicket.findByIdAndDelete(req.params.id);
    res.redirect('/tickets');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.search = async (req, res) => {
  try {
    const query = req.query.q;
    
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
    
    res.render('tickets/search', { tickets, query });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Resolve ticket (admin only)
exports.resolve = async (req, res) => {
  if (!req.session.userId || !req.session.isAdmin) {
    return res.status(403).send('Only admins can resolve tickets');
  }
  
  try {
    const ticket = await HelpTicket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Ticket not found');
    
    // Update ticket to resolved
    ticket.status = 'resolved';
    ticket.resolvedBy = req.session.userId;
    ticket.resolvedAt = new Date();
    
    await ticket.save();
    res.redirect('/tickets');
  } catch (error) {
    res.status(500).send(error.message);
  }
};

