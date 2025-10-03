export interface User {
  username: string;
  password: string;
  email?: string;
  bio?: string;
  avatarUrl?: string; 
  createdAt?: string; 
  
  gallery?: string[]; 
}
