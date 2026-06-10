# RIKOSZET — Bar & Klub Gier

Interaktywna strona-demo 3D do portfolio **KODA**, inspirowana [greencube.space](https://greencube.space/en/):
białe miasto-duch + szczegółowy, w pełni umeblowany bar w starej rozlewni. Wszystko generowane proceduralnie w Three.js — zero zewnętrznych assetów 3D.

**Demo:** https://kodastrony.github.io/rikoszet-bar/

## Funkcje

- **Scrollowane intro** — historia budynku (1926 → 2024): start we mgle z lotu ptaka, scroll przewija rozdziały, a kamera płynie po krzywej aż do baru
- **Trzy widoki budynku** — cały budynek / parter / parter + piętro bez dachu (przełącznik na dole); warstwy zdejmują się jak w domku dla lalek
- **Pełne wnętrza** — kontuar z kranami i butelkami, hokery, loże, 4 tory rzutek z tarczami, scena z kulą disco i reflektorami, 5 stołów bilardowych z lampami, salka eventowa z girlandą i balonami, schody między piętrami; wnętrza widać też przez okna z zewnątrz
- **Hotspoty kontekstowe** — klik w „Strefę rzutek" przełącza na przekrój parteru, kamera podlatuje nad tory, a strefę podświetla pulsujący ring
- **Tryb nocny** — neon z bloomem, świecące okna, girlandy, latarnie i gwiazdy
- **Rezerwacje** — kreator 5 kroków z wyborem konkretnego stołu/toru/loży na planie sali; dostępność symulowana + localStorage
- **Godziny, cennik, program tygodnia, kontakt** z liczonym na żywo statusem „Otwarte do…"

## Wydajność

Miasto mergowane do 2 geometrii, meble instancjonowane, wnętrza dobudowywane po pierwszej klatce, `three` w osobnym chunku (cache), tiery jakości dla mobile/słabych GPU + dynamiczny downgrade cieni.

## Uruchomienie

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # produkcja → dist/
```

Stack: Vite · Three.js · vanilla JS · Bricolage Grotesque + Inter (fontsource).

Marka, treści, ceny i adres są fikcyjne. Made with ♥ by KODA.
