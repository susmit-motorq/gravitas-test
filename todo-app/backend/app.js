const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

// Logging utility functions
function generateRequestId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function formatTimestamp() {
  return new Date().toISOString();
}

function logRequest(req, requestId, startTime) {
  // Only log in non-test environment
  if (process.env.NODE_ENV !== "test") {
    console.log("\n=== INCOMING REQUEST ===");
    console.log(`Request ID: ${requestId}`);
    console.log(`Timestamp: ${formatTimestamp()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    console.log(`IP: ${req.ip || req.connection.remoteAddress}`);
    console.log(`User-Agent: ${req.get("User-Agent") || "N/A"}`);
    console.log(`Headers:`, JSON.stringify(req.headers, null, 2));

    if (req.body && Object.keys(req.body).length > 0) {
      console.log(`Body:`, JSON.stringify(req.body, null, 2));
    }

    if (req.params && Object.keys(req.params).length > 0) {
      console.log(`Params:`, JSON.stringify(req.params, null, 2));
    }

    if (req.query && Object.keys(req.query).length > 0) {
      console.log(`Query:`, JSON.stringify(req.query, null, 2));
    }
  }
}

function logResponse(res, requestId, startTime, responseBody) {
  // Only log in non-test environment
  if (process.env.NODE_ENV !== "test") {
    const duration = Date.now() - startTime;
    console.log("\n=== OUTGOING RESPONSE ===");
    console.log(`Request ID: ${requestId}`);
    console.log(`Timestamp: ${formatTimestamp()}`);
    console.log(`Status Code: ${res.statusCode}`);
    console.log(`Duration: ${duration}ms`);
    console.log(`Response Headers:`, JSON.stringify(res.getHeaders(), null, 2));

    if (responseBody) {
      console.log(`Response Body:`, JSON.stringify(responseBody, null, 2));
    }
    console.log("========================\n");
  }
}

// Helper function to read todos from file
async function readTodos() {
  try {
    const data = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Error reading todos:", error);
    }
    return [];
  }
}

// Helper function to write todos to file
async function writeTodos(todos) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2));
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.error("Error writing todos:", error);
    }
    throw error;
  }
}

// Generate unique ID
function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function createApp() {
  const app = express();

  // Request logging middleware
  app.use((req, res, next) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Add request ID to request object for use in routes
    req.requestId = requestId;
    req.startTime = startTime;

    // Log incoming request
    logRequest(req, requestId, startTime);

    // Override res.json to capture response body
    const originalJson = res.json;
    res.json = function (body) {
      logResponse(res, requestId, startTime, body);
      return originalJson.call(this, body);
    };

    // Override res.send to capture response body for non-JSON responses
    const originalSend = res.send;
    res.send = function (body) {
      logResponse(res, requestId, startTime, body);
      return originalSend.call(this, body);
    };

    next();
  });

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes

  // GET /api/todos - Fetch all todos
  app.get("/api/todos", async (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${req.requestId}] Processing GET /api/todos - Fetching all todos`
      );
    }
    try {
      const todos = await readTodos();
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Successfully fetched ${todos.length} todos`
        );
      }
      res.json(todos);
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error(`[${req.requestId}] Error fetching todos:`, error);
      }
      res.status(500).json({ error: "Failed to fetch todos" });
    }
  });

  // POST /api/todos - Create new todo
  app.post("/api/todos", async (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${req.requestId}] Processing POST /api/todos - Creating new todo`
      );
      console.log(`[${req.requestId}] Todo text: "${req.body.text}"`);
    }

    try {
      const { text } = req.body;

      if (!text || text.trim() === "") {
        if (process.env.NODE_ENV !== "test") {
          console.log(
            `[${req.requestId}] Validation failed: Todo text is required`
          );
        }
        return res.status(400).json({ error: "Todo text is required" });
      }

      const todos = await readTodos();
      const newTodo = {
        id: generateId(),
        text: text.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      };

      todos.push(newTodo);
      await writeTodos(todos);

      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Successfully created todo with ID: ${newTodo.id}`
        );
      }
      res.status(201).json(newTodo);
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error(`[${req.requestId}] Error creating todo:`, error);
      }
      res.status(500).json({ error: "Failed to create todo" });
    }
  });

  // PUT /api/todos/:id - Update existing todo
  app.put("/api/todos/:id", async (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${req.requestId}] Processing PUT /api/todos/${req.params.id} - Updating todo`
      );
      console.log(
        `[${req.requestId}] Update data:`,
        JSON.stringify(req.body, null, 2)
      );
    }

    try {
      const { id } = req.params;
      const { text, completed } = req.body;

      const todos = await readTodos();
      const todoIndex = todos.findIndex((todo) => todo.id === id);

      if (todoIndex === -1) {
        if (process.env.NODE_ENV !== "test") {
          console.log(`[${req.requestId}] Todo not found with ID: ${id}`);
        }
        return res.status(404).json({ error: "Todo not found" });
      }

      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Found todo at index ${todoIndex}:`,
          JSON.stringify(todos[todoIndex], null, 2)
        );
      }

      // Update todo properties
      if (text !== undefined) {
        if (text.trim() === "") {
          if (process.env.NODE_ENV !== "test") {
            console.log(
              `[${req.requestId}] Validation failed: Todo text cannot be empty`
            );
          }
          return res.status(400).json({ error: "Todo text cannot be empty" });
        }
        if (process.env.NODE_ENV !== "test") {
          console.log(
            `[${req.requestId}] Updating text from "${
              todos[todoIndex].text
            }" to "${text.trim()}"`
          );
        }
        todos[todoIndex].text = text.trim();
      }

      if (completed !== undefined) {
        if (process.env.NODE_ENV !== "test") {
          console.log(
            `[${req.requestId}] Updating completed status from ${todos[todoIndex].completed} to ${completed}`
          );
        }
        todos[todoIndex].completed = completed;
      }

      todos[todoIndex].updatedAt = new Date().toISOString();

      await writeTodos(todos);
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Successfully updated todo with ID: ${id}`
        );
      }
      res.json(todos[todoIndex]);
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error(`[${req.requestId}] Error updating todo:`, error);
      }
      res.status(500).json({ error: "Failed to update todo" });
    }
  });

  // DELETE /api/todos/:id - Delete todo
  app.delete("/api/todos/:id", async (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${req.requestId}] Processing DELETE /api/todos/${req.params.id} - Deleting todo`
      );
    }

    try {
      const { id } = req.params;

      const todos = await readTodos();
      const todoIndex = todos.findIndex((todo) => todo.id === id);

      if (todoIndex === -1) {
        if (process.env.NODE_ENV !== "test") {
          console.log(`[${req.requestId}] Todo not found with ID: ${id}`);
        }
        return res.status(404).json({ error: "Todo not found" });
      }

      const deletedTodo = todos.splice(todoIndex, 1)[0];
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Found todo to delete:`,
          JSON.stringify(deletedTodo, null, 2)
        );
      }

      await writeTodos(todos);

      if (process.env.NODE_ENV !== "test") {
        console.log(
          `[${req.requestId}] Successfully deleted todo with ID: ${id}`
        );
      }
      res.json({ message: "Todo deleted successfully", todo: deletedTodo });
    } catch (error) {
      if (process.env.NODE_ENV !== "test") {
        console.error(`[${req.requestId}] Error deleting todo:`, error);
      }
      res.status(500).json({ error: "Failed to delete todo" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    if (process.env.NODE_ENV !== "test") {
      console.log(
        `[${req.requestId}] Processing GET /api/health - Health check`
      );
      console.log(`[${req.requestId}] Server is healthy and running`);
    }
    res.json({ status: "OK", message: "Todo API is running" });
  });

  return app;
}

module.exports = createApp;
