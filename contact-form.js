/**
 * Envio do formulário via FormSubmit AJAX — evita redirecionar o navegador
 * para formsubmit.co (onde o timeout/522 costuma aparecer com Cloudflare).
 */
(function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn?.querySelector("span");
  const defaultLabel = submitLabel?.textContent || "Enviar mensagem";

  const action = form.getAttribute("action") || "";
  const ajaxEndpoint = action.replace(
    /^https:\/\/formsubmit\.co\//i,
    "https://formsubmit.co/ajax/",
  );

  if (!ajaxEndpoint.includes("formsubmit.co/ajax/")) {
    console.warn("[contact-form] action inválida:", action);
    return;
  }

  const returnUrl = new URL(window.location.href);
  returnUrl.search = "";
  returnUrl.hash = "contact";

  let nextInput = form.querySelector('input[name="_next"]');
  if (!nextInput) {
    nextInput = document.createElement("input");
    nextInput.type = "hidden";
    nextInput.name = "_next";
    form.appendChild(nextInput);
  }
  nextInput.value = returnUrl.toString() + "?enviado=1";

  if (new URLSearchParams(window.location.search).get("enviado") === "1") {
    showStatus(
      "success",
      "Mensagem recebida. Obrigado pelo contato — responderei em breve.",
    );
    window.history.replaceState(null, "", returnUrl.pathname + "#contact");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!submitBtn || submitBtn.disabled) return;

    setLoading(true);
    showStatus("", "");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    try {
      const body = new FormData(form);
      body.set("_ajax", "true");
      body.set("_template", "table");

      const response = await fetch(ajaxEndpoint, {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        data = null;
      }

      if (response.ok && (!data || data.success !== false)) {
        form.reset();
        showStatus(
          "success",
          "Mensagem enviada com sucesso. Obrigado — responderei em breve.",
        );
        return;
      }

      const msg =
        (data && (data.message || data.error)) ||
        "Não foi possível enviar agora. Tente de novo ou use o e-mail abaixo.";
      showStatus("error", msg);
    } catch (err) {
      const timedOut = err && err.name === "AbortError";
      showStatus(
        "error",
        timedOut
          ? "O serviço de envio demorou demais (timeout). Use "
          : "Falha na conexão com o serviço de envio. Use ",
        true,
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  });

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
    if (submitLabel) {
      submitLabel.textContent = loading ? "Enviando…" : defaultLabel;
    }
  }

  function showStatus(kind, message, withMailtoFallback) {
    if (!statusEl) return;
    statusEl.className = "contact-form-status";
    statusEl.hidden = !message;

    if (!message) {
      statusEl.textContent = "";
      return;
    }

    statusEl.classList.add(
      kind === "success" ? "contact-form-status--success" : "contact-form-status--error",
    );

    if (withMailtoFallback) {
      statusEl.textContent = "";
      statusEl.append(
        document.createTextNode(message),
        mailtoLink(),
        document.createTextNode("."),
      );
    } else {
      statusEl.textContent = message;
    }
  }

  function mailtoLink() {
    const a = document.createElement("a");
    a.href = "mailto:contato@rafaelgois.com";
    a.className = "contact-form-status__mailto";
    a.textContent = "contato@rafaelgois.com";
    return a;
  }
})();
