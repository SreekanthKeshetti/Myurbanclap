import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: "var(--footer-bg)",
        color: "#e2e8f0",
        paddingTop: "60px",
        paddingBottom: "30px",
        fontFamily: "var(--font-body)",
      }}
    >
      <Container>
        <Row className="gy-4 mb-5">
          <Col lg={4}>
            <h4
              className="fw-bold text-white mb-3"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              UrbanClone
            </h4>
            <p
              className="small opacity-75 mb-4"
              style={{ maxWidth: "280px", lineHeight: "1.6" }}
            >
              Your trusted partner for all home services. Professional,
              reliable, and affordable.
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white opacity-75 hover-opacity-100">
                <FaFacebookF />
              </a>
              <a href="#" className="text-white opacity-75 hover-opacity-100">
                <FaTwitter />
              </a>
              <a href="#" className="text-white opacity-75 hover-opacity-100">
                <FaInstagram />
              </a>
              <a href="#" className="text-white opacity-75 hover-opacity-100">
                <FaLinkedinIn />
              </a>
            </div>
          </Col>

          <Col lg={2} md={4} xs={6}>
            <h6 className="text-white fw-bold mb-3">Company</h6>
            <ul
              className="list-unstyled small opacity-75"
              style={{ lineHeight: "2" }}
            >
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  Careers
                </a>
              </li>
              <li>
                <Link to="/terms" className="text-decoration-none text-reset">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-decoration-none text-reset">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/refunds" className="text-decoration-none text-reset">
                  Refund Policy
                </Link>
              </li>
            </ul>
          </Col>

          <Col lg={2} md={4} xs={6}>
            <h6 className="text-white fw-bold mb-3">For Customers</h6>
            <ul
              className="list-unstyled small opacity-75"
              style={{ lineHeight: "2" }}
            >
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  Categories Near You
                </a>
              </li>
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  Customer Reviews
                </a>
              </li>
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-decoration-none text-reset">
                  Contact Us
                </a>
              </li>
            </ul>
          </Col>

          <Col lg={4} md={4}>
            <h6 className="text-white fw-bold mb-3">Contact</h6>
            <ul
              className="list-unstyled small opacity-75"
              style={{ lineHeight: "2" }}
            >
              <li className="d-flex align-items-center mb-2">
                <FiMapPin className="me-2" /> 123 Service Street, Hyderabad,
                India
              </li>
              <li className="d-flex align-items-center mb-2">
                <FiPhone className="me-2" /> +91 1800-123-4567
              </li>
              <li className="d-flex align-items-center">
                <FiMail className="me-2" /> support@urbanclone.com
              </li>
            </ul>
          </Col>
        </Row>

        <div className="border-top border-secondary pt-4 mt-2 d-flex flex-column flex-md-row justify-content-between align-items-center small opacity-75">
          <p className="mb-2 mb-md-0">
            © {new Date().getFullYear()} UrbanClone. All rights reserved.
          </p>
          <div className="d-flex gap-3">
            <a href="#" className="text-decoration-none text-reset">
              Terms
            </a>
            <a href="#" className="text-decoration-none text-reset">
              Privacy
            </a>
            <a href="#" className="text-decoration-none text-reset">
              Sitemap
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
