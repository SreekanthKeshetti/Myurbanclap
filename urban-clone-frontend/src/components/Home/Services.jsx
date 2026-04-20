/* eslint-disable no-unused-vars */
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // <--- Import useNavigate
import {
  FiScissors,
  FiHome,
  FiCpu,
  FiDroplet,
  FiTool,
  FiLayout,
} from "react-icons/fi";
import { BiPaint } from "react-icons/bi";
import { MdCleaningServices } from "react-icons/md";

// ADDED 'targetCategory' to match the database categories exactly
const categories = [
  {
    id: 1,
    name: "Salon for Women",
    targetCategory: "Salon",
    icon: <FiScissors />,
    color: "#F472B6",
    bg: "#FDF2F8",
  },
  {
    id: 2,
    name: "Salon for Men",
    targetCategory: "Salon",
    icon: <FiLayout />,
    color: "#60A5FA",
    bg: "#EFF6FF",
  },
  {
    id: 3,
    name: "AC & Appliance",
    targetCategory: "Appliance",
    icon: <FiCpu />,
    color: "#34D399",
    bg: "#ECFDF5",
  },
  {
    id: 4,
    name: "Cleaning",
    targetCategory: "Cleaning",
    icon: <MdCleaningServices />,
    color: "#818CF8",
    bg: "#EEF2FF",
  },
  {
    id: 5,
    name: "Electrician",
    targetCategory: "Electrician",
    icon: <FiTool />,
    color: "#FBBF24",
    bg: "#FFFBEB",
  },
  {
    id: 6,
    name: "Plumbing",
    targetCategory: "Plumbing",
    icon: <FiDroplet />,
    color: "#60A5FA",
    bg: "#EFF6FF",
  },
  {
    id: 7,
    name: "Painting",
    targetCategory: "Painting",
    icon: <BiPaint />,
    color: "#F87171",
    bg: "#FEF2F2",
  },
  {
    id: 8,
    name: "Home Repairs",
    targetCategory: "All", // Default to All for general repairs
    icon: <FiHome />,
    color: "#A78BFA",
    bg: "#F5F3FF",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const Services = () => {
  const navigate = useNavigate(); // <--- Initialize navigate

  // Click Handler
  const handleCategoryClick = (targetCategory) => {
    // Navigate to /services and pass the category state
    navigate("/services", { state: { selectedCategory: targetCategory } });
  };

  return (
    <section className="section-padding" style={{ backgroundColor: "#FAFAFA" }}>
      <Container>
        <div className="mb-5">
          <h2 className="section-title">What are you looking for?</h2>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          <Row className="g-4">
            {categories.map((cat) => (
              <Col key={cat.id} xs={6} md={4} lg={3}>
                <motion.div variants={itemVariants} className="h-100">
                  {/* ADDED onClick EVENT */}
                  <div
                    className="category-card"
                    onClick={() => handleCategoryClick(cat.targetCategory)}
                  >
                    <div
                      className="icon-wrapper"
                      style={{ backgroundColor: cat.bg, color: cat.color }}
                    >
                      {cat.icon}
                    </div>
                    <h5 className="category-title">{cat.name}</h5>
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </Container>
    </section>
  );
};

export default Services;
