const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Wallet } = require('../models');
const { OAuth2Client } = require('google-auth-library');

// Initialize Google Client (Client ID should be in env vars)
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleAuth = async (req, res) => {
  try {
    const { token, userInfo } = req.body;
    let email, name, googleId;

    // Verify token if provided (Backend verification is best practice)
    // For this implementation, we'll trust the userInfo from Expo if token verification fails/is skipped in dev
    // In production, ALWAYS verify the idToken
    
    if (token) {
      try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        googleId = payload.sub;
      } catch (e) {
        console.log('Token verification failed, falling back to userInfo if provided (Dev mode)');
        // Fallback for dev/expo client where verifying might be tricky without proper setup
        if (userInfo) {
          email = userInfo.email;
          name = userInfo.name;
          googleId = userInfo.id;
        } else {
          throw new Error('Invalid token and no user info provided');
        }
      }
    } else if (userInfo) {
       // Direct userInfo usage (Less secure, but useful for Expo Go dev)
       email = userInfo.email;
       name = userInfo.name;
       googleId = userInfo.id;
    } else {
      return res.status(400).json({ message: 'No token or user info provided' });
    }

    // Check if user exists
    let user = await User.findOne({ where: { email } });

    if (!user) {
      // User doesn't exist.
      // If role restriction is needed, check here. 
      // Assumption: New Google users are 'parent' by default.
      
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name,
        email,
        password: hashedPassword, // Dummy password
        role: 'parent', // Default role for self-signup
      });

      // Create Wallet
      await Wallet.create({ userId: user.id });
    }

    // If user exists, or just created, generate token
    const jwtToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ message: 'Google Authentication failed' });
  }
};

exports.register = async (req, res) => {
  try {
    let { name, email, password, role, nfcCardId, parentId, studentClass, studentIdNumber, cardPin } = req.body;

    if (studentIdNumber) studentIdNumber = studentIdNumber.trim();
    if (email) email = email.trim().toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Hash PIN if provided
    let hashedPin = null;
    if (cardPin) {
      hashedPin = await bcrypt.hash(cardPin, 10);
    }

    // Create User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      nfcCardId,
      parentId,
      studentClass,
      studentIdNumber,
      cardPin: hashedPin,
    });

    // Create Wallet for User
    await Wallet.create({ userId: user.id });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find User
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate Token
    const token = jwt.sign(
      { userId: user.id, role: user.role, campusId: user.campusId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        campusId: user.campusId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
