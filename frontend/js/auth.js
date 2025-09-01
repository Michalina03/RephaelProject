const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");

const registerMessage = document.getElementById("register-message");
const loginMessage = document.getElementById("login-message");
const loginStatus = document.getElementById("login-status");

function clearMessage(element) {
  element.textContent = "";
  element.classList.remove("success", "error");
}

function showMessage(element, message, isSuccess = false) {
  element.textContent = message;
  element.classList.remove("success", "error");
  element.classList.add(isSuccess ? "success" : "error");
}

// Sprawdź status zalogowania po załadowaniu strony
async function checkLoginStatus() {
  if (!loginStatus) return; // jeśli brak elementu na stronie

  try {
    const res = await fetch("http://127.0.0.1:3000/me", {
      method: "GET",
      credentials: "include",
    });
    const data = await res.json();

    if (data.loggedIn) {
      loginStatus.textContent = `Jesteś zalogowany jako ${data.user.username}`;
      loginStatus.classList.add("success");
    } else {
      loginStatus.textContent = "Nie jesteś zalogowany";
      loginStatus.classList.remove("success");
    }
  } catch (error) {
    loginStatus.textContent = "Błąd połączenia z serwerem.";
    loginStatus.classList.remove("success");
  }
}

// Obsługa rejestracji
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(registerMessage);
  showMessage(registerMessage, "Rejestracja w toku...");

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("http://127.0.0.1:3000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
  showMessage(registerMessage, result.message || "Zarejestrowano pomyślnie!", true);
  registerForm.reset();
  checkLoginStatus();

  setTimeout(() => {
    window.location.href = "account.html";
  });
}
 else {
      showMessage(registerMessage, result.message || "Coś poszło nie tak.");
    }
  } catch (error) {
    showMessage(registerMessage, "Błąd połączenia z serwerem.");
  }
});

// Obsługa logowania
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(loginMessage);
  showMessage(loginMessage, "Logowanie w toku...");

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData.entries());

  try {
    const res = await fetch("http://127.0.0.1:3000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (res.ok) {
  showMessage(loginMessage, result.message || "Zalogowano pomyślnie!", true);
  loginForm.reset();

  setTimeout(() => {
    window.location.href = "account.html"; // ← tu zmień nazwę pliku, jeśli inna!
  }); // 1 sekunda opóźnienia na pokazanie wiadomości
}
 else {
      showMessage(loginMessage, result.message || "Niepoprawne dane logowania.");
    }
  } catch (error) {
    showMessage(loginMessage, "Błąd połączenia z serwerem.");
  }
});

window.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
});

window.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();

  const loginSection = document.getElementById("login-section");
  const registerSection = document.getElementById("register-section");

  const showRegisterBtn = document.getElementById("show-register");
  const showLoginBtn = document.getElementById("show-login");

  showRegisterBtn?.addEventListener("click", () => {
    loginSection.classList.add("hidden");
    registerSection.classList.remove("hidden");
  });

  showLoginBtn?.addEventListener("click", () => {
    registerSection.classList.add("hidden");
    loginSection.classList.remove("hidden");
  });
});
