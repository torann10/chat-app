import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as ChatActions from './chat.actions';
import { catchError, forkJoin, map, mergeMap, of } from "rxjs";
import { ApiService } from "../../api/api.service";

@Injectable()
export class ChatEffects {
  private actions$ = inject(Actions);
  private apiService = inject(ApiService);

  loadRooms$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ChatActions.loadRooms),
      mergeMap(() => 
        forkJoin({
          rooms: this.apiService.getRooms('room'),
          directMessages: this.apiService.getRooms('dm')
        }).pipe(
          map(({ rooms, directMessages }) => 
            ChatActions.loadRoomsSuccess({ rooms, directMessages })
          ),
          catchError((error) => of(ChatActions.loadRoomsFailure({ error })))
        )
      )
    )
  );
}