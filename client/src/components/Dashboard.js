import React, { useState } from 'react';
import CreateEventModal from './CreateEventModal';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEventCreated = (event) => {
    console.log('Event created:', event);
    setIsModalOpen(false);
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
      </div>

      {isModalOpen && (
        <CreateEventModal
          onClose={handleCloseModal}
          onEventCreated={handleEventCreated}
        />
      )}
    </div>
  );
}

export default Dashboard;