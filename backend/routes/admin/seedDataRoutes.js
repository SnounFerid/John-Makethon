const express = require('express');
const router = express.Router();
const SeedDataService = require('../../services/seedDataService');
const { adminAuth } = require('../../middleware/auth');

// Generate seed data
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const {
      numberOfUsers,
      numberOfProjects,
      numberOfTickets,
      numberOfComments,
      startDate,
      endDate,
      includeAttachments,
      includeNotifications,
      lowTickets,
      mediumTickets,
      highTickets,
      tesMode
    } = req.body;

    // Validate distribution
    const totalDistribution = (lowTickets || 0) + (mediumTickets || 0) + (highTickets || 0);
    if (totalDistribution !== 100) {
      return res.status(400).json({
        error: 'Ticket distribution must total 100%',
        currentTotal: totalDistribution
      });
    }

    // Generate seed data
    const result = await SeedDataService.generateSeedData({
      numberOfUsers,
      numberOfProjects,
      numberOfTickets,
      numberOfComments,
      startDate,
      endDate,
      includeAttachments,
      includeNotifications,
      distribution: {
        low: lowTickets,
        medium: mediumTickets,
        high: highTickets
      },
      testMode: tesMode
    });

    res.json({
      success: true,
      message: 'Seed data generated successfully',
      usersCreated: result.users.length,
      projectsCreated: result.projects.length,
      ticketsCreated: result.tickets.length,
      commentsCreated: result.comments.length,
      attachmentsCreated: result.attachments?.length || 0
    });
  } catch (error) {
    console.error('Seed data generation error:', error);
    res.status(500).json({
      error: 'Failed to generate seed data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export seed data
router.post('/export', adminAuth, async (req, res) => {
  try {
    const config = req.body;

    // Generate seed data
    const data = await SeedDataService.generateSeedData(config);

    // Create a clean export object
    const exportData = {
      timestamp: new Date().toISOString(),
      config: {
        numberOfUsers: config.numberOfUsers,
        numberOfProjects: config.numberOfProjects,
        numberOfTickets: config.numberOfTickets,
        numberOfComments: config.numberOfComments,
        startDate: config.startDate,
        endDate: config.endDate
      },
      data: {
        users: data.users.map(u => ({
          id: u._id,
          email: u.email,
          name: u.name,
          role: u.role
        })),
        projects: data.projects.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description,
          owner: p.owner
        })),
        tickets: data.tickets.map(t => ({
          id: t._id,
          title: t.title,
          priority: t.priority,
          status: t.status,
          project: t.project
        })),
        comments: data.comments.map(c => ({
          id: c._id,
          content: c.content,
          author: c.author,
          ticket: c.ticket
        }))
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=seed-data-${Date.now()}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Seed data export error:', error);
    res.status(500).json({
      error: 'Failed to export seed data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Clear seed data (development only)
router.post('/clear', adminAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Cannot clear data in production environment'
      });
    }

    const result = await SeedDataService.clearSeedData();

    res.json({
      success: true,
      message: 'Seed data cleared successfully',
      deletedUsers: result.users,
      deletedProjects: result.projects,
      deletedTickets: result.tickets,
      deletedComments: result.comments
    });
  } catch (error) {
    console.error('Seed data clear error:', error);
    res.status(500).json({
      error: 'Failed to clear seed data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get seed data statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await SeedDataService.getSeedDataStats();

    res.json({
      totalUsers: stats.users,
      totalProjects: stats.projects,
      totalTickets: stats.tickets,
      totalComments: stats.comments,
      ticketsByPriority: stats.ticketsByPriority,
      ticketsByStatus: stats.ticketsByStatus
    });
  } catch (error) {
    console.error('Seed data stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch seed data statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
