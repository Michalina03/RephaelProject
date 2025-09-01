async function checkLoginStatus() {
  const loginStatus = document.getElementById("login-status");
  if (!loginStatus) return;

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
  } catch {
    loginStatus.textContent = "Błąd połączenia z serwerem.";
    loginStatus.classList.remove("success");
  }
}

window.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();
});
