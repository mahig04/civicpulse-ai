import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { IoShieldCheckmarkOutline, IoTimeOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';

const AdminDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Status update function (Open -> In Progress -> Resolved)
  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      alert(`Status updated to ${newStatus}!`);
      fetchComplaints();
    } catch (err) {
      alert("Failed to update status.");
    }
  };

  // Helper: Created date se dynamic SLA deadline time calculate karne ke liye
  const calculateDeadline = (createdAtStr, severity) => {
    const createdDate = new Date(createdAtStr);
    let hoursToAdd = 48; // Low severity default
    if (severity === 'Medium') hoursToAdd = 24;
    if (severity === 'High') hoursToAdd = 12;
    if (severity === 'Critical') hoursToAdd = 2; // Emergency

    createdDate.setHours(createdDate.getHours() + hoursToAdd);
    const now = new Date();
    const diffMs = createdDate - now;

    if (diffMs < 0) return { text: "OVERDUE ⚠️", isOverdue: true };

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return { text: `${diffHours}h ${diffMins}m remaining`, isOverdue: false };
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#333', color: '#fff', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IoShieldCheckmarkOutline style={{ color: '#03dac6' }} /> Municipal Command Center (Admin Dashboard)
        </h2>
        <span style={{ fontSize: '14px', background: '#555', padding: '6px 12px', borderRadius: '20px' }}>
          Official Access Mode
        </span>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center' }}>Loading Admin Console...</p>
      ) : (
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '12px 15px' }}>Issue Detail</th>
                <th style={{ padding: '12px 15px' }}>Department</th>
                <th style={{ padding: '12px 15px' }}>Severity</th>
                <th style={{ padding: '12px 15px' }}>Deadlines (SLA)</th>
                <th style={{ padding: '12px 15px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((item) => {
                const sla = calculateDeadline(item.created_at, item.severity);
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                    {/* Title & Description */}
                    <td style={{ padding: '15px' }}>
                      <strong style={{ display: 'block', color: '#333' }}>{item.title}</strong>
                      <span style={{ fontSize: '12px', color: '#666' }}>{item.description}</span>
                    </td>

                    {/* Auto Department */}
                    <td style={{ padding: '15px', fontSize: '14px', fontWeight: '500' }}>{item.department}</td>

                    {/* Severity Badges */}
                    <td style={{ padding: '15px' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontWeight: 'bold',
                        background: item.severity === 'Critical' ? '#ffcccc' : item.severity === 'High' ? '#ffe0b2' : '#f5f5f5',
                        color: item.severity === 'Critical' ? 'red' : item.severity === 'High' ? '#e65100' : '#555'
                      }}>
                        {item.severity} {item.severity === 'Critical' && '🚨'}
                      </span>
                    </td>

                    {/* Live Deadline Countdown */}
                    <td style={{ padding: '15px', fontSize: '13px' }}>
                      {item.status === 'Resolved' ? (
                        <span style={{ color: 'green', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                          <IoCheckmarkCircleOutline /> Resolved
                        </span>
                      ) : (
                        <span style={{ 
                          color: sla.isOverdue ? 'red' : '#007bff', 
                          fontWeight: sla.isOverdue ? 'bold' : 'normal',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px' 
                        }}>
                          <IoTimeOutline /> {sla.text}
                        </span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                      {item.status !== 'In-Progress' && item.status !== 'Resolved' && (
                        <button 
                          onClick={() => updateStatus(item.id, 'In-Progress')}
                          style={{ background: '#007bff', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          In Progress
                        </button>
                      )}
                      {item.status !== 'Resolved' && (
                        <button 
                          onClick={() => updateStatus(item.id, 'Resolved')}
                          style={{ background: '#28a745', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Resolve
                        </button>
                      )}
                      {item.status === 'Resolved' && (
                        <span style={{ color: '#aaa', fontSize: '12px' }}>No further actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
