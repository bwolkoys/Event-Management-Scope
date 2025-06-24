import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const eventAPI = {
  createEvent: (eventData) => api.post('/events', eventData),
  getEvents: () => api.get('/events'),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

export const teamsAPI = {
  getTeams: () => api.get('/teams'),
};

export const usersAPI = {
  getUsers: () => api.get('/users'),
};

export default api;