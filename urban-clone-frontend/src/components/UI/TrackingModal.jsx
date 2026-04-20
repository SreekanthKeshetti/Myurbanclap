import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import io from "socket.io-client";
import L from "leaflet";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion"; // <--- THE MAGIC
import { FiX, FiNavigation } from "react-icons/fi";

// Fix Leaflet Default Icon Issue
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const socket = io.connect(import.meta.env.VITE_API_URL);

// Helper to center map on new location
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.5 });
  }, [lat, lng, map]);
  return null;
};

const TrackingModal = ({ show, handleClose, bookingId }) => {
  const [position, setPosition] = useState([12.9716, 77.5946]); // Default
  const [status, setStatus] = useState("Waiting for GPS signal...");

  useEffect(() => {
    if (show && bookingId) {
      socket.emit("join_booking", bookingId);

      socket.on("receive_location", (data) => {
        setPosition([data.lat, data.lng]);
        setStatus("Professional is moving...");
      });
    }

    return () => {
      socket.off("receive_location");
    };
  }, [show, bookingId]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="bottom-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            className="bottom-sheet-surface shadow-lg"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()} // Prevent clicking map from closing it
            style={{ height: "80vh" }} // Give the map lots of vertical room
          >
            {/* MOBILE DRAG PILL */}
            <div
              className="d-lg-none d-flex justify-content-center pt-3 pb-1 position-absolute w-100"
              style={{ zIndex: 1000 }}
            >
              <div
                style={{
                  width: "40px",
                  height: "5px",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  borderRadius: "10px",
                }}
              ></div>
            </div>

            {/* HEADER OVERLAY */}
            <div
              className="position-absolute top-0 w-100 p-4 d-flex justify-content-between align-items-start"
              style={{ zIndex: 999, pointerEvents: "none" }}
            >
              <div className="bg-white px-4 py-2 rounded-pill shadow-sm pointer-events-auto d-flex align-items-center gap-2">
                <FiNavigation className="text-primary animate-pulse" />
                <span className="fw-bold text-dark small">{status}</span>
              </div>
              <Button
                variant="light"
                className="rounded-circle shadow-sm pointer-events-auto"
                style={{ width: "40px", height: "40px", padding: 0 }}
                onClick={handleClose}
              >
                <FiX size={20} />
              </Button>
            </div>

            {/* FULL BLEED MAP */}
            <div
              style={{
                height: "100%",
                width: "100%",
                backgroundColor: "#e2e8f0",
              }}
            >
              <MapContainer
                center={position}
                zoom={15}
                zoomControl={false} // Cleaner UI
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution="&copy; CARTO"
                />
                <Marker position={position}>
                  <Popup>Your Professional is here!</Popup>
                </Marker>
                <RecenterMap lat={position[0]} lng={position[1]} />
              </MapContainer>
            </div>

            {/* FOOTER BUTTON */}
            <div
              className="position-absolute bottom-0 w-100 p-3 bg-white"
              style={{ zIndex: 1000 }}
            >
              <Button
                variant="dark"
                className="w-100 py-3 rounded-pill fw-bold shadow-lg"
                onClick={handleClose}
              >
                Close Map
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TrackingModal;
