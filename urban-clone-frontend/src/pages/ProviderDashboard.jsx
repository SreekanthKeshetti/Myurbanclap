/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useContext, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Tab,
  Tabs,
  Modal,
  Form,
  Alert,
  ProgressBar,
} from "react-bootstrap";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiMessageSquare,
  FiNavigation,
  FiUserCheck,
  FiTool,
  FiDollarSign,
  FiUpload,
  FiAlertTriangle,
  FiBriefcase,
  FiXCircle,
  FiPower,
  FiCamera,
  FiCalendar,
} from "react-icons/fi";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import ChatBox from "../components/UI/ChatBox";
import io from "socket.io-client";

const socket = io.connect(import.meta.env.VITE_API_URL);

const ProviderDashboard = () => {
  const { user } = useContext(AuthContext);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isOnline, setIsOnline] = useState(
    user?.providerDetails?.isAvailable ?? false,
  );

  // States for Onboarding
  const [needsCategory, setNeedsCategory] = useState(false);
  const [catalogTree, setCatalogTree] = useState([]);
  const [selectedParentCat, setSelectedParentCat] = useState("");
  const [selectedSubCat, setSelectedSubCat] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("pending");
  const [docUrl, setDocUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // Chat States
  const [showChat, setShowChat] = useState(false);
  const [chatBooking, setChatBooking] = useState(null);

  // Modal States
  const [showDropModal, setShowDropModal] = useState(false);
  const [jobToDrop, setJobToDrop] = useState(null);

  const navigate = useNavigate();
  const watchIdRef = useRef(null);

  // --- SELFIE CAMERA & OTP STATES ---
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [otpType, setOtpType] = useState("start");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedSelfie, setCapturedSelfie] = useState(null);
  const [capturedSelfiePreview, setCapturedSelfiePreview] = useState(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // GPS Tracking
  const startTracking = (bookingId) => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    socket.emit("join_booking", bookingId);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        socket.emit("send_location", {
          bookingId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("GPS Error:", error),
      { enableHighAccuracy: true },
    );
    toast.success("Live Location Sharing Started 📡");
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      toast.success("Location Sharing Stopped");
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "provider" && user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get("/api/bookings/provider/available", config);

      if (res.data.blocked) {
        setIsVerified(false);
      } else if (res.data.isOffline) {
        setIsVerified(true);
        setAvailableJobs([]);
      } else {
        setIsVerified(true);
        setAvailableJobs(res.data);
      }

      if (!user.providerDetails || !user.providerDetails.subCategory) {
        setNeedsCategory(true);
        const treeRes = await axios.get("/api/categories/tree");
        setCatalogTree(treeRes.data);
      } else {
        setNeedsCategory(false);
      }

      const myRes = await axios.get("/api/bookings/provider/myjobs", config);
      setMyJobs(myRes.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleToggleDuty = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        "/api/auth/profile",
        { isAvailable: newStatus },
        config,
      );
      localStorage.setItem("userInfo", JSON.stringify(data));
      if (newStatus) {
        toast.success("You are now Online 🟢 Receiving jobs!");
        fetchData();
      } else {
        toast.success("You are now Offline 🔴 Rest well!");
        setAvailableJobs([]);
      }
    } catch (error) {
      setIsOnline(!newStatus);
      toast.error("Failed to update status");
    }
  };

  const handleSaveCategory = async () => {
    if (!selectedParentCat || !selectedSubCat)
      return toast.error("Select both a Category and Subcategory");
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        "/api/auth/profile",
        { category: selectedParentCat, subCategory: selectedSubCat },
        config,
      );
      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Profession Saved! Please upload KYC.");
      window.location.reload();
    } catch (error) {
      toast.error("Failed to save profession");
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    setUploading(true);
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.post("/api/upload", formData, config);
      setDocUrl(data.imageUrl);
      toast.success("Image successfully stored in Cloud!");
    } catch (error) {
      toast.error("File upload failed. Check limits or network.");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadKYC = async () => {
    if (!docUrl) return toast.error("Please upload an image first");
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post("/api/auth/upload-kyc", { imageUrl: docUrl }, config);
      toast.success("Documents Submitted! Waiting for Admin Approval.");
      setVerificationStatus("submitted");
      fetchData();
    } catch (error) {
      toast.error("Upload failed");
    }
  };

  const handleAcceptJob = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/bookings/${id}/accept`, {}, config);
      toast.success("Job Accepted!");
      fetchData();
    } catch (error) {
      toast.error("Failed to accept. Job may be taken.");
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `/api/bookings/${id}/status`,
        { status: newStatus },
        config,
      );
      toast.success(`Status updated to: ${newStatus}`);
      if (newStatus === "ontheway") startTracking(id);
      else if (newStatus === "arrived") stopTracking();
      fetchData();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleLogDelivery = async (jobId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        `/api/bookings/${jobId}/log-delivery`,
        {},
        config,
      );

      if (data.booking.status === "completed") {
        toast.success("Subscription fully completed! Wallet credited. 💰");
      } else {
        toast.success("Delivery logged for today! ✅");
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to log delivery");
    }
  };

  const initiateStartJob = async (jobId) => {
    setSelectedJobId(jobId);
    setOtpType("start");
    setOtpInput("");
    setCapturedSelfie(null);
    setCapturedSelfiePreview(null);
    setShowOtpModal(true);

    try {
      setCameraActive(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Please allow camera access to verify your identity.");
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 300, 300);
      const dataUrl = canvasRef.current.toDataURL("image/jpeg");
      setCapturedSelfiePreview(dataUrl);
      canvasRef.current.toBlob((blob) => {
        setCapturedSelfie(blob);
        stopCamera();
      }, "image/jpeg");
    }
  };

  const retakePhoto = async () => {
    setCapturedSelfie(null);
    setCapturedSelfiePreview(null);
    try {
      setCameraActive(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Camera access failed.");
    }
  };

  const initiateEndJob = (jobId) => {
    setSelectedJobId(jobId);
    setOtpType("end");
    setOtpInput("");
    setShowOtpModal(true);
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    try {
      setUploadingSelfie(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };

      if (otpType === "start") {
        if (!capturedSelfie) {
          toast.error("Please take a live selfie first!");
          setUploadingSelfie(false);
          return;
        }

        const formData = new FormData();
        formData.append("image", capturedSelfie, "selfie.jpg");

        const uploadConfig = {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data: uploadData } = await axios.post(
          "/api/upload",
          formData,
          uploadConfig,
        );

        await axios.post(
          `/api/bookings/${selectedJobId}/verify-start-otp`,
          { otp: otpInput, selfieUrl: uploadData.imageUrl },
          config,
        );
        toast.success("Identity Verified! Job Started 🛠️");
      } else {
        await axios.put(
          `/api/bookings/${selectedJobId}/complete`,
          { otp: otpInput },
          config,
        );
        toast.success("Great Job! Booking Completed & Wallet Updated. 💰");
        stopTracking();
      }

      setShowOtpModal(false);
      setUploadingSelfie(false);
      fetchData();
    } catch (error) {
      setUploadingSelfie(false);
      toast.error(error.response?.data?.message || "Verification Failed");
    }
  };

  const handleModalClose = () => {
    stopCamera();
    setShowOtpModal(false);
  };

  const handleOpenDrop = (job) => {
    setJobToDrop(job);
    setShowDropModal(true);
  };

  const confirmDropJob = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(
        `/api/bookings/${jobToDrop._id}/cancel`,
        {},
        config,
      );
      toast.success(res.data.message);
      setShowDropModal(false);
      setJobToDrop(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to drop job");
    }
  };

  const handleOpenChat = (booking) => {
    setChatBooking(booking);
    setShowChat(true);
  };

  const activeJobs = myJobs.filter((job) =>
    [
      "accepted",
      "ontheway",
      "arrived",
      "inprogress",
      "active_subscription",
    ].includes(job.status),
  );
  const historyJobs = myJobs.filter((job) =>
    ["completed", "cancelled"].includes(job.status),
  );

  if (loading) {
    return (
      <div className="text-center mt-5 pt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  // CATEGORY ONBOARDING UI
  if (needsCategory) {
    const activeParentObj = catalogTree.find(
      (c) => c._id === selectedParentCat,
    );

    return (
      <Container className="pt-5 mt-5">
        <Row className="justify-content-center">
          <Col md={6}>
            <Card className="border-0 shadow-lg rounded-4 p-5 text-center">
              <div className="mb-3 text-primary">
                <FiBriefcase size={40} />
              </div>
              <h3>Select Your Profession</h3>
              <p className="text-muted mb-4">
                Choose your expertise to start getting jobs.
              </p>

              <Form.Group className="mb-3 text-start">
                <Form.Label className="small fw-bold text-muted">
                  1. MAIN CATEGORY
                </Form.Label>
                <Form.Select
                  className="py-3 fw-bold border-0 bg-light"
                  value={selectedParentCat}
                  onChange={(e) => {
                    setSelectedParentCat(e.target.value);
                    setSelectedSubCat("");
                  }}
                >
                  <option value="">Select Category...</option>
                  {catalogTree.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {selectedParentCat && (
                <Form.Group
                  className="mb-4 text-start animate-pulse"
                  style={{
                    animationDuration: "0.5s",
                    animationIterationCount: 1,
                  }}
                >
                  <Form.Label className="small fw-bold text-muted">
                    2. SPECIALIZATION
                  </Form.Label>
                  <Form.Select
                    className="py-3 fw-bold border-0 bg-light"
                    value={selectedSubCat}
                    onChange={(e) => setSelectedSubCat(e.target.value)}
                  >
                    <option value="">Select Specialization...</option>
                    {activeParentObj?.subCategories?.map((sub) => (
                      <option key={sub._id} value={sub._id}>
                        {sub.name}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              )}

              <Button
                variant="dark"
                className="w-100 py-3 rounded-pill fw-bold btn-primary-custom mt-2"
                onClick={handleSaveCategory}
                disabled={!selectedParentCat || !selectedSubCat}
              >
                Continue to Verification
              </Button>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // KYC VERIFICATION UI
  if (!isVerified) {
    return (
      <Container className="pt-5 mt-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Card className="border-0 shadow-lg rounded-4 p-4 text-center">
              <div className="mb-3 text-warning">
                <FiAlertTriangle size={40} />
              </div>
              <h3 className="fw-bold">Account Verification Pending</h3>
              <p className="text-muted">
                Upload Government ID to start accepting jobs.
              </p>
              {verificationStatus === "submitted" ||
              user?.providerDetails?.verificationStatus === "submitted" ? (
                <Alert variant="info" className="mt-3">
                  Documents under review. We will notify you once approved.
                </Alert>
              ) : (
                <div className="mt-4 text-start bg-light p-4 rounded-3">
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-bold small">
                      UPLOAD ID PROOF (Aadhar/PAN)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={uploadFileHandler}
                      disabled={uploading}
                    />
                  </Form.Group>
                  {uploading && (
                    <div className="text-center mb-3">
                      <Spinner animation="border" size="sm" className="me-2" />{" "}
                      Uploading to secure cloud...
                    </div>
                  )}
                  {docUrl && !uploading && (
                    <div className="mb-3 text-success d-flex align-items-center fw-bold">
                      <FiCheckCircle className="me-2" /> File Ready
                    </div>
                  )}
                  <Button
                    variant="dark"
                    onClick={handleUploadKYC}
                    className="w-100 fw-bold py-2"
                    disabled={!docUrl || uploading}
                  >
                    <FiUpload className="me-2" /> Submit Documents for Approval
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // MAIN DASHBOARD
  return (
    <div
      style={{ paddingTop: "120px", minHeight: "100vh", background: "#f8fafc" }}
    >
      <Container>
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
          <div>
            <h2 className="fw-bold mb-0">Provider Portal</h2>
            <p className="text-muted mb-0">Welcome back, {user?.name}</p>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button
              variant="outline-dark"
              className="rounded-pill fw-bold bg-white shadow-sm border-0 d-flex align-items-center"
              onClick={() => navigate("/provider/wallet")}
            >
              <FiDollarSign className="me-1 text-success" /> Earnings
            </Button>
            <Button
              variant={isOnline ? "success" : "secondary"}
              className="rounded-pill fw-bold shadow-sm border-0 d-flex align-items-center px-4"
              onClick={handleToggleDuty}
              style={{ transition: "0.3s ease" }}
            >
              <FiPower className="me-2" />
              {isOnline ? "You're Online" : "You're Offline"}
            </Button>
          </div>
        </div>

        <Tabs
          defaultActiveKey="available"
          className="mb-4 border-0 custom-tabs"
        >
          <Tab
            eventKey="available"
            title={`New Requests (${isOnline ? availableJobs.length : 0})`}
          >
            {!isOnline ? (
              <div
                className="text-center py-5 mt-4 bg-white rounded-4 shadow-sm"
                style={{ border: "2px dashed #e2e8f0" }}
              >
                <div className="mb-3 text-muted opacity-50">
                  <FiClock size={60} />
                </div>
                <h4 className="fw-bold">You are currently Offline</h4>
                <p className="text-muted max-w-50 mx-auto">
                  Go online to start receiving service requests within a 20km
                  radius of your location.
                </p>
                <Button
                  variant="success"
                  className="rounded-pill px-5 py-3 fw-bold mt-2 shadow"
                  onClick={handleToggleDuty}
                >
                  <FiPower className="me-2" /> Go Online Now
                </Button>
              </div>
            ) : availableJobs.length === 0 ? (
              <div className="text-center py-5 mt-4 bg-white rounded-4 shadow-sm">
                <div
                  className="spinner-grow text-primary mb-3"
                  role="status"
                  style={{ width: "3rem", height: "3rem", opacity: 0.2 }}
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h5 className="fw-bold">Scanning for jobs...</h5>
                <p className="text-muted">
                  No new requests in your 20km radius right now.
                </p>
              </div>
            ) : (
              <Row className="g-4 mt-1">
                {availableJobs.map((job) => (
                  <Col key={job._id} md={6} lg={4}>
                    <JobCard
                      job={job}
                      onAccept={handleAcceptJob}
                      isAvailable={true}
                    />
                  </Col>
                ))}
              </Row>
            )}
          </Tab>

          <Tab eventKey="active" title={`Active Jobs (${activeJobs.length})`}>
            <Row className="g-4 mt-1">
              {activeJobs.length === 0 ? (
                <Col>
                  <div className="text-center py-5 bg-white rounded-4 shadow-sm">
                    <h5 className="text-muted">No active jobs right now.</h5>
                  </div>
                </Col>
              ) : (
                activeJobs.map((job) => (
                  <Col key={job._id} md={6} lg={4}>
                    <JobCard
                      job={job}
                      onStatusUpdate={handleStatusChange}
                      onStartJob={initiateStartJob}
                      onEndJob={initiateEndJob}
                      onLogDelivery={handleLogDelivery}
                      onChat={() => handleOpenChat(job)}
                      onDrop={() => handleOpenDrop(job)}
                      isAvailable={false}
                    />
                  </Col>
                ))
              )}
            </Row>
          </Tab>

          <Tab eventKey="history" title={`Past Work (${historyJobs.length})`}>
            <Row className="g-4 mt-1">
              {historyJobs.map((job) => (
                <Col key={job._id} md={6} lg={4}>
                  <JobCard job={job} isAvailable={false} isHistory={true} />
                </Col>
              ))}
            </Row>
          </Tab>
        </Tabs>
      </Container>

      <ChatBox
        show={showChat}
        handleClose={() => setShowChat(false)}
        booking={chatBooking}
        currentUser={user}
      />

      <Modal
        show={showOtpModal}
        onHide={handleModalClose}
        centered
        backdrop="static"
        keyboard={false}
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title
            className={
              otpType === "end"
                ? "text-success fw-bold"
                : "fw-bold text-primary"
            }
          >
            {otpType === "start"
              ? "Identity & Security Check 🛡️"
              : "Job Completion ✅"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <Form onSubmit={submitOtp}>
            {otpType === "start" && (
              <div className="mb-4 text-center">
                <p className="small text-muted mb-2 fw-bold">
                  1. LIVE SELFIE VERIFICATION
                </p>
                <div
                  className="bg-dark rounded-4 overflow-hidden position-relative mx-auto"
                  style={{
                    width: "250px",
                    height: "250px",
                    border: "3px solid #e2e8f0",
                  }}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: capturedSelfiePreview ? "none" : "block",
                    }}
                  />
                  {capturedSelfiePreview && (
                    <img
                      src={capturedSelfiePreview}
                      alt="Selfie"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <canvas
                    ref={canvasRef}
                    width="300"
                    height="300"
                    style={{ display: "none" }}
                  />
                </div>
                <div className="mt-3">
                  {!capturedSelfiePreview ? (
                    <Button
                      variant="outline-dark"
                      size="sm"
                      className="rounded-pill fw-bold"
                      onClick={capturePhoto}
                      disabled={!cameraActive}
                    >
                      <FiCamera className="me-1" /> Take Selfie
                    </Button>
                  ) : (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger fw-bold text-decoration-none"
                      onClick={retakePhoto}
                    >
                      Retake Photo
                    </Button>
                  )}
                </div>
              </div>
            )}
            <p className="small text-muted mb-2 fw-bold text-center mt-3">
              {otpType === "start"
                ? "2. CUSTOMER START OTP"
                : "ENTER CUSTOMER END OTP"}
            </p>
            <Form.Control
              type="number"
              placeholder="e.g. 4582"
              className="text-center fs-3 fw-bold letter-spacing-2 mb-4 bg-light border-0 py-3 rounded-4 mx-auto"
              style={{ maxWidth: "250px" }}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
            />
            <Button
              variant={otpType === "start" ? "primary" : "success"}
              type="submit"
              className="w-100 py-3 rounded-pill fw-bold d-flex justify-content-center align-items-center shadow-sm"
              disabled={
                uploadingSelfie ||
                !otpInput ||
                (otpType === "start" && !capturedSelfie)
              }
            >
              {uploadingSelfie ? (
                <>
                  <Spinner size="sm" className="me-2" /> Verifying Identity...
                </>
              ) : otpType === "start" ? (
                "Verify Identity & Start Job"
              ) : (
                "Verify & Complete Job"
              )}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Modal
        show={showDropModal}
        onHide={() => setShowDropModal(false)}
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold text-danger">Drop Job?</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <p>Are you sure you want to unassign yourself from this job?</p>
          <Alert
            variant="danger"
            className="small border-0 bg-danger bg-opacity-10 text-danger rounded-3"
          >
            <strong>Warning:</strong> Dropping an accepted job creates a bad
            experience for the customer. A <strong>₹50 penalty</strong> will be
            deducted.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button
            variant="light"
            className="rounded-pill fw-bold px-4"
            onClick={() => setShowDropModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="rounded-pill fw-bold px-4"
            onClick={confirmDropJob}
          >
            Accept Penalty
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

// --- 🌟 INTELLIGENT & REDESIGNED JOB CARD COMPONENT 🌟 ---
const JobCard = ({
  job,
  onAccept,
  onStatusUpdate,
  onStartJob,
  onEndJob,
  onLogDelivery,
  onChat,
  onDrop,
  isAvailable,
  isHistory,
}) => {
  const isSub = job.bookingType === "subscription";

  const renderActionButton = () => {
    if (isSub) {
      if (job.status === "accepted" || job.status === "active_subscription") {
        return (
          <Button
            variant="success"
            className="w-100 rounded-pill fw-bold btn-primary-custom shadow-sm"
            onClick={() => onLogDelivery(job._id)}
          >
            <FiCheckCircle className="me-2" /> Mark Today's Delivery
          </Button>
        );
      }
    } else {
      switch (job.status) {
        case "accepted":
          return (
            <div className="d-flex w-50 gap-1">
              <Button
                variant="primary"
                className="flex-grow-1 rounded-pill fw-bold"
                onClick={() => onStatusUpdate(job._id, "ontheway")}
                title="Start Trip"
              >
                <FiNavigation />
              </Button>
              <Button
                variant="outline-danger"
                className="rounded-pill"
                onClick={onDrop}
                title="Drop Job"
              >
                <FiXCircle />
              </Button>
            </div>
          );
        case "ontheway":
          return (
            <Button
              variant="info"
              className="w-50 rounded-pill fw-bold text-white"
              onClick={() => onStatusUpdate(job._id, "arrived")}
            >
              <FiUserCheck className="me-2" /> Arrived
            </Button>
          );
        case "arrived":
          return (
            <Button
              variant="warning"
              className="w-50 rounded-pill fw-bold text-dark"
              onClick={() => onStartJob(job._id)}
            >
              <FiTool className="me-2" /> Start (OTP)
            </Button>
          );
        case "inprogress":
          return (
            <Button
              variant="success"
              className="w-50 rounded-pill fw-bold"
              onClick={() => onEndJob(job._id)}
            >
              <FiCheckCircle className="me-2" /> Finish Job
            </Button>
          );
        default:
          return null;
      }
    }
  };

  return (
    <Card
      className={`premium-booking-card h-100 d-flex flex-column ${isHistory ? "opacity-75 bg-light" : ""}`}
    >
      {/* 🌟 NEW HEADER: Matches Bookings.jsx, clean and subtle ID 🌟 */}
      <div className="booking-card-header">
        <div className="d-flex align-items-center gap-2">
          <Badge
            bg={isSub ? "warning" : "dark"}
            text={isSub ? "dark" : "white"}
          >
            {isSub && <FiCalendar className="me-1" />}
            {isSub ? "Subscription" : "One-Time Service"}
          </Badge>
        </div>
        <span
          className="fw-bold"
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            letterSpacing: "1px",
            fontFamily: "monospace",
          }}
        >
          #{job._id.slice(-8).toUpperCase()}
        </span>
      </div>

      <Card.Body className="px-4 py-3 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="fw-bold mb-0 text-dark">{job.service?.name}</h5>
          <h4 className="fw-bold text-success mb-0">
            ₹{job.totalPrice || job.service?.price}
          </h4>
        </div>

        {/* PROGRESS BAR FOR SUBSCRIPTIONS */}
        {isSub && job.subscriptionDetails && !isAvailable && !isHistory && (
          <div className="mb-3 mt-2">
            <div className="d-flex justify-content-between small fw-bold text-muted mb-1">
              <span>Deliveries</span>
              <span>
                {job.subscriptionDetails.deliveriesCompleted} /{" "}
                {job.subscriptionDetails.totalDeliveries} Done
              </span>
            </div>
            <ProgressBar
              now={
                (job.subscriptionDetails.deliveriesCompleted /
                  job.subscriptionDetails.totalDeliveries) *
                100
              }
              variant="warning"
              style={{ height: "6px" }}
            />
          </div>
        )}

        <div className="bg-light p-3 rounded-3 flex-grow-1 mb-4 border mt-2">
          {isSub ? (
            <div className="mb-2">
              <small
                className="text-muted fw-bold d-block"
                style={{ fontSize: "10px" }}
              >
                PERIOD
              </small>
              <div className="d-flex align-items-center text-dark fw-bold small">
                <FiCalendar className="me-1 text-warning" />{" "}
                {job.subscriptionDetails?.startDate} to{" "}
                {job.subscriptionDetails?.endDate}
              </div>
            </div>
          ) : (
            <div className="mb-2">
              <small
                className="text-muted fw-bold d-block"
                style={{ fontSize: "10px" }}
              >
                TIME
              </small>
              <div className="d-flex align-items-center text-dark fw-bold small">
                <FiClock className="me-1 text-primary" /> {job.date} @{" "}
                {job.timeSlot}
              </div>
            </div>
          )}

          {/* <div>
            <small
              className="text-muted fw-bold d-block"
              style={{ fontSize: "10px" }}
            >
              LOCATION
            </small>
            <div className="d-flex align-items-start text-dark small mt-1">
              <FiMapPin className="text-danger me-2 mt-1 flex-shrink-0" />
              <span className="text-truncate" style={{ maxWidth: "200px" }}>
                {job.address}
              </span>
            </div>
          </div> */}
          <div>
            <small
              className="text-muted fw-bold d-block"
              style={{ fontSize: "10px" }}
            >
              LOCATION
            </small>
            <div className="d-flex align-items-start text-dark small mt-1">
              <FiMapPin className="text-danger me-2 mt-1 flex-shrink-0" />
              {/* Removed text-truncate and maxWidth, added wordBreak to prevent overflowing */}
              <span style={{ wordBreak: "break-word", lineHeight: "1.4" }}>
                {job.address}
              </span>
            </div>
          </div>
        </div>

        {isAvailable && (
          <Button
            variant="dark"
            className="w-100 rounded-pill fw-bold py-3 shadow-sm btn-primary-custom"
            onClick={() => onAccept(job._id)}
          >
            Accept Request
          </Button>
        )}
        {!isAvailable && !isHistory && (
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              className={`rounded-pill fw-bold shadow-sm ${isSub ? "w-100 mb-2" : "w-50"}`}
              onClick={onChat}
            >
              <FiMessageSquare className="me-1" /> Chat
            </Button>
            {!isSub && renderActionButton()}
          </div>
        )}

        {!isAvailable && !isHistory && isSub && renderActionButton()}

        {isHistory && (
          <div className="text-center w-100 border p-2 rounded-pill bg-white text-muted fw-bold small text-uppercase shadow-sm">
            Status: {job.status}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ProviderDashboard;
