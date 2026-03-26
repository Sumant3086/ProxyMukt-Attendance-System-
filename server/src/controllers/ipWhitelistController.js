import IPWhitelist from '../models/IPWhitelist.js';

/**
 * Add IP to whitelist/blacklist
 */
export const addIPRule = async (req, res) => {
  try {
    const { ip, type, reason, student, faculty, expiresAt, notes } = req.body;

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format',
      });
    }

    // Check if IP rule already exists
    const existingRule = await IPWhitelist.findOne({ ip });
    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: 'IP rule already exists',
      });
    }

    const rule = await IPWhitelist.create({
      ip,
      type,
      reason,
      student,
      faculty,
      expiresAt,
      notes,
      addedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `IP ${type.toLowerCase()} rule created`,
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all IP rules
 */
export const getIPRules = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };
    if (type) query.type = type;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [rules, totalCount] = await Promise.all([
      IPWhitelist.find(query)
        .populate('student', 'name email studentId')
        .populate('faculty', 'name email')
        .populate('addedBy', 'name email')
        .sort('-createdAt')
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      IPWhitelist.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        rules,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Check if IP is whitelisted/blacklisted
 */
export const checkIPStatus = async (req, res) => {
  try {
    const { ip } = req.query;

    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required',
      });
    }

    const rule = await IPWhitelist.findOne({
      ip,
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!rule) {
      return res.json({
        success: true,
        data: {
          isWhitelisted: false,
          isBlacklisted: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isWhitelisted: rule.type === 'WHITELIST',
        isBlacklisted: rule.type === 'BLACKLIST',
        reason: rule.reason,
        expiresAt: rule.expiresAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update IP rule
 */
export const updateIPRule = async (req, res) => {
  try {
    const { reason, expiresAt, notes, isActive } = req.body;

    const rule = await IPWhitelist.findByIdAndUpdate(
      req.params.id,
      {
        reason,
        expiresAt,
        notes,
        isActive,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'IP rule updated',
      data: rule,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete IP rule
 */
export const deleteIPRule = async (req, res) => {
  try {
    await IPWhitelist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'IP rule deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
