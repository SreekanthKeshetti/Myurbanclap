/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useState, useEffect, useContext } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import AuthContext from "./AuthContext";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [platformFee, setPlatformFee] = useState(29);
  const [grandTotal, setGrandTotal] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [amountToPay, setAmountToPay] = useState(0);

  const { user } = useContext(AuthContext);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("urbanCart"));
    if (savedCart) setCartItems(savedCart);
  }, []);

  useEffect(() => {
    localStorage.setItem("urbanCart", JSON.stringify(cartItems));
  }, [cartItems]);

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  // --- 🌟 NEW: PLATFORM FEE WAIVER MATH ---
  useEffect(() => {
    if (cartTotal === 0) {
      setDiscount(0);
      setTaxes(0);
      setGrandTotal(0);
      setAmountToPay(0);
      setPromoCode("");
      return;
    }

    // Check if Plus Member
    const hasActivePlus =
      user?.isPlusMember &&
      user?.plusMembershipExpiry &&
      new Date() < new Date(user.plusMembershipExpiry);
    const currentPlatformFee = hasActivePlus ? 0 : 29;
    setPlatformFee(currentPlatformFee);

    if (!promoCode) {
      const calculatedTaxes = cartTotal * 0.18;
      setTaxes(calculatedTaxes);
      setGrandTotal(cartTotal + calculatedTaxes + currentPlatformFee);
    } else if (user) {
      applyPromo(promoCode, true);
    }
  }, [cartTotal, user]);

  useEffect(() => {
    if (useWallet && user?.walletBalance > 0) {
      const walletApplied = Math.min(grandTotal, user.walletBalance);
      setAmountToPay(grandTotal - walletApplied);
    } else {
      setAmountToPay(grandTotal);
    }
  }, [grandTotal, useWallet, user?.walletBalance]);

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
      // Ensure backend respects the waived fee if returned via Promo API
      const hasActivePlus =
        user?.isPlusMember &&
        user?.plusMembershipExpiry &&
        new Date() < new Date(user.plusMembershipExpiry);
      const fee = hasActivePlus ? 0 : data.platformFee;

      setPlatformFee(fee);
      setGrandTotal(cartTotal - data.discountAmount + data.taxes + fee);

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
  };

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

  const updateQuantity = (id, qty) => {
    if (qty < 1) return;
    setCartItems(cartItems.map((x) => (x._id === id ? { ...x, qty } : x)));
  };

  const removeFromCart = (id) => {
    setCartItems(cartItems.filter((x) => x._id !== id));
    toast.success("Removed from cart");
  };

  const clearCart = () => {
    setCartItems([]);
    removePromo();
    setUseWallet(false);
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
