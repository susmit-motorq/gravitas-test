const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const createApp = require('../app');

// Set test environment
process.env.NODE_ENV = 'test';

const app = createApp();
const TEST_DATA_FILE = path.join(__dirname, '..', 'data.json');

describe('Todo API', () => {
  // Clean up before and after each test
  beforeEach(async () => {
    // Reset data.json to empty array before each test
    await fs.writeFile(TEST_DATA_FILE, JSON.stringify([], null, 2));
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify([], null, 2));
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'Todo API is running'
      });
    });
  });

  describe('GET /api/todos', () => {
    it('should return empty array when no todos exist', async () => {
      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return existing todos', async () => {
      // Setup: Add a todo to the file
      const testTodos = [
        {
          id: 'test-id-1',
          text: 'Test todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z'
        }
      ];
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(testTodos, null, 2));

      const response = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(response.body).toEqual(testTodos);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const todoData = { text: 'New test todo' };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body).toMatchObject({
        text: 'New test todo',
        completed: false
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      // Verify it was saved to file
      const fileContent = await fs.readFile(TEST_DATA_FILE, 'utf8');
      const todos = JSON.parse(fileContent);
      expect(todos).toHaveLength(1);
      expect(todos[0]).toMatchObject({
        text: 'New test todo',
        completed: false
      });
    });

    it('should trim whitespace from todo text', async () => {
      const todoData = { text: '  Trimmed todo  ' };

      const response = await request(app)
        .post('/api/todos')
        .send(todoData)
        .expect(201);

      expect(response.body.text).toBe('Trimmed todo');
    });

    it('should return 400 when text is missing', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Todo text is required'
      });
    });

    it('should return 400 when text is empty string', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Todo text is required'
      });
    });

    it('should return 400 when text is only whitespace', async () => {
      const response = await request(app)
        .post('/api/todos')
        .send({ text: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Todo text is required'
      });
    });
  });

  describe('PUT /api/todos/:id', () => {
    let testTodo;

    beforeEach(async () => {
      // Setup: Create a test todo
      testTodo = {
        id: 'test-id-1',
        text: 'Original todo',
        completed: false,
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify([testTodo], null, 2));
    });

    it('should update todo text', async () => {
      const updateData = { text: 'Updated todo text' };

      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTodo.id,
        text: 'Updated todo text',
        completed: false,
        createdAt: testTodo.createdAt
      });
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should update todo completion status', async () => {
      const updateData = { completed: true };

      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTodo.id,
        text: testTodo.text,
        completed: true,
        createdAt: testTodo.createdAt
      });
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should update both text and completion status', async () => {
      const updateData = { text: 'Updated text', completed: true };

      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        id: testTodo.id,
        text: 'Updated text',
        completed: true,
        createdAt: testTodo.createdAt
      });
      expect(response.body.updatedAt).toBeDefined();
    });

    it('should trim whitespace from updated text', async () => {
      const updateData = { text: '  Trimmed updated text  ' };

      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send(updateData)
        .expect(200);

      expect(response.body.text).toBe('Trimmed updated text');
    });

    it('should return 404 when todo not found', async () => {
      const response = await request(app)
        .put('/api/todos/nonexistent-id')
        .send({ text: 'Updated text' })
        .expect(404);

      expect(response.body).toEqual({
        error: 'Todo not found'
      });
    });

    it('should return 400 when text is empty string', async () => {
      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send({ text: '' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Todo text cannot be empty'
      });
    });

    it('should return 400 when text is only whitespace', async () => {
      const response = await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send({ text: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Todo text cannot be empty'
      });
    });

    it('should persist changes to file', async () => {
      const updateData = { text: 'Persisted update', completed: true };

      await request(app)
        .put(`/api/todos/${testTodo.id}`)
        .send(updateData)
        .expect(200);

      // Verify changes were saved to file
      const fileContent = await fs.readFile(TEST_DATA_FILE, 'utf8');
      const todos = JSON.parse(fileContent);
      expect(todos).toHaveLength(1);
      expect(todos[0]).toMatchObject({
        id: testTodo.id,
        text: 'Persisted update',
        completed: true
      });
    });
  });

  describe('DELETE /api/todos/:id', () => {
    let testTodos;

    beforeEach(async () => {
      // Setup: Create test todos
      testTodos = [
        {
          id: 'test-id-1',
          text: 'First todo',
          completed: false,
          createdAt: '2023-01-01T00:00:00.000Z'
        },
        {
          id: 'test-id-2',
          text: 'Second todo',
          completed: true,
          createdAt: '2023-01-02T00:00:00.000Z'
        }
      ];
      await fs.writeFile(TEST_DATA_FILE, JSON.stringify(testTodos, null, 2));
    });

    it('should delete existing todo', async () => {
      const response = await request(app)
        .delete(`/api/todos/${testTodos[0].id}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Todo deleted successfully',
        todo: testTodos[0]
      });

      // Verify it was removed from file
      const fileContent = await fs.readFile(TEST_DATA_FILE, 'utf8');
      const remainingTodos = JSON.parse(fileContent);
      expect(remainingTodos).toHaveLength(1);
      expect(remainingTodos[0]).toEqual(testTodos[1]);
    });

    it('should return 404 when todo not found', async () => {
      const response = await request(app)
        .delete('/api/todos/nonexistent-id')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Todo not found'
      });

      // Verify no todos were deleted
      const fileContent = await fs.readFile(TEST_DATA_FILE, 'utf8');
      const todos = JSON.parse(fileContent);
      expect(todos).toHaveLength(2);
    });

    it('should delete correct todo when multiple exist', async () => {
      await request(app)
        .delete(`/api/todos/${testTodos[1].id}`)
        .expect(200);

      // Verify only the correct todo was deleted
      const fileContent = await fs.readFile(TEST_DATA_FILE, 'utf8');
      const remainingTodos = JSON.parse(fileContent);
      expect(remainingTodos).toHaveLength(1);
      expect(remainingTodos[0]).toEqual(testTodos[0]);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid JSON in request body', async () => {
      const response = await request(app)
        .post('/api/todos')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express automatically handles malformed JSON
      expect(response.body).toBeDefined();
    });

    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/api/todos')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('Integration tests', () => {
    it('should handle complete CRUD workflow', async () => {
      // Create a todo
      const createResponse = await request(app)
        .post('/api/todos')
        .send({ text: 'Integration test todo' })
        .expect(201);

      const todoId = createResponse.body.id;

      // Read all todos
      let getResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0].text).toBe('Integration test todo');

      // Update the todo
      const updateResponse = await request(app)
        .put(`/api/todos/${todoId}`)
        .send({ text: 'Updated integration test', completed: true })
        .expect(200);

      expect(updateResponse.body.text).toBe('Updated integration test');
      expect(updateResponse.body.completed).toBe(true);

      // Verify update
      getResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(getResponse.body[0].text).toBe('Updated integration test');
      expect(getResponse.body[0].completed).toBe(true);

      // Delete the todo
      await request(app)
        .delete(`/api/todos/${todoId}`)
        .expect(200);

      // Verify deletion
      getResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(getResponse.body).toHaveLength(0);
    });

    it('should handle multiple todos correctly', async () => {
      // Create multiple todos
      const todo1 = await request(app)
        .post('/api/todos')
        .send({ text: 'First todo' })
        .expect(201);

      const todo2 = await request(app)
        .post('/api/todos')
        .send({ text: 'Second todo' })
        .expect(201);

      const todo3 = await request(app)
        .post('/api/todos')
        .send({ text: 'Third todo' })
        .expect(201);

      // Get all todos
      const getResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(getResponse.body).toHaveLength(3);

      // Update middle todo
      await request(app)
        .put(`/api/todos/${todo2.body.id}`)
        .send({ completed: true })
        .expect(200);

      // Delete first todo
      await request(app)
        .delete(`/api/todos/${todo1.body.id}`)
        .expect(200);

      // Verify final state
      const finalResponse = await request(app)
        .get('/api/todos')
        .expect(200);

      expect(finalResponse.body).toHaveLength(2);
      expect(finalResponse.body.find(t => t.id === todo2.body.id).completed).toBe(true);
      expect(finalResponse.body.find(t => t.id === todo3.body.id).completed).toBe(false);
    });
  });
});
