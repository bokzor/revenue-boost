export async function getStoreCurrency(admin: { graphql: (query: string) => Promise<Response> }): Promise<string> {
  try {
    const response = await admin.graphql(`
      query {
        shop {
          currencyCode
        }
      }
    `);
    const data = await response.json();
    return data.data.shop.currencyCode;
  } catch (error) {
    console.error("Failed to fetch store currency:", error);
    return "USD"; // Fallback
  }
}
