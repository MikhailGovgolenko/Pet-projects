class SiteHomeButton extends HTMLElement {
  static observedAttributes = ["aria-label", "href", "label"];

  connectedCallback() {
    if (this.anchor) return;

    this.anchor = document.createElement("a");
    this.anchor.className = "glass site-home-button";

    const icon = document.createElement("span");
    icon.className = "site-home-button-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🏠";

    this.label = document.createElement("span");
    this.anchor.append(icon, this.label);
    this.append(this.anchor);
    this.update();
  }

  attributeChangedCallback() {
    this.update();
  }

  update() {
    if (!this.anchor || !this.label) return;

    const label =
      this.getAttribute("label") ??
      (navigator.language?.toLowerCase().startsWith("ru")
        ? "На главную"
        : "Home");

    this.anchor.href = this.getAttribute("href") ?? "/";
    this.anchor.setAttribute("aria-label", this.getAttribute("aria-label") ?? label);
    this.label.textContent = label;
  }
}

if (!customElements.get("site-home-button")) {
  customElements.define("site-home-button", SiteHomeButton);
}
