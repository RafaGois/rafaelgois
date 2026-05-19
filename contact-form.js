/**
 * Formulário de contato — Web3Forms (https://api.web3forms.com)
 * Substitui FormSubmit (timeouts / erro Cloudflare no formsubmit.co).
 */
(function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn?.querySelector("span");
  const defaultLabel = submitLabel?.textContent || "Enviar mensagem";

  const config = window.PORTFOLIO_CONTACT || {};
  const accessKey = (config.web3formsAccessKey || form.dataset.web3formsKey || "").trim();
  const customEndpoint = (config.customEndpoint || "").trim();

  if (!accessKey && !customEndpoint) {
    console.error(
      "[contact-form] Configure web3formsAccessKey em contact-config.js — https://web3forms.com",
    );
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!accessKey && !customEndpoint) {
      showStatus(
        "error",
        "Formulário ainda não configurado. Enquanto isso, envie para ",
        true,
      );
      return;
    }

    if (!submitBtn || submitBtn.disabled) return;

    const name = form.elements.namedItem("name")?.value?.trim();
    const email = form.elements.namedItem("email")?.value?.trim();
    const subject = form.elements.namedItem("subject")?.value?.trim();
    const message = form.elements.namedItem("message")?.value?.trim();
    const botcheck = form.elements.namedItem("botcheck")?.value;

    if (!name || !email || !subject || !message) {
      showStatus("error", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (botcheck) return;

    setLoading(true);
    showStatus("", "");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    const payload = { name, email, subject, message, botcheck: botcheck || "" };

    try {
      const response = customEndpoint
        ? await fetch(customEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          })
        : await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              access_key: accessKey,
              name,
              email,
              subject: `[Site] ${subject}`,
              message,
              from_name: "Portfolio — Rafael Gois",
              replyto: email,
            }),
            signal: controller.signal,
          });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success) {
        form.reset();
        showStatus(
          "success",
          "Mensagem enviada com sucesso. Obrigado — responderei em breve no seu e-mail.",
        );
        return;
      }

      const msg =
        data.message ||
        data.body?.message ||
        "Não foi possível enviar. Tente novamente ou use o e-mail abaixo.";
      showStatus("error", msg, true);
    } catch (err) {
      const timedOut = err && err.name === "AbortError";
      showStatus(
        "error",
        timedOut
          ? "A conexão demorou demais. Tente de novo ou escreva para "
          : "Erro de rede ao enviar. Tente de novo ou escreva para ",
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
      kind === "success"
        ? "contact-form-status--success"
        : "contact-form-status--error",
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
