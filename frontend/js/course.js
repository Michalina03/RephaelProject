document.addEventListener("DOMContentLoaded", () => {
  // Po załadowaniu strony pobieramy listę kursów i Twoje zakupione kursy
  fetchCourses();
  fetchMyCourses();

  // Obsługa przycisku wylogowania
  const logoutBtn = document.getElementById('logoutButton');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('http://127.0.0.1:3000/logout', {
        method: 'POST',
        credentials: 'include'
      });
      alert('Zostałeś wylogowany.');
      window.location.href = 'account.html';
    });
  }
});

/**
 * Funkcja pobiera listę kursów i wyświetla tylko ten kurs, który odpowiada aktualnej stronie.
 * Zamiast opisu pokazuje cenę kursu.
 */
async function fetchCourses() {
  const list = document.getElementById('courseList');
  if (!list) return; // jeśli nie ma elementu na stronie, nic nie robimy

  try {
    const res = await fetch('http://127.0.0.1:3000/courses', { credentials: 'include' });
    const data = await res.json();

    list.innerHTML = ''; // czyścimy listę przed dodaniem nowych elementów

    // Ustalamy, jaki kurs chcemy wyświetlić w zależności od strony
    let wantedTitle = '';
    const path = window.location.pathname;

    if (path.endsWith('course.html')) {
      wantedTitle = 'Kurs poprawy jakości życia';
    } else if (path.endsWith('affirmations.html')) {
      wantedTitle = 'Afirmacje katolickie';
    } else if (path.endsWith('dietetics.html')) {
      wantedTitle = 'Dietetyka';
    } else {
      // Inne strony nie pokazują kursów
      return;
    }

    // Filtrujemy kursy według nazwy
    const filtered = data.filter(course => course.title === wantedTitle);

    // Dodajemy do listy tylko pasujący kurs i pokazujemy jego cenę
    filtered.forEach(course => {
      // Konwertujemy price na liczbę, by móc użyć toFixed(2)
      const price = Number(course.price);
      const priceFormatted = isNaN(price) ? 'brak ceny' : price.toFixed(2);

      const li = document.createElement('li');
      li.className = 'courses__item';
      li.innerHTML = `
        <div class="courses__item-title">${course.title}</div>
        <div class="courses__item-price">Cena: ${priceFormatted} PLN</div>
        <button class="courses__item-button" onclick="buyCourse(${course.id})">Dodaj do koszyka</button>
      `;
      list.appendChild(li);
    });

  } catch (err) {
    console.error('Błąd podczas pobierania kursów:', err);
  }
}

/**
 * Funkcja pobiera listę zakupionych kursów użytkownika i wyświetla je.
 * Pokazuje tytuł i cenę kursu oraz informację o dostępie.
 */
async function fetchMyCourses() {
  const list = document.getElementById('ownedCourses');
  if (!list) return; // jeśli nie ma elementu na stronie, nic nie robimy

  try {
    const res = await fetch('http://127.0.0.1:3000/my-courses', { credentials: 'include' });
    if (!res.ok) return;

    const data = await res.json();
    list.innerHTML = ''; // czyścimy listę przed dodaniem nowych elementów

    data.forEach(course => {
      // Konwersja ceny na liczbę i formatowanie
      const price = Number(course.price);
      const priceFormatted = isNaN(price) ? 'brak ceny' : price.toFixed(2);

      const li = document.createElement('li');
      li.className = 'courses__item';
      li.innerHTML = `
        <div class="courses__item-title">${course.title}</div>
        <div class="courses__item-price">Cena: ${priceFormatted} PLN</div>
        <div class="courses__item-note">✅ Masz dostęp</div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Błąd podczas pobierania moich kursów:', err);
  }
}

/**
 * Funkcja obsługuje zakup kursu (dodanie do koszyka).
 * Wysyła zapytanie do backendu i na podstawie odpowiedzi pokazuje alert.
 */
async function buyCourse(courseId) {
  try {
    const res = await fetch('http://127.0.0.1:3000/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ courseId })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message);
      fetchMyCourses(); // odśwież listę zakupionych kursów po zakupie
    } else {
      if (res.status === 401) {
        alert("Musisz się zalogować lub zarejestrować.");
        window.location.href = 'account.html';
      } else {
        alert(data.message || 'Wystąpił błąd.');
      }
    }
  } catch (err) {
    alert('Wystąpił błąd przy zakupie kursu.');
    console.error(err);
  }
}
