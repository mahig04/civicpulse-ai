import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet default marker icons issue (Vite setup ke liye fixing script)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapView = ({ complaints = [] }) => {
  // Default Map center: Mathura/GLA University area ya India location
  const defaultPosition = [27.6048, 77.5933];

  return (
    <div style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0px 4px 12px rgba(0,0,0,0.15)', background: '#fff', padding: '10px' }}>
      <h3 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
        📍 Live Civic Issue Tracker & Hotspot Map
      </h3>
      
      <div style={{ height: '450px', width: '100%', borderRadius: '8px' }}>
        <MapContainer center={defaultPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
          {/* Free Standard Map Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* 1. Map Markers for complaints */}
          {complaints.map((complaint) => (
            <Marker key={complaint.id} position={[complaint.latitude, complaint.longitude]}>
              <Popup>
                <div style={{ fontSize: '14px', maxWidth: '200px' }}>
                  {complaint.image_url && (
                    <img 
                      src={complaint.image_url} 
                      alt={complaint.title} 
                      style={{ width: '100%', maxHeight: '100px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }} 
                    />
                  )}
                  <h4 style={{ margin: '0 0 5px 0', color: '#6200ee' }}>{complaint.title}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#555' }}>
                    <strong>Category:</strong> {complaint.category} <br/>
                    <strong>Severity:</strong> <span style={{ color: complaint.severity === 'Critical' ? 'red' : 'orange', fontWeight: 'bold' }}>{complaint.severity}</span> <br/>
                    <strong>Department:</strong> {complaint.department}
                  </p>
                  <p style={{ margin: '0', fontSize: '11px', color: '#777' }}>{complaint.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 2. Hotspots / Duplicate Complaints Grouping (High Density Areas) */}
          {/* Jab ek hi area me (>50m radius) multiples open issues ho, to wahan bada red hotspot transparent circle banayenge */}
          {complaints.filter(c => c.severity === 'Critical' || c.severity === 'High').map((complaint) => (
            <Circle
              key={`hotspot-${complaint.id}`}
              center={[complaint.latitude, complaint.longitude]}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.2 }}
              radius={150} // 150 meters coverage for duplicates and high density areas
            />
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
