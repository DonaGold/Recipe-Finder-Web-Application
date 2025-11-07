// Recipe Finder - Vanilla JS
const API_BASE = 'https://www.themealdb.com/api/json/v1/1';
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsGrid = document.getElementById('resultsGrid');
const statusMessage = document.getElementById('statusMessage');
const detailsModal = document.getElementById('detailsModal');
const modalBody = document.getElementById('modalBody');
const closeModalBtn = document.getElementById('closeModal');
const randomBtn = document.getElementById('randomBtn');
const favoritesToggle = document.getElementById('favoritesToggle');
const favoritesSection = document.getElementById('favoritesSection');
const resultsSection = document.getElementById('resultsSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const favCount = document.getElementById('favCount');
const noFavs = document.getElementById('noFavs');

let favorites = loadFavorites();

function setStatus(msg, isError = false) {
  statusMessage.textContent = msg || '';
  statusMessage.style.color = isError ? 'crimson' : '';
}

function showLoading() {
  resultsGrid.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
}

function searchMeals(query) {
  if (!query) {
    setStatus('Please enter a search term (e.g., "chicken" or "pasta").');
    resultsGrid.innerHTML = '';
    return;
  }
  setStatus('');
  showLoading();
  fetch(`${API_BASE}/search.php?s=${encodeURIComponent(query)}`)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.meals) {
        resultsGrid.innerHTML = '<p class="no-results">No recipes found. Try another search.</p>';
        return;
      }
      renderResults(data.meals);
    })
    .catch(err => {
      console.error(err);
      setStatus('Network error — please try again.', true);
      resultsGrid.innerHTML = '';
    });
}

function renderResults(meals) {
  resultsGrid.innerHTML = '';
  meals.forEach(meal => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(meal.strMeal)}</h3>
        <div class="card-actions">
          <button class="small-btn view-btn" data-id="${meal.idMeal}">View Details</button>
          <button class="small-btn fav-btn" data-id="${meal.idMeal}" aria-label="Add to favorites">
            <span class="heart ${isFavorite(meal.idMeal) ? 'active' : ''}">♥</span>
          </button>
        </div>
      </div>
    `;
    resultsGrid.appendChild(card);
  });
}

// Utility to escape text to avoid XSS in inserted HTML
function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]);
  });
}

function fetchMealById(id) {
  setStatus('');
  modalBody.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
  detailsModal.classList.remove('hidden');
  fetch(`${API_BASE}/lookup.php?i=${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data || !data.meals) {
        modalBody.innerHTML = '<p class="no-results">Could not load recipe details.</p>';
        return;
      }
      showMealDetails(data.meals[0]);
    })
    .catch(err => {
      console.error(err);
      modalBody.innerHTML = '<p class="no-results">Network error while loading details.</p>';
    });
}

function showMealDetails(meal) {
  const ingredients = getIngredients(meal);
  modalBody.innerHTML = `
    <header class="details-header">
      <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" />
      <div class="details-info">
        <h2 id="modalTitle">${escapeHtml(meal.strMeal)}</h2>
        <p><strong>Category:</strong> ${escapeHtml(meal.strCategory || '—')} • <strong>Area:</strong> ${escapeHtml(meal.strArea || '—')}</p>
        <div class="ingredients">
          ${ingredients.map(i => `<div>${escapeHtml(i)}</div>`).join('')}
        </div>
        <div style="margin-top:.5rem">
          <a class="small-btn" href="${meal.strSource || '#'}" target="_blank" rel="noopener">Original Source</a>
          ${meal.strYoutube ? `<a class="small-btn" href="${meal.strYoutube}" target="_blank" rel="noopener">YouTube</a>` : ''}
          <button id="modalFav" class="small-btn fav-btn" data-id="${meal.idMeal}" style="margin-left:8px">
            <span class="heart ${isFavorite(meal.idMeal) ? 'active' : ''}">♥</span> Favorite
          </button>
        </div>
      </div>
    </header>
    <hr />
    <section class="instructions">
      <h3>Instructions</h3>
      <p>${escapeHtml(meal.strInstructions || 'No instructions available.')}</p>
    </section>
  `;

  // hook up favorite button inside modal
  const modalFav = document.getElementById('modalFav');
  if (modalFav) {
    modalFav.addEventListener('click', () => {
      toggleFavorite(meal);
      // update heart visuals
      modalFav.querySelector('.heart').classList.toggle('active', isFavorite(meal.idMeal));
      updateFavCount();
      // also update hearts in results grid if present
      updateHeartsInGrid(meal.idMeal);
    });
  }
}

function getIngredients(meal) {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      items.push(`${measure ? measure : ''} ${ingredient}`.trim());
    }
  }
  return items;
}

function updateHeartsInGrid(id) {
  const btns = document.querySelectorAll(`.fav-btn[data-id="${id}"] .heart`);
  btns.forEach(h => h.classList.toggle('active', isFavorite(id)));
}

function isFavorite(id) {
  return favorites.some(f => f.idMeal === id);
}

function toggleFavorite(meal) {
  const exists = isFavorite(meal.idMeal);
  if (exists) {
    favorites = favorites.filter(f => f.idMeal !== meal.idMeal);
  } else {
    // store only necessary fields
    const toSave = {
      idMeal: meal.idMeal,
      strMeal: meal.strMeal,
      strMealThumb: meal.strMealThumb
    };
    favorites.push(toSave);
  }
  saveFavorites();
  updateFavCount();
  renderFavoritesGrid();
}

function saveFavorites() {
  try {
    localStorage.setItem('rf_favorites', JSON.stringify(favorites));
  } catch(e) {
    console.warn('Could not save favorites', e);
  }
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem('rf_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function renderFavoritesGrid() {
  favoritesGrid.innerHTML = '';
  if (!favorites.length) {
    noFavs.style.display = 'block';
    return;
  }
  noFavs.style.display = 'none';
  favorites.forEach(meal => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${escapeHtml(meal.strMeal)}" loading="lazy" />
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(meal.strMeal)}</h3>
        <div class="card-actions">
          <button class="small-btn view-btn" data-id="${meal.idMeal}">View Details</button>
          <button class="small-btn fav-btn" data-id="${meal.idMeal}">
            <span class="heart active">♥</span>
          </button>
        </div>
      </div>
    `;
    favoritesGrid.appendChild(card);
  });
}

function updateFavCount() {
  favCount.textContent = favorites.length;
}

// Event bindings
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  favoritesSection.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  const q = searchInput.value.trim();
  searchMeals(q);
});

resultsGrid.addEventListener('click', e => {
  const viewBtn = e.target.closest('.view-btn');
  const favBtn = e.target.closest('.fav-btn');
  if (viewBtn) {
    const id = viewBtn.dataset.id;
    fetchMealById(id);
  } else if (favBtn) {
    const id = favBtn.dataset.id;
    // try to find the meal details in currently rendered cards to save minimal data
    const card = favBtn.closest('.card');
    const title = card.querySelector('.card-title')?.textContent || '';
    const img = card.querySelector('img')?.src || '';
    toggleFavorite({ idMeal: id, strMeal: title, strMealThumb: img });
    updateHeartsInGrid(id);
  }
});

favoritesGrid.addEventListener('click', e => {
  const viewBtn = e.target.closest('.view-btn');
  const favBtn = e.target.closest('.fav-btn');
  if (viewBtn) {
    const id = viewBtn.dataset.id;
    fetchMealById(id);
  } else if (favBtn) {
    const id = favBtn.dataset.id;
    // remove from favorites
    favorites = favorites.filter(f => f.idMeal !== id);
    saveFavorites();
    updateFavCount();
    renderFavoritesGrid();
    updateHeartsInGrid(id);
  }
});

closeModalBtn.addEventListener('click', () => {
  detailsModal.classList.add('hidden');
  modalBody.innerHTML = '';
});

randomBtn.addEventListener('click', () => {
  setStatus('');
  resultsSection.classList.remove('hidden');
  favoritesSection.classList.add('hidden');
  resultsGrid.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
  fetch(`${API_BASE}/random.php`)
    .then(res => res.json())
    .then(data => {
      if (data && data.meals) renderResults(data.meals);
    })
    .catch(err => {
      console.error(err);
      setStatus('Could not fetch a random recipe.', true);
    });
});

favoritesToggle.addEventListener('click', () => {
  const showing = !favoritesSection.classList.contains('hidden');
  if (showing) {
    favoritesSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
  } else {
    favoritesSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    renderFavoritesGrid();
  }
});

// initial
updateFavCount();

// small helper to debounce input (optional)
// simple escape for HTML already above

// Accessibility: close modal on ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !detailsModal.classList.contains('hidden')) {
    detailsModal.classList.add('hidden');
    modalBody.innerHTML = '';
  }
});
