# RIKOSZET — Bar & Klub Gier

Interaktywna strona-demo 3D do portfolio **KODA**, inspirowana [greencube.space](https://greencube.space/en/):
białe miasto-duch + szczegółowy, w pełni umeblowany bar w starej rozlewni. Wszystko generowane proceduralnie w Three.js — zero zewnętrznych assetów 3D.

**Demo:** https://kodastrony.github.io/rikoszet-bar/

## Funkcje

- **Kinowe intro** — krótki (~3 s), automatyczny najazd kamery z lotu ptaka na bar, z paskiem ładowania i przyciskiem „Wejdź od razu". Sterowane czasem, identyczne na PC i mobile, respektuje `prefers-reduced-motion`. Bez scrollowania.
- **Trzy widoki budynku** — cały budynek / parter / parter + piętro bez dachu (przełącznik na dole, skróty `1·2·3`); warstwy zdejmują się jak w domku dla lalek
- **Pełne wnętrza** — kontuar z kranami i butelkami, hokery, loże, 4 tory rzutek z tarczami, scena z kulą disco i reflektorami, 5 stołów bilardowych z lampami, salka eventowa z girlandą i balonami, schody między piętrami; wnętrza widać też przez okna z zewnątrz
- **Hotspoty kontekstowe** — klik w „Strefę rzutek" przełącza na przekrój parteru, kamera podlatuje nad tory, a strefę podświetla pulsujący ring; na mobile kadr przesuwa obiekt nad dolny panel, żeby nic nie zasłaniał
- **Tryb nocny** — neon z bloomem, świecące okna, girlandy, latarnie i gwiazdy (skrót `N`)
- **Rezerwacje** — kreator 5 kroków z wyborem konkretnego stołu/toru/loży na planie sali; dostępność symulowana + localStorage
- **Godziny, cennik, program tygodnia, kontakt** z liczonym na żywo statusem „Otwarte do…"

## Sterowanie

- **Mysz:** przeciągnij = obrót, kółko = zoom (do kursora), `1·2·3` = piętra, `R` = reset, `N` = noc, `Esc` = zamknij, `←/→` = poprzednia/następna atrakcja.
- **Dotyk:** jeden palec = obrót, dwa palce = zoom. `touch-action: none` na canvasie eliminuje przypadkowe przewijanie strony; cele dotyku ≥44 px, panele nie zasłaniają opisywanej grafiki.

## Wydajność i SEO

- Budowa sceny rozłożona na klatki (responsywny ekran ładowania z progresem), miasto mergowane do 2 geometrii, meble instancjonowane, wnętrza dobudowywane po starcie intra.
- Postprocessing (bloom) liczony tylko nocą — w dzień render bezpośredni, bez kosztu łańcucha efektów.
- `three` w osobnym chunku (cache), tiery jakości dla mobile/słabych GPU + dynamiczny downgrade cieni.
- SEO: dane strukturalne JSON-LD `BarOrPub` (godziny, adres, geo), OpenGraph + Twitter z obrazem `og-cover.jpg`, `canonical`, `robots.txt`, `sitemap.xml`, `site.webmanifest` + ikony PWA, pojedynczy semantyczny `h1`, dostępny fallback tekstowy.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # produkcja → dist/
```

Stack: Vite · Three.js · vanilla JS · Bricolage Grotesque + Inter (fontsource).

Marka, treści, ceny i adres są fikcyjne. Made with ♥ by KODA.
