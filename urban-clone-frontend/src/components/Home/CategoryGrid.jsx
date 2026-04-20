// import React from "react";
// import { Container, Row, Col } from "react-bootstrap";
// import { useNavigate } from "react-router-dom";
// import {
//   FiScissors,
//   FiUser,
//   FiDroplet,
//   FiTool,
//   FiSettings,
// } from "react-icons/fi";
// import { BiPaint } from "react-icons/bi";

// const categories = [
//   {
//     name: "Women's Salon & Spa",
//     target: "Salon",
//     time: "44 mins",
//     icon: <FiScissors />,
//     img: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
//   },
//   {
//     name: "Men's Salon & Massage",
//     target: "Salon",
//     time: "39 mins",
//     icon: <FiUser />,
//     img: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&q=80",
//   },
//   {
//     name: "Cleaning & Pest Control",
//     target: "Cleaning",
//     time: "29 mins",
//     icon: <FiDroplet />,
//     img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80",
//   },
//   {
//     name: "AC & Appliance Repair",
//     target: "Appliance",
//     time: "29 mins",
//     icon: <FiSettings />,
//     img: "https://media.istockphoto.com/id/2161974641/photo/hvac-technician-performing-air-conditioner-maintenance-inspection.jpg?s=612x612&w=0&k=20&c=ZmcqjThhqmz2g3CVC8X3_-tZMoivLZ12fD7cq5drPro=",
//   },
//   {
//     name: "Electrician & Plumber",
//     target: "Plumbing",
//     time: "35 mins",
//     icon: <FiTool />,
//     img: "https://media.istockphoto.com/id/928085478/photo/smiling-repairman-with-toolbox-and-cable.webp?a=1&b=1&s=612x612&w=0&k=20&c=7vYeynsAINSRkI3aC7FHuVXBcwiwKctEMj5x2efTnrE=",
//   },
//   {
//     name: "Painting & Waterproofing",
//     target: "Painting",
//     time: "Contact for quote",
//     icon: <BiPaint />,
//     img: "https://images.unsplash.com/photo-1674376360445-2996327553e7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fEhvbWUlMjBwYWludGluZyUyMGFuZCUyMHdhdGVyJTIwcHJyb2Zpbmd8ZW58MHx8MHx8fDA%3D",
//   },
// ];

// const CategoryGrid = () => {
//   const navigate = useNavigate();

//   return (
//     <section className="py-5 bg-white">
//       <Container>
//         <Row className="g-3">
//           {categories.map((cat, idx) => (
//             <Col key={idx} xs={6} md={4} lg={2}>
//               <div
//                 className="category-square-card h-100"
//                 onClick={() =>
//                   navigate("/services", {
//                     state: { selectedCategory: cat.target },
//                   })
//                 }
//               >
//                 <img
//                   src={cat.img}
//                   alt={cat.name}
//                   className="category-square-img"
//                 />
//                 <div className="category-overlap-icon">{cat.icon}</div>
//                 <h6
//                   className="fw-bold mb-1 text-dark"
//                   style={{ fontSize: "14px" }}
//                 >
//                   {cat.name}
//                 </h6>
//                 <small className="text-muted" style={{ fontSize: "12px" }}>
//                   {cat.time}
//                 </small>
//               </div>
//             </Col>
//           ))}
//         </Row>
//       </Container>
//     </section>
//   );
// };

// export default CategoryGrid;
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Import all possible icons we might use from the DB
import * as FiIcons from "react-icons/fi";

const CategoryGrid = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTree = async () => {
      try {
        // const { data } = await axios.get(
        //   "https://myurbanclap.onrender.com/api/categories/tree",
        // );
        // const { data } = await axios.get(
        //   "http://localhost:5000/api/categories/tree",
        // );
        const { data } = await axios.get("/api/categories/tree");
        setCategories(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories", error);
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  // Helper to render dynamic string icons from the DB
  const DynamicIcon = ({ name }) => {
    const IconComponent = FiIcons[name] || FiIcons.FiGrid; // Fallback to FiGrid
    return <IconComponent size={24} />;
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" style={{ color: "var(--accent-color)" }} />
      </Container>
    );
  }

  return (
    <section className="py-5 bg-white">
      <Container>
        <Row className="g-3">
          {categories.map((cat) => (
            <Col key={cat._id} xs={6} md={4} lg={3}>
              <div
                className="category-square-card h-100"
                onClick={() =>
                  navigate("/services", {
                    state: { selectedCategoryId: cat._id },
                  })
                }
                style={{
                  backgroundColor: cat.color || "#f8fafc",
                  border: "none",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                }}
              >
                <div className="d-flex flex-column align-items-center text-center p-3">
                  <div
                    className="mb-3 d-flex align-items-center justify-content-center bg-white rounded-circle shadow-sm"
                    style={{
                      width: "60px",
                      height: "60px",
                      color: "var(--primary-color)",
                    }}
                  >
                    <DynamicIcon name={cat.icon} />
                  </div>
                  <h6
                    className="fw-bold mb-1 text-dark"
                    style={{ fontSize: "15px" }}
                  >
                    {cat.name}
                  </h6>
                  <small className="text-muted" style={{ fontSize: "12px" }}>
                    {cat.subCategories?.length || 0} Options
                  </small>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default CategoryGrid;
