import React from "react";
import { Container } from "react-bootstrap";
import { FiChevronRight } from "react-icons/fi";

const offers = [
  { title: "Salon Prime", desc: "Get 20% off on all salon services", badge: "20% OFF", img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600" },
  { title: "AC Service Special", desc: "Flat ₹100 off on AC servicing", badge: "₹100 OFF", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600" },
  { title: "Home Cleaning Pack", desc: "Deep cleaning services at best prices", badge: "SAVE ₹200", img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600" },
];

const OffersSlider = () => {
  return (
    <section className="py-5 bg-white">
      <Container>
        <h3 className="fw-bold mb-4 text-dark px-1">Offers & Discounts</h3>
        <div className="horizontal-scroll-container">
          {offers.map((offer, idx) => (
            <div key={idx} className="offer-card">
              <img src={offer.img} alt={offer.title} />
              <div className="offer-overlay">
                <h5 className="text-white fw-bold mb-1">{offer.title}</h5>
                <p className="text-white opacity-75 small mb-2">{offer.desc}</p>
                <div className="text-white fw-bold small d-flex align-items-center">
                  Book Now <FiChevronRight className="ms-1" />
                </div>
              </div>
              <div className="offer-badge shadow-sm">{offer.badge}</div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default OffersSlider;
