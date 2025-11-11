"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // global-preact:preact/hooks
  if (typeof window === "undefined" || !window.SplitPopPreact || !window.SplitPopPreact.hooks) {
    throw new Error("SplitPopPreact hooks not found. Make sure main bundle is loaded first.");
  }
  var useState = window.SplitPopPreact.hooks.useState;
  var useEffect = window.SplitPopPreact.hooks.useEffect;
  var useContext = window.SplitPopPreact.hooks.useContext;
  var useReducer = window.SplitPopPreact.hooks.useReducer;
  var useCallback = window.SplitPopPreact.hooks.useCallback;
  var useMemo = window.SplitPopPreact.hooks.useMemo;
  var useRef = window.SplitPopPreact.hooks.useRef;
  var useImperativeHandle = window.SplitPopPreact.hooks.useImperativeHandle;
  var useLayoutEffect = window.SplitPopPreact.hooks.useLayoutEffect;
  var useDebugValue = window.SplitPopPreact.hooks.useDebugValue;

  // global-preact:preact
  if (typeof window === "undefined" || !window.SplitPopPreact) {
    throw new Error("SplitPopPreact global runtime not found. Make sure main bundle is loaded first.");
  }
  var h = window.SplitPopPreact.h;
  var render = window.SplitPopPreact.render;
  var Fragment = window.SplitPopPreact.Fragment;
  var Component = window.SplitPopPreact.Component;
  var createContext = window.SplitPopPreact.createContext;
  var cloneElement = window.SplitPopPreact.cloneElement;
  var createRef = window.SplitPopPreact.createRef;
  var isValidElement = window.SplitPopPreact.isValidElement;
  var options = window.SplitPopPreact.options;
  var preact_default = window.SplitPopPreact;

  // node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
  var f = 0;
  var i = Array.isArray;
  function u(e, t, n, o, i2, u2) {
    t || (t = {});
    var a, c, p = t;
    if ("ref" in p)
      for (c in p = {}, t)
        "ref" == c ? a = t[c] : p[c] = t[c];
    var l = { type: e, props: p, key: n, ref: a, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: void 0, __v: --f, __i: -1, __u: 0, __source: i2, __self: u2 };
    if ("function" == typeof e && (a = e.defaultProps))
      for (c in a)
        void 0 === p[c] && (p[c] = a[c]);
    return options.vnode && options.vnode(l), l;
  }

  // extensions/storefront-src/auto-generated/components/newsletter/ProgressIndicator.tsx
  var ProgressIndicator = ({
    currentStep,
    totalSteps,
    primaryColor = "#007BFF",
    backgroundColor = "#FFFFFF",
    stepIndicatorColor = "#10B981"
  }) => {
    const stepNumber = currentStep === "success" ? totalSteps : currentStep;
    const progressPercentage = stepNumber / totalSteps * 100;
    return /* @__PURE__ */ u("div", { className: "progress-indicator", children: [
      /* @__PURE__ */ u("div", { className: "progress-text", children: currentStep === "success" ? "\u2713" : `${stepNumber}/${totalSteps}` }),
      /* @__PURE__ */ u("div", { className: "progress-bar", children: /* @__PURE__ */ u(
        "div",
        {
          className: "progress-fill",
          style: {
            width: `${progressPercentage}%`,
            backgroundColor: primaryColor
          }
        }
      ) }),
      /* @__PURE__ */ u("style", { children: `
        .progress-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 56px 16px 24px; /* Added right padding to avoid close button */
          border-bottom: 1px solid #E5E7EB;
          background: ${backgroundColor};
        }

        .progress-bar {
          flex: 1;
          height: 4px;
          background: #E5E7EB;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 2px;
        }

        .progress-text {
          font-size: 14px;
          color: ${currentStep === "success" ? stepIndicatorColor : "#6B7280"};
          font-weight: 600;
          min-width: 40px;
          text-align: left;
          flex-shrink: 0;
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .progress-indicator {
            padding: 12px 44px 12px 16px; /* Added right padding for mobile close button */
            gap: 8px;
          }

          .progress-text {
            font-size: 12px;
            min-width: 35px;
          }
        }
      ` })
    ] });
  };

  // extensions/storefront-src/auto-generated/components/newsletter/types.ts
  var DEFAULT_PREFERENCE_OPTIONS = [
    { id: "new-arrivals", label: "New Arrivals", icon: "\u{1F195}" },
    { id: "sales", label: "Sales & Promotions", icon: "\u{1F4B0}" },
    { id: "style-tips", label: "Style Tips", icon: "\u2728" },
    { id: "exclusive-offers", label: "Exclusive Offers", icon: "\u{1F381}" }
  ];
  var DEFAULT_FREQUENCY_OPTIONS = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "biweekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" }
  ];
  var DEFAULT_MULTISTEP_CONFIG = {
    // Step 1
    emailLabel: "Email Address",
    emailPlaceholder: "your@email.com",
    emailRequired: true,
    emailErrorMessage: "Please enter a valid email address",
    // Step 2
    nameStepEnabled: true,
    nameStepRequired: false,
    nameStepTitle: "Tell us your name",
    nameStepSubtitle: "Optional - helps us personalize your experience",
    firstNameLabel: "First Name",
    firstNamePlaceholder: "John",
    lastNameLabel: "Last Name",
    lastNamePlaceholder: "Doe",
    // Step 3
    preferencesStepEnabled: true,
    preferencesStepRequired: false,
    preferencesStepTitle: "What are you interested in?",
    preferencesStepSubtitle: "Optional - we'll send you relevant content",
    preferenceOptions: DEFAULT_PREFERENCE_OPTIONS,
    frequencyLabel: "Email Frequency",
    frequencyOptions: DEFAULT_FREQUENCY_OPTIONS,
    // General
    headline: "Get 10% Off Your First Order",
    subheadline: "Join our newsletter for exclusive deals",
    successMessage: "Welcome to our newsletter!",
    successSubtitle: "Your discount code is displayed below",
    // Discount
    discountEnabled: true,
    discountPercentage: 10,
    // Design
    primaryColor: "#007BFF",
    backgroundColor: "#FFFFFF",
    textColor: "#1A1A1A",
    buttonColor: "#007BFF",
    buttonTextColor: "#FFFFFF",
    inputBackgroundColor: "#F9FAFB",
    headerBackgroundColor: "#FFFFFF",
    progressBarColor: "#3B82F6",
    stepIndicatorColor: "#10B981"
  };

  // extensions/storefront-src/auto-generated/components/newsletter/MultiStepNewsletterForm.tsx
  var MultiStepNewsletterForm = ({
    isVisible,
    onClose,
    campaignId,
    config: customConfig,
    onSubscribe,
    previewMode = false
  }) => {
    const config = __spreadValues(__spreadValues({}, DEFAULT_MULTISTEP_CONFIG), customConfig);
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
      email: "",
      firstName: "",
      lastName: "",
      interests: [],
      emailFrequency: "weekly"
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [discountCode, setDiscountCode] = useState(null);
    const totalSteps = 1 + (config.nameStepEnabled ? 1 : 0) + (config.preferencesStepEnabled ? 1 : 0);
    useEffect(() => {
      if (isVisible) {
        setCurrentStep(1);
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          interests: [],
          emailFrequency: "weekly"
        });
        setErrors({});
        setIsSubmitting(false);
        setDiscountCode(null);
      }
    }, [isVisible]);
    const validateEmail = (email) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };
    const validateStep = () => {
      const newErrors = {};
      if (currentStep === 1) {
        if (!formData.email) {
          newErrors.email = config.emailErrorMessage;
          setErrors(newErrors);
          return false;
        }
        if (!validateEmail(formData.email)) {
          newErrors.email = config.emailErrorMessage;
          setErrors(newErrors);
          return false;
        }
      }
      setErrors({});
      return true;
    };
    const handleInputChange = (field, value) => {
      setFormData((prev) => __spreadProps(__spreadValues({}, prev), { [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = __spreadValues({}, prev);
          delete newErrors[field];
          return newErrors;
        });
      }
    };
    const handleInterestToggle = (interestId) => {
      setFormData((prev) => {
        const interests = prev.interests || [];
        const newInterests = interests.includes(interestId) ? interests.filter((id) => id !== interestId) : [...interests, interestId];
        return __spreadProps(__spreadValues({}, prev), { interests: newInterests });
      });
    };
    const handleNext = () => {
      if (!validateStep()) {
        return;
      }
      if (currentStep === 1) {
        if (config.nameStepEnabled) {
          setCurrentStep(2);
        } else if (config.preferencesStepEnabled) {
          setCurrentStep(3);
        } else {
          handleSubmit();
        }
      } else if (currentStep === 2) {
        if (config.preferencesStepEnabled) {
          setCurrentStep(3);
        } else {
          handleSubmit();
        }
      } else if (currentStep === 3) {
        handleSubmit();
      }
    };
    const handleBack = () => {
      if (currentStep === 2) {
        setCurrentStep(1);
      } else if (currentStep === 3) {
        if (config.nameStepEnabled) {
          setCurrentStep(2);
        } else {
          setCurrentStep(1);
        }
      }
    };
    const handleSkip = () => {
      if (currentStep === 2) {
        setFormData((prev) => __spreadProps(__spreadValues({}, prev), { firstName: "", lastName: "" }));
        if (config.preferencesStepEnabled) {
          setCurrentStep(3);
        } else {
          handleSubmit();
        }
      } else if (currentStep === 3) {
        setFormData((prev) => __spreadProps(__spreadValues({}, prev), {
          interests: [],
          emailFrequency: "weekly"
        }));
        handleSubmit();
      }
    };
    const handleSubmit = async () => {
      var _a;
      setIsSubmitting(true);
      try {
        if (onSubscribe) {
          await onSubscribe(formData);
        } else {
          const response = await fetch("/api/commerce/leads/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              email: formData.email,
              firstName: formData.firstName || void 0,
              lastName: formData.lastName || void 0,
              consent: true,
              campaignId,
              sessionId: typeof window !== "undefined" ? ((_a = window.sessionStorage) == null ? void 0 : _a.getItem("sessionId")) || `session-${Date.now()}` : `session-${Date.now()}`,
              metadata: {
                interests: formData.interests,
                emailFrequency: formData.emailFrequency,
                source: "multi-step-newsletter"
              }
            })
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Subscription failed");
          }
          const result = await response.json();
          if (result.discountCode) {
            setDiscountCode(result.discountCode);
          }
        }
        setCurrentStep("success");
      } catch (error) {
        console.error("Subscription error:", error);
        setErrors({
          email: error instanceof Error ? error.message : "Something went wrong. Please try again."
        });
        setCurrentStep(1);
      } finally {
        setIsSubmitting(false);
      }
    };
    const handleKeyPress = (e) => {
      if (e.key === "Enter" && !isSubmitting) {
        handleNext();
      }
    };
    if (!isVisible) {
      return null;
    }
    return /* @__PURE__ */ u(Fragment, { children: [
      /* @__PURE__ */ u("div", { className: "multistep-overlay", onClick: onClose, children: /* @__PURE__ */ u(
        "div",
        {
          className: "multistep-modal",
          onClick: (e) => e.stopPropagation(),
          onKeyPress: handleKeyPress,
          children: [
            /* @__PURE__ */ u(
              ProgressIndicator,
              {
                currentStep,
                totalSteps,
                primaryColor: config.progressBarColor || config.buttonColor || config.primaryColor,
                backgroundColor: config.headerBackgroundColor || config.backgroundColor,
                stepIndicatorColor: config.stepIndicatorColor
              }
            ),
            /* @__PURE__ */ u("div", { className: "multistep-content", children: [
              currentStep === 1 && /* @__PURE__ */ u("div", { className: "step-container", children: [
                /* @__PURE__ */ u("h2", { className: "step-title", children: config.headline }),
                /* @__PURE__ */ u("p", { className: "step-subtitle", children: config.subheadline }),
                /* @__PURE__ */ u("div", { className: "form-field", children: [
                  /* @__PURE__ */ u("label", { htmlFor: "email", children: [
                    config.emailLabel,
                    " *"
                  ] }),
                  /* @__PURE__ */ u(
                    "input",
                    {
                      id: "email",
                      type: "email",
                      value: formData.email,
                      onChange: (e) => {
                        var _a;
                        return handleInputChange("email", (_a = e.target) == null ? void 0 : _a.value);
                      },
                      placeholder: config.emailPlaceholder,
                      className: errors.email ? "error" : "",
                      autoFocus: true
                    }
                  ),
                  errors.email && /* @__PURE__ */ u("span", { className: "error-message", children: errors.email })
                ] }),
                /* @__PURE__ */ u("div", { className: "button-group", children: /* @__PURE__ */ u(
                  "button",
                  {
                    className: "btn-primary",
                    onClick: handleNext,
                    disabled: isSubmitting,
                    children: "Continue"
                  }
                ) })
              ] }),
              currentStep === 2 && config.nameStepEnabled && /* @__PURE__ */ u("div", { className: "step-container", children: [
                /* @__PURE__ */ u("h2", { className: "step-title", children: config.nameStepTitle }),
                /* @__PURE__ */ u("p", { className: "step-subtitle", children: config.nameStepSubtitle }),
                /* @__PURE__ */ u("div", { className: "form-field", children: [
                  /* @__PURE__ */ u("label", { htmlFor: "firstName", children: config.firstNameLabel }),
                  /* @__PURE__ */ u(
                    "input",
                    {
                      id: "firstName",
                      type: "text",
                      value: formData.firstName || "",
                      onChange: (e) => {
                        var _a;
                        return handleInputChange("firstName", (_a = e.target) == null ? void 0 : _a.value);
                      },
                      placeholder: config.firstNamePlaceholder,
                      autoFocus: true
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "form-field", children: [
                  /* @__PURE__ */ u("label", { htmlFor: "lastName", children: config.lastNameLabel }),
                  /* @__PURE__ */ u(
                    "input",
                    {
                      id: "lastName",
                      type: "text",
                      value: formData.lastName || "",
                      onChange: (e) => {
                        var _a;
                        return handleInputChange("lastName", (_a = e.target) == null ? void 0 : _a.value);
                      },
                      placeholder: config.lastNamePlaceholder
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "button-group", children: [
                  /* @__PURE__ */ u("button", { className: "btn-secondary", onClick: handleBack, children: "Back" }),
                  /* @__PURE__ */ u("button", { className: "btn-secondary", onClick: handleSkip, children: "Skip" }),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      className: "btn-primary",
                      onClick: handleNext,
                      disabled: isSubmitting,
                      children: "Continue"
                    }
                  )
                ] })
              ] }),
              currentStep === 3 && config.preferencesStepEnabled && /* @__PURE__ */ u("div", { className: "step-container", children: [
                /* @__PURE__ */ u("h2", { className: "step-title", children: config.preferencesStepTitle }),
                /* @__PURE__ */ u("p", { className: "step-subtitle", children: config.preferencesStepSubtitle }),
                /* @__PURE__ */ u("div", { className: "preferences-section", children: config.preferenceOptions.map((option) => {
                  var _a;
                  return /* @__PURE__ */ u("label", { className: "checkbox-label", children: [
                    /* @__PURE__ */ u(
                      "input",
                      {
                        type: "checkbox",
                        checked: ((_a = formData.interests) == null ? void 0 : _a.includes(option.id)) || false,
                        onChange: () => handleInterestToggle(option.id)
                      }
                    ),
                    /* @__PURE__ */ u("span", { className: "checkbox-text", children: [
                      option.icon && /* @__PURE__ */ u("span", { className: "checkbox-icon", children: option.icon }),
                      option.label
                    ] })
                  ] }, option.id);
                }) }),
                /* @__PURE__ */ u("div", { className: "form-field", children: [
                  /* @__PURE__ */ u("label", { htmlFor: "frequency", children: config.frequencyLabel }),
                  /* @__PURE__ */ u(
                    "select",
                    {
                      id: "frequency",
                      value: formData.emailFrequency || "weekly",
                      onChange: (e) => {
                        var _a;
                        return handleInputChange("emailFrequency", (_a = e.target) == null ? void 0 : _a.value);
                      },
                      children: config.frequencyOptions.map((option) => /* @__PURE__ */ u("option", { value: option.value, children: option.label }, option.value))
                    }
                  )
                ] }),
                /* @__PURE__ */ u("div", { className: "button-group", children: [
                  /* @__PURE__ */ u("button", { className: "btn-secondary", onClick: handleBack, children: "Back" }),
                  /* @__PURE__ */ u("button", { className: "btn-secondary", onClick: handleSkip, children: "Skip" }),
                  /* @__PURE__ */ u(
                    "button",
                    {
                      className: "btn-primary",
                      onClick: handleNext,
                      disabled: isSubmitting,
                      children: isSubmitting ? "Submitting..." : "Submit"
                    }
                  )
                ] })
              ] }),
              currentStep === "success" && /* @__PURE__ */ u("div", { className: "step-container success-screen", children: [
                /* @__PURE__ */ u("div", { className: "success-icon", children: "\u2713" }),
                /* @__PURE__ */ u("h2", { className: "step-title", children: config.successMessage }),
                /* @__PURE__ */ u("p", { className: "step-subtitle", children: config.successSubtitle }),
                config.discountEnabled && (discountCode || config.discountCode) && /* @__PURE__ */ u("div", { className: "discount-code-box", children: [
                  /* @__PURE__ */ u("div", { className: "discount-label", children: "Your discount code:" }),
                  /* @__PURE__ */ u("div", { className: "discount-code", children: discountCode || config.discountCode }),
                  /* @__PURE__ */ u("div", { className: "discount-hint", children: "Copy this code to use at checkout" })
                ] }),
                /* @__PURE__ */ u("div", { className: "button-group", children: /* @__PURE__ */ u("button", { className: "btn-primary", onClick: onClose, children: "Start Shopping" }) })
              ] })
            ] }),
            /* @__PURE__ */ u("button", { className: "close-button", onClick: onClose, "aria-label": "Close", children: "\xD7" })
          ]
        }
      ) }),
      /* @__PURE__ */ u("style", { children: `
        .multistep-overlay {
          position: ${previewMode ? "relative" : "fixed"};
          ${previewMode ? "" : `
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          `}
          background: ${previewMode ? "transparent" : "rgba(0, 0, 0, 0.5)"};
          display: flex;
          align-items: center;
          justify-content: center;
          ${previewMode ? "width: 100%; min-height: 400px;" : ""}
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .multistep-modal {
          background: ${config.backgroundColor || "#FFFFFF"};
          color: ${config.textColor || "#1F2937"};
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .multistep-content {
          padding: 32px 24px;
          overflow-y: auto;
          max-height: calc(90vh - 60px);
        }

        .step-container {
          animation: slideInRight 0.3s ease-out;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .step-title {
          font-size: 24px;
          font-weight: 700;
          color: ${config.textColor};
          margin: 0 0 8px 0;
          text-align: center;
        }

        .step-subtitle {
          font-size: 14px;
          color: #6B7280;
          margin: 0 0 24px 0;
          text-align: center;
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-field label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: ${config.textColor};
          margin-bottom: 8px;
        }

        .form-field input,
        .form-field select {
          width: 100%;
          padding: 12px 16px;
          font-size: 16px;
          background: ${config.inputBackgroundColor || "#FFFFFF"};
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          transition: border-color 0.2s, background-color 0.2s;
          box-sizing: border-box;
          color: ${config.textColor || "#1F2937"};
        }

        .form-field input:focus,
        .form-field select:focus {
          outline: none;
          border-color: ${config.buttonColor || config.primaryColor || "#3B82F6"};
          background: ${config.inputBackgroundColor || "#FFFFFF"};
        }

        .form-field input.error {
          border-color: #EF4444;
        }

        .error-message {
          display: block;
          color: #EF4444;
          font-size: 13px;
          margin-top: 6px;
        }

        .preferences-section {
          margin-bottom: 24px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          padding: 12px;
          margin-bottom: 8px;
          border: 2px solid #E5E7EB;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          border-color: ${config.buttonColor || config.primaryColor || "#3B82F6"};
          background: ${config.inputBackgroundColor || "#F9FAFB"};
        }

        .checkbox-label input[type="checkbox"] {
          width: 20px;
          height: 20px;
          margin-right: 12px;
          cursor: pointer;
        }

        .checkbox-text {
          display: flex;
          align-items: center;
          font-size: 15px;
          color: ${config.textColor};
        }

        .checkbox-icon {
          margin-right: 8px;
          font-size: 18px;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn-primary,
        .btn-secondary {
          flex: 1;
          padding: 14px 24px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: ${config.buttonColor || config.primaryColor || "#3B82F6"};
          color: ${config.buttonTextColor || "#FFFFFF"};
          border: none;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          filter: brightness(1.05);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #F3F4F6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #E5E7EB;
        }

        .success-screen {
          text-align: center;
        }

        .success-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: ${config.stepIndicatorColor || "#10B981"};
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: bold;
          animation: scaleIn 0.5s ease-out;
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .discount-code-box {
          background: ${config.inputBackgroundColor || "#F9FAFB"};
          border: 2px dashed ${config.buttonColor || config.primaryColor || "#3B82F6"};
          border-radius: 8px;
          padding: 20px;
          margin: 24px 0;
        }

        .discount-label {
          font-size: 14px;
          color: #6B7280;
          margin-bottom: 8px;
        }

        .discount-code {
          font-size: 28px;
          font-weight: 700;
          color: ${config.primaryColor};
          letter-spacing: 2px;
          font-family: monospace;
        }

        .discount-hint {
          font-size: 12px;
          color: #6B7280;
          margin-top: 8px;
        }

        .close-button {
          position: absolute;
          top: 18px; /* Progress bar center: 16px padding + 2px (half of 4px bar height) */
          right: 16px;
          background: transparent;
          border: none;
          font-size: 24px;
          color: #9CA3AF;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
          z-index: 10;
          transform: translateY(-50%); /* Center the button on the calculated position */
        }

        .close-button:hover {
          color: ${config.textColor};
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .multistep-modal {
            width: 95%;
            max-height: 95vh;
          }

          .multistep-content {
            padding: 24px 16px;
          }

          .step-title {
            font-size: 20px;
          }

          .button-group {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .close-button {
            top: 14px; /* Mobile progress bar center: 12px padding + 2px (half of 4px bar height) */
            right: 12px;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      ` })
    ] });
  };

  // extensions/storefront-src/bundles/newsletter-multistep-form.ts
  (function register() {
    const g = window;
    g.SplitPopComponents = g.SplitPopComponents || {};
    g.SplitPopComponents["newsletter-multistep"] = MultiStepNewsletterForm;
    if (g.console && g.console.debug) {
      console.debug(
        "[Split-Pop] Newsletter Multistep registered for: newsletter-multistep"
      );
    }
  })();
})();
//# sourceMappingURL=newsletter-multistep-form.js.map
