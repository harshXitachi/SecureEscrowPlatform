export type StatusType = "pending" | "active" | "completed" | "warning";
export type UserRole = "buyer" | "seller" | "broker" | "admin" | "user";
export type RequestStatus = "pending" | "accepted" | "rejected";

export interface User {
  id: number;
  username: string;
  role?: UserRole;
  rating?: number;
  description?: string;
  completedTransactions?: number;
  joinedDate?: string;
}

export interface BrokerRequest {
  id: number;
  buyerId: number;
  buyer: User;
  brokerId: number;
  broker: User;
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: number;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  completedAt: string | null;
  status: StatusType;
  transactionId: number;
}

export interface Transaction {
  id: number;
  title: string;
  description: string;
  type: string;
  amount: string;
  currency: string;
  dueDate: string;
  status: StatusType;
  buyer: User;
  seller: User;
  broker?: User;
  buyerId: number;
  sellerId: number;
  brokerId?: number;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
}
