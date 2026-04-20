import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Form,
  InputGroup,
  Button,
} from "react-bootstrap";
import { FiSearch, FiFilter, FiXCircle } from "react-icons/fi";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

import ServiceCard from "../components/UI/ServiceCard";
import BookingModal from "../components/UI/BookingModal";
import AuthContext from "../context/AuthContext";

const ServicesPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State for Navigation
  const [activeCategoryId, setActiveCategoryId] = useState(null);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // 1. Initial Data Fetch & Routing State Capture
  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/categories/tree");
        setTree(data);

        // Handle incoming state from Homepage (Category click or Search)
        if (location.state?.keyword) {
          setSearchTerm(location.state.keyword);
        } else if (location.state?.selectedCategoryId) {
          setActiveCategoryId(location.state.selectedCategoryId);
        } else if (data.length > 0) {
          setActiveCategoryId(data[0]._id);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching tree:", error);
        setLoading(false);
      }
    };
    fetchTree();
  }, [location.state]);

  const handleBookClick = (service) => {
    if (!user) {
      toast.error("Please login to book a service", { icon: "🔒" });
      navigate("/login");
      return;
    }
    setSelectedService(service);
    setShowModal(true);
  };

  // 2. 🌟 ADVANCED GLOBAL SEARCH LOGIC 🌟
  // Instead of only searching the active category, we search the ENTIRE tree.
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return null; // Null means we aren't searching

    const results = [];
    const lowerQuery = searchTerm.toLowerCase();

    tree.forEach((cat) => {
      cat.subCategories?.forEach((sub) => {
        sub.services?.forEach((srv) => {
          // Check Name, Description, or Hidden Search Tags
          if (
            srv.name.toLowerCase().includes(lowerQuery) ||
            srv.description?.toLowerCase().includes(lowerQuery) ||
            srv.searchTags?.some((tag) =>
              tag.toLowerCase().includes(lowerQuery),
            )
          ) {
            // Attach parent info for context in the UI
            results.push({
              ...srv,
              categoryName: cat.name,
              subCategoryName: sub.name,
            });
          }
        });
      });
    });
    return results;
  }, [searchTerm, tree]);

  // Get the currently selected category object (for standard viewing)
  const activeCategory =
    tree.find((c) => c._id === activeCategoryId) || tree[0];

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}
      >
        <Spinner animation="border" style={{ color: "var(--accent-color)" }} />
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "90px", // Accommodate the main navbar
        paddingBottom: "80px",
      }}
    >
      {/* 🌟 FIXED Z-INDEX & OVERLAP STICKY HEADER 🌟 */}
      <div
        className="bg-white border-bottom py-3 shadow-sm sticky-top transition-all"
        style={{ top: "76px", zIndex: 1030 }} // 76px sits perfectly under Bootstrap's default navbar
      >
        <Container>
          <Row className="align-items-center justify-content-between">
            <Col lg={4} md={5} className="d-none d-md-block">
              <h3 className="fw-bold mb-0 text-dark">Explore Services</h3>
            </Col>
            <Col lg={6} md={7} xs={12}>
              <InputGroup className="shadow-sm rounded-pill overflow-hidden border bg-light focus-ring-accent">
                <InputGroup.Text className="bg-light border-0 ps-4">
                  <FiSearch className="text-muted" size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search 'AC Repair', 'Cleaning'..."
                  className="border-0 py-2 shadow-none bg-light fw-bold text-dark"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="light"
                    className="border-0 bg-light pe-4"
                    onClick={() => setSearchTerm("")}
                  >
                    <FiXCircle className="text-muted" size={18} />
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4 mt-2">
        <Row className="g-4">
          {/* ============================================================ */}
          {/* VIEW A: GLOBAL SEARCH RESULTS (Takes Full Width)           */}
          {/* ============================================================ */}
          {searchResults !== null ? (
            <Col xs={12}>
              <div className="mb-4">
                <h4 className="fw-bold text-dark">
                  Search results for "{searchTerm}"
                </h4>
                <p className="text-muted small">
                  Found {searchResults.length} services
                </p>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-5 my-5 bg-white rounded-4 border shadow-sm">
                  <FiSearch size={50} className="text-muted opacity-25 mb-3" />
                  <h5 className="fw-bold text-dark">No exact matches found</h5>
                  <p className="text-muted">
                    Try searching for broader terms like "Salon" or "Repair"
                  </p>
                  <Button
                    variant="outline-dark"
                    className="rounded-pill px-4 fw-bold mt-2"
                    onClick={() => setSearchTerm("")}
                  >
                    Clear Search
                  </Button>
                </div>
              ) : (
                <Row className="g-4">
                  {searchResults.map((service) => (
                    <Col key={service._id} md={6} lg={4} xl={3}>
                      <ServiceCard service={service} onBook={handleBookClick} />
                    </Col>
                  ))}
                </Row>
              )}
            </Col>
          ) : (
            /* ============================================================ */
            /* VIEW B: STANDARD CATEGORY NAVIGATION                       */
            /* ============================================================ */
            <>
              {/* LEFT SIDEBAR: ROOT CATEGORIES (Desktop) */}
              <Col lg={3} className="d-none d-lg-block">
                <div
                  className="bg-white rounded-4 shadow-sm border overflow-hidden position-sticky"
                  style={{ top: "180px", zIndex: 1000 }}
                >
                  <div className="p-3 border-bottom bg-light">
                    <h6 className="fw-bold mb-0 text-muted small">
                      <FiFilter className="me-1" /> CATEGORIES
                    </h6>
                  </div>
                  <div className="d-flex flex-column p-2">
                    {tree.map((cat) => (
                      <button
                        key={cat._id}
                        onClick={() => setActiveCategoryId(cat._id)}
                        className={`text-start p-3 border-0 rounded-3 mb-1 fw-bold transition-all ${
                          activeCategoryId === cat._id
                            ? "bg-dark text-white shadow-sm"
                            : "bg-white text-dark hover-effect"
                        }`}
                        style={{ fontSize: "14px" }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              </Col>

              {/* MOBILE CATEGORY SCROLLER */}
              <Col xs={12} className="d-lg-none mb-2">
                <div className="d-flex gap-2 overflow-auto category-scroll pb-2">
                  {tree.map((cat) => (
                    <button
                      key={cat._id}
                      onClick={() => setActiveCategoryId(cat._id)}
                      className={`px-4 py-2 rounded-pill border fw-bold text-nowrap transition-all shadow-sm ${
                        activeCategoryId === cat._id
                          ? "bg-dark text-white border-dark"
                          : "bg-white text-muted"
                      }`}
                      style={{ fontSize: "13px" }}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </Col>

              {/* RIGHT SIDE: SUBCATEGORIES & SERVICES */}
              <Col lg={9}>
                <AnimatePresence mode="wait">
                  {activeCategory ? (
                    <motion.div
                      key={activeCategory._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="mb-5 pb-5"
                    >
                      <div className="d-flex align-items-center mb-4 pb-2 border-bottom">
                        <div
                          className="bg-white p-2 rounded-circle shadow-sm me-3 text-primary d-flex align-items-center justify-content-center"
                          style={{ width: "45px", height: "45px" }}
                        >
                          <img
                            src="https://cdn-icons-png.flaticon.com/512/769/769286.png"
                            alt="icon"
                            style={{ width: "24px", opacity: 0.8 }}
                          />
                        </div>
                        <h2 className="fw-bold mb-0 text-dark">
                          {activeCategory.name}
                        </h2>
                      </div>

                      {/* Loop through SubCategories */}
                      {activeCategory.subCategories?.length === 0 ? (
                        <div className="text-center py-5 bg-white rounded-4 border shadow-sm mt-3">
                          <h5 className="text-muted fw-bold">Coming Soon</h5>
                          <p className="small text-muted mb-0">
                            We are adding services to this category.
                          </p>
                        </div>
                      ) : (
                        activeCategory.subCategories?.map((sub) => {
                          if (!sub.services || sub.services.length === 0)
                            return null;

                          return (
                            <div
                              key={sub._id}
                              className="mb-5 bg-white p-4 rounded-4 shadow-sm border"
                            >
                              <h4 className="fw-bold mb-4 text-dark d-flex align-items-center">
                                <span
                                  className="me-2"
                                  style={{ color: "var(--accent-color)" }}
                                >
                                  #
                                </span>
                                {sub.name}
                              </h4>
                              <Row className="g-4">
                                {sub.services.map((service) => (
                                  <Col key={service._id} md={6} xl={4}>
                                    <ServiceCard
                                      service={service}
                                      onBook={handleBookClick}
                                    />
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  ) : (
                    <div className="text-center py-5">
                      <h5 className="text-muted">No services found.</h5>
                    </div>
                  )}
                </AnimatePresence>
              </Col>
            </>
          )}
        </Row>
      </Container>

      {/* REUSABLE BOOKING MODAL (Keeps UI clean) */}
      <BookingModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesPage;
