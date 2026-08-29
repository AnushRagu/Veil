import {
  Bounds,
  RedactionEntry,
  RedactionManifest,
  RedactionCategory,
  SanitizedElement,
} from "@privatesight/shared";
import {
  detectPIICategory,
  findAllPII,
  getReplacementToken,
  SENSITIVE_AUTOCOMPLETE_VALUES,
  SENSITIVE_INPUT_TYPES,
  SENSITIVE_LABEL_KEYWORDS,
  EXPLICIT_SENSITIVE_ATTRS,
} from "./patterns";

export interface RedactionContext {
  elements: SanitizedElement[];
  screenshotWidth: number;
  screenshotHeight: number;
}

export interface RedactionResult {
  redactedElements: SanitizedElement[];
  manifest: RedactionManifest;
  redactedText: Map<string, string>;
}

const SENSITIVE_ROLES = ["textbox", "searchbox", "combobox", "spinbutton"];

function elementHasSensitiveAttribute(el: Element): boolean {
  return EXPLICIT_SENSITIVE_ATTRS.some((attr) => el.hasAttribute(attr));
}

function elementHasSensitiveAutocomplete(el: Element): boolean {
  const autocomplete = el.getAttribute("autocomplete")?.toLowerCase() || "";
  return SENSITIVE_AUTOCOMPLETE_VALUES.some((v) => autocomplete.includes(v));
}

function elementHasSensitiveInputType(el: Element): boolean {
  if (el instanceof HTMLInputElement) {
    return SENSITIVE_INPUT_TYPES.includes(el.type.toLowerCase());
  }
  return false;
}

function elementLabelIndicatesSensitive(el: Element): boolean {
  const label = (
    el.getAttribute("aria-label") ||
    el.getAttribute("placeholder") ||
    el.getAttribute("name") ||
    el.getAttribute("id") ||
    (el as HTMLInputElement).labels?.[0]?.textContent ||
    ""
  ).toLowerCase();
  return SENSITIVE_LABEL_KEYWORDS.some((kw) => label.includes(kw));
}

function getNearbyLabelText(el: Element): string {
  const labelEl = el.closest("label") || document.querySelector(`label[for="${el.id}"]`);
  if (labelEl) return labelEl.textContent || "";
  const ariaLabelledBy = el.getAttribute("aria-labelledby");
  if (ariaLabelledBy) {
    const labelledEl = document.getElementById(ariaLabelledBy);
    if (labelledEl) return labelledEl.textContent || "";
  }
  return "";
}

function classifyElementSensitivity(el: Element, textContent: string): boolean {
  if (elementHasSensitiveAttribute(el)) return true;
  if (elementHasSensitiveAutocomplete(el)) return true;
  if (elementHasSensitiveInputType(el)) return true;
  if (elementLabelIndicatesSensitive(el)) return true;
  const nearbyLabel = getNearbyLabelText(el).toLowerCase();
  if (SENSITIVE_LABEL_KEYWORDS.some((kw) => nearbyLabel.includes(kw))) return true;
  const role = el.getAttribute("role") || "";
  if (SENSITIVE_ROLES.includes(role)) {
    const pii = detectPIICategory(textContent);
    if (pii && ["password", "credit_card", "cvv", "aadhaar", "pan", "otp"].includes(pii.category)) {
      return true;
    }
  }
  return false;
}

export function extractSanitizedElements(
  root: Document | Element = document
): SanitizedElement[] {
  const elements: SanitizedElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node) {
      const el = node as Element;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
        return NodeFilter.FILTER_REJECT;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        return NodeFilter.FILTER_REJECT;
      }
      // Always accept elements with explicit sensitive attributes
      if (elementHasSensitiveAttribute(el)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      // Always accept elements with aria-label or title
      if (el.hasAttribute("aria-label") || el.hasAttribute("aria-labelledby") || el.hasAttribute("title")) {
        return NodeFilter.FILTER_ACCEPT;
      }
      const role = el.getAttribute("role") || getImplicitRole(el);
      if (["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "searchbox", "slider", "spinbutton", "switch", "option", "listbox", "dialog", "region", "form"].includes(role)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      if (el.tagName.match(/^(A|BUTTON|INPUT|SELECT|TEXTAREA|IMG|H[1-6]|LABEL|FORM)$/i)) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_SKIP;
    },
  });

  let index = 0;
  while (walker.nextNode()) {
    const el = walker.currentNode as Element;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;

    const role = (el.getAttribute("role") || getImplicitRole(el)) as SanitizedElement["role"];
    const label = getAccessibleLabel(el);
    const textContent = el.textContent || "";
    const sensitive = classifyElementSensitivity(el, textContent);

    const inputEl = el as HTMLInputElement;
    const placeholder = inputEl.placeholder || el.getAttribute("placeholder") || "";
    const valueState = inputEl.value && inputEl.value.length > 0 ? "filled" : inputEl.value !== undefined ? "empty" : "unknown";
    const href = el.getAttribute("href") || undefined;
    const tagName = el.tagName.toLowerCase();
    const type = inputEl.type || el.getAttribute("type") || undefined;
    
    // Generate robust selector
    const selector = generateSelector(el);
    // Generate XPath
    const xpath = generateXPath(el);
    // ARIA attributes
    const ariaLabel = el.getAttribute("aria-label") || undefined;
    const ariaLabelledBy = el.getAttribute("aria-labelledby") || undefined;
    const name = el.getAttribute("name") || undefined;
    const elementId = el.id || undefined;
    const formId = (el.closest("form") as HTMLFormElement)?.id || undefined;
    const autocomplete = el.getAttribute("autocomplete") || undefined;
    const inputType = (el as HTMLInputElement).type || el.getAttribute("type") || undefined;
    const required = el.hasAttribute("required");
    const readOnly = el.hasAttribute("readonly");
    
    const category = sensitive ? classifyElementCategoryDirect(el, label, textContent) : undefined;
    const replacementToken = category ? getReplacementToken(category) : undefined;

    // Sanitize text content and value
    const sanitizedTextContent = sensitive ? replacementToken || "[REDACTED]" : textContent.slice(0, 200);
    const sanitizedValue = sensitive ? replacementToken || "[REDACTED]" : (inputEl.value || undefined);
    const sanitizedLabel = sanitizeLabel(label, sensitive, category);

    elements.push({
      id: `el-${index++}-${generateId()}`,
      role,
      label: sanitizedLabel,
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      visible: isElementVisible(el),
      enabled: isElementEnabled(el),
      sensitive,
      placeholder: sensitive ? (replacementToken || "[REDACTED]") : (placeholder || undefined),
      valueState: valueState as SanitizedElement["valueState"],
      href,
      tagName,
      type,
      selector,
      xpath,
      ariaLabel,
      ariaLabelledBy,
      name,
      elementId,
      formId,
      autocomplete,
      inputType,
      required: required || undefined,
      readOnly: readOnly || undefined,
      textContent: sanitizedTextContent,
      value: sanitizedValue,
    });
  }

  return elements;
}

function getImplicitRole(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const type = (el as HTMLInputElement).type?.toLowerCase();
  const roleMap: Record<string, string> = {
    a: "link",
    button: "button",
    input: type === "checkbox" ? "checkbox" : type === "radio" ? "radio" : type === "range" ? "slider" : "textbox",
    select: "combobox",
    textarea: "textbox",
    img: "img",
    h1: "heading",
    h2: "heading",
    h3: "heading",
    h4: "heading",
    h5: "heading",
    h6: "heading",
    label: "generic",
    form: "form",
    nav: "navigation",
    main: "main",
    aside: "complementary",
    header: "banner",
    footer: "contentinfo",
    section: "region",
    article: "region",
    dialog: "dialog",
    ul: "listbox",
    ol: "listbox",
    li: "option",
  };
  return roleMap[tag] || "generic";
}

function getAccessibleLabel(el: Element): string {
  return (
    el.getAttribute("aria-label") ||
    (el.getAttribute("aria-labelledby") &&
      document.getElementById(el.getAttribute("aria-labelledby")!)?.textContent) ||
    el.getAttribute("title") ||
    el.getAttribute("placeholder") ||
    (el as HTMLInputElement).labels?.[0]?.textContent ||
    el.getAttribute("alt") ||
    el.textContent?.slice(0, 100) ||
    ""
  ).trim();
}

function sanitizeLabel(label: string, sensitive: boolean, category?: RedactionCategory): string {
  if (!sensitive) return label;
  if (category) return getReplacementToken(category);
  const pii = detectPIICategory(label);
  if (pii) return getReplacementToken(pii.category);
  return "[REDACTED_LABEL]";
}

export function classifyElementCategoryDirect(
  el: Element,
  label: string,
  textContent: string
): RedactionCategory {
  const inputEl = el instanceof HTMLInputElement ? el : null;
  const attrText = [
    label,
    el.getAttribute("aria-label") || "",
    el.getAttribute("placeholder") || "",
    el.getAttribute("name") || "",
    el.getAttribute("id") || "",
    el.getAttribute("autocomplete") || "",
    inputEl?.type || el.getAttribute("type") || "",
    textContent,
    getNearbyLabelText(el),
  ]
    .join(" ")
    .toLowerCase();

  if (attrText.includes("password") || attrText.includes("passwort") || attrText.includes("current-password") || attrText.includes("new-password") || inputEl?.type === "password") {
    return "password";
  }
  if (attrText.includes("otp") || attrText.includes("one-time") || attrText.includes("verification code") || attrText.includes("auth code")) {
    return "otp";
  }
  if (attrText.includes("credit") || attrText.includes("card") || attrText.includes("cc-number") || attrText.includes("cc-exp") || attrText.includes("expiry")) {
    return "credit_card";
  }
  if (attrText.includes("cvv") || attrText.includes("cvc") || attrText.includes("security code") || attrText.includes("cc-csc")) {
    return "cvv";
  }
  if (attrText.includes("aadhaar")) return "aadhaar";
  if (attrText.includes("pan")) return "pan";
  if (attrText.includes("ssn") || attrText.includes("social security")) return "account_number";
  if (attrText.includes("account") || attrText.includes("routing") || attrText.includes("iban")) return "account_number";
  if (attrText.includes("email") || inputEl?.type === "email") return "email";
  if (attrText.includes("phone") || attrText.includes("tel") || attrText.includes("mobile") || inputEl?.type === "tel") return "phone";
  if (attrText.includes("address") || attrText.includes("street") || attrText.includes("zip") || attrText.includes("postal")) return "address";
  if (attrText.includes("photo") || attrText.includes("profile") || attrText.includes("avatar") || attrText.includes("face")) return "face";

  const pii = detectPIICategory(textContent) || detectPIICategory(label) || (inputEl?.value ? detectPIICategory(inputEl.value) : null);
  if (pii) return pii.category as RedactionCategory;

  return "explicit_sensitive";
}

function classifyElementCategory(el: SanitizedElement): RedactionEntry["category"] {
  const label = [
    el.label ?? "",
    el.name ?? "",
    el.elementId ?? "",
    el.placeholder ?? "",
    el.autocomplete ?? "",
    el.inputType ?? "",
    el.textContent ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (label.includes("password") || label.includes("passwort") || label.includes("current-password") || el.inputType === "password") return "password" as const;
  if (label.includes("otp") || label.includes("one-time") || label.includes("verification")) return "otp" as const;
  if (label.includes("credit") || label.includes("card") || label.includes("cc-number") || label.includes("expiry")) return "credit_card" as const;
  if (label.includes("cvv") || label.includes("cvc") || label.includes("cc-csc")) return "cvv" as const;
  if (label.includes("aadhaar")) return "aadhaar" as const;
  if (label.includes("pan")) return "pan" as const;
  if (label.includes("ssn") || label.includes("social security") || label.includes("account") || label.includes("routing") || label.includes("iban")) return "account_number" as const;
  if (label.includes("email") || el.inputType === "email") return "email" as const;
  if (label.includes("phone") || label.includes("tel") || label.includes("mobile") || el.inputType === "tel") return "phone" as const;
  if (label.includes("address") || label.includes("street") || label.includes("zip") || label.includes("postal")) return "address" as const;
  if (label.includes("photo") || label.includes("avatar") || label.includes("face") || label.includes("profile")) return "face" as const;

  const pii = detectPIICategory(el.textContent ?? "") || detectPIICategory(el.label ?? "") || detectPIICategory(el.value ?? "");
  if (pii) return pii.category as RedactionEntry["category"];

  return "explicit_sensitive" as const;
}

function isElementVisible(el: Element): boolean {
  const style = getComputedStyle(el);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function isElementEnabled(el: Element): boolean {
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) {
    return !el.disabled;
  }
  return true;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function hasValidBounds(bounds: Bounds | undefined): bounds is Bounds {
  return bounds !== undefined &&
    typeof bounds.x === "number" &&
    typeof bounds.y === "number" &&
    typeof bounds.width === "number" &&
    typeof bounds.height === "number";
}

function calculateConfidence(el: SanitizedElement, category: string): number {
  let confidence = 0.6;
  const label = (el.label ?? "").toLowerCase();
  if (EXPLICIT_SENSITIVE_ATTRS.some((attr) => label.includes(attr))) confidence += 0.35;
  if (["password", "credit_card", "cvv", "aadhaar", "pan", "otp", "email", "phone"].includes(category)) confidence += 0.3;
  if (label.includes(category.replace("_", " "))) confidence += 0.2;
  return Math.min(confidence, 1.0);
}

export function createRedactionManifest(
  elements: SanitizedElement[],
  _screenshotWidth: number,
  _screenshotHeight: number
): RedactionManifest {
  const manifest: RedactionEntry[] = [];

  for (const el of elements) {
    if (!el.sensitive) continue;
    if (!hasValidBounds(el.bounds)) continue;

    const category = classifyElementCategory(el);
    const confidence = calculateConfidence(el, category);

    manifest.push({
      category,
      bounds: { ...el.bounds },
      confidence,
      replacement: getReplacementToken(category),
    });
  }

  return manifest;
}

export function applyRedactionToScreenshot(
  canvas: HTMLCanvasElement,
  manifest: RedactionManifest
): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  for (const entry of manifest) {
    const bounds = entry.bounds;
    if (!bounds) continue;
    if (typeof bounds.x !== "number" || typeof bounds.y !== "number" ||
        typeof bounds.width !== "number" || typeof bounds.height !== "number") continue;
    const { category } = entry;
    const x = Math.max(0, Math.floor(bounds.x));
    const y = Math.max(0, Math.floor(bounds.y));
    const w = Math.min(canvas.width - x, Math.floor(bounds.width));
    const h = Math.min(canvas.height - y, Math.floor(bounds.height));
    if (w <= 0 || h <= 0) continue;

    if (category === "face") {
      applyBlur(ctx, x, y, w, h);
    } else {
      applyBlackMask(ctx, x, y, w, h);
    }
  }

  return canvas;
}

function applyBlackMask(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
  ctx.fillRect(x, y, w, h);
}

function applyBlur(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  const radius = 8;
  const tempData = new Uint8ClampedArray(data);

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w; j++) {
      let r = 0, g = 0, b = 0, count = 0;
      for (let di = -radius; di <= radius; di++) {
        for (let dj = -radius; dj <= radius; dj++) {
          const ni = i + di;
          const nj = j + dj;
          if (ni >= 0 && ni < h && nj >= 0 && nj < w) {
            const idx = (ni * w + nj) * 4;
            r += tempData[idx];
            g += tempData[idx + 1];
            b += tempData[idx + 2];
            count++;
          }
        }
      }
      const idx = (i * w + j) * 4;
      data[idx] = r / count;
      data[idx + 1] = g / count;
      data[idx + 2] = b / count;
    }
  }
  ctx.putImageData(imageData, x, y);
}

export function redactTextContent(text: string): { redacted: string; replacements: Map<string, string> } {
  const replacements = new Map<string, string>();
  let redacted = text;
  const piiMatches = findAllPII(text);

  for (const match of piiMatches) {
    const token = getReplacementToken(match.category);
    redacted = redacted.replace(match.match, token);
    replacements.set(match.match, token);
  }

  return { redacted, replacements };
}

export function processRedaction(context: RedactionContext): RedactionResult {
  const manifest = createRedactionManifest(context.elements, context.screenshotWidth, context.screenshotHeight);
  const redactedElements = context.elements.map((el) => {
    if (!el.sensitive) return el;
    const category = classifyElementCategory(el);
    return {
      ...el,
      label: getReplacementToken(category),
    };
  });

  const redactedText = new Map<string, string>();
  for (const entry of manifest) {
    redactedText.set(entry.replacement, entry.category as string);
  }

  return { redactedElements, manifest, redactedText };
}

function generateSelector(el: Element): string {
  if (el.id) return `#${el.id}`;
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase();
    if (current.id) {
      part += `#${current.id}`;
      parts.unshift(part);
      break;
    }
    const classNames = Array.from(current.classList).filter(c => !c.startsWith("data-") && !c.startsWith("ps-")).join(".");
    if (classNames) part += `.${classNames}`;
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `:nth-of-type(${index})`;
      }
    }
    parts.unshift(part);
    current = parent;
  }
  return parts.join(" > ");
}

function generateXPath(el: Element): string {
  if (el.id) return `//*[@id="${el.id}"]`;
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.body) {
    let part = current.tagName.toLowerCase();
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        part += `[${index}]`;
      }
    }
    parts.unshift(part);
    current = parent;
  }
  return "/" + parts.join("/");
}

function sanitizeTextContent(text: string, sensitive: boolean): string {
  if (!sensitive) return text.slice(0, 200);
  const { redacted } = redactTextContent(text);
  return redacted.slice(0, 200);
}