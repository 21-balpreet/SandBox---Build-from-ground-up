import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User, UserProfile } from "../types/user";
import axios from "axios";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Read from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("jobgenie_token");
    const storedUser = localStorage.getItem("jobgenie_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("jobgenie_token");
        localStorage.removeItem("jobgenie_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Offline/Local database for preview sandboxes to prevent any 404/502 API crashes!
      const registeredUsersStr = localStorage.getItem("jobgenie_registered_users");
      const registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
      
      const foundUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const loggedUser: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          profile: foundUser.profile || {
            summary: "Computer Science undergrad with experience in React and Node.js.",
            skills: ["React", "TypeScript", "Node.js"],
            experience: [],
            education: [],
            target_roles: ["Frontend Developer", "SDE-1"],
            target_locations: ["Bangalore", "Pune"],
            preferred_job_type: "full-time"
          },
          savedJobs: []
        };
        
        localStorage.setItem("jobgenie_token", "mock_jwt_token_" + foundUser.id);
        localStorage.setItem("jobgenie_user", JSON.stringify(loggedUser));
        setToken("mock_jwt_token_" + foundUser.id);
        setUser(loggedUser);
        setLoading(false);
        return;
      }

      // Default mock login if they use candidate@example.com
      if (email === "candidate@example.com") {
        const mockUser: User = {
          id: "mock_user_123",
          name: "Amit Sharma",
          email: email,
          profile: {
            summary: "Computer Science undergrad at IIT Delhi with experience in React and Node.js.",
            skills: ["React", "TypeScript", "Node.js", "MongoDB", "Express", "Python"],
            experience: [
              {
                company: "Tech Mahindra",
                role: "Software Engineering Intern",
                duration: "3 Months",
                description: "Developed UI features using React and configured REST API endpoints."
              }
            ],
            education: [
              {
                institution: "IIT Delhi",
                degree: "B.Tech Computer Science",
                year: "2026",
                cgpa: "8.8"
              }
            ],
            target_roles: ["Frontend Developer", "Fullstack Engineer", "Graduate Analyst"],
            target_locations: ["Bangalore", "Pune", "Remote"],
            preferred_job_type: "full-time"
          },
          savedJobs: []
        };
        const mockToken = "mock_jwt_token_for_preview";
        
        localStorage.setItem("jobgenie_token", mockToken);
        localStorage.setItem("jobgenie_user", JSON.stringify(mockUser));
        setToken(mockToken);
        setUser(mockUser);
        setLoading(false);
        return;
      }

      // Graceful auto-registration if they type any query to offer user frictionless developer flow!
      const generatedId = "user_" + Math.random().toString(36).substr(2, 9);
      const newUserObj = {
        id: generatedId,
        name: email.split("@")[0].toUpperCase(),
        email: email,
        password: password,
        profile: {
          summary: "Software Engineering aspirant.",
          skills: ["React", "TypeScript", "JavaScript"],
          experience: [],
          education: [],
          target_roles: ["SDE"],
          target_locations: ["Remote"],
          preferred_job_type: "any"
        } as UserProfile
      };
      const updatedList = [...registeredUsers, newUserObj];
      localStorage.setItem("jobgenie_registered_users", JSON.stringify(updatedList));

      const loggedUser: User = {
        id: newUserObj.id,
        name: newUserObj.name,
        email: newUserObj.email,
        profile: newUserObj.profile,
        savedJobs: []
      };

      localStorage.setItem("jobgenie_token", "mock_jwt_token_" + generatedId);
      localStorage.setItem("jobgenie_user", JSON.stringify(loggedUser));
      setToken("mock_jwt_token_" + generatedId);
      setUser(loggedUser);
      setLoading(false);
    } catch (error: any) {
      setLoading(false);
      throw new Error("Invalid credentials or authentication error.");
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const registeredUsersStr = localStorage.getItem("jobgenie_registered_users");
      const registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
      
      const exists = registeredUsers.some((u: any) => u.email === email);
      if (exists) {
        throw new Error("This email is already registered.");
      }
      
      const newUserId = "user_" + Date.now();
      const newUserObj = {
        id: newUserId,
        name,
        email,
        password,
        profile: {
          summary: `Computer Science candidate name ${name}.`,
          skills: ["React", "TypeScript", "Node.js"],
          experience: [],
          education: [],
          target_roles: ["SDE-1", "Frontend Engineer"],
          target_locations: ["Bangalore", "Pune"],
          preferred_job_type: "full-time"
        } as UserProfile
      };
      
      registeredUsers.push(newUserObj);
      localStorage.setItem("jobgenie_registered_users", JSON.stringify(registeredUsers));
      
      const loggedUser: User = {
        id: newUserId,
        name,
        email,
        profile: newUserObj.profile,
        savedJobs: []
      };
      
      localStorage.setItem("jobgenie_token", "mock_jwt_token_" + newUserId);
      localStorage.setItem("jobgenie_user", JSON.stringify(loggedUser));
      setToken("mock_jwt_token_" + newUserId);
      setUser(loggedUser);
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("jobgenie_token");
    localStorage.removeItem("jobgenie_user");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profile: UserProfile): Promise<User> => {
    if (!user) throw new Error("No authenticated user");
    
    try {
      const updatedUser: User = { ...user, profile };
      localStorage.setItem("jobgenie_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      // Sync back to registered local dictionary
      const registeredUsersStr = localStorage.getItem("jobgenie_registered_users");
      if (registeredUsersStr) {
        const registeredUsers = JSON.parse(registeredUsersStr);
        const idx = registeredUsers.findIndex((u: any) => u.email === user.email);
        if (idx !== -1) {
          registeredUsers[idx].profile = profile;
          localStorage.setItem("jobgenie_registered_users", JSON.stringify(registeredUsers));
        }
      }
      return updatedUser;
    } catch (error: any) {
      const updatedUser: User = { ...user, profile };
      localStorage.setItem("jobgenie_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
