import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { user } = useAuth();

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const baseUrl = process.env.NODE_ENV === 'production' ? '/api' : (process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
      
      const [tasksRes, usersRes, projectsRes, meRes] = await Promise.all([
        fetch(`${baseUrl}/tasks`, { headers }),
        fetch(`${baseUrl}/users`, { headers }),
        fetch(`${baseUrl}/projects`, { headers }),
        fetch(`${baseUrl}/users/me`, { headers })
      ]);
      
      const tasksData = await tasksRes.json();
      const usersData = await usersRes.json();
      const projectsData = await projectsRes.json();
      const meData = await meRes.json();
      
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setCurrentUser(meData.error ? null : meData);
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAll();
    } else {
      setLoading(false);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{ 
      tasks, users, projects, currentUser,
      loading, refetch: fetchAll,
      setTasks, setUsers 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
