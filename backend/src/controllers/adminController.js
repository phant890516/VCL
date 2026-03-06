import adminService from '../services/adminService.js';

class AdminController {
  async resetData(req, res) {
    try {
      const result = await adminService.resetAllTrophies();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new AdminController();
