import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Learn how Jeggy collects, uses, and protects your personal information.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold font-[family-name:var(--font-display)] mb-2 text-text-primary">Privacy Policy</h1>
        <p className="text-text-muted mb-10">
          <strong className="text-text-secondary">Effective Date:</strong> March 24, 2026
        </p>

        <div className="space-y-10 text-text-secondary text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">1. Introduction</h2>
            <p className="mb-3">
              Welcome to Jeggy (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our gaming platform at jeggy.app (the &ldquo;Platform&rdquo;).
            </p>
            <p>
              By using Jeggy, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use the Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">2.1 Personal Information You Provide</h3>
            <p className="mb-3">We collect information that you voluntarily provide when you:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Create an account (email address, username, password)</li>
              <li>Complete your profile (display name, bio, gaming platforms, avatar)</li>
              <li>Connect social accounts (Google account information)</li>
              <li>Contact us for support</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">2.2 Information Automatically Collected</h3>
            <p className="mb-3">When you use Jeggy, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong className="text-text-primary">Usage Data:</strong> Games you rate, reviews you write, lists you create, gaming sessions you log</li>
              <li><strong className="text-text-primary">Device Information:</strong> Browser type, operating system, device type</li>
              <li><strong className="text-text-primary">Log Data:</strong> IP address, access times, pages viewed, referring URLs</li>
              <li><strong className="text-text-primary">Cookies:</strong> Authentication cookies, preference cookies (see Section 6)</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">2.3 Third-Party Authentication</h3>
            <p>
              When you sign in with Google, we receive your name, email address, and profile picture from Google. We do not receive your Google password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">3. How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Create and manage your account</li>
              <li>Provide platform features (gaming DNA analysis, taste matching, recommendations)</li>
              <li>Display your public profile, reviews, and lists</li>
              <li>Send you notifications about activity on your content</li>
              <li>Improve our services and develop new features</li>
              <li>Prevent fraud, spam, and abuse</li>
              <li>Comply with legal obligations</li>
              <li>Communicate with you about your account or our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">4. How We Share Your Information</h2>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.1 Public Information</h3>
            <p className="mb-3">
              Your profile, reviews, lists, and ratings are <strong className="text-text-primary">public by default</strong> and visible to other users and search engines. This includes:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Username and display name</li>
              <li>Profile picture and bio</li>
              <li>Game ratings and reviews</li>
              <li>Lists you create</li>
              <li>Gaming statistics and preferences</li>
              <li>Users you follow and who follow you</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.2 Service Providers</h3>
            <p className="mb-3">We share information with third-party service providers who help us operate our platform:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong className="text-text-primary">Supabase:</strong> Database hosting and authentication</li>
              <li><strong className="text-text-primary">Vercel:</strong> Website hosting and deployment</li>
              <li><strong className="text-text-primary">Upstash:</strong> Redis caching for rate limiting</li>
              <li><strong className="text-text-primary">Google:</strong> OAuth authentication</li>
            </ul>

            <h3 className="text-lg font-semibold text-text-primary mt-5 mb-2">4.3 Legal Requirements</h3>
            <p className="mb-3">We may disclose your information if required by law or if we believe it&apos;s necessary to:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Comply with legal process or government requests</li>
              <li>Enforce our Terms of Service</li>
              <li>Protect the rights, property, or safety of Jeggy, our users, or others</li>
              <li>Prevent fraud or security issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">5. Data Security</h2>
            <p className="mb-3">We implement appropriate technical and organizational measures to protect your information:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li>Passwords are hashed and never stored in plain text</li>
              <li>HTTPS encryption for all data transmission</li>
              <li>Row-level security on database tables</li>
              <li>Regular security audits and updates</li>
              <li>Rate limiting to prevent abuse</li>
            </ul>
            <p>However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">6. Cookies and Tracking</h2>
            <p className="mb-3">We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong className="text-text-primary">Essential Cookies:</strong> Keep you logged in and remember your preferences</li>
              <li><strong className="text-text-primary">Analytics:</strong> Understand how users interact with our platform (if analytics are enabled)</li>
            </ul>
            <p>You can control cookies through your browser settings, but disabling cookies may affect your ability to use certain features.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">7. Your Privacy Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 mb-4">
              <li><strong className="text-text-primary">Access:</strong> Request a copy of your personal data</li>
              <li><strong className="text-text-primary">Correction:</strong> Update or correct your information in your profile settings</li>
              <li><strong className="text-text-primary">Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong className="text-text-primary">Data Portability:</strong> Export your data in a machine-readable format</li>
              <li><strong className="text-text-primary">Opt-out:</strong> Unsubscribe from marketing communications</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:azaankhanbiz@gmail.com" className="text-accent-teal hover:underline">azaankhanbiz@gmail.com</a> or use the settings in your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">8. Data Retention</h2>
            <p className="mb-3">We retain your information for as long as your account is active or as needed to provide services. When you delete your account:</p>
            <ul className="list-disc pl-6 space-y-1.5">
              <li>Your profile and personal information are permanently deleted</li>
              <li>Your reviews and lists may remain visible but anonymized</li>
              <li>Some data may be retained in backups for up to 90 days</li>
              <li>We may retain certain information as required by law</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">9. Children&apos;s Privacy</h2>
            <p>Jeggy is not intended for users under 13 years of age. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">10. International Users</h2>
            <p>Jeggy is operated from the United Arab Emirates. If you are accessing the Platform from outside the UAE, your information may be transferred to, stored, and processed in the UAE or other countries where our service providers operate. By using Jeggy, you consent to the transfer of your information to countries outside your country of residence.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">11. Third-Party Links</h2>
            <p>Our Platform may contain links to third-party websites or services (e.g., game store pages, external game databases). We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">12. Changes to This Privacy Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Platform or sending you an email. Your continued use of Jeggy after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-text-primary border-b border-border pb-2 mb-4">13. Contact Us</h2>
            <p className="mb-4">If you have questions about this Privacy Policy or our privacy practices, contact us at:</p>
            <div className="bg-bg-card border border-border rounded-sm p-5">
              <p className="mb-1.5"><strong className="text-text-primary">Email:</strong> <a href="mailto:azaankhanbiz@gmail.com" className="text-accent-teal hover:underline">azaankhanbiz@gmail.com</a></p>
              <p><strong className="text-text-primary">Platform:</strong> <Link href="/" className="text-accent-teal hover:underline">jeggy.app</Link></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
