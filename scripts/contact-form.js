/**
 * Formulário de contato — Web3Forms (https://api.web3forms.com/submit)
 * Envio via FormData, conforme documentação oficial.
 */
(function initContactForm() {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const statusEl = document.getElementById("contact-form-status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn?.querySelector("span");
  const defaultLabel = submitLabel?.textContent || "Enviar mensagem";

  const config = window.PORTFOLIO_CONTACT || {};
  const accessKey = (config.web3formsAccessKey || "").trim();
  const customEndpoint = (config.customEndpoint || "").trim();

  if (!accessKey && !customEndpoint) {
    console.error(
      "[contact-form] Configure web3formsAccessKey em contact-config.js",
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

    const botField = form.elements.namedItem("botcheck");
    if (botField && "checked" in botField && botField.checked) {
      return;
    }

    const name = getFieldValue(form, "name");
    const email = getFieldValue(form, "email");
    const subject = getFieldValue(form, "subject");
    const message = getFieldValue(form, "message");

    if (!name || !email || !subject || !message) {
      showStatus("error", "Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    showStatus("", "");

    const originalText = submitBtn.textContent;

    try {
      if (customEndpoint) {
        const response = await fetch(customEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ name, email, subject, message }),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.success) {
          onSuccess();
        } else {
          showStatus("error", data.message || "Falha ao enviar.", true);
        }
        return;
      }

      const formData = new FormData(form);
      formData.set("access_key", accessKey);
      formData.set("subject", `[Site] ${subject}`);
      formData.set("from_name", "Portfolio — Rafael Gois");
      formData.set("replyto", email);
      formData.delete("botcheck");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.success !== false) {
        onSuccess();
        return;
      }

      console.warn("[contact-form] Web3Forms:", response.status, data);
      showStatus(
        "error",
        data.message || "Não foi possível enviar. Tente de novo ou use o e-mail abaixo.",
        true,
      );
    } catch (error) {
      console.error("[contact-form]", error);
      showStatus(
        "error",
        "Erro de rede ao enviar. Tente de novo ou escreva para ",
        true,
      );
    } finally {
      submitBtn.textContent = originalText;
      setLoading(false);
    }
  });

  function onSuccess() {
    form.reset();
    showStatus(
      "success",
      "Mensagem enviada. Obrigado, respondo em breve.",
    );
  }

  function getFieldValue(formEl, fieldName) {
    const field = formEl.elements.namedItem(fieldName);
    if (!field || "value" in field === false) return "";
    return String(field.value).trim();
  }

  function setLoading(loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
    if (submitLabel) {
      submitLabel.textContent = loading ? "Enviando…" : defaultLabel;
    } else if (loading) {
      submitBtn.textContent = "Enviando…";
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
