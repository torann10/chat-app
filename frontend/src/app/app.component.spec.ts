import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslateService } from '@ngx-translate/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockTranslateService = {
      setDefaultLang: vi.fn(),
      use: vi.fn(),
      instant: vi.fn((key) => key),
      get: vi.fn(),
      onLangChange: { subscribe: vi.fn() },
      onTranslationChange: { subscribe: vi.fn() },
      onDefaultLangChange: { subscribe: vi.fn() }
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
