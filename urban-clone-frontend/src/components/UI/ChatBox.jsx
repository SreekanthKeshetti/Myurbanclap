/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useContext } from "react";
import { Modal, Form, Button, Spinner } from "react-bootstrap";
import { FiSend, FiX } from "react-icons/fi";
import io from "socket.io-client";
import axios from "axios";
import AuthContext from "../../context/AuthContext";

// Connect to Backend Socket
const socket = io.connect(import.meta.env.VITE_API_URL);

const ChatBox = ({ show, handleClose, booking, currentUser }) => {
  const [currentMessage, setCurrentMessage] = useState("");
  const [messageList, setMessageList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auto-scroll to bottom
  const scrollRef = useRef(null);

  useEffect(() => {
    if (show && booking) {
      // 1. Join Room
      socket.emit("join_room", booking._id);

      // 2. Load Old Messages from DB
      fetchHistory();
    }
  }, [show, booking]);

  // 3. Listen for incoming messages
  useEffect(() => {
    const handler = (data) => {
      // Only add if it belongs to this booking
      if (data.bookingId === booking?._id) {
        // Check if we already have it (to prevent dupes from local state updates)
        setMessageList((list) => {
          // Simple check: if last message is same, ignore (optional, but good safety)
          return [...list, data];
        });
      }
    };

    socket.on("receive_message", handler);

    return () => socket.off("receive_message", handler);
  }, [booking]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageList]);

  const fetchHistory = async () => {
    try {
      const { data } = await axios.get(`/api/messages/${booking._id}`);
      // Format DB data to match socket data structure
      const formatted = data.map((m) => ({
        bookingId: m.booking,
        senderId: m.sender._id || m.sender, // Handle populated or unpopulated
        text: m.text,
        senderName: m.sender.name,
        time: m.createdAt,
      }));
      setMessageList(formatted);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (currentMessage !== "") {
      const messageData = {
        bookingId: booking._id,
        senderId: currentUser._id,
        senderName: currentUser.name,
        text: currentMessage,
        time: new Date(Date.now()).toISOString(),
      };

      // Emit to Server
      await socket.emit("send_message", messageData);

      // Clear input
      setCurrentMessage("");
    }
  };

  if (!booking) return null;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="md"
      contentClassName="border-0 rounded-4 overflow-hidden"
    >
      {/* HEADER */}
      <div className="bg-primary p-3 text-white d-flex justify-content-between align-items-center">
        <div>
          <h6 className="mb-0 fw-bold">
            Chat with{" "}
            {currentUser.role === "customer" ? "Provider" : "Customer"}
          </h6>
          <small style={{ fontSize: "11px", opacity: 0.8 }}>
            Booking ID: #{booking._id.slice(-6)}
          </small>
        </div>
        <Button variant="link" className="text-white p-0" onClick={handleClose}>
          <FiX size={24} />
        </Button>
      </div>

      {/* CHAT BODY */}
      <Modal.Body
        className="bg-light"
        style={{
          height: "400px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {loading ? (
          <div className="m-auto text-center">
            <Spinner animation="border" size="sm" />
          </div>
        ) : (
          messageList.map((msg, index) => {
            const isMe = msg.senderId === currentUser._id;
            return (
              <div
                key={index}
                className={`d-flex mb-2 ${isMe ? "justify-content-end" : "justify-content-start"}`}
              >
                <div
                  className={`p-2 px-3 rounded-3 shadow-sm ${isMe ? "bg-primary text-white" : "bg-white text-dark"}`}
                  style={{ maxWidth: "75%", fontSize: "14px" }}
                >
                  <div
                    className="fw-bold"
                    style={{
                      fontSize: "10px",
                      opacity: 0.7,
                      marginBottom: "2px",
                    }}
                  >
                    {isMe ? "You" : msg.senderName || "User"}
                  </div>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </Modal.Body>

      {/* FOOTER INPUT */}
      <div className="p-3 bg-white border-top">
        <Form onSubmit={sendMessage} className="d-flex gap-2">
          <Form.Control
            type="text"
            placeholder="Type a message..."
            value={currentMessage}
            onChange={(event) => setCurrentMessage(event.target.value)}
            className="rounded-pill bg-light border-0 px-3"
          />
          <Button
            type="submit"
            variant="primary"
            className="rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
          >
            <FiSend size={18} />
          </Button>
        </Form>
      </div>
    </Modal>
  );
};

export default ChatBox;
