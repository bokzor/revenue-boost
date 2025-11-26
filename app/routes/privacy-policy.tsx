/**
 * Privacy Policy Page
 *
 * Public-facing privacy policy for the Revenue Boost app.
 * Accessible at /privacy-policy
 */

export default function PrivacyPolicy() {
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.heading}>Privacy Policy</h1>
        <p style={styles.lastUpdated}>Last updated: November 2024</p>

        <section style={styles.section}>
          <h2 style={styles.subheading}>1. Introduction</h2>
          <p style={styles.text}>
            Revenue Boost ("we", "our", or "us") is a Shopify application that helps merchants
            increase their revenue through popup campaigns, email collection, and promotional tools.
            This Privacy Policy explains how we collect, use, and protect information when you use
            our application.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>2. Information We Collect</h2>
          <h3 style={styles.subsubheading}>2.1 Merchant Data</h3>
          <p style={styles.text}>When you install our app, we access:</p>
          <ul style={styles.list}>
            <li>Shop information (store name, domain, email)</li>
            <li>Product and collection data (for targeting campaigns)</li>
            <li>Order data (for revenue attribution and analytics)</li>
            <li>Customer data (email addresses collected through campaigns)</li>
            <li>Discount codes (for creating promotional offers)</li>
          </ul>

          <h3 style={styles.subsubheading}>2.2 End Customer Data</h3>
          <p style={styles.text}>
            When customers interact with campaigns on your store, we may collect:
          </p>
          <ul style={styles.list}>
            <li>Email addresses (when submitted through newsletter popups)</li>
            <li>Interaction data (popup views, clicks, conversions)</li>
            <li>Device information (for responsive display and analytics)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>3. How We Use Information</h2>
          <p style={styles.text}>We use collected information to:</p>
          <ul style={styles.list}>
            <li>Display targeted popup campaigns on your storefront</li>
            <li>Track campaign performance and provide analytics</li>
            <li>Issue discount codes to customers</li>
            <li>Sync collected emails to your Shopify customer list</li>
            <li>Improve our application and develop new features</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>4. Data Storage and Security</h2>
          <p style={styles.text}>
            We store data securely using industry-standard encryption and security practices.
            Your data is hosted on secure cloud infrastructure with regular backups and
            monitoring. We do not sell or share your data with third parties for marketing
            purposes.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>5. Data Retention</h2>
          <p style={styles.text}>
            We retain your data for as long as your app is installed. Upon uninstallation,
            we process data deletion requests in accordance with Shopify's requirements
            (typically within 48 hours of receiving the shop/redact webhook).
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>6. Your Rights (GDPR)</h2>
          <p style={styles.text}>If you are in the European Union, you have the right to:</p>
          <ul style={styles.list}>
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
            <li>Data portability</li>
          </ul>
          <p style={styles.text}>
            To exercise these rights, please contact us using the information below.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>7. Third-Party Services</h2>
          <p style={styles.text}>Our app integrates with:</p>
          <ul style={styles.list}>
            <li>Shopify (for store data and API access)</li>
            <li>Analytics services (for app performance monitoring)</li>
          </ul>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>8. Changes to This Policy</h2>
          <p style={styles.text}>
            We may update this Privacy Policy from time to time. We will notify you of any
            significant changes through the app or via email.
          </p>
        </section>

        <section style={styles.section}>
          <h2 style={styles.subheading}>9. Contact Us</h2>
          <p style={styles.text}>
            If you have questions about this Privacy Policy or our data practices, please
            contact us at: <a href="mailto:support@revenue-boost.app">support@revenue-boost.app</a>
          </p>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f9fafb",
    padding: "2rem 1rem",
  },
  content: {
    maxWidth: "800px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  heading: {
    fontSize: "2rem",
    fontWeight: "700",
    color: "#111827",
    marginBottom: "0.5rem",
  },
  lastUpdated: {
    color: "#6b7280",
    fontSize: "0.875rem",
    marginBottom: "2rem",
  },
  section: {
    marginBottom: "1.5rem",
  },
  subheading: {
    fontSize: "1.25rem",
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: "0.75rem",
  },
  subsubheading: {
    fontSize: "1rem",
    fontWeight: "600",
    color: "#374151",
    marginBottom: "0.5rem",
    marginTop: "1rem",
  },
  text: {
    color: "#4b5563",
    lineHeight: "1.6",
    marginBottom: "0.75rem",
  },
  list: {
    color: "#4b5563",
    lineHeight: "1.8",
    paddingLeft: "1.5rem",
    marginBottom: "0.75rem",
  },
};

