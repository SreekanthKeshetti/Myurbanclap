import React, { useEffect } from "react";
import { Container, Card } from "react-bootstrap";
import { FiFileText, FiShield, FiRefreshCcw } from "react-icons/fi";

const Legal = ({ type }) => {
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when page loads
  }, [type]);

  const content = {
    terms: {
      title: "Terms & Conditions",
      icon: <FiFileText size={40} className="text-primary mb-3" />,
      text: "Welcome to UrbanClone. By using our platform, you agree to our terms of service. We connect independent professionals with customers. UrbanClone is not liable for direct damages caused by third-party providers, though we enforce strict quality control.",
    },
    privacy: {
      title: "Privacy Policy",
      icon: <FiShield size={40} className="text-success mb-3" />,
      text: "Your privacy is our priority. We collect your phone number, location, and name strictly to facilitate home services. We do not sell your data to third-party advertisers. All payments are securely processed via Razorpay.",
    },
    refunds: {
      title: "Cancellation & Refund Policy",
      icon: <FiRefreshCcw size={40} className="text-warning mb-3" />,
      text: "You can cancel any booking free of charge up to 2 hours before the scheduled time. Cancellations within 2 hours incur a ₹100 penalty. Refunds for cancelled prepaid orders are instantly credited to your UrbanClone Wallet.",
    },
  };

  const current = content[type];

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "120px",
        paddingBottom: "80px",
      }}
    >
      <Container className="d-flex justify-content-center">
        <Card
          className="border-0 shadow-sm rounded-4 p-5"
          style={{ maxWidth: "800px", width: "100%" }}
        >
          <div className="text-center">
            {current.icon}
            <h2 className="fw-bold mb-4">{current.title}</h2>
          </div>
          <div
            className="text-muted"
            style={{ lineHeight: "1.8", fontSize: "1.1rem" }}
          >
            <p>
              <strong>Last Updated:</strong> April 2026
            </p>
            <p>{current.text}</p>
            <p>
              For detailed legal inquiries, please contact our legal team at{" "}
              <strong>legal@urbanclone.in</strong>.
            </p>
          </div>
        </Card>
      </Container>
    </div>
  );
};

export default Legal;
