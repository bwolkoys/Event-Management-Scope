const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  timezone: {
    type: String,
    required: true
  },
  location: {
    address: String,
    placeId: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  team: {
    type: String,
    required: true
  },
  guests: [{
    type: {
      type: String,
      enum: ['user', 'external'],
      required: true
    },
    id: String,
    name: String,
    email: String
  }],
  recurring: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'yearly'],
      default: 'weekly'
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date
  },
  rsvpRequired: {
    type: Boolean,
    default: false
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    reminder: {
      type: String,
      enum: ['none', '15min', '1hour', '1day', '1week'],
      default: '1day'
    }
  },
  privacy: {
    type: String,
    enum: ['public', 'team'],
    default: 'team'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

app.post('/api/events', async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      timezone,
      location,
      team,
      guests,
      recurring,
      rsvpRequired,
      notifications,
      privacy
    } = req.body;

    if (!title || !description || !startDate || !endDate || !timezone || !team) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const event = new Event({
      title,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      timezone,
      location,
      team,
      guests: guests || [],
      recurring: recurring || { enabled: false },
      rsvpRequired: rsvpRequired || false,
      notifications: notifications || { email: true, reminder: '1day' },
      privacy: privacy || 'team'
    });

    const savedEvent = await event.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

app.get('/api/teams', (req, res) => {
  const teams = [
    { id: 'team1', name: 'Development Team' },
    { id: 'team2', name: 'Marketing Team' },
    { id: 'team3', name: 'Sales Team' },
    { id: 'team4', name: 'HR Team' }
  ];
  res.json(teams);
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: 'user1', name: 'John Doe', email: 'john@example.com' },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: 'user3', name: 'Mike Johnson', email: 'mike@example.com' },
    { id: 'user4', name: 'Sarah Wilson', email: 'sarah@example.com' }
  ];
  res.json(users);
});

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    } else {
      console.log('MongoDB URI not provided, running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});