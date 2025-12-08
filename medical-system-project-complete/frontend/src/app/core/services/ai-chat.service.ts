import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatSession, NewMessage } from '../models/ai-chat.model';

@Injectable({
  providedIn: 'root'
})
export class AiChatService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getChatSessions(): Observable<ChatSession[]> {
    return this.http.get<ChatSession[]>(`${this.apiUrl}/ai-chat/sessions`);
  }

  getChatSession(sessionId: number): Observable<ChatSession> {
    return this.http.get<ChatSession>(`${this.apiUrl}/ai-chat/sessions/${sessionId}`);
  }

  sendMessage(message: NewMessage): Observable<ChatSession> {
    return this.http.post<ChatSession>(`${this.apiUrl}/ai-chat/message`, message);
  }
}
