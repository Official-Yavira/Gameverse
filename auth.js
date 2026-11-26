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
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle();
  const username = profile?.username || user.user_metadata?.username || "Player";
  const { data: entitlements, error: libraryError } = await supabase
    .from("game_entitlements").select("game_id, granted_at").eq("user_id", user.id).order("granted_at", { ascending: false });
  const ownedGames = (entitlements || []).map(item => GAMES.find(game => game.id === item.game_id)).filter(Boolean);
  const libraryMarkup = libraryError
    ? '<p class="gv-auth-sub">La libreria non è al momento disponibile. Riprova tra poco.</p>'
    : ownedGames.length
      ? '<div class="gv-library-list">' + ownedGames.map(game => `<div class="gv-library-item"><div><strong>${safe(game.name)}</strong><span>${safe(game.genre)}</span></div>${(game.id === "swift-recess" || game.type === "Premium") ? `<button class="btn" type="button" data-secure-download="${safe(game.id)}">DOWNLOAD ↓</button>` : game.downloadUrl ? `<a class="btn" href="${safe(game.downloadUrl)}" download>DOWNLOAD ↓</a>` : '<span class="gv-library-pending">Download in preparazione</span>'}</div>`).join("") + '</div>'
      : '<div class="gv-library-empty"><strong>YOUR COLLECTION STARTS HERE.</strong><p>I giochi che acquisterai saranno raccolti qui. Potrai tornare in questa sezione per scaricarli.</p><a class="btn light" href="#games" id="gv-explore-games">EXPLORE GAMES ↗</a></div>';
  formArea.innerHTML = `
    <div class="gv-account-mark">MY GAMEVERSE</div>
    <h2>Welcome, ${safe(username)}.</h2>
    <p class="gv-auth-sub">Hai effettuato l'accesso.</p>
    <div class="gv-account-details"><span>USERNAME</span><strong>${safe(username)}</strong><span>EMAIL</span><strong>${safe(user.email || "")}</strong></div>
    <div class="gv-library-heading"><span>YOUR COLLECTION</span><strong>MY GAMES</strong></div>
    ${libraryMarkup}
    <button class="btn gv-auth-submit" id="gv-signout" type="button">SIGN OUT</button>`;
  document.getElementById("gv-signout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) message(error.message, true);
  });
  formArea.querySelectorAll("[data-secure-download]").forEach(button => {
    button.addEventListener("click", async () => {
      const gameId = button.dataset.secureDownload;
      button.disabled = true;
      button.textContent = "PREPARING…";
      const { data, error } = await supabase.functions.invoke("create-game-download", {
        body: { game_id: gameId }
      });
      button.disabled = false;
      button.textContent = "DOWNLOAD ↓";
      if (error || !data?.url) {
        message(data?.error || error?.message || "Download non disponibile al momento.", true);
        return;
      }
      window.location.assign(data.url);
    });
  });
  const explore = document.getElementById("gv-explore-games");
  if (explore) explore.addEventListener("click", () => { hideModal(); });
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

function renderPurchaseConsent(gameId) {
  const game = GAMES.find(item => item.id === gameId);
  if (!game || gameId !== "swift-recess") return;
  showModal();
  message("");
  formArea.innerHTML = `
    <div class="gv-account-mark">GAMEVERSE · SECURE CHECKOUT</div>
    <h2>One last step.</h2>
    <p class="gv-auth-sub">You're purchasing <strong>${safe(game.name)}</strong> for <strong>CHF 1.99</strong>. One-time payment, no subscription.</p>
    <div class="gv-consent-summary">
      <strong>Digital delivery</strong>
      <p>After Stripe confirms your payment, the game will appear in <strong>MY GAMES</strong>. Only then will the secure download button become available. No file is delivered before payment confirmation.</p>
    </div>
    <form id="gv-purchase-consent-form" class="gv-auth-form">
      <label class="gv-consent-check">
        <input type="checkbox" name="terms" required>
        <span>I have read and agree to the <a href="terms.html" target="_blank" rel="noopener">Terms of Sale</a> and have read the <a href="privacy.html" target="_blank" rel="noopener">Privacy Notice</a> and <a href="refunds.html" target="_blank" rel="noopener">Refund Policy</a>.</span>
      </label>
      <label class="gv-consent-check">
        <input type="checkbox" name="digital" required>
        <span>I expressly request that GAMEVERSE starts supplying this digital content immediately after payment, before the end of any applicable withdrawal period. I acknowledge that, where the law provides for this exception, I lose my right of withdrawal once digital supply begins.</span>
      </label>
      <button class="btn gv-auth-submit" id="gv-proceed-payment" type="submit">CONTINUE TO PAYMENT · CHF 1.99 →</button>
    </form>
    <p class="gv-consent-note">You will be redirected to Stripe's secure payment page. Your library is updated only after Stripe confirms that the payment is complete.</p>
  `;
  const form = document.getElementById("gv-purchase-consent-form");
  form.addEventListener("submit", async event => {
    event.preventDefault();
    const values = new FormData(form);
    if (!values.get("terms") || !values.get("digital")) {
      message("Please tick both boxes to continue.", true);
      return;
    }
    const submit = document.getElementById("gv-proceed-payment");
    submit.disabled = true;
    submit.textContent = "PREPARING SECURE PAYMENT…";
    const { data, error } = await supabase.functions.invoke("create-game-checkout", {
      body: {
        game_id: gameId,
        terms_accepted: true,
        immediate_delivery_consent: true,
        withdrawal_right_acknowledged: true,
        terms_version: "terms-2026-11-26-v5",
        privacy_version: "privacy-2026-11-26-v5",
        refund_policy_version: "refunds-2026-11-26-v5"
      }
    });
    if (error || !data?.url) {
      submit.disabled = false;
      submit.textContent = "CONTINUE TO PAYMENT · CHF 1.99 →";
      message(data?.error || "Checkout is not available at the moment. Please try again later.", true);
      return;
    }
    window.location.assign(data.url);
  });
}

document.addEventListener("click", async event => {
  const button = event.target.closest("[data-buy-game]");
  if (!button) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    showModal();
    renderAuth("login");
    message("Sign in to your GAMEVERSE account before purchasing.", true);
    return;
  }
  renderPurchaseConsent(button.dataset.buyGame);
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

(async () => {
  const params = new URLSearchParams(window.location.search);
  const paymentStatus = params.get("payment");
  if (paymentStatus !== "success" && paymentStatus !== "cancelled") return;

  showModal();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await renderAccount(user);
    if (paymentStatus === "success") {
      message("Stripe has returned you to GAMEVERSE. Your library is updated only after the server verifies the payment. Refresh MY GAMES if the game does not appear yet.");
    } else {
      message("Checkout was cancelled. No purchase was completed.");
    }
  } else {
    renderAuth("login");
    message(paymentStatus === "success"
      ? "Sign in to check your GAMEVERSE library. The game appears only after Stripe confirms payment."
      : "Checkout was cancelled. No purchase was completed.");
  }
  params.delete("payment");
  params.delete("session_id");
  const cleanUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
  window.history.replaceState({}, "", cleanUrl);
})();
