const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Category = require('../models/Category');
const Event = require('../models/Event');
const User = require('../models/User');

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await Category.deleteMany({});
    await Event.deleteMany({});
    await User.deleteMany({});

    const categories = await Category.insertMany([
      { name: 'music', description: 'Music and live performances' },
      { name: 'tech', description: 'Technology events and meetups' },
      { name: 'sports', description: 'Sports and fitness events' },
    ]);

    const adminPassword = await bcrypt.hash('admin123', 10);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@eventpulse.com',
      password: adminPassword,
      role: 'admin',
    });

    const categoryMap = categories.reduce((acc, category) => {
      acc[category.name] = category._id;
      return acc;
    }, {});

    await Event.insertMany([
      {
        title: 'Cairo Music Night',
        description: 'An exciting evening of live music, DJ sets, and food trucks in Cairo.',
        category: categoryMap.music,
        date: new Date('2026-09-15T19:00:00.000Z'),
        city: 'Cairo',
        location: 'Nile Corniche',
        capacity: 250,
        price: 150,
      },
      {
        title: 'AI Startup Summit',
        description: 'Meet founders, investors, and engineers exploring the next wave of AI innovation.',
        category: categoryMap.tech,
        date: new Date('2026-10-10T10:00:00.000Z'),
        city: 'Alexandria',
        location: 'Innovation Hub',
        capacity: 120,
        price: 200,
      },
      {
        title: 'Giza Marathon',
        description: 'A city-wide endurance race with beginner and advanced tracks.',
        category: categoryMap.sports,
        date: new Date('2026-11-05T08:00:00.000Z'),
        city: 'Giza',
        location: 'Pyramids Road',
        capacity: 500,
        price: 100,
      },
    ]);

    console.log('Seed data created successfully');
    console.log('Admin user created with email: admin@eventpulse.com');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedData();
