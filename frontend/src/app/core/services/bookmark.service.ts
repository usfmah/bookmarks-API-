import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Bookmark, CreateBookmarkPayload, UpdateBookmarkPayload } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/bookmarks`;

  list(): Observable<Bookmark[]> {
    return this.http.get<Bookmark[]>(this.base);
  }

  getById(id: number): Observable<Bookmark> {
    return this.http.get<Bookmark>(`${this.base}/${id}`);
  }

  create(payload: CreateBookmarkPayload): Observable<Bookmark> {
    return this.http.post<Bookmark>(this.base, payload);
  }

  update(id: number, payload: UpdateBookmarkPayload): Observable<Bookmark> {
    return this.http.patch<Bookmark>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
