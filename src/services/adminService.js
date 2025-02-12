import axios from 'axios';

class AdminService {
  // Dashboard Stats
  async getDashboardStats(period = 'week') {
    const response = await axios.get(`/api/admin/dashboard-stats?period=${period}`);
    return response.data;
  }

  // Jobs
  async getJobs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/jobs?${params}`);
    return response.data;
  }

  async updateJobStatus(jobId, action, reason) {
    const response = await axios.post(`/api/admin/jobs/${jobId}/${action}`, { reason });
    return response.data;
  }

  async updateBatchJobs(jobIds, action, reason) {
    const response = await axios.post('/api/admin/batch/update-jobs', {
      jobIds,
      action,
      reason
    });
    return response.data;
  }

  async deleteJob(jobId) {
    const response = await axios.delete(`/api/admin/jobs/${jobId}`);
    return response.data;
  }

  // Profiles
  async getProfilesToVerify(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/profiles/verify?${params}`);
    return response.data;
  }

  async verifyProfile(profileId, action, reason) {
    try {
      if (!profileId || !action || !reason) {
        throw new Error('Missing required parameters for profile verification');
      }

      const response = await axios.post(`/api/admin/profiles/${profileId}/verify`, {
        action,
        reason
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Profile verification failed:', error.response.data);
        throw new Error(error.response.data.message || 'Failed to verify profile');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('Failed to communicate with server');
      } else {
        // Something happened in setting up the request
        console.error('Error setting up request:', error.message);
        throw error;
      }
    }
  }

  // Disputes
  async getDisputes(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/disputes?${params}`);
    return response.data;
  }

  async resolveDispute(disputeId, resolution) {
    const response = await axios.post(`/api/admin/disputes/${disputeId}/resolve`, {
      resolution
    });
    return response.data;
  }

  // Users
  async getUsers(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/users?${params}`);
    return response.data;
  }

  async updateUserStatus(userId, action, reason) {
    const response = await axios.post(`/api/admin/users/${userId}/${action}`, { reason });
    return response.data;
  }

  // Settings
  async getSettings() {
    const response = await axios.get('/api/admin/settings');
    return response.data;
  }

  async updateSettings(settings) {
    const response = await axios.put('/api/admin/settings', settings);
    return response.data;
  }

  // Reports & Analytics
  async getAnalytics(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/analytics?${params}`);
    return response.data;
  }

  async generateReport(type, filters = {}) {
    const response = await axios.post('/api/admin/reports/generate', {
      type,
      filters
    });
    return response.data;
  }

  async getAuditLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/audit-logs?${params}`);
    return response.data;
  }

  // System Health
  async getSystemHealth() {
    const response = await axios.get('/api/admin/system/health');
    return response.data;
  }

  async getSystemMetrics(period = '24h') {
    const response = await axios.get(`/api/admin/system/metrics?period=${period}`);
    return response.data;
  }

  // Error Logs
  async getErrorLogs(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await axios.get(`/api/admin/errors?${params}`);
    return response.data;
  }

  // Cache Management
  async clearCache(target) {
    const response = await axios.post('/api/admin/cache/clear', { target });
    return response.data;
  }

  async getCacheStats() {
    const response = await axios.get('/api/admin/cache/stats');
    return response.data;
  }

  // Backup & Maintenance
  async createBackup() {
    const response = await axios.post('/api/admin/backup/create');
    return response.data;
  }

  async getBackups() {
    const response = await axios.get('/api/admin/backups');
    return response.data;
  }

  async restoreBackup(backupId) {
    const response = await axios.post(`/api/admin/backup/${backupId}/restore`);
    return response.data;
  }
}

export default new AdminService();
