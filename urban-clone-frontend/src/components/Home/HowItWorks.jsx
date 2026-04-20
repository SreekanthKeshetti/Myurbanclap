import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FiSearch, FiCalendar, FiUserCheck, FiSmile } from "react-icons/fi";

const steps = [
  {
    id: 1,
    title: "Select a Service",
    desc: "Choose from our wide range of professional home services",
    icon: <FiSearch size={28} />,
  },
  {
    id: 2,
    title: "Book Instantly",
    desc: "Pick a convenient time slot and book your service",
    icon: <FiCalendar size={28} />,
  },
  {
    id: 3,
    title: "Professional Arrives",
    desc: "Trained and verified expert arrives at your doorstep",
    icon: <FiUserCheck size={28} />,
  },
  {
    id: 4,
    title: "Relax & Enjoy",
    desc: "Sit back and enjoy quality service delivered",
    icon: <FiSmile size={28} />,
  },
];

const HowItWorks = () => {
  return (
    <section className="py-5 bg-white">
      <Container>
        <div className="text-center mb-5 mt-4">
          <h2 className="fw-bold text-dark">How It Works</h2>
          <p className="text-muted">
            Book professional home services in just 4 simple steps
          </p>
        </div>

        <Row className="g-4 text-center pb-4">
          {steps.map((step) => (
            <Col lg={3} md={6} key={step.id}>
              <div className="step-wrapper">
                <div className="step-card">
                  <div className="step-number">{step.id}</div>
                  <div className="step-icon-container">{step.icon}</div>
                  <h6 className="fw-bold text-dark">{step.title}</h6>
                  <p
                    className="text-muted small mx-auto mb-0"
                    style={{ maxWidth: "200px" }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default HowItWorks;
