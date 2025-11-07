# Recipe Finder

A simple frontend-only Recipe Finder built with HTML, CSS, and JavaScript.  
It uses TheMealDB public API to search recipes, display details, and save favorites in `localStorage`.

## Features
- Search recipes by name or ingredient (uses TheMealDB `search.php`).
- View detailed recipe info (ingredients, instructions, links).
- Surprise me (fetch a random recipe).
- Add/remove favorites (stored locally).
- Responsive layout and lightweight UI.

## How to run
1. Unzip the project.
2. Open `index.html` in your browser (double-click or right-click → Open with...).
3. No server required — works as a static site.

## Files
- `index.html` — main page
- `style.css` — styles
- `script.js` — application logic
- `README.md` — this file

## Notes
- The project depends on the public TheMealDB API (https://www.themealdb.com). If API requests fail, check network or try again later.
- This is a client-side demo; for production consider adding rate limits or a small server-side proxy if necessary.
