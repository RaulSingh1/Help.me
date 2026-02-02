const Quote = require('../models/quote-model');

const index_render = async (req, res) => {
    try {
        const count = await Quote.countDocuments();
        let randomQuote = null;
        
        if (count > 0) {
            const randomIndex = Math.floor(Math.random() * count);
            randomQuote = await Quote.findOne().skip(randomIndex).populate('user', 'username');
        }
        
        res.render("index", { quote: randomQuote, count });
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    index_render
}

