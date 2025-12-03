# Seed Data Generator

## Overview

The Seed Data Generator is a comprehensive admin tool that enables developers to quickly generate realistic test data for development, testing, and staging environments. It provides both interactive UI controls and programmatic APIs for flexible data generation.

## Features

### 1. **Interactive Configuration**
- **User Count**: Generate 1-1000 test users
- **Project Count**: Create 1-500 test projects
- **Ticket Count**: Generate 1-5000 test tickets
- **Comment Count**: Create 0-10000 test comments
- **Date Range**: Specify custom date ranges for data creation
- **Options**: Toggle attachments, notifications, and test mode

### 2. **Priority Distribution**
- **Customizable Distribution**: Set low, medium, and high priority ticket percentages
- **Real-time Validation**: Ensures distribution totals 100%
- **Visual Feedback**: Clear indication of current distribution status

### 3. **Quick Presets**
- **Small Dataset**: 10 users, 5 projects, 20 tickets
- **Medium Dataset**: 50 users, 30 projects, 100 tickets
- **Large Dataset**: 200 users, 100 projects, 500 tickets
- **Test Mode**: 3 users, 2 projects, 10 tickets with deterministic data

### 4. **Advanced Features**
- **Test Mode**: Generate deterministic, reproducible data using fixed seeds
- **Attachments**: Optionally generate file attachments for tickets
- **Notifications**: Include notification records in generated data
- **Export**: Download generated data as JSON for analysis or import

### 5. **Management Functions**
- **Clear Data**: Remove all seed data (development only, disabled in production)
- **Statistics**: View current dataset statistics with priority and status breakdown
- **Validation**: Comprehensive input validation and error handling

## Components

### Frontend

#### SeedDataGenerator Component
**Location**: `frontend/src/components/admin/SeedDataGenerator.jsx`

Main React component providing the user interface for seed data generation.

**Key Features**:
- Real-time configuration with sliders and input fields
- Interactive preset buttons
- Priority distribution controls
- Result display with generation statistics
- Error handling and user feedback

**Props**: None (connects to backend via API)

**State Management**:
```javascript
config: {
  numberOfUsers,
  numberOfProjects,
  numberOfTickets,
  numberOfComments,
  startDate,
  endDate,
  includeAttachments,
  includeNotifications,
  testMode
}

distribution: {
  lowTickets,
  mediumTickets,
  highTickets
}
```

**Key Methods**:
- `generateSeedData()`: POST to `/api/admin/seed-data/generate`
- `downloadSeedData()`: POST to `/api/admin/seed-data/export`
- `applyPreset(preset)`: Apply quick preset configurations

#### Styling
**Location**: `frontend/src/styles/admin/SeedDataGenerator.css`

Comprehensive CSS with responsive design:
- Grid layout for configuration panels
- Slider controls with visual feedback
- Result display with statistics
- Accessible form elements
- Mobile-responsive design (breakpoint at 768px)

### Backend

#### Routes
**Location**: `backend/routes/admin/seedDataRoutes.js`

Express router handling all seed data operations:

**Endpoints**:

1. **POST `/api/admin/seed-data/generate`**
   - Generate and save seed data to database
   - Request body: Configuration object
   - Response: Statistics of created entities
   - Auth: Admin only
   - Validation: Distribution must total 100%

2. **POST `/api/admin/seed-data/export`**
   - Generate and export seed data as JSON
   - Request body: Configuration object
   - Response: JSON file download
   - Auth: Admin only
   - Format: Clean, importable structure

3. **POST `/api/admin/seed-data/clear`**
   - Delete all seed data from database
   - Response: Count of deleted entities
   - Auth: Admin only
   - Security: Disabled in production

4. **GET `/api/admin/seed-data/stats`**
   - Retrieve current seed data statistics
   - Response: Counts by priority and status
   - Auth: Admin only
   - Real-time aggregation from database

#### Service
**Location**: `backend/services/seedDataService.js`

Core business logic for seed data generation:

**Class**: `SeedDataService`

**Static Methods**:

1. **generateSeedData(config)**
   - Main generation orchestrator
   - Parameters:
     - `numberOfUsers`: Number of users to create
     - `numberOfProjects`: Number of projects to create
     - `numberOfTickets`: Number of tickets to create
     - `numberOfComments`: Number of comments to create
     - `startDate`: Date range start
     - `endDate`: Date range end
     - `includeAttachments`: Include attachment generation
     - `includeNotifications`: Include notifications
     - `distribution`: Priority distribution percentages
     - `testMode`: Use deterministic generation
   - Returns: Object containing generated entities

2. **generateUsers(count, testMode)**
   - Creates realistic user profiles
   - Test mode uses fixed seed for reproducibility
   - Assigns random roles (user, manager, admin)
   - Returns: Array of User documents

3. **generateProjects(count, users, testMode)**
   - Creates projects with assigned owners and members
   - Associates random team members
   - Returns: Array of Project documents

4. **generateTickets(count, projects, users, distribution, startDate, endDate, testMode)**
   - Generates tickets respecting priority distribution
   - Spreads across date range
   - Assigns to projects and users
   - Returns: Array of Ticket documents

5. **generateComments(count, tickets, users, testMode)**
   - Creates comments for random tickets
   - Assigns to random users
   - Returns: Array of Comment documents

6. **generateAttachments(tickets, testMode)**
   - Creates file attachments for tickets
   - Generates realistic file metadata
   - Returns: Array of Attachment documents

7. **clearSeedData()**
   - Removes all generated data
   - Returns: Count of deleted documents

8. **getSeedDataStats()**
   - Aggregates current database statistics
   - Groups by priority and status
   - Returns: Statistics object

**Utility Methods**:
- `randomDate(start, end, seed)`: Generate random date in range
- `getRandomArray(arr, count)`: Get random subset
- `getMimeType(fileName)`: Resolve file MIME type

## Usage

### UI Usage

1. **Navigate to Admin Panel**
   - Access via admin dashboard

2. **Configure Data**
   - Adjust sliders or input numbers directly
   - Use preset buttons for quick setup

3. **Set Distribution**
   - Adjust priority sliders to desired distribution
   - Ensure total equals 100%

4. **Generate**
   - Click "Generate Seed Data" button
   - Monitor progress
   - View results with statistics

5. **Export (Optional)**
   - Click "Export Data" to download JSON
   - Import into other systems if needed

### API Usage

```bash
# Generate seed data
curl -X POST http://localhost:5000/api/admin/seed-data/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "numberOfUsers": 50,
    "numberOfProjects": 30,
    "numberOfTickets": 100,
    "numberOfComments": 200,
    "lowTickets": 30,
    "mediumTickets": 50,
    "highTickets": 20
  }'

# Export seed data
curl -X POST http://localhost:5000/api/admin/seed-data/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{ ... }' \
  -o seed-data.json

# Get statistics
curl -X GET http://localhost:5000/api/admin/seed-data/stats \
  -H "Authorization: Bearer <token>"

# Clear seed data
curl -X POST http://localhost:5000/api/admin/seed-data/clear \
  -H "Authorization: Bearer <token>"
```

### Test Mode

Test mode provides deterministic, reproducible data generation:

**Benefits**:
- Fixed seed ensures consistent results
- Ideal for integration tests
- Predictable user/project names
- Reproducible ticket assignments

**Usage**:
1. Check "Test Mode" checkbox in UI
2. Or set `testMode: true` in API request
3. Generate data - results will be identical across runs

## Data Models

### Generated Entities

**User**
```javascript
{
  email: string,
  name: string,
  password: string (hashed),
  role: 'user' | 'manager' | 'admin',
  isActive: boolean,
  createdAt: Date
}
```

**Project**
```javascript
{
  name: string,
  description: string,
  owner: ObjectId (User),
  members: [ObjectId] (User array),
  status: 'active' | 'archived',
  createdAt: Date
}
```

**Ticket**
```javascript
{
  title: string,
  description: string,
  project: ObjectId (Project),
  assignee: ObjectId (User),
  priority: 'low' | 'medium' | 'high',
  status: 'open' | 'in-progress' | 'review' | 'closed',
  createdAt: Date,
  updatedAt: Date
}
```

**Comment**
```javascript
{
  content: string,
  ticket: ObjectId (Ticket),
  author: ObjectId (User),
  createdAt: Date
}
```

**Attachment**
```javascript
{
  fileName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  ticket: ObjectId (Ticket),
  uploadedAt: Date
}
```

## Security Considerations

1. **Admin Only**: All endpoints require admin authentication
2. **Production Safety**: Clear endpoint disabled in production
3. **Validation**: Distribution must sum to 100%
4. **Rate Limiting**: Consider adding rate limiting for large generations
5. **Audit Logging**: Log all seed data operations for compliance

## Performance Guidelines

### Recommended Parameters

**Small Dataset** (Testing, CI/CD):
- Users: 10-50
- Projects: 5-20
- Tickets: 20-100
- Comments: 50-200
- Generation time: < 1 second

**Medium Dataset** (Development):
- Users: 50-200
- Projects: 30-100
- Tickets: 100-500
- Comments: 200-1000
- Generation time: 2-5 seconds

**Large Dataset** (Load testing, staging):
- Users: 200-500
- Projects: 100-300
- Tickets: 500-2000
- Comments: 1000-5000
- Generation time: 10-30 seconds

### Database Considerations

- Ensure adequate disk space for data
- Monitor MongoDB memory usage
- Consider backup before large generation
- Run during off-peak hours for production staging

## Testing

### Unit Tests
```bash
# Test seed data service
npm test -- seedDataService.test.js
```

### Integration Tests
```bash
# Test API endpoints
npm test -- seedDataRoutes.test.js
```

### Manual Testing
1. Generate small dataset (10 users, 5 projects)
2. Verify data in MongoDB
3. Check UI displays correct statistics
4. Export and validate JSON format
5. Test clear operation (dev only)

## Troubleshooting

### Issue: Distribution validation error
**Solution**: Ensure low + medium + high = 100%

### Issue: Generation takes too long
**Solution**: Reduce numberOfTickets/Comments or use smaller dataset

### Issue: Clear endpoint not working in production
**Solution**: This is intentional security measure - clear disabled in production

### Issue: Memory issues with very large datasets
**Solution**: Generate in smaller batches or increase available memory

## Future Enhancements

1. **Batch Generation**: Queue large generations
2. **Scheduled Generation**: Generate data on schedule
3. **Data Templates**: Save/load custom configurations
4. **Advanced Analytics**: Real-time generation progress
5. **Custom Data**: User-provided names, descriptions
6. **Data Relationships**: Configure user-project associations
7. **Performance Testing**: Load test dataset sizes
8. **API Documentation**: OpenAPI/Swagger support

## Integration Points

### Admin Dashboard
Include in admin navigation:
```jsx
<Link to="/admin/seed-data">Seed Data Generator</Link>
```

### Backend Server
Register routes:
```javascript
const seedDataRoutes = require('./routes/admin/seedDataRoutes');
app.use('/api/admin/seed-data', seedDataRoutes);
```

### Access Control
Require admin role:
```javascript
// Middleware validates req.user.role === 'admin'
```

## Support

For issues or feature requests:
1. Check troubleshooting section
2. Review test results
3. Check browser console for errors
4. Review server logs for backend errors
5. Contact development team with reproducible steps
