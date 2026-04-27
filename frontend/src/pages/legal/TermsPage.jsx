import LegalLayout from './LegalLayout.jsx'

/**
 * Generic Terms of Service template for an Indian SaaS.
 *
 * NOTE FOR THE OPERATOR: This is a starter template, not legal advice.
 * Before going live, get this reviewed by a lawyer admitted to practice in
 * your jurisdiction and replace the bracketed placeholders.
 */
export default function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated="2026-04-27">
      <p>
        These Terms of Service ("<strong>Terms</strong>") govern your access
        to and use of the PeopleOS platform (the "<strong>Service</strong>"),
        operated by [Your Company Legal Name] ("<strong>we</strong>", "us",
        "our"). By creating an account or using the Service, you agree to be
        bound by these Terms.
      </p>

      <h2>1. Eligibility &amp; account creation</h2>
      <p>
        You must be at least 18 years old and authorised to act on behalf of
        the organisation you register. You are responsible for keeping your
        login credentials confidential and for all activity under your
        account.
      </p>

      <h2>2. Subscription &amp; fees</h2>
      <p>
        The Service is offered on a subscription basis. Fees, billing
        frequency and refund eligibility are described on our pricing page
        and in your order form. Subscriptions auto-renew unless cancelled at
        least 7 days before the renewal date. All fees are exclusive of
        applicable taxes (GST, etc.).
      </p>

      <h2>3. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>upload data you do not have the right to upload;</li>
        <li>attempt to gain unauthorised access to the Service or its data;</li>
        <li>use the Service to send spam or unlawful content;</li>
        <li>reverse-engineer, scrape or resell the Service without written consent.</li>
      </ul>

      <h2>4. Customer data</h2>
      <p>
        You retain all rights to data you upload ("<strong>Customer
        Data</strong>"). You grant us a limited licence to process Customer
        Data solely to provide the Service. We process personal data in
        accordance with our <a href="/legal/privacy">Privacy Policy</a> and
        applicable laws including the Digital Personal Data Protection Act,
        2023 (India).
      </p>

      <h2>5. Service availability</h2>
      <p>
        We strive for high availability but do not guarantee uninterrupted
        operation. Planned maintenance will be notified in advance where
        feasible. We are not liable for downtime caused by factors outside
        our reasonable control (force majeure).
      </p>

      <h2>6. Confidentiality &amp; security</h2>
      <p>
        We use industry-standard safeguards including encryption at rest and
        in transit, access controls, audit logs and regular backups. Despite
        these measures, no system is 100% secure; you must also take
        reasonable steps to protect your account.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        All software, design and documentation comprising the Service is
        owned by us or our licensors and is protected by copyright and other
        laws. These Terms do not grant you any rights to our trademarks or
        source code.
      </p>

      <h2>8. Termination</h2>
      <p>
        Either party may terminate the subscription on written notice. We may
        suspend access immediately for non-payment, breach of these Terms or
        legal compulsion. On termination you may export your data within 30
        days; thereafter data may be deleted.
      </p>

      <h2>9. Disclaimers &amp; limitation of liability</h2>
      <p>
        The Service is provided "as is" without warranties of any kind. To
        the fullest extent permitted by law, our total liability arising out
        of these Terms shall not exceed the fees paid by you in the 12
        months preceding the event giving rise to the claim. We are not
        liable for indirect, incidental or consequential damages.
      </p>

      <h2>10. Governing law &amp; disputes</h2>
      <p>
        These Terms are governed by the laws of India. Any dispute will be
        subject to the exclusive jurisdiction of the courts at
        [Your City, State].
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update these Terms from time to time. Material changes will
        be notified at least 30 days in advance via email or in-product
        notice. Continued use after the effective date constitutes
        acceptance.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions? Email <a href="mailto:legal@example.com">legal@example.com</a>
        &nbsp;or write to [Your Registered Address].
      </p>
    </LegalLayout>
  )
}
