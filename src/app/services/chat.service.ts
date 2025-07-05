import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ChatMessage, ChatRoom, ChatNotification } from '../models/chat.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  private notificationsSubject = new BehaviorSubject<ChatNotification[]>([]);
  private onlineUsersSubject = new BehaviorSubject<number[]>([]);
  
  public messages$ = this.messagesSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();
  public onlineUsers$ = this.onlineUsersSubject.asObservable();

  private messages: ChatMessage[] = [
    {
      id: 1,
      senderId: 1,
      senderName: 'Dr. Martin',
      receiverId: 2,
      receiverName: 'Secrétaire Dubois',
      content: 'Bonjour, pouvez-vous programmer un RDV pour Mme Dupont ?',
      timestamp: new Date('2024-01-15T09:30:00'),
      isRead: true,
      messageType: 'TEXT'
    },
    {
      id: 2,
      senderId: 2,
      senderName: 'Secrétaire Dubois',
      receiverId: 1,
      receiverName: 'Dr. Martin',
      content: 'Bien sûr, je m\'en occupe immédiatement.',
      timestamp: new Date('2024-01-15T09:32:00'),
      isRead: true,
      messageType: 'TEXT'
    },
    {
      id: 3,
      senderId: 3,
      senderName: 'Dr. Bernard',
      receiverId: 1,
      receiverName: 'Dr. Martin',
      content: 'Avez-vous reçu les résultats d\'analyse du patient Martin ?',
      timestamp: new Date('2024-01-15T14:15:00'),
      isRead: false,
      messageType: 'TEXT'
    }
  ];

  private notifications: ChatNotification[] = [
    {
      id: 1,
      userId: 1,
      message: 'Nouveau message de Secrétaire Dubois',
      type: 'NEW_MESSAGE',
      isRead: false,
      createdAt: new Date('2024-01-15T09:32:00')
    },
    {
      id: 2,
      userId: 1,
      message: 'Rappel: RDV avec Marie Dubois dans 30 minutes',
      type: 'APPOINTMENT_REMINDER',
      isRead: false,
      createdAt: new Date('2024-01-15T08:30:00')
    }
  ];

  private onlineUsers: number[] = [1, 2, 3]; // IDs des utilisateurs en ligne

  constructor(private authService: AuthService) {
    this.messagesSubject.next(this.messages);
    this.notificationsSubject.next(this.notifications);
    this.onlineUsersSubject.next(this.onlineUsers);
  }

  // Récupérer tous les messages
  getMessages(): Observable<ChatMessage[]> {
    return of([...this.messages]);
  }

  // Récupérer les messages entre deux utilisateurs
  getMessagesBetweenUsers(userId1: number, userId2: number): Observable<ChatMessage[]> {
    const filteredMessages = this.messages.filter(msg => 
      (msg.senderId === userId1 && msg.receiverId === userId2) ||
      (msg.senderId === userId2 && msg.receiverId === userId1)
    ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    return of(filteredMessages);
  }

  // Envoyer un message
  sendMessage(receiverId: number, content: string, messageType: 'TEXT' | 'FILE' | 'IMAGE' = 'TEXT'): Observable<ChatMessage> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    const newMessage: ChatMessage = {
      id: this.getNextMessageId(),
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      receiverId: receiverId,
      receiverName: 'Destinataire', // À récupérer depuis le service utilisateur
      content: content,
      timestamp: new Date(),
      isRead: false,
      messageType: messageType
    };

    this.messages.push(newMessage);
    this.messagesSubject.next([...this.messages]);

    // Simuler l'envoi WebSocket
    this.simulateWebSocketMessage(newMessage);

    // Créer une notification pour le destinataire
    this.createNotification(receiverId, `Nouveau message de ${newMessage.senderName}`, 'NEW_MESSAGE');

    return of(newMessage);
  }

  // Marquer un message comme lu
  markMessageAsRead(messageId: number): Observable<boolean> {
    const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].isRead = true;
      this.messagesSubject.next([...this.messages]);
      return of(true);
    }
    return of(false);
  }

  // Marquer tous les messages d'une conversation comme lus
  markConversationAsRead(otherUserId: number): Observable<boolean> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(false);

    let updated = false;
    this.messages.forEach(msg => {
      if (msg.senderId === otherUserId && msg.receiverId === currentUser.id && !msg.isRead) {
        msg.isRead = true;
        updated = true;
      }
    });

    if (updated) {
      this.messagesSubject.next([...this.messages]);
    }

    return of(updated);
  }

  // Récupérer les notifications
  getNotifications(): Observable<ChatNotification[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);

    const userNotifications = this.notifications.filter(notif => notif.userId === currentUser.id);
    return of(userNotifications);
  }

  // Créer une notification
  createNotification(userId: number, message: string, type: 'NEW_MESSAGE' | 'APPOINTMENT_REMINDER' | 'SYSTEM'): void {
    const notification: ChatNotification = {
      id: this.getNextNotificationId(),
      userId: userId,
      message: message,
      type: type,
      isRead: false,
      createdAt: new Date()
    };

    this.notifications.push(notification);
    this.notificationsSubject.next([...this.notifications]);
  }

  // Marquer une notification comme lue
  markNotificationAsRead(notificationId: number): Observable<boolean> {
    const notificationIndex = this.notifications.findIndex(notif => notif.id === notificationId);
    if (notificationIndex !== -1) {
      this.notifications[notificationIndex].isRead = true;
      this.notificationsSubject.next([...this.notifications]);
      return of(true);
    }
    return of(false);
  }

  // Récupérer le nombre de messages non lus
  getUnreadMessagesCount(): Observable<number> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(0);

    const unreadCount = this.messages.filter(msg => 
      msg.receiverId === currentUser.id && !msg.isRead
    ).length;

    return of(unreadCount);
  }

  // Récupérer le nombre de notifications non lues
  getUnreadNotificationsCount(): Observable<number> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of(0);

    const unreadCount = this.notifications.filter(notif => 
      notif.userId === currentUser.id && !notif.isRead
    ).length;

    return of(unreadCount);
  }

  // Récupérer les utilisateurs en ligne
  getOnlineUsers(): Observable<number[]> {
    return of([...this.onlineUsers]);
  }

  // Vérifier si un utilisateur est en ligne
  isUserOnline(userId: number): boolean {
    return this.onlineUsers.includes(userId);
  }

  // Simuler la connexion WebSocket
  private simulateWebSocketMessage(message: ChatMessage): void {
    // Dans une vraie application, ceci serait géré par WebSocket
    setTimeout(() => {
      console.log('Message envoyé via WebSocket:', message);
    }, 100);
  }

  // Générer le prochain ID de message
  private getNextMessageId(): number {
    return Math.max(...this.messages.map(msg => msg.id), 0) + 1;
  }

  // Générer le prochain ID de notification
  private getNextNotificationId(): number {
    return Math.max(...this.notifications.map(notif => notif.id), 0) + 1;
  }

  // Récupérer les conversations récentes
  getRecentConversations(): Observable<any[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return of([]);

    const conversations = new Map();
    
    this.messages.forEach(msg => {
      const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
      const otherUserName = msg.senderId === currentUser.id ? msg.receiverName : msg.senderName;
      
      if (!conversations.has(otherUserId) || 
          conversations.get(otherUserId).lastMessage.timestamp < msg.timestamp) {
        conversations.set(otherUserId, {
          userId: otherUserId,
          userName: otherUserName,
          lastMessage: msg,
          unreadCount: this.messages.filter(m => 
            m.senderId === otherUserId && 
            m.receiverId === currentUser.id && 
            !m.isRead
          ).length,
          isOnline: this.isUserOnline(otherUserId)
        });
      }
    });

    return of(Array.from(conversations.values()).sort((a, b) => 
      b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime()
    ));
  }
}