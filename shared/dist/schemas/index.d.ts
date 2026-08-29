import { z } from "zod";
export type GoalMode = "information" | "informational" | "find" | "highlight" | "fill" | "click" | "select" | "type" | "search" | "scroll" | "navigate" | "navigation_task" | "submit" | "delete" | "ambiguous" | "unsupported" | "browser_action" | "form_task";
export type ActionRiskLevel = "low" | "medium" | "high";
export interface GoalIntent {
    action?: string;
    target?: string;
    value?: string;
    risk?: ActionRiskLevel;
    requiresConfirmation?: boolean;
}
export interface GoalClassification {
    mode: GoalMode;
    confidence: number;
    interpretation: string;
    extractedIntent?: GoalIntent;
    requiresClarification: boolean;
    clarificationQuestion?: string;
    riskLevel?: ActionRiskLevel;
    requiresConfirmation?: boolean;
}
export declare const BoundsSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}, {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
}>;
export type Bounds = z.infer<typeof BoundsSchema>;
export declare const ElementRoleSchema: z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>;
export type ElementRole = z.infer<typeof ElementRoleSchema>;
export declare const SanitizedElementSchema: z.ZodObject<{
    id: z.ZodString;
    role: z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>;
    label: z.ZodString;
    bounds: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>;
    visible: z.ZodBoolean;
    enabled: z.ZodBoolean;
    sensitive: z.ZodBoolean;
    placeholder: z.ZodOptional<z.ZodString>;
    valueState: z.ZodOptional<z.ZodEnum<["empty", "filled", "unknown"]>>;
    href: z.ZodOptional<z.ZodString>;
    tagName: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    selector: z.ZodOptional<z.ZodString>;
    xpath: z.ZodOptional<z.ZodString>;
    ariaLabel: z.ZodOptional<z.ZodString>;
    ariaLabelledBy: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    elementId: z.ZodOptional<z.ZodString>;
    formId: z.ZodOptional<z.ZodString>;
    autocomplete: z.ZodOptional<z.ZodString>;
    inputType: z.ZodOptional<z.ZodString>;
    required: z.ZodOptional<z.ZodBoolean>;
    readOnly: z.ZodOptional<z.ZodBoolean>;
    textContent: z.ZodOptional<z.ZodString>;
    value: z.ZodOptional<z.ZodString>;
    domConfidence: z.ZodOptional<z.ZodNumber>;
    visionConfidence: z.ZodOptional<z.ZodNumber>;
    combinedConfidence: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    type?: string;
    value?: string;
    id?: string;
    role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
    label?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    visible?: boolean;
    enabled?: boolean;
    sensitive?: boolean;
    placeholder?: string;
    valueState?: "empty" | "filled" | "unknown";
    href?: string;
    tagName?: string;
    selector?: string;
    xpath?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    name?: string;
    elementId?: string;
    formId?: string;
    autocomplete?: string;
    inputType?: string;
    required?: boolean;
    readOnly?: boolean;
    textContent?: string;
    domConfidence?: number;
    visionConfidence?: number;
    combinedConfidence?: number;
}, {
    type?: string;
    value?: string;
    id?: string;
    role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
    label?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    visible?: boolean;
    enabled?: boolean;
    sensitive?: boolean;
    placeholder?: string;
    valueState?: "empty" | "filled" | "unknown";
    href?: string;
    tagName?: string;
    selector?: string;
    xpath?: string;
    ariaLabel?: string;
    ariaLabelledBy?: string;
    name?: string;
    elementId?: string;
    formId?: string;
    autocomplete?: string;
    inputType?: string;
    required?: boolean;
    readOnly?: boolean;
    textContent?: string;
    domConfidence?: number;
    visionConfidence?: number;
    combinedConfidence?: number;
}>;
export type SanitizedElement = z.infer<typeof SanitizedElementSchema>;
export declare const PageMapSchema: z.ZodObject<{
    urlOrigin: z.ZodString;
    title: z.ZodString;
    viewport: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        width?: number;
        height?: number;
    }, {
        width?: number;
        height?: number;
    }>;
    elements: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>;
        label: z.ZodString;
        bounds: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }>;
        visible: z.ZodBoolean;
        enabled: z.ZodBoolean;
        sensitive: z.ZodBoolean;
        placeholder: z.ZodOptional<z.ZodString>;
        valueState: z.ZodOptional<z.ZodEnum<["empty", "filled", "unknown"]>>;
        href: z.ZodOptional<z.ZodString>;
        tagName: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        xpath: z.ZodOptional<z.ZodString>;
        ariaLabel: z.ZodOptional<z.ZodString>;
        ariaLabelledBy: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        elementId: z.ZodOptional<z.ZodString>;
        formId: z.ZodOptional<z.ZodString>;
        autocomplete: z.ZodOptional<z.ZodString>;
        inputType: z.ZodOptional<z.ZodString>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        textContent: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodString>;
        domConfidence: z.ZodOptional<z.ZodNumber>;
        visionConfidence: z.ZodOptional<z.ZodNumber>;
        combinedConfidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }, {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }[];
}, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }[];
}>;
export type PageMap = z.infer<typeof PageMapSchema>;
export declare const RedactionCategorySchema: z.ZodEnum<["password", "otp", "credit_card", "cvv", "aadhaar", "pan", "email", "phone", "address", "account_number", "face", "explicit_sensitive", "custom"]>;
export type RedactionCategory = z.infer<typeof RedactionCategorySchema>;
export declare const RedactionEntrySchema: z.ZodObject<{
    category: z.ZodEnum<["password", "otp", "credit_card", "cvv", "aadhaar", "pan", "email", "phone", "address", "account_number", "face", "explicit_sensitive", "custom"]>;
    bounds: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>;
    confidence: z.ZodNumber;
    replacement: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
    confidence?: number;
    replacement?: string;
}, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
    confidence?: number;
    replacement?: string;
}>;
export type RedactionEntry = z.infer<typeof RedactionEntrySchema>;
export type RedactionRegion = RedactionEntry;
export declare const RedactionManifestSchema: z.ZodArray<z.ZodObject<{
    category: z.ZodEnum<["password", "otp", "credit_card", "cvv", "aadhaar", "pan", "email", "phone", "address", "account_number", "face", "explicit_sensitive", "custom"]>;
    bounds: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>;
    confidence: z.ZodNumber;
    replacement: z.ZodString;
}, "strip", z.ZodTypeAny, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
    confidence?: number;
    replacement?: string;
}, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
    confidence?: number;
    replacement?: string;
}>, "many">;
export type RedactionManifest = z.infer<typeof RedactionManifestSchema>;
export declare const ClientPayloadSchema: z.ZodObject<{
    sessionId: z.ZodString;
    timestamp: z.ZodString;
    userGoal: z.ZodString;
    sanitizedScreenshot: z.ZodOptional<z.ZodString>;
    pageMap: z.ZodObject<{
        urlOrigin: z.ZodString;
        title: z.ZodString;
        viewport: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            width?: number;
            height?: number;
        }, {
            width?: number;
            height?: number;
        }>;
        elements: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            role: z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>;
            label: z.ZodString;
            bounds: z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }>;
            visible: z.ZodBoolean;
            enabled: z.ZodBoolean;
            sensitive: z.ZodBoolean;
            placeholder: z.ZodOptional<z.ZodString>;
            valueState: z.ZodOptional<z.ZodEnum<["empty", "filled", "unknown"]>>;
            href: z.ZodOptional<z.ZodString>;
            tagName: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
            selector: z.ZodOptional<z.ZodString>;
            xpath: z.ZodOptional<z.ZodString>;
            ariaLabel: z.ZodOptional<z.ZodString>;
            ariaLabelledBy: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            elementId: z.ZodOptional<z.ZodString>;
            formId: z.ZodOptional<z.ZodString>;
            autocomplete: z.ZodOptional<z.ZodString>;
            inputType: z.ZodOptional<z.ZodString>;
            required: z.ZodOptional<z.ZodBoolean>;
            readOnly: z.ZodOptional<z.ZodBoolean>;
            textContent: z.ZodOptional<z.ZodString>;
            value: z.ZodOptional<z.ZodString>;
            domConfidence: z.ZodOptional<z.ZodNumber>;
            visionConfidence: z.ZodOptional<z.ZodNumber>;
            combinedConfidence: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }, {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }[];
    }, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }[];
    }>;
    redactionManifest: z.ZodArray<z.ZodObject<{
        category: z.ZodEnum<["password", "otp", "credit_card", "cvv", "aadhaar", "pan", "email", "phone", "address", "account_number", "face", "explicit_sensitive", "custom"]>;
        bounds: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }>;
        confidence: z.ZodNumber;
        replacement: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
        confidence?: number;
        replacement?: string;
    }, {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
        confidence?: number;
        replacement?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sessionId?: string;
    timestamp?: string;
    userGoal?: string;
    sanitizedScreenshot?: string;
    pageMap?: {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }[];
    };
    redactionManifest?: {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
        confidence?: number;
        replacement?: string;
    }[];
}, {
    sessionId?: string;
    timestamp?: string;
    userGoal?: string;
    sanitizedScreenshot?: string;
    pageMap?: {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            type?: string;
            value?: string;
            id?: string;
            role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            visible?: boolean;
            enabled?: boolean;
            sensitive?: boolean;
            placeholder?: string;
            valueState?: "empty" | "filled" | "unknown";
            href?: string;
            tagName?: string;
            selector?: string;
            xpath?: string;
            ariaLabel?: string;
            ariaLabelledBy?: string;
            name?: string;
            elementId?: string;
            formId?: string;
            autocomplete?: string;
            inputType?: string;
            required?: boolean;
            readOnly?: boolean;
            textContent?: string;
            domConfidence?: number;
            visionConfidence?: number;
            combinedConfidence?: number;
        }[];
    };
    redactionManifest?: {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        category?: "custom" | "password" | "otp" | "credit_card" | "cvv" | "aadhaar" | "pan" | "email" | "phone" | "address" | "account_number" | "face" | "explicit_sensitive";
        confidence?: number;
        replacement?: string;
    }[];
}>;
export type ClientPayload = z.infer<typeof ClientPayloadSchema>;
export declare const ActionTypeSchema: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "select", "navigate"]>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export declare const ScrollDirectionSchema: z.ZodEnum<["up", "down", "left", "right"]>;
export type ScrollDirection = z.infer<typeof ScrollDirectionSchema>;
export declare const ActionTargetSchema: z.ZodObject<{
    elementId: z.ZodOptional<z.ZodString>;
    bounds: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }, {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    }>>;
    selector: z.ZodOptional<z.ZodString>;
    text: z.ZodOptional<z.ZodString>;
    label: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    label?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    selector?: string;
    elementId?: string;
    text?: string;
}, {
    label?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    selector?: string;
    elementId?: string;
    text?: string;
}>;
export type ActionTarget = z.infer<typeof ActionTargetSchema>;
export declare const ServerActionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "select", "navigate"]>;
    target: z.ZodOptional<z.ZodObject<{
        elementId: z.ZodOptional<z.ZodString>;
        bounds: z.ZodOptional<z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }>>;
        selector: z.ZodOptional<z.ZodString>;
        text: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        selector?: string;
        elementId?: string;
        text?: string;
    }, {
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        selector?: string;
        elementId?: string;
        text?: string;
    }>>;
    value: z.ZodOptional<z.ZodString>;
    direction: z.ZodOptional<z.ZodEnum<["up", "down", "left", "right"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
    confidence: z.ZodNumber;
    risk: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
}, "strip", z.ZodTypeAny, {
    type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
    value?: string;
    id?: string;
    confidence?: number;
    target?: {
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        selector?: string;
        elementId?: string;
        text?: string;
    };
    direction?: "up" | "down" | "left" | "right";
    amount?: number;
    reason?: string;
    risk?: "low" | "medium" | "high";
}, {
    type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
    value?: string;
    id?: string;
    confidence?: number;
    target?: {
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        selector?: string;
        elementId?: string;
        text?: string;
    };
    direction?: "up" | "down" | "left" | "right";
    amount?: number;
    reason?: string;
    risk?: "low" | "medium" | "high";
}>;
export type ServerAction = z.infer<typeof ServerActionSchema>;
export declare const ServerPlanSchema: z.ZodObject<{
    summary: z.ZodString;
    confidence: z.ZodNumber;
    requiresUserConfirmation: z.ZodBoolean;
    actions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "select", "navigate"]>;
        target: z.ZodOptional<z.ZodObject<{
            elementId: z.ZodOptional<z.ZodString>;
            bounds: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }>>;
            selector: z.ZodOptional<z.ZodString>;
            text: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        }, {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down", "left", "right"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
        risk: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }, {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }>, "many">;
    mode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }[];
    mode?: string;
}, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }[];
    mode?: string;
}>;
export type ServerPlan = z.infer<typeof ServerPlanSchema>;
export declare const InferenceBackendSchema: z.ZodEnum<["webgpu", "wasm", "mock"]>;
export type InferenceBackend = z.infer<typeof InferenceBackendSchema>;
export declare const PrivacyStatusSchema: z.ZodObject<{
    backend: z.ZodEnum<["webgpu", "wasm", "mock"]>;
    redactedCount: z.ZodNumber;
    lastCapture: z.ZodOptional<z.ZodString>;
    sessionActive: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    backend?: "webgpu" | "wasm" | "mock";
    redactedCount?: number;
    lastCapture?: string;
    sessionActive?: boolean;
}, {
    backend?: "webgpu" | "wasm" | "mock";
    redactedCount?: number;
    lastCapture?: string;
    sessionActive?: boolean;
}>;
export type PrivacyStatus = z.infer<typeof PrivacyStatusSchema>;
export declare const TelemetryEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    metric: z.ZodEnum<["model_inference_ms", "screenshot_capture_ms", "dom_extraction_ms", "redaction_ms", "payload_size_before_bytes", "payload_size_after_bytes", "server_roundtrip_ms", "total_latency_ms", "sensitive_regions_detected", "actions_blocked", "inference_backend", "vision_latency_ms", "execution_latency_ms"]>;
    value: z.ZodNumber;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "inference_backend" | "vision_latency_ms" | "execution_latency_ms";
}, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "inference_backend" | "vision_latency_ms" | "execution_latency_ms";
}>;
export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;
export declare const ActionPolicySchema: z.ZodEnum<["auto", "confirm", "reject"]>;
export type ActionPolicy = z.infer<typeof ActionPolicySchema>;
export declare const ValidatedActionSchema: z.ZodObject<{
    action: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "select", "navigate"]>;
        target: z.ZodOptional<z.ZodObject<{
            elementId: z.ZodOptional<z.ZodString>;
            bounds: z.ZodOptional<z.ZodObject<{
                x: z.ZodNumber;
                y: z.ZodNumber;
                width: z.ZodNumber;
                height: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }, {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            }>>;
            selector: z.ZodOptional<z.ZodString>;
            text: z.ZodOptional<z.ZodString>;
            label: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        }, {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down", "left", "right"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
        risk: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
    }, "strip", z.ZodTypeAny, {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }, {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    }>;
    policy: z.ZodEnum<["auto", "confirm", "reject"]>;
    reason: z.ZodString;
    mappedElement: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        role: z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>;
        label: z.ZodString;
        bounds: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }, {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        }>;
        visible: z.ZodBoolean;
        enabled: z.ZodBoolean;
        sensitive: z.ZodBoolean;
        placeholder: z.ZodOptional<z.ZodString>;
        valueState: z.ZodOptional<z.ZodEnum<["empty", "filled", "unknown"]>>;
        href: z.ZodOptional<z.ZodString>;
        tagName: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
        selector: z.ZodOptional<z.ZodString>;
        xpath: z.ZodOptional<z.ZodString>;
        ariaLabel: z.ZodOptional<z.ZodString>;
        ariaLabelledBy: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        elementId: z.ZodOptional<z.ZodString>;
        formId: z.ZodOptional<z.ZodString>;
        autocomplete: z.ZodOptional<z.ZodString>;
        inputType: z.ZodOptional<z.ZodString>;
        required: z.ZodOptional<z.ZodBoolean>;
        readOnly: z.ZodOptional<z.ZodBoolean>;
        textContent: z.ZodOptional<z.ZodString>;
        value: z.ZodOptional<z.ZodString>;
        domConfidence: z.ZodOptional<z.ZodNumber>;
        visionConfidence: z.ZodOptional<z.ZodNumber>;
        combinedConfidence: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }, {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    action?: {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    };
    policy?: "auto" | "confirm" | "reject";
    mappedElement?: {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    };
}, {
    reason?: string;
    action?: {
        type?: "highlight" | "click" | "select" | "type" | "scroll" | "navigate" | "focus" | "wait";
        value?: string;
        id?: string;
        confidence?: number;
        target?: {
            label?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            selector?: string;
            elementId?: string;
            text?: string;
        };
        direction?: "up" | "down" | "left" | "right";
        amount?: number;
        reason?: string;
        risk?: "low" | "medium" | "high";
    };
    policy?: "auto" | "confirm" | "reject";
    mappedElement?: {
        type?: string;
        value?: string;
        id?: string;
        role?: "search" | "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "complementary";
        label?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        visible?: boolean;
        enabled?: boolean;
        sensitive?: boolean;
        placeholder?: string;
        valueState?: "empty" | "filled" | "unknown";
        href?: string;
        tagName?: string;
        selector?: string;
        xpath?: string;
        ariaLabel?: string;
        ariaLabelledBy?: string;
        name?: string;
        elementId?: string;
        formId?: string;
        autocomplete?: string;
        inputType?: string;
        required?: boolean;
        readOnly?: boolean;
        textContent?: string;
        domConfidence?: number;
        visionConfidence?: number;
        combinedConfidence?: number;
    };
}>;
export type ValidatedAction = z.infer<typeof ValidatedActionSchema>;
export interface ExecutionResult {
    success: boolean;
    error?: string;
    verified: boolean;
    details?: Record<string, any>;
    actionId?: string;
}
export interface VerificationResult {
    verified: boolean;
    reason?: string;
    details?: Record<string, any>;
}
export interface VisionDetection {
    bounds: Bounds;
    confidence: number;
    className: string;
    classId?: number;
    label?: string;
    type?: string;
}
export interface SanitizedPageContext {
    pageMap: PageMap;
    sanitizedScreenshot?: string;
    redactionManifest: RedactionManifest;
    visionDetections?: VisionDetection[];
}
export declare function validateClientPayload(data: unknown): ClientPayload;
export declare function validateServerPlan(data: unknown): ServerPlan;
export declare function validateTelemetryEntry(data: unknown): TelemetryEntry;
export declare const ALLOWED_SERVER_ORIGINS: readonly ["http://localhost:3001", "http://127.0.0.1:3001"];
export type AllowedServerOrigin = (typeof ALLOWED_SERVER_ORIGINS)[number];
export declare function isAllowedOrigin(origin: string): origin is AllowedServerOrigin;
export declare const MAX_PAYLOAD_SIZE = 500000;
export declare const MAX_SCREENSHOT_DIMENSION = 1920;
export declare const REQUEST_TIMEOUT_MS = 10000;
export declare const RATE_LIMIT_MAX_REQUESTS = 30;
export declare const RATE_LIMIT_WINDOW_MS = 60000;
export type AgentState = "idle" | "observing" | "interpreting" | "planning" | "validating" | "waiting_for_confirmation" | "needs_clarification" | "ready" | "executing" | "verifying" | "completed" | "blocked" | "failed" | "stopped";
export interface AgentStep {
    stepNumber: number;
    action: ServerAction;
    result: "success" | "failed" | "pending";
    error?: string;
    pageChanged: boolean;
    timestamp: string;
    verified?: boolean;
    details?: Record<string, any>;
}
export interface AgentExecutionContext {
    goal: string;
    classification: GoalClassification;
    plan: ServerPlan;
    currentStep: number;
    maxSteps: number;
    steps: AgentStep[];
    status: AgentState;
    lastObservation?: PageMap;
    sessionId: string;
    userGoal: string;
    isExecuting: boolean;
}
//# sourceMappingURL=index.d.ts.map