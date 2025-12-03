# Seed Data Generator API Documentation

## Base URL
```
/api/admin/seed-data
```

## Authentication
All endpoints require admin authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Generate Seed Data

**POST** `/api/admin/seed-data/generate`

Generate realistic test data and save it to the database.

#### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "numberOfUsers": 50,
  "numberOfProjects": 30,
  "numberOfTickets": 100,
  "numberOfComments": 200,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "includeAttachments": true,
  "includeNotifications": true,
  "lowTickets": 30,
  "mediumTickets": 50,
  "highTickets": 20,
  "testMode": false
}
```

**Parameters:**

| Parameter | Type | Required | Description | Min/Max |
|-----------|------|----------|-------------|---------|
| numberOfUsers | number | Yes | Number of users to generate | 1-1000 |
| numberOfProjects | number | Yes | Number of projects to generate | 1-500 |
| numberOfTickets | number | Yes | Number of tickets to generate | 1-5000 |
| numberOfComments | number | Yes | Number of comments to generate | 0-10000 |
| startDate | string (YYYY-MM-DD) | Yes | Date range start | ISO 8601 format |
| endDate | string (YYYY-MM-DD) | Yes | Date range end | ISO 8601 format |
| includeAttachments | boolean | No | Generate attachments (default: true) | - |
| includeNotifications | boolean | No | Generate notifications (default: true) | - |
| lowTickets | number | Yes | Percentage of low priority tickets | 0-100 |
| mediumTickets | number | Yes | Percentage of medium priority tickets | 0-100 |
| highTickets | number | Yes | Percentage of high priority tickets | 0-100 |
| testMode | boolean | No | Use deterministic generation (default: false) | - |

**Validation Rules:**
- `lowTickets + mediumTickets + highTickets` must equal 100
- `startDate` must be before `endDate`
- All numeric values must be positive

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Seed data generated successfully",
  "usersCreated": 50,
  "projectsCreated": 30,
  "ticketsCreated": 100,
  "commentsCreated": 200,
  "attachmentsCreated": 15
}
```

**Error (400 Bad Request):**
```json
{
  "error": "Ticket distribution must total 100%",
  "currentTotal": 120
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Failed to generate seed data",
  "details": "Database connection failed"
}
```

#### Examples

**cURL:**
```bash
curl -X POST http://localhost:5000/api/admin/seed-data/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "numberOfUsers": 10,
    "numberOfProjects": 5,
    "numberOfTickets": 20,
    "numberOfComments": 50,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "lowTickets": 40,
    "mediumTickets": 40,
    "highTickets": 20
  }'
```

**JavaScript/Fetch:**
```javascript
const generateSeedData = async (config) => {
  const response = await fetch('/api/admin/seed-data/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    throw new Error('Failed to generate seed data');
  }

  return response.json();
};

// Usage
const result = await generateSeedData({
  numberOfUsers: 50,
  numberOfProjects: 30,
  numberOfTickets: 100,
  numberOfComments: 200,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  lowTickets: 30,
  mediumTickets: 50,
  highTickets: 20
});

console.log(`Generated ${result.usersCreated} users`);
```

**Python:**
```python
import requests
import json

def generate_seed_data(config, token):
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    response = requests.post(
        'http://localhost:5000/api/admin/seed-data/generate',
        headers=headers,
        json=config
    )
    
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Error: {response.json()['error']}")

# Usage
config = {
    'numberOfUsers': 50,
    'numberOfProjects': 30,
    'numberOfTickets': 100,
    'numberOfComments': 200,
    'startDate': '2024-01-01',
    'endDate': '2024-12-31',
    'lowTickets': 30,
    'mediumTickets': 50,
    'highTickets': 20
}

result = generate_seed_data(config, token)
print(f"Generated {result['usersCreated']} users")
```

---

### 2. Export Seed Data

**POST** `/api/admin/seed-data/export`

Generate and export seed data as a JSON file.

#### Request

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "numberOfUsers": 50,
  "numberOfProjects": 30,
  "numberOfTickets": 100,
  "numberOfComments": 200,
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}
```

#### Response

**Success (200 OK):**
Returns a JSON file with exported data
```
Content-Type: application/json
Content-Disposition: attachment; filename=seed-data-1704067200000.json
```

**File Content Structure:**
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "config": {
    "numberOfUsers": 50,
    "numberOfProjects": 30,
    "numberOfTickets": 100,
    "numberOfComments": 200,
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "data": {
    "users": [
      {
        "id": "507f1f77bcf86cd799439011",
        "email": "john.smith@example.com",
        "name": "John Smith",
        "role": "user"
      }
    ],
    "projects": [...],
    "tickets": [...],
    "comments": [...]
  }
}
```

#### Examples

**Browser Download:**
```javascript
const downloadSeedData = async (config, token) => {
  const response = await fetch('/api/admin/seed-data/export', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(config)
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `seed-data-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
```

**cURL with file output:**
```bash
curl -X POST http://localhost:5000/api/admin/seed-data/export \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{...}' \
  -o seed-data.json
```

---

### 3. Get Seed Data Statistics

**GET** `/api/admin/seed-data/stats`

Retrieve statistics about current seed data in the database.

#### Request

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Success (200 OK):**
```json
{
  "totalUsers": 50,
  "totalProjects": 30,
  "totalTickets": 100,
  "totalComments": 200,
  "ticketsByPriority": {
    "low": 30,
    "medium": 50,
    "high": 20
  },
  "ticketsByStatus": {
    "open": 40,
    "in-progress": 35,
    "review": 15,
    "closed": 10
  }
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Failed to fetch seed data statistics",
  "details": "Database connection failed"
}
```

#### Examples

**JavaScript/Fetch:**
```javascript
const getStats = async (token) => {
  const response = await fetch('/api/admin/seed-data/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Usage
const stats = await getStats(token);
console.log(`Total tickets: ${stats.totalTickets}`);
console.log(`By priority:`, stats.ticketsByPriority);
```

**cURL:**
```bash
curl -X GET http://localhost:5000/api/admin/seed-data/stats \
  -H "Authorization: Bearer <token>"
```

---

### 4. Clear Seed Data

**POST** `/api/admin/seed-data/clear`

Delete all seed data from the database. **Only available in development environment.**

#### Request

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

#### Response

**Success (200 OK):**
```json
{
  "success": true,
  "message": "Seed data cleared successfully",
  "deletedUsers": 50,
  "deletedProjects": 30,
  "deletedTickets": 100,
  "deletedComments": 200
}
```

**Error (403 Forbidden) - Production:**
```json
{
  "error": "Cannot clear data in production environment"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "Failed to clear seed data",
  "details": "Database deletion failed"
}
```

#### Examples

**JavaScript/Fetch:**
```javascript
const clearSeedData = async (token) => {
  const response = await fetch('/api/admin/seed-data/clear', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  return response.json();
};

// Usage
if (process.env.NODE_ENV === 'development') {
  const result = await clearSeedData(token);
  console.log(`Deleted ${result.deletedUsers} users`);
}
```

**cURL:**
```bash
curl -X POST http://localhost:5000/api/admin/seed-data/clear \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

### Common Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| 400 | Distribution must total 100% | Invalid priority percentages | Adjust low/medium/high to sum to 100 |
| 400 | Invalid date range | End date before start date | Ensure startDate < endDate |
| 403 | Cannot clear data in production | Attempted clear in production | Use in development only |
| 401 | Unauthorized | Missing or invalid token | Provide valid Bearer token |
| 403 | Forbidden | User is not admin | Login as admin user |
| 500 | Failed to generate seed data | Database error | Check MongoDB connection |

### Error Response Format

All errors follow this format:
```json
{
  "error": "Error message",
  "details": "Optional technical details (development only)"
}
```

---

## Rate Limiting

Recommended rate limits:
- Generate: 10 requests per minute per user
- Export: 20 requests per minute per user
- Stats: 60 requests per minute per user
- Clear: 1 request per minute per user

---

## Data Specifications

### Generated Data Characteristics

**Users:**
- Unique email addresses
- Random roles (user, manager, admin)
- Active status
- Random creation dates within specified range

**Projects:**
- Unique names
- Random owners from generated users
- Random team members (1-5 per project)
- Active status

**Tickets:**
- Unique titles
- Random projects and assignees
- Priority distribution as specified
- Random statuses (open, in-progress, review, closed)
- Creation dates spread across date range

**Comments:**
- Random content from predefined templates
- Associated with random tickets
- Random authors from generated users
- Creation dates within date range

**Attachments:**
- Random file names and types
- Realistic MIME types
- Associated with random tickets
- Realistic file sizes (100KB - 5MB)

---

## Best Practices

### 1. Use Test Mode for Consistency
```javascript
// For integration tests
const config = {
  numberOfUsers: 10,
  numberOfProjects: 5,
  numberOfTickets: 20,
  numberOfComments: 50,
  testMode: true  // Ensures consistent results
};
```

### 2. Start Small
```javascript
// Begin with small dataset
const config = {
  numberOfUsers: 10,
  numberOfProjects: 5,
  numberOfTickets: 20,
  numberOfComments: 50
};
```

### 3. Always Validate Distribution
```javascript
const total = lowTickets + mediumTickets + highTickets;
if (total !== 100) {
  throw new Error(`Distribution totals ${total}%, expected 100%`);
}
```

### 4. Clear Before New Generation
```javascript
// In development only
if (process.env.NODE_ENV === 'development') {
  await fetch('/api/admin/seed-data/clear', { method: 'POST' });
  await generateNewSeedData(config);
}
```

### 5. Monitor Response Times
```javascript
const start = Date.now();
const result = await generateSeedData(config);
console.log(`Generation took ${Date.now() - start}ms`);
```

---

## Webhooks (Optional Future Feature)

Proposed webhook events for future implementation:
- `seed:data:generated` - Sent when data generation completes
- `seed:data:cleared` - Sent when data is cleared
- `seed:export:ready` - Sent when export is ready

---

## Changelog

### Version 1.0.0
- Initial release
- Basic CRUD operations
- Priority distribution support
- Test mode for reproducible data
- Export functionality
