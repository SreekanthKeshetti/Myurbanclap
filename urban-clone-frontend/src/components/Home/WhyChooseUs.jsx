import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FiShield,
  FiTag,
  FiAward,
  FiSmartphone,
  FiClock,
  FiHeadphones,
} from "react-icons/fi";

const features = [
  {
    title: "Verified Professionals",
    desc: "All service providers are background verified and trained",
    icon: <FiShield size={24} />,
  },
  {
    title: "Transparent Pricing",
    desc: "No hidden charges. See prices upfront before booking",
    icon: <FiTag size={24} />,
  },
  {
    title: "Quality Assurance",
    desc: "High service standards maintained with regular quality checks",
    icon: <FiAward size={24} />,
  },
  {
    title: "Easy Booking",
    desc: "Book services in just a few clicks from anywhere",
    icon: <FiSmartphone size={24} />,
  },
  {
    title: "Flexible Scheduling",
    desc: "Choose time slots that work best for your schedule",
    icon: <FiClock size={24} />,
  },
  {
    title: "24/7 Support",
    desc: "Customer support available round the clock for assistance",
    icon: <FiHeadphones size={24} />,
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-5 bg-white">
      <Container>
        <div className="text-center mb-5 mt-4">
          <h2 className="fw-bold text-dark">Why Choose Us?</h2>
          <p className="text-muted">
            We are committed to providing the best home service experience
          </p>
        </div>

        <Row className="g-4 pb-4">
          {features.map((feat, idx) => (
            <Col lg={4} md={6} key={idx}>
              <div className="feature-card">
                <div className="feature-icon">{feat.icon}</div>
                <div>
                  <h6 className="fw-bold text-dark mb-1">{feat.title}</h6>
                  <p className="text-muted small mb-0">{feat.desc}</p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default WhyChooseUs;
