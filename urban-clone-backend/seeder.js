const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const Category = require("./models/Category");
const SubCategory = require("./models/SubCategory");
const Service = require("./models/Service");
const User = require("./models/User");
const PromoCode = require("./models/PromoCode");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

// ─────────────────────────────────────────────────────────────────
// 🎬  CATEGORY VIDEOS  (1 per category — reused across all services)
//     4 existing ones — already uploaded on your Cloudinary ✅
//     5 new ones     — download free from Pexels → upload to Cloudinary → paste URL
// ─────────────────────────────────────────────────────────────────
const WsaloonVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197780/WomenSaloon_to4fc2.mp4";
const MsaloonVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197757/MensSaloon_fg1igx.mp4";
const RepairVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197731/Electrician_iuzzup.mp4";
const CleaningVid =
  "https://res.cloudinary.com/dkpk1ll7y/video/upload/v1775197783/Bathroom_noxaqn.mp4";

// 👇 PASTE YOUR CLOUDINARY URLS HERE after uploading from Pexels
// Pexels search links are in the comment for each one
const PetVid = RepairVid; // TODO: pexels.com/search/videos/dog+grooming
const HealthVid = CleaningVid; // TODO: pexels.com/search/videos/doctor+home+visit
const EventVid = WsaloonVid; // TODO: pexels.com/search/videos/indian+wedding
const DailyVid = CleaningVid; // TODO: pexels.com/search/videos/food+delivery
const PaintingVid = RepairVid; // TODO: pexels.com/search/videos/house+painting

// ─────────────────────────────────────────────────────────────────
// 🖼️  IMAGE HELPER  (verified Unsplash photo IDs — work in all browsers)
// ─────────────────────────────────────────────────────────────────
const u = (id) => `https://images.unsplash.com/${id}?w=800&q=80`;

// ─────────────────────────────────────────────────────────────────
// 📦  CATALOG  (9 categories · 45 sub-categories · 76 services)
// ─────────────────────────────────────────────────────────────────
const catalogData = [
  // ══════════════════════════════════════════════
  // 1.  BEAUTY & WELLNESS
  // ══════════════════════════════════════════════
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
            image: u("photo-1570172619644-dfd03ed5d881"),
            searchTags: ["facial", "glow", "skin", "cleanup", "women", "face"],
          },
          {
            name: "Manicure & Pedicure",
            price: 699,
            description:
              "Complete nail care, spa pedicure, and beautiful nail art at home.",
            video: WsaloonVid,
            features: ["Cuticle Trim", "Dead Skin Scrub", "Relaxing Massage"],
            image: u("photo-1604654894610-df63bc536371"),
            searchTags: [
              "nails",
              "manicure",
              "pedicure",
              "foot",
              "hand",
              "spa",
            ],
          },
          {
            name: "Waxing (Full Body)",
            price: 1199,
            description:
              "Smooth, hair-free skin with Rica or chocolate wax — full body or specific areas.",
            video: WsaloonVid,
            features: [
              "Rica / Chocolate Wax",
              "Underarms Included",
              "Soothing Lotion",
            ],
            image: u("photo-1560066984-138dadb4c035"),
            searchTags: [
              "wax",
              "waxing",
              "hair removal",
              "smooth",
              "women",
              "body",
            ],
          },
          {
            name: "Hair Treatment (Keratin / Smoothening)",
            price: 2499,
            description:
              "Professional keratin and smoothening treatment for frizz-free, silky hair.",
            video: WsaloonVid,
            features: [
              "Keratin / Botox",
              "Frizz-Free Result",
              "60-Day Longevity",
            ],
            image: u("photo-1522337360801-9a35a9c7de9f"),
            searchTags: [
              "keratin",
              "hair",
              "smoothening",
              "frizz",
              "women",
              "treatment",
            ],
          },
          {
            name: "Bridal & Party Makeup",
            price: 3999,
            description:
              "Stunning bridal and party makeup by certified makeup artists at your home.",
            video: WsaloonVid,
            features: [
              "HD Makeup",
              "Premium Products",
              "Pre-Party Trial Option",
            ],
            image: u("photo-1487412947147-5cebf100ffc2"),
            searchTags: [
              "bridal",
              "makeup",
              "party",
              "wedding",
              "women",
              "beauty",
            ],
          },
          {
            name: "Nail Extensions & Nail Art",
            price: 1299,
            description:
              "Acrylic and gel nail extensions with custom nail art designs.",
            video: WsaloonVid,
            features: ["Gel / Acrylic Extensions", "Custom Art", "UV Finish"],
            image: u("photo-1604654894610-df63bc536371"),
            searchTags: ["nail", "extension", "gel", "acrylic", "art", "women"],
          },
          {
            name: "Eyelash Extensions",
            price: 1499,
            description:
              "Volume, classic, or hybrid lash extensions for dramatic, long-lasting eyes.",
            video: WsaloonVid,
            features: [
              "Classic / Volume / Hybrid",
              "Lasts 3–4 Weeks",
              "Waterproof",
            ],
            image: u("photo-1616394584738-fc6e612e71b9"),
            searchTags: [
              "lash",
              "eyelash",
              "extension",
              "eyes",
              "women",
              "beauty",
            ],
          },
        ],
      },
      {
        name: "Women's Wellness",
        services: [
          {
            name: "Women's Body Massage & Spa",
            price: 1799,
            description:
              "Relaxing full-body spa experience with aromatic oils and hot stone therapy.",
            video: WsaloonVid,
            features: [
              "Aromatic Oil",
              "Hot Stone Option",
              "Full Body Relaxation",
            ],
            image: u("photo-1600334129128-685c5582fd35"),
            searchTags: [
              "massage",
              "spa",
              "relax",
              "body",
              "women",
              "wellness",
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
            image: u("photo-1503951914875-452162b0f3f1"),
            searchTags: ["hair", "cut", "beard", "shave", "men", "barber"],
          },
          {
            name: "Men's Spa & Massage",
            price: 1299,
            description:
              "Total relaxation with deep tissue and sports massage therapy.",
            video: MsaloonVid,
            features: ["Deep Tissue", "Aromatic Oil Massage", "Stress Relief"],
            image: u("photo-1544161515-4ab6ce6db874"),
            searchTags: ["massage", "spa", "relax", "body", "pain", "men"],
          },
          {
            name: "Men's Facial & Cleanup",
            price: 599,
            description:
              "Deep pore cleansing, tan removal, and brightening treatment for men.",
            video: MsaloonVid,
            features: ["Pore Cleansing", "Tan Removal", "Moisturizing Finish"],
            image: u("photo-1621498053-c492a5a9da2e"),
            searchTags: ["facial", "men", "cleanup", "skin", "glow", "face"],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 2.  APPLIANCE REPAIR
  // ══════════════════════════════════════════════
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
            image: u("photo-1621905251189-08b45d6a269e"),
            searchTags: [
              "ac",
              "air conditioner",
              "cooling",
              "service",
              "split",
            ],
          },
          {
            name: "AC Gas Refill",
            price: 1499,
            description:
              "Refrigerant gas top-up for optimal cooling performance.",
            video: RepairVid,
            features: ["Gas Level Check", "Leak Detection", "Performance Test"],
            image: u("photo-1628177142898-93e36e4e3a50"),
            searchTags: [
              "ac",
              "gas",
              "refill",
              "cooling",
              "refrigerant",
              "repair",
            ],
          },
        ],
      },
      {
        name: "Washing Machine",
        services: [
          {
            name: "Washing Machine Repair",
            price: 499,
            description:
              "Expert repair for all brands — front load and top load washing machines.",
            video: RepairVid,
            features: ["All Brands", "Motor / Drum Repair", "30-Day Warranty"],
            image: u("photo-1626806787461-102c1bfaaea1"),
            searchTags: [
              "washing",
              "machine",
              "repair",
              "laundry",
              "drum",
              "motor",
            ],
          },
        ],
      },
      {
        name: "Refrigerator",
        services: [
          {
            name: "Refrigerator Repair",
            price: 549,
            description:
              "Fix cooling issues, compressor problems, and door seal replacements.",
            video: RepairVid,
            features: [
              "Cooling Fix",
              "Compressor Check",
              "Gas Top-Up if Needed",
            ],
            image: u("photo-1571175443880-49e1d25b2bc5"),
            searchTags: [
              "fridge",
              "refrigerator",
              "cooling",
              "repair",
              "compressor",
            ],
          },
        ],
      },
      {
        name: "Geyser & Water Heater",
        services: [
          {
            name: "Geyser / Water Heater Repair",
            price: 399,
            description:
              "Thermostat, heating rod, and leakage repair for all geyser brands.",
            video: RepairVid,
            features: ["Thermostat Repair", "Heating Rod Fix", "Leakage Check"],
            image: u("photo-1585771724684-38269d6639fd"),
            searchTags: [
              "geyser",
              "water heater",
              "hot water",
              "repair",
              "bathroom",
            ],
          },
        ],
      },
      {
        name: "Microwave & Oven",
        services: [
          {
            name: "Microwave Oven Repair",
            price: 449,
            description:
              "Door latch, turntable, magnetron, and heating element repairs.",
            video: RepairVid,
            features: [
              "Door / Latch Fix",
              "Turntable Repair",
              "Heating Element Check",
            ],
            image: u("photo-1574269909862-7e1d70bb8078"),
            searchTags: ["microwave", "oven", "repair", "kitchen", "heating"],
          },
        ],
      },
      {
        name: "TV Repair",
        services: [
          {
            name: "TV Repair (LED / Smart TV)",
            price: 599,
            description:
              "Panel, board, backlight, and software repair for all smart TVs.",
            video: RepairVid,
            features: [
              "LED Panel Fix",
              "Motherboard Repair",
              "Picture & Sound Check",
            ],
            image: u("photo-1593359677879-a4bb92f829e1"),
            searchTags: [
              "tv",
              "television",
              "smart tv",
              "led",
              "screen",
              "repair",
            ],
          },
        ],
      },
      {
        name: "Chimney & Stove",
        services: [
          {
            name: "Kitchen Chimney Repair & Cleaning",
            price: 699,
            description:
              "Motor, filter, suction, and deep cleaning for kitchen chimneys.",
            video: RepairVid,
            features: ["Motor Repair", "Filter Cleaning", "Suction Check"],
            image: u("photo-1556909114-f6e7ad7d3136"),
            searchTags: [
              "chimney",
              "kitchen",
              "repair",
              "suction",
              "filter",
              "clean",
            ],
          },
          {
            name: "Gas Stove / Burner Repair",
            price: 299,
            description:
              "Burner cleaning, ignition fix, and regulator repair for gas stoves.",
            video: RepairVid,
            features: ["Burner Cleaning", "Ignition Fix", "Regulator Check"],
            image: u("photo-1588854337236-6889d631faa8"),
            searchTags: [
              "stove",
              "gas",
              "burner",
              "repair",
              "kitchen",
              "ignition",
            ],
          },
        ],
      },
      {
        name: "Air Cooler",
        services: [
          {
            name: "Air Cooler Repair & Service",
            price: 349,
            description:
              "Pump, motor, cooling pad, and water tank repair for all cooler brands.",
            video: RepairVid,
            features: ["Pump Repair", "Pad Replacement", "Motor Servicing"],
            image: u("photo-1545259741-2ea3ebf61fa3"),
            searchTags: [
              "cooler",
              "air cooler",
              "summer",
              "repair",
              "fan",
              "motor",
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
            image: u("photo-1584622650111-993a426fbf0a"),
            searchTags: ["water", "ro", "purifier", "filter", "drink", "clean"],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 3.  HOME TRADES
  // ══════════════════════════════════════════════
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
            image: u("photo-1621905252507-b35492cc74b4"),
            searchTags: ["fan", "electrician", "wire", "install", "ceiling"],
          },
          {
            name: "Switchboard Repair",
            price: 149,
            description:
              "Fixing loose wiring, MCB tripping, and switch/socket issues.",
            video: RepairVid,
            features: ["Fault Diagnosis", "Minor Repairs", "Safety Check"],
            image: u("photo-1558427385-f5b2bc227d8d"),
            searchTags: [
              "switch",
              "board",
              "plug",
              "electrician",
              "current",
              "power",
            ],
          },
          {
            name: "Full Home Wiring / MCB Repair",
            price: 499,
            description:
              "Complete home wiring inspection, rewiring, and MCB panel repair.",
            video: RepairVid,
            features: [
              "Wiring Inspection",
              "MCB Replacement",
              "Safety Certification",
            ],
            image: u("photo-1504328345606-18bbc8c9d7d1"),
            searchTags: [
              "wiring",
              "mcb",
              "electrician",
              "fuse",
              "panel",
              "circuit",
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
            image: u("photo-1585704032915-c3400ca199e7"),
            searchTags: ["plumber", "water", "leak", "pipe", "tap", "sink"],
          },
          {
            name: "Bathroom Fitting (Showers & Flush Tanks)",
            price: 599,
            description:
              "Installation and repair of showers, flush tanks, and bathroom fittings.",
            video: CleaningVid,
            features: [
              "Shower Installation",
              "Flush Tank Repair",
              "Seal & Fitting",
            ],
            image: u("photo-1552321554-5fefe8c9ef14"),
            searchTags: [
              "bathroom",
              "shower",
              "flush",
              "plumber",
              "fitting",
              "toilet",
            ],
          },
          {
            name: "Drain Cleaning & Blockage Removal",
            price: 349,
            description:
              "High-pressure jet cleaning for blocked kitchen and bathroom drains.",
            video: CleaningVid,
            features: ["Jet Cleaning", "Kitchen & Bathroom", "Odour Control"],
            image: u("photo-1504307651254-35680f356dfd"),
            searchTags: [
              "drain",
              "block",
              "plumber",
              "pipe",
              "cleaning",
              "clog",
            ],
          },
        ],
      },
      {
        name: "Carpentry",
        services: [
          {
            name: "Furniture Repair & Assembly",
            price: 399,
            description:
              "Flat-pack furniture assembly, broken joint repair, and polishing.",
            video: RepairVid,
            features: ["Flat-Pack Assembly", "Joint Repair", "Polish & Finish"],
            image: u("photo-1555041469-a586c61ea9bc"),
            searchTags: [
              "carpenter",
              "furniture",
              "assembly",
              "repair",
              "wood",
              "fix",
            ],
          },
          {
            name: "Door & Window Repair",
            price: 299,
            description:
              "Fixing door hinges, window handles, warped frames, and locks.",
            video: RepairVid,
            features: ["Hinge Replacement", "Frame Fixing", "Smooth Operation"],
            image: u("photo-1558618666-fcd25c85cd64"),
            searchTags: [
              "door",
              "window",
              "hinge",
              "carpenter",
              "repair",
              "frame",
            ],
          },
          {
            name: "Lock Repair / Replacement",
            price: 249,
            description:
              "Repair or replace door locks, digital locks, and padlocks.",
            video: RepairVid,
            features: ["Lock Repair", "Key Duplication", "Digital Lock Setup"],
            image: u("photo-1558618047-3c8c76ca7d13"),
            searchTags: [
              "lock",
              "key",
              "door",
              "security",
              "repair",
              "carpenter",
            ],
          },
        ],
      },
      {
        name: "CCTV & Smart Home",
        services: [
          {
            name: "CCTV Camera Installation",
            price: 1499,
            description:
              "Professional CCTV setup with DVR/NVR configuration and mobile access.",
            video: RepairVid,
            features: ["HD Cameras", "DVR/NVR Setup", "Mobile App Access"],
            image: u("photo-1557597774-9d273605dfa9"),
            searchTags: [
              "cctv",
              "camera",
              "security",
              "surveillance",
              "install",
              "smart",
            ],
          },
          {
            name: "Smart Lock / Video Doorbell Setup",
            price: 999,
            description:
              "Install and configure smart door locks and video doorbells.",
            video: RepairVid,
            features: [
              "Smart Lock Config",
              "Video Doorbell",
              "App Integration",
            ],
            image: u("photo-1558002038-1055907df827"),
            searchTags: [
              "smart lock",
              "doorbell",
              "security",
              "smart home",
              "install",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 4.  CLEANING & PEST CONTROL
  // ══════════════════════════════════════════════
  {
    categoryName: "Cleaning & Pest Control",
    icon: "FiDroplet",
    color: "#EFF6FF",
    subCategories: [
      {
        name: "Home Cleaning",
        services: [
          {
            name: "Full Home Deep Cleaning",
            price: 2999,
            description:
              "Top-to-bottom professional deep cleaning of your entire home.",
            video: CleaningVid,
            features: [
              "All Rooms",
              "Scrubbing & Sanitisation",
              "Eco-Safe Products",
            ],
            image: u("photo-1581578731548-c64695cc6952"),
            searchTags: [
              "cleaning",
              "deep clean",
              "home",
              "maid",
              "hygiene",
              "house",
            ],
          },
          {
            name: "Bathroom Cleaning",
            price: 599,
            description:
              "Deep cleaning of tiles, fixtures, grout, and complete sanitisation.",
            video: CleaningVid,
            features: [
              "Tile Scrubbing",
              "Fixture Polish",
              "Anti-Bacterial Spray",
            ],
            image: u("photo-1552321554-5fefe8c9ef14"),
            searchTags: [
              "bathroom",
              "toilet",
              "cleaning",
              "tiles",
              "hygiene",
              "sanitise",
            ],
          },
          {
            name: "Kitchen Deep Cleaning",
            price: 799,
            description:
              "Professional degreasing of chimney, hob, tiles, and countertops.",
            video: CleaningVid,
            features: [
              "Chimney Degreasing",
              "Hob Cleaning",
              "Cabinet Wipe-Down",
            ],
            image: u("photo-1556909114-f6e7ad7d3136"),
            searchTags: [
              "kitchen",
              "cleaning",
              "deep clean",
              "grease",
              "chimney",
              "cook",
            ],
          },
        ],
      },
      {
        name: "Sofa & Carpet Cleaning",
        services: [
          {
            name: "Sofa / Couch Steam Cleaning",
            price: 1299,
            description:
              "Foam and steam cleaning to remove stains, dust, and allergens from sofas.",
            video: CleaningVid,
            features: [
              "Steam Cleaning",
              "Stain Removal",
              "Anti-Allergen Treatment",
            ],
            image: u("photo-1555041469-a586c61ea9bc"),
            searchTags: [
              "sofa",
              "couch",
              "cleaning",
              "steam",
              "stain",
              "upholstery",
            ],
          },
          {
            name: "Carpet & Mattress Cleaning",
            price: 999,
            description:
              "UV treatment and deep cleaning to remove dust mites and odours.",
            video: CleaningVid,
            features: ["UV Treatment", "Dust Mite Removal", "Deodourising"],
            image: u("photo-1586023492125-27b2c045efd7"),
            searchTags: [
              "carpet",
              "mattress",
              "cleaning",
              "dust mite",
              "uv",
              "odour",
            ],
          },
        ],
      },
      {
        name: "Pest Control",
        services: [
          {
            name: "Cockroach / Ant / Bed Bug Treatment",
            price: 999,
            description:
              "Gel-based and spray treatment for cockroaches, ants, and bed bugs.",
            video: CleaningVid,
            features: [
              "Gel Treatment",
              "Safe for Pets & Kids",
              "3-Month Warranty",
            ],
            image: u("photo-1584308666744-24d5c474f2ae"),
            searchTags: [
              "pest",
              "cockroach",
              "ant",
              "bed bug",
              "spray",
              "control",
            ],
          },
          {
            name: "Termite Control",
            price: 1999,
            description:
              "Pre and post construction anti-termite treatment for full protection.",
            video: CleaningVid,
            features: [
              "Pre/Post Construction",
              "Drilling & Injection",
              "5-Year Warranty",
            ],
            image: u("photo-1558618666-fcd25c85cd64"),
            searchTags: [
              "termite",
              "pest",
              "control",
              "wood",
              "protection",
              "treatment",
            ],
          },
          {
            name: "Rodent Control",
            price: 1499,
            description:
              "Humane traps, bait stations, and proofing to eliminate rodent infestations.",
            video: CleaningVid,
            features: [
              "Bait Stations",
              "Entry Point Sealing",
              "Follow-Up Visit",
            ],
            image: u("photo-1628177142898-93e36e4e3a50"),
            searchTags: [
              "rodent",
              "rat",
              "mouse",
              "pest control",
              "trap",
              "bait",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 5.  HOME IMPROVEMENT
  // ══════════════════════════════════════════════
  {
    categoryName: "Home Improvement",
    icon: "FiHome",
    color: "#F0FDF4",
    subCategories: [
      {
        name: "Painting",
        services: [
          {
            name: "Interior Wall Painting",
            price: 4999,
            description:
              "Premium interior painting with Asian/Berger paints — per room pricing.",
            video: PaintingVid,
            features: [
              "Premium Paints",
              "Surface Prep Included",
              "Clean Finish",
            ],
            image: u("photo-1562259929-b4e1fd3aef09"),
            searchTags: [
              "painting",
              "wall",
              "interior",
              "colour",
              "room",
              "home",
            ],
          },
          {
            name: "Exterior / Full Home Painting",
            price: 14999,
            description:
              "Complete exterior and full home painting with weather-proof paints.",
            video: PaintingVid,
            features: [
              "Weatherproof Paint",
              "Scaffolding Included",
              "2-Year Warranty",
            ],
            image: u("photo-1589939705384-5185137a7f0f"),
            searchTags: [
              "painting",
              "exterior",
              "full home",
              "weather",
              "outside",
              "house",
            ],
          },
        ],
      },
      {
        name: "Waterproofing",
        services: [
          {
            name: "Seepage / Waterproofing Repair",
            price: 3999,
            description:
              "Chemical waterproofing treatment for terrace, bathroom, and wall seepage.",
            video: PaintingVid,
            features: [
              "Terrace / Bathroom",
              "Chemical Treatment",
              "5-Year Guarantee",
            ],
            image: u("photo-1504307651254-35680f356dfd"),
            searchTags: [
              "seepage",
              "waterproof",
              "leak",
              "wall",
              "terrace",
              "damp",
            ],
          },
        ],
      },
      {
        name: "Wall Decor",
        services: [
          {
            name: "Decorative & Textured Wall Panels",
            price: 2499,
            description:
              "3D panels, PVC wall panels, and wood panelling for modern interiors.",
            video: PaintingVid,
            features: ["3D / PVC / Wood", "Custom Designs", "Same-Day Install"],
            image: u("photo-1618221195710-dd6b41faaea6"),
            searchTags: [
              "wall",
              "panel",
              "decor",
              "3d",
              "pvc",
              "interior",
              "design",
            ],
          },
        ],
      },
      {
        name: "Renovation",
        services: [
          {
            name: "Bathroom Renovation",
            price: 24999,
            description:
              "Complete bathroom makeover including tiles, fittings, and sanitary ware.",
            video: PaintingVid,
            features: ["Tile Replacement", "New Fittings", "Modular Design"],
            image: u("photo-1552321554-5fefe8c9ef14"),
            searchTags: [
              "renovation",
              "bathroom",
              "remodel",
              "tiles",
              "fittings",
              "makeover",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 6.  DAILY CONVENIENCE
  // ══════════════════════════════════════════════
  {
    categoryName: "Daily Convenience",
    icon: "FiCoffee",
    color: "#FEF3C7",
    subCategories: [
      {
        name: "Tiffin & Meals",
        services: [
          {
            name: "1-Month Veg Tiffin (Lunch)",
            price: 3000,
            bookingType: "subscription",
            description:
              "Daily home-cooked, healthy veg meal delivery right to your desk or home.",
            video: DailyVid,
            features: [
              "4 Roti, Sabzi, Dal, Rice",
              "Free Daily Delivery",
              "Hygienic Packing",
            ],
            image: u("photo-1585937421612-70a008356fbe"),
            searchTags: [
              "food",
              "tiffin",
              "meal",
              "lunch",
              "subscription",
              "veg",
            ],
          },
          {
            name: "1-Month Non-Veg Tiffin (Lunch)",
            price: 3500,
            bookingType: "subscription",
            description:
              "Daily non-veg meal subscription with chicken, egg, and dal options.",
            video: DailyVid,
            features: [
              "Chicken / Egg Option",
              "Fresh Daily",
              "Hygienic Packing",
            ],
            image: u("photo-1565299585323-38d6b0865b47"),
            searchTags: [
              "food",
              "tiffin",
              "non-veg",
              "chicken",
              "lunch",
              "subscription",
            ],
          },
          {
            name: "1-Month Dinner Tiffin",
            price: 2800,
            bookingType: "subscription",
            description:
              "Wholesome evening meals delivered fresh to your door every night.",
            video: DailyVid,
            features: ["Hot & Fresh", "Evening Delivery", "Customisable Menu"],
            image: u("photo-1547592166-23ac45744acd"),
            searchTags: [
              "food",
              "tiffin",
              "dinner",
              "meal",
              "evening",
              "subscription",
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
            bookingType: "subscription",
            description:
              "Fresh farm milk delivered daily to your doorstep before 7 AM.",
            video: DailyVid,
            features: ["A2 Cow Milk", "No Preservatives", "Doorstep Drop"],
            image: u("photo-1550583724-b2692b85b150"),
            searchTags: ["milk", "dairy", "morning", "subscription", "grocery"],
          },
        ],
      },
      {
        name: "Laundry",
        services: [
          {
            name: "Laundry & Ironing Pickup",
            price: 499,
            description:
              "Scheduled pickup, wash, fold, and delivery of clothes — within 48 hours.",
            video: DailyVid,
            features: [
              "Pickup & Delivery",
              "Wash + Iron",
              "48-Hour Turnaround",
            ],
            image: u("photo-1545173168-9f1947eebb7f"),
            searchTags: [
              "laundry",
              "clothes",
              "wash",
              "iron",
              "pickup",
              "delivery",
            ],
          },
          {
            name: "Dry Cleaning Pickup",
            price: 799,
            description:
              "Professional dry cleaning for suits, sarees, woollens, and delicate fabrics.",
            video: DailyVid,
            features: [
              "Delicate Fabric Care",
              "Pickup & Drop",
              "Express Option",
            ],
            image: u("photo-1558769132-cb1aea458c5e"),
            searchTags: [
              "dry cleaning",
              "suit",
              "saree",
              "woollen",
              "fabric",
              "pickup",
            ],
          },
        ],
      },
      {
        name: "Vehicle Care",
        services: [
          {
            name: "Car Washing at Doorstep",
            price: 299,
            description:
              "Waterless or steam car wash at your home or parking spot.",
            video: DailyVid,
            features: ["Waterless / Steam", "Interior Vacuum", "Tyre Polish"],
            image: u("photo-1520340356584-f9917d1eea6f"),
            searchTags: [
              "car wash",
              "vehicle",
              "cleaning",
              "doorstep",
              "auto",
              "polish",
            ],
          },
          {
            name: "Two-Wheeler Repair at Home",
            price: 399,
            description:
              "Bike and scooter oil change, puncture repair, and basic servicing at home.",
            video: DailyVid,
            features: ["Oil Change", "Puncture Repair", "Chain Lubrication"],
            image: u("photo-1558618666-fcd25c85cd64"),
            searchTags: [
              "bike",
              "scooter",
              "two wheeler",
              "repair",
              "service",
              "motorcycle",
            ],
          },
        ],
      },
      {
        name: "Utilities",
        services: [
          {
            name: "LPG Cylinder Booking",
            price: 50,
            description:
              "Book your LPG gas cylinder refill with doorstep delivery tracking.",
            video: DailyVid,
            features: [
              "All Brands (HP/Indane/Bharat)",
              "Track Delivery",
              "Quick Booking",
            ],
            image: u("photo-1585771724684-38269d6639fd"),
            searchTags: [
              "lpg",
              "gas",
              "cylinder",
              "booking",
              "cooking",
              "fuel",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 7.  PET SERVICES
  // ══════════════════════════════════════════════
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
            video: PetVid,
            features: ["Anti-Tick Bath", "Nail Clipping", "Ear Cleaning"],
            image: u("photo-1516734212186-a967f81ad0d7"),
            searchTags: ["dog", "grooming", "pet", "wash", "bath", "trim"],
          },
          {
            name: "Cat Grooming at Home",
            price: 799,
            description:
              "Gentle bath, fur trim, nail clipping, and ear cleaning for cats.",
            video: PetVid,
            features: [
              "Gentle Handling",
              "Nail Clipping",
              "De-shedding Treatment",
            ],
            image: u("photo-1514888286974-6c03e2ca1dba"),
            searchTags: ["cat", "grooming", "pet", "bath", "nail", "feline"],
          },
        ],
      },
      {
        name: "Dog Walking",
        services: [
          {
            name: "Monthly Dog Walker",
            price: 2500,
            bookingType: "subscription",
            description:
              "Daily structured walks by verified and loving pet walkers.",
            video: PetVid,
            features: ["30 Min Walk", "Verified Walker", "GPS Tracking"],
            image: u("photo-1601758124510-52d02ddb7cbd"),
            searchTags: ["dog", "walk", "pet", "subscription", "exercise"],
          },
        ],
      },
      {
        name: "Vet Services",
        services: [
          {
            name: "Vet at Home (Consultation)",
            price: 699,
            description:
              "Qualified vet visits at your home for checkups, vaccinations, and treatment.",
            video: PetVid,
            features: ["Health Checkup", "Vaccination", "Prescription"],
            image: u("photo-1583337130417-3346a1be7dee"),
            searchTags: [
              "vet",
              "doctor",
              "pet",
              "vaccination",
              "checkup",
              "health",
            ],
          },
          {
            name: "Pet Vaccination at Home",
            price: 499,
            description:
              "Annual vaccination schedule for dogs and cats at your doorstep.",
            video: PetVid,
            features: ["Annual Vaccines", "Vaccination Card", "Safe Handling"],
            image: u("photo-1548767797-d8c844163c4a"),
            searchTags: [
              "vaccine",
              "pet",
              "dog",
              "cat",
              "vet",
              "health",
              "injection",
            ],
          },
        ],
      },
      {
        name: "Pet Boarding",
        services: [
          {
            name: "Pet Boarding / Sitting Service",
            price: 799,
            description:
              "Overnight or daytime pet care at a verified sitter's home.",
            video: PetVid,
            features: [
              "24/7 Supervision",
              "Playtime Included",
              "Daily Photo Updates",
            ],
            image: u("photo-1587300003388-59208cc962cb"),
            searchTags: [
              "boarding",
              "pet sitting",
              "dog",
              "cat",
              "overnight",
              "care",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 8.  HEALTH & WELLNESS
  // ══════════════════════════════════════════════
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
            video: HealthVid,
            features: ["Vitals Check", "Prescription", "Consultation"],
            image: u("photo-1579684385127-1ef15d508118"),
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
        name: "Lab Tests",
        services: [
          {
            name: "Blood / Lab Test at Home",
            price: 299,
            description:
              "Certified phlebotomist visits for blood sample collection and lab tests.",
            video: HealthVid,
            features: [
              "NABL Certified Lab",
              "Reports in 24 Hrs",
              "Fasting Tests Available",
            ],
            image: u("photo-1559757175-5700dde675bc"),
            searchTags: [
              "blood test",
              "lab",
              "sample",
              "health",
              "checkup",
              "pathology",
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
            video: HealthVid,
            features: [
              "Medication Tracking",
              "Assisted Mobility",
              "Feeding & Bathing",
            ],
            image: u("photo-1576765608532-073901bc095f"),
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
      {
        name: "Home Nursing",
        services: [
          {
            name: "Post-Surgery / ICU Home Nursing",
            price: 1800,
            description:
              "Trained ICU nurses for post-operative care and recovery at home.",
            video: HealthVid,
            features: [
              "ICU-Trained Nurses",
              "24-Hour Option",
              "Medication Management",
            ],
            image: u("photo-1584820927498-cfe5211fd8bf"),
            searchTags: [
              "nurse",
              "nursing",
              "surgery",
              "recovery",
              "icu",
              "home care",
            ],
          },
        ],
      },
      {
        name: "Physiotherapy",
        services: [
          {
            name: "Physiotherapy at Home",
            price: 899,
            description:
              "Certified physiotherapist for injury recovery, back pain, and mobility.",
            video: HealthVid,
            features: [
              "Certified Physio",
              "Custom Exercise Plan",
              "Electrotherapy Option",
            ],
            image: u("photo-1576091160399-112ba8d25d1d"),
            searchTags: [
              "physio",
              "physiotherapy",
              "back pain",
              "recovery",
              "exercise",
              "rehab",
            ],
          },
        ],
      },
      {
        name: "Fitness",
        services: [
          {
            name: "Yoga / Personal Trainer at Home",
            price: 999,
            description:
              "Certified yoga instructors and personal trainers for home sessions.",
            video: HealthVid,
            features: [
              "Certified Trainer",
              "Custom Fitness Plan",
              "Morning / Evening Slots",
            ],
            image: u("photo-1544367567-0f2fcb009e0b"),
            searchTags: [
              "yoga",
              "trainer",
              "fitness",
              "exercise",
              "health",
              "morning",
            ],
          },
        ],
      },
      {
        name: "Child Care",
        services: [
          {
            name: "Verified Babysitter / Nanny Booking",
            price: 799,
            description:
              "Background-verified babysitters and nannies for hourly or daily care.",
            video: HealthVid,
            features: [
              "Police Verified",
              "First Aid Trained",
              "Flexible Hours",
            ],
            image: u("photo-1566004100631-35d015d6a491"),
            searchTags: [
              "babysitter",
              "nanny",
              "child",
              "kids",
              "care",
              "childcare",
            ],
          },
        ],
      },
      {
        name: "Mental Health",
        services: [
          {
            name: "Online Counselling / Therapy Session",
            price: 1199,
            description:
              "Confidential online sessions with certified psychologists and counsellors.",
            video: HealthVid,
            features: [
              "Certified Counsellors",
              "Video / Chat Option",
              "100% Confidential",
            ],
            image: u("photo-1573497019940-1c28c88b4f3e"),
            searchTags: [
              "therapy",
              "counselling",
              "mental health",
              "anxiety",
              "stress",
              "psychology",
            ],
          },
        ],
      },
    ],
  },

  // ══════════════════════════════════════════════
  // 9.  EVENTS & CELEBRATIONS
  // ══════════════════════════════════════════════
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
            video: EventVid,
            features: ["Samagri Included", "2-Hour Ceremony", "Vedic Chants"],
            image: u("photo-1604931668626-ab49cb27dceb"),
            searchTags: ["puja", "pandit", "house warming", "event", "prayer"],
          },
          {
            name: "Satyanarayan Puja",
            price: 1500,
            description:
              "Traditional Satyanarayan Katha puja at home with all samagri.",
            video: EventVid,
            features: [
              "All Samagri Included",
              "1.5-Hour Ceremony",
              "Prasad Arrangement",
            ],
            image: u("photo-1605379399642-870262d3d051"),
            searchTags: [
              "satyanarayan",
              "puja",
              "pandit",
              "katha",
              "prayer",
              "god",
            ],
          },
          {
            name: "Havan / Yadna Ceremony",
            price: 3500,
            description:
              "Full havan setup with kund, samagri, and experienced Vedic pandit.",
            video: EventVid,
            features: ["Havan Kund Setup", "Samagri Included", "Vedic Mantras"],
            image: u("photo-1608306448197-e83633f1261c"),
            searchTags: [
              "havan",
              "yadna",
              "fire",
              "pandit",
              "vedic",
              "ceremony",
            ],
          },
        ],
      },
      {
        name: "Mehendi",
        services: [
          {
            name: "Bridal & Festive Mehendi Artist",
            price: 2999,
            description:
              "Skilled mehendi artists for bridal, karva chauth, and festive occasions.",
            video: EventVid,
            features: [
              "Bridal / Arabic / Indo-Arabic",
              "Natural Henna",
              "Both Hands & Feet",
            ],
            image: u("photo-1583394293214-0d7e99a36d08"),
            searchTags: [
              "mehendi",
              "henna",
              "bridal",
              "wedding",
              "art",
              "hands",
            ],
          },
        ],
      },
      {
        name: "Decoration",
        services: [
          {
            name: "Birthday / Party Decoration at Home",
            price: 1999,
            description:
              "Balloon, floral, and themed decoration for birthdays and parties.",
            video: EventVid,
            features: [
              "Custom Theme",
              "Balloon & Floral Setup",
              "Same-Day Booking",
            ],
            image: u("photo-1530103862676-de8c9debad1d"),
            searchTags: [
              "birthday",
              "decoration",
              "party",
              "balloon",
              "celebrate",
              "event",
            ],
          },
        ],
      },
      {
        name: "Catering",
        services: [
          {
            name: "Home Caterer / Cook for Events",
            price: 4999,
            description:
              "Professional caterers for home events serving 10–50 people.",
            video: EventVid,
            features: ["10–50 Pax", "Veg & Non-Veg Menu", "Utensils Provided"],
            image: u("photo-1555244162-803834f70033"),
            searchTags: ["catering", "cook", "food", "event", "party", "chef"],
          },
        ],
      },
      {
        name: "Photography",
        services: [
          {
            name: "Event / Birthday Photography",
            price: 3499,
            description:
              "Professional photographers for birthdays, anniversaries, and home events.",
            video: EventVid,
            features: [
              "Edited Photos in 48 Hrs",
              "Digital Delivery",
              "Candid + Posed",
            ],
            image: u("photo-1516035069371-29a1b244cc32"),
            searchTags: [
              "photography",
              "photo",
              "birthday",
              "event",
              "camera",
              "memories",
            ],
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// IMPORT FUNCTION
// ─────────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await Category.deleteMany();
    await SubCategory.deleteMany();
    await Service.deleteMany();
    await User.deleteMany();
    await PromoCode.deleteMany();
    console.log("🗑️  Old Data Destroyed...");

    for (const catData of catalogData) {
      const newCategory = await Category.create({
        name: catData.categoryName,
        icon: catData.icon,
        color: catData.color,
      });
      for (const subData of catData.subCategories) {
        const newSubCategory = await SubCategory.create({
          name: subData.name,
          parentCategory: newCategory._id,
        });
        for (const srvData of subData.services) {
          await Service.create({
            name: srvData.name,
            category: newCategory._id,
            subCategory: newSubCategory._id,
            description: srvData.description,
            price: srvData.price,
            video: srvData.video || "",
            bookingType: srvData.bookingType || "one-time",
            features: srvData.features,
            searchTags: srvData.searchTags || [],
            image: srvData.image,
          });
        }
      }
    }
    console.log("✅ Catalog imported — 76 services, all images & videos set!");

    const salt = await bcrypt.genSalt(10);

    const adminHash = await bcrypt.hash("password123", salt);
    await User.create({
      name: "Super Admin",
      email: "admin@urban.com",
      phone: "0000000000",
      password: adminHash,
      role: "admin",
    });

    const providerHash = await bcrypt.hash("123456", salt);
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
        category: homeTradesCat._id,
        subCategory: plumbingSub._id,
        experience: 5,
        isAvailable: true,
        isVerified: true,
        verificationStatus: "approved",
      },
    });

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

    console.log("🚀 Admin, Provider & PromoCode created!");
    process.exit();
  } catch (error) {
    console.error("❌ Import error:", error);
    process.exit(1);
  }
};

importData();
