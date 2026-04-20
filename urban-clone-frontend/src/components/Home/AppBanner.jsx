import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { FaApple, FaGooglePlay } from "react-icons/fa"; // <-- Changed to FontAwesome

const AppBanner = () => {
  return (
    <section className="py-5" style={{ backgroundColor: "var(--accent-color)", marginTop: "40px" }}>
      <Container>
        <Row className="align-items-center">
          <Col lg={5} className="text-white mb-4 mb-lg-0">
            <h2 className="fw-bold mb-3" style={{ fontSize: "2.5rem" }}>Get the UrbanClone</h2>
            <p className="mb-4 fs-5 opacity-75">Book services on the go. Available on iOS and Android.</p>
            
            <div className="d-flex flex-wrap gap-3 mb-5">
              <Button variant="light" className="d-flex align-items-center px-4 py-2 rounded-3 fw-bold">
                <FaApple size={24} className="me-2 mb-1" />
                <div className="text-start" style={{ lineHeight: "1" }}>
                  <small style={{ fontSize: "10px", display: "block" }}>Download on the</small>
                  <span>App Store</span>
                </div>
              </Button>
              <Button variant="light" className="d-flex align-items-center px-4 py-2 rounded-3 fw-bold">
                <FaGooglePlay size={20} className="me-2 mb-1" />
                <div className="text-start" style={{ lineHeight: "1" }}>
                  <small style={{ fontSize: "10px", display: "block" }}>Get it on</small>
                  <span>Google Play</span>
                </div>
              </Button>
            </div>

            <div className="d-flex gap-5">
              <div>
                <h3 className="fw-bold mb-0">50K+</h3>
                <small className="opacity-75">App Downloads</small>
              </div>
              <div>
                <h3 className="fw-bold mb-0">4.5</h3>
                <small className="opacity-75">App Rating</small>
              </div>
            </div>
          </Col>
          
          <Col lg={7}>
            <img 
              src="https://images.unsplash.com/photo-1600607686527-6fb886090705?w=800&q=80" 
              alt="App Preview" 
              style={{ width: "100%", height: "350px", objectFit: "cover", borderRadius: "16px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)" }}
            />
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default AppBanner;
