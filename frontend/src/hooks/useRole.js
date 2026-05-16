export const useRole = () => {
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  return {
    isAdmin: role === 'admin',
    isMember: role === 'member',
    userId,
    role
  };
};

export const getCurrentUser = () => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role'),
  userId: localStorage.getItem('userId'),
  name: localStorage.getItem('userName'),
  email: localStorage.getItem('userEmail'),
  isAdmin: localStorage.getItem('role') === 'admin'
});
