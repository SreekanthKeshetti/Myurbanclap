/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Container, Card, Button, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiChevronRight,
  FiDownload,
  FiMapPin,
  FiCalendar,
} from "react-icons/fi";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showConfetti, setShowConfetti] = useState(true);

  // 1. Capture the data passed from Checkout/BookingModal
  const orderData = location.state?.orderData;

  // 2. Window resize listener for Confetti
  useEffect(() => {
    const detectSize = () => {
      setWindowDimension({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", detectSize);

    // Stop confetti after 5 seconds to not annoy the user
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    return () => {
      window.removeEventListener("resize", detectSize);
      clearTimeout(timer);
    };
  }, []);

  // 3. Security: If a user tries to type /order-success manually without booking, kick them out
  if (!orderData) {
    return (
      <Container className="text-center mt-5 pt-5">
        <h4>No recent order found.</h4>
        <Button variant="dark" className="mt-3" onClick={() => navigate("/")}>
          Go Home
        </Button>
      </Container>
    );
  }

  const {
    items,
    grandTotal,
    paymentMethod,
    promoCode,
    discount,
    taxes,
    date,
    timeSlot,
    address,
  } = orderData;

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        paddingTop: "100px",
        paddingBottom: "50px",
      }}
    >
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          recycle={false}
          numberOfPieces={400}
          gravity={0.15}
        />
      )}

      <Container>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="d-flex justify-content-center"
        >
          <Card
            className="border-0 shadow-lg rounded-4 overflow-hidden"
            style={{ maxWidth: "500px", width: "100%" }}
          >
            {/* GREEN SUCCESS HEADER */}
            <div className="bg-success text-white text-center p-5">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <FiCheckCircle size={70} className="mb-3" />
              </motion.div>
              <h3 className="fw-bold mb-1">Booking Confirmed!</h3>
              <p className="mb-0 opacity-75 small">
                Your service professionals have been notified.
              </p>
            </div>

            <Card.Body className="p-4 bg-white">
              {/* SCHEDULE SUMMARY */}
              <div className="bg-light p-3 rounded-3 mb-4">
                <div className="d-flex align-items-start mb-2">
                  <FiCalendar className="text-primary me-2 mt-1" />
                  <div>
                    <small
                      className="text-muted d-block fw-bold"
                      style={{ fontSize: "10px" }}
                    >
                      SCHEDULED FOR
                    </small>
                    <span className="fw-bold text-dark">
                      {date} @ {timeSlot}
                    </span>
                  </div>
                </div>
                <hr className="my-2 opacity-10" />
                <div className="d-flex align-items-start">
                  <FiMapPin className="text-primary me-2 mt-1" />
                  <div>
                    <small
                      className="text-muted d-block fw-bold"
                      style={{ fontSize: "10px" }}
                    >
                      DELIVERING TO
                    </small>
                    <span className="text-dark small">{address}</span>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-3">Order Summary</h6>

              {/* ITEMS LIST */}
              <div className="mb-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="d-flex justify-content-between mb-2"
                  >
                    <span className="text-muted small">
                      {item.name}{" "}
                      <span className="fw-bold px-1 text-dark">
                        x{item.qty}
                      </span>
                    </span>
                    <span className="fw-bold small">
                      ₹{item.price * item.qty}
                    </span>
                  </div>
                ))}
              </div>

              {/* DOTTED LINE SEPARATOR */}
              <div
                style={{ borderTop: "2px dashed #e2e8f0", margin: "15px 0" }}
              ></div>

              {/* PRICING BREAKDOWN */}
              {discount > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span className="small d-flex align-items-center">
                    Discount{" "}
                    <Badge
                      bg="success"
                      className="ms-2"
                      style={{ fontSize: "9px" }}
                    >
                      {promoCode}
                    </Badge>
                  </span>
                  <span className="fw-bold small">
                    - ₹{discount.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted small">Taxes (18% GST)</span>
                <span className="fw-bold small">₹{taxes.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted small">Platform Fee</span>
                <span className="fw-bold small">₹29.00</span>
              </div>

              {/* GRAND TOTAL ROW */}
              <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4 border">
                <div>
                  <span className="fw-bold fs-6 d-block">Grand Total</span>
                  <Badge
                    bg={paymentMethod === "cash" ? "warning" : "success"}
                    text={paymentMethod === "cash" ? "dark" : "white"}
                  >
                    {paymentMethod === "cash"
                      ? "PAY AFTER SERVICE"
                      : "PAID ONLINE"}
                  </Badge>
                </div>
                <span className="fw-bold fs-4 text-primary">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              {/* CALL TO ACTIONS */}
              <div className="d-grid gap-2">
                <Button
                  variant="dark"
                  className="rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center"
                  onClick={() => navigate("/bookings")}
                >
                  Track your Professional <FiChevronRight className="ms-1" />
                </Button>
                <Button
                  variant="link"
                  className="text-muted text-decoration-none fw-bold"
                  onClick={() => navigate("/")}
                >
                  Back to Home
                </Button>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      </Container>
    </div>
  );
};

export default OrderSuccess;
// import React, { useEffect, useState } from "react";
// import { Container, Card, Button, Badge } from "react-bootstrap";
// import { useLocation, useNavigate } from "react-router-dom";
// import Confetti from "react-confetti";
// import { motion } from "framer-motion";
// import {
//   FiCheckCircle,
//   FiChevronRight,
//   FiMapPin,
//   FiCalendar,
// } from "react-icons/fi";

// const OrderSuccess = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [windowDimension, setWindowDimension] = useState({
//     width: window.innerWidth,
//     height: window.innerHeight,
//   });

//   // 🌟 NEW: Instead of unmounting the component, we just drop the piece count to 0
//   // This makes the confetti gracefully fall off the screen instead of vanishing instantly!
//   const [confettiPieces, setConfettiPieces] = useState(400);

//   const orderData = location.state?.orderData;

//   useEffect(() => {
//     const detectSize = () => {
//       setWindowDimension({
//         width: window.innerWidth,
//         height: window.innerHeight,
//       });
//     };
//     window.addEventListener("resize", detectSize);

//     // Stop generating new confetti after 4 seconds
//     const timer = setTimeout(() => setConfettiPieces(0), 4000);

//     return () => {
//       window.removeEventListener("resize", detectSize);
//       clearTimeout(timer);
//     };
//   }, []);

//   if (!orderData) {
//     return (
//       <Container className="text-center mt-5 pt-5">
//         <h4>No recent order found.</h4>
//         <Button variant="dark" className="mt-3" onClick={() => navigate("/")}>
//           Go Home
//         </Button>
//       </Container>
//     );
//   }

//   const {
//     items,
//     grandTotal,
//     paymentMethod,
//     promoCode,
//     discount,
//     taxes,
//     date,
//     timeSlot,
//     address,
//   } = orderData;

//   return (
//     <div
//       style={{
//         backgroundColor: "#f8fafc",
//         minHeight: "100vh",
//         paddingTop: "100px",
//         paddingBottom: "50px",
//         position: "relative", // Ensure relative context for child elements
//       }}
//     >
//       {/* 🌟 BULLETPROOF CONFETTI 🌟 */}
//       <Confetti
//         width={windowDimension.width}
//         height={windowDimension.height}
//         recycle={true}
//         numberOfPieces={confettiPieces}
//         gravity={0.15}
//         style={{
//           position: "fixed",
//           top: 0,
//           left: 0,
//           zIndex: 99999,
//           pointerEvents: "none",
//         }} // Forces it to the very top!
//       />

//       <Container>
//         <motion.div
//           initial={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ duration: 0.5, type: "spring" }}
//           className="d-flex justify-content-center"
//         >
//           <Card
//             className="border-0 shadow-lg rounded-4 overflow-hidden"
//             style={{ maxWidth: "500px", width: "100%", zIndex: 10 }}
//           >
//             {/* GREEN SUCCESS HEADER */}
//             <div className="bg-success text-white text-center p-5">
//               <motion.div
//                 initial={{ scale: 0 }}
//                 animate={{ scale: 1 }}
//                 transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
//               >
//                 <FiCheckCircle size={70} className="mb-3" />
//               </motion.div>
//               <h3 className="fw-bold mb-1">Booking Confirmed!</h3>
//               <p className="mb-0 opacity-75 small">
//                 Your service professionals have been notified.
//               </p>
//             </div>

//             <Card.Body className="p-4 bg-white">
//               {/* SCHEDULE SUMMARY */}
//               <div className="bg-light p-3 rounded-3 mb-4">
//                 <div className="d-flex align-items-start mb-2">
//                   <FiCalendar className="text-primary me-2 mt-1" />
//                   <div>
//                     <small
//                       className="text-muted d-block fw-bold"
//                       style={{ fontSize: "10px" }}
//                     >
//                       SCHEDULED FOR
//                     </small>
//                     <span className="fw-bold text-dark">
//                       {date} @ {timeSlot}
//                     </span>
//                   </div>
//                 </div>
//                 <hr className="my-2 opacity-10" />
//                 <div className="d-flex align-items-start">
//                   <FiMapPin className="text-primary me-2 mt-1" />
//                   <div>
//                     <small
//                       className="text-muted d-block fw-bold"
//                       style={{ fontSize: "10px" }}
//                     >
//                       DELIVERING TO
//                     </small>
//                     <span className="text-dark small">{address}</span>
//                   </div>
//                 </div>
//               </div>

//               <h6 className="fw-bold mb-3">Order Summary</h6>

//               {/* ITEMS LIST */}
//               <div className="mb-3">
//                 {items.map((item, idx) => (
//                   <div
//                     key={idx}
//                     className="d-flex justify-content-between mb-2"
//                   >
//                     <span className="text-muted small">
//                       {item.name}{" "}
//                       <span className="fw-bold px-1 text-dark">
//                         x{item.qty}
//                       </span>
//                     </span>
//                     <span className="fw-bold small">
//                       ₹{item.price * item.qty}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               {/* DOTTED LINE SEPARATOR */}
//               <div
//                 style={{ borderTop: "2px dashed #e2e8f0", margin: "15px 0" }}
//               ></div>

//               {/* PRICING BREAKDOWN */}
//               {discount > 0 && (
//                 <div className="d-flex justify-content-between mb-2 text-success">
//                   <span className="small d-flex align-items-center">
//                     Discount{" "}
//                     <Badge
//                       bg="success"
//                       className="ms-2"
//                       style={{ fontSize: "9px" }}
//                     >
//                       {promoCode}
//                     </Badge>
//                   </span>
//                   <span className="fw-bold small">
//                     - ₹{discount.toFixed(2)}
//                   </span>
//                 </div>
//               )}
//               <div className="d-flex justify-content-between mb-2">
//                 <span className="text-muted small">Taxes (18% GST)</span>
//                 <span className="fw-bold small">₹{taxes.toFixed(2)}</span>
//               </div>
//               <div className="d-flex justify-content-between mb-3">
//                 <span className="text-muted small">Platform Fee</span>
//                 <span className="fw-bold small">₹29.00</span>
//               </div>

//               {/* GRAND TOTAL ROW */}
//               <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded-3 mb-4 border">
//                 <div>
//                   <span className="fw-bold fs-6 d-block">Grand Total</span>
//                   <Badge
//                     bg={paymentMethod === "cash" ? "warning" : "success"}
//                     text={paymentMethod === "cash" ? "dark" : "white"}
//                   >
//                     {paymentMethod === "cash"
//                       ? "PAY AFTER SERVICE"
//                       : "PAID ONLINE"}
//                   </Badge>
//                 </div>
//                 <span className="fw-bold fs-4 text-primary">
//                   ₹{grandTotal.toFixed(2)}
//                 </span>
//               </div>

//               {/* CALL TO ACTIONS */}
//               <div className="d-grid gap-2">
//                 <Button
//                   variant="dark"
//                   className="rounded-pill py-3 fw-bold d-flex align-items-center justify-content-center btn-primary-custom"
//                   onClick={() => navigate("/bookings")}
//                 >
//                   Track your Professional <FiChevronRight className="ms-1" />
//                 </Button>
//                 <Button
//                   variant="link"
//                   className="text-muted text-decoration-none fw-bold"
//                   onClick={() => navigate("/")}
//                 >
//                   Back to Home
//                 </Button>
//               </div>
//             </Card.Body>
//           </Card>
//         </motion.div>
//       </Container>
//     </div>
//   );
// };

// export default OrderSuccess;
