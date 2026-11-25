import React, { useState, useEffect } from 'react';
import ComplaintForm from '../components/ComplaintForm';
import MapView from '../components/MapView';
import { supabase } from '../supabaseClient';
import { IoMegaphoneOutline, IoListOutline } from 'react-icons/io5';

const CitizenPortal = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Supabase se complaints load karne ka function
  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComplaints(data || []);
    } catch (err) {
      console.error("Error fetching complaints:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Hero Header */}
      <div style={{ background: 'linear-gradient(135deg, #6200ee, #03dac6)', color: '#fff', padding: '40px 20px', borderRadius: '12px', textAlign: 'center', marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <IoMegaphoneOutline /> CivicPulse AI
        </h1>
        <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.9 }}>
          AI-Powered Smart Civic Management. Report issues instantly with just a photo & GPS.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px', margin: '0 auto' }}>
        
        {/* Main Map & Form Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px', alignItems: 'start' }}>
          
          {/* Left: Input Form */}
          <ComplaintForm onComplaintAdded={fetchComplaints} />

          {/* Right: Map View */}
          <MapView complaints={complaints} />

        </div>

        {/* Bottom List: Live Complaint Timeline */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', marginTop: '20px' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IoListOutline /> Live Complaint Feed ({complaints.length})
          </h3>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading live reports...</p>
          ) : complaints.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666' }}>No complaints filed yet. Be the first to report!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {complaints.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '8px', background: '#fafafa', flexWrap: 'wrap' }}>
                  
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }} 
                    />
                  )}

                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#6200ee' }}>{item.title}</h4>
                      <span style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: item.status === 'Open' ? '#e8f5e9' : '#fff3e0', color: item.status === 'Open' ? '#2e7d32' : '#e65100', fontWeight: 'bold' }}>
                        {item.status}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#555' }}>{item.description}</p>
                    
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#888', flexWrap: 'wrap' }}>
                      <span>📂 <strong>Dept:</strong> {item.department}</span>
                      <span>🚨 <strong>Severity:</strong> <strong style={{ color: item.severity === 'Critical' ? 'red' : '#e65100' }}>{item.severity}</strong></span>
                      <span>📍 <strong>GPS:</strong> {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default CitizenPortal;
