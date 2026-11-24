import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://uldlmihlezcjjphaucts.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jamMZ-XfElqfJE8vvLUc3Q_d6p6FGhd";
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const modal = document.getElementById("gv-auth-modal");
const openButton = document.getElementById("my-account");
const closeButton = document.getElementById("gv-auth-close");
const formArea = document.getElementById("gv-auth-content");
const statusLine = document.getElementById("gv-auth-status");

const safe = (value = "") => String(value).replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

function showModal() {
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}
function hideModal() {
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  statusLine.textContent = "";
}
function message(text, error = false) {
  statusLine.textContent = text;
  statusLine.style.color = error ? "#b42318" : "#287a45";
}
function renderAuth(mode = "login") {
  const signup = mode === "signup";
  formArea.innerHTML = `
    <div class="gv-auth-tabs">
      <button type="button" data-mode="login" class="${!signup ? "selected" : ""}">ACCEDI</button>
      <button type="button" data-mode="signup" class="${signup ? "selected" : ""}">REGISTRATI</button>
    </div>
    <h2>${signup ? "Create your account." : "Welcome back."}</h2>
    <p class="gv-auth-sub">${signup ? "Join the GAMEVERSE universe." : "Sign in to your MY GAMEVERSE account."}</p>
    <form id="gv-auth-form" class="gv-auth-form">
      ${signup ? '<label>Username<input name="username" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]+" autocomplete="username" placeholder="Il tuo username" required></label>' : ""}
      <label>Email<input name="email" type="email" autocomplete="email" placeholder="name@example.com" required></label>
      <label>Password<input name="password" type="password" minlength="8" autocomplete="${signup ? "new-password" : "current-password"}" placeholder="Almeno 8 caratteri" required></label>
      <button class="btn gv-auth-submit" type="submit">${signup ? "CREATE ACCOUNT" : "SIGN IN"} →</button>
    </form>
    ${!signup ? '<button class="gv-auth-text-button" id="gv-forgot" type="button">Hai dimenticato la password?</button>' : '<p class="gv-auth-footnote">Lo username deve contenere 3–20 caratteri: lettere, numeri o _.</p>'}
  `;
  formArea.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
    message("");
    renderAuth(button.dataset.mode);
  }));
  formArea.querySelector("#gv-auth-form").addEventListener("submit", submitAuth);
  const forgot = document.getElementById("gv-forgot");
  if (forgot) forgot.addEventListener("click", renderForgot);
}
function renderForgot() {
  formArea.innerHTML = `
    <h2>Reset password.</h2>
    <p class="gv-auth-sub">Inserisci la tua email: ti invieremo un link per scegliere una nuova password.</p>
    <form id="gv-forgot-form" class="gv-auth-form">
      <label>Email<input name="email" type="email" autocomplete="email" required placeholder="name@example.com"></label>
      <button class="btn gv-auth-submit" type="submit">SEND RESET LINK →</button>
    </form>
    <button class="gv-auth-text-button" id="gv-back-login" type="button">← Torna all'accesso</button>`;
  document.getElementById("gv-forgot-form").addEventListener("submit", async event => {
    event.preventDefault();
    const email = new FormData(event.currentTarget).get("email").trim();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/"
    });
    message(error ? error.message : "Se l'indirizzo è registrato, riceverai un'email con il link per reimpostare la password.", !!error);
  });
  document.getElementById("gv-back-login").addEventListener("click", () => renderAuth("login"));
}
async function submitAuth(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = String(form.get("email")).trim().toLowerCase();
  const password = String(form.get("password"));
  const username = String(form.get("username") || "").trim();
  const signup = !!form.get("username");
  const submit = event.currentTarget.querySelector("button[type=submit]");
  submit.disabled = true;
  submit.textContent = "PLEASE WAIT…";
  let error;
  if (signup) {
    ({ error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin + "/"
      }
    }));
    if (!error) {
      message("Registrazione inviata! Controlla la tua email per confermare l'account.");
      submit.textContent = "EMAIL SENT";
      return;
    }
  } else {
    ({ error } = await supabase.auth.signInWithPassword({ email, password }));
  }
  submit.disabled = false;
  submit.textContent = signup ? "CREATE ACCOUNT →" : "SIGN IN →";
  if (error) message(error.message, true);
}
async function renderAccount(user) {
  const { data } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  const username = data?.username || user.user_metadata?.username || "Player";
  formArea.innerHTML = `
    <div class="gv-account-mark">MY GAMEVERSE</div>
    <h2>Welcome, ${safe(username)}.</h2>
    <p class="gv-auth-sub">Hai effettuato l'accesso.</p>
    <div class="gv-account-details"><span>USERNAME</span><strong>${safe(username)}</strong><span>EMAIL</span><strong>${safe(user.email || "")}</strong></div>
    <button class="btn gv-auth-submit" id="gv-signout" type="button">SIGN OUT</button>`;
  document.getElementById("gv-signout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) message(error.message, true);
  });
}
async function renderPasswordUpdate() {
  showModal();
  formArea.innerHTML = `
    <h2>Choose a new password.</h2>
    <form id="gv-update-password" class="gv-auth-form">
      <label>Nuova password<input name="password" type="password" minlength="8" required autocomplete="new-password"></label>
      <button class="btn gv-auth-submit" type="submit">UPDATE PASSWORD →</button>
    </form>`;
  document.getElementById("gv-update-password").addEventListener("submit", async event => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password");
    const { error } = await supabase.auth.updateUser({ password });
    message(error ? error.message : "Password aggiornata. Ora puoi continuare.");
    if (!error) history.replaceState({}, "", window.location.pathname);
  });
}
openButton.addEventListener("click", async () => {
  showModal();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) await renderAccount(user);
  else renderAuth("login");
});
closeButton.addEventListener("click", hideModal);
modal.addEventListener("click", event => { if (event.target === modal) hideModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape") hideModal(); });

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    await renderPasswordUpdate();
  } else if (event === "SIGNED_IN" && session?.user && !modal.classList.contains("hidden")) {
    await renderAccount(session.user);
  } else if (event === "SIGNED_OUT" && !modal.classList.contains("hidden")) {
    renderAuth("login");
  }
});
