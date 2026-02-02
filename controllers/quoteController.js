const Quote = require('../models/quote-model');
const authController = require('./authController');

exports.index = async (req, res) => {
  try {
    const quotes = await Quote.find().populate('user', 'username');
    res.render('quotes/index', { quotes });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.show = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('user', 'username');
    if (!quote) return res.status(404).send('Quote not found');
    res.render('quotes/show', { quote });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.new = (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  res.render('quotes/new');
};

exports.create = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const { text, author, category } = req.body;
    const quote = new Quote({
      text,
      author,
      category,
      user: req.session.userId
    });
    await quote.save();
    res.redirect('/quotes');
  } catch (error) {
    res.status(400).render('quotes/new', { error: error.message });
  }
};

exports.edit = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).send('Quote not found');
    
    // Check if user owns this quote
    if (quote.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only edit your own quotes');
    }
    
    res.render('quotes/edit', { quote });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

exports.update = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).send('Quote not found');
    
    // Check if user owns this quote
    if (quote.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only edit your own quotes');
    }

    const { text, author, category } = req.body;
    await Quote.findByIdAndUpdate(req.params.id, { text, author, category });
    res.redirect('/quotes');
  } catch (error) {
    const quote = await Quote.findById(req.params.id);
    res.status(400).render('quotes/edit', { error: error.message, quote });
  }
};

exports.delete = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/auth/login');
  }
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) return res.status(404).send('Quote not found');
    
    // Check if user owns this quote
    if (quote.user.toString() !== req.session.userId) {
      return res.status(403).send('You can only delete your own quotes');
    }
    
    await Quote.findByIdAndDelete(req.params.id);
    res.redirect('/quotes');
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
    
    // Search in quotes by text, author, category OR by user ID
    const quotes = await Quote.find({
      $or: [
        { text: new RegExp(query, 'i') },
        { author: new RegExp(query, 'i') },
        { category: new RegExp(query, 'i') },
        { user: { $in: matchingUserIds } }
      ]
    }).populate('user', 'username');
    
    res.render('quotes/search', { quotes, query });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// Like - toggle like on quote
exports.like = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);
    
    if (!quote) {
      return res.status(404).send('Quote not found');
    }
    
    if (!req.session.userId) {
      return res.redirect('/auth/login');
    }
    
    const userId = req.session.userId;
    const isLiked = quote.likedBy && quote.likedBy.some(id => id.toString() === userId.toString());
    
    if (isLiked) {
      // Unlike
      quote.likedBy = quote.likedBy.filter(id => id.toString() !== userId.toString());
      quote.likes = Math.max(0, quote.likes - 1);
    } else {
      // Like
      quote.likedBy.push(userId);
      quote.likes += 1;
    }
    
    await quote.save();
    
    // Redirect back to the page user came from
    const referer = req.get('Referer') || '/quotes';
    res.redirect(referer);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

