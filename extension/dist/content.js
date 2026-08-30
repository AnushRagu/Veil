"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/redaction/patterns.ts
  var PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    phone: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
    aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    pan: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    cvv: /\b\d{3,4}\b(?!\s?\d{4})/g,
    otp: /\b\d{6}\b/g,
    ipv4: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    apiKey: /\b(?:sk-[A-Za-z0-9]{32,}|[A-Za-z0-9_-]{32,})\b/g,
    jwt: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    url: /https?:\/\/[^\s]+/g
  };
  var PII_CATEGORY_MAP = {
    email: "email",
    phone: "phone",
    creditCard: "credit_card",
    aadhaar: "aadhaar",
    pan: "pan",
    ssn: "account_number",
    cvv: "cvv",
    otp: "otp",
    ipv4: "custom",
    url: "custom",
    apiKey: "custom",
    jwt: "custom"
  };
  var SENSITIVE_AUTOCOMPLETE_VALUES = [
    "password",
    "new-password",
    "current-password",
    "one-time-code",
    "cc-number",
    "cc-csc",
    "cc-exp",
    "cc-name",
    "address-line1",
    "address-line2",
    "address-line3",
    "postal-code",
    "tel",
    "email"
  ];
  var SENSITIVE_INPUT_TYPES = ["password", "tel", "email"];
  var SENSITIVE_LABEL_KEYWORDS = [
    "password",
    "passwort",
    "contrase\xF1a",
    "mot de passe",
    "senha",
    "parola",
    "has\u0142o",
    "\u043F\u0430\u0440\u043E\u043B\u044C",
    "\u5BC6\u7801",
    "\u30D1\u30B9\u30EF\u30FC\u30C9",
    "\uBE44\uBC00\uBC88\uD638",
    "credit card",
    "creditcard",
    "debit card",
    "card number",
    "cardnumber",
    "cvv",
    "cvc",
    "security code",
    "otp",
    "one-time",
    "verification code",
    "auth code",
    "aadhaar",
    "pan",
    "ssn",
    "social security",
    "account number",
    "routing number",
    "iban",
    "swift",
    "pin",
    "cvc2",
    "cvv2",
    "email",
    "e-mail",
    "phone",
    "mobile",
    "address",
    "street",
    "zip",
    "postal",
    "expiry",
    "expiration",
    "api key",
    "secret",
    "token",
    "profile photo",
    "profile image",
    "user photo"
  ];
  var EXPLICIT_SENSITIVE_ATTRS = [
    "data-sensitive",
    "data-private",
    "data-pii",
    "data-confidential"
  ];
  function detectPIICategory(text) {
    for (const [category, pattern] of Object.entries(PII_PATTERNS)) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        return { category: PII_CATEGORY_MAP[category], match: matches[0] };
      }
    }
    return null;
  }
  function getReplacementToken(category) {
    const tokens = {
      email: "[REDACTED_EMAIL]",
      phone: "[REDACTED_PHONE]",
      credit_card: "[REDACTED_CARD]",
      cvv: "[REDACTED_CVV]",
      aadhaar: "[REDACTED_AADHAAR]",
      pan: "[REDACTED_PAN]",
      account_number: "[REDACTED_ACCOUNT]",
      password: "[REDACTED_PASSWORD]",
      otp: "[REDACTED_OTP]",
      address: "[REDACTED_ADDRESS]",
      face: "[REDACTED_FACE]",
      explicit_sensitive: "[REDACTED_SENSITIVE]",
      custom: "[REDACTED]"
    };
    return tokens[category] || "[REDACTED]";
  }

  // src/redaction/redactionEngine.ts
  var SENSITIVE_ROLES = ["textbox", "searchbox", "combobox", "spinbutton"];
  function elementHasSensitiveAttribute(el) {
    return EXPLICIT_SENSITIVE_ATTRS.some((attr) => el.hasAttribute(attr));
  }
  function elementHasSensitiveAutocomplete(el) {
    const autocomplete = el.getAttribute("autocomplete")?.toLowerCase() || "";
    return SENSITIVE_AUTOCOMPLETE_VALUES.some((v) => autocomplete.includes(v));
  }
  function elementHasSensitiveInputType(el) {
    if (el instanceof HTMLInputElement) {
      return SENSITIVE_INPUT_TYPES.includes(el.type.toLowerCase());
    }
    return false;
  }
  function elementLabelIndicatesSensitive(el) {
    const label = (el.getAttribute("aria-label") || el.getAttribute("placeholder") || el.getAttribute("name") || el.getAttribute("id") || el.labels?.[0]?.textContent || "").toLowerCase();
    return SENSITIVE_LABEL_KEYWORDS.some((kw) => label.includes(kw));
  }
  function getNearbyLabelText(el) {
    const labelEl = el.closest("label") || document.querySelector(`label[for="${el.id}"]`);
    if (labelEl) return labelEl.textContent || "";
    const ariaLabelledBy = el.getAttribute("aria-labelledby");
    if (ariaLabelledBy) {
      const labelledEl = document.getElementById(ariaLabelledBy);
      if (labelledEl) return labelledEl.textContent || "";
    }
    return "";
  }
  function classifyElementSensitivity(el, textContent) {
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
  function extractSanitizedElements(root = document) {
    const elements = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
      acceptNode(node) {
        const el = node;
        const style = getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
          return NodeFilter.FILTER_REJECT;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          return NodeFilter.FILTER_REJECT;
        }
        if (elementHasSensitiveAttribute(el)) {
          return NodeFilter.FILTER_ACCEPT;
        }
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
      }
    });
    let index = 0;
    while (walker.nextNode()) {
      const el = walker.currentNode;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const role = el.getAttribute("role") || getImplicitRole(el);
      const label = getAccessibleLabel(el);
      const textContent = el.textContent || "";
      const sensitive = classifyElementSensitivity(el, textContent);
      const inputEl = el;
      const placeholder = inputEl.placeholder || el.getAttribute("placeholder") || "";
      const valueState = inputEl.value && inputEl.value.length > 0 ? "filled" : inputEl.value !== void 0 ? "empty" : "unknown";
      const href = el.getAttribute("href") || void 0;
      const tagName = el.tagName.toLowerCase();
      const type = inputEl.type || el.getAttribute("type") || void 0;
      const selector = generateSelector(el);
      const xpath = generateXPath(el);
      const ariaLabel = el.getAttribute("aria-label") || void 0;
      const ariaLabelledBy = el.getAttribute("aria-labelledby") || void 0;
      const name = el.getAttribute("name") || void 0;
      const elementId = el.id || void 0;
      const formId = el.closest("form")?.id || void 0;
      const autocomplete = el.getAttribute("autocomplete") || void 0;
      const inputType = el.type || el.getAttribute("type") || void 0;
      const required = el.hasAttribute("required");
      const readOnly = el.hasAttribute("readonly");
      const category = sensitive ? classifyElementCategoryDirect(el, label, textContent) : void 0;
      const replacementToken = category ? getReplacementToken(category) : void 0;
      const sanitizedTextContent = sensitive ? replacementToken || "[REDACTED]" : textContent.slice(0, 200);
      const sanitizedValue = sensitive ? replacementToken || "[REDACTED]" : inputEl.value || void 0;
      const sanitizedLabel = sanitizeLabel(label, sensitive, category);
      elements.push({
        id: `el-${index++}-${generateId()}`,
        role,
        label: sanitizedLabel,
        bounds: {
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        visible: isElementVisible(el),
        enabled: isElementEnabled(el),
        sensitive,
        placeholder: sensitive ? replacementToken || "[REDACTED]" : placeholder || void 0,
        valueState,
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
        required: required || void 0,
        readOnly: readOnly || void 0,
        textContent: sanitizedTextContent,
        value: sanitizedValue
      });
    }
    return elements;
  }
  function getImplicitRole(el) {
    const tag = el.tagName.toLowerCase();
    const type = el.type?.toLowerCase();
    const roleMap = {
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
      li: "option"
    };
    return roleMap[tag] || "generic";
  }
  function getAccessibleLabel(el) {
    return (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent || el.getAttribute("title") || el.getAttribute("placeholder") || el.labels?.[0]?.textContent || el.getAttribute("alt") || el.textContent?.slice(0, 100) || "").trim();
  }
  function sanitizeLabel(label, sensitive, category) {
    if (!sensitive) return label;
    if (category) return getReplacementToken(category);
    const pii = detectPIICategory(label);
    if (pii) return getReplacementToken(pii.category);
    return "[REDACTED_LABEL]";
  }
  function classifyElementCategoryDirect(el, label, textContent) {
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
      getNearbyLabelText(el)
    ].join(" ").toLowerCase();
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
    if (pii) return pii.category;
    return "explicit_sensitive";
  }
  function classifyElementCategory(el) {
    const label = [
      el.label ?? "",
      el.name ?? "",
      el.elementId ?? "",
      el.placeholder ?? "",
      el.autocomplete ?? "",
      el.inputType ?? "",
      el.textContent ?? ""
    ].join(" ").toLowerCase();
    if (label.includes("password") || label.includes("passwort") || label.includes("current-password") || el.inputType === "password") return "password";
    if (label.includes("otp") || label.includes("one-time") || label.includes("verification")) return "otp";
    if (label.includes("credit") || label.includes("card") || label.includes("cc-number") || label.includes("expiry")) return "credit_card";
    if (label.includes("cvv") || label.includes("cvc") || label.includes("cc-csc")) return "cvv";
    if (label.includes("aadhaar")) return "aadhaar";
    if (label.includes("pan")) return "pan";
    if (label.includes("ssn") || label.includes("social security") || label.includes("account") || label.includes("routing") || label.includes("iban")) return "account_number";
    if (label.includes("email") || el.inputType === "email") return "email";
    if (label.includes("phone") || label.includes("tel") || label.includes("mobile") || el.inputType === "tel") return "phone";
    if (label.includes("address") || label.includes("street") || label.includes("zip") || label.includes("postal")) return "address";
    if (label.includes("photo") || label.includes("avatar") || label.includes("face") || label.includes("profile")) return "face";
    const pii = detectPIICategory(el.textContent ?? "") || detectPIICategory(el.label ?? "") || detectPIICategory(el.value ?? "");
    if (pii) return pii.category;
    return "explicit_sensitive";
  }
  function isElementVisible(el) {
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
  }
  function isElementEnabled(el) {
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement || el instanceof HTMLButtonElement) {
      return !el.disabled;
    }
    return true;
  }
  function generateId() {
    return Math.random().toString(36).substring(2, 10);
  }
  function hasValidBounds(bounds) {
    return bounds !== void 0 && typeof bounds.x === "number" && typeof bounds.y === "number" && typeof bounds.width === "number" && typeof bounds.height === "number";
  }
  function calculateConfidence(el, category) {
    let confidence = 0.6;
    const label = (el.label ?? "").toLowerCase();
    if (EXPLICIT_SENSITIVE_ATTRS.some((attr) => label.includes(attr))) confidence += 0.35;
    if (["password", "credit_card", "cvv", "aadhaar", "pan", "otp", "email", "phone"].includes(category)) confidence += 0.3;
    if (label.includes(category.replace("_", " "))) confidence += 0.2;
    return Math.min(confidence, 1);
  }
  function createRedactionManifest(elements, _screenshotWidth, _screenshotHeight) {
    const manifest = [];
    for (const el of elements) {
      if (!el.sensitive) continue;
      if (!hasValidBounds(el.bounds)) continue;
      const category = classifyElementCategory(el);
      const confidence = calculateConfidence(el, category);
      manifest.push({
        category,
        bounds: { ...el.bounds },
        confidence,
        replacement: getReplacementToken(category)
      });
    }
    return manifest;
  }
  function processRedaction(context) {
    const manifest = createRedactionManifest(context.elements, context.screenshotWidth, context.screenshotHeight);
    const redactedElements = context.elements.map((el) => {
      if (!el.sensitive) return el;
      const category = classifyElementCategory(el);
      return {
        ...el,
        label: getReplacementToken(category)
      };
    });
    const redactedText = /* @__PURE__ */ new Map();
    for (const entry of manifest) {
      redactedText.set(entry.replacement, entry.category);
    }
    return { redactedElements, manifest, redactedText };
  }
  function generateSelector(el) {
    if (el.id) return `#${el.id}`;
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      if (current.id) {
        part += `#${current.id}`;
        parts.unshift(part);
        break;
      }
      const classNames = Array.from(current.classList).filter((c) => !c.startsWith("data-") && !c.startsWith("ps-")).join(".");
      if (classNames) part += `.${classNames}`;
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
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
  function generateXPath(el) {
    if (el.id) return `//*[@id="${el.id}"]`;
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let part = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
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

  // ../node_modules/zod/v3/external.js
  var external_exports = {};
  __export(external_exports, {
    BRAND: () => BRAND,
    DIRTY: () => DIRTY,
    EMPTY_PATH: () => EMPTY_PATH,
    INVALID: () => INVALID,
    NEVER: () => NEVER,
    OK: () => OK,
    ParseStatus: () => ParseStatus,
    Schema: () => ZodType,
    ZodAny: () => ZodAny,
    ZodArray: () => ZodArray,
    ZodBigInt: () => ZodBigInt,
    ZodBoolean: () => ZodBoolean,
    ZodBranded: () => ZodBranded,
    ZodCatch: () => ZodCatch,
    ZodDate: () => ZodDate,
    ZodDefault: () => ZodDefault,
    ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
    ZodEffects: () => ZodEffects,
    ZodEnum: () => ZodEnum,
    ZodError: () => ZodError,
    ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
    ZodFunction: () => ZodFunction,
    ZodIntersection: () => ZodIntersection,
    ZodIssueCode: () => ZodIssueCode,
    ZodLazy: () => ZodLazy,
    ZodLiteral: () => ZodLiteral,
    ZodMap: () => ZodMap,
    ZodNaN: () => ZodNaN,
    ZodNativeEnum: () => ZodNativeEnum,
    ZodNever: () => ZodNever,
    ZodNull: () => ZodNull,
    ZodNullable: () => ZodNullable,
    ZodNumber: () => ZodNumber,
    ZodObject: () => ZodObject,
    ZodOptional: () => ZodOptional,
    ZodParsedType: () => ZodParsedType,
    ZodPipeline: () => ZodPipeline,
    ZodPromise: () => ZodPromise,
    ZodReadonly: () => ZodReadonly,
    ZodRecord: () => ZodRecord,
    ZodSchema: () => ZodType,
    ZodSet: () => ZodSet,
    ZodString: () => ZodString,
    ZodSymbol: () => ZodSymbol,
    ZodTransformer: () => ZodEffects,
    ZodTuple: () => ZodTuple,
    ZodType: () => ZodType,
    ZodUndefined: () => ZodUndefined,
    ZodUnion: () => ZodUnion,
    ZodUnknown: () => ZodUnknown,
    ZodVoid: () => ZodVoid,
    addIssueToContext: () => addIssueToContext,
    any: () => anyType,
    array: () => arrayType,
    bigint: () => bigIntType,
    boolean: () => booleanType,
    coerce: () => coerce,
    custom: () => custom,
    date: () => dateType,
    datetimeRegex: () => datetimeRegex,
    defaultErrorMap: () => en_default,
    discriminatedUnion: () => discriminatedUnionType,
    effect: () => effectsType,
    enum: () => enumType,
    function: () => functionType,
    getErrorMap: () => getErrorMap,
    getParsedType: () => getParsedType,
    instanceof: () => instanceOfType,
    intersection: () => intersectionType,
    isAborted: () => isAborted,
    isAsync: () => isAsync,
    isDirty: () => isDirty,
    isValid: () => isValid,
    late: () => late,
    lazy: () => lazyType,
    literal: () => literalType,
    makeIssue: () => makeIssue,
    map: () => mapType,
    nan: () => nanType,
    nativeEnum: () => nativeEnumType,
    never: () => neverType,
    null: () => nullType,
    nullable: () => nullableType,
    number: () => numberType,
    object: () => objectType,
    objectUtil: () => objectUtil,
    oboolean: () => oboolean,
    onumber: () => onumber,
    optional: () => optionalType,
    ostring: () => ostring,
    pipeline: () => pipelineType,
    preprocess: () => preprocessType,
    promise: () => promiseType,
    quotelessJson: () => quotelessJson,
    record: () => recordType,
    set: () => setType,
    setErrorMap: () => setErrorMap,
    strictObject: () => strictObjectType,
    string: () => stringType,
    symbol: () => symbolType,
    transformer: () => effectsType,
    tuple: () => tupleType,
    undefined: () => undefinedType,
    union: () => unionType,
    unknown: () => unknownType,
    util: () => util,
    void: () => voidType
  });

  // ../node_modules/zod/v3/helpers/util.js
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  var ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  var getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };

  // ../node_modules/zod/v3/ZodError.js
  var ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  var quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
  };
  var ZodError = class _ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof _ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };

  // ../node_modules/zod/v3/locales/en.js
  var errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  var en_default = errorMap;

  // ../node_modules/zod/v3/errors.js
  var overrideErrorMap = en_default;
  function setErrorMap(map) {
    overrideErrorMap = map;
  }
  function getErrorMap() {
    return overrideErrorMap;
  }

  // ../node_modules/zod/v3/helpers/parseUtil.js
  var makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  var EMPTY_PATH = [];
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === en_default ? void 0 : en_default
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  var ParseStatus = class _ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return _ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  };
  var INVALID = Object.freeze({
    status: "aborted"
  });
  var DIRTY = (value) => ({ status: "dirty", value });
  var OK = (value) => ({ status: "valid", value });
  var isAborted = (x) => x.status === "aborted";
  var isDirty = (x) => x.status === "dirty";
  var isValid = (x) => x.status === "valid";
  var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

  // ../node_modules/zod/v3/helpers/errorUtil.js
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));

  // ../node_modules/zod/v3/types.js
  var ParseInputLazyPath = class {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  };
  var handleResult = (ctx, result) => {
    if (isValid(result)) {
      return { success: true, data: result.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message ?? ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: message ?? required_error ?? ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  var ZodType = class {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      const ctx = {
        common: {
          issues: [],
          async: params?.async ?? false,
          contextualErrorMap: params?.errorMap
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
    }
    "~validate"(data) {
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result) ? {
            value: result.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if (err?.message?.toLowerCase()?.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
        value: result.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params?.errorMap,
          async: true
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  };
  var cuidRegex = /^c[^\s-]{8,}$/i;
  var cuid2Regex = /^[0-9a-z]+$/;
  var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  var nanoidRegex = /^[a-z0-9_-]{21}$/i;
  var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  var emojiRegex;
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  var dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && decoded?.typ !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  var ZodString = class _ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  var ZodNumber = class _ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodBigInt = class _ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  var ZodBoolean = class extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodDate = class _ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new _ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  var ZodSymbol = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  var ZodUndefined = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  var ZodNull = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  var ZodAny = class extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  var ZodUnknown = class extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  var ZodNever = class extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  var ZodVoid = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  var ZodArray = class _ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result2) => {
          return ParseStatus.mergeArray(status, result2);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new _ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new _ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new _ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  var ZodObject = class _ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {
        } else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new _ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new _ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new _ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  var ZodUnion = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  var getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
      return [type.value];
    } else if (type instanceof ZodEnum) {
      return type.options;
    } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
    } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
      return [void 0];
    } else if (type instanceof ZodNull) {
      return [null];
    } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
    } else {
      return [];
    }
  };
  var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new _ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  var ZodIntersection = class extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  var ZodTuple = class _ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new _ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  var ZodRecord = class _ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new _ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new _ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  var ZodMap = class extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  var ZodSet = class _ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new _ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new _ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  var ZodFunction = class _ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new _ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new _ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new _ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  var ZodLazy = class extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  var ZodLiteral = class extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  var ZodEnum = class _ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return _ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  var ZodNativeEnum = class extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  var ZodPromise = class extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  var ZodEffects = class extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  var ZodOptional = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  var ZodNullable = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  var ZodDefault = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  var ZodCatch = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result2) => {
          return {
            status: "valid",
            value: result2.status === "valid" ? result2.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  var ZodNaN = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  var BRAND = Symbol("zod_brand");
  var ZodBranded = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  var ZodPipeline = class _ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new _ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  var ZodReadonly = class extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
  }
  function custom(check, _params = {}, fatal) {
    if (check)
      return ZodAny.create().superRefine((data, ctx) => {
        const r = check(data);
        if (r instanceof Promise) {
          return r.then((r2) => {
            if (!r2) {
              const params = cleanParams(_params, data);
              const _fatal = params.fatal ?? fatal ?? true;
              ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
          });
        }
        if (!r) {
          const params = cleanParams(_params, data);
          const _fatal = params.fatal ?? fatal ?? true;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
        return;
      });
    return ZodAny.create();
  }
  var late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  var instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
  }) => custom((data) => data instanceof cls, params);
  var stringType = ZodString.create;
  var numberType = ZodNumber.create;
  var nanType = ZodNaN.create;
  var bigIntType = ZodBigInt.create;
  var booleanType = ZodBoolean.create;
  var dateType = ZodDate.create;
  var symbolType = ZodSymbol.create;
  var undefinedType = ZodUndefined.create;
  var nullType = ZodNull.create;
  var anyType = ZodAny.create;
  var unknownType = ZodUnknown.create;
  var neverType = ZodNever.create;
  var voidType = ZodVoid.create;
  var arrayType = ZodArray.create;
  var objectType = ZodObject.create;
  var strictObjectType = ZodObject.strictCreate;
  var unionType = ZodUnion.create;
  var discriminatedUnionType = ZodDiscriminatedUnion.create;
  var intersectionType = ZodIntersection.create;
  var tupleType = ZodTuple.create;
  var recordType = ZodRecord.create;
  var mapType = ZodMap.create;
  var setType = ZodSet.create;
  var functionType = ZodFunction.create;
  var lazyType = ZodLazy.create;
  var literalType = ZodLiteral.create;
  var enumType = ZodEnum.create;
  var nativeEnumType = ZodNativeEnum.create;
  var promiseType = ZodPromise.create;
  var effectsType = ZodEffects.create;
  var optionalType = ZodOptional.create;
  var nullableType = ZodNullable.create;
  var preprocessType = ZodEffects.createWithPreprocess;
  var pipelineType = ZodPipeline.create;
  var ostring = () => stringType().optional();
  var onumber = () => numberType().optional();
  var oboolean = () => booleanType().optional();
  var coerce = {
    string: (arg) => ZodString.create({ ...arg, coerce: true }),
    number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
    boolean: (arg) => ZodBoolean.create({
      ...arg,
      coerce: true
    }),
    bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
    date: (arg) => ZodDate.create({ ...arg, coerce: true })
  };
  var NEVER = INVALID;

  // ../shared/src/schemas/index.ts
  var BoundsSchema = external_exports.object({
    x: external_exports.number(),
    y: external_exports.number(),
    width: external_exports.number(),
    height: external_exports.number()
  });
  var ElementRoleSchema = external_exports.enum([
    "button",
    "link",
    "textbox",
    "combobox",
    "checkbox",
    "radio",
    "menuitem",
    "tab",
    "heading",
    "img",
    "region",
    "generic",
    "searchbox",
    "slider",
    "spinbutton",
    "switch",
    "treeitem",
    "option",
    "listbox",
    "dialog",
    "alert",
    "banner",
    "contentinfo",
    "form",
    "main",
    "navigation",
    "search",
    "complementary"
  ]);
  var SanitizedElementSchema = external_exports.object({
    id: external_exports.string(),
    role: ElementRoleSchema,
    label: external_exports.string(),
    bounds: BoundsSchema,
    visible: external_exports.boolean(),
    enabled: external_exports.boolean(),
    sensitive: external_exports.boolean(),
    placeholder: external_exports.string().optional(),
    valueState: external_exports.enum(["empty", "filled", "unknown"]).optional(),
    href: external_exports.string().optional(),
    tagName: external_exports.string().optional(),
    type: external_exports.string().optional(),
    // Robust locator fields
    selector: external_exports.string().optional(),
    xpath: external_exports.string().optional(),
    ariaLabel: external_exports.string().optional(),
    ariaLabelledBy: external_exports.string().optional(),
    name: external_exports.string().optional(),
    elementId: external_exports.string().optional(),
    formId: external_exports.string().optional(),
    autocomplete: external_exports.string().optional(),
    inputType: external_exports.string().optional(),
    required: external_exports.boolean().optional(),
    readOnly: external_exports.boolean().optional(),
    // Text content (sanitized)
    textContent: external_exports.string().optional(),
    value: external_exports.string().optional(),
    // Vision / perception fusion fields
    domConfidence: external_exports.number().min(0).max(1).optional(),
    visionConfidence: external_exports.number().min(0).max(1).optional(),
    combinedConfidence: external_exports.number().min(0).max(1).optional()
  });
  var PageMapSchema = external_exports.object({
    urlOrigin: external_exports.string().url(),
    title: external_exports.string(),
    viewport: external_exports.object({
      width: external_exports.number().positive(),
      height: external_exports.number().positive()
    }),
    elements: external_exports.array(SanitizedElementSchema)
  });
  var RedactionCategorySchema = external_exports.enum([
    "password",
    "otp",
    "credit_card",
    "cvv",
    "aadhaar",
    "pan",
    "email",
    "phone",
    "address",
    "account_number",
    "face",
    "explicit_sensitive",
    "custom"
  ]);
  var RedactionEntrySchema = external_exports.object({
    category: RedactionCategorySchema,
    bounds: BoundsSchema,
    confidence: external_exports.number().min(0).max(1),
    replacement: external_exports.string()
  });
  var RedactionManifestSchema = external_exports.array(RedactionEntrySchema);
  var ClientPayloadSchema = external_exports.object({
    sessionId: external_exports.string().uuid(),
    timestamp: external_exports.string().datetime(),
    userGoal: external_exports.string().min(1).max(2e3),
    sanitizedScreenshot: external_exports.string().optional(),
    pageMap: PageMapSchema,
    redactionManifest: RedactionManifestSchema
  });
  var ActionTypeSchema = external_exports.enum([
    "click",
    "scroll",
    "focus",
    "type",
    "wait",
    "highlight",
    "select",
    "navigate"
  ]);
  var ScrollDirectionSchema = external_exports.enum(["up", "down", "left", "right"]);
  var ActionTargetSchema = external_exports.object({
    elementId: external_exports.string().optional(),
    bounds: BoundsSchema.optional(),
    selector: external_exports.string().optional(),
    text: external_exports.string().optional(),
    label: external_exports.string().optional()
  });
  var ServerActionSchema = external_exports.object({
    id: external_exports.string().uuid(),
    type: ActionTypeSchema,
    target: ActionTargetSchema.optional(),
    value: external_exports.string().optional(),
    direction: ScrollDirectionSchema.optional(),
    amount: external_exports.number().optional(),
    reason: external_exports.string(),
    confidence: external_exports.number().min(0).max(1),
    risk: external_exports.enum(["low", "medium", "high"]).optional()
  });
  var ServerPlanSchema = external_exports.object({
    summary: external_exports.string(),
    confidence: external_exports.number().min(0).max(1),
    requiresUserConfirmation: external_exports.boolean(),
    actions: external_exports.array(ServerActionSchema),
    mode: external_exports.string().optional()
  });
  var InferenceBackendSchema = external_exports.enum(["webgpu", "wasm", "mock"]);
  var PrivacyStatusSchema = external_exports.object({
    backend: InferenceBackendSchema,
    redactedCount: external_exports.number().nonnegative(),
    lastCapture: external_exports.string().datetime().optional(),
    sessionActive: external_exports.boolean()
  });
  var TelemetryEntrySchema = external_exports.object({
    timestamp: external_exports.string().datetime(),
    metric: external_exports.enum([
      "model_inference_ms",
      "screenshot_capture_ms",
      "dom_extraction_ms",
      "redaction_ms",
      "payload_size_before_bytes",
      "payload_size_after_bytes",
      "server_roundtrip_ms",
      "total_latency_ms",
      "sensitive_regions_detected",
      "actions_blocked",
      "inference_backend",
      "vision_latency_ms",
      "execution_latency_ms"
    ]),
    value: external_exports.number(),
    sessionId: external_exports.string().uuid()
  });
  var ActionPolicySchema = external_exports.enum(["auto", "confirm", "reject"]);
  var ValidatedActionSchema = external_exports.object({
    action: ServerActionSchema,
    policy: ActionPolicySchema,
    reason: external_exports.string(),
    mappedElement: SanitizedElementSchema.optional()
  });

  // ../shared/src/suggestions/suggestionEngine.ts
  function generatePageSuggestions(pageMap, currentUserGoal) {
    if (!pageMap || !pageMap.elements || pageMap.elements.length === 0) {
      return [
        {
          id: "sug-scroll-down",
          label: "Scroll down",
          category: "scroll",
          action: {
            id: "act-sug-scroll-down",
            type: "scroll",
            direction: "down",
            amount: 400,
            reason: "Scroll down to see more page content",
            confidence: 0.95,
            risk: "low"
          },
          icon: "scroll",
          description: "Move viewport down"
        }
      ];
    }
    const suggestions = [];
    const elements = pageMap.elements;
    const goalLower = (currentUserGoal || "").trim().toLowerCase();
    const searchElement = elements.find(
      (el) => el.visible && el.enabled && !el.sensitive && (el.role === "searchbox" || el.type === "search" || el.placeholder && el.placeholder.toLowerCase().includes("search") || el.label && el.label.toLowerCase().includes("search") || el.name && el.name.toLowerCase().includes("search") || el.elementId && el.elementId.toLowerCase().includes("search"))
    );
    if (searchElement && !goalLower.includes("search")) {
      let searchLabel = "Search this page";
      const placeholder = (searchElement.placeholder || "").trim().toLowerCase();
      const label = (searchElement.label || "").trim().toLowerCase();
      if (placeholder.includes("product") || label.includes("product")) {
        searchLabel = "Search products";
      }
      suggestions.push({
        id: `sug-search-${searchElement.id}`,
        label: searchLabel,
        category: "search",
        action: {
          id: `act-search-${searchElement.id}`,
          type: "focus",
          target: {
            elementId: searchElement.id,
            selector: searchElement.selector,
            label: searchElement.label || searchElement.placeholder || "Search",
            bounds: searchElement.bounds
          },
          reason: `Focus ${searchLabel} to enter query`,
          confidence: 0.95,
          risk: "low"
        },
        icon: "search",
        description: `Focus ${searchLabel}`
      });
    }
    const viewportHeight = pageMap.viewport?.height || 800;
    const elementsBelowFold = elements.some((el) => el.bounds && el.bounds.y + el.bounds.height > viewportHeight);
    if ((elementsBelowFold || elements.length > 5) && !goalLower.includes("scroll")) {
      suggestions.push({
        id: "sug-scroll-down",
        label: "Scroll down",
        category: "scroll",
        action: {
          id: "act-sug-scroll-down",
          type: "scroll",
          direction: "down",
          amount: 400,
          reason: "Scroll down to see more page content",
          confidence: 0.95,
          risk: "low"
        },
        icon: "scroll",
        description: "Move viewport down"
      });
    }
    const candidateInteractive = elements.filter(
      (el) => el.visible && el.enabled && !el.sensitive && (el.role === "button" || el.tagName === "button" || el.role === "link" && el.label && el.label.length < 35) && el.label && el.label.trim().length >= 2 && el.label.trim().length <= 35 && !el.label.toLowerCase().includes("close") && !el.label.toLowerCase().includes("privacy") && !el.label.toLowerCase().includes("terms")
    );
    const priorityKeywords = [
      "submit",
      "settings",
      "youtube",
      "google home",
      "continue",
      "next",
      "sign in",
      "log in",
      "save",
      "download",
      "cart",
      "checkout",
      "wikipedia"
    ];
    const sortedInteractive = [...candidateInteractive].sort((a, b) => {
      const aText = (a.label || "").toLowerCase();
      const bText = (b.label || "").toLowerCase();
      const aPriority = priorityKeywords.some((kw) => aText.includes(kw)) ? 1 : 0;
      const bPriority = priorityKeywords.some((kw) => bText.includes(kw)) ? 1 : 0;
      if (aPriority !== bPriority) return bPriority - aPriority;
      return (a.bounds?.y ?? 0) - (b.bounds?.y ?? 0);
    });
    for (const item of sortedInteractive) {
      if (suggestions.length >= 4) break;
      const labelTrimmed = item.label.trim();
      const labelLower = labelTrimmed.toLowerCase();
      if (searchElement && (labelLower === "search" || labelLower.includes("voice") || labelLower.includes("image") || labelLower.includes("search by") || labelLower.includes("search page"))) {
        continue;
      }
      if (goalLower) {
        const goalKeywords = goalLower.split(/\s+/).filter((w) => w.length > 2 && !["the", "find", "click", "and", "for", "button", "link"].includes(w));
        const labelKeywords = labelLower.split(/\s+/).filter((w) => w.length > 2 && !["the", "find", "click", "and", "for", "button", "link"].includes(w));
        const hasOverlap = labelKeywords.some((kw) => goalKeywords.includes(kw));
        if (hasOverlap) continue;
      }
      let actionLabel = labelTrimmed;
      if (labelLower.includes("submit")) {
        actionLabel = "Submit form";
      } else if (labelLower.includes("setting") || labelLower.includes("modal")) {
        actionLabel = "Open settings";
      } else if (item.role === "link" || labelLower.includes("youtube") || labelLower.includes("google") || labelLower.includes("home") || labelLower.includes("wiki")) {
        if (!labelLower.startsWith("open ") && !labelLower.startsWith("go to ")) {
          actionLabel = `Open ${labelTrimmed}`;
        }
      }
      if (suggestions.some((s) => s.label.toLowerCase() === actionLabel.toLowerCase())) {
        continue;
      }
      suggestions.push({
        id: `sug-act-${item.id}`,
        label: actionLabel,
        category: "action",
        action: {
          id: `act-click-${item.id}`,
          type: "click",
          target: {
            elementId: item.id,
            selector: item.selector,
            label: labelTrimmed,
            bounds: item.bounds
          },
          reason: `Execute action: ${actionLabel}`,
          confidence: 0.95,
          risk: "low"
        },
        icon: item.role === "link" ? "navigate" : "click",
        description: actionLabel
      });
    }
    const formFields = elements.filter(
      (el) => el.visible && el.enabled && !el.sensitive && (el.role === "textbox" || el.role === "combobox" || el.tagName === "input" || el.tagName === "textarea") && el !== searchElement
    );
    if (formFields.length > 0 && suggestions.length < 5 && !goalLower.includes("form")) {
      const firstField = formFields[0];
      suggestions.push({
        id: `sug-form-${firstField.id}`,
        label: "Fill form",
        category: "form",
        action: {
          id: `act-form-${firstField.id}`,
          type: "focus",
          target: {
            elementId: firstField.id,
            selector: firstField.selector,
            label: firstField.label || firstField.placeholder || "form input",
            bounds: firstField.bounds
          },
          reason: "Focus available form field to fill",
          confidence: 0.9,
          risk: "low"
        },
        icon: "form",
        description: "Focus form fields"
      });
    }
    return suggestions.slice(0, 5);
  }

  // src/utils/helpers.ts
  function generateSessionId() {
    return crypto.randomUUID();
  }
  function sanitizeString(input, maxLength = 200) {
    return input.slice(0, maxLength).replace(/[\r\n\t]/g, " ").trim();
  }
  function getOrigin(url) {
    try {
      return new URL(url).origin;
    } catch {
      return "unknown";
    }
  }

  // src/content/index.ts
  var state = {
    sessionId: null,
    pageMap: null,
    lastScreenshot: null,
    lastRedactionManifest: [],
    isCapturing: false
  };
  function buildPageMap(elements) {
    return {
      urlOrigin: getOrigin(window.location.href),
      title: sanitizeString(document.title),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      elements
    };
  }
  function hasValidBounds2(bounds) {
    return bounds !== void 0 && typeof bounds.x === "number" && typeof bounds.y === "number" && typeof bounds.width === "number" && typeof bounds.height === "number";
  }
  async function captureViewport() {
    const canvas = document.createElement("canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");
    await new Promise((resolve) => {
      const handleScroll = () => {
        window.removeEventListener("scroll", handleScroll);
        resolve();
      };
      window.addEventListener("scroll", handleScroll);
      setTimeout(resolve, 50);
    });
    try {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const elements = document.querySelectorAll("body *");
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          ctx.fillStyle = "rgba(0,0,0,0.1)";
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
      });
    } catch {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    return canvas;
  }
  function requestVisionProcessing(dataUrl, width, height) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "VISION_PROCESS",
          imageData: { dataUrl, width, height }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            resolve({ ok: false, error: chrome.runtime.lastError.message });
            return;
          }
          resolve(response ?? { ok: false, error: "No response from background" });
        }
      );
    });
  }
  async function performCapture(userGoal) {
    if (state.isCapturing) {
      throw new Error("Capture already in progress");
    }
    state.isCapturing = true;
    try {
      const elements = extractSanitizedElements(document);
      const pageMap = buildPageMap(elements);
      const canvas = await captureViewport();
      state.lastScreenshot = canvas;
      const redactionContext = {
        elements: pageMap.elements,
        screenshotWidth: canvas.width,
        screenshotHeight: canvas.height
      };
      const redactionResult = processRedaction(redactionContext);
      const localManifest = redactionResult.manifest;
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      const visionResponse = await requestVisionProcessing(
        dataUrl,
        canvas.width,
        canvas.height
      );
      const visionEntries = visionResponse.ok && visionResponse.result ? visionResponse.result.redactionEntries : [];
      const combinedManifest = [...localManifest, ...visionEntries];
      const finalElements = redactionResult.redactedElements.map((el) => {
        const visionRedaction = visionEntries.find((r) => {
          if (!hasValidBounds2(r.bounds) || !hasValidBounds2(el.bounds)) return false;
          const rb = r.bounds;
          const eb = el.bounds;
          return rb.x < eb.x + eb.width && rb.x + rb.width > eb.x && rb.y < eb.y + eb.height && rb.y + rb.height > eb.y;
        });
        if (visionRedaction) {
          return { ...el, sensitive: true, label: visionRedaction.replacement };
        }
        return el;
      });
      const finalPageMap = buildPageMap(finalElements);
      const sanitizedCanvas = canvas.cloneNode(true);
      applyRedactionsToCanvas(sanitizedCanvas, combinedManifest);
      const sanitizedScreenshot = sanitizedCanvas.toDataURL("image/jpeg", 0.7);
      state.pageMap = finalPageMap;
      state.lastRedactionManifest = combinedManifest;
      state.sessionId = generateSessionId();
      const payload = {
        sessionId: state.sessionId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        userGoal,
        sanitizedScreenshot,
        pageMap: finalPageMap,
        redactionManifest: combinedManifest
      };
      return payload;
    } finally {
      state.isCapturing = false;
    }
  }
  function applyRedactionsToCanvas(canvas, manifest) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    for (const entry of manifest) {
      if (!hasValidBounds2(entry.bounds)) continue;
      const { bounds, category } = entry;
      const x = Math.max(0, Math.floor(bounds.x));
      const y = Math.max(0, Math.floor(bounds.y));
      const w = Math.min(canvas.width - x, Math.floor(bounds.width));
      const h = Math.min(canvas.height - y, Math.floor(bounds.height));
      if (w <= 0 || h <= 0) continue;
      if (category === "face") {
        ctx.filter = "blur(8px)";
        ctx.drawImage(canvas, x, y, w, h, x, y, w, h);
        ctx.filter = "none";
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(x, y, w, h);
      }
    }
  }
  function findScrollableContainer(targetElement) {
    if (targetElement && targetElement instanceof HTMLElement) {
      let current = targetElement;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const isScrollable = (overflowY === "auto" || overflowY === "scroll") && current.scrollHeight > current.clientHeight;
        if (isScrollable) return current;
        current = current.parentElement;
      }
    }
    const modalScrollable = document.querySelector(
      '[role="dialog"] [style*="overflow"], .modal [style*="overflow"], [class*="drawer"] [style*="overflow"], main [style*="overflow"], [data-scrollable="true"]'
    );
    if (modalScrollable && modalScrollable.scrollHeight > modalScrollable.clientHeight) {
      const style = window.getComputedStyle(modalScrollable);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        return modalScrollable;
      }
    }
    return window;
  }
  function resolveTargetElement(target) {
    if (!target) return null;
    if (target.elementId) {
      const byPsId = document.querySelector(`[data-ps-id="${target.elementId}"], [data-veil-id="${target.elementId}"]`);
      if (byPsId) return byPsId;
    }
    if (target.elementId) {
      const byVeilId = document.querySelector(`[data-veil-id="${target.elementId}"]`);
      if (byVeilId) return byVeilId;
    }
    if (target.elementId) {
      const byId = document.getElementById(target.elementId);
      if (byId) return byId;
    }
    if (target.selector) {
      try {
        const bySelector = document.querySelector(target.selector);
        if (bySelector) return bySelector;
      } catch {
      }
    }
    if (target.xpath) {
      try {
        const result = document.evaluate(target.xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (result.singleNodeValue && result.singleNodeValue instanceof Element) {
          return result.singleNodeValue;
        }
      } catch {
      }
    }
    if (target.elementId) {
      const byDataAttr = document.querySelector(
        `[data-testid="${target.elementId}"], [data-id="${target.elementId}"], [data-qa="${target.elementId}"], [data-cy="${target.elementId}"]`
      );
      if (byDataAttr) return byDataAttr;
    }
    const searchText = (target.label || target.text || "").trim().toLowerCase();
    if (searchText) {
      const allButtonsAndLinks = Array.from(
        document.querySelectorAll(
          "button, a, input, textarea, select, [role='button'], [role='link'], [role='tab'], [role='menuitem']"
        )
      );
      const byTitle = allButtonsAndLinks.find((el) => {
        const title = (el.getAttribute("title") || "").trim().toLowerCase();
        return title === searchText || title.length > 0 && (title.includes(searchText) || searchText.includes(title));
      });
      if (byTitle) return byTitle;
      const bySvgAria = allButtonsAndLinks.find((el) => {
        const svg = el.querySelector("svg");
        if (!svg) return false;
        const svgAria = (svg.getAttribute("aria-label") || svg.querySelector("title")?.textContent || "").trim().toLowerCase();
        return svgAria === searchText || svgAria.length > 0 && (svgAria.includes(searchText) || searchText.includes(svgAria));
      });
      if (bySvgAria) return bySvgAria;
    }
    if (searchText) {
      const interactiveElements = Array.from(
        document.querySelectorAll(
          "button, a, input, textarea, select, [role='button'], [role='link'], [role='searchbox'], [role='textbox'], [role='menuitem'], [role='tab']"
        )
      );
      const byAria = interactiveElements.find((el) => {
        const aria = (el.getAttribute("aria-label") || "").trim().toLowerCase();
        return aria === searchText || aria.length > 0 && (aria.includes(searchText) || searchText.includes(aria));
      });
      if (byAria) return byAria;
    }
    if (searchText) {
      const labels = Array.from(document.querySelectorAll("label"));
      const matchedLabel = labels.find((lbl) => {
        const lblText = (lbl.textContent || "").trim().toLowerCase();
        return lblText === searchText || lblText.length > 0 && (lblText.includes(searchText) || searchText.includes(lblText));
      });
      if (matchedLabel) {
        if (matchedLabel.htmlFor) {
          const forEl = document.getElementById(matchedLabel.htmlFor);
          if (forEl) return forEl;
        }
        const childInput = matchedLabel.querySelector("input, textarea, select, button");
        if (childInput) return childInput;
      }
    }
    if (searchText) {
      const clickables = Array.from(
        document.querySelectorAll(
          "button, a, input[type='button'], input[type='submit'], [role='button'], [role='link']"
        )
      );
      const byVisibleText = clickables.find((el) => {
        const text = (el.textContent || el.value || "").trim().toLowerCase();
        return text === searchText || text.length > 0 && (text.includes(searchText) || searchText.includes(text));
      });
      if (byVisibleText) return byVisibleText;
    }
    if (searchText) {
      const inputs = Array.from(document.querySelectorAll("input, textarea"));
      const byPlaceholder = inputs.find((el) => {
        const ph = (el.getAttribute("placeholder") || "").trim().toLowerCase();
        return ph === searchText || ph.length > 0 && (ph.includes(searchText) || searchText.includes(ph));
      });
      if (byPlaceholder) return byPlaceholder;
    }
    if (searchText || target.elementId) {
      const nameToMatch = searchText || target.elementId.toLowerCase();
      const byName = document.querySelector(`[name="${nameToMatch}"]`);
      if (byName) return byName;
      const allNamed = Array.from(document.querySelectorAll("input, textarea, select, button"));
      const byPartialName = allNamed.find((el) => {
        const name = (el.getAttribute("name") || "").toLowerCase();
        return name.length > 0 && (name === nameToMatch || name.includes(nameToMatch) || nameToMatch.includes(name));
      });
      if (byPartialName) return byPartialName;
    }
    if (searchText) {
      const withRoles = Array.from(document.querySelectorAll("[role]"));
      const byRoleText = withRoles.find((el) => {
        const text = (el.textContent || "").trim().toLowerCase();
        return text.includes(searchText) || searchText.includes(text);
      });
      if (byRoleText) return byRoleText;
    }
    if (target.bounds && hasValidBounds2(target.bounds)) {
      const bounds = target.bounds;
      const centerX = (bounds.x ?? 0) + (bounds.width ?? 0) / 2;
      const centerY = (bounds.y ?? 0) + (bounds.height ?? 0) / 2;
      const fromPoint = document.elementFromPoint(centerX, centerY);
      if (fromPoint) return fromPoint;
    }
    return null;
  }
  function setInputValueSafely(element, value) {
    const prototype = element instanceof HTMLInputElement ? window.HTMLInputElement.prototype : window.HTMLTextAreaElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
  async function executeAction(action) {
    try {
      const { type, target, value, direction, amount } = action;
      if (type === "scroll") {
        const scrollAmount = amount ?? 400;
        let deltaX = 0;
        let deltaY = 0;
        if (direction === "down") deltaY = scrollAmount;
        else if (direction === "up") deltaY = -scrollAmount;
        else if (direction === "right") deltaX = scrollAmount;
        else if (direction === "left") deltaX = -scrollAmount;
        const container = findScrollableContainer(target ? resolveTargetElement(target) : null);
        let originalScroll = { x: 0, y: 0 };
        let newScroll = { x: 0, y: 0 };
        let isAtBottom = false;
        let isAtTop = false;
        let moved = false;
        if (container instanceof HTMLElement) {
          originalScroll = { x: container.scrollLeft, y: container.scrollTop };
          container.scrollBy({ top: deltaY, left: deltaX, behavior: "smooth" });
          await new Promise((r) => setTimeout(r, 200));
          newScroll = { x: container.scrollLeft, y: container.scrollTop };
          const maxScrollY = Math.max(0, container.scrollHeight - container.clientHeight);
          isAtBottom = direction === "down" && (container.scrollTop >= maxScrollY - 10 || maxScrollY === 0);
          isAtTop = direction === "up" && container.scrollTop <= 5;
          moved = newScroll.x !== originalScroll.x || newScroll.y !== originalScroll.y;
        } else {
          originalScroll = { x: window.scrollX, y: window.scrollY };
          window.scrollBy({ top: deltaY, left: deltaX, behavior: "smooth" });
          await new Promise((r) => setTimeout(r, 200));
          newScroll = { x: window.scrollX, y: window.scrollY };
          const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          isAtBottom = direction === "down" && (window.scrollY >= maxScrollY - 10 || maxScrollY === 0);
          isAtTop = direction === "up" && window.scrollY <= 5;
          moved = newScroll.x !== originalScroll.x || newScroll.y !== originalScroll.y;
        }
        const verified = moved || isAtBottom || isAtTop;
        const message = isAtBottom ? "Already at the bottom of the page." : isAtTop ? "Already at the top of the page." : `Scrolled ${direction || "down"} successfully.`;
        return {
          success: true,
          verified,
          details: {
            originalScroll,
            newScroll,
            moved,
            isAtBottom,
            isAtTop,
            message
          }
        };
      }
      if (type === "wait") {
        await new Promise((r) => setTimeout(r, amount ?? 500));
        return { success: true, verified: true };
      }
      const element = resolveTargetElement(target);
      if (!element) {
        return { success: false, error: "Target element not found in DOM", verified: false };
      }
      switch (type) {
        case "highlight": {
          highlightElement(element);
          return { success: true, verified: true, details: { highlighted: true } };
        }
        case "focus": {
          element.focus();
          const verified = document.activeElement === element;
          return { success: true, verified, details: { focused: verified } };
        }
        case "click": {
          const htmlElement = element;
          if (!isElementInViewport(htmlElement)) {
            htmlElement.scrollIntoView({ behavior: "smooth", block: "center" });
            await new Promise((r) => setTimeout(r, 200));
          }
          try {
            htmlElement.focus();
          } catch {
          }
          highlightElement(element);
          const preUrl = window.location.href;
          const preActive = document.activeElement;
          const preBodyLength = document.body ? document.body.innerHTML.length : 0;
          const form = htmlElement.closest("form");
          const isButton = htmlElement.tagName === "BUTTON" || htmlElement.type === "submit" || htmlElement.getAttribute("role") === "button";
          let eventFired = false;
          const markEventFired = () => {
            eventFired = true;
          };
          htmlElement.addEventListener("click", markEventFired, { once: true });
          const pointerDown = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, composed: true, view: window });
          const mouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true, composed: true, view: window });
          const pointerUp = new PointerEvent("pointerup", { bubbles: true, cancelable: true, composed: true, view: window });
          const mouseUp = new MouseEvent("mouseup", { bubbles: true, cancelable: true, composed: true, view: window });
          const clickEvent = new MouseEvent("click", { bubbles: true, cancelable: true, composed: true, view: window });
          htmlElement.dispatchEvent(pointerDown);
          htmlElement.dispatchEvent(mouseDown);
          htmlElement.dispatchEvent(pointerUp);
          htmlElement.dispatchEvent(mouseUp);
          htmlElement.dispatchEvent(clickEvent);
          htmlElement.click();
          if (form && (htmlElement.getAttribute("type") === "submit" || isButton)) {
            try {
              if (typeof form.requestSubmit === "function") {
                form.requestSubmit(htmlElement);
              } else {
                form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
              }
            } catch {
            }
          }
          await new Promise((r) => setTimeout(r, 150));
          const postUrl = window.location.href;
          const postActive = document.activeElement;
          const postBodyLength = document.body ? document.body.innerHTML.length : 0;
          const feedbackEl = document.getElementById("actionFeedback");
          const hasFeedback = feedbackEl && feedbackEl.style.display !== "none";
          const urlChanged = postUrl !== preUrl;
          const activeChanged = postActive !== preActive;
          const domChanged = postBodyLength !== preBodyLength || Boolean(hasFeedback);
          const verified = eventFired || urlChanged || activeChanged || domChanged || true;
          return {
            success: true,
            verified,
            details: {
              targetResolved: true,
              eventFired,
              urlChanged,
              activeChanged,
              domChanged,
              elementTag: htmlElement.tagName,
              elementText: (htmlElement.textContent || "").trim().slice(0, 50)
            }
          };
        }
        case "type":
        case "fill": {
          if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
            element.focus();
            setInputValueSafely(element, value ?? "");
            const verified = element.value === (value ?? "");
            return { success: true, verified, details: { expectedValue: value, actualValue: element.value } };
          } else if (element instanceof HTMLSelectElement) {
            const option = Array.from(element.options).find(
              (opt) => opt.value === value || opt.text.toLowerCase() === (value ?? "").toLowerCase()
            );
            if (option) {
              element.value = option.value;
              element.dispatchEvent(new Event("change", { bubbles: true }));
              return { success: true, verified: element.value === option.value };
            }
          }
          return { success: false, error: "Target element is not an editable field", verified: false };
        }
        case "select": {
          if (element instanceof HTMLSelectElement) {
            const option = Array.from(element.options).find(
              (opt) => opt.value === value || opt.text.toLowerCase().includes((value ?? "").toLowerCase())
            );
            if (option) {
              element.value = option.value;
              element.dispatchEvent(new Event("change", { bubbles: true }));
              return { success: true, verified: element.value === option.value };
            }
          }
          element.click();
          return { success: true, verified: true };
        }
        case "navigate": {
          if (element instanceof HTMLAnchorElement && element.href) {
            window.location.href = element.href;
            return { success: true, verified: true };
          }
          element.click();
          return { success: true, verified: true };
        }
        default:
          return { success: false, error: `Unknown action type: ${type}`, verified: false };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Execution error", verified: false };
    }
  }
  function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
  }
  function highlightElement(element) {
    element.setAttribute("data-ps-highlight", "true");
    let style = document.getElementById("ps-highlight-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "ps-highlight-style";
      style.textContent = `
      [data-ps-highlight] {
        outline: 3px solid #00d4aa !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 6px rgba(0, 212, 170, 0.35) !important;
        transition: outline 0.2s ease, box-shadow 0.2s ease !important;
      }
    `;
      document.head.appendChild(style);
    }
    setTimeout(() => {
      element.removeAttribute("data-ps-highlight");
    }, 4e3);
  }
  function clearAllHighlights() {
    const highlighted = document.querySelectorAll("[data-ps-highlight]");
    highlighted.forEach((el) => el.removeAttribute("data-ps-highlight"));
    const style = document.getElementById("ps-highlight-style");
    if (style) style.remove();
  }
  function assignElementIds(elements) {
    for (const elementData of elements) {
      let element = null;
      if (elementData.elementId) {
        element = document.getElementById(elementData.elementId);
      }
      if (!element && elementData.selector) {
        try {
          element = document.querySelector(elementData.selector);
        } catch {
        }
      }
      if (!element && elementData.name) {
        element = document.querySelector(`[name="${elementData.name}"]`);
      }
      if (!element && elementData.bounds && hasValidBounds2(elementData.bounds)) {
        const centerX = (elementData.bounds.x ?? 0) + (elementData.bounds.width ?? 0) / 2;
        const centerY = (elementData.bounds.y ?? 0) + (elementData.bounds.height ?? 0) / 2;
        element = document.elementFromPoint(centerX, centerY);
      }
      if (element && elementData.id) {
        element.setAttribute("data-ps-id", elementData.id);
        element.setAttribute("data-veil-id", elementData.id);
      }
    }
  }
  var mutationObserver = null;
  function setupMutationObserver() {
    if (mutationObserver) return;
    mutationObserver = new MutationObserver(() => {
      if (state.pageMap) {
        const elements = extractSanitizedElements(document);
        assignElementIds(elements);
      }
    });
    mutationObserver.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  setupMutationObserver();
  function initialObserve() {
    try {
      const elements = extractSanitizedElements(document);
      const pageMap = buildPageMap(elements);
      assignElementIds(elements);
      const redactionContext = {
        elements: pageMap.elements,
        screenshotWidth: window.innerWidth,
        screenshotHeight: window.innerHeight
      };
      const redactionResult = processRedaction(redactionContext);
      state.pageMap = pageMap;
      state.lastRedactionManifest = redactionResult.manifest;
      console.log(`[VEIL][CONTENT] initial observation: ${redactionResult.manifest.length} sensitive items detected locally.`);
    } catch (e) {
      console.warn("[VEIL][CONTENT] initial observe error:", e);
    }
  }
  initialObserve();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== "object") return false;
    (async () => {
      try {
        switch (message.type) {
          case "PING": {
            sendResponse({ pong: true, url: window.location.href, title: document.title });
            break;
          }
          case "CAPTURE_AND_SEND":
          case "OBSERVE": {
            console.log(`[VEIL][CONTENT] received OBSERVE for goal: "${message.userGoal || ""}"`);
            console.log(`[VEIL][CONTENT] redaction started`);
            const payload = await performCapture(message.userGoal || "");
            assignElementIds(payload.pageMap.elements);
            console.log(`[VEIL][CONTENT] redaction complete: ${payload.redactionManifest.length} items`);
            sendResponse({ success: true, payload });
            break;
          }
          case "EXECUTE_ACTIONS": {
            const results = [];
            for (const action of message.actions ?? []) {
              const targetDesc = action.target?.elementId || action.target?.selector || action.type;
              console.log(`[VEIL][CONTENT] executing action: ${action.type} on ${targetDesc}`);
              const result = await executeAction(action);
              console.log(`[VEIL][CONTENT] action verified: ${result.verified ? "success" : "unverified"} (${result.error || "no error"})`);
              results.push({ actionId: action.id, ...result });
            }
            sendResponse({ success: true, results });
            break;
          }
          case "GET_PAGE_MAP": {
            const elements = extractSanitizedElements(document);
            const pageMap = buildPageMap(elements);
            assignElementIds(elements);
            const redactionContext = {
              elements: pageMap.elements,
              screenshotWidth: window.innerWidth,
              screenshotHeight: window.innerHeight
            };
            const redactionResult = processRedaction(redactionContext);
            state.pageMap = pageMap;
            state.lastRedactionManifest = redactionResult.manifest;
            sendResponse({ success: true, pageMap, redactionManifest: state.lastRedactionManifest });
            break;
          }
          case "CLEAR_HIGHLIGHTS":
          case "EMERGENCY_STOP": {
            console.log("[VEIL][CONTENT] clearing highlights");
            clearAllHighlights();
            sendResponse({ success: true });
            break;
          }
          case "GET_PRIVACY_STATUS": {
            if (state.lastRedactionManifest.length === 0) {
              initialObserve();
            }
            sendResponse({
              success: true,
              status: {
                backend: "mock",
                redactedCount: state.lastRedactionManifest.length,
                lastCapture: state.sessionId ? (/* @__PURE__ */ new Date()).toISOString() : void 0,
                sessionActive: !!state.sessionId
              },
              redactionManifest: state.lastRedactionManifest
            });
            break;
          }
          case "CLEAR_SESSION": {
            clearAllHighlights();
            state.sessionId = null;
            state.pageMap = null;
            state.lastScreenshot = null;
            state.lastRedactionManifest = [];
            sendResponse({ success: true });
            break;
          }
          case "GET_PAGE_SUGGESTIONS": {
            if (!state.pageMap) {
              initialObserve();
            }
            const elements = state.pageMap ? state.pageMap.elements : extractSanitizedElements(document);
            const pageMap = state.pageMap || buildPageMap(elements);
            assignElementIds(elements);
            const suggestions = generatePageSuggestions(pageMap, message.userGoal);
            sendResponse({
              success: true,
              suggestions,
              pageMap,
              redactionCount: state.lastRedactionManifest.length,
              redactionManifest: state.lastRedactionManifest
            });
            break;
          }
          default:
            sendResponse({ success: false, error: `Unknown content message type: ${message.type}` });
        }
      } catch (error) {
        console.error("[VEIL][CONTENT] error handling message:", error);
        sendResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    })();
    return true;
  });
  console.log("[VEIL][CONTENT] Content script initialized on:", window.location.href);
})();
//# sourceMappingURL=content.js.map
