import React, { useState } from 'react';
import { analyzeCivicIssue } from '../utils/geminiHelper';
import { supabase } from '../supabaseClient';
import { IoCloudUploadOutline, IoLocationSharp, IoSparkles } from 'react-icons/io5';

const ComplaintForm = ({ onComplaintAdded }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [gps, setGps] = useState({ latitude: null, longitude: null });
  const [locationStatus, setLocationStatus] = useState("");

  // Form Fields (Gemini inko auto-fill karega)
  const [formData, setFormData] = useState({
    title: "",
    category: "Pothole",
    severity: "Low",
    department: "Roads & Infrastructure",
    description: ""
  });

  // 1. Current GPS Location fetch karne ke liye function
  const fetchLocation = () => {
    setLocationStatus("Locating...");
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLocationStatus("Location captured successfully! 📍");
      },
      (error) => {
        console.error("Error fetching location", error);
        setLocationStatus("Unable to retrieve location. Please allow GPS permission.");
      }
    );
  };

  // 2. Image Select & Gemini Analysis Trigger
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    
    // Auto-fetch location alongside image upload
    fetchLocation();

    // Trigger AI Analysis
    setLoading(true);
    setLocationStatus("AI is analyzing the image details... 🤖✨");
    
    const aiResult = await analyzeCivicIssue(file);
    
    if (aiResult) {
      setFormData({
        title: aiResult.title || "Reported Civic Issue",
        category: aiResult.category || "Others",
        severity: aiResult.severity || "Medium",
        department: aiResult.department || "Public Safety",
        description: aiResult.description || ""
      });
      setLocationStatus("AI Auto-fill complete! Review and submit. 🌟");
    } else {
      setLocationStatus("AI analysis failed. Please enter details manually.");
    }
    setLoading(false);
  };

  // 3. Form Submit to Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !gps.latitude || !gps.longitude) {
      alert("Please upload an image and capture GPS location first.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      // A. Image ko Supabase Storage mein upload karein
      const fileExt = image.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `complaints/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // Public URL fetch karein
      const { data: urlData } = supabase.storage.from('images').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;

      // B. Save details to complaints table in Supabase
      const { data, error } = await supabase
        .from('complaints')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            severity: formData.severity,
            department: formData.department,
            latitude: gps.latitude,
            longitude: gps.longitude,
            image_url: imageUrl,
            status: 'Open'
          }
        ]);

      if (error) throw error;

      alert("Complaint filed successfully! 🎉");
      
      // Reset Form after successful submit
      setImage(null);
      setPreview("");
      setGps({ latitude: null, longitude: null });
      setFormData({
        title: "",
        category: "Pothole",
        severity: "Low",
        department: "Roads & Infrastructure",
        description: ""
      });
      if (onComplaintAdded) onComplaintAdded();

    } catch (err) {
      console.error("Database save failed:", err);
      alert("Error saving complaint. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px', borderRadius: '12px', boxShadow: '0px 4px 10px rgba(0,0,0,0.1)', background: '#fff' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#333' }}>
        <IoSparkles style={{ color: '#6200ee' }} /> Report Civic Issue (AI Smart-Form)
      </h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Upload Box */}
        <div style={{ border: '2px dashed #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
          />
          {preview ? (
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} />
          ) : (
            <div>
              <IoCloudUploadOutline size={40} style={{ color: '#888', marginBottom: '8px' }} />
              <p style={{ margin: 0, color: '#666' }}>Upload Image or Capture from Camera</p>
            </div>
          )}
        </div>

        {/* GPS Location Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            type="button" 
            onClick={fetchLocation} 
            style={{ background: '#007bff', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <IoLocationSharp /> Fetch GPS Location
          </button>
          <span style={{ fontSize: '13px', color: '#555' }}>
            {locationStatus || (gps.latitude ? `Lat: ${gps.latitude.toFixed(4)}, Lng: ${gps.longitude.toFixed(4)}` : "Location not fetched yet")}
          </span>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Issue Title</label>
          <input 
            type="text" 
            value={formData.title} 
            onChange={(e) => setFormData({...formData, title: e.target.value})} 
            placeholder="Loading AI prediction..." 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required 
          />
        </div>

        {/* Category & Severity side-by-side */}
        <div style={{ display: 'flex', gap: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Category</label>
            <select 
              value={formData.category} 
              onChange={(e) => setFormData({...formData, category: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="Pothole">Pothole</option>
              <option value="Streetlight">Streetlight</option>
              <option value="Garbage Pile">Garbage Pile</option>
              <option value="Broken Pipe">Broken Pipe</option>
              <option value="Water Logging">Water Logging</option>
              <option value="Tree Fall">Tree Fall</option>
              <option value="Open Manhole">Open Manhole</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Severity</label>
            <select 
              value={formData.severity} 
              onChange={(e) => setFormData({...formData, severity: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: formData.severity === 'Critical' ? '#ffcccc' : '#fff' }}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical 🚨</option>
            </select>
          </div>
        </div>

        {/* Assigned Department */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Assigned Department (Auto)</label>
          <input 
            type="text" 
            value={formData.department} 
            onChange={(e) => setFormData({...formData, department: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#e9ecef' }}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Description</label>
          <textarea 
            value={formData.description} 
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="AI predicted issue details..." 
            rows="3" 
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            required
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          style={{ background: loading ? '#ccc' : '#6200ee', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? "Processing..." : "Submit Complaint"}
        </button>

      </form>
    </div>
  );
};

export default ComplaintForm;
