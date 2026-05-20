import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectFavoritePerson, selectIsLoadingStats, selectUsageStatistics } from '../store/stats.selectors';
import { loadStats } from '../store/stats.actions';
import { TranslatePipe } from '@ngx-translate/core';
import { AccordionModule } from 'primeng/accordion';

@Component({
  selector: 'app-stats',
  imports: [
    TranslatePipe,
    AccordionModule
  ],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss',
})
export class StatsComponent implements OnInit {
  private readonly store = inject(Store);

  protected stats = this.store.selectSignal(selectUsageStatistics);
  protected favoritePerson = this.store.selectSignal(selectFavoritePerson);
  protected loading = this.store.selectSignal(selectIsLoadingStats);

  ngOnInit(): void {
    this.store.dispatch(loadStats());
  }
}
