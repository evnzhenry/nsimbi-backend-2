const { Item } = require('../models');

// Get all items for the logged-in merchant
exports.getInventory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Item.findAndCountAll({
        where: { merchantId: req.user.userId },
        limit: limit,
        offset: offset,
        order: [['name', 'ASC']]
    });

    res.json({
        items: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalItems: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new item
exports.createItem = async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    const item = await Item.create({
      name,
      description,
      price,
      stock,
      merchantId: req.user.userId,
    });
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock } = req.body;

    const item = await Item.findOne({ where: { id, merchantId: req.user.userId } });
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    item.name = name || item.name;
    item.description = description || item.description;
    item.price = price || item.price;
    item.stock = stock || item.stock;
    
    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete an item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ where: { id, merchantId: req.user.userId } });
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    await item.destroy();
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
