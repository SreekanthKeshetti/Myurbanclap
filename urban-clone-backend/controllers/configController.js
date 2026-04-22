const AppConfig = require("../models/AppConfig");

// @desc    Get global app configuration
// @route   GET /api/config
// @access  Public
const getConfig = async (req, res) => {
  try {
    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({ isOperationsPaused: false });
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update app configuration (Emergency Stop)
// @route   PUT /api/config
// @access  Private/Admin
const updateConfig = async (req, res) => {
  try {
    const { isOperationsPaused, emergencyMessage } = req.body;

    let config = await AppConfig.findOne();
    if (!config) {
      config = await AppConfig.create({ isOperationsPaused, emergencyMessage });
    } else {
      if (isOperationsPaused !== undefined)
        config.isOperationsPaused = isOperationsPaused;
      if (emergencyMessage !== undefined)
        config.emergencyMessage = emergencyMessage;
      await config.save();
    }

    // 🌟 REAL-TIME MAGIC: Broadcast the pause state to ALL active users instantly
    if (req.io) {
      req.io.emit("app_config_update", config);
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getConfig, updateConfig };
