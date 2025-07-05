import React from 'react';
import { X } from 'lucide-react';

interface TermsAndConditionsProps {
  onClose: () => void;
}

export function TermsAndConditions({ onClose }: TermsAndConditionsProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full my-8 shadow-xl relative">
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold text-white">Health Rocket Terms and Conditions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <p className="text-gray-400 text-sm">Last Updated: May 15, 2025</p>
            
            <h3 className="text-lg font-semibold text-white mt-6">1. AGREEMENT TO TERMS</h3>
            <p className="text-gray-300">
              By accessing or using the Health Rocket application ("App"), website, or any other services provided by Health Rocket Ventures LLC ("Health Rocket," "we," "us," or "our"), you agree to be bound by these Terms and Conditions. If you do not agree to these Terms, you may not access or use the App or our services.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">2. IMPORTANT DISCLAIMERS</h3>
            <h4 className="text-base font-medium text-white mt-4">2.1 Not Medical Advice</h4>
            <p className="text-gray-300">
              Health Rocket is a gamified health application designed to encourage healthy behaviors. The content, challenges, quests, and other features offered through Health Rocket are for informational and motivational purposes only and are not intended to replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with any questions you may have regarding a medical condition or before beginning any exercise, nutrition, or health program.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">2.2 No Guaranteed Results</h4>
            <p className="text-gray-300">
              While Health Rocket aims to help you add healthy years to your life through improved health behaviors, we make no guarantees regarding specific health outcomes, HealthSpan improvements, or longevity increases. Results will vary based on numerous factors outside our control, including but not limited to: individual health conditions, consistency of engagement, genetic factors, and implementation of suggested activities.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">2.3 Success Dependent on User Actions</h4>
            <p className="text-gray-300">
              Any success in health improvement depends primarily on the user's consistent implementation of healthy behaviors, not merely participation in the App. The statement "Add 20+ Years of Healthy Life" represents an aspirational goal based on scientific research about the potential impact of comprehensive health behaviors, not a guarantee of results for any individual user.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">3. ELIGIBILITY</h3>
            <p className="text-gray-300">
              You must be at least 18 years old to use Health Rocket. By using the App, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. Certain challenges, contests, or features may have additional eligibility requirements that will be specified in their respective terms.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">4. HEALTH ROCKET ACCOUNT</h3>
            <h4 className="text-base font-medium text-white mt-4">4.1 Account Creation</h4>
            <p className="text-gray-300">
              To use certain features of the App, you must create an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">4.2 Account Security</h4>
            <p className="text-gray-300">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to immediately notify Health Rocket of any unauthorized use of your account or any other breach of security.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">4.3 Community Access</h4>
            <p className="text-gray-300">
              Access to Health Rocket communities is by invitation only. You may only use valid invitation codes provided by Health Rocket or existing members. Attempting to access communities without proper authorization is prohibited.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">5. SUBSCRIPTION PLANS AND BILLING</h3>
            <h4 className="text-base font-medium text-white mt-4">5.1 Subscription Options</h4>
            <p className="text-gray-300">
              Health Rocket offers Free and Pro subscription plans. Features available with each plan are described in the App and may be updated from time to time.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">5.2 Pricing and Payment</h4>
            <p className="text-gray-300">
              Pro Plan pricing is clearly displayed before purchase. By subscribing to a Pro Plan, you authorize us to charge the payment method provided for the subscription fee at the then-current rate, plus any applicable taxes.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">5.3 Automatic Renewal</h4>
            <p className="text-gray-300">
              Unless you cancel your subscription before the end of the current billing period, your subscription will automatically renew, and your payment method will be charged for the renewal at the then-current subscription rate.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">5.4 Cancellation</h4>
            <p className="text-gray-300">
              You may cancel your subscription at any time through your account settings. Upon cancellation, you will continue to have access to Pro features until the end of your current billing period, at which point your account will revert to the Free Plan.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">5.5 No Refunds</h4>
            <p className="text-gray-300">
              Payments for Pro Plans are non-refundable except where required by applicable law. We do not provide refunds or credits for partial subscription periods or unused features.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">6. GAMIFICATION AND REWARDS</h3>
            <h4 className="text-base font-medium text-white mt-4">6.1 Fuel Points</h4>
            <p className="text-gray-300">
              Fuel Points (FP) are a virtual currency used within Health Rocket to track progress and unlock features. FP have no monetary value and cannot be exchanged for cash. We reserve the right to manage, regulate, modify, or eliminate FP at our discretion.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">6.2 Contests and Prizes</h4>
            <p className="text-gray-300">
              Certain contests within Health Rocket may offer prizes. All contests are skill-based, with winners determined by objective performance metrics. Contest participation may require Pro Plan membership and entry fees where applicable. All contests are void where prohibited by law.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">6.3 Prize Eligibility and Distribution</h4>
            <p className="text-gray-300">
              To be eligible for prizes, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Be a Pro Plan subscriber in good standing</li>
              <li>Meet any additional eligibility requirements for the specific contest</li>
              <li>Comply with all verification processes</li>
            </ul>
            <p className="text-gray-300 mt-2">
              Prize distribution is managed according to the rules specified for each contest. We reserve the right to substitute prizes of equal or greater value if necessary.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">6.4 Verification of Activity</h4>
            <p className="text-gray-300">
              We may require verification of completed activities to award FP or determine contest winners. Falsifying information or evidence of completed activities is prohibited and may result in account termination.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">7. HEALTH DATA AND PRIVACY</h3>
            <h4 className="text-base font-medium text-white mt-4">7.1 Data Collection and Use</h4>
            <p className="text-gray-300">
              Health Rocket collects and processes personal information, including health-related data, as described in our Privacy Policy. By using Health Rocket, you consent to the collection and processing of this information.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">7.2 Health Information</h4>
            <p className="text-gray-300">
              You understand that Health Rocket collects sensitive health information, including:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Self-reported health metrics</li>
              <li>HealthScore assessments</li>
              <li>Activity completion data</li>
              <li>Connected device data (where applicable)</li>
            </ul>
            <p className="text-gray-300 mt-2">
              This information is used to provide and improve our services, as described in our Privacy Policy.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">7.3 Third-Party Device Connections</h4>
            <p className="text-gray-300">
              Health Rocket may allow you to connect third-party health tracking devices. When you connect such devices, you authorize Health Rocket to access and process data from these devices according to our Privacy Policy. We are not responsible for the privacy practices or security of third-party devices or services.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">8. USER CONDUCT</h3>
            <h4 className="text-base font-medium text-white mt-4">8.1 Prohibited Activities</h4>
            <p className="text-gray-300">
              You agree not to engage in any of the following prohibited activities:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Providing false information</li>
              <li>Falsifying activity completion or verification</li>
              <li>Manipulating contests or leaderboards</li>
              <li>Using automated methods to interact with the App</li>
              <li>Attempting to access communities without proper authorization</li>
              <li>Impersonating another person or entity</li>
              <li>Engaging in any activity that could harm the App or other users</li>
              <li>Violating any applicable laws or regulations</li>
            </ul>
            
            <h4 className="text-base font-medium text-white mt-4">8.2 Community Guidelines</h4>
            <p className="text-gray-300">
              When participating in Health Rocket communities, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Treat other users with respect</li>
              <li>Refrain from posting inappropriate, offensive, or harmful content</li>
              <li>Not engage in harassment, bullying, or discriminatory behavior</li>
              <li>Not share medical advice unless you are a qualified healthcare professional</li>
              <li>Not promote products or services without authorization</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-white mt-6">9. INTELLECTUAL PROPERTY</h3>
            <h4 className="text-base font-medium text-white mt-4">9.1 Ownership</h4>
            <p className="text-gray-300">
              All content, features, and functionality of Health Rocket, including but not limited to text, graphics, logos, icons, images, audio clips, and software, are owned by Health Rocket or its licensors and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">9.2 Limited License</h4>
            <p className="text-gray-300">
              We grant you a limited, non-exclusive, non-transferable, revocable license to use Health Rocket for personal, non-commercial purposes in accordance with these Terms.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">9.3 Restrictions</h4>
            <p className="text-gray-300">
              You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Modify, adapt, or hack the App</li>
              <li>Reverse engineer, decompile, or disassemble the App</li>
              <li>Remove any copyright, trademark, or other proprietary notices</li>
              <li>Use the App for any commercial purpose</li>
              <li>Create derivative works based on the App</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-white mt-6">10. USER CONTENT</h3>
            <h4 className="text-base font-medium text-white mt-4">10.1 Ownership of User Content</h4>
            <p className="text-gray-300">
              You retain ownership of any content you submit to Health Rocket ("User Content"). By submitting User Content, you grant Health Rocket a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content for the purpose of providing and promoting our services.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">10.2 Responsibility for User Content</h4>
            <p className="text-gray-300">
              You are solely responsible for your User Content and represent that you have all rights necessary to grant the licenses described above. You further agree that your User Content will not violate any third-party rights or any applicable laws or regulations.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">11. THIRD-PARTY SERVICES</h3>
            <h4 className="text-base font-medium text-white mt-4">11.1 Third-Party Links and Services</h4>
            <p className="text-gray-300">
              Health Rocket may contain links to third-party websites or services. We are not responsible for the content or practices of these third-party sites or services, and your use of them is at your own risk.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">11.2 Partner Products and Services</h4>
            <p className="text-gray-300">
              Health Rocket may offer products or services from third-party partners. Any transactions or interactions with these partners are solely between you and the partner. We are not responsible for any aspects of these transactions or interactions.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">12. DISCLAIMER OF WARRANTIES</h3>
            <p className="text-gray-300">
              HEALTH ROCKET IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">13. LIMITATION OF LIABILITY</h3>
            <p className="text-gray-300">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HEALTH ROCKET SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>YOUR USE OR INABILITY TO USE THE APP</li>
              <li>ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS OR ANY PERSONAL INFORMATION</li>
              <li>ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE APP</li>
              <li>ANY BUGS, VIRUSES, TROJAN HORSES, OR THE LIKE THAT MAY BE TRANSMITTED TO OR THROUGH THE APP</li>
            </ul>
            <p className="text-gray-300 mt-2">
              OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE PAST 12 MONTHS.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">14. INDEMNIFICATION</h3>
            <p className="text-gray-300">
              You agree to defend, indemnify, and hold harmless Health Rocket, its officers, directors, employees, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, or debt, and expenses (including but not limited to attorney's fees) arising from your use of Health Rocket, your violation of these Terms, or your violation of any third-party rights.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">15. MODIFICATION OF TERMS</h3>
            <p className="text-gray-300">
              We reserve the right to modify these Terms at any time. If we make material changes, we will notify you through the App or by email. Your continued use of Health Rocket after such modifications constitutes your acceptance of the revised Terms.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">16. TERMINATION</h3>
            <p className="text-gray-300">
              We may terminate or suspend your account and access to Health Rocket at any time, without notice or liability, for any reason, including if you violate these Terms. Upon termination, your right to use Health Rocket will immediately cease.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">17. GOVERNING LAW AND DISPUTE RESOLUTION</h3>
            <p className="text-gray-300">
              These Terms shall be governed by the laws of [Jurisdiction], without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of Health Rocket shall be resolved through binding arbitration in accordance with the rules of [Arbitration Association], except that you may assert claims in small claims court if your claims qualify.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">18. CONTESTS AND SKILL-BASED COMPETITIONS</h3>
            <h4 className="text-base font-medium text-white mt-4">18.1 Skill-Based Nature of Contests</h4>
            <p className="text-gray-300">
              All contests offered through Health Rocket are skill-based, with winners determined by objective performance metrics related to health activities and achievements. Contest participation may require Pro Plan membership and entry fees where applicable.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">18.2 Contest Rules</h4>
            <p className="text-gray-300">
              Each contest will have specific rules regarding:
            </p>
            <ul className="list-disc pl-6 text-gray-300">
              <li>Entry requirements</li>
              <li>Performance metrics</li>
              <li>Prize structure</li>
              <li>Verification requirements</li>
              <li>Duration and deadlines</li>
            </ul>
            <p className="text-gray-300 mt-2">
              You agree to abide by all contest rules when participating.
            </p>
            
            <h4 className="text-base font-medium text-white mt-4">18.3 Legal Compliance</h4>
            <p className="text-gray-300">
              Our contests are designed to comply with applicable laws regarding skill-based competitions. Contests are void where prohibited by law. We reserve the right to modify contest structures or restrict participation in certain jurisdictions as necessary for legal compliance.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">19. ENTIRE AGREEMENT</h3>
            <p className="text-gray-300">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and Health Rocket regarding your use of the App and supersede any prior agreements.
            </p>
            
            <h3 className="text-lg font-semibold text-white mt-6">20. CONTACT INFORMATION</h3>
            <p className="text-gray-300">
              If you have any questions about these Terms, please contact us at support@healthrocket.app
            </p>
            <p className="text-gray-300">
              Health Rocket Ventures LLC
            </p>
            
            <p className="text-gray-300 mt-6 font-medium">
              By using Health Rocket, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-800 p-4 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}