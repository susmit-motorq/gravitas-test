# Todo Application

A full-stack todo application with comprehensive logging, testing, and CI/CD pipeline.

## Features

- **Frontend**: Modern, responsive web interface built with HTML, CSS, and JavaScript
- **Backend**: RESTful API built with Node.js and Express
- **Data Storage**: File-based storage using JSON
- **Comprehensive Logging**: Detailed request/response logging with unique request IDs
- **Testing**: Complete test suite with Jest and Supertest
- **CI/CD**: GitHub Actions workflow for automated testing on PRs

## Project Structure

```
todo-app/
├── backend/
│   ├── __tests__/
│   │   └── api.test.js          # Comprehensive API tests
│   ├── app.js                   # Express application logic
│   ├── server.js                # Server entry point
│   ├── data.json                # JSON data storage
│   └── package.json             # Dependencies and scripts
├── frontend/
│   ├── index.html               # Main HTML file
│   ├── style.css                # Styling
│   └── script.js                # Frontend logic
└── README.md                    # This file
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/todos` - Get all todos
- `POST /api/todos` - Create a new todo
- `PUT /api/todos/:id` - Update a todo
- `DELETE /api/todos/:id` - Delete a todo

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd todo-app/backend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```bash
   cd todo-app/backend
   npm start
   ```

2. Open the frontend:
   - Open `todo-app/frontend/index.html` in your browser
   - Or serve it via a web server

The backend will run on `http://localhost:3000` and the frontend will connect to it automatically.

## Testing

### Running Tests

```bash
cd todo-app/backend

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The test suite includes:
- **23 comprehensive tests** covering all API endpoints
- **Unit tests** for individual endpoints
- **Integration tests** for complete CRUD workflows
- **Error handling tests** for edge cases
- **Validation tests** for input sanitization

Current test coverage:
- **All API endpoints** are thoroughly tested
- **CRUD operations** are fully covered
- **Error scenarios** are tested
- **Data persistence** is verified

## Logging

The application includes comprehensive logging that captures:

- **Request Details**: Method, URL, headers, body, IP address
- **Response Details**: Status code, headers, response body
- **Performance Metrics**: Request duration
- **Unique Request IDs**: For tracking requests through the system
- **Operation Logging**: Detailed logs for each CRUD operation

Logging is automatically disabled during testing to keep test output clean.

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/test.yml`) that:

- **Runs on**: Pull requests and pushes to main/master branches
- **Tests multiple Node.js versions**: 18.x and 20.x
- **Runs comprehensive tests**: Unit tests, integration tests, and coverage
- **Security checks**: npm audit for vulnerabilities
- **Integration testing**: Live API endpoint testing

### Workflow Jobs

1. **Test Job**: Runs Jest tests with coverage reporting
2. **Lint Job**: Runs security audits and dependency checks
3. **Integration Job**: Starts the server and tests live endpoints

## Development

### Adding New Tests

Tests are located in `backend/__tests__/api.test.js`. The test suite uses:
- **Jest** as the testing framework
- **Supertest** for HTTP endpoint testing
- **File system mocking** for isolated testing

### Code Structure

- **app.js**: Contains the Express application logic, separated for testability
- **server.js**: Entry point that starts the server
- **Logging**: Conditional logging that respects the NODE_ENV environment variable

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Create a pull request

The CI/CD pipeline will automatically run tests on your pull request.

## License

MIT License
