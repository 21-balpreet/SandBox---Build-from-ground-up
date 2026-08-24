import React, { createContext, useState, useEffect, ReactNode } from "react";
import { User, UserProfile } from "../types/user";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { toast } from "sonner";


interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isSupabaseConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  summary: "Computer Science undergrad with experience in React and Node.js.",
  skills: ["React", "TypeScript", "Node.js", "Express", "PostgreSQL"],
  experience: [],
  education: [],
  target_roles: ["Frontend Developer", "SDE-1", "Fullstack Engineer"],
  target_locations: ["Bangalore", "Pune", "Remote"],
  preferred_job_type: "full-time"
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync session on mount and listen to Supabase auth state change
  useEffect(() => {
    let subscription: any = null;

    async function initAuth() {
      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setToken(session.access_token);
            await fetchAndSetSupabaseProfile(session.user.id, session.user.email || "", session.user.user_metadata?.name);
          } else {
            loadLocalUserFallback();
          }
        } catch (err) {
          console.warn("Supabase auth session fetch error, fallback to local state:", err);
          loadLocalUserFallback();
        }

        const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
          if (session?.user) {
            setToken(session.access_token);
            await fetchAndSetSupabaseProfile(session.user.id, session.user.email || "", session.user.user_metadata?.name);
          } else if (_event === "SIGNED_OUT") {
            setUser(null);
            setToken(null);
            localStorage.removeItem("jobgenie_token");
            localStorage.removeItem("jobgenie_user");
          }
        });
        subscription = data.subscription;
      } else {
        loadLocalUserFallback();
      }
      setLoading(false);
    }

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadLocalUserFallback = () => {
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
  };

  const fetchAndSetSupabaseProfile = async (userId: string, email: string, fallbackName?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.warn("Error fetching Supabase profile:", error.message);
      }

      let profileData: UserProfile = DEFAULT_PROFILE;
      let userName = fallbackName || email.split("@")[0].toUpperCase();

      if (data) {
        userName = data.name || userName;
        profileData = {
          summary: data.summary || DEFAULT_PROFILE.summary,
          skills: data.skills || DEFAULT_PROFILE.skills,
          experience: DEFAULT_PROFILE.experience,
          education: DEFAULT_PROFILE.education,
          target_roles: data.target_roles || DEFAULT_PROFILE.target_roles,
          target_locations: data.target_locations || DEFAULT_PROFILE.target_locations,
          preferred_job_type: data.preferred_job_type || DEFAULT_PROFILE.preferred_job_type
        };
      } else {
        // Upsert default profile record
        await supabase.from("profiles").upsert({
          id: userId,
          name: userName,
          email: email,
          summary: DEFAULT_PROFILE.summary,
          skills: DEFAULT_PROFILE.skills,
          target_roles: DEFAULT_PROFILE.target_roles,
          target_locations: DEFAULT_PROFILE.target_locations,
          preferred_job_type: DEFAULT_PROFILE.preferred_job_type
        });
      }

      const activeUser: User = {
        id: userId,
        name: userName,
        email: email,
        profile: profileData,
        savedJobs: []
      };

      setUser(activeUser);
      localStorage.setItem("jobgenie_user", JSON.stringify(activeUser));
    } catch (err) {
      console.error("Failed to sync profile from Supabase:", err);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw new Error(error.message);

        if (data.session && data.user) {
          setToken(data.session.access_token);
          localStorage.setItem("jobgenie_token", data.session.access_token);
          await fetchAndSetSupabaseProfile(data.user.id, data.user.email || email, data.user.user_metadata?.name);
          setLoading(false);
          return;
        }
      }

      // Offline / Fallback local login handling
      const registeredUsersStr = localStorage.getItem("jobgenie_registered_users");
      const registeredUsers = registeredUsersStr ? JSON.parse(registeredUsersStr) : [];
      const foundUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (foundUser) {
        const loggedUser: User = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          profile: foundUser.profile || DEFAULT_PROFILE,
          savedJobs: []
        };
        const localTok = "mock_jwt_token_" + foundUser.id;
        localStorage.setItem("jobgenie_token", localTok);
        localStorage.setItem("jobgenie_user", JSON.stringify(loggedUser));
        setToken(localTok);
        setUser(loggedUser);
        setLoading(false);
        return;
      }

      // Default demo login for candidate@example.com
      if (email === "candidate@example.com") {
        const mockUser: User = {
          id: "mock_user_123",
          name: "Amit Sharma",
          email: email,
          profile: DEFAULT_PROFILE,
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

      // Instant developer auto-registration fallback
      const generatedId = "user_" + Math.random().toString(36).substr(2, 9);
      const newUserObj = {
        id: generatedId,
        name: email.split("@")[0].toUpperCase(),
        email: email,
        password: password,
        profile: DEFAULT_PROFILE
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
    } catch (error: any) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });

        if (error) throw new Error(error.message);

        if (data.user) {
          // Attempt to insert profile record into profiles table
          try {
            await supabase.from("profiles").upsert({
              id: data.user.id,
              name: name,
              email: email,
              summary: DEFAULT_PROFILE.summary,
              skills: DEFAULT_PROFILE.skills,
              target_roles: DEFAULT_PROFILE.target_roles,
              target_locations: DEFAULT_PROFILE.target_locations,
              preferred_job_type: DEFAULT_PROFILE.preferred_job_type
            });
          } catch (profileErr) {
            console.warn("Profile table insert notice:", profileErr);
          }

          if (data.session) {
            setToken(data.session.access_token);
            localStorage.setItem("jobgenie_token", data.session.access_token);
          }

          const registeredUser: User = {
            id: data.user.id,
            name: name,
            email: email,
            profile: DEFAULT_PROFILE,
            savedJobs: []
          };

          setUser(registeredUser);
          localStorage.setItem("jobgenie_user", JSON.stringify(registeredUser));
          setLoading(false);

          if (!data.session) {
            toast.info("Account created in Supabase! If 'Confirm Email' is enabled in your Supabase project, please check your email inbox to confirm.", { duration: 6000 });
          } else {
            toast.success("Account successfully created in Supabase database!");
          }
          return;
        }

      }

      // Local fallback register
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
        profile: DEFAULT_PROFILE
      };
      
      registeredUsers.push(newUserObj);
      localStorage.setItem("jobgenie_registered_users", JSON.stringify(registeredUsers));
      
      const loggedUser: User = {
        id: newUserId,
        name,
        email,
        profile: DEFAULT_PROFILE,
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

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn("Supabase sign out error:", err);
      }
    }
    localStorage.removeItem("jobgenie_token");
    localStorage.removeItem("jobgenie_user");
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (profile: UserProfile): Promise<User> => {
    if (!user) throw new Error("No authenticated user");
    
    const updatedUser: User = { ...user, profile };
    setUser(updatedUser);
    localStorage.setItem("jobgenie_user", JSON.stringify(updatedUser));

    if (isSupabaseConfigured) {
      try {
        await supabase.from("profiles").upsert({
          id: user.id,
          name: user.name,
          email: user.email,
          summary: profile.summary,
          skills: profile.skills,
          target_roles: profile.target_roles,
          target_locations: profile.target_locations,
          preferred_job_type: profile.preferred_job_type
        });
      } catch (err) {
        console.error("Failed to update profile in Supabase:", err);
      }
    }

    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      isSupabaseConnected: isSupabaseConfigured,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
