import { Component, inject, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UsageStatistics } from '../store/stats.model';
import { Store } from '@ngrx/store';
import { selectFavoritePerson, selectIsLoadingStats, selectUsageStatistics } from '../store/stats.selectors';
import { loadStats, updateFavoritePerson } from '../store/stats.actions';

@Component({
  selector: 'app-stats',
  imports: [],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  private store = inject(Store);

  stats = this.store.selectSignal(selectUsageStatistics);
  favoritePerson = this.store.selectSignal(selectFavoritePerson);
  loading = this.store.selectSignal(selectIsLoadingStats);

  ngOnInit(): void {
    this.store.dispatch(loadStats());
  }
}
