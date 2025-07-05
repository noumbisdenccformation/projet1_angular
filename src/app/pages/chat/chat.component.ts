import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage } from '../../models/chat.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatListModule,
    MatBadgeModule,
    MatDividerModule,
    MatToolbarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  // État du composant
  conversations: any[] = [];
  selectedConversation: any = null;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  loading = false;
  sending = false;

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadConversations();
    this.subscribeToMessages();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private loadConversations(): void {
    this.loading = true;
    const sub = this.chatService.getRecentConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
        this.loading = false;
        
        // Sélectionner la première conversation par défaut
        if (conversations.length > 0 && !this.selectedConversation) {
          this.selectConversation(conversations[0]);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des conversations:', error);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private subscribeToMessages(): void {
    const sub = this.chatService.messages$.subscribe(messages => {
      if (this.selectedConversation) {
        this.loadMessagesForConversation(this.selectedConversation.userId);
      }
    });
    this.subscriptions.push(sub);
  }

  selectConversation(conversation: any): void {
    this.selectedConversation = conversation;
    this.loadMessagesForConversation(conversation.userId);
    
    // Marquer la conversation comme lue
    this.chatService.markConversationAsRead(conversation.userId).subscribe();
    
    // Mettre à jour le compteur de messages non lus
    conversation.unreadCount = 0;
  }

  private loadMessagesForConversation(otherUserId: number): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    const sub = this.chatService.getMessagesBetweenUsers(currentUser.id, otherUserId).subscribe({
      next: (messages) => {
        this.messages = messages;
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des messages:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedConversation || this.sending) {
      return;
    }

    this.sending = true;
    const messageContent = this.newMessage.trim();
    this.newMessage = '';

    const sub = this.chatService.sendMessage(
      this.selectedConversation.userId,
      messageContent
    ).subscribe({
      next: (message) => {
        this.messages.push(message);
        this.sending = false;
        
        // Mettre à jour la conversation
        this.selectedConversation.lastMessage = message;
        
        // Recharger les conversations pour mettre à jour l'ordre
        this.loadConversations();
        
        setTimeout(() => this.scrollToBottom(), 100);
      },
      error: (error) => {
        console.error('Erreur lors de l\'envoi du message:', error);
        this.sending = false;
        // Restaurer le message en cas d'erreur
        this.newMessage = messageContent;
      }
    });
    this.subscriptions.push(sub);
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      try {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Erreur lors du scroll:', err);
      }
    }
  }

  isMyMessage(message: ChatMessage): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? message.senderId === currentUser.id : false;
  }

  formatMessageTime(timestamp: Date): string {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // Si c'est aujourd'hui, afficher seulement l'heure
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Si c'est cette semaine, afficher le jour et l'heure
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString('fr-FR', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Sinon, afficher la date complète
    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatConversationTime(timestamp: Date): string {
    const now = new Date();
    const messageDate = new Date(timestamp);
    
    // Si c'est aujourd'hui, afficher seulement l'heure
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Si c'est hier
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    }
    
    // Si c'est cette semaine
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return messageDate.toLocaleDateString('fr-FR', { weekday: 'short' });
    }
    
    // Sinon, afficher la date
    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    });
  }

  getMessagePreview(message: string): string {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  }

  getUserInitials(userName: string): string {
    return userName.split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  refreshConversations(): void {
    this.loadConversations();
  }
}