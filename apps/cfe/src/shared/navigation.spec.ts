import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TeamService } from '../team/team.service';
import { BottomTabBar } from './bottom-tab-bar/bottom-tab-bar';
import { SlimTopBar } from './slim-top-bar/slim-top-bar';

@Component({ template: '' })
class Blank {}

@Component({
  imports: [BottomTabBar, SlimTopBar],
  template: '<app-bottom-tab-bar /><app-slim-top-bar />',
})
class Shell {}

describe('navigation bars', () => {
  it('mark the current section with aria-current="page"', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: Shell, children: [{ path: '**', component: Blank }] },
        ]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    // The top bar shows the team crest: answer that request first, or whenStable() waits for it.
    TestBed.inject(TeamService);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .expectOne((req) => req.url.endsWith('/details'))
      .flush({ id: 't1', logo: null });

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/squad');
    await harness.fixture.whenStable();

    const current = Array.from(
      harness.fixture.nativeElement.querySelectorAll('a[aria-current="page"]'),
    ) as HTMLAnchorElement[];
    expect(current.map((a) => a.getAttribute('href'))).toEqual(['/squad', '/squad']);
  });
});
