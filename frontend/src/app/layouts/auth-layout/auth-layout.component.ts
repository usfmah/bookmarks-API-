import { Component, input } from '@angular/core';

/** Split-screen auth layout: editorial brand panel (desktop) + form column. */
@Component({
  selector: 'app-auth-layout',
  imports: [],
  template: `
    <div class="grid min-h-screen bg-ink text-text lg:grid-cols-[650px_1fr]">
      <!-- Brand panel (desktop only) -->
      <aside class="relative hidden flex-col bg-panel px-16 py-12 lg:flex">
        <p class="text-[20px] font-bold tracking-wide text-text">FOLIO</p>
        <div class="mt-auto mb-auto">
          <h1 class="max-w-[500px] text-[40px] font-semibold leading-[1.15] text-text">
            {{ statementLineOne() }}<br />{{ statementLineTwo() }}
            @if (statementLineThree()) {
              <br />{{ statementLineThree() }}
            }
          </h1>
          <p class="mt-6 max-w-[490px] text-[14px] text-muted">
            A private archive for the links you rely on.
          </p>
        </div>
        <div>
          <div class="h-px w-[500px] max-w-full bg-line" aria-hidden="true"></div>
          <p class="mt-6 text-[9px] font-semibold tracking-[0.18em] text-faint">
            PERSONAL KNOWLEDGE, WITHOUT THE NOISE.
          </p>
        </div>
      </aside>

      <!-- Compact brand for mobile / tablet -->
      <div class="flex items-center justify-between border-b border-line bg-panel px-6 py-4 lg:hidden">
        <p class="text-[16px] font-bold tracking-wide text-text">FOLIO</p>
        <p class="text-[9px] font-semibold tracking-[0.18em] text-faint">PERSONAL ARCHIVE</p>
      </div>

      <section class="flex items-center justify-center px-6 py-10 sm:px-10">
        <div class="w-full max-w-[490px]">
          <ng-content />
        </div>
      </section>
    </div>
  `,
})
export class AuthLayoutComponent {
  readonly statementLineOne = input.required<string>();
  readonly statementLineTwo = input.required<string>();
  readonly statementLineThree = input<string>('');
}
