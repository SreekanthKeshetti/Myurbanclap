/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";
import { FiSun, FiMoon, FiSunrise, FiAlertCircle } from "react-icons/fi";
import axios from "axios";

const TimeSlotPicker = ({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  serviceId, // <--- New Prop needed
}) => {
  const [dates, setDates] = useState([]);
  const [fullSlots, setFullSlots] = useState([]); // Slots that are booked out
  const [loading, setLoading] = useState(false);

  // 1. Generate Next 3 Days
  useEffect(() => {
    const nextDays = [];
    const today = new Date();

    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      nextDays.push({
        fullDate: d.toISOString().split("T")[0],
        dayName:
          i === 0
            ? "Today"
            : i === 1
              ? "Tomorrow"
              : d.toLocaleDateString("en-US", { weekday: "short" }),
        dateNum: d.getDate(),
      });
    }
    setDates(nextDays);
    if (!selectedDate) setSelectedDate(nextDays[0].fullDate);
  }, []);

  // 2. Fetch Availability when Date or Service changes
  useEffect(() => {
    if (selectedDate && serviceId) {
      checkSlots();
    }
  }, [selectedDate, serviceId]);

  const checkSlots = async () => {
    setLoading(true);
    try {
      // No Auth needed if route is public, otherwise add headers
      const { data } = await axios.post("/api/bookings/check-availability", {
        date: selectedDate,
        serviceId: serviceId,
      });
      setFullSlots(data.fullSlots || []);
    } catch (error) {
      console.error("Availability Check Failed");
    }
    setLoading(false);
  };

  // Time Slots Data
  const slots = {
    morning: ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
    afternoon: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM"],
    evening: ["04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM"],
  };

  return (
    <div className="mb-4">
      {/* DATE TABS */}
      <div className="d-flex gap-2 mb-4 overflow-auto pb-2">
        {dates.map((d) => (
          <div
            key={d.fullDate}
            onClick={() => setSelectedDate(d.fullDate)}
            className={`text-center p-2 rounded-3 cursor-pointer border ${selectedDate === d.fullDate ? "bg-dark text-white border-dark" : "bg-white text-muted"}`}
            style={{ minWidth: "90px", cursor: "pointer", transition: "0.2s" }}
          >
            <small
              className="d-block fw-bold"
              style={{ fontSize: "10px", textTransform: "uppercase" }}
            >
              {d.dayName}
            </small>
            <span className="fw-bold fs-5">{d.dateNum}</span>
          </div>
        ))}
      </div>

      {/* TIME SLOTS */}
      {selectedDate && (
        <div className="bg-light p-3 rounded-4 position-relative">
          {loading && (
            <div
              className="position-absolute w-100 h-100 top-0 start-0 bg-light bg-opacity-75 d-flex align-items-center justify-content-center"
              style={{ zIndex: 5 }}
            >
              <Spinner size="sm" animation="border" />
            </div>
          )}

          {/* Morning */}
          <div className="mb-3">
            <h6 className="small fw-bold text-muted mb-2">
              <FiSunrise className="me-1" /> MORNING
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {slots.morning.map((time) => (
                <TimeBtn
                  key={time}
                  time={time}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  isFull={fullSlots.includes(time)}
                />
              ))}
            </div>
          </div>

          {/* Afternoon */}
          <div className="mb-3">
            <h6 className="small fw-bold text-muted mb-2">
              <FiSun className="me-1" /> AFTERNOON
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {slots.afternoon.map((time) => (
                <TimeBtn
                  key={time}
                  time={time}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  isFull={fullSlots.includes(time)}
                />
              ))}
            </div>
          </div>

          {/* Evening */}
          <div>
            <h6 className="small fw-bold text-muted mb-2">
              <FiMoon className="me-1" /> EVENING
            </h6>
            <div className="d-flex flex-wrap gap-2">
              {slots.evening.map((time) => (
                <TimeBtn
                  key={time}
                  time={time}
                  selected={selectedTime}
                  onSelect={setSelectedTime}
                  isFull={fullSlots.includes(time)}
                />
              ))}
            </div>
          </div>

          {fullSlots.length > 0 && (
            <div className="mt-3 small text-danger">
              <FiAlertCircle className="me-1" /> Some slots are fully booked.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Updated Button to handle 'disabled' state
const TimeBtn = ({ time, selected, onSelect, isFull }) => (
  <Button
    variant={selected === time ? "dark" : "white"}
    disabled={isFull}
    className={`rounded-pill px-3 py-1 small fw-bold ${selected !== time ? "border text-muted bg-white" : ""} ${isFull ? "text-decoration-line-through opacity-50" : ""}`}
    style={{ fontSize: "12px" }}
    onClick={() => !isFull && onSelect(time)}
  >
    {time}
  </Button>
);

export default TimeSlotPicker;
