const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

// Import Models
const Category = require("./models/Category");
const SubCategory = require("./models/SubCategory");
const Service = require("./models/Service");
const User = require("./models/User");
const PromoCode = require("./models/PromoCode");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

// 🌟 VIDEO CDN LINKS
const CleaningVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197783/Bathroom_noxaqn.mp4";
const RepairVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197731/Electrician_iuzzup.mp4";
const WsaloonVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197780/WomenSaloon_to4fc2.mp4";
const MsaloonVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197757/MensSaloon_fg1igx.mp4";

// 🌟 THE SUPER-APP CATALOG DATA (Blue + Brown Lists)
const catalogData = [
  {
    categoryName: "Beauty & Wellness",
    icon: "FiHeart",
    color: "#FDF2F8",
    subCategories: [
      {
        name: "Women's Salon",
        services: [
          {
            name: "Facial & Cleanup",
            price: 999,
            description: "Deep cleansing, brightening, glow treatments.",
            video: WsaloonVid,
            features: ["Deep Cleansing", "Massage", "Face Pack"],
          },
          {
            name: "Manicure & Pedicure",
            price: 699,
            description: "Nail care, spa pedicure, nail art.",
            video: WsaloonVid,
            features: ["Cuticle Trim", "Scrub", "Massage"],
          },
        ],
      },
      {
        name: "Men's Salon",
        services: [
          {
            name: "Haircut & Grooming",
            price: 299,
            description: "Haircut, beard trim, grooming at home.",
            video: MsaloonVid,
            features: ["Haircut", "Beard Styling", "Cleanup"],
          },
          {
            name: "Men's Spa & Massage",
            price: 1299,
            description: "Relaxation, deep tissue, sports massage.",
            video: MsaloonVid,
            features: ["Deep Tissue", "Oil Massage", "Stress Relief"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Appliance Repair",
    icon: "FiCpu",
    color: "#ECFDF5",
    subCategories: [
      {
        name: "AC Repair",
        services: [
          {
            name: "Split AC Service",
            price: 599,
            description:
              "Advanced foam-jet technology for deeper dust removal.",
            video: RepairVid,
            features: ["Filter Cleaning", "Cooling Coil", "Gas Check"],
          },
        ],
      },
      {
        name: "RO Water Purifier",
        services: [
          {
            name: "RO Filter Change",
            price: 899,
            description: "Filter change, membrane replacement.",
            video: RepairVid,
            features: ["Pre-filter Check", "Membrane Wash"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Home Trades",
    icon: "FiTool",
    color: "#FFFBEB",
    subCategories: [
      {
        name: "Electrician",
        services: [
          {
            name: "Fan Installation",
            price: 199,
            description: "Ceiling fan, exhaust fan fitting.",
            video: RepairVid,
            features: ["Wiring Check", "Mounting"],
          },
          {
            name: "Switchboard Repair",
            price: 149,
            description: "Wiring, MCB, switch/socket.",
            video: RepairVid,
            features: ["Fault Diagnosis", "Minor Repairs"],
          },
        ],
      },
      {
        name: "Plumbing",
        services: [
          {
            name: "Tap & Pipe Repair",
            price: 199,
            description: "Tap, pipe, drainage, flush tank.",
            video: CleaningVid,
            features: ["Leak Fixing", "Blockage Removal"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Daily Convenience (Subscriptions)", // 🌟 THE GAP SERVICES (BROWN)
    icon: "FiCoffee",
    color: "#FEF3C7",
    subCategories: [
      {
        name: "Tiffin & Meals",
        services: [
          {
            name: "1-Month Veg Tiffin (Lunch)",
            price: 3000,
            description: "Daily home-cooked meal delivery.",
            bookingType: "subscription",
            video: "",
            features: ["Roti, Sabzi, Dal, Rice", "Free Delivery"],
          },
        ],
      },
      {
        name: "Milk & Groceries",
        services: [
          {
            name: "Daily Milk Subscription (1L/Day)",
            price: 1800,
            description: "Fresh farm milk delivered daily at 6 AM.",
            bookingType: "subscription",
            video: "",
            features: ["A2 Cow Milk", "No Preservatives"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Pet Services", // 🌟 THE GAP SERVICES (BROWN)
    icon: "FiSmile",
    color: "#F3E8FF",
    subCategories: [
      {
        name: "Pet Grooming",
        services: [
          {
            name: "Dog Grooming at Home",
            price: 999,
            description: "Bath, trim, nail clipping at doorstep.",
            video: "",
            features: ["Anti-Tick Bath", "Nail Clipping", "Ear Cleaning"],
          },
        ],
      },
      {
        name: "Dog Walking",
        services: [
          {
            name: "Monthly Dog Walker",
            price: 2500,
            description: "Daily walks by verified walkers.",
            bookingType: "subscription",
            video: "",
            features: ["30 Min Walk", "Verified Walker"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Health & Wellness", // 🌟 THE GAP SERVICES (BROWN)
    icon: "FiActivity",
    color: "#E0F2FE",
    subCategories: [
      {
        name: "Home Doctor",
        services: [
          {
            name: "GP Visit at Home",
            price: 799,
            description: "General physician house call.",
            video: "",
            features: ["Vitals Check", "Prescription", "Consultation"],
          },
        ],
      },
      {
        name: "Elder Care",
        services: [
          {
            name: "Elder Care Attendant (12 Hours)",
            price: 1200,
            description: "Trained companion/caretaker for seniors.",
            video: "",
            features: ["Medication Tracking", "Assisted Mobility", "Feeding"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Events & Celebrations", // 🌟 THE GAP SERVICES (BROWN)
    icon: "FiStar",
    color: "#FFEDD5",
    subCategories: [
      {
        name: "Pandit Booking",
        services: [
          {
            name: "Gruh Pravesh Puja",
            price: 2100,
            description: "Complete puja setup with experienced Pandit.",
            video: "",
            features: ["Samagri Included", "2-Hour Ceremony"],
          },
        ],
      },
    ],
  },
];

const importData = async () => {
  try {
    // 1. Wipe everything clean
    await Category.deleteMany();
    await SubCategory.deleteMany();
    await Service.deleteMany();
    await User.deleteMany();
    await PromoCode.deleteMany();
    console.log("🗑️  Old Data Destroyed...");

    // 2. Create the Hierarchy
    for (const catData of catalogData) {
      // Create Category
      const newCategory = await Category.create({
        name: catData.categoryName,
        icon: catData.icon,
        color: catData.color,
      });

      for (const subData of catData.subCategories) {
        // Create SubCategory and link to Category
        const newSubCategory = await SubCategory.create({
          name: subData.name,
          parentCategory: newCategory._id,
        });

        // Create Services and link to BOTH Category and SubCategory
        for (const srvData of subData.services) {
          await Service.create({
            name: srvData.name,
            category: newCategory._id, // 🔗 Linked!
            subCategory: newSubCategory._id, // 🔗 Linked!
            description: srvData.description,
            price: srvData.price,
            video: srvData.video,
            bookingType: srvData.bookingType || "one-time", // 🔗 Subscriptions Handled!
            features: srvData.features,
            image:
              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=800", // Generic fallback image
          });
        }
      }
    }
    console.log("✅ Super-App Catalog Tree Imported Successfully!");

    // 3. Create Admin
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash("password123", salt);
    await User.create({
      name: "Super Admin",
      email: "admin@urban.com",
      phone: "0000000000",
      password: adminHash,
      role: "admin",
    });

    // 4. Create a Sample Provider (We don't hardcode category strings anymore!)
    // const providerHash = await bcrypt.hash("123456", salt);
    // await User.create({
    //   name: "Ramesh Services",
    //   email: "partner@urban.com",
    //   phone: "9876543210",
    //   password: providerHash,
    //   role: "provider",
    //   geoLocation: { type: "Point", coordinates: [78.4867, 17.385] },
    //   providerDetails: {
    //     // Note: For now we leave category as a string in User profile for simplicity,
    //     // we can upgrade the Provider schema to link to Category later.
    //     category: "Plumbing",
    //     experience: 5,
    //     isAvailable: true,
    //     isVerified: true,
    //     verificationStatus: "approved",
    //   },
    // });
    // 4. Create a Sample Provider (🌟 FIXED: Using ObjectIds instead of Strings!)
    const providerHash = await bcrypt.hash("123456", salt);

    // Find the exact categories we just generated above
    const homeTradesCat = await Category.findOne({ name: "Home Trades" });
    const plumbingSub = await SubCategory.findOne({ name: "Plumbing" });

    await User.create({
      name: "Ramesh Services",
      email: "partner@urban.com",
      phone: "9876543210",
      password: providerHash,
      role: "provider",
      geoLocation: { type: "Point", coordinates: [78.4867, 17.385] },
      providerDetails: {
        category: homeTradesCat._id, // 🔗 Linked to Category ID
        subCategory: plumbingSub._id, // 🔗 Linked to SubCategory ID
        experience: 5,
        isAvailable: true,
        isVerified: true,
        verificationStatus: "approved",
      },
    });

    // 5. Create Promos
    await PromoCode.create([
      {
        code: "WELCOME50",
        discountType: "flat",
        discountValue: 50,
        minOrderValue: 200,
        expiryDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ),
      },
    ]);

    console.log("🚀 ALL USERS & PROMOS IMPORTED SUCCESSFULLY!");
    process.exit();
  } catch (error) {
    console.error("❌ Error with data import:", error);
    process.exit(1);
  }
};

importData();
