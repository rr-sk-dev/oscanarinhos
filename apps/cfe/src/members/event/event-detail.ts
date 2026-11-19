import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { injectPageTitle } from '../../app/app-title.strategy';
import { AuthService } from '../auth/auth.service';
import { AnsweredEvent, ResponseButtons } from './response-buttons/response-buttons';
import { ResponseList } from './response-list/response-list';
import { EventService } from './event.service';

const TYPE_LABELS = { TRAINING: 'Treino', GAME: 'Jogo', CUSTOM: 'Evento' } as const;

/** One event: details, the viewer's answer and everyone's answers. */
@Component({
  selector: 'app-event-detail',
  imports: [DatePipe, ErrorState, ResponseButtons, ResponseList, RouterLink],
  templateUrl: './event-detail.html',
  providers: [EventService],
})
export class EventDetail {
  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly auth = inject(AuthService);
  protected readonly service = inject(EventService);

  protected readonly canManage = computed(() => {
    const role = this.auth.activeMembership()?.role;
    return role === 'ADMIN' || role === 'COACH';
  });
  protected readonly typeLabel = computed(() => {
    const event = this.service.event();
    return event ? TYPE_LABELS[event.type] : '';
  });

  constructor() {
    effect(() => this.service.eventId.set(this.id()));
    injectPageTitle(computed(() => this.service.event()?.title));
  }

  protected answered({ answer, note }: AnsweredEvent): void {
    void this.service.respond(answer, note);
  }
}
