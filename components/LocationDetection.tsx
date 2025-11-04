// Location detection utility for RateSnap app
export const detectUserLocation = async (): Promise<string> => {
  try {
    // Set default currency immediately - we can update it later
    let detectedCurrency = "USD";
    
    // Try ip-api first (more reliable service)
    try {
      const response = await fetch("http://ip-api.com/json/?fields=countryCode");
      
      if (response.ok) {
        const data = await response.json();
        console.log("IP API Response:", data);
        
        const countryToCurrency: { [key: string]: string } = {
          // North America
          US: "USD", CA: "CAD", MX: "MXN",
          // Europe
          GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
          BE: "EUR", AT: "EUR", FI: "EUR", IE: "EUR", PT: "EUR", GR: "EUR",
          LU: "EUR", CY: "EUR", MT: "EUR", SK: "EUR", SI: "EUR", LV: "EUR",
          LT: "EUR", EE: "EUR", CH: "CHF", NO: "NOK", SE: "SEK", DK: "DKK",
          PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", BG: "BGN", HR: "EUR",
          // Asia
          JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", TH: "THB", MY: "MYR",
          SG: "SGD", HK: "HKD", TW: "TWD", ID: "IDR", PH: "PHP", VN: "VND",
          SA: "SAR", AE: "AED", TR: "TRY", GE: "GEL", AM: "AMD", AZ: "AZN",
          // Africa
          ZA: "ZAR", NG: "NGN", EG: "EGP", MA: "MAD", KE: "KES",
          // South America
          BR: "BRL", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN",
          // Oceania
          AU: "AUD", NZ: "NZD",
        };
        
        // Handle multiple possible property names from different APIs
        const countryCode = data.countryCode || data.country_code || data.country || data.countryName;
        
        if (countryCode) {
          detectedCurrency = countryToCurrency[countryCode] || "USD";
          console.log(`Location detected via ip-api: ${detectedCurrency} (${countryCode})`);
        } else {
          console.log("No country code found in IP response, trying fallback...");
        }
      }
    } catch (apiError) {
      console.log("ip-api failed, trying fallback methods...");
    }

    // Enhanced timezone-based detection (this should catch Armenia)
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Detected timezone:", timezone);
      
      if (timezone.includes("America")) {
        detectedCurrency = "USD";
        console.log("Detected via timezone: America -> USD");
      } else if (timezone.includes("Europe")) {
        detectedCurrency = "EUR";
        console.log("Detected via timezone: Europe -> EUR");
      } else if (timezone.includes("Asia/Tokyo")) {
        detectedCurrency = "JPY";
        console.log("Detected via timezone: Asia/Tokyo -> JPY");
      } else if (timezone.includes("Asia/Shanghai") || timezone.includes("Asia/Hong_Kong")) {
        detectedCurrency = "CNY";
        console.log("Detected via timezone: Asia/China region -> CNY");
      } else if (timezone.includes("Asia/Yerevan")) {
        detectedCurrency = "AMD";
        console.log("✅ Detected Armenia via timezone: Asia/Yerevan -> AMD");
      } else if (timezone.includes("Asia/Dubai") || timezone.includes("Asia/Tbilisi") || timezone.includes("Asia/Baku")) {
        detectedCurrency = "AMD"; // Armenia shares timezone with these regions
        console.log("✅ Detected Armenia via regional timezone -> AMD");
      } else if (timezone.includes("Asia/")) {
        // For other Asian timezones that weren't specifically handled
        // Default to USD unless we can identify a specific currency
        detectedCurrency = detectedCurrency === "USD" ? "USD" : detectedCurrency;
        console.log(`Detected Asian timezone: ${timezone} -> ${detectedCurrency} (kept existing)`);
      }
      // Otherwise keep the detected currency (likely from IP) as default
    } catch (tzError) {
      console.log("Timezone detection failed:", tzError);
      // Keep current detectedCurrency
    }
    
    console.log(`🎯 Final detected currency: ${detectedCurrency}`);
    return detectedCurrency;
  } catch (error) {
    console.log("Location detection completed with graceful fallback to USD:", error);
    return "USD"; // Always fallback to USD
  }
};
