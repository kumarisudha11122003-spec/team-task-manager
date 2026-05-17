export const useRole = () => {
  const userId = localStorage.getItem('userId');
  return {
    isAdmin: true, // Force full access
    isMember: false,
    userId,
    role: 'admin'
  };
};

export const getCurrentUser = () => ({
  token: localStorage.getItem('token'),
  role: 'admin',
  userId: localStorage.getItem('userId'),
  name: localStorage.getItem('userName'),
  email: localStorage.getItem('userEmail'),
  isAdmin: true
});
