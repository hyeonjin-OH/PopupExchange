export interface Message {
  id?: string;
  text: string;
  sender: string;
  senderId: string;
  timestamp: string;
}

export interface ChatRoom {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
} 