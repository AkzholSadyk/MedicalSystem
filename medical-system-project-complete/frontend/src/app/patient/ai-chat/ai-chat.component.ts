import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AiChatService } from '../../core/services/ai-chat.service';
import { ChatSession, ChatMessage } from '../../core/models/ai-chat.model';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatOptionModule } from '@angular/material/core';


@Component({
  selector: 'app-ai-chat',
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    MatProgressSpinnerModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatInputModule,

    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatGridListModule,
    MatOptionModule
  ]
})
export class AiChatComponent implements OnInit, AfterViewChecked {
  sessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  loadingSessions = true;
  loadingChat = false;
  chatForm!: FormGroup;
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  @ViewChild('messageInput') private messageInput?: ElementRef;
  showHistory = false;

  constructor(private chatService: AiChatService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.loadSessions();
    this.chatForm = this.fb.group({
      message: ['', Validators.required]
    });
  }

  loadSessions(): void {
    this.loadingSessions = true;
    this.chatService.getChatSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        this.loadingSessions = false;
        if (this.sessions.length > 0) {
          this.selectSession(this.sessions[0]);
        }
      },
      error: (err) => {
        console.error('Error loading chat sessions', err);
        this.loadingSessions = false;
      }
    });
  }

  selectSession(session: ChatSession): void {
    this.currentSession = session;
    this.loadingChat = true;
    this.chatService.getChatSession(session.id).subscribe({
      next: (data) => {
        this.currentSession = data;
        this.loadingChat = false;
  // scroll to bottom after session messages load
  setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err) => {
        console.error('Error loading chat messages', err);
        this.loadingChat = false;
      }
    });
  }

  startNewChat(): void {
    this.currentSession = null;
    this.chatForm.reset();
  // focus input for quick typing when starting a new chat
  setTimeout(() => this.messageInput?.nativeElement?.focus(), 0);
    // close history panel when starting a new chat
    this.showHistory = false;
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  sendMessage(): void {
    if (this.chatForm.invalid) {
      return;
    }

    const content = this.chatForm.value.message;
    this.chatForm.reset();

   
    const userMessage: ChatMessage = {
      role: 'user',
      content: content,
      timestamp: new Date().toISOString()
    };

    if (!this.currentSession) {
      this.currentSession = {
        id: 0, 
        user_id: 0,
        title: 'New Chat',
        created_at: new Date().toISOString(),
        messages: []
      };
    }
    this.currentSession.messages.push(userMessage);

    
    setTimeout(() => {
      this.scrollToBottom();
      this.messageInput?.nativeElement?.focus();
    }, 0);

    this.loadingChat = true;
    this.chatService.sendMessage({
      session_id: this.currentSession.id === 0 ? null : this.currentSession.id,
      content: content
    }).subscribe({
      next: (updatedSession) => {
        this.currentSession = updatedSession;
        this.loadingChat = false;
        this.loadSessions(); 
        // ensure view shows response and keep input focused
        setTimeout(() => {
          this.scrollToBottom();
          this.messageInput?.nativeElement?.focus();
        }, 0);
      },
      error: (err) => {
        console.error('Error sending message', err);
        this.loadingChat = false;
      }
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  onEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.loadingChat && this.chatForm.valid) {
        this.sendMessage();
      }
    }
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    } catch (err) {
      
    }
  }
}
