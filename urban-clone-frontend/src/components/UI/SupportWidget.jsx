import React, { useState, useEffect, useRef, useContext } from "react";
import { Card, Form, Button, Spinner, Badge, ListGroup } from "react-bootstrap";
import {
  FiMessageCircle,
  FiX,
  FiSend,
  FiChevronLeft,
  FiPlus,
  FiClock,
  FiCheckCircle,
} from "react-icons/fi";
import axios from "axios";
import AuthContext from "../../context/AuthContext";
import io from "socket.io-client";

const socket = io.connect(import.meta.env.VITE_API_URL);

const SupportWidget = () => {
  const { user } = useContext(AuthContext);

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState("list"); // 'list' or 'chat'
  const [tickets, setTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef(null);

  // Stop here if Admin or logged out

  // 1. Load Ticket History when widget opens in 'list' view
  useEffect(() => {
    const loadTickets = async () => {
      if (!user || user.role === "admin") return null;
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get("/api/support/my-tickets", config);
        setTickets(data);
      } catch (error) {
        console.error("Failed to load tickets:", error);
      }
      setLoading(false);
    };

    if (isOpen && view === "list") {
      loadTickets();
    }
  }, [isOpen, view, user]);

  // 2. Load Messages when a specific ticket is clicked
  useEffect(() => {
    const loadMessages = async () => {
      setLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get(
          `/api/support/${activeTicket._id}/messages`,
          config,
        );
        setMessages(data);
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
      setLoading(false);
    };

    if (activeTicket && view === "chat") {
      loadMessages();

      // Join Socket Room for this ticket
      socket.emit("join_support_ticket", activeTicket._id);
    }
  }, [activeTicket, view, user]);

  // 3. Socket Listener for Live Messages
  useEffect(() => {
    if (activeTicket && view === "chat") {
      const messageHandler = (newMsg) => {
        setMessages((prev) => [...prev, newMsg]);
      };
      socket.on("receive_support_message", messageHandler);
      return () => socket.off("receive_support_message", messageHandler);
    }
  }, [activeTicket, view]);

  // 4. Auto-Scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, view]);

  // --- HANDLERS ---

  const handleCreateNewTicket = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Create new ticket on backend
      const { data: newTicket } = await axios.post(
        "/api/support/create",
        {
          subject: "Help request",
        },
        config,
      );

      // Open it immediately
      setActiveTicket(newTicket);
      setView("chat");
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeTicket || !user) return;

    const newMsg = {
      ticketId: activeTicket._id,
      senderId: user._id,
      text: inputText,
      isAdmin: false,
    };

    socket.emit("send_support_message", newMsg);
    setInputText("");
  };

  const handleBackToList = () => {
    setView("list");
    setActiveTicket(null);
  };

  // --- UI RENDER ---

  return (
    <div
      style={{ position: "fixed", bottom: "30px", right: "30px", zIndex: 9999 }}
    >
      {/* THE FLOATING BUTTON */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-circle shadow-lg d-flex align-items-center justify-content-center btn-primary-custom"
          style={{ width: "60px", height: "60px", border: "none" }}
        >
          <FiMessageCircle size={28} />
        </Button>
      )}

      {/* THE WIDGET WINDOW */}
      {isOpen && (
        <Card
          className="shadow-lg border-0 rounded-4 overflow-hidden"
          style={{
            width: "350px",
            height: "550px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* HEADER */}
          <div className="bg-dark text-white p-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              {view === "chat" && (
                <Button
                  variant="link"
                  className="text-white p-0 me-2"
                  onClick={handleBackToList}
                >
                  <FiChevronLeft size={24} />
                </Button>
              )}
              <div>
                <h6 className="mb-0 fw-bold">Support Center 🎧</h6>
                <small className="text-white-50" style={{ fontSize: "10px" }}>
                  {view === "list"
                    ? "Your ticket history"
                    : `Ticket #${activeTicket?._id.slice(-6)}`}
                </small>
              </div>
            </div>
            <Button
              variant="link"
              className="text-white p-0"
              onClick={() => setIsOpen(false)}
            >
              <FiX size={24} />
            </Button>
          </div>

          {/* ================= SCREEN 1: TICKET LIST ================= */}
          {view === "list" && (
            <div
              className="bg-light d-flex flex-column"
              style={{ flexGrow: 1 }}
            >
              <div className="p-3 bg-white border-bottom text-center">
                <Button
                  variant="outline-dark"
                  className="w-100 rounded-pill fw-bold small py-2 d-flex align-items-center justify-content-center"
                  onClick={handleCreateNewTicket}
                >
                  <FiPlus className="me-1" /> Start New Conversation
                </Button>
              </div>

              <div className="overflow-auto p-2 flex-grow-1">
                {loading ? (
                  <div className="text-center mt-5">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center mt-5 text-muted small">
                    <FiMessageCircle size={30} className="mb-2 opacity-50" />
                    <p>
                      No past conversations.
                      <br />
                      Need help? Start a new one!
                    </p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {tickets.map((t) => (
                      <ListGroup.Item
                        key={t._id}
                        action
                        onClick={() => {
                          setActiveTicket(t);
                          setView("chat");
                        }}
                        className="border-0 mb-2 rounded-3 shadow-sm d-flex justify-content-between align-items-center p-3"
                      >
                        <div>
                          <span className="fw-bold d-block text-dark small">
                            {t.subject}
                          </span>
                          <small
                            className="text-muted"
                            style={{ fontSize: "10px" }}
                          >
                            {new Date(t.updatedAt).toLocaleDateString()}
                          </small>
                        </div>
                        <Badge
                          bg={t.status === "resolved" ? "success" : "warning"}
                          className="d-flex align-items-center gap-1"
                          style={{ fontSize: "9px" }}
                        >
                          {t.status === "resolved" ? (
                            <FiCheckCircle />
                          ) : (
                            <FiClock />
                          )}
                          {t.status}
                        </Badge>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </div>
          )}

          {/* ================= SCREEN 2: ACTIVE CHAT ================= */}
          {view === "chat" && (
            <>
              <div
                className="p-3 bg-light"
                style={{ flexGrow: 1, overflowY: "auto" }}
              >
                {loading ? (
                  <div className="text-center mt-5">
                    <Spinner animation="border" size="sm" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center mt-5 text-muted small">
                    <FiMessageCircle size={30} className="mb-2 opacity-50" />
                    <p>
                      An agent will join shortly. Please describe your issue.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = !msg.isAdmin;
                    return (
                      <div
                        key={idx}
                        className={`d-flex mb-3 ${isMe ? "justify-content-end" : "justify-content-start"}`}
                      >
                        <div
                          className={`p-2 px-3 rounded-3 shadow-sm ${isMe ? "bg-primary text-white" : "bg-white border text-dark"}`}
                          style={{
                            maxWidth: "80%",
                            fontSize: "14px",
                            borderBottomRightRadius: isMe ? "0" : "",
                            borderBottomLeftRadius: !isMe ? "0" : "",
                          }}
                        >
                          {!isMe && (
                            <div
                              className="fw-bold text-primary mb-1"
                              style={{ fontSize: "10px" }}
                            >
                              Support Team
                            </div>
                          )}
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={scrollRef} />
              </div>

              {/* INPUT AREA */}
              <div className="p-2 bg-white border-top">
                {activeTicket?.status === "resolved" ? (
                  <div className="text-center p-2 text-muted small bg-light rounded-pill">
                    <FiCheckCircle className="me-1 text-success" /> This ticket
                    has been resolved.
                  </div>
                ) : (
                  <Form onSubmit={handleSendMessage} className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder="Type your message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="rounded-pill bg-light border-0 px-3"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      variant="dark"
                      className="rounded-circle p-0 d-flex align-items-center justify-content-center"
                      style={{
                        width: "40px",
                        height: "40px",
                        minWidth: "40px",
                      }}
                      disabled={!inputText.trim() || loading}
                    >
                      <FiSend size={16} />
                    </Button>
                  </Form>
                )}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default SupportWidget;
