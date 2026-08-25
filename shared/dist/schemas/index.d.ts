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
}, "strip", z.ZodTypeAny, {
    id?: string;
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
}, {
    id?: string;
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
    }, "strip", z.ZodTypeAny, {
        id?: string;
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
    }, {
        id?: string;
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
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        id?: string;
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
    }[];
}, {
    urlOrigin?: string;
    title?: string;
    viewport?: {
        width?: number;
        height?: number;
    };
    elements?: {
        id?: string;
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
        }, "strip", z.ZodTypeAny, {
            id?: string;
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
        }, {
            id?: string;
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
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            id?: string;
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
        }[];
    }, {
        urlOrigin?: string;
        title?: string;
        viewport?: {
            width?: number;
            height?: number;
        };
        elements?: {
            id?: string;
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
            id?: string;
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
            id?: string;
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
export declare const ActionTypeSchema: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight"]>;
export type ActionType = z.infer<typeof ActionTypeSchema>;
export declare const ScrollDirectionSchema: z.ZodEnum<["up", "down"]>;
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
}, "strip", z.ZodTypeAny, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    elementId?: string;
}, {
    bounds?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
    elementId?: string;
}>;
export type ActionTarget = z.infer<typeof ActionTargetSchema>;
export declare const ServerActionSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight"]>;
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
    }, "strip", z.ZodTypeAny, {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
    }, {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
    }>>;
    value: z.ZodOptional<z.ZodString>;
    direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
    amount: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodString;
    confidence: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    value?: string;
    type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
    id?: string;
    confidence?: number;
    target?: {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
    };
    direction?: "up" | "down";
    amount?: number;
    reason?: string;
}, {
    value?: string;
    type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
    id?: string;
    confidence?: number;
    target?: {
        bounds?: {
            x?: number;
            y?: number;
            width?: number;
            height?: number;
        };
        elementId?: string;
    };
    direction?: "up" | "down";
    amount?: number;
    reason?: string;
}>;
export type ServerAction = z.infer<typeof ServerActionSchema>;
export declare const ServerPlanSchema: z.ZodObject<{
    summary: z.ZodString;
    confidence: z.ZodNumber;
    requiresUserConfirmation: z.ZodBoolean;
    actions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight"]>;
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
        }, "strip", z.ZodTypeAny, {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        }, {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    }, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    }[];
}, {
    confidence?: number;
    summary?: string;
    requiresUserConfirmation?: boolean;
    actions?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    }[];
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
    metric: z.ZodEnum<["model_inference_ms", "screenshot_capture_ms", "dom_extraction_ms", "redaction_ms", "payload_size_before_bytes", "payload_size_after_bytes", "server_roundtrip_ms", "total_latency_ms", "sensitive_regions_detected", "actions_blocked", "inference_backend"]>;
    value: z.ZodNumber;
    sessionId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "inference_backend";
}, {
    value?: number;
    sessionId?: string;
    timestamp?: string;
    metric?: "model_inference_ms" | "screenshot_capture_ms" | "dom_extraction_ms" | "redaction_ms" | "payload_size_before_bytes" | "payload_size_after_bytes" | "server_roundtrip_ms" | "total_latency_ms" | "sensitive_regions_detected" | "actions_blocked" | "inference_backend";
}>;
export type TelemetryEntry = z.infer<typeof TelemetryEntrySchema>;
export declare const ActionPolicySchema: z.ZodEnum<["auto", "confirm", "reject"]>;
export type ActionPolicy = z.infer<typeof ActionPolicySchema>;
export declare const ValidatedActionSchema: z.ZodObject<{
    action: z.ZodObject<{
        id: z.ZodString;
        type: z.ZodEnum<["click", "scroll", "focus", "type", "wait", "highlight"]>;
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
        }, "strip", z.ZodTypeAny, {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        }, {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        }>>;
        value: z.ZodOptional<z.ZodString>;
        direction: z.ZodOptional<z.ZodEnum<["up", "down"]>>;
        amount: z.ZodOptional<z.ZodNumber>;
        reason: z.ZodString;
        confidence: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    }, {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
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
    }, "strip", z.ZodTypeAny, {
        id?: string;
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
    }, {
        id?: string;
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
    }>>;
}, "strip", z.ZodTypeAny, {
    reason?: string;
    action?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    };
    policy?: "auto" | "confirm" | "reject";
    mappedElement?: {
        id?: string;
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
    };
}, {
    reason?: string;
    action?: {
        value?: string;
        type?: "type" | "click" | "scroll" | "focus" | "wait" | "highlight";
        id?: string;
        confidence?: number;
        target?: {
            bounds?: {
                x?: number;
                y?: number;
                width?: number;
                height?: number;
            };
            elementId?: string;
        };
        direction?: "up" | "down";
        amount?: number;
        reason?: string;
    };
    policy?: "auto" | "confirm" | "reject";
    mappedElement?: {
        id?: string;
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
    };
}>;
export type ValidatedAction = z.infer<typeof ValidatedActionSchema>;
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