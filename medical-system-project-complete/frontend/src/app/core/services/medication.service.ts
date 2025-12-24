import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Medication } from '../models/medication.model';

@Injectable({
  providedIn: 'root'
})
export class MedicationService {
  private apiUrl = `${environment.apiUrl}/medications`;

  constructor(private http: HttpClient) { }


  getMedications(
    search?: string, 
    skip: number = 0, 
    limit: number = 100,
    form?: string,
    genericName?: string
  ): Observable<Medication[]> {
    let params = new HttpParams()
      .set('skip', skip.toString())
      .set('limit', limit.toString());
    
    if (search) {
      params = params.set('search', search);
    }
    
    if (form) {
      params = params.set('form', form);
    }
    
    if (genericName) {
      params = params.set('generic_name', genericName);
    }
    
    return this.http.get<Medication[]>(this.apiUrl, { params });
  }

  
  searchMedications(query: string, limit: number = 10): Observable<Medication[]> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit.toString());
    
    return this.http.get<Medication[]>(`${this.apiUrl}/search`, { params });
  }

  getMedicationById(id: number): Observable<Medication> {
    return this.http.get<Medication>(`${this.apiUrl}/${id}`);
  }

  createMedication(payload: { name: string; description?: string; form?: string; generic_name?: string; image?: File | null }): Observable<Medication> {
    const form = new FormData();
    form.append('name', payload.name);
    if (payload.description) form.append('description', payload.description);
    if (payload.form) form.append('form', payload.form);
    if (payload.generic_name) form.append('generic_name', payload.generic_name);
    if (payload.image) form.append('image', payload.image, payload.image.name);

    return this.http.post<Medication>(this.apiUrl, form);
  }

  updateMedication(id: number, payload: { name?: string; description?: string; form?: string; generic_name?: string; image?: File | null }): Observable<Medication> {
    const form = new FormData();
    if (payload.name) form.append('name', payload.name);
    if (payload.description) form.append('description', payload.description);
    if (payload.form) form.append('form', payload.form);
    if (payload.generic_name) form.append('generic_name', payload.generic_name);
    if (payload.image) form.append('image', payload.image, payload.image.name);

    return this.http.put<Medication>(`${this.apiUrl}/${id}`, form);
  }

  deleteMedication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

