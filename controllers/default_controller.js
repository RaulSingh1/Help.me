const HelpTicket = require('../models/help-ticket-model');

const index_render = async (req, res) => {
    try {
        const openTickets = await HelpTicket.countDocuments({ status: 'open' });
        const inProgressTickets = await HelpTicket.countDocuments({ status: 'in-progress' });
        const resolvedTickets = await HelpTicket.countDocuments({ status: 'resolved' });
        const totalTickets = openTickets + inProgressTickets + resolvedTickets;
        
        res.render("index", { openTickets, inProgressTickets, resolvedTickets, totalTickets });
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    index_render
}

