import { z } from "zod";
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
    dataVeilId: z.ZodOptional<z.ZodString>;
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
    originalTag: z.ZodOptional<z.ZodString>;
    relevanceScore: z.ZodOptional<z.ZodNumber>;
    isPrunedByMinimization: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    dataVeilId?: string;
    role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
    originalTag?: string;
    relevanceScore?: number;
    isPrunedByMinimization?: boolean;
}, {
    id?: string;
    dataVeilId?: string;
    role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
    originalTag?: string;
    relevanceScore?: number;
    isPrunedByMinimization?: boolean;
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
        dataVeilId: z.ZodOptional<z.ZodString>;
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
        originalTag: z.ZodOptional<z.ZodString>;
        relevanceScore: z.ZodOptional<z.ZodNumber>;
        isPrunedByMinimization: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }, {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }>, "many">;
    minimizedElementCount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }[];
    minimizedElementCount?: number;
}, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }[];
    minimizedElementCount?: number;
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
            dataVeilId: z.ZodOptional<z.ZodString>;
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
            originalTag: z.ZodOptional<z.ZodString>;
            relevanceScore: z.ZodOptional<z.ZodNumber>;
            isPrunedByMinimization: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }, {
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }>, "many">;
        minimizedElementCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }[];
        minimizedElementCount?: number;
    }, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }[];
        minimizedElementCount?: number;
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
    minimizationApplied: z.ZodOptional<z.ZodBoolean>;
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
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }[];
        minimizedElementCount?: number;
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
    minimizationApplied?: boolean;
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
            id?: string;
            dataVeilId?: string;
            role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
            originalTag?: string;
            relevanceScore?: number;
            isPrunedByMinimization?: boolean;
        }[];
        minimizedElementCount?: number;
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
    minimizationApplied?: boolean;
}>;
export type ClientPayload = z.infer<typeof ClientPayloadSchema>;
export declare const ActionTypeSchema: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "inspect", "select"]>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export declare const ScrollDirectionSchema: z.ZodEnum<["up", "down"]>;
export type ScrollDirection = z.infer<typeof ScrollDirectionSchema>;
export declare const ActionTargetSchema: z.ZodObject<{
    elementId: z.ZodOptional<z.ZodString>;
    dataVeilId: z.ZodOptional<z.ZodString>;
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
    expectedRole: z.ZodOptional<z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>>;
    expectedLabel: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    dataVeilId?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    elementId?: string;
    expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
    expectedLabel?: string;
}, {
    dataVeilId?: string;
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    elementId?: string;
    expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
    expectedLabel?: string;
}>;
export type ActionTarget = z.infer<typeof ActionTargetSchema>;
/**
 * 5 Structural Risk Levels:
 * Level 0 (Observation): scroll, focus, inspect, highlight -> AUTO
 * Level 1 (Reversible): menu toggle, tab change -> AUTO
 * Level 2 (Data Entry): typing, selection changes -> CONFIRM/EVALUATE
 * Level 3 (Consequential): click submit, delete, purchase -> STRICT USER CONFIRMATION
 * Level 4 (High Risk): cryptographic fields, password fields, payment transfers -> SECURE EXPLICIT LOCKOUT
 */
export declare const RiskLevelSchema: z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export declare const ServerActionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "inspect", "select"]>;
    target: z.ZodOptional<z.ZodObject<{
        elementId: z.ZodOptional<z.ZodString>;
        dataVeilId: z.ZodOptional<z.ZodString>;
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
        expectedRole: z.ZodOptional<z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>>;
        expectedLabel: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        dataVeilId?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
        expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
        expectedLabel?: string;
    }, {
        dataVeilId?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
        expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
        expectedLabel?: string;
    }>>;
    value: z.ZodOptional<z.ZodString>;
    direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
    confidence: z.ZodNumber;
    riskLevel: z.ZodOptional<z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>>;
    explanation: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: string;
    type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
    id?: string;
    confidence?: number;
    target?: {
        dataVeilId?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
        expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
        expectedLabel?: string;
    };
    direction?: "up" | "down";
    amount?: number;
    reason?: string;
    riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
    explanation?: string;
}, {
    value?: string;
    type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
    id?: string;
    confidence?: number;
    target?: {
        dataVeilId?: string;
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
        expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
        expectedLabel?: string;
    };
    direction?: "up" | "down";
    amount?: number;
    reason?: string;
    riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
    explanation?: string;
}>;
export type ServerAction = z.infer<typeof ServerActionSchema>;
export declare const ServerPlanSchema: z.ZodObject<{
    summary: z.ZodString;
    confidence: z.ZodNumber;
    requiresUserConfirmation: z.ZodBoolean;
    actions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "inspect", "select"]>;
        target: z.ZodOptional<z.ZodObject<{
            elementId: z.ZodOptional<z.ZodString>;
            dataVeilId: z.ZodOptional<z.ZodString>;
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
            expectedRole: z.ZodOptional<z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>>;
            expectedLabel: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        }, {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
        riskLevel: z.ZodOptional<z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>>;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }>, "many">;
    highestRiskLevel: z.ZodOptional<z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>>;
}, "strip", z.ZodTypeAny, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }[];
    highestRiskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
}, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }[];
    highestRiskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
}>;
export type ServerPlan = z.infer<typeof ServerPlanSchema>;
export declare const InferenceBackendSchema: z.ZodEnum<["webgpu", "wasm", "mock"]>;
export type InferenceBackend = z.infer<typeof InferenceBackendSchema>;
export declare const PrivacyStatusSchema: z.ZodObject<{
    backend: z.ZodEnum<["webgpu", "wasm", "mock"]>;
    redactedCount: z.ZodNumber;
    lastCapture: z.ZodOptional<z.ZodString>;
    sessionActive: z.ZodBoolean;
    privacyLeakageRate: z.ZodOptional<z.ZodNumber>;
    falseNegativeRate: z.ZodOptional<z.ZodNumber>;
    minimizationEfficiency: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    backend?: "webgpu" | "wasm" | "mock";
    redactedCount?: number;
    lastCapture?: string;
    sessionActive?: boolean;
    privacyLeakageRate?: number;
    falseNegativeRate?: number;
    minimizationEfficiency?: number;
}, {
    backend?: "webgpu" | "wasm" | "mock";
    redactedCount?: number;
    lastCapture?: string;
    sessionActive?: boolean;
    privacyLeakageRate?: number;
    falseNegativeRate?: number;
    minimizationEfficiency?: number;
}>;
export type PrivacyStatus = z.infer<typeof PrivacyStatusSchema>;
export declare const TelemetryEntrySchema: z.ZodObject<{
    timestamp: z.ZodString;
    metric: z.ZodEnum<["model_inference_ms", "screenshot_capture_ms", "dom_extraction_ms", "redaction_ms", "minimization_ms", "payload_size_before_bytes", "payload_size_after_bytes", "server_roundtrip_ms", "total_latency_ms", "sensitive_regions_detected", "actions_blocked", "actions_confirmed", "inference_backend", "privacy_leakage_rate", "false_negative_rate"]>;
    value: z.ZodNumber;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "minimization_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "actions_confirmed" | "inference_backend" | "privacy_leakage_rate" | "false_negative_rate";
}, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "minimization_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "actions_confirmed" | "inference_backend" | "privacy_leakage_rate" | "false_negative_rate";
}>;
export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;
export declare const ActionPolicySchema: z.ZodEnum<["auto", "confirm", "lockout", "reject"]>;
export type ActionPolicy = z.infer<typeof ActionPolicySchema>;
export declare const ValidatedActionSchema: z.ZodObject<{
    action: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight", "inspect", "select"]>;
        target: z.ZodOptional<z.ZodObject<{
            elementId: z.ZodOptional<z.ZodString>;
            dataVeilId: z.ZodOptional<z.ZodString>;
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
            expectedRole: z.ZodOptional<z.ZodEnum<["button", "link", "textbox", "combobox", "checkbox", "radio", "menuitem", "tab", "heading", "img", "region", "generic", "searchbox", "slider", "spinbutton", "switch", "treeitem", "option", "listbox", "dialog", "alert", "banner", "contentinfo", "form", "main", "navigation", "search", "complementary"]>>;
            expectedLabel: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        }, {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
        riskLevel: z.ZodOptional<z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>>;
        explanation: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    }>;
    policy: z.ZodEnum<["auto", "confirm", "lockout", "reject"]>;
    riskLevel: z.ZodEnum<["level_0_observation", "level_1_reversible", "level_2_data_entry", "level_3_consequential", "level_4_high_risk"]>;
    reason: z.ZodString;
    explanation: z.ZodString;
    mappedElement: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        dataVeilId: z.ZodOptional<z.ZodString>;
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
        originalTag: z.ZodOptional<z.ZodString>;
        relevanceScore: z.ZodOptional<z.ZodNumber>;
        isPrunedByMinimization: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }, {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    }>>;
    validationPassed: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
    explanation?: string;
    action?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    };
    policy?: "auto" | "confirm" | "lockout" | "reject";
    mappedElement?: {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    };
    validationPassed?: boolean;
}, {
    reason?: string;
    riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
    explanation?: string;
    action?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight" | "inspect" | "select";
        id?: string;
        confidence?: number;
        target?: {
            dataVeilId?: string;
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
            expectedRole?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
            expectedLabel?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
        riskLevel?: "level_0_observation" | "level_1_reversible" | "level_2_data_entry" | "level_3_consequential" | "level_4_high_risk";
        explanation?: string;
    };
    policy?: "auto" | "confirm" | "lockout" | "reject";
    mappedElement?: {
        id?: string;
        dataVeilId?: string;
        role?: "button" | "link" | "textbox" | "combobox" | "checkbox" | "radio" | "menuitem" | "tab" | "heading" | "img" | "region" | "generic" | "searchbox" | "slider" | "spinbutton" | "switch" | "treeitem" | "option" | "listbox" | "dialog" | "alert" | "banner" | "contentinfo" | "form" | "main" | "navigation" | "search" | "complementary";
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
        originalTag?: string;
        relevanceScore?: number;
        isPrunedByMinimization?: boolean;
    };
    validationPassed?: boolean;
}>;
export type ValidatedAction = z.infer<typeof ValidatedActionSchema>;
export interface ElementValidationResult {
    valid: boolean;
    element: Element | null;
    error?: string;
    reason?: string;
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
//# sourceMappingURL=index.d.ts.map