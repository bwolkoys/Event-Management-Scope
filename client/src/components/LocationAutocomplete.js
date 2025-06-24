import React, { useState, useEffect, useRef } from 'react';

const LocationAutocomplete = ({ onLocationSelect, placeholder = "Search for a location" }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    const loadGoogleMapsScript = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsScript();
  }, []);

  useEffect(() => {
    if (isLoaded && inputRef.current && window.google) {
      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['establishment', 'geocode'],
            fields: ['place_id', 'formatted_address', 'geometry', 'name']
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current.getPlace();
          
          if (place && place.geometry) {
            const locationData = {
              address: place.formatted_address || place.name,
              placeId: place.place_id,
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }
            };
            
            setInputValue(locationData.address);
            onLocationSelect(locationData);
          }
        });
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      }
    }
  }, [isLoaded, onLocationSelect]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    if (!e.target.value) {
      onLocationSelect({
        address: '',
        placeId: '',
        coordinates: { lat: null, lng: null }
      });
    }
  };

  if (!isLoaded && !process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    return (
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="Enter location manually (Google Maps API key not configured)"
          style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          To enable location autocomplete, add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file
        </div>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : "Loading Google Maps..."}
        disabled={!isLoaded}
        style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px' }}
      />
      {!isLoaded && (
        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
          Loading Google Places...
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;