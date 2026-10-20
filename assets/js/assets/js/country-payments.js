/* ==========================================
   ROCKYX COUNTRY PAYMENT OPTIONS
   One World. One Platform.
   ==========================================

   Frontend configuration foundation only.
   Actual payment availability, eligibility,
   processing and verification must be handled
   by the secure backend and payment provider.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "rockyx_payment_country";

  // These are country preferences and example options,
  // NOT a guarantee that Paystack enables each method
  // for your merchant account.
  const COUNTRIES = {
    GH: {
      code: "GH",
      name: "Ghana",
      currency: "GHS",
      paymentMethods: ["mobile_money", "card"]
    },

    NG: {
      code: "NG",
      name: "Nigeria",
      currency: "NGN",
      paymentMethods: ["card", "bank_transfer"]
    },

    KE: {
      code: "KE",
      name: "Kenya",
      currency: "KES",
      paymentMethods: ["mobile_money", "card"]
    },

    ZA: {
      code: "ZA",
      name: "South Africa",
      currency: "ZAR",
      paymentMethods: ["card"]
    },

    OTHER: {
      code: "OTHER",
      name: "Other country",
      currency: null,
      paymentMethods: ["card"]
    }
  };

  const PAYMENT_METHOD_LABELS = {
    mobile_money: "Mobile Money",
    card: "Bank card",
    bank_transfer: "Bank transfer"
  };

  function getCountryList() {
    return Object.values(COUNTRIES).map(country => ({
      ...country,
      paymentMethods: [...country.paymentMethods]
    }));
  }

  function getCountry(countryCode) {
    if (!countryCode) return null;

    const code = String(countryCode).trim().toUpperCase();
    const country = COUNTRIES[code];

    if (!country) return null;

    return {
      ...country,
      paymentMethods: [...country.paymentMethods]
    };
  }

  function getSelectedCountry() {
    try {
      const code = localStorage.getItem(STORAGE_KEY);
      return code ? getCountry(code) : null;
    } catch (error) {
      console.error(
        "RockyX Payments: Could not read country preference.",
        error
      );

      return null;
    }
  }

  function setSelectedCountry(countryCode) {
    const country = getCountry(countryCode);

    if (!country) {
      return {
        success: false,
        error: "This country is not in the current country list."
      };
    }

    try {
      localStorage.setItem(STORAGE_KEY, country.code);

      window.dispatchEvent(
        new CustomEvent("rockyx:payment-country-changed", {
          detail: {
            countryCode: country.code
          }
        })
      );

      return {
        success: true,
        country
      };
    } catch (error) {
      return {
        success: false,
        error: "Could not save the country preference."
      };
    }
  }

  function getPaymentMethods(countryCode) {
    const country = getCountry(countryCode);

    if (!country) return [];

    return country.paymentMethods.map(method => ({
      id: method,
      label: PAYMENT_METHOD_LABELS[method] || method
    }));
  }

  function getCurrency(countryCode) {
    const country = getCountry(countryCode);
    return country ? country.currency : null;
  }

  function getCountryPaymentInfo(countryCode) {
    const country = getCountry(countryCode);

    if (!country) {
      return {
        supported: false,
        message: "Please select a supported country."
      };
    }

    return {
      supported: true,
      countryCode: country.code,
      countryName: country.name,
      currency: country.currency,
      paymentMethods: getPaymentMethods(country.code),
      requiresBackendVerification: true
    };
  }

  function getPaymentMethodLabel(methodId) {
    return PAYMENT_METHOD_LABELS[methodId] || null;
  }

  window.RockyXCountryPayments = {
    getCountryList,
    getCountry,
    getSelectedCountry,
    setSelectedCountry,
    getPaymentMethods,
    getCurrency,
    getCountryPaymentInfo,
    getPaymentMethodLabel
  };

  window.dispatchEvent(
    new CustomEvent("rockyx:country-payments-ready")
  );
})();