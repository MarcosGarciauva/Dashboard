export function setupTheme(state, saveState) {
  const button = document.querySelector("#themeToggle");
  const icon = document.querySelector("#themeIcon");
  const label = document.querySelector("#themeLabel");

  function applyTheme() {
    const theme = state.settings.theme || "dark";
    document.documentElement.dataset.theme = theme;
    icon.textContent = theme === "dark" ? "☾" : "☀";
    label.textContent = theme === "dark" ? "Oscuro" : "Claro";
  }

  button.addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  });

  applyTheme();
  return { applyTheme };
}
