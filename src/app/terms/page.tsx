import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Jeggy',
  description: 'Terms and conditions for using the Jeggy gaming platform.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Terms of Service</h1>
        <p className="text-text-muted mb-10">
          <strong className="text-text-secondary">Effective Date:</strong> March 24, 2026
        </p>

        <div className="space-y-10 text-text-secondary text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">1. Agreement to Terms</h2>
            <p className="mb-3">
              Welcome to Jeggy! These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Jeggy platform at jeggy.app (the &ldquo;Platform&rdquo;), including any content, functionality, and services offered.
            </p>
            <p>
              By accessing or using the Platform, you agree to be bound by these Terms and our <Link href="/privacy" className="text-accent-teal hover:underline">Privacy Policy</Link>. If you do not agree to these Terms, you may not access or use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">2. Eligibility</h2>
            <p className="mb-3">You must be at least 13 years old to use Jeggy. By using the Platform, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>You are at least 13 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You will comply with these Terms and all applicable laws</li>
              <li>You have not been previously banned from the Platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">3. User Accounts</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">3.1 Account Creation</h3>
            <p className="mb-3">To use certain features, you must create an account. You agree to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information to keep it accurate</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">3.2 Account Termination</h3>
            <p className="mb-3">We reserve the right to suspend or terminate your account at any time for:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Violation of these Terms</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>Extended period of inactivity</li>
              <li>At your request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">4. User Content</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.1 Your Content</h3>
            <p className="mb-4">
              You may post reviews, create lists, rate games, and share other content (&ldquo;User Content&rdquo;). You retain ownership of your User Content, but you grant Jeggy a worldwide, non-exclusive, royalty-free license to use, display, reproduce, and distribute your User Content on the Platform.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.2 Content Standards</h3>
            <p className="mb-3">You agree that your User Content will not:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights of others</li>
              <li>Contain hate speech, harassment, or threats</li>
              <li>Include spam, advertising, or self-promotion (except where explicitly allowed)</li>
              <li>Contain malicious code or viruses</li>
              <li>Include personal information of others without consent</li>
              <li>Be sexually explicit or inappropriate</li>
              <li>Impersonate others or misrepresent your affiliation</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.3 Content Moderation</h3>
            <p className="mb-4">
              We reserve the right to review, monitor, edit, or remove any User Content at our discretion, but we have no obligation to do so. We may remove content that violates these Terms without notice.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.4 Reporting Violations</h3>
            <p>
              If you believe content violates these Terms, you can report it using the report button on the Platform. We will review reported content and take appropriate action.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">5. Acceptable Use</h2>
            <p className="mb-3">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Use automated scripts, bots, or scrapers to access the Platform</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Platform&apos;s operation</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the Platform for any illegal purpose</li>
              <li>Collect or harvest user information without consent</li>
              <li>Create multiple accounts to abuse features or evade bans</li>
              <li>Manipulate ratings, reviews, or other metrics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">6. Intellectual Property</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">6.1 Platform Content</h3>
            <p className="mb-4">
              The Platform, including its design, features, graphics, and text (excluding User Content), is owned by Jeggy and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works without our permission.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">6.2 Game Data</h3>
            <p className="mb-4">
              Game information, covers, and metadata are sourced from third-party databases (e.g., IGDB) and are the property of their respective owners. We do not claim ownership of game titles, artwork, or trademarks.
            </p>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">6.3 Trademarks</h3>
            <p>&ldquo;Jeggy,&rdquo; the Jeggy logo, and other marks are trademarks of Jeggy. You may not use our trademarks without prior written permission.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">7. Third-Party Services</h2>
            <p className="mb-3">The Platform may integrate with or link to third-party services (e.g., Google for authentication, game stores). We are not responsible for:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>The availability or accuracy of third-party services</li>
              <li>Content on third-party websites</li>
              <li>Privacy practices of third parties (see their own policies)</li>
              <li>Any transactions or interactions with third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">8. Disclaimer of Warranties</h2>
            <p className="mb-3 uppercase text-xs tracking-wide text-text-muted">
              THE PLATFORM IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, INCLUDING:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-text-muted text-xs uppercase tracking-wide mb-4">
              <li>MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF CONTENT</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
              <li>SECURITY OR FREEDOM FROM VIRUSES</li>
            </ul>
            <p>We do not guarantee that the Platform will meet your requirements or that defects will be corrected.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">9. Limitation of Liability</h2>
            <p className="mb-3 uppercase text-xs tracking-wide text-text-muted">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, JEGGY AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-text-muted text-xs uppercase tracking-wide mb-4">
              <li>INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>LOSS OF PROFITS, DATA, OR GOODWILL</li>
              <li>SERVICE INTERRUPTIONS OR ERRORS</li>
              <li>USER CONTENT OR CONDUCT OF OTHER USERS</li>
              <li>UNAUTHORIZED ACCESS TO YOUR ACCOUNT</li>
            </ul>
            <p className="uppercase text-xs tracking-wide text-text-muted">
              OUR TOTAL LIABILITY SHALL NOT EXCEED $100 USD OR THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS, WHICHEVER IS GREATER.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">10. Indemnification</h2>
            <p className="mb-3">You agree to indemnify and hold harmless Jeggy, its affiliates, and their respective officers, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising out of:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Your use of the Platform</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">11. Changes to the Platform</h2>
            <p>We reserve the right to modify, suspend, or discontinue the Platform (or any part thereof) at any time, with or without notice. We will not be liable for any modification, suspension, or discontinuation of the Platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">12. Changes to Terms</h2>
            <p className="mb-3">We may update these Terms from time to time. We will notify you of significant changes by:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Posting a notice on the Platform</li>
              <li>Sending you an email</li>
              <li>Updating the &ldquo;Effective Date&rdquo; at the top</li>
            </ul>
            <p>Your continued use of the Platform after changes are posted constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Dubai, UAE.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">14. Dispute Resolution</h2>
            <p>If you have a dispute with Jeggy, you agree to first contact us and attempt to resolve the dispute informally. If we cannot resolve the dispute within 30 days, either party may pursue formal legal action.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">15. Severability</h2>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">16. Entire Agreement</h2>
            <p>These Terms, together with our <Link href="/privacy" className="text-accent-teal hover:underline">Privacy Policy</Link>, constitute the entire agreement between you and Jeggy regarding the Platform and supersede all prior agreements and understandings.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">17. Contact Us</h2>
            <p className="mb-4">If you have questions about these Terms, contact us at:</p>
            <div className="bg-bg-card border border-border rounded-sm p-5">
              <p className="mb-1.5"><strong className="text-text-primary">Email:</strong> <a href="mailto:azaankhanbiz@gmail.com" className="text-accent-teal hover:underline">azaankhanbiz@gmail.com</a></p>
              <p><strong className="text-text-primary">Platform:</strong> <Link href="/" className="text-accent-teal hover:underline">jeggy.app</Link></p>
            </div>
          </section>

          <p className="text-text-muted text-sm italic pt-4">
            By using Jeggy, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
