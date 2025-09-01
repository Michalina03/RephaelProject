// account.js — sekcja KONTO (dane + zmiany + wylogowanie) + zakładki
window.addEventListener("DOMContentLoaded", async () => {
  // 1) Pobierz profil
  try {
    const res = await fetch("http://127.0.0.1:3000/me", { credentials: "include" });
    const data = await res.json();

    if (!data.loggedIn) return (window.location.href = "auth.html");

    // Ustaw dane w UI
    const nameEl  = document.getElementById("account-username");
    const emailEl = document.getElementById("account-email");
    if (nameEl)  nameEl.textContent  = data.user.username || "";
    if (emailEl) emailEl.textContent = data.user.email    || "";
  } catch (err) {
    console.error("Błąd przy pobieraniu danych użytkownika:", err);
    return (window.location.href = "auth.html");
  }

  // 2) Wylogowanie
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    try {
      await fetch("http://127.0.0.1:3000/logout", { method: "POST", credentials: "include" });
    } finally {
      window.location.href = "auth.html";
    }
  });

  // 3) Zmiana imienia
  const nameForm = document.getElementById("name-change-form");
  const nameMsg  = document.getElementById("name-change-message");
  nameForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (nameMsg) nameMsg.textContent = "";

    const newName = nameForm.querySelector('input[name="newName"]').value.trim();
    if (!newName) {
      nameMsg.textContent = "Wprowadź nowe imię i nazwisko.";
      nameMsg.className   = "konto__message konto__message--error";
      return;
    }

    try {
      const res  = await fetch("http://127.0.0.1:3000/change-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        document.getElementById("account-username").textContent = newName;
        nameMsg.textContent = "Imię zostało zmienione.";
        nameMsg.className   = "konto__message konto__message--success";
        nameForm.reset();
      } else {
        nameMsg.textContent = data.message || "Błąd podczas zmiany imienia.";
        nameMsg.className   = "konto__message konto__message--error";
      }
    } catch (err) {
      console.error("Błąd sieci (imię):", err);
      nameMsg.textContent = "Błąd sieci. Spróbuj ponownie.";
      nameMsg.className   = "konto__message konto__message--error";
    }
  });

  // 4) Zmiana e-maila
  const emailForm = document.getElementById("email-change-form");
  const emailMsg  = document.getElementById("email-change-message");
  emailForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (emailMsg) emailMsg.textContent = "";

    const newEmail = emailForm.querySelector('input[name="newEmail"]').value.trim();
    if (!newEmail) {
      emailMsg.textContent = "Wprowadź nowy email.";
      emailMsg.className   = "konto__message konto__message--error";
      return;
    }

    try {
      const res  = await fetch("http://127.0.0.1:3000/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const emailDisplay = document.getElementById("account-email");
        if (emailDisplay) emailDisplay.textContent = newEmail;
        emailMsg.textContent = "Email został zmieniony pomyślnie.";
        emailMsg.className   = "konto__message konto__message--success";
        emailForm.reset();
      } else {
        emailMsg.textContent = data.message || "Błąd podczas zmiany emaila.";
        emailMsg.className   = "konto__message konto__message--error";
      }
    } catch (err) {
      console.error("Błąd sieci (email):", err);
      emailMsg.textContent = "Błąd sieci. Spróbuj ponownie.";
      emailMsg.className   = "konto__message konto__message--error";
    }
  });

  // 5) Zmiana hasła
  const passForm = document.getElementById("password-change-form");
  const passMsg  = document.getElementById("password-change-message");
  passForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (passMsg) passMsg.textContent = "";

    const currentPassword = passForm.querySelector('input[name="currentPassword"]').value.trim();
    const newPassword     = passForm.querySelector('input[name="newPassword"]').value.trim();
    const confirmPassword = passForm.querySelector('input[name="confirmPassword"]').value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      passMsg.textContent = "Wypełnij wszystkie pola.";
      passMsg.className   = "konto__message konto__message--error";
      return;
    }
    if (newPassword !== confirmPassword) {
      passMsg.textContent = "Nowe hasło i potwierdzenie nie zgadzają się.";
      passMsg.className   = "konto__message konto__message--error";
      return;
    }

    try {
      const res  = await fetch("http://127.0.0.1:3000/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        passMsg.textContent = "Hasło zostało zmienione pomyślnie.";
        passMsg.className   = "konto__message konto__message--success";
        passForm.reset();
      } else {
        passMsg.textContent = data.message || "Błąd podczas zmiany hasła.";
        passMsg.className   = "konto__message konto__message--error";
      }
    } catch (err) {
      console.error("Błąd sieci (hasło):", err);
      passMsg.textContent = "Błąd sieci. Spróbuj ponownie.";
      passMsg.className   = "konto__message konto__message--error";
    }
  });

  // 6) Przełączanie zakładek (Konto / Koszyk / Produkty / Zamówienia)
  const menuItems = document.querySelectorAll(".konto__menu-item");
  const sections  = document.querySelectorAll(".konto__section");
  menuItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      menuItems.forEach(el => el.classList.remove("konto__menu-item--active"));
      sections.forEach(sec => sec.classList.remove("konto__section--active"));
      item.classList.add("konto__menu-item--active");

      if (index === 0) document.getElementById("content-konto")?.classList.add("konto__section--active");
      if (index === 1) document.getElementById("content-koszyk")?.classList.add("konto__section--active");
      if (index === 2) document.getElementById("content-produkty")?.classList.add("konto__section--active");
      if (index === 3) document.getElementById("content-zamowienia")?.classList.add("konto__section--active");
    });
  });
});
