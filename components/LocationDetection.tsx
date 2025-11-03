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
        const countryToCurrency: { [key: string]: string } = {
          US: "USD", GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR",
          JP: "JPY", CN: "CNY", CA: "CAD", AU: "AUD", CH: "CHF", SE: "SEK",
          NZ: "NZD", SG: "SGD", HK: "HKD", NO: "NOK", KR: "KRW", TR: "TRY",
          RU: "RUB", IN: "INR", BR: "BRL", ZA: "ZAR", AE: "AED", AM: "AMD",
        };
        
        detectedCurrency = countryToCurrency[data.countryCode] || "USD";
        console.log("Location detected via ip-api:", detectedCurrency);
      }
    } catch (apiError) {
      console.log("ip-api failed, trying fallback methods...");
    }

    // Smart timezone-based detection
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Detected timezone:", timezone);
      
      if (timezone.includes("America")) {
        detectedCurrency = "USD";
      } else if (timezone.includes("Europe")) {
        detectedCurrency = "EUR";
      } else if (timezone.includes("Asia/Tokyo")) {
        detectedCurrency = "JPY";
      } else if (timezone.includes("Asia/Shanghai") || timezone.includes("Asia/Hong_Kong")) {
        detectedCurrency = "CNY";
      }
      // Otherwise keep USD as default
    } catch (tzError) {
      console.log("Timezone detection failed:", tzError);
      // Keep USD as default
    }
    
    return detectedCurrency;
  } catch (error) {
    console.log("Location detection completed with graceful fallback to USD:", error);
    return "USD"; // Always fallback to USD
  }
};
