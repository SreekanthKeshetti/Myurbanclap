import React, { useRef } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, useScroll, useTransform } from "framer-motion";

const ParallaxCTA = () => {
  const ref = useRef(null);

  // 1. Track scroll progress of this specific section
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"], // Start animation when section enters viewport
  });

  // 2. Create the Parallax Effect (Image moves slower than scroll)
  // "y" moves from -20% to 20% as we scroll, creating the "Window" illusion
  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <section style={{ overflow: "hidden" }}>
      {" "}
      {/* Container to prevent scrollbar issues */}
      {/* The Animate Wrapper: Handles the Zoom Out on Hover */}
      <motion.div
        ref={ref}
        className="parallax-wrapper"
        initial="rest"
        whileHover="hover"
        animate="rest"
      >
        {/* The Background Image with Parallax Movement */}
        <motion.div
          style={{
            y, // Apply the parallax scroll effect
            position: "absolute",
            top: "-20%", // Start slightly higher to allow movement
            left: 0,
            width: "100%",
            height: "140%", // Taller than container to allow parallax movement
            zIndex: 0,
          }}
          variants={{
            rest: { scale: 1.1 }, // Default zoom
            hover: { scale: 1.0 }, // Zoom out effect on hover
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <img
            src="https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop"
            alt="Luxury Interior"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </motion.div>

        {/* Dark Overlay */}
        <div className="parallax-overlay"></div>

        {/* Text Content */}
        <motion.div
          className="parallax-content"
          variants={{
            rest: { scale: 1 },
            hover: { scale: 0.95 }, // Text also shrinks slightly for depth
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          <h2 className="parallax-title">
            Transform your home <br /> into a sanctuary.
          </h2>
          <p className="fs-5 mb-4 text-white-50">
            Premium painting, waterproofing, and interior styling services.
          </p>
          <button className="btn-white-glass">Book Consultation</button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ParallaxCTA;
