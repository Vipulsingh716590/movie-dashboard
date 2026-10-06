import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PosterComponent } from './poster.component';

describe('PosterComponent', () => {
  let fixture: ComponentFixture<PosterComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(PosterComponent);
    fixture.componentRef.setInput('title', 'dangal');
  });

  it('shows the image when the movie has a poster', () => {
    fixture.componentRef.setInput('src', 'https://example.com/p.jpg');
    fixture.detectChanges();
    expect(el().querySelector('img')?.getAttribute('src')).toBe('https://example.com/p.jpg');
  });

  it('shows the first letter instead of an empty hole when there is no poster', () => {
    fixture.componentRef.setInput('src', '');
    fixture.detectChanges();
    expect(el().querySelector('img')).toBeNull();
    expect(el().textContent?.trim()).toBe('D');
  });

  it('falls back to the letter when the image fails to load, and tries again for a new link', () => {
    fixture.componentRef.setInput('src', 'https://example.com/broken.jpg');
    fixture.detectChanges();
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el().querySelector('img')).toBeNull();

    fixture.componentRef.setInput('src', 'https://example.com/fixed.jpg');
    fixture.detectChanges();
    expect(el().querySelector('img')?.getAttribute('src')).toBe('https://example.com/fixed.jpg');
  });
});
