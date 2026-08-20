## API endpoints
- `GET /health` reports API uptime and MongoDB connection state
- `POST /api/auth/register` registers a user
- `POST /api/auth/login` returns a JWT
- `GET /api/events` lists events with filters, search, sorting, and pagination
- `POST /api/events` creates an event as an admin
- `GET /api/events/:id` gets one event
- `PATCH /api/events/:id` updates an event as an admin
- `DELETE /api/events/:id` deletes an event as an admin
- `POST /api/registrations` registers the authenticated user
- `GET /api/registrations/my` lists the user's registrations
- `DELETE /api/registrations/:id` cancels the user's registration
- `GET /api/messages/:eventId` returns announcement history


```

### Entry points and configuration

- `server.js`: loads environment variables, connects to MongoDB, starts the HTTP server, and attaches Socket.io.
- `app.js`: creates the Express application, registers middleware, mounts API routes, and defines `/health`.
- `api/index.js`: exports the Express app as the Vercel serverless HTTP entry point.
- `config/db.js`: opens the Mongoose connection using `MONGO_URI`.
- `config/socket.js`: configures Socket.io event rooms, attendee access, admin announcements, and disconnect logging.
- `vercel.json`: maps Vercel requests to `api/index.js`.
- `package.json`: defines dependencies and commands such as `npm start`, `npm run seed`, and `npm test`.
- `.env.example`: documents the required environment variables without real credentials.
- `.gitignore`: prevents `node_modules`, `.env`, logs, and test coverage output from being committed.

### Data models

- `models/User.js`: stores users, normalized email addresses, hashed passwords, and `user` or `admin` roles.
- `models/Event.js`: stores event details, dates, location, capacity, pricing, and the ObjectId reference to `Category`.
- `models/Category.js`: stores reusable event categories such as Music, Tech, and Sports.
- `models/Registration.js`: links a user to an event, tracks registration status, and prevents duplicate user/event registrations with a compound index.
- `models/Message.js`: persists event announcements with event, sender, content, and timestamps.

### Controllers and routes

- `controllers/authController.js`: handles registration, password hashing, login, and JWT creation.
- `controllers/eventController.js`: implements event CRUD, filtering, text search, sorting, pagination, and category population.
- `controllers/registrationController.js`: handles event registration, capacity checks, personal registration history, and owner-only cancellation.
- `controllers/messageController.js`: returns chronological announcement history for an event.
- `routes/authRoutes.js`: exposes registration and login endpoints with request validation.
- `routes/eventRoutes.js`: exposes public event reads and admin-protected event writes.
- `routes/registrationRoutes.js`: exposes authenticated registration and cancellation endpoints.
- `routes/messageRoutes.js`: exposes authenticated announcement history.

### Middleware and utilities

- `middleware/authMiddleware.js`: verifies Bearer JWTs, attaches the authenticated user to `req.user`, and enforces roles.
- `middleware/validateRequest.js`: converts `express-validator` failures into a 422 response with field errors.
- `middleware/errorHandler.js`: returns consistent responses for operational and unexpected errors.
- `utils/AppError.js`: represents expected HTTP errors with status codes and optional field errors.
- `utils/asyncHandler.js`: forwards rejected async controller promises to the central error handler.
- `utils/generateToken.js`: signs JWTs containing `userId` and `role`.
- `utils/seed.js`: clears and recreates sample categories, events, and the admin user.

### Tests

- `tests/unit/appError.test.js`: verifies AppError properties and behavior.
- `tests/unit/asyncHandler.test.js`: verifies successful async handlers and rejected promises.
- `tests/integration/eventRoutes.test.js`: tests event pagination, non-admin authorization, and admin event creation using Supertest and an in-memory MongoDB instance.
- `tests/setup.js`: defines test-only environment configuration.

