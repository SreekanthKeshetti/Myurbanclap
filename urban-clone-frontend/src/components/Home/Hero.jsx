import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Spinner, ListGroup } from "react-bootstrap";
import { FiSearch, FiMapPin, FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Hero = () => {
  const navigate = useNavigate();

  // --- Search States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  // --- 🌟 RESTORED: Typewriter Effect State ---
  const [placeholder, setPlaceholder] = useState("Search for 'AC Repair'...");

  useEffect(() => {
    const options = [
      "Search for 'Cleaning'...",
      "Search for 'Salon'...",
      "Search for 'Plumber'...",
      "Search for 'Painting'...",
      "Search for 'AC Repair'...",
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % options.length;
      setPlaceholder(options[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  // --------------------------------------------

  // Debounced Search API Call
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setShowDropdown(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await axios.get(`/api/services?keyword=${searchTerm}`);
        setResults(data);
        setShowDropdown(true);
      } catch (error) {
        console.error(error);
      }
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate("/services", {
        state: { keyword: searchTerm, selectedCategory: "All" },
      });
    }
  };

  return (
    <section
      className="bg-white"
      style={{ paddingTop: "140px", paddingBottom: "60px" }}
    >
      <Container>
        <Row className="align-items-center justify-content-between">
          {/* LEFT CONTENT */}
          <Col lg={5} className="mb-5 mb-lg-0 pe-lg-4">
            <h1
              className="fw-bold text-dark mb-3"
              style={{
                fontSize: "3.5rem",
                lineHeight: "1.1",
                letterSpacing: "-1px",
              }}
            >
              Home Services at Your Doorstep
            </h1>
            <p className="text-muted mb-4" style={{ fontSize: "1.1rem" }}>
              Get trusted and expert professionals for all your home service
              needs
            </p>

            {/* Embedded Search Box with Dropdown */}
            <div className="position-relative" ref={searchContainerRef}>
              <form
                onSubmit={handleSearchSubmit}
                className="search-box-embedded mb-4"
              >
                <FiSearch className="text-muted ms-3" size={20} />
                <input
                  type="text"
                  placeholder={placeholder} // 🌟 Active Typewriter
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => {
                    if (results.length > 0) setShowDropdown(true);
                  }}
                />
                {isSearching ? (
                  <button type="button" disabled style={{ opacity: 0.8 }}>
                    <Spinner size="sm" animation="border" />
                  </button>
                ) : (
                  <button type="submit">Search</button>
                )}
              </form>

              {/* Search Dropdown Results */}
              {showDropdown && (
                <div
                  className="position-absolute w-100 bg-white rounded-3 shadow-lg border mt-1 overflow-hidden"
                  style={{
                    zIndex: 1000,
                    maxHeight: "300px",
                    overflowY: "auto",
                    top: "100%",
                  }}
                >
                  <ListGroup variant="flush">
                    {results.length > 0 ? (
                      results.map((service) => (
                        <ListGroup.Item
                          key={service._id}
                          action
                          onClick={() => navigate(`/services/${service._id}`)}
                          className="d-flex align-items-center p-3 border-0 border-bottom"
                        >
                          <img
                            src={service.image}
                            alt={service.name}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "8px",
                              objectFit: "cover",
                              marginRight: "15px",
                            }}
                          />
                          <div>
                            <h6
                              className="mb-0 fw-bold text-dark"
                              style={{ fontSize: "14px" }}
                            >
                              {service.name}
                            </h6>
                            <small className="text-muted">
                              ₹{service.price}
                            </small>
                          </div>
                        </ListGroup.Item>
                      ))
                    ) : (
                      <div className="p-3 text-center text-muted small">
                        No services found for "{searchTerm}"
                      </div>
                    )}
                  </ListGroup>
                </div>
              )}
            </div>

            {/* Trust Metrics */}
            <div className="d-flex align-items-center gap-4 mt-2">
              <div className="d-flex align-items-center">
                <span
                  className="fw-bold fs-4 me-2"
                  style={{ color: "var(--accent-color)" }}
                >
                  4.8
                </span>
                <small className="text-muted fw-bold">Service Rating</small>
              </div>
              <div className="d-flex align-items-center">
                <span
                  className="fw-bold fs-4 me-2"
                  style={{ color: "var(--accent-color)" }}
                >
                  12M+
                </span>
                <small className="text-muted fw-bold">Happy Customers</small>
              </div>
            </div>
          </Col>

          {/* RIGHT IMAGE */}
          <Col lg={6} className="position-relative">
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop"
              alt="Cleaning Professional"
              style={{
                width: "100%",
                height: "450px",
                objectFit: "cover",
                borderRadius: "20px",
              }}
            />
            {/* Floating Badge */}
            <div
              className="position-absolute bg-white p-3 rounded-3 shadow-lg"
              style={{
                bottom: "30px",
                left: "-20px",
                border: "1px solid #f1f5f9",
              }}
            >
              <h6 className="fw-bold mb-1 text-dark">
                50,000+ Verified Professionals
              </h6>
              <small className="text-muted">
                Background checked and trained experts
              </small>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Hero;
