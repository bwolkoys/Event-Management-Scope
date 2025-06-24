import React, { useState } from 'react';

const GuestSelector = ({ users, selectedGuests, onGuestsChange }) => {
  const [activeTab, setActiveTab] = useState('users');
  const [externalGuestForm, setExternalGuestForm] = useState({
    name: '',
    email: ''
  });

  const handleUserToggle = (user) => {
    const isSelected = selectedGuests.some(guest => 
      guest.type === 'user' && guest.id === user.id
    );

    let updatedGuests;
    if (isSelected) {
      updatedGuests = selectedGuests.filter(guest => 
        !(guest.type === 'user' && guest.id === user.id)
      );
    } else {
      const newGuest = {
        type: 'user',
        id: user.id,
        name: user.name,
        email: user.email
      };
      updatedGuests = [...selectedGuests, newGuest];
    }

    onGuestsChange(updatedGuests);
  };

  const handleExternalGuestAdd = () => {
    if (!externalGuestForm.name.trim() || !externalGuestForm.email.trim()) {
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(externalGuestForm.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const isAlreadyAdded = selectedGuests.some(guest => 
      guest.type === 'external' && guest.email === externalGuestForm.email
    );

    if (isAlreadyAdded) {
      alert('This email is already added');
      return;
    }

    const newGuest = {
      type: 'external',
      id: `external_${Date.now()}`,
      name: externalGuestForm.name.trim(),
      email: externalGuestForm.email.trim()
    };

    onGuestsChange([...selectedGuests, newGuest]);
    setExternalGuestForm({ name: '', email: '' });
  };

  const handleExternalGuestRemove = (guestId) => {
    const updatedGuests = selectedGuests.filter(guest => guest.id !== guestId);
    onGuestsChange(updatedGuests);
  };

  const handleExternalFormChange = (e) => {
    const { name, value } = e.target;
    setExternalGuestForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExternalFormKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExternalGuestAdd();
    }
  };

  const userGuests = selectedGuests.filter(guest => guest.type === 'user');
  const externalGuests = selectedGuests.filter(guest => guest.type === 'external');

  return (
    <div className="guest-section">
      <div className="guest-tabs">
        <button
          type="button"
          className={`guest-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Team Members ({userGuests.length})
        </button>
        <button
          type="button"
          className={`guest-tab ${activeTab === 'external' ? 'active' : ''}`}
          onClick={() => setActiveTab('external')}
        >
          External Guests ({externalGuests.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div>
          <div className="guest-list">
            {users.map(user => {
              const isSelected = selectedGuests.some(guest => 
                guest.type === 'user' && guest.id === user.id
              );
              
              return (
                <div
                  key={user.id}
                  className="guest-item"
                  onClick={() => handleUserToggle(user)}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleUserToggle(user)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="guest-info">
                    <div className="guest-name">{user.name}</div>
                    <div className="guest-email">{user.email}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'external' && (
        <div>
          <div className="external-guest-form">
            <input
              type="text"
              name="name"
              placeholder="Guest name"
              value={externalGuestForm.name}
              onChange={handleExternalFormChange}
              onKeyPress={handleExternalFormKeyPress}
            />
            <input
              type="email"
              name="email"
              placeholder="Guest email"
              value={externalGuestForm.email}
              onChange={handleExternalFormChange}
              onKeyPress={handleExternalFormKeyPress}
            />
            <button
              type="button"
              className="add-guest-button"
              onClick={handleExternalGuestAdd}
              disabled={!externalGuestForm.name.trim() || !externalGuestForm.email.trim()}
            >
              Add
            </button>
          </div>

          {externalGuests.length > 0 && (
            <div className="guest-list">
              {externalGuests.map(guest => (
                <div key={guest.id} className="guest-item">
                  <div className="guest-info">
                    <div className="guest-name">{guest.name}</div>
                    <div className="guest-email">{guest.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExternalGuestRemove(guest.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc3545',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '5px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedGuests.length > 0 && (
        <div className="selected-guests">
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '10px' }}>
            Selected Guests ({selectedGuests.length}):
          </div>
          <div>
            {selectedGuests.map(guest => (
              <span key={guest.id} className="selected-guest-tag">
                {guest.name} ({guest.type})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestSelector;