// import React, { useState, useEffect } from "react";
// import { Container } from "react-bootstrap";
// import { FiStar } from "react-icons/fi";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const RecommendedServices = ({
//   title,
//   filterCategory,
//   badgeText,
//   badgeColor,
//   bgColor = "#ffffff",
// }) => {
//   const [services, setServices] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchServices = async () => {
//       try {
//         let url = "/api/services";
//         if (filterCategory) url += `?category=${filterCategory}`;
//         const { data } = await axios.get(url);
//         setServices(data.slice(0, 8));
//       } catch (error) {
//         console.log(error);
//       }
//     };
//     fetchServices();
//   }, [filterCategory]);

//   if (services.length === 0) return null;

//   return (
//     <section className="py-4" style={{ backgroundColor: bgColor }}>
//       <Container>
//         <div className="d-flex justify-content-between align-items-center mb-4 px-1">
//           <h3 className="fw-bold mb-0 text-dark">{title}</h3>
//           <span
//             className="text-success fw-bold cursor-pointer"
//             style={{ cursor: "pointer", fontSize: "14px" }}
//             onClick={() =>
//               navigate("/services", {
//                 state: { selectedCategory: filterCategory || "All" },
//               })
//             }
//           >
//             See all &rarr;
//           </span>
//         </div>

//         <div className="horizontal-scroll-container">
//           {services.map((service) => {
//             const originalPrice = Math.round(service.price * 1.1);
//             return (
//               <div
//                 key={service._id}
//                 className="uc-service-card position-relative"
//                 onClick={() => navigate(`/services/${service._id}`)}
//               >
//                 {badgeText && (
//                   <div
//                     className="position-absolute shadow-sm"
//                     style={{
//                       top: "12px",
//                       left: "12px",
//                       zIndex: 10,
//                       backgroundColor: badgeColor,
//                       color: badgeColor === "#fde047" ? "#000" : "#fff",
//                       padding: "4px 8px",
//                       borderRadius: "4px",
//                       fontSize: "11px",
//                       fontWeight: "bold",
//                     }}
//                   >
//                     {badgeText}
//                   </div>
//                 )}
//                 <div className="img-container p-2">
//                   <img src={service.image} alt={service.name} />
//                 </div>
//                 <div className="p-3 pt-1">
//                   <h6
//                     className="fw-bold mb-2 text-dark text-truncate"
//                     style={{ fontSize: "15px" }}
//                   >
//                     {service.name}
//                   </h6>
//                   <div className="d-flex align-items-center small mb-2">
//                     <FiStar fill="#059669" color="#059669" className="me-1" />
//                     <span className="fw-bold text-dark">
//                       {service.rating ? service.rating.toFixed(1) : "4.8"}
//                     </span>
//                     <span className="text-muted ms-2 ps-2 border-start">
//                       {service.category}
//                     </span>
//                   </div>
//                   <div className="d-flex align-items-center gap-2">
//                     <span className="fw-bold text-dark fs-6">
//                       ₹{service.price}
//                     </span>
//                     <span className="text-muted text-decoration-line-through small">
//                       ₹{originalPrice}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </Container>
//     </section>
//   );
// };

// export default RecommendedServices;
import React from "react";
import { Container } from "react-bootstrap";
import { FiStar } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

// 🌟 REMOVED AXIOS! This component now just receives the data instantly via props.
const RecommendedServices = ({
  title,
  services, // <--- Data passed from Homepage
  categoryId, // <--- Used for the "See all" button
  badgeText,
  badgeColor,
  bgColor = "#ffffff",
}) => {
  const navigate = useNavigate();

  // Don't render the section at all if there are no services
  if (!services || services.length === 0) return null;

  return (
    <section className="py-4" style={{ backgroundColor: bgColor }}>
      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4 px-1">
          <h3 className="fw-bold mb-0 text-dark">{title}</h3>
          <span
            className="text-success fw-bold cursor-pointer"
            style={{ cursor: "pointer", fontSize: "14px" }}
            onClick={() =>
              navigate("/services", {
                state: { selectedCategoryId: categoryId || null },
              })
            }
          >
            See all &rarr;
          </span>
        </div>

        <div className="horizontal-scroll-container">
          {services.map((service) => {
            const originalPrice = Math.round(service.price * 1.1);

            // Handle populated categories or direct strings safely
            const catName = service.category?.name || "Premium";

            return (
              <div
                key={service._id}
                className="uc-service-card position-relative"
                onClick={() => navigate(`/services/${service._id}`)}
              >
                {badgeText && (
                  <div
                    className="position-absolute shadow-sm"
                    style={{
                      top: "12px",
                      left: "12px",
                      zIndex: 10,
                      backgroundColor: badgeColor,
                      color: badgeColor === "#fde047" ? "#000" : "#fff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: "bold",
                    }}
                  >
                    {badgeText}
                  </div>
                )}
                <div className="img-container p-2">
                  <img src={service.image} alt={service.name} />
                </div>
                <div className="p-3 pt-1">
                  <h6
                    className="fw-bold mb-2 text-dark text-truncate"
                    style={{ fontSize: "15px" }}
                  >
                    {service.name}
                  </h6>
                  <div className="d-flex align-items-center small mb-2">
                    <FiStar fill="#059669" color="#059669" className="me-1" />
                    <span className="fw-bold text-dark">
                      {service.rating ? service.rating.toFixed(1) : "4.8"}
                    </span>
                    <span
                      className="text-muted ms-2 ps-2 border-start text-truncate"
                      style={{ maxWidth: "100px" }}
                    >
                      {catName}
                    </span>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-dark fs-6">
                      ₹{service.price}
                    </span>
                    <span className="text-muted text-decoration-line-through small">
                      ₹{originalPrice}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default RecommendedServices;
