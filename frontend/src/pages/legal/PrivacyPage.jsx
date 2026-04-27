import LegalLayout from './LegalLayout.jsx'

/**
 * Generic Privacy Policy template aligned with the Indian DPDP Act 2023
 * and reasonable parts of GDPR. Replace the bracketed placeholders before
 * going live and have a lawyer review.
 */
export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="2026-04-27">
      <p>
        This Privacy Policy describes how [Your Company Legal Name]
        ("<strong>we</strong>") collects, uses, shares and protects personal
        information when you use the PeopleOS platform (the
        "<strong>Service</strong>"). It applies to administrators, HR users
        and employees whose data is processed through the Service.
      </p>

      <h2>1. Roles</h2>
      <p>
        For data your organisation uploads about its employees, your
        organisation is the <strong>data fiduciary</strong> (controller) and
        we act as a <strong>data processor</strong>. We process such data
        only on documented instructions from your organisation.
      </p>

      <h2>2. Personal data we collect</h2>
      <ul>
        <li><strong>Account data</strong> — name, work email, role, login credentials.</li>
        <li><strong>Employee records</strong> — contact details, designation, department, dates of joining/birth, identifiers (PAN, Aadhaar, bank details) where uploaded by your organisation.</li>
        <li><strong>Operational data</strong> — attendance, leave, payroll, performance reviews, documents.</li>
        <li><strong>Technical data</strong> — IP address, browser type, device, log timestamps, audit events.</li>
      </ul>

      <h2>3. How we use personal data</h2>
      <ul>
        <li>To provide, maintain and improve the Service.</li>
        <li>To authenticate users and protect against unauthorised access.</li>
        <li>To send transactional emails (account, security, payroll alerts).</li>
        <li>To meet legal, regulatory and audit obligations.</li>
      </ul>
      <p>
        We do <strong>not</strong> sell personal data and we do not use it
        to train third-party AI models.
      </p>

      <h2>4. Lawful basis</h2>
      <p>
        We process personal data on the basis of your consent, performance
        of the contract with your organisation, or to comply with legal
        obligations.
      </p>

      <h2>5. Sharing &amp; sub-processors</h2>
      <p>
        We share personal data with vetted sub-processors who help us
        operate the Service (cloud hosting, transactional email, error
        monitoring). A current list is available on request. We do not
        share data with advertisers.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Personal data is hosted on servers located in India. Where data is
        transferred outside India, we use appropriate safeguards such as
        standard contractual clauses.
      </p>

      <h2>7. Data retention</h2>
      <p>
        We retain personal data for as long as your organisation's
        subscription is active and for 30 days after termination to allow
        export. Audit logs are retained for up to 12 months. Backup copies
        are purged on a 30-day rolling cycle.
      </p>

      <h2>8. Your rights</h2>
      <p>
        Subject to applicable law, you have the right to:
      </p>
      <ul>
        <li>access the personal data we hold about you;</li>
        <li>request correction of inaccurate data;</li>
        <li>request erasure ("right to be forgotten") subject to legal limits;</li>
        <li>withdraw consent at any time, where processing is consent-based;</li>
        <li>file a grievance with our Data Protection Officer (see § 12).</li>
      </ul>

      <h2>9. Security</h2>
      <p>
        We implement industry-standard technical and organisational
        measures: TLS 1.3 in transit, AES-256 at rest, role-based access
        control, multi-factor authentication for administrators, encrypted
        backups, and continuous audit logging.
      </p>

      <h2>10. Cookies</h2>
      <p>
        The Service uses strictly-necessary cookies for authentication and
        session management. We do not use third-party advertising cookies.
      </p>

      <h2>11. Children</h2>
      <p>
        The Service is not directed at individuals under 18. We do not
        knowingly process personal data of children.
      </p>

      <h2>12. Grievance officer / Data Protection Officer</h2>
      <p>
        Name: [Your DPO Name]<br />
        Email: <a href="mailto:dpo@example.com">dpo@example.com</a><br />
        Address: [Your Registered Address]
      </p>

      <h2>13. Changes</h2>
      <p>
        We may update this Privacy Policy from time to time. The effective
        date at the top of this page reflects the latest version. Material
        changes will be notified via email or in-product notice.
      </p>
    </LegalLayout>
  )
}
