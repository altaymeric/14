export class UserController {
  constructor() {
    // Initialize with in-memory storage for demo
    this.users = [];
  }

  getAllUsers = (req, res) => {
    try {
      res.json(this.users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  getUserById = (req, res) => {
    try {
      const user = this.users.find(u => u.id === req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  createUser = (req, res) => {
    try {
      const { name, email } = req.body;
      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        createdAt: new Date()
      };
      this.users.push(newUser);
      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  updateUser = (req, res) => {
    try {
      const { name, email } = req.body;
      const userIndex = this.users.findIndex(u => u.id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      this.users[userIndex] = {
        ...this.users[userIndex],
        name,
        email,
        updatedAt: new Date()
      };

      res.json(this.users[userIndex]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  deleteUser = (req, res) => {
    try {
      const userIndex = this.users.findIndex(u => u.id === req.params.id);
      
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
      }

      this.users.splice(userIndex, 1);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
}