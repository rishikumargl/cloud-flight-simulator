import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Valid credentials database (mock - replace with real API)
const VALID_CREDENTIALS = {
  users: [
    { email: 'demo@example.com', password: 'password123', name: 'Demo Learner' },
    { email: 'john@example.com', password: 'learner123', name: 'John Doe' },
    { email: 'jane@example.com', password: 'learner123', name: 'Jane Smith' },
  ],
  admins: [
    { email: 'admin@example.com', password: 'password123', name: 'Admin User' },
    { email: 'superadmin@example.com', password: 'admin123', name: 'Super Admin' },
  ],
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      role: null, // 'user' or 'admin'
      error: null,

      login: (email, password, role = 'user') => {
        return new Promise((resolve, reject) => {
          set({ isLoading: true, error: null });
          // Simulate API call with credential validation
          setTimeout(() => {
            let validUser = null;
            let userRole = role;

            // Check admin credentials
            if (role === 'admin') {
              validUser = VALID_CREDENTIALS.admins.find(
                (user) => user.email === email && user.password === password
              );
              if (!validUser) {
                set({ isLoading: false, error: 'Invalid admin credentials' });
                reject(new Error('Invalid admin credentials'));
                return;
              }
              userRole = 'admin';
            } else {
              // Check user credentials
              validUser = VALID_CREDENTIALS.users.find(
                (user) => user.email === email && user.password === password
              );
              if (!validUser) {
                set({ isLoading: false, error: 'Invalid credentials' });
                reject(new Error('Invalid credentials'));
                return;
              }
              userRole = 'user';
            }

            if (validUser) {
              set({
                user: {
                  id: `user_${Date.now()}`,
                  email: validUser.email,
                  name: validUser.name
                },
                isAuthenticated: true,
                role: userRole,
                isLoading: false,
                error: null,
              });
              resolve();
            }
          }, 500);
        });
      },

      register: (name, email, password) => {
        return new Promise((resolve, reject) => {
          set({ isLoading: true, error: null });
          // Simulate API call
          setTimeout(() => {
            // Check if email already exists
            const emailExists =
              VALID_CREDENTIALS.users.some(u => u.email === email) ||
              VALID_CREDENTIALS.admins.some(u => u.email === email);

            if (emailExists) {
              set({ isLoading: false, error: 'Email already registered' });
              reject(new Error('Email already registered'));
              return;
            }

            // Add new user to the list
            VALID_CREDENTIALS.users.push({ email, password, name });

            set({
              user: {
                id: `user_${Date.now()}`,
                email,
                name
              },
              isAuthenticated: true,
              role: 'user',
              isLoading: false,
              error: null,
            });
            resolve();
          }, 500);
        });
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          role: null,
        });
      },

      setRole: (role) => {
        set({ role });
      },
    }),
    {
      name: 'auth-storage', // name of the storage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
      }), // only persist these fields
    }
  )
);

export default useAuthStore;
