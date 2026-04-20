import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { FiStar } from "react-icons/fi";
import { ImQuotesLeft } from "react-icons/im";

const reviews = [
  {
    name: "Priya Sharma",
    service: "Home Cleaning",
    quote:
      "Excellent service! The professionals were punctual and did a thorough job. My home has never looked better.",
    img: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Rajesh Kumar",
    service: "AC Repair",
    quote:
      "Very professional and skilled technician. Fixed my AC in no time. Highly recommend InstaClean!",
    img: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Anjali Desai",
    service: "Salon Services",
    quote:
      "Amazing salon service at home! The beautician was skilled and friendly. Will definitely book again.",
    img: "https://randomuser.me/api/portraits/women/68.jpg",
  },
];

const Testimonials = () => {
  return (
    <section className="py-5" style={{ backgroundColor: "#f8fafc" }}>
      <Container>
        <div className="text-center mb-5 mt-4">
          <h2 className="fw-bold text-dark">What Our Customers Say</h2>
          <p className="text-muted">
            Trusted by millions of happy customers across the country
          </p>
        </div>

        <Row className="g-4 pb-4">
          {reviews.map((rev, idx) => (
            <Col lg={4} md={6} key={idx}>
              <div className="testimonial-card">
                <ImQuotesLeft className="quote-icon" />
                <div className="mb-3">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      fill="#fbbf24"
                      color="#fbbf24"
                      className="me-1"
                    />
                  ))}
                </div>
                <p
                  className="text-dark fst-italic mb-4"
                  style={{ fontSize: "15px", lineHeight: "1.6" }}
                >
                  "{rev.quote}"
                </p>
                <div className="d-flex align-items-center mt-auto">
                  <img
                    src={rev.img}
                    alt={rev.name}
                    className="rounded-circle me-3 shadow-sm"
                    style={{
                      width: "48px",
                      height: "48px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <h6 className="fw-bold mb-0 text-dark">{rev.name}</h6>
                    <small className="text-muted">{rev.service}</small>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Testimonials;
