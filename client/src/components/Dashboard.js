import React, { useState, useEffect } from 'react';
import CreateEventModal from './CreateEventModal';
import { eventAPI } from '../services/api';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await eventAPI.getEvents();
      setEvents(response.data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleEventCreated = (event) => {
    console.log('Event created:', event);
    setEvents(prev => [...prev, event]);
    setIsModalOpen(false);
  };

  const handleEventUpdated = (updatedEvent) => {
    console.log('Event updated:', updatedEvent);
    setEvents(prev => prev.map(event => 
      event._id === updatedEvent._id ? updatedEvent : event
    ));
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const handleUpdateEvent = (eventId) => {
    const eventToUpdate = events.find(event => event._id === eventId);
    if (eventToUpdate) {
      setSelectedEvent(eventToUpdate);
      setIsModalOpen(true);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventAPI.deleteEvent(eventId);
        setEvents(prev => prev.filter(event => event._id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="dashboard" style={{ padding: '40px', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            color: '#2c3e50', 
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            Event Management Dashboard
          </h1>
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#6c757d', 
            maxWidth: '600px', 
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Organize and manage your events with ease. Create new events, uopdate events, delete events,
            and stay on top of all your event planning needs.
          </p>
        </header>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '20px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button
            onClick={handleOpenModal}
            style={{
              padding: '15px 30px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            Create New Event
          </button>
          
          <button
            style={{
              padding: '15px 30px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e0a800'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ffc107'}
          >
            Analytics & Reports
          </button>
        </div>

        {/* Events Display Section */}
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            color: '#2c3e50', 
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            Your Events
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                No events created yet. Click "Create New Event" to get started!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gap: '20px',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
            }}>
              {events.map(event => (
                <div key={event._id} style={{
                  backgroundColor: 'white',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #e9ecef'
                }}>
                  <h3 style={{ 
                    margin: '0 0 10px 0', 
                    color: '#2c3e50',
                    fontSize: '1.3rem'
                  }}>
                    {event.title}
                  </h3>
                  <p style={{ 
                    margin: '0 0 15px 0', 
                    color: '#6c757d',
                    lineHeight: '1.4'
                  }}>
                    {event.description}
                  </p>
                  <p style={{ 
                    margin: '0 0 20px 0', 
                    color: '#495057',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                  }}>
                    <strong>Time:</strong> {formatDateTime(event.startDate)}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    gap: '10px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleUpdateEvent(event._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#218838'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#28a745'}
                    >
                      Update
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event._id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateEventModal
          onClose={handleCloseModal}
          onEventCreated={handleEventCreated}
          onEventUpdated={handleEventUpdated}
          selectedEvent={selectedEvent}
        />
      )}
    </div>
  );
}

export default Dashboard;