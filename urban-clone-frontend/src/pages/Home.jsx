import React, { useState, useEffect } from "react";
import { Spinner } from "react-bootstrap";
import axios from "axios";

import Hero from "../components/Home/Hero";
import CategoryGrid from "../components/Home/CategoryGrid";
import RecommendedServices from "../components/Home/RecommendedServices";
import OffersSlider from "../components/Home/OffersSlider";
import HowItWorks from "../components/Home/HowItWorks";
import WhyChooseUs from "../components/Home/WhyChooseUs";
import Testimonials from "../components/Home/Testimonials";
import AppBanner from "../components/Home/AppBanner";

const Home = () => {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🌟 ONE API CALL TO RULE THEM ALL
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
        setTree(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching catalog tree", error);
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  // 🌟 FLATTEN THE TREE TO GET ALL SERVICES FOR "MOST BOOKED"
  const allServices = [];
  tree.forEach((cat) => {
    cat.subCategories?.forEach((sub) => {
      sub.services?.forEach((srv) => {
        // Attach the category name for the UI card badge
        allServices.push({ ...srv, category: { name: cat.name } });
      });
    });
  });

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Spinner animation="border" style={{ color: "var(--accent-color)" }} />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#ffffff", minHeight: "100vh" }}>
      <Hero />

      <div className="pt-4 pb-2">
        <div className="container">
          <h3 className="fw-bold mt-4 px-1 text-dark">Our Services</h3>
        </div>
        <CategoryGrid />
      </div>

      {/* 🌟 OVERALL TOP SERVICES */}
      <RecommendedServices
        title="Most Booked Services"
        services={allServices.slice(0, 8)}
        badgeText="TOP RATED"
        badgeColor="#ef4444"
        bgColor="#f8fafc"
      />

      <OffersSlider />
      <HowItWorks />

      {/* 🌟 DYNAMIC CATEGORY SLIDERS */}
      <div className="pt-4" style={{ backgroundColor: "#f8fafc" }}>
        {tree.map((category, index) => {
          // Extract services just for this specific category
          const catServices = [];
          category.subCategories?.forEach((sub) => {
            sub.services?.forEach((srv) => {
              catServices.push({ ...srv, category: { name: category.name } });
            });
          });

          // Skip rendering if a category has no services yet
          if (catServices.length === 0) return null;

          // Rotate badge colors and texts to make the UI look vibrant
          const badges = ["20% OFF", "Trending", "Premium", "New Arrival"];
          const badgeText = badges[index % badges.length];
          const badgeColors = ["#ef4444", "#059669", "#8b5cf6", "#f59e0b"];
          const badgeColor = badgeColors[index % badgeColors.length];

          return (
            <RecommendedServices
              key={category._id}
              title={category.name}
              categoryId={category._id}
              services={catServices.slice(0, 6)}
              badgeText={badgeText}
              badgeColor={badgeColor}
              bgColor="#f8fafc"
            />
          );
        })}
      </div>

      <WhyChooseUs />
      <Testimonials />
      <AppBanner />
    </div>
  );
};

export default Home;
