const { AppVersion } = require('../models');
const { Op } = require('sequelize');

exports.checkUpdate = async (req, res) => {
  try {
    const { platform, version, buildNumber } = req.query;

    if (!platform) {
      return res.status(400).json({ message: 'Platform is required' });
    }

    // Find the latest version for the platform
    const latestVersion = await AppVersion.findOne({
      where: { platform },
      order: [['buildNumber', 'DESC']],
    });

    if (!latestVersion) {
      return res.json({ updateAvailable: false });
    }

    // Check if update is needed
    // We prioritize buildNumber for comparison as it's strictly increasing
    const currentBuild = parseInt(buildNumber, 10) || 0;
    
    if (latestVersion.buildNumber > currentBuild) {
      return res.json({
        updateAvailable: true,
        forceUpdate: latestVersion.forceUpdate,
        title: latestVersion.title,
        message: latestVersion.message,
        storeUrl: latestVersion.storeUrl,
        version: latestVersion.version
      });
    }

    return res.json({ updateAvailable: false });

  } catch (error) {
    console.error('Check update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
