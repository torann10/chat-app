import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import * as StatsActions from './stats.actions';
import { ApiService } from "../../api/api.service";
import { delay, map, mergeMap, of } from "rxjs";

@Injectable()
export class StatsEffects {
  private actions$ = inject(Actions);
  // private apiService = inject(ApiService);

  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StatsActions.loadStats),
      mergeMap(() => {
        const fakeData = {
          messagesSent: 0,
          roomsOpened: 0,
          interactions: {}
        };

        return of(fakeData).pipe(
          delay(1000),
          map(stats => StatsActions.loadStatsSuccess({ stats }))
        );
      })
      //   this.apiService.getStatistics().pipe(
      //     map(stats => StatsActions.loadStatsSuccess({ stats })),
      //     catchError(error => of(StatsActions.loadStatsFailure({ error })))
      //   )
      // )
    )
  );
}