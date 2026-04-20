// /* eslint-disable react-hooks/exhaustive-deps */
// import React, { createContext, useState, useEffect, useContext } from "react";
// import { toast } from "react-hot-toast";
// import axios from "axios";
// import AuthContext from "./AuthContext"; // We need user token for the API call

// const CartContext = createContext();

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);

//   // --- NEW: FINANCIAL STATES ---
//   const [promoCode, setPromoCode] = useState("");
//   const [discount, setDiscount] = useState(0);
//   const [taxes, setTaxes] = useState(0);
//   const [platformFee, setPlatformFee] = useState(29);
//   const [grandTotal, setGrandTotal] = useState(0);

//   // We need the token to validate the promo code
//   const { user } = useContext(AuthContext);

//   // Load cart from localStorage on startup
//   useEffect(() => {
//     const savedCart = JSON.parse(localStorage.getItem("urbanCart"));
//     if (savedCart) {
//       setCartItems(savedCart);
//     }
//   }, []);

//   // Save to localStorage whenever cart changes
//   useEffect(() => {
//     localStorage.setItem("urbanCart", JSON.stringify(cartItems));
//   }, [cartItems]);

//   // Calculate Base Total
//   const cartTotal = cartItems.reduce(
//     (acc, item) => acc + item.price * item.qty,
//     0,
//   );

//   // --- NEW: DYNAMIC RECALCULATION ---
//   // Recalculate taxes and totals every time the cart items change or a promo is removed
//   useEffect(() => {
//     if (cartTotal === 0) {
//       setDiscount(0);
//       setTaxes(0);
//       setGrandTotal(0);
//       setPromoCode("");
//       return;
//     }

//     // If no promo code is applied, calculate standard 18% GST on the base total
//     if (!promoCode) {
//       const calculatedTaxes = cartTotal * 0.18;
//       setTaxes(calculatedTaxes);
//       setGrandTotal(cartTotal + calculatedTaxes + platformFee);
//     } else if (user) {
//       // If a promo code IS applied, we need to re-validate it against the new cart total
//       applyPromo(promoCode, true); // true = silent re-validation
//     }
//   }, [cartTotal]);

//   // --- NEW: PROMO VALIDATION API CALL ---
//   const applyPromo = async (codeToApply, silent = false) => {
//     if (!user) {
//       if (!silent) toast.error("Please login to apply a coupon.");
//       return false;
//     }

//     try {
//       const config = { headers: { Authorization: `Bearer ${user.token}` } };
//       const { data } = await axios.post(
//         "/api/promo/validate",
//         { code: codeToApply, cartTotal: cartTotal },
//         config,
//       );

//       setPromoCode(data.promoCode);
//       setDiscount(data.discountAmount);
//       setTaxes(data.taxes);
//       setPlatformFee(data.platformFee);
//       setGrandTotal(data.finalTotal);

//       if (!silent)
//         toast.success(`Coupon Applied! Saved ₹${data.discountAmount}`);
//       return true;
//     } catch (error) {
//       if (!silent)
//         toast.error(error.response?.data?.message || "Invalid Coupon");
//       removePromo();
//       return false;
//     }
//   };

//   const removePromo = () => {
//     setPromoCode("");
//     setDiscount(0);
//     // The useEffect will catch this change and recalculate standard GST automatically
//   };

//   // 1. Add to Cart (Handles Quantity)
//   const addToCart = (service) => {
//     const exist = cartItems.find((x) => x._id === service._id);
//     if (exist) {
//       setCartItems(
//         cartItems.map((x) =>
//           x._id === service._id ? { ...exist, qty: exist.qty + 1 } : x,
//         ),
//       );
//       toast.success("Increased quantity");
//     } else {
//       setCartItems([...cartItems, { ...service, qty: 1 }]);
//       toast.success("Added to cart");
//     }
//   };

//   // 2. Update Quantity (For + / - buttons)
//   const updateQuantity = (id, qty) => {
//     if (qty < 1) return;
//     setCartItems(cartItems.map((x) => (x._id === id ? { ...x, qty } : x)));
//   };

//   // 3. Remove from Cart
//   const removeFromCart = (id) => {
//     setCartItems(cartItems.filter((x) => x._id !== id));
//     toast.success("Removed from cart");
//   };

//   // 4. Clear Cart
//   const clearCart = () => {
//     setCartItems([]);
//     removePromo();
//     localStorage.removeItem("urbanCart");
//   };

//   return (
//     <CartContext.Provider
//       value={{
//         cartItems,
//         addToCart,
//         removeFromCart,
//         updateQuantity,
//         clearCart,
//         cartTotal,
//         // Export the new financial state and functions
//         promoCode,
//         discount,
//         taxes,
//         platformFee,
//         grandTotal,
//         applyPromo,
//         removePromo,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };

// export default CartContext;
/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import AuthContext from "./AuthContext"; // We need user token for the API call

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  // --- FINANCIAL STATES ---
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [platformFee, setPlatformFee] = useState(29);
  const [grandTotal, setGrandTotal] = useState(0);

  // --- NEW: WALLET STATES (Added from AI instructions) ---
  const [useWallet, setUseWallet] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);

  // We need the token to validate the promo code and check wallet balance
  const { user } = useContext(AuthContext);

  // Load cart from localStorage on startup
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("urbanCart"));
    if (savedCart) {
      setCartItems(savedCart);
    }
  }, []);

  // Save to localStorage whenever cart changes
  useEffect(() => {
    localStorage.setItem("urbanCart", JSON.stringify(cartItems));
  }, [cartItems]);

  // Calculate Base Total
  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  // --- DYNAMIC RECALCULATION ---
  // Recalculate taxes and totals every time the cart items change or a promo is removed
  useEffect(() => {
    if (cartTotal === 0) {
      setDiscount(0);
      setTaxes(0);
      setGrandTotal(0);
      setAmountToPay(0); // Ensure amountToPay zeroes out when cart is empty
      setPromoCode("");
      return;
    }

    // If no promo code is applied, calculate standard 18% GST on the base total
    if (!promoCode) {
      const calculatedTaxes = cartTotal * 0.18;
      setTaxes(calculatedTaxes);
      setGrandTotal(cartTotal + calculatedTaxes + platformFee);
    } else if (user) {
      // If a promo code IS applied, we need to re-validate it against the new cart total
      applyPromo(promoCode, true); // true = silent re-validation
    }
  }, [cartTotal]);

  // --- NEW: FINAL PAYABLE AMOUNT CALCULATION (Wallet Logic) ---
  // This safely handles the AI's requested math. By using its own useEffect,
  // it updates instantly if they click the checkbox OR if a promo code gets applied!
  useEffect(() => {
    if (useWallet && user?.walletBalance > 0) {
      const walletApplied = Math.min(grandTotal, user.walletBalance);
      setAmountToPay(grandTotal - walletApplied);
    } else {
      setAmountToPay(grandTotal);
    }
  }, [grandTotal, useWallet, user?.walletBalance]);

  // --- PROMO VALIDATION API CALL ---
  const applyPromo = async (codeToApply, silent = false) => {
    if (!user) {
      if (!silent) toast.error("Please login to apply a coupon.");
      return false;
    }

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        "/api/promo/validate",
        { code: codeToApply, cartTotal: cartTotal },
        config,
      );

      setPromoCode(data.promoCode);
      setDiscount(data.discountAmount);
      setTaxes(data.taxes);
      setPlatformFee(data.platformFee);
      setGrandTotal(data.finalTotal);

      if (!silent)
        toast.success(`Coupon Applied! Saved ₹${data.discountAmount}`);
      return true;
    } catch (error) {
      if (!silent)
        toast.error(error.response?.data?.message || "Invalid Coupon");
      removePromo();
      return false;
    }
  };

  const removePromo = () => {
    setPromoCode("");
    setDiscount(0);
    // The useEffect will catch this change and recalculate standard GST automatically
  };

  // 1. Add to Cart (Handles Quantity)
  const addToCart = (service) => {
    const exist = cartItems.find((x) => x._id === service._id);
    if (exist) {
      setCartItems(
        cartItems.map((x) =>
          x._id === service._id ? { ...exist, qty: exist.qty + 1 } : x,
        ),
      );
      toast.success("Increased quantity");
    } else {
      setCartItems([...cartItems, { ...service, qty: 1 }]);
      toast.success("Added to cart");
    }
  };

  // 2. Update Quantity (For + / - buttons)
  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCartItems(cartItems.map((x) => (x._id === id ? { ...x, qty } : x)));
  };

  // 3. Remove from Cart
  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((x) => x._id !== id));
    toast.success("Removed from cart");
  };

  // 4. Clear Cart
  const clearCart = () => {
    setCartItems([]);
    removePromo();
    localStorage.removeItem("urbanCart");
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        promoCode,
        discount,
        taxes,
        platformFee,
        grandTotal,
        applyPromo,
        removePromo,
        // --- NEW: Added to Provider (From AI instructions) ---
        useWallet,
        setUseWallet,
        amountToPay,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
