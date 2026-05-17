export const useRole = () => {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role') || 'member';
  return {
    isAdmin: role === 'admin',
    isMember: role === 'member',
    userId,
    role
  };
};

export const getCurrentUser = () => {
  const role = localStorage.getItem('role') || 'member';
  return {
    token: localStorage.getItem('token'),
    role,
    userId: localStorage.getItem('userId'),
    name: localStorage.getItem('userName'),
    email: localStorage.getItem('userEmail'),
    isAdmin: role === 'admin'
  };
};
