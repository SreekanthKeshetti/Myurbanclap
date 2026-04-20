/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Spinner,
  Form,
  InputGroup,
} from "react-bootstrap";
import { FiSearch, FiFilter } from "react-icons/fi";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";

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

  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        setLoading(true);
        // const { data } = await axios.get(
        //   "https://myurbanclap.onrender.com/api/categories/tree",
        // );
        // const { data } = await axios.get(
        //   "http://localhost:5000/api/categories/tree",

        // );
        const { data } = await axios.get("/api/categories/tree");
        setTree(data);

        // If navigated from homepage, set that category. Otherwise, set the first one.
        if (location.state?.selectedCategoryId) {
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
  }, []);

  const handleBookClick = (service) => {
    if (!user) {
      toast.error("Please login to book a service");
      navigate("/login");
      return;
    }
    setSelectedService(service);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          paddingTop: "120px",
        }}
      >
        <Container className="text-center py-5">
          <Spinner
            animation="border"
            style={{ color: "var(--accent-color)" }}
          />
        </Container>
      </div>
    );
  }

  // Get the currently selected category object to render on the right side
  const activeCategory =
    tree.find((c) => c._id === activeCategoryId) || tree[0];

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "100px",
      }}
    >
      {/* HEADER SECTION */}
      <div
        className="bg-white border-bottom pt-4 pb-3 shadow-sm sticky-top"
        style={{ top: "80px", zIndex: 1020 }}
      >
        <Container>
          <Row className="align-items-center">
            <Col lg={4} md={12} className="mb-3 mb-lg-0">
              <h3 className="fw-bold mb-0 text-dark">Explore Services</h3>
            </Col>
            <Col lg={8} md={12}>
              <InputGroup className="shadow-sm rounded-pill overflow-hidden border bg-light">
                <InputGroup.Text className="bg-light border-0 ps-4">
                  <FiSearch className="text-muted" size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search for 'AC Repair', 'Dog Walker'..."
                  className="border-0 py-2 shadow-none bg-light fw-bold text-dark"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="py-4">
        <Row className="g-4">
          {/* LEFT SIDEBAR: ROOT CATEGORIES */}
          <Col lg={3} className="d-none d-lg-block">
            <div
              className="bg-white rounded-4 shadow-sm border overflow-hidden position-sticky"
              style={{ top: "180px" }}
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
                        ? "bg-primary text-white shadow-sm"
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
          <Col xs={12} className="d-lg-none mb-3">
            <div className="d-flex gap-2 overflow-auto category-scroll pb-2">
              {tree.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setActiveCategoryId(cat._id)}
                  className={`px-4 py-2 rounded-pill border fw-bold text-nowrap ${
                    activeCategoryId === cat._id
                      ? "bg-dark text-white"
                      : "bg-white text-muted"
                  }`}
                  style={{ fontSize: "14px" }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </Col>

          {/* RIGHT SIDE: SUBCATEGORIES & SERVICES */}
          <Col lg={9}>
            {activeCategory ? (
              <div className="mb-5">
                <h2 className="fw-bold mb-4">{activeCategory.name}</h2>

                {/* Loop through SubCategories */}
                {activeCategory.subCategories?.map((sub) => {
                  // If searching, filter services inside this subcategory
                  const filteredServices = sub.services.filter((srv) =>
                    srv.name.toLowerCase().includes(searchTerm.toLowerCase()),
                  );

                  if (filteredServices.length === 0) return null; // Don't show empty subcategories

                  return (
                    <div
                      key={sub._id}
                      className="mb-5 bg-white p-4 rounded-4 shadow-sm border"
                    >
                      <h4 className="fw-bold border-bottom pb-3 mb-4 text-primary">
                        {sub.name}
                      </h4>
                      <Row className="g-4">
                        {filteredServices.map((service) => (
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
                })}
              </div>
            ) : (
              <div className="text-center py-5">
                <h5 className="text-muted">No services found.</h5>
              </div>
            )}
          </Col>
        </Row>
      </Container>

      <BookingModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        service={selectedService}
      />
    </div>
  );
};

export default ServicesPage;
