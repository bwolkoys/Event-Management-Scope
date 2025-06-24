const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

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
    required: false
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

    if (!title || !description || !startDate || !endDate || !timezone) {
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

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    if (updateData.recurring && updateData.recurring.endDate) {
      updateData.recurring.endDate = new Date(updateData.recurring.endDate);
    }

    const updatedEvent = await Event.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEvent = await Event.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

app.get('/api/teams', (req, res) => {
  const teams = [
    { id: 'team1', name: 'West Ham United' },
    { id: 'team2', name: 'Arsenal' },
    { id: 'team3', name: 'Brentford' },
    { id: 'team4', name: 'Chelsea' }
  ];
  res.json(teams);
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: 'user1', name: 'Jarrod Bowen', email: 'jarrod@example.com', teamId: 'team1' },
    { id: 'user2', name: 'Michail Antonio', email: 'michail@example.com', teamId: 'team2' },
    { id: 'user3', name: 'Edson Alvarez', email: 'edson@example.com', teamId: 'team3' },
    { id: 'user4', name: 'Maxwel Cornet', email: 'Maxwel@example.com', teamId: 'team4' }
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