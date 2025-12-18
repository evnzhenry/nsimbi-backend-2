const { User, Wallet, Transaction, Item, sequelize } = require('../models');

exports.topUp = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { amount, paymentMethod, phoneNumber, provider, bankName, accountNumber, pin } = req.body;
    const userId = req.user.userId;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const wallet = await Wallet.findOne({ where: { userId } }, { transaction: t });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Simulate Payment Gateway Processing
    let description = 'Wallet Top-up';
    
    if (paymentMethod === 'mobile_money') {
        if (!phoneNumber || !provider || !pin) {
             await t.rollback();
             return res.status(400).json({ message: 'Missing Mobile Money details (Provider, Phone, PIN)' });
        }
        // In a real app, we would verify the PIN with the provider API here
        description = `Mobile Money Top-up (${provider} - ${phoneNumber})`;
    } else if (paymentMethod === 'bank_transfer') {
        if (!bankName || !accountNumber || !pin) {
            await t.rollback();
            return res.status(400).json({ message: 'Missing Bank details (Bank Name, Account No, PIN)' });
        }
        // In a real app, we would verify with the Bank API here
        description = `Bank Transfer Top-up (${bankName} - ${accountNumber})`;
    } else {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid payment method' });
    }

    wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
    await wallet.save({ transaction: t });

    await Transaction.create({
      type: 'topup',
      amount,
      fromUserId: null, // External source
      toUserId: userId,
      description,
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Top-up successful', balance: wallet.balance });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.lookupStudent = async (req, res) => {
  try {
    const { studentIdNumber } = req.body;
    
    if (!studentIdNumber) {
      return res.status(400).json({ message: 'Student ID Number is required' });
    }

    const student = await User.findOne({ 
      where: { studentIdNumber },
      attributes: ['id', 'name', 'studentIdNumber', 'nfcCardId']
    });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.transfer = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { studentId, amount } = req.body;
    const parentId = req.user.userId;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const parentWallet = await Wallet.findOne({ where: { userId: parentId } }, { transaction: t });
    const studentWallet = await Wallet.findOne({ where: { userId: studentId } }, { transaction: t });

    if (!parentWallet || !studentWallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (parseFloat(parentWallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // Fetch student name for better transaction description
    const studentUser = await User.findByPk(studentId, { transaction: t });
    const studentName = studentUser ? studentUser.name : 'Student';

    parentWallet.balance = parseFloat(parentWallet.balance) - parseFloat(amount);
    studentWallet.balance = parseFloat(studentWallet.balance) + parseFloat(amount);

    await parentWallet.save({ transaction: t });
    await studentWallet.save({ transaction: t });

    await Transaction.create({
      type: 'transfer',
      amount,
      fromUserId: parentId,
      toUserId: studentId,
      description: `Transfer to ${studentName}`,
    }, { transaction: t });

    await t.commit();
    res.json({ message: 'Transfer successful' });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.charge = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { studentNfcCardId, amount, cardPin, items } = req.body;
    const merchantId = req.user.userId;

    if (amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Find student by NFC ID
    const student = await User.findOne({ where: { nfcCardId: studentNfcCardId } });
    if (!student) {
      await t.rollback();
      return res.status(404).json({ message: 'Student not found' });
    }

    // Verify PIN if provided
    if (cardPin) {
        if (!student.cardPin) {
             await t.rollback();
             return res.status(400).json({ message: 'Student has no PIN set. Please contact admin.' });
        }
        
        const bcrypt = require('bcrypt');
        const isPinValid = await bcrypt.compare(cardPin, student.cardPin);
        
        if (!isPinValid) {
            await t.rollback();
            return res.status(401).json({ message: 'Invalid PIN' });
        }
    } else {
        // Enforce PIN for all charges
        await t.rollback();
        return res.status(400).json({ message: 'Student PIN is required' });
    }

    // Check Inventory Stock
    if (items && Array.isArray(items)) {
        for (const item of items) {
            if (item.inventoryId) {
                const inventoryItem = await Item.findOne({ 
                    where: { id: item.inventoryId, merchantId },
                    transaction: t
                });

                if (!inventoryItem) {
                    await t.rollback();
                    return res.status(400).json({ message: `Item ${item.name} not found in inventory` });
                }

                // Calculate quantity for this specific item in this batch
                // (In case multiple of same item are added as separate entries)
                // Note: Better to pre-aggregate, but for now simple check
                // We'll just deduct 1 for this entry.
                // If items are grouped by ID, we need to handle quantity.
                // Assuming item has quantity or is single entry = 1.
                const quantityToDeduct = item.quantity || 1;

                if (inventoryItem.stock < quantityToDeduct) {
                     await t.rollback();
                     return res.status(400).json({ message: `Item ${inventoryItem.name} is out of stock (Available: ${inventoryItem.stock})` });
                }

                inventoryItem.stock -= quantityToDeduct;
                await inventoryItem.save({ transaction: t });
            }
        }
    }

    const studentWallet = await Wallet.findOne({ where: { userId: student.id } }, { transaction: t });
    const merchantWallet = await Wallet.findOne({ where: { userId: merchantId } }, { transaction: t });

    if (!studentWallet || !merchantWallet) {
      await t.rollback();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (parseFloat(studentWallet.balance) < parseFloat(amount)) {
      await t.rollback();
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    studentWallet.balance = parseFloat(studentWallet.balance) - parseFloat(amount);
    merchantWallet.balance = parseFloat(merchantWallet.balance) + parseFloat(amount);

    await studentWallet.save({ transaction: t });
    await merchantWallet.save({ transaction: t });

    // Format description with items if available
    let description = 'Merchant Payment';
    let details = null;

    if (items && Array.isArray(items) && items.length > 0) {
        const itemDetails = items.map(item => `${item.name} (${item.price})`).join(', ');
        description = `Payment: ${itemDetails}`;

        // Group items for details
        const groupedItems = {};
        items.forEach(item => {
            const key = item.name; // Group by name
            if (!groupedItems[key]) {
                groupedItems[key] = {
                    name: item.name,
                    quantity: 0,
                    unitPrice: item.price,
                    totalPrice: 0
                };
            }
            groupedItems[key].quantity += 1;
            groupedItems[key].totalPrice += parseFloat(item.price);
        });
        details = Object.values(groupedItems);
    }

    await Transaction.create({
      type: 'payment',
      amount,
      fromUserId: student.id,
      toUserId: merchantId,
      description,
      details,
    }, { transaction: t });

    await t.commit();
    res.json({ 
        message: 'Charge successful',
        newBalance: studentWallet.balance
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    // Security check: only allow viewing own balance unless admin (simplified)
    if (req.user.role !== 'admin' && parseInt(userId) !== req.user.userId) {
       return res.status(403).json({ message: 'Unauthorized' });
    }

    const wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    res.json({ balance: wallet.balance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
