import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as StatsActions from './stats.actions';
import { map } from "rxjs";

@Injectable()
export class StatsEffects {
  private actions$ = inject(Actions);

  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StatsActions.loadStats),
      map(() => {
        const initialStats = {
          messagesSent: 0,
          roomsOpened: 0,
          interactions: {}
        };

        return StatsActions.loadStatsSuccess({ stats: initialStats });
      })
    )
  );
}