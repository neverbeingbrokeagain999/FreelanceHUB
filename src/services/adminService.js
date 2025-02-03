const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const adminService = {
  async getDashboardData(timeRange) {
    const response = await fetch(
      `${API_URL}/api/admin/dashboard?timeRange=${timeRange}`,
      { headers: getAuthHeader() }
    );
    if (!response.ok) throw new Error('Failed to fetch dashboard data');
    return response.json();
  },

  async verifyFreelancer(id) {
    const response = await fetch(
      `${API_URL}/api/admin/freelancers/${id}/verify`,
      {
        method: 'POST',
        headers: getAuthHeader()
      }
    );
    if (!response.ok) throw new Error('Failed to verify freelancer');
    return response.json();
  },

  async resolveDispute(id, status) {
    const response = await fetch(
      `${API_URL}/api/admin/disputes/${id}/resolve`,
      {
        method: 'POST',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      }
    );
    if (!response.ok) throw new Error('Failed to resolve dispute');
    return response.json();
  },

  async suspendFreelancer(id) {
    const response = await fetch(
      `${API_URL}/api/admin/freelancers/${id}/suspend`,
      {
        method: 'POST',
        headers: getAuthHeader()
      }
    );
    if (!response.ok) throw new Error('Failed to suspend freelancer');
    return response.json();
  }
};
