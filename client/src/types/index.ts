export type StatusType = "pending" | "active" | "completed" | "warning";

export interface User {
  id: number;
  username: string;
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
  buyerId: number;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
}
