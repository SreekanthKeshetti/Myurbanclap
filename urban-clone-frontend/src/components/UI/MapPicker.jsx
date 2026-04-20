import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { Button, Spinner } from "react-bootstrap";
import { FiCrosshair, FiMapPin } from "react-icons/fi";

// --- HELPER TO CONTROL MAP EVENTS ---
const MapHandler = ({ onMoveEnd, onMapReady }) => {
  const map = useMap();

  // 1. Send the map instance back to parent as soon as it loads
  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  // 2. Listen for drag events
  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onMoveEnd(center.lat, center.lng);
    },
  });

  return null;
};

// --- UPDATE 1: Accept 'setCoordinates' prop ---
const MapPicker = ({ setAddress, setCoordinates }) => {
  const [loading, setLoading] = useState(false);
  const [manualAddress, setManualAddress] = useState("");
  const [mapInstance, setMapInstance] = useState(null); // Store the map object

  // Default: Hyderabad Center
  const defaultPosition = { lat: 17.385, lng: 78.4867 };

  // --- REVERSE GEOCODING ---
  const fetchAddress = async (lat, lng) => {
    setLoading(true);

    // --- UPDATE 2: Send Coordinates back to Parent ---
    // MongoDB requires [Longitude, Latitude] order for GeoJSON
    if (setCoordinates) {
      setCoordinates([lng, lat]);
    }
    // -----------------------------------------------

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      if (data && data.display_name) {
        // Clean up address (keep it short)
        const shortAddress = data.display_name.split(",").slice(0, 5).join(",");
        setAddress(shortAddress);
        setManualAddress(shortAddress);
      }
    } catch (error) {
      console.error("Error fetching address", error);
    }
    setLoading(false);
  };

  // --- LOCATE ME FUNCTION ---
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        // 1. Fly the map to the new location
        if (mapInstance) {
          mapInstance.flyTo([latitude, longitude], 16, {
            duration: 1.5, // Smooth animation speed
          });
        }

        // 2. Fetch the address for these coordinates
        fetchAddress(latitude, longitude);
      },
      (err) => {
        setLoading(false);
        // Error handling
        if (err.code === 1) {
          alert("Please allow location access in your browser settings.");
        } else {
          alert("Could not retrieve location.");
        }
      },
      { enableHighAccuracy: true }, // Request best possible GPS
    );
  };

  return (
    <div className="map-container border rounded-4 overflow-hidden shadow-sm bg-white position-relative">
      {/* MAP VIEWPORT */}
      <div style={{ height: "320px", width: "100%", position: "relative" }}>
        {/* CENTER FIXED PIN (Uber Style) */}
        <div
          className="position-absolute top-50 start-50 translate-middle pointer-events-none"
          style={{ zIndex: 1000, marginTop: "-18px", pointerEvents: "none" }}
        >
          <div className="text-center">
            <img
              src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
              alt="Pin"
              width="40"
              className="drop-shadow-lg"
            />
            <div
              style={{
                width: "10px",
                height: "4px",
                background: "rgba(0,0,0,0.3)",
                borderRadius: "50%",
                margin: "0 auto",
              }}
            ></div>
          </div>
        </div>

        {/* LOCATE BUTTON */}
        <Button
          variant="light"
          size="sm"
          className="position-absolute bottom-0 end-0 m-3 shadow-sm fw-bold border"
          onClick={handleLocateMe}
          style={{ zIndex: 900 }}
        >
          <FiCrosshair className="me-1" /> Locate Me
        </Button>

        <MapContainer
          center={defaultPosition}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
        >
          {/* CARTO TILES (Clean Look) */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          {/* HANDLER TO CAPTURE MAP INSTANCE */}
          <MapHandler onMoveEnd={fetchAddress} onMapReady={setMapInstance} />
        </MapContainer>
      </div>

      {/* ADDRESS PREVIEW */}
      <div className="p-3 bg-light border-top">
        <div className="d-flex align-items-center">
          <div className="bg-white p-2 rounded-circle shadow-sm me-3 text-danger">
            {loading ? <Spinner animation="grow" size="sm" /> : <FiMapPin />}
          </div>
          <div className="flex-grow-1" style={{ lineHeight: "1.2" }}>
            <small
              className="text-muted text-uppercase fw-bold"
              style={{ fontSize: "10px" }}
            >
              Selected Location
            </small>
            <div
              className="fw-bold text-dark text-truncate"
              style={{ maxWidth: "280px" }}
            >
              {loading
                ? "Fetching location..."
                : manualAddress || "Drag map to select location"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPicker;
