const request = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../../app');
const User = require('../../models/User');
const Category = require('../../models/Category');
const Event = require('../../models/Event');
const generateToken = require('../../utils/generateToken');

let mongoServer;
let adminToken;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: '$2a$10$FhP3pQ0p0rKx4Dme7P4B6e7m3Wmy1c3Qq3Mvsy3zE9zDq0f8VQfVG',
    role: 'admin',
  });

  adminToken = generateToken({ userId: admin._id, role: admin.role });

  const category = await Category.create({ name: 'music', description: 'Music events' });

  await Event.create({
    title: 'Tech Expo',
    description: 'A full day of product demos and workshops.',
    category: category._id,
    date: '2026-09-20T12:00:00.000Z',
    city: 'Cairo',
    location: 'City Center',
    capacity: 50,
    price: 100,
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Events API', () => {
  it('should fetch events with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/events?page=1&limit=10')
      .expect(200);

    expect(res.body.success).to.equal(true);
    expect(res.body).to.have.property('total');
    expect(res.body).to.have.property('page');
    expect(res.body).to.have.property('limit');
    expect(res.body).to.have.property('totalPages');
    expect(res.body.data).to.be.an('array');
  });

  it('should reject event creation for non-admin users', async () => {
    const user = await User.create({
      name: 'Normal User',
      email: 'user@test.com',
      password: '$2a$10$FhP3pQ0p0rKx4Dme7P4B6e7m3Wmy1c3Qq3Mvsy3zE9zDq0f8VQfVG',
      role: 'user',
    });

    const token = generateToken({ userId: user._id, role: user.role });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Launch Event',
        description: 'A new product launch for the public.',
        category: (await Category.findOne({ name: 'music' }))._id.toString(),
        date: '2026-10-01T18:00:00.000Z',
        city: 'Alexandria',
        location: 'Beach Arena',
        capacity: 100,
        price: 200,
      })
      .expect(403);

    expect(res.body.success).to.equal(false);
  });

  it('should allow admin to create a new event', async () => {
    const category = await Category.findOne({ name: 'music' });

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Music Festival',
        description: 'A large outdoor concert with multiple stages.',
        category: category._id.toString(),
        date: '2026-11-15T18:00:00.000Z',
        city: 'Cairo',
        location: 'Open Air Park',
        capacity: 300,
        price: 350,
      })
      .expect(201);

    expect(res.body.success).to.equal(true);
    expect(res.body.data.title).to.equal('Music Festival');
  });
});
