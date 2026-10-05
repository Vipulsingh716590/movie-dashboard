import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { delay, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

type Db = Record<string, any>;

let db: Db | null = null;

/**
 * The sample data is embedded in the page by scripts/bundle-demo.mjs (<script id="demo-db">). It is read from the DOM
 * instead of imported, so `ng serve` never watches mock-server/db.json (json-server rewrites it on every save).
 */
function database(): Db {
  if (!db) {
    const raw = document.getElementById('demo-db')?.textContent;
    if (!raw) throw new Error('Demo data missing: build the demo with `npm run build:demo`.');
    db = JSON.parse(raw) as Db;
  }
  return db;
}

const notFound = (url: string) =>
  throwError(() => new HttpErrorResponse({ status: 404, url, statusText: 'Not Found' }));

/**
 * Demo build only: answers the same requests json-server would, from a copy of mock-server/db.json held in memory.
 * Reads and writes behave like the real API; everything resets when the page is reloaded.
 */
export const demoApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demo || !req.url.startsWith(environment.apiBaseUrl)) return next(req);

  const [resource, id] = req.url.slice(environment.apiBaseUrl.length).split('/').filter(Boolean);

  return of(database()).pipe(
    switchMap((data) => {
      const reply = (body: unknown) => of(new HttpResponse({ status: 200, body: structuredClone(body) }));
      const collection = data[resource];
      if (collection === undefined) return notFound(req.url);

      if (id !== undefined) {
        const index = (collection as { id: number }[]).findIndex((m) => String(m.id) === id);
        if (index < 0) return notFound(req.url);
        if (req.method === 'PATCH') collection[index] = { ...collection[index], ...(req.body as object) };
        return reply(collection[index]);
      }

      if (req.method === 'PUT') data[resource] = req.body;
      return reply(data[resource]);
    }),
    delay(150)
  );
};
