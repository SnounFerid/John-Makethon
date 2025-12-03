const User = require('../../models/User');
const Project = require('../../models/Project');
const Ticket = require('../../models/Ticket');
const Comment = require('../../models/Comment');
const Attachment = require('../../models/Attachment');

class SeedDataService {
  /**
   * Generate realistic seed data for testing
   */
  static async generateSeedData(config) {
    const {
      numberOfUsers = 50,
      numberOfProjects = 30,
      numberOfTickets = 100,
      numberOfComments = 200,
      startDate = '2024-01-01',
      endDate = '2024-12-31',
      includeAttachments = true,
      includeNotifications = true,
      distribution = { low: 30, medium: 50, high: 20 },
      testMode = false
    } = config;

    try {
      // Generate users
      const users = await this.generateUsers(numberOfUsers, testMode);

      // Generate projects
      const projects = await this.generateProjects(numberOfProjects, users, testMode);

      // Generate tickets with priority distribution
      const tickets = await this.generateTickets(
        numberOfTickets,
        projects,
        users,
        distribution,
        new Date(startDate),
        new Date(endDate),
        testMode
      );

      // Generate comments
      const comments = await this.generateComments(numberOfComments, tickets, users, testMode);

      // Generate attachments if requested
      let attachments = [];
      if (includeAttachments) {
        attachments = await this.generateAttachments(tickets, testMode);
      }

      return {
        users,
        projects,
        tickets,
        comments,
        attachments
      };
    } catch (error) {
      throw new Error(`Failed to generate seed data: ${error.message}`);
    }
  }

  /**
   * Generate random users
   */
  static async generateUsers(count, testMode) {
    const firstNames = testMode
      ? ['Test', 'Demo', 'Sample']
      : ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Maria'];

    const lastNames = testMode
      ? ['User', 'Account', 'Admin']
      : ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

    const roles = ['user', 'manager', 'admin'];
    const users = [];

    // Use fixed seed for test mode
    const seed = testMode ? 12345 : Date.now();

    for (let i = 0; i < count; i++) {
      const firstNameIdx = (seed + i * 7) % firstNames.length;
      const lastNameIdx = (seed + i * 11) % lastNames.length;
      const roleIdx = (seed + i * 13) % roles.length;

      const user = new User({
        email: `${firstNames[firstNameIdx].toLowerCase()}.${lastNames[lastNameIdx].toLowerCase()}${i}@example.com`,
        name: `${firstNames[firstNameIdx]} ${lastNames[lastNameIdx]}`,
        password: 'hashedPassword123',
        role: roles[roleIdx],
        isActive: true,
        createdAt: this.randomDate(new Date('2024-01-01'), new Date('2024-06-01'), seed + i)
      });

      users.push(await user.save());
    }

    return users;
  }

  /**
   * Generate random projects
   */
  static async generateProjects(count, users, testMode) {
    const projectNames = testMode
      ? ['Test Project', 'Demo Project', 'Sample Project']
      : [
          'Website Redesign',
          'Mobile App',
          'API Development',
          'Data Migration',
          'Analytics Platform',
          'CRM System',
          'E-Commerce Platform',
          'Chat Application',
          'Dashboard',
          'Content Management'
        ];

    const projects = [];
    const seed = testMode ? 12345 : Date.now();

    for (let i = 0; i < count; i++) {
      const nameIdx = (seed + i * 3) % projectNames.length;
      const ownerIdx = (seed + i * 5) % users.length;

      const project = new Project({
        name: `${projectNames[nameIdx]} ${testMode ? '' : i + 1}`,
        description: `Project description for ${projectNames[nameIdx]}`,
        owner: users[ownerIdx]._id,
        members: this.getRandomArray(users, Math.ceil(Math.random() * 5) + 1),
        status: 'active',
        createdAt: this.randomDate(new Date('2024-01-01'), new Date('2024-06-01'), seed + i)
      });

      projects.push(await project.save());
    }

    return projects;
  }

  /**
   * Generate random tickets with priority distribution
   */
  static async generateTickets(
    count,
    projects,
    users,
    distribution,
    startDate,
    endDate,
    testMode
  ) {
    const titles = testMode
      ? ['Task 1', 'Task 2', 'Task 3', 'Bug 1', 'Bug 2', 'Feature 1']
      : [
          'Fix login issue',
          'Implement user authentication',
          'Optimize database queries',
          'Add dark mode',
          'Create user dashboard',
          'Fix responsive design',
          'Add email notifications',
          'Implement payment gateway',
          'Create API documentation',
          'Fix memory leak'
        ];

    const tickets = [];
    const seed = testMode ? 12345 : Date.now();

    // Calculate distribution
    const lowCount = Math.floor(count * (distribution.low / 100));
    const mediumCount = Math.floor(count * (distribution.medium / 100));
    const highCount = count - lowCount - mediumCount;

    // Create tickets with distribution
    let ticketIndex = 0;

    // Low priority tickets
    for (let i = 0; i < lowCount; i++) {
      const ticket = this.createTicket(
        titles,
        projects,
        users,
        'low',
        ticketIndex++,
        startDate,
        endDate,
        seed
      );
      tickets.push(await ticket.save());
    }

    // Medium priority tickets
    for (let i = 0; i < mediumCount; i++) {
      const ticket = this.createTicket(
        titles,
        projects,
        users,
        'medium',
        ticketIndex++,
        startDate,
        endDate,
        seed
      );
      tickets.push(await ticket.save());
    }

    // High priority tickets
    for (let i = 0; i < highCount; i++) {
      const ticket = this.createTicket(
        titles,
        projects,
        users,
        'high',
        ticketIndex++,
        startDate,
        endDate,
        seed
      );
      tickets.push(await ticket.save());
    }

    return tickets;
  }

  /**
   * Create a single ticket
   */
  static createTicket(titles, projects, users, priority, index, startDate, endDate, seed) {
    const titleIdx = (seed + index * 7) % titles.length;
    const projectIdx = (seed + index * 11) % projects.length;
    const assigneeIdx = (seed + index * 13) % users.length;

    const statuses = ['open', 'in-progress', 'review', 'closed'];
    const statusIdx = (seed + index * 17) % statuses.length;

    return new Ticket({
      title: `${titles[titleIdx]} ${index}`,
      description: `This is a ${priority} priority ticket requiring attention.`,
      project: projects[projectIdx]._id,
      assignee: users[assigneeIdx]._id,
      priority,
      status: statuses[statusIdx],
      createdAt: this.randomDate(startDate, endDate, seed + index),
      updatedAt: this.randomDate(startDate, endDate, seed + index + 1000)
    });
  }

  /**
   * Generate random comments
   */
  static async generateComments(count, tickets, users, testMode) {
    const comments = [];
    const commentTexts = testMode
      ? ['Looks good', 'Need changes', 'Approved']
      : [
          'This looks great! Ready to merge.',
          'I have some concerns about this approach.',
          'Can you add more documentation?',
          'This needs to be reviewed again.',
          'Approved, no changes needed.',
          'Good implementation, minor issues found.',
          'Performance could be improved here.',
          'Please refactor this code.',
          'Excellent work on this feature!',
          'This requires additional testing.'
        ];

    const seed = testMode ? 12345 : Date.now();

    for (let i = 0; i < count; i++) {
      const ticketIdx = (seed + i * 3) % tickets.length;
      const authorIdx = (seed + i * 5) % users.length;
      const textIdx = (seed + i * 7) % commentTexts.length;

      const comment = new Comment({
        content: commentTexts[textIdx],
        ticket: tickets[ticketIdx]._id,
        author: users[authorIdx]._id,
        createdAt: this.randomDate(new Date('2024-01-01'), new Date('2024-12-31'), seed + i)
      });

      comments.push(await comment.save());
    }

    return comments;
  }

  /**
   * Generate random attachments
   */
  static async generateAttachments(tickets, testMode) {
    const attachments = [];
    const fileNames = testMode
      ? ['file1.pdf', 'image1.png']
      : ['screenshot.png', 'document.pdf', 'design.jpg', 'data.xlsx', 'report.docx'];

    const seed = testMode ? 12345 : Date.now();
    const attachmentCount = Math.min(tickets.length / 2, 50);

    for (let i = 0; i < attachmentCount; i++) {
      const ticketIdx = (seed + i * 3) % tickets.length;
      const fileIdx = (seed + i * 5) % fileNames.length;

      const attachment = new Attachment({
        fileName: `${fileNames[fileIdx]}_${i}`,
        filePath: `/uploads/attachments/${i}_${fileNames[fileIdx]}`,
        fileSize: Math.floor(Math.random() * 5000000) + 100000,
        mimeType: this.getMimeType(fileNames[fileIdx]),
        ticket: tickets[ticketIdx]._id,
        uploadedAt: this.randomDate(new Date('2024-01-01'), new Date('2024-12-31'), seed + i)
      });

      attachments.push(await attachment.save());
    }

    return attachments;
  }

  /**
   * Clear seed data (development only)
   */
  static async clearSeedData() {
    try {
      const deletedUsers = await User.deleteMany({});
      const deletedProjects = await Project.deleteMany({});
      const deletedTickets = await Ticket.deleteMany({});
      const deletedComments = await Comment.deleteMany({});
      const deletedAttachments = await Attachment.deleteMany({});

      return {
        users: deletedUsers.deletedCount,
        projects: deletedProjects.deletedCount,
        tickets: deletedTickets.deletedCount,
        comments: deletedComments.deletedCount,
        attachments: deletedAttachments.deletedCount
      };
    } catch (error) {
      throw new Error(`Failed to clear seed data: ${error.message}`);
    }
  }

  /**
   * Get seed data statistics
   */
  static async getSeedDataStats() {
    try {
      const ticketsByPriority = await Ticket.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        }
      ]);

      const ticketsByStatus = await Ticket.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        users: await User.countDocuments(),
        projects: await Project.countDocuments(),
        tickets: await Ticket.countDocuments(),
        comments: await Comment.countDocuments(),
        ticketsByPriority: Object.fromEntries(
          ticketsByPriority.map(item => [item._id, item.count])
        ),
        ticketsByStatus: Object.fromEntries(
          ticketsByStatus.map(item => [item._id, item.count])
        )
      };
    } catch (error) {
      throw new Error(`Failed to fetch stats: ${error.message}`);
    }
  }

  /**
   * Utility: Get random date between start and end
   */
  static randomDate(start, end, seed = 0) {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const random = ((seed * 9301 + 49297) % 233280) / 233280;
    return new Date(startTime + random * (endTime - startTime));
  }

  /**
   * Utility: Get random array subset
   */
  static getRandomArray(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  /**
   * Utility: Get MIME type from filename
   */
  static getMimeType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      csv: 'text/csv'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

module.exports = SeedDataService;
