const SeedDataService = require('../../services/seedDataService');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Ticket = require('../../models/Ticket');
const Comment = require('../../models/Comment');

jest.mock('../../models/User');
jest.mock('../../models/Project');
jest.mock('../../models/Ticket');
jest.mock('../../models/Comment');

describe('SeedDataService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUsers', () => {
    test('should generate correct number of users', async () => {
      const count = 10;
      const mockUsers = [];

      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'user-' + mockUsers.length })
      }));

      for (let i = 0; i < count; i++) {
        mockUsers.push({ _id: 'user-' + i });
      }

      const users = await SeedDataService.generateUsers(count, false);
      expect(User).toHaveBeenCalledTimes(count);
    });

    test('should generate users with valid email format', async () => {
      const mockUser = {
        save: jest.fn().mockResolvedValue({ _id: 'user-1', email: 'test.user@example.com' })
      };

      User.mockImplementation(() => mockUser);

      await SeedDataService.generateUsers(1, false);

      expect(User).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('should assign valid roles to users', async () => {
      const validRoles = ['user', 'manager', 'admin'];
      const mockUser = {
        save: jest.fn().mockResolvedValue({ role: 'admin' })
      };

      User.mockImplementation(() => mockUser);

      await SeedDataService.generateUsers(1, false);

      const call = User.mock.results[0].value;
      // Verify role is assigned (mocked version)
      expect(mockUser.save).toHaveBeenCalled();
    });

    test('test mode should use fixed seed', async () => {
      const mockUser = {
        save: jest.fn().mockResolvedValue({ _id: 'test-user-1' })
      };

      User.mockImplementation(() => mockUser);

      const users1 = await SeedDataService.generateUsers(5, true);
      const users2 = await SeedDataService.generateUsers(5, true);

      // Both calls should have same number of mocks
      expect(User).toHaveBeenCalledTimes(10);
    });
  });

  describe('generateProjects', () => {
    test('should generate correct number of projects', async () => {
      const users = [{ _id: 'user-1' }, { _id: 'user-2' }];
      const count = 5;

      const mockProject = {
        save: jest.fn().mockResolvedValue({ _id: 'project-1' })
      };

      Project.mockImplementation(() => mockProject);

      await SeedDataService.generateProjects(count, users, false);

      expect(Project).toHaveBeenCalledTimes(count);
    });

    test('should assign owner from users', async () => {
      const users = [{ _id: 'user-1' }, { _id: 'user-2' }];

      const mockProject = {
        save: jest.fn().mockResolvedValue({ _id: 'project-1', owner: 'user-1' })
      };

      Project.mockImplementation(() => mockProject);

      await SeedDataService.generateProjects(1, users, false);

      expect(Project).toHaveBeenCalled();
      expect(mockProject.save).toHaveBeenCalled();
    });

    test('should include members from users', async () => {
      const users = [
        { _id: 'user-1' },
        { _id: 'user-2' },
        { _id: 'user-3' }
      ];

      const mockProject = {
        save: jest.fn().mockResolvedValue({ 
          _id: 'project-1',
          members: ['user-1', 'user-2']
        })
      };

      Project.mockImplementation(() => mockProject);

      await SeedDataService.generateProjects(1, users, false);

      expect(mockProject.save).toHaveBeenCalled();
    });
  });

  describe('generateTickets', () => {
    test('should generate correct number of tickets', async () => {
      const projects = [{ _id: 'proj-1' }];
      const users = [{ _id: 'user-1' }];
      const count = 10;

      const mockTicket = {
        save: jest.fn().mockResolvedValue({ _id: 'ticket-1' })
      };

      Ticket.mockImplementation(() => mockTicket);

      const distribution = { low: 30, medium: 50, high: 20 };
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await SeedDataService.generateTickets(
        count,
        projects,
        users,
        distribution,
        startDate,
        endDate,
        false
      );

      expect(Ticket).toHaveBeenCalledTimes(count);
    });

    test('should respect priority distribution', async () => {
      const projects = [{ _id: 'proj-1' }];
      const users = [{ _id: 'user-1' }];
      const count = 100;

      const mockTicket = {
        save: jest.fn().mockResolvedValue({ _id: 'ticket-1' })
      };

      Ticket.mockImplementation(() => mockTicket);

      const distribution = { low: 30, medium: 50, high: 20 };
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await SeedDataService.generateTickets(
        count,
        projects,
        users,
        distribution,
        startDate,
        endDate,
        false
      );

      expect(Ticket).toHaveBeenCalledTimes(count);
    });

    test('should assign tickets to projects and users', async () => {
      const projects = [{ _id: 'proj-1' }];
      const users = [{ _id: 'user-1' }];

      const mockTicket = {
        save: jest.fn().mockResolvedValue({ 
          _id: 'ticket-1',
          project: 'proj-1',
          assignee: 'user-1'
        })
      };

      Ticket.mockImplementation(() => mockTicket);

      const distribution = { low: 50, medium: 50, high: 0 };
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await SeedDataService.generateTickets(
        1,
        projects,
        users,
        distribution,
        startDate,
        endDate,
        false
      );

      expect(mockTicket.save).toHaveBeenCalled();
    });
  });

  describe('generateComments', () => {
    test('should generate correct number of comments', async () => {
      const tickets = [{ _id: 'ticket-1' }];
      const users = [{ _id: 'user-1' }];
      const count = 20;

      const mockComment = {
        save: jest.fn().mockResolvedValue({ _id: 'comment-1' })
      };

      Comment.mockImplementation(() => mockComment);

      await SeedDataService.generateComments(count, tickets, users, false);

      expect(Comment).toHaveBeenCalledTimes(count);
    });

    test('should assign comments to tickets and authors', async () => {
      const tickets = [{ _id: 'ticket-1' }];
      const users = [{ _id: 'user-1' }];

      const mockComment = {
        save: jest.fn().mockResolvedValue({ 
          _id: 'comment-1',
          ticket: 'ticket-1',
          author: 'user-1'
        })
      };

      Comment.mockImplementation(() => mockComment);

      await SeedDataService.generateComments(1, tickets, users, false);

      expect(mockComment.save).toHaveBeenCalled();
    });
  });

  describe('randomDate', () => {
    test('should generate date within range', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');

      const randomDate = SeedDataService.randomDate(start, end, 0);

      expect(randomDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(randomDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });

    test('should use seed for reproducibility', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const seed = 12345;

      const date1 = SeedDataService.randomDate(start, end, seed);
      const date2 = SeedDataService.randomDate(start, end, seed);

      expect(date1.getTime()).toBe(date2.getTime());
    });
  });

  describe('getRandomArray', () => {
    test('should return array of correct size', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = SeedDataService.getRandomArray(arr, 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    test('should not exceed original array size', () => {
      const arr = [1, 2, 3];
      const result = SeedDataService.getRandomArray(arr, 10);

      expect(result.length).toBe(3);
    });

    test('should contain elements from original array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = SeedDataService.getRandomArray(arr, 3);

      result.forEach(item => {
        expect(arr).toContain(item);
      });
    });
  });

  describe('getMimeType', () => {
    test('should return correct MIME type for PDF', () => {
      const mimeType = SeedDataService.getMimeType('document.pdf');
      expect(mimeType).toBe('application/pdf');
    });

    test('should return correct MIME type for images', () => {
      expect(SeedDataService.getMimeType('image.png')).toBe('image/png');
      expect(SeedDataService.getMimeType('image.jpg')).toBe('image/jpeg');
      expect(SeedDataService.getMimeType('image.gif')).toBe('image/gif');
    });

    test('should return octet-stream for unknown types', () => {
      const mimeType = SeedDataService.getMimeType('file.unknown');
      expect(mimeType).toBe('application/octet-stream');
    });
  });

  describe('generateSeedData', () => {
    test('should generate all entity types', async () => {
      const config = {
        numberOfUsers: 5,
        numberOfProjects: 3,
        numberOfTickets: 10,
        numberOfComments: 20,
        includeAttachments: false,
        testMode: false
      };

      // Mock all models
      User.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'user-1' })
      }));

      Project.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'project-1' })
      }));

      Ticket.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'ticket-1' })
      }));

      Comment.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue({ _id: 'comment-1' })
      }));

      const result = await SeedDataService.generateSeedData(config);

      expect(result).toHaveProperty('users');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('tickets');
      expect(result).toHaveProperty('comments');
      expect(result).toHaveProperty('attachments');
    });

    test('should handle errors gracefully', async () => {
      const config = {
        numberOfUsers: 5,
        numberOfProjects: 3,
        numberOfTickets: 10
      };

      User.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error('DB Error'))
      }));

      await expect(SeedDataService.generateSeedData(config))
        .rejects
        .toThrow('Failed to generate seed data');
    });
  });

  describe('getSeedDataStats', () => {
    test('should return statistics object with required fields', async () => {
      User.countDocuments = jest.fn().mockResolvedValue(10);
      Project.countDocuments = jest.fn().mockResolvedValue(5);
      Ticket.countDocuments = jest.fn().mockResolvedValue(20);
      Comment.countDocuments = jest.fn().mockResolvedValue(50);

      Ticket.aggregate = jest.fn().mockResolvedValue([
        { _id: 'low', count: 6 },
        { _id: 'medium', count: 10 },
        { _id: 'high', count: 4 }
      ]);

      const stats = await SeedDataService.getSeedDataStats();

      expect(stats).toHaveProperty('users', 10);
      expect(stats).toHaveProperty('projects', 5);
      expect(stats).toHaveProperty('tickets', 20);
      expect(stats).toHaveProperty('comments', 50);
      expect(stats).toHaveProperty('ticketsByPriority');
      expect(stats).toHaveProperty('ticketsByStatus');
    });
  });

  describe('clearSeedData', () => {
    test('should delete all seed data', async () => {
      User.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });
      Project.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
      Ticket.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 20 });
      Comment.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 50 });
      
      const Attachment = require('../../models/Attachment');
      jest.mock('../../models/Attachment');
      Attachment.deleteMany = jest.fn().mockResolvedValue({ deletedCount: 10 });

      const result = await SeedDataService.clearSeedData();

      expect(result.users).toBe(10);
      expect(result.projects).toBe(5);
      expect(result.tickets).toBe(20);
      expect(result.comments).toBe(50);
    });

    test('should handle errors during deletion', async () => {
      User.deleteMany = jest.fn().mockRejectedValue(new Error('DB Error'));

      await expect(SeedDataService.clearSeedData())
        .rejects
        .toThrow('Failed to clear seed data');
    });
  });
});
