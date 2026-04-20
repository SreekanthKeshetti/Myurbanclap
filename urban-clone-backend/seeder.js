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

// 🌟 THE SUPER-APP CATALOG DATA (With Premium Unsplash Assets & Search Tags)
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
            description:
              "Deep cleansing, brightening, and glow treatments for radiant skin.",
            video: WsaloonVid,
            features: ["Deep Cleansing", "Facial Massage", "Premium Face Pack"],
            image:
              "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
            searchTags: ["facial", "glow", "skin", "makeup", "women", "face"],
          },
          {
            name: "Manicure & Pedicure",
            price: 699,
            description:
              "Complete nail care, spa pedicure, and beautiful nail art at home.",
            video: WsaloonVid,
            features: ["Cuticle Trim", "Dead Skin Scrub", "Relaxing Massage"],
            image:
              "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=800&q=80",
            searchTags: [
              "nails",
              "mani",
              "pedi",
              "foot",
              "hand",
              "women",
              "spa",
            ],
          },
        ],
      },
      {
        name: "Men's Salon",
        services: [
          {
            name: "Haircut & Grooming",
            price: 299,
            description:
              "Professional haircut, beard trim, and grooming right at your doorstep.",
            video: MsaloonVid,
            features: ["Stylist Haircut", "Beard Shaping", "Post-Cut Cleanup"],
            image:
              "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&q=80",
            searchTags: ["hair", "cut", "beard", "shave", "men", "barber"],
          },
          {
            name: "Men's Spa & Massage",
            price: 1299,
            description:
              "Total relaxation with deep tissue and sports massage therapy.",
            video: MsaloonVid,
            features: ["Deep Tissue", "Aromatic Oil Massage", "Stress Relief"],
            image:
              "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&q=80",
            searchTags: ["massage", "spa", "relax", "body", "pain", "men"],
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
              "Advanced foam-jet technology for deeper dust and mold removal.",
            video: RepairVid,
            features: [
              "Filter Cleaning",
              "Cooling Coil Wash",
              "Gas Pressure Check",
            ],
            image:
              "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80",
            searchTags: [
              "ac",
              "air conditioner",
              "cooling",
              "service",
              "split",
            ],
          },
        ],
      },
      {
        name: "RO Water Purifier",
        services: [
          {
            name: "RO Filter Change",
            price: 899,
            description:
              "Comprehensive filter change and membrane replacement.",
            video: RepairVid,
            features: ["Pre-filter Check", "Membrane Wash", "TDS Testing"],
            image:
              "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80",
            searchTags: ["water", "ro", "purifier", "filter", "drink", "clean"],
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
            description: "Safe ceiling fan, exhaust fan fitting and wiring.",
            video: RepairVid,
            features: ["Wiring Check", "Secure Mounting", "Speed Testing"],
            image:
              "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80",
            searchTags: ["fan", "electrician", "wire", "install", "ceiling"],
          },
          {
            name: "Switchboard Repair",
            price: 149,
            description:
              "Fixing loose wiring, MCB tripping, and switch/socket issues.",
            video: RepairVid,
            features: ["Fault Diagnosis", "Minor Repairs", "Safety Check"],
            image:
              "https://images.unsplash.com/photo-1558427385-f5b2bc227d8d?w=800&q=80",
            searchTags: [
              "switch",
              "board",
              "plug",
              "electrician",
              "current",
              "power",
            ],
          },
        ],
      },
      {
        name: "Plumbing",
        services: [
          {
            name: "Tap & Pipe Repair",
            price: 199,
            description: "Fix leaking taps, pipes, drainage, and flush tanks.",
            video: CleaningVid,
            features: ["Leak Fixing", "Blockage Removal", "Seal Replacement"],
            image:
              "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&q=80",
            searchTags: [
              "plumber",
              "water",
              "leak",
              "pipe",
              "tap",
              "sink",
              "bathroom",
            ],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Daily Convenience", // Changed name slightly for a cleaner look
    icon: "FiCoffee",
    color: "#FEF3C7",
    subCategories: [
      {
        name: "Tiffin & Meals",
        services: [
          {
            name: "1-Month Veg Tiffin (Lunch)",
            price: 3000,
            description:
              "Daily home-cooked, healthy veg meal delivery right to your desk or home.",
            bookingType: "subscription",
            video: "",
            features: [
              "4 Roti, Sabzi, Dal, Rice",
              "Free Daily Delivery",
              "Hygienic Packing",
            ],
            image:
              "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&q=80",
            searchTags: [
              "food",
              "tiffin",
              "meal",
              "lunch",
              "subscription",
              "veg",
              "eat",
            ],
          },
        ],
      },
      {
        name: "Milk & Groceries",
        services: [
          {
            name: "Daily Milk Subscription (1L)",
            price: 1800,
            description:
              "Fresh farm milk delivered daily to your doorstep before 7 AM.",
            bookingType: "subscription",
            video: "",
            features: ["A2 Cow Milk", "No Preservatives", "Doorstep Drop"],
            image:
              "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80",
            searchTags: ["milk", "dairy", "morning", "subscription", "grocery"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Pet Services",
    icon: "FiSmile",
    color: "#F3E8FF",
    subCategories: [
      {
        name: "Pet Grooming",
        services: [
          {
            name: "Dog Grooming at Home",
            price: 999,
            description:
              "Stress-free bath, trim, and nail clipping at your doorstep.",
            video: "",
            features: ["Anti-Tick Bath", "Nail Clipping", "Ear Cleaning"],
            image:
              "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&q=80",
            searchTags: ["dog", "cat", "pet", "wash", "groom", "bath"],
          },
        ],
      },
      {
        name: "Dog Walking",
        services: [
          {
            name: "Monthly Dog Walker",
            price: 2500,
            description:
              "Daily structured walks by verified and loving pet walkers.",
            bookingType: "subscription",
            video: "",
            features: ["30 Min Walk", "Verified Walker", "GPS Tracking"],
            image:
              "https://images.unsplash.com/photo-1601614407865-c30d9cb5250e?w=800&q=80",
            searchTags: ["dog", "walk", "pet", "subscription", "exercise"],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Health & Wellness",
    icon: "FiActivity",
    color: "#E0F2FE",
    subCategories: [
      {
        name: "Home Doctor",
        services: [
          {
            name: "GP Visit at Home",
            price: 799,
            description:
              "General physician house call for basic checkups and prescriptions.",
            video: "",
            features: ["Vitals Check", "Prescription", "Consultation"],
            image:
              "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80",
            searchTags: [
              "doctor",
              "health",
              "sick",
              "fever",
              "medical",
              "clinic",
            ],
          },
        ],
      },
      {
        name: "Elder Care",
        services: [
          {
            name: "Elder Care Attendant (12 Hours)",
            price: 1200,
            description:
              "Trained and empathetic companion/caretaker for seniors.",
            video: "",
            features: [
              "Medication Tracking",
              "Assisted Mobility",
              "Feeding & Bathing",
            ],
            image:
              "https://images.unsplash.com/photo-1576765608532-073901bc095f?w=800&q=80",
            searchTags: [
              "elder",
              "old",
              "care",
              "nurse",
              "attendant",
              "senior",
            ],
          },
        ],
      },
    ],
  },
  {
    categoryName: "Events & Celebrations",
    icon: "FiStar",
    color: "#FFEDD5",
    subCategories: [
      {
        name: "Pandit Booking",
        services: [
          {
            name: "Gruh Pravesh Puja",
            price: 2100,
            description:
              "Complete puja setup with an experienced, verified Pandit.",
            video: "",
            features: ["Samagri Included", "2-Hour Ceremony", "Vedic Chants"],
            image:
              "https://images.unsplash.com/photo-1604931668626-ab49cb27dceb?w=800&q=80",
            searchTags: [
              "puja",
              "pandit",
              "house",
              "warming",
              "event",
              "god",
              "pray",
            ],
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
            bookingType: srvData.bookingType || "one-time",
            features: srvData.features,
            searchTags: srvData.searchTags || [], // 🌟 Search Tags Inserted!
            image: srvData.image, // 🌟 HD Image Inserted!
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

    // 4. Create a Sample Provider (Using ObjectIds)
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
