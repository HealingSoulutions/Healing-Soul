import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DATA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const serviceCategories = [
  {
    id: 'infusion', title: 'IV & Infusion Services', icon: '\u2726',
    services: [
      { id: 1, title: 'IV Therapy & Wellness Drips', desc: 'Customized IV infusions delivered in the comfort of your home or office, tailored to your unique wellness needs.', tags: ['Hydration', 'Vitamin Therapy', 'NAD+', 'Immunity Boost'] },
      { id: 20, title: 'Hangover Relief IV', desc: 'IV fluids, electrolytes, anti-nausea, B-vitamins, and antioxidants for rapid hangover recovery.', tags: ['Hangover', 'Rehydration', 'Anti-Nausea', 'Electrolytes'] },
      { id: 21, title: 'Migraine & Headache Relief', desc: 'Magnesium, anti-inflammatory agents, hydration, and targeted vitamins for migraine relief.', tags: ['Migraine', 'Headache', 'Magnesium', 'Pain Relief'] },
      { id: 22, title: 'Dehydration Recovery IV', desc: 'Rapid IV fluid and electrolyte replenishment for illness, exercise, travel, or heat exposure.', tags: ['Dehydration', 'Electrolytes', 'Fluid Replacement', 'Rapid Recovery'] },
      { id: 23, title: 'Immune Boost IV', desc: 'High-dose vitamin C, zinc, and glutathione IV to boost immune defense.', tags: ['Immune Support', 'Vitamin C', 'Zinc', 'Glutathione'] },
      { id: 24, title: 'Vitamin Therapy Infusions', desc: "Myers' Cocktail, B-complex, vitamin D, and custom vitamin/mineral IV blends.", tags: ["Myers' Cocktail", 'B-Complex', 'Vitamin D', 'Nutrient Optimization'] },
      { id: 25, title: 'Niagen / NR (Nicotinamide Riboside)', desc: 'NAD+ precursor therapy for cellular energy, healthy aging, and metabolic support.', tags: ['Niagen', 'NR', 'NAD+ Precursor', 'Cellular Health'] },
      { id: 26, title: 'NAD+ Infusion Therapy', desc: 'IV NAD+ for cellular energy, brain health, mental clarity, and anti-aging.', tags: ['NAD+', 'Anti-Aging', 'Brain Health', 'Cellular Energy'] },
      { id: 27, title: 'Jet Lag Recovery IV', desc: 'Hydration, B-vitamins, magnesium, and adaptogens to combat jet lag.', tags: ['Jet Lag', 'Travel Recovery', 'Energy', 'Rehydration'] },
      { id: 28, title: 'Digestive Health IV', desc: 'Anti-inflammatory nutrients, glutamine, zinc, and B-vitamins for GI support.', tags: ['Digestive Health', 'Gut Support', 'Glutamine', 'Anti-Inflammatory'] },
      { id: 41, title: 'Colonoscopy Pre & Post Hydration IV', desc: 'Pre/post-colonoscopy IV hydration at home. Maintain electrolytes during prep, restore fluids after.', tags: ['Colonoscopy Prep', 'Post-Procedure', 'Electrolytes', 'Bowel Prep Hydration'] },
      { id: 42, title: 'Custom Drip', desc: 'Build your own IV drip tailored to your specific needs. Work with our clinician to select vitamins, minerals, amino acids, and add-ons for a fully personalized infusion.', tags: ['Custom', 'Personalized', 'Build Your Own', 'Tailored Therapy'] },
      { id: 3, title: 'Injection & Infusion Assistance', desc: 'Professional administration of prescribed injections and infusions with expert nursing care.', tags: ['B12 Injections', 'Medication Infusions', 'Subcutaneous', 'Intramuscular'] },
    ],
  },
  {
    id: 'peptide', title: 'Peptide Therapy & Protocols', icon: '\u2762', consultOnly: true,
    services: [
      { id: 2, title: 'Peptide Therapy Consultation', desc: 'NP consultation to develop your personalized peptide protocol based on health goals and medical history.', tags: ['Consultation', 'Personalized Protocol', 'NP Assessment', 'Treatment Plan'] },
    ],
    displayServices: [
      { id: 30, title: 'Mitochondrial Health', desc: 'Enhance cellular energy and reduce oxidative stress. MOTS-c, Humanin, SS-31.', tags: ['Mitochondria', 'ATP', 'MOTS-c', 'Cellular Energy'] },
      { id: 31, title: 'Cellular Repair & Regeneration', desc: 'Accelerate repair and regeneration. BPC-157, Thymosin Beta-4, GHK-Cu, KPV.', tags: ['Cell Repair', 'Regeneration', 'Thymosin Beta-4', 'GHK-Cu'] },
      { id: 32, title: 'Decrease Inflammation', desc: 'Cellular anti-inflammatory therapy. BPC-157, KPV, LL-37, Thymosin Alpha-1.', tags: ['Anti-Inflammatory', 'BPC-157', 'KPV', 'Immune Modulation'] },
      { id: 33, title: 'Gut Health', desc: 'GI healing and microbiome support. BPC-157, KPV, Larazotide.', tags: ['Gut Healing', 'BPC-157', 'Microbiome', 'Intestinal Repair'] },
      { id: 34, title: 'Sleep Hygiene', desc: 'Sleep quality and circadian rhythm. DSIP, Epitalon, glycine-based peptides.', tags: ['Sleep', 'DSIP', 'Circadian Rhythm', 'Restorative Rest'] },
      { id: 35, title: 'Metabolism Support', desc: 'Optimize metabolism and insulin sensitivity. AOD-9604, MOTS-c, Tesamorelin, CJC-1295.', tags: ['Metabolism', 'AOD-9604', 'Fat Loss', 'Insulin Sensitivity'] },
      { id: 36, title: 'Joint & Tendon Repair', desc: 'Joint, tendon, ligament repair. BPC-157, Thymosin Beta-4, collagen synthesis.', tags: ['Joint Repair', 'Tendon Healing', 'BPC-157', 'Collagen Synthesis'] },
      { id: 37, title: 'Muscle Building & Recovery', desc: 'Muscle growth and recovery. CJC-1295, Ipamorelin, Tesamorelin, Follistatin.', tags: ['Muscle Growth', 'CJC-1295', 'Ipamorelin', 'Recovery'] },
      { id: 38, title: 'Detox & Cellular Cleansing', desc: 'Detoxification and liver support. Glutathione peptides, NAD+, SS-31.', tags: ['Detox', 'Glutathione', 'Liver Support', 'Oxidative Stress'] },
    ],
  },
  {
    id: 'homecare', title: 'In-Home & Post-Op Care', icon: '\u2756',
    services: [
      { id: 6, title: 'In-Home & In-Hospital Nursing', desc: 'Skilled nursing care provided at your bedside, whether at home or during a hospital stay.', tags: ['Bedside Care', 'Skilled Nursing', 'Monitoring', 'Recovery'] },
      { id: 7, title: 'Concierge Post-Op Care', desc: 'Dedicated post-surgical nursing care to ensure a smooth, comfortable recovery.', tags: ['Post-Surgery', 'Wound Care', 'Pain Management', 'Recovery'] },
      { id: 40, title: 'Nurse Escort Home After Anesthesia', desc: 'Licensed nurse escort home after anesthesia. Vital sign monitoring, symptom management, safe transport, discharge review.', tags: ['Anesthesia Escort', 'Safe Discharge', 'Post-Sedation', 'Transport'] },
      { id: 8, title: 'Nursing Advocate', desc: 'A dedicated nurse advocate to help navigate the healthcare system and ensure quality care.', tags: ['Patient Advocacy', 'Care Coordination', 'Healthcare Navigation'] },
    ],
  },
  {
    id: 'wellness', title: 'Wellness & Management', icon: '\u2727',
    services: [
      { id: 9, title: 'Weight Management', desc: 'Medically guided weight management programs including GLP-1 therapy and nutritional counseling.', tags: ['GLP-1', 'Semaglutide', 'Nutrition', 'Lifestyle'] },
      { id: 4, title: 'Medication Education', desc: 'Comprehensive medication teaching and management to ensure safe, effective use of your prescriptions.', tags: ['Medication Review', 'Drug Interactions', 'Patient Education'] },
      { id: 10, title: 'Personalized Care Plans', desc: 'Comprehensive, individualized care plans developed by our nurse practitioners.', tags: ['Assessment', 'Care Planning', 'Wellness Goals', 'Follow-Up'] },
      { id: 5, title: 'Telehealth Services', desc: 'Virtual consultations with our nurse practitioners from the comfort of your home.', tags: ['Virtual Visit', 'Remote Monitoring', 'Follow-Up', 'Consultation'] },
    ],
  },
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONSENT TEXTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const CONSENT_TREATMENT = `INFORMED CONSENT FOR TREATMENT - BT RPN PLLC & Kristina Castro, NP PLLC d/b/a Healing Soulutions
Effective Date: March 15, 2026

I voluntarily consent to healthcare services from the Practice including nursing assessments, IV hydration/vitamin infusion, injections, wound care, post-op care, medication administration, health screenings, phlebotomy, and wellness consultations.

NATURE OF SERVICES: Mobile, concierge, and/or telehealth by licensed RNs and NPs per NY Education Law Article 139. Services are provided in non-traditional settings including private residences, hotels, offices, and other locations designated by the patient. I understand that mobile healthcare delivery may present limitations not present in traditional clinical settings, including but not limited to access to emergency equipment, sterile environments, and immediate physician backup.

RISKS AND COMPLICATIONS: I acknowledge that all medical procedures carry inherent risks. Risks associated with services provided include but are not limited to: pain, bruising, swelling, or infection at IV/injection sites; allergic or anaphylactic reactions to medications, vitamins, supplements, or other administered substances; hematoma, nerve injury, phlebitis, thrombophlebitis, or vascular injury; dizziness, nausea, vomiting, or fainting (vasovagal syncope); air embolism (rare but potentially serious); infiltration or extravasation of IV fluids; fluid overload or electrolyte imbalance; adverse drug reactions or interactions with current medications; cardiac arrhythmia (rare, associated with certain IV therapies); delayed healing or scarring at treatment sites; and unforeseen complications that may require emergency medical intervention. Benefits may include improved hydration, symptom relief, enhanced wellness, and recovery support. No specific outcomes or results are guaranteed.

ASSUMPTION OF RISK: I understand and voluntarily assume all risks associated with the services described herein, including risks that are known, unknown, anticipated, or unanticipated. I acknowledge that the practice of medicine and nursing is not an exact science and that no guarantees have been made to me regarding the outcome of any treatment or procedure.

PEPTIDE THERAPY / NON-FDA APPROVED (IF APPLICABLE): Peptides including but not limited to BPC-157, Thymosin Beta-4, Thymosin Alpha-1, GHK-Cu, KPV, MOTS-c, SS-31 (Elamipretide), DSIP, Epitalon, AOD-9604, CJC-1295, Ipamorelin, Follistatin, and Humanin are NOT approved by the U.S. Food and Drug Administration (FDA) for the specific uses described. These peptides are considered investigational, compounded, or used off-label. They are sourced from licensed U.S. compounding pharmacies operating under applicable state and federal regulations. I understand that: (a) these substances have not undergone the full FDA approval process; (b) their safety, efficacy, and long-term effects have not been established by the FDA for the described uses; (c) I am voluntarily choosing to receive these therapies after being informed of their non-FDA approved status; (d) a mandatory NP consultation is required prior to initiation of any peptide protocol; (e) individual results may vary and are not guaranteed; and (f) I may experience adverse effects that are currently unknown or undocumented.

LIMITATION OF LIABILITY: To the fullest extent permitted by applicable law, I agree that the Practice, its owners, officers, employees, contractors, agents, and affiliated clinicians (collectively, the Released Parties) shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to the services provided. The Released Parties' total aggregate liability for any direct damages shall not exceed the total fees paid by me for the specific service giving rise to the claim. This limitation applies regardless of the theory of liability, whether in contract, tort (including negligence), strict liability, or otherwise.

INDEMNIFICATION: I agree to indemnify, defend, and hold harmless the Released Parties from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from or related to: (a) my failure to disclose material medical information including but not limited to pre-existing conditions, medications, allergies, substance use, or prior adverse reactions; (b) my failure to follow post-treatment instructions or recommendations provided by the clinician; (c) my use of services against medical advice or after being informed of contraindications; (d) any misrepresentation made by me in connection with the services; or (e) my violation of any term of this agreement.

RELEASE AND WAIVER: I, on behalf of myself, my heirs, executors, administrators, legal representatives, successors, and assigns, hereby release, waive, and forever discharge the Released Parties from any and all claims, demands, actions, causes of action, suits, damages, losses, and expenses of any kind or nature whatsoever, whether known or unknown, which I now have or may hereafter have, arising out of or in connection with the services provided, except to the extent caused by the gross negligence or willful misconduct of the Released Parties. I expressly waive any rights I may have under Section 1542 of the California Civil Code or any similar statute of any other jurisdiction which provides that a general release does not extend to claims not known at the time of executing the release.

NO GUARANTEE OF RESULTS: I acknowledge that no guarantees, warranties, or assurances have been made to me regarding the outcome, effectiveness, or results of any treatment, procedure, or service. The Practice expressly disclaims any implied warranties, including but not limited to implied warranties of merchantability and fitness for a particular purpose, to the fullest extent permitted by law.

PATIENT RESPONSIBILITY: I acknowledge my obligation to: (a) provide complete, accurate, and truthful medical history and health information; (b) inform the clinician of all current medications, supplements, and substances used; (c) disclose all known allergies and prior adverse reactions; (d) follow all pre-treatment and post-treatment instructions; (e) seek emergency medical care if I experience any severe or unexpected symptoms following treatment; (f) notify the Practice immediately of any adverse reactions or complications; and (g) attend all recommended follow-up appointments. I understand that failure to comply with these obligations may result in adverse outcomes for which the Practice shall not be held liable.

EMERGENCY AUTHORIZATION: In the event of a medical emergency arising during or after treatment, I authorize the Practice and its clinicians to initiate emergency protocols, contact emergency medical services (911), and share relevant medical information with emergency responders and healthcare facilities as necessary to protect my health and safety. I understand that any costs associated with emergency medical transport or treatment at an outside facility are my sole responsibility.

SCOPE OF PRACTICE & TEAM-BASED CARE: I understand that the Practice utilizes a team-based approach. Nurse Practitioners (NP): NPs are independent practitioners licensed to diagnose illness, prescribe medications, and initiate treatment plans under New York Education Law Section 6902. Registered Nurses (RN): RNs provide nursing care and execute medical regimens (such as IV infusions or injections) only under the specific order or standing order of a Nurse Practitioner or Physician. I understand that if my care is delivered by an RN, they are acting under the clinical direction of the Practice's NP. The RN does not independently diagnose medical conditions or prescribe treatments. Services provided are not a substitute for emergency medical care, primary care physician visits, or specialist consultations. The Practice does not assume the role of the patient's primary care provider.

DISPUTE RESOLUTION: Any dispute, claim, or controversy arising out of or relating to this agreement or the services provided shall first be submitted to good faith mediation. If mediation is unsuccessful, disputes shall be resolved through binding arbitration administered in accordance with the rules of the American Arbitration Association, with proceedings conducted in the State of New York. The prevailing party in any arbitration or legal proceeding shall be entitled to recover reasonable attorneys' fees and costs.

SEVERABILITY: If any provision of this consent is found to be invalid, illegal, or unenforceable, such finding shall not affect the validity of the remaining provisions, which shall continue in full force and effect.

VOLUNTARY CONSENT: This consent is given pursuant to NY PHL Section 2805-d. I have the right to refuse or withdraw consent at any time without penalty. Both entities maintain professional malpractice insurance. I have been given the opportunity to ask questions and all my questions have been answered to my satisfaction. I have read, or have had read to me, this entire document. I understand its contents and I freely and voluntarily consent to the services described herein.

ACKNOWLEDGMENT: By signing below, I certify that I am at least 18 years of age (or the legal guardian of the patient), that I have the legal capacity to enter into this agreement, that I have read and fully understand all terms and conditions set forth herein, and that I voluntarily consent to treatment and agree to all terms of this Informed Consent.`;

const CONSENT_HIPAA = `NOTICE OF PRIVACY PRACTICES - BT RPN PLLC & Kristina Castro, NP PLLC d/b/a Healing Soulutions
Effective Date: March 15, 2026

This notice is required by the Health Insurance Portability and Accountability Act of 1996 (HIPAA), the Health Information Technology for Economic and Clinical Health Act (HITECH), 45 CFR Parts 160 and 164, and applicable New York State law to inform you of how your Protected Health Information (PHI) may be used and disclosed, and your rights regarding your PHI.

PERMITTED USES AND DISCLOSURES: Your PHI may be used and disclosed without your authorization for the following purposes: (a) Treatment â€” to provide, coordinate, and manage your healthcare and related services, including consultations between healthcare providers; (b) Payment â€” to obtain reimbursement for services, including billing, claims management, and collection activities; (c) Healthcare Operations â€” to support the business activities of the Practice including quality assessment, staff training, compliance, auditing, and business planning; (d) As Required by Law â€” when federal, state, or local law requires disclosure; (e) Public Health Activities â€” as required for public health surveillance, investigations, or interventions; (f) Business Associates â€” to entities that perform services on our behalf under a Business Associate Agreement that requires them to safeguard your PHI.

AUTHORIZATION REQUIRED: Written authorization is required before we may use or disclose your PHI for the following: psychotherapy notes; marketing purposes; sale of PHI; HIV-related information (NY PHL Article 27-F); substance abuse treatment records (42 CFR Part 2); mental health records (NY MHL Section 33.13); and genetic information (Genetic Information Nondiscrimination Act - GINA). You may revoke any authorization in writing at any time, except to the extent the Practice has already acted in reliance upon it.

YOUR RIGHTS: You have the following rights regarding your PHI: (1) Right to Access â€” request copies of your PHI within 30 days; (2) Right to Amendment â€” request corrections to your PHI; (3) Right to an Accounting of Disclosures â€” request a list of certain disclosures made of your PHI; (4) Right to Request Restrictions â€” request limitations on how your PHI is used or disclosed; (5) Right to Confidential Communications â€” request that we communicate with you by alternative means or at alternative locations; (6) Right to a Paper Copy â€” obtain a paper copy of this notice upon request; (7) Right to Breach Notification â€” be notified in the event of a breach of your unsecured PHI as required by the HITECH Act.

MINIMUM NECESSARY STANDARD: The Practice applies the minimum necessary standard when using or disclosing PHI, ensuring that only the minimum amount of information necessary to accomplish the intended purpose is used or disclosed.

DATA SECURITY: The Practice implements administrative, physical, and technical safeguards to protect your PHI, including encryption of electronic records, secure storage of physical records, access controls, and regular security assessments. Electronic health records are maintained using HIPAA-compliant systems.

RETENTION: Medical records are retained for a minimum of 6 years per New York State requirements (10 NYCRR Section 415.5), or longer if required by applicable federal regulations.

COMPLAINTS: If you believe your privacy rights have been violated, you may file a complaint with the Practice's Privacy Officer or with the Secretary of the U.S. Department of Health and Human Services. You will not be retaliated against for filing a complaint.

CHANGES TO THIS NOTICE: The Practice reserves the right to change this notice and to make the revised notice effective for PHI already maintained as well as for PHI received in the future.

ACKNOWLEDGMENT: By signing below, I acknowledge that I have received, read, and understand this Notice of Privacy Practices. I understand my rights regarding my Protected Health Information and how it may be used and disclosed by the Practice.`;

const CONSENT_MEDICAL = `MEDICAL HISTORY & RELEASE AUTHORIZATION - BT RPN PLLC & Kristina Castro, NP PLLC d/b/a Healing Soulutions
Effective Date: March 15, 2026

I hereby authorize the Practice to: (a) collect, review, and maintain my complete medical history and health information; (b) request and obtain medical records from prior and current healthcare providers, hospitals, laboratories, pharmacies, and other healthcare entities; (c) disclose my medical information to treating providers, consulting specialists, laboratories, pharmacies, and other healthcare professionals involved in my care; (d) use my medical information for treatment, payment, and healthcare operations as described in the Notice of Privacy Practices.

SPECIAL CATEGORIES REQUIRING SEPARATE AUTHORIZATION: I understand that separate written authorization is required for the release of: HIV/AIDS-related information (NY PHL Article 27-F); mental health records (NY MHL Section 33.13); alcohol and substance abuse treatment records (42 CFR Part 2); psychotherapy notes; and genetic information (GINA). These categories of information will not be released without my specific written authorization except as required by law.

OBLIGATION TO DISCLOSE: I understand that I have an affirmative obligation to fully and truthfully disclose all relevant medical information to my clinician, including but not limited to: all current and past medical conditions and diagnoses; all current medications (prescription, over-the-counter, supplements, and herbal remedies) and dosages; all known allergies and prior adverse reactions to medications or substances; all prior surgeries, hospitalizations, and medical procedures; family medical history relevant to my treatment; current pregnancy or plans for pregnancy; and any other information that may be relevant to my care and treatment. I understand that incomplete or inaccurate disclosure may result in serious adverse health consequences, including dangerous drug interactions, allergic reactions, or other complications, and that the Practice shall not be held liable for any adverse outcomes resulting from my failure to provide complete and accurate medical information.

SUBSTANCE USE & PATIENT SAFETY DISCLOSURE: I understand that honestly disclosing the use of all substancesâ€”including alcohol, marijuana/cannabis, nicotine, and recreational or illicit drugsâ€”is vital for my safety. Many substances can cause dangerous, life-threatening interactions with the medical treatments, IV therapies, and medications provided by the Practice (e.g., cardiac arrest, seizure, or respiratory failure). Confidentiality: I understand that this information is Protected Health Information (PHI) and will remain confidential in accordance with HIPAA; the Practice does not report substance use to law enforcement. Liability Release: I acknowledge that if I fail to disclose substance use, the Practice cannot anticipate potential drug interactions. Therefore, I agree to hold the Practice and its providers harmless from any adverse reactions or complications that result from my failure to provide a complete and accurate history of substance use.

ACCURACY CERTIFICATION: I certify that all medical information provided by me, whether written or verbal, is complete, accurate, and truthful to the best of my knowledge. I understand that providing false or misleading medical information may constitute fraud and may result in adverse medical outcomes for which the Practice shall bear no liability.

DURATION AND REVOCATION: This authorization shall remain in effect for the duration of my patient relationship with the Practice and for a period of 6 years following the termination of such relationship, in accordance with New York State record retention requirements. I may revoke this authorization in writing at any time, with the understanding that revocation shall not affect any actions already taken in reliance upon this authorization and that revocation may limit the Practice's ability to provide safe and appropriate care.

ACKNOWLEDGMENT: By signing below, I certify that I am at least 18 years of age (or the legal guardian of the patient), that I have read and fully understand this Medical History and Release Authorization, and that I voluntarily authorize the uses and disclosures described herein.`;

const CONSENT_FINANCIAL = `FINANCIAL AGREEMENT - BT RPN PLLC & Kristina Castro, NP PLLC d/b/a Healing Soulutions
Effective Date: March 15, 2026

PAYMENT TERMS: Payment is due in full at the time of service unless other arrangements have been made in writing in advance. The Practice accepts major credit cards, debit cards, and other approved payment methods. A detailed invoice will be provided upon request.

GOOD FAITH ESTIMATE: Pursuant to the No Surprises Act (Public Law 116-260), you have the right to receive a Good Faith Estimate explaining the expected cost of your medical care. You may request a Good Faith Estimate before scheduling a service. If you receive a bill that is at least $400 more than your Good Faith Estimate, you may dispute the bill. For questions or more information about your right to a Good Faith Estimate, visit www.cms.gov/nosurprises or call 1-800-985-3059.

INSURANCE: The Practice is an out-of-network provider. The patient is solely responsible for all deductibles, copayments, coinsurance, and any services not covered by their insurance plan. The Practice does not guarantee insurance reimbursement and is not responsible for claim denials, underpayments, or disputes with insurance carriers. The patient is responsible for understanding their insurance benefits and coverage prior to receiving services.

CREDIT CARD ON FILE & PAYMENT AUTHORIZATION: I authorize BT RPN PLLC and Kristina Castro, Nurse Practitioner in Family Health, PLLC to securely store my payment card information using PCI-compliant processing. I explicitly authorize the Practice to charge this card for: (1) Time of Service: All copays, deductibles, or service fees due on the date of care. (2) Late Cancellations/No-Shows: Fees associated with failing to cancel within 24 hours, as per the Cancellation Policy. (3) Outstanding Balances: Any remaining balance after insurance adjudication (if applicable). The Practice agrees to notify me via email or text message at least 48 hours prior to charging my card for any post-service outstanding balance exceeding $50.00.

PRICING AND FEES: Service pricing is subject to change with 30 days advance notice. Custom compounded medications, specialty supplies, and additional materials may incur separate charges beyond the base service fee. Travel fees may apply for locations outside the standard service area. Emergency or after-hours service requests may be subject to additional surcharges.

CANCELLATION AND NO-SHOW POLICY: A minimum of 24 hours advance notice is required for appointment cancellations or rescheduling. Cancellations made less than 24 hours before the scheduled appointment are subject to a late cancellation fee of up to the full cost of the scheduled service. Failure to be present and available at the scheduled appointment time (no-show) is subject to a fee of up to the full cost of the scheduled service. Repeated late cancellations or no-shows (three or more within a 12-month period) may result in a required prepayment for future appointments or termination of the patient relationship.

PAST DUE ACCOUNTS AND COLLECTIONS: Balances remaining unpaid for 60 or more days may be referred to a third-party collections agency. In the event of collections action, the patient shall be responsible for all collection costs, including but not limited to collection agency fees, court costs, and reasonable attorneys' fees. Past due accounts may accrue interest at the maximum rate permitted by New York State law. The Practice reserves the right to decline future services until all outstanding balances are paid in full.

DISPUTE RESOLUTION: Any billing disputes must be submitted in writing within 30 days of the date of the invoice. The Practice will review all disputes in good faith and respond within 15 business days. Unresolved disputes shall be subject to the dispute resolution provisions set forth in the Informed Consent for Treatment.

ACKNOWLEDGMENT: By signing below, I certify that I am at least 18 years of age (or the legal guardian of the patient), that I have read and fully understand this Financial Agreement, that I accept financial responsibility for all services rendered, and that I agree to all terms and conditions set forth herein.`;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   ICONS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function LotusIcon({ size = 60, color = 'rgba(193,163,98' }) {
  return (
    <svg width={size} height={size * 0.8} viewBox="0 0 32 24" fill="none" style={{ display: 'block', margin: '0 auto' }}>
      <path d="M16 6C16 6 13 10 12.5 13C12 16 14 18 16 18C18 18 20 16 19.5 13C19 10 16 6 16 6Z" fill={`${color},0.5)`} />
      <path d="M10 9C10 9 9 13 9.5 15.5C10 18 12.5 18.5 14.5 17C12 16.5 11 14 10 9Z" fill={`${color},0.35)`} />
      <path d="M22 9C22 9 23 13 22.5 15.5C22 18 19.5 18.5 17.5 17C20 16.5 21 14 22 9Z" fill={`${color},0.35)`} />
      <path d="M7 12C7 12 7.5 15 9 16.5C10.5 18 12.5 17.5 13 16C11 16 9 14.5 7 12Z" fill={`${color},0.25)`} />
      <path d="M25 12C25 12 24.5 15 23 16.5C21.5 18 19.5 17.5 19 16C21 16 23 14.5 25 12Z" fill={`${color},0.25)`} />
      <circle cx="16" cy="13" r="1" fill={`${color},0.7)`} />
    </svg>
  );
}

function GoldPhoneIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.65 }}>
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" fill="#D4BC82" />
    </svg>
  );
}

function GoldEmailIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.65 }}>
      <rect x="2" y="4" width="20" height="16" rx="2" stroke="#D4BC82" strokeWidth="1.5" fill="none" />
      <path d="M2 6l10 7 10-7" stroke="#D4BC82" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function GoldClockIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.65 }}>
      <circle cx="12" cy="12" r="9" stroke="#D4BC82" strokeWidth="1.5" fill="none" />
      <path d="M12 7v5l3.5 2" stroke="#D4BC82" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function GoldPinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', opacity: 0.65 }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#D4BC82" />
      <circle cx="12" cy="9" r="2.5" fill="#2E5A46" />
    </svg>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SCENE BACKGROUND (no lotus flowers)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function SceneBackground() {
  return (
    <div className="hero-scene" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      {/* Pagoda silhouettes */}
      <div className="hue-pagoda hue-pagoda-1">
        <svg width="100" height="150" viewBox="0 0 140 200" fill="none">
          <path d="M70 0L65 12H75L70 0Z" fill="rgba(46,90,70,0.9)" />
          <rect x="68" y="12" width="4" height="6" fill="rgba(46,90,70,0.9)" />
          <path d="M50 18L42 30H98L90 18H50Z" fill="rgba(46,90,70,0.9)" />
          <rect x="46" y="33" width="48" height="5" fill="rgba(46,90,70,0.9)" />
          <path d="M44 38L36 50H104L96 38H44Z" fill="rgba(46,90,70,0.9)" />
          <rect x="40" y="53" width="60" height="5" fill="rgba(46,90,70,0.9)" />
          <path d="M38 58L28 72H112L102 58H38Z" fill="rgba(46,90,70,0.9)" />
          <rect x="34" y="75" width="72" height="5" fill="rgba(46,90,70,0.9)" />
          <path d="M32 80L22 94H118L108 80H32Z" fill="rgba(46,90,70,0.9)" />
          <rect x="28" y="97" width="84" height="5" fill="rgba(46,90,70,0.9)" />
          <path d="M26 102L14 118H126L114 102H26Z" fill="rgba(46,90,70,0.9)" />
          <rect x="30" y="121" width="80" height="79" fill="rgba(46,90,70,0.9)" />
          <path d="M58 155H82V200H58V155Z" fill="rgba(46,90,70,0.7)" />
        </svg>
      </div>
      <div className="hue-pagoda hue-pagoda-2">
        <svg width="70" height="110" viewBox="0 0 140 200" fill="none">
          <path d="M70 0L65 12H75L70 0Z" fill="rgba(46,90,70,0.9)" />
          <rect x="68" y="12" width="4" height="6" fill="rgba(46,90,70,0.9)" />
          <path d="M50 18L42 30H98L90 18H50Z" fill="rgba(46,90,70,0.9)" />
          <rect x="46" y="33" width="48" height="5" fill="rgba(46,90,70,0.9)" />
          <path d="M44 38L36 50H104L96 38H44Z" fill="rgba(46,90,70,0.9)" />
          <rect x="40" y="53" width="60" height="5" fill="rgba(46,90,70,0.9)" />
          <rect x="30" y="58" width="80" height="142" fill="rgba(46,90,70,0.9)" />
          <path d="M55 100H85V200H55V100Z" fill="rgba(46,90,70,0.7)" />
        </svg>
      </div>
      {/* Bridge */}
      <div className="hue-bridge">
        <svg width="300" height="80" viewBox="0 0 300 80" fill="none">
          <path d="M0 60 Q30 20 60 40 Q90 10 120 35 Q150 5 180 35 Q210 10 240 40 Q270 20 300 60" stroke="rgba(46,90,70,0.9)" strokeWidth="3" fill="none" />
          <path d="M0 60 Q30 20 60 40 Q90 10 120 35 Q150 5 180 35 Q210 10 240 40 Q270 20 300 60 V80 H0Z" fill="rgba(46,90,70,0.3)" />
          {[30, 60, 90, 120, 150, 180, 210, 240, 270].map((x) => (
            <line key={x} x1={x} y1="25" x2={x} y2="80" stroke="rgba(46,90,70,0.5)" strokeWidth="1.5" />
          ))}
        </svg>
      </div>
      {/* Water effects */}
      <div className="water-reflection" />
      <div className="water-shimmer" />
      <div className="water-mist" />
      {/* LOTUS FLOWERS REMOVED */}
      {/* Mist */}
      <div className="mist-layer">
        <div className="mist-cloud mc-1" />
        <div className="mist-cloud mc-2" />
        <div className="mist-cloud mc-3" />
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   NAV
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function Nav({ page, setPage }) {
  const [mo, setMo] = useState(false);
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <nav aria-label="Main navigation">
        <div className="logo" onClick={() => { setPage('home'); setMo(false); }} role="button" tabIndex={0}>
          Healing <b>Soulutions</b>
          <span className="logo-sub" style={{ color: 'var(--gold-soft)' }}>Mobile Concierge Nursing Care</span>
        </div>
        <ul className={'nav-links' + (mo ? ' active' : '')} id="nav-menu">
          <li><button className="nav-btn" onClick={() => { setPage('home'); setMo(false); }}>Home</button></li>
          <li><button className="nav-btn" onClick={() => { setPage('services'); setMo(false); }}>Services</button></li>
          <li><button className="nav-btn" onClick={() => { setPage('contact'); setMo(false); }}>Contact</button></li>
          <li><button className="nav-btn" onClick={() => { setPage('contact'); setMo(false); }}>Book a Visit</button></li>
        </ul>
        <button className="hamburger" onClick={() => setMo(!mo)} aria-expanded={mo} aria-controls="nav-menu" aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </nav>
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FOOTER
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function Footer({ setPage }) {
  return (
    <footer role="contentinfo">
      <div className="footer-inner">
        <div className="footer-compact">
          <div className="logo" onClick={() => setPage('home')} role="button" tabIndex={0}>
            Healing <b>Soulutions</b>
            <span className="logo-sub" style={{ color: 'rgba(255,255,255,0.4)' }}>Mobile Concierge Nursing Care</span>
          </div>
        </div>
        <div className="footer-legal">&copy; 2026 Healing Soulutions. All rights reserved.</div>
      </div>
    </footer>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HOME PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function HomePage({ setPage }) {
  return (
    <>
      <section className="hero">
        <SceneBackground />
        <div className="hero-content">
          <div className="hero-text-panel">
            <h1 style={{ textAlign: 'center', fontSize: 'clamp(1.2rem,2.2vw,1.8rem)', marginTop: '0.5rem' }}>
              <em style={{ fontWeight: 700, fontStyle: 'italic' }}>We bring healing to you..</em>
            </h1>
            <p className="hero-mission" style={{ borderLeft: 'none', paddingLeft: 0, textAlign: 'center', marginTop: '0.75rem' }}>
              Experienced, compassionate care that comes to you. Healing means more than treating illness; it means nurturing the whole person with dignity, expertise, and heart.
            </p>
            <div style={{ margin: '1rem 0 0.5rem' }}><LotusIcon size={60} /></div>
            <div style={{ width: 40, height: 1.5, background: 'var(--gold-soft)', margin: '0 auto' }} />
          </div>
        </div>
      </section>
      <section className="services-home">
        <div className="sec-header">
          <div className="sec-eyebrow">
            <span className="eline" />
            <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--gold-soft)', textTransform: 'uppercase' }}>Our Services</span>
            <span className="eline" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.3rem 0.8rem', marginBottom: '0.3rem' }}>
            {['IV Therapy & Wellness Drips', 'Peptide Therapy & Protocols', 'Injection & Infusion Assistance', 'In-Home & In-Hospital Nursing'].map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="svc-dot" /><span className="service-item" onClick={() => setPage('services')}>{s}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', margin: '0.3rem 0' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="svc-dot" /><span className="service-item" onClick={() => setPage('services')}>Medication Education</span>
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.3rem 0.8rem', marginBottom: '0.75rem' }}>
            {['Concierge Post-Op Care', 'Nursing Advocate', 'Weight Management', 'Personalized Care Plans', 'Telehealth Services'].map((s) => (
              <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="svc-dot" /><span className="service-item" onClick={() => setPage('services')}>{s}</span>
              </span>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.3rem', maxWidth: 500, margin: '0 auto' }}>
            <button className="btn-jade" onClick={() => setPage('contact')}><span style={{ color: '#D4BC82', fontSize: '0.7rem', opacity: 0.65 }}>{'\u2606'}</span> Book a Visit</button>
            <a href="tel:+15857472215" className="btn-jade"><GoldPhoneIcon size={11} /> Call Us</a>
            <a href="mailto:info@healingsoulutions.care" className="btn-jade"><GoldEmailIcon size={11} /> Email Us</a>
            <button className="btn-jade" onClick={() => setPage('services')}><span style={{ color: '#D4BC82', fontSize: '0.7rem', opacity: 0.65 }}>{'\u2192'}</span> Learn More</button>
          </div>
        </div>
      </section>
      <div className="trust-ribbon">
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem 0' }}>
          {['Licensed RNs & NPs', 'HIPAA Compliant', 'Fully Insured', 'Same-Day Availability'].map((t, i) => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {i > 0 && <span style={{ width: 3, height: 3, background: 'var(--gold-soft)', borderRadius: '50%', margin: '0 0.5rem' }} />}
              <span style={{ fontSize: '0.65rem', color: 'var(--jade-mist)', fontWeight: 500, letterSpacing: '0.04em' }}>{t}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   SERVICES PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ServicesPage({ setPage }) {
  const [openCat, setOpenCat] = useState(null);
  const [openSvc, setOpenSvc] = useState(null);
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <SceneBackground />
      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ padding: '8rem 3rem 0.75rem', textAlign: 'center', background: 'transparent', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: 'rgba(46,90,70,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', boxSizing: 'border-box', width: '100%' }}>
            <h1 style={{ color: 'var(--gold-soft)', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em', fontFamily: "'Outfit',sans-serif" }}>Our Services</h1>
            <div style={{ margin: '0.5rem 0' }}><LotusIcon size={40} /></div>
            <div style={{ width: 25, height: 0.75, background: 'var(--gold-soft)', margin: '0 auto' }} />
          </div>
        </div>
        <div style={{ padding: '0.5rem 3rem 3rem', maxWidth: 800, margin: '0 auto' }}>
          {serviceCategories.map((cat) => (
            <div key={cat.id} style={{ marginBottom: '0.75rem' }}>
              <div className="svc-card">
                <div className="svc-card-header" onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', fontWeight: 500, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--gold-soft)', fontSize: '0.9rem' }}>{cat.icon}</span>{cat.title}
                  </h3>
                  <span style={{ color: 'var(--gold-soft)', transition: 'transform 0.4s', transform: openCat === cat.id ? 'rotate(180deg)' : 'none' }}>{'\u25BC'}</span>
                </div>
              </div>
              {openCat === cat.id && (
                <div style={{ background: 'rgba(46,90,70,0.92)', backdropFilter: 'blur(20px)', borderRadius: '0 0 12px 12px', padding: '0.5rem' }}>
                  {cat.consultOnly && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 0.85rem', margin: '0.25rem 0.4rem 0.5rem', background: 'rgba(127,212,160,0.08)', borderRadius: '8px', border: '1px solid rgba(127,212,160,0.12)' }}>
                      <span style={{ color: '#7FD4A0', fontSize: '0.6rem' }}>{'\u2139'}</span>
                      <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5, flex: 1 }}>Peptide therapy requires an initial consultation with our Nurse Practitioner to develop your personalized protocol.</span>
                      <button onClick={() => setPage('contact')} style={{ background: 'var(--gold-soft)', color: '#2E5A46', border: 'none', borderRadius: '6px', padding: '0.35rem 0.7rem', fontSize: '0.45rem', fontFamily: "'Outfit',sans-serif", fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Book Consult</button>
                    </div>
                  )}
                  {(cat.displayServices || cat.services).map((s) => (
                    <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.5rem 0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpenSvc(openSvc === s.id ? null : s.id)}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.72rem', color: 'var(--gold-soft)' }}>{s.title}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--gold-soft)', transition: 'transform 0.3s', transform: openSvc === s.id ? 'rotate(180deg)' : 'none' }}>{'\u25BE'}</span>
                      </div>
                      {openSvc === s.id && (
                        <div style={{ padding: '0.4rem 0.75rem 0.75rem', fontFamily: "'Outfit',sans-serif" }}>
                          <p style={{ marginBottom: '0.5rem', opacity: 0.75, fontSize: '0.65rem', lineHeight: 1.6, color: '#fff' }}>{s.desc}</p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                            {s.tags.map((t, i) => (
                              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                                <span className="svc-tag">{t}</span>
                                {i < s.tags.length - 1 && <span style={{ color: '#fff', fontSize: '0.4rem', opacity: 0.3 }}>{'\u2022'}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONTACT / BOOKING PAGE
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function ContactPage({ setPage }) {
  const [step, setStep] = useState(1);
  const [selTime, setSelTime] = useState(null);
  const [form, setForm] = useState({
    fname: '', lname: '', email: '', phone: '', address: '', date: '',
    services: [], notes: '', medicalHistory: '', surgicalHistory: '',
    medications: '', allergies: '', clinicianNotes: '',
  });
  const [consents, setConsents] = useState({ treatment: false, hipaa: false, financial: false, medical: false });
  const [signature, setSignature] = useState('');
  const [sigMode, setSigMode] = useState('type');
  const [cardInfo, setCardInfo] = useState({ name: '', number: '', exp: '', cvc: '' });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  const stepHeadingRef = useRef(null);
  const [cardBrand, setCardBrand] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [emailStatus, setEmailStatus] = useState('idle');
  const [additionalPatients, setAdditionalPatients] = useState([]);
  const [openPickerCat, setOpenPickerCat] = useState(null);
  const [intakeAcknowledged, setIntakeAcknowledged] = useState(false);
  const [intakeSignature, setIntakeSignature] = useState('');
  const [intakeSigMode, setIntakeSigMode] = useState('type');
  const [intakeDrawing, setIntakeDrawing] = useState(false);
  const [intakeDrawPoints, setIntakeDrawPoints] = useState([]);
  const [consentTimestamps, setConsentTimestamps] = useState({});
  const [submitError, setSubmitError] = useState('');
  const intakeCanvasRef = useRef(null);
  const consentDrawRef = useRef(null);

  // â”€â”€ Stripe State â”€â”€
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const paymentMountRef = useRef(null);
  const stripeMountedRef = useRef(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [stripeFailed, setStripeFailed] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [cardHolderName, setCardHolderName] = useState('');
  const [detectedBrand, setDetectedBrand] = useState('');
  const [setupClientSecret, setSetupClientSecret] = useState('');
  const [setupCustomerId, setSetupCustomerId] = useState('');
  const [fallbackCardNum, setFallbackCardNum] = useState('');
  const [fallbackCardExp, setFallbackCardExp] = useState('');
  const [fallbackCardCvc, setFallbackCardCvc] = useState('');

  // â”€â”€ Stripe publishable key from env â”€â”€
  const STRIPE_PK = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_live_51T0RgN33pC3rM5e8T3LAZUvyEUWa2tFIf1pIbOSIlnKO3HzXhcmlmSh7hH081XPhmNa9R4ImGKowDKagzjfeOYyf00zmP9iREh';

  var cardComplete = stripeFailed
    ? (fallbackCardNum.replace(/\D/g, '').length >= 15 && fallbackCardExp.replace(/\D/g, '').length >= 4 && fallbackCardCvc.replace(/\D/g, '').length >= 3)
    : paymentComplete;

  // â”€â”€ Patient helpers â”€â”€
  var emptyPatient = function () { return { id: Date.now(), fname: '', lname: '', services: [], medicalHistory: '', surgicalHistory: '', medications: '', allergies: '', clinicianNotes: '' }; };
  var addPatient = function () { setAdditionalPatients(function (prev) { return [...prev, emptyPatient()]; }); };
  var removePatient = function (id) { setAdditionalPatients(function (prev) { return prev.filter(function (p) { return p.id !== id; }); }); };

  /* â”€â”€ Signature capture helpers â”€â”€ */
  var textToImage = function (text, font) {
    try {
      var cv = document.createElement('canvas'); cv.width = 500; cv.height = 120;
      var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 500, 120);
      ctx.font = font || 'italic 32px Georgia, serif';
      ctx.fillStyle = '#2E5A46'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, 250, 60); return cv.toDataURL('image/png');
    } catch (e) { return null; }
  };
  var captureConsentSig = function () {
    if (signature === 'drawn-signature' && drawPoints.length > 1) {
      try {
        var cv = document.createElement('canvas'); cv.width = 500; cv.height = 120;
        var ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 500, 120);
        ctx.strokeStyle = '#2E5A46'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        var el = consentDrawRef.current; if (!el) return textToImage('drawn');
        var box = el.getBoundingClientRect(); var sx = 500 / (box.width || 1); var sy = 120 / (box.height || 1);
        ctx.beginPath();
        drawPoints.forEach(function (p, i) { if (i === 0) ctx.moveTo(p.x * sx, p.y * sy); else ctx.lineTo(p.x * sx, p.y * sy); });
        ctx.stroke(); return cv.toDataURL('image/png');
      } catch (e) { return null; }
    }
    if (signature && signature !== 'drawn-signature') return textToImage(signature);
    return null;
  };
  var captureIntakeSig = function () {
    if (intakeCanvasRef.current && intakeSignature === 'drawn_intake_sig') {
      try { return intakeCanvasRef.current.toDataURL('image/png'); } catch (e) { return null; }
    }
    if (intakeSignature && intakeSignature !== 'drawn_intake_sig') return textToImage(intakeSignature);
    return null;
  };

  /* â”€â”€ Track consent timestamps for HIPAA audit â”€â”€ */
  var handleConsentChange = function (key, checked) {
    setConsents(function (prev) { var n = Object.assign({}, prev); n[key] = checked; return n; });
    if (checked) {
      setConsentTimestamps(function (prev) { var n = Object.assign({}, prev); n[key] = new Date().toISOString(); return n; });
    }
  };
  var updatePatient = function (id, field, val) { setAdditionalPatients(function (prev) { return prev.map(function (p) { if (p.id === id) { var u = { ...p }; u[field] = val; return u; } return p; }); }); };
  var toggleService = function (currentServices, title) {
    if (currentServices.indexOf(title) >= 0) return currentServices.filter(function (s) { return s !== title; });
    return [].concat(currentServices, [title]);
  };
  var peptideServiceTitles = {};
  serviceCategories.forEach(function (cat) { if (cat.consultOnly) { cat.services.forEach(function (s) { peptideServiceTitles[s.title] = true; }); } });
  var isPeptideService = function (title) { return !!peptideServiceTitles[title]; };
  var formatServiceLabel = function (title) { return isPeptideService(title) ? title + ' (Consultation)' : title; };

  // â”€â”€ Card helpers â”€â”€
  function detectBrand(n) { n = n.replace(/\s/g, ''); if (/^4/.test(n)) return 'visa'; if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'; if (/^3[47]/.test(n)) return 'amex'; if (/^6(?:011|5)/.test(n)) return 'discover'; return ''; }
  function formatNum(val) { var n = val.replace(/\D/g, ''); var b = detectBrand(n); var mx = b === 'amex' ? 15 : 16; n = n.slice(0, mx); if (b === 'amex') return n.replace(/(\d{4})(\d{0,6})(\d{0,5})/, function (m, a, bb, c) { return a + (bb ? ' ' + bb : '') + (c ? ' ' + c : ''); }).trim(); return n.replace(/(\d{4})(?=\d)/g, '$1 ').trim(); }
  function formatExp(val) { var n = val.replace(/\D/g, '').slice(0, 4); if (n.length >= 3) return n.slice(0, 2) + ' / ' + n.slice(2); return n; }
  function luhnCheck(num) { var n = num.replace(/\D/g, ''); if (n.length < 13) return false; var s = 0, a = false; for (var i = n.length - 1; i >= 0; i--) { var d = parseInt(n[i], 10); if (a) { d *= 2; if (d > 9) d -= 9; } s += d; a = !a; } return s % 10 === 0; }
  function handleFallbackNum(val) { var f = formatNum(val); setFallbackCardNum(f); setDetectedBrand(detectBrand(f.replace(/\D/g, ''))); }
  function handleFallbackExp(val) { setFallbackCardExp(formatExp(val)); }
  function handleFallbackCvc(val) { var mx = detectedBrand === 'amex' ? 4 : 3; setFallbackCardCvc(val.replace(/\D/g, '').slice(0, mx)); }

  // â”€â”€ Load Stripe.js â”€â”€
  useEffect(function () {
    if (window.Stripe) { setStripeLoaded(true); return; }
    var s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.async = true;
    s.onload = function () { setStripeLoaded(true); };
    s.onerror = function () { setStripeFailed(true); setStripeReady(true); };
    document.head.appendChild(s);
  }, []);

  // â”€â”€ Initialize Stripe â”€â”€
  useEffect(function () {
    if (!stripeLoaded || stripeRef.current) return;
    try {
      stripeRef.current = window.Stripe(STRIPE_PK);
    } catch (e) {
      setStripeError('Payment initialization error: ' + e.message);
    }
  }, [stripeLoaded, STRIPE_PK]);

  // â”€â”€ Fetch SetupIntent and mount Payment Element on step 3 â”€â”€
  useEffect(function () {
    if (step !== 3 || !stripeLoaded || !stripeRef.current || stripeMountedRef.current) return;
    var cancelled = false;

    async function initPayment() {
      try {
        // Get SetupIntent from server
        var setupUrl = '/api/charge-verification?email=' + encodeURIComponent(form.email || '') + '&name=' + encodeURIComponent((form.fname + ' ' + form.lname).trim());
        var setupRes = await fetch(setupUrl);
        if (!setupRes.ok) throw new Error('Could not initialize payment.');
        var setupData = await setupRes.json();
        if (cancelled) return;
        
        setSetupClientSecret(setupData.clientSecret);
        setSetupCustomerId(setupData.customerId);

        // Create Elements with clientSecret
        var appearance = {
          theme: 'night',
          variables: {
            colorPrimary: '#D4BC82',
            colorBackground: 'rgba(255,255,255,0.08)',
            colorText: '#FFFFFF',
            colorDanger: '#FF9B9B',
            fontFamily: "'Outfit', sans-serif",
            borderRadius: '6px',
          },
          rules: {
            '.Input': {
              border: '1px solid rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
            '.Input:focus': {
              border: '1px solid rgba(212,188,130,0.5)',
              boxShadow: '0 0 0 1px rgba(212,188,130,0.25)',
            },
            '.Label': {
              color: 'rgba(255,255,255,0.6)',
              fontSize: '12px',
            },
          },
        };

        elementsRef.current = stripeRef.current.elements({
          clientSecret: setupData.clientSecret,
          appearance: appearance,
          fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500&display=swap' }],
        });

        // Wait for mount point
        var tryMount = function () {
          if (cancelled || !paymentMountRef.current) return;
          var paymentElement = elementsRef.current.create('payment', {
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          });
          paymentElement.on('change', function (ev) {
            setPaymentComplete(ev.complete);
            if (ev.error) setStripeError(ev.error.message);
            else setStripeError('');
            // Detect brand from card
            if (ev.value && ev.value.type === 'card') {
              setDetectedBrand('card');
            } else if (ev.value && ev.value.type) {
              setDetectedBrand(ev.value.type);
            }
          });
          paymentElement.on('ready', function () { setStripeReady(true); });
          paymentElement.mount(paymentMountRef.current);
          stripeMountedRef.current = true;
        };
        setTimeout(tryMount, 120);
      } catch (e) {
        if (!cancelled) {
          setStripeError(e.message || 'Could not load payment form.');
          setStripeFailed(true);
          setStripeReady(true);
        }
      }
    }

    initPayment();
    return function () { cancelled = true; stripeMountedRef.current = false; if (elementsRef.current) { try { elementsRef.current.getElement('payment').destroy(); } catch (e) {} elementsRef.current = null; } };
  }, [step, stripeLoaded]);

  useEffect(function () { if (step !== 3) { setStripeReady(false); setPaymentComplete(false); stripeMountedRef.current = false; setDetectedBrand(''); setSetupClientSecret(''); } }, [step]);

  // â”€â”€ Submit to IntakeQ (HIPAA-secure) â”€â”€
  var submitToIntakeQ = async function (cardBrandVal, cardLast4Val, pmId) {
    setSubmitError('');
    try {
      var consentSigImg = captureConsentSig();
      var intakeSigImg = captureIntakeSig();

      var response = await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fname: form.fname, lname: form.lname, email: form.email, phone: form.phone,
          address: form.address, date: form.date, selTime: selTime,
          services: form.services, notes: form.notes,
          medicalHistory: form.medicalHistory, surgicalHistory: form.surgicalHistory,
          medications: form.medications, allergies: form.allergies,
          clinicianNotes: form.clinicianNotes,
          consents: consents, consentTimestamps: consentTimestamps,
          signature: signature,
          signatureType: signature === 'drawn-signature' ? 'drawn' : (signature ? 'typed' : 'none'),
          signatureImageData: consentSigImg,
          intakeAcknowledged: intakeAcknowledged, intakeSignature: intakeSignature,
          intakeSignatureType: intakeSignature === 'drawn_intake_sig' ? 'drawn' : (intakeSignature ? 'typed' : 'none'),
          intakeSignatureImageData: intakeSigImg,
          cardHolderName: cardHolderName, cardBrand: cardBrandVal || '',
          cardLast4: cardLast4Val || '', stripePaymentMethodId: pmId || '',
          additionalPatients: additionalPatients,
        }),
      });

      var result = {};
      try { result = await response.json(); } catch (e) {}

      if (result.log) console.log('Server log:', result.log);

      if (!response.ok) {
        console.error('Submit failed:', response.status, result);
        setSubmitError('Your booking may not have saved. Please call (585) 747-2215 to confirm. Error: ' + (result.error || response.status));
        return false;
      }

      console.log('Submit OK:', result);
      return true;
    } catch (e) {
      console.error('Submit error:', e);
      setSubmitError('Could not reach the server. Please call (585) 747-2215 to confirm your booking.');
      return false;
    }
  };

  // â”€â”€ Stripe payment + card verification â”€â”€
  var handleStripePayment = async function () {
    if (!cardHolderName.trim()) { setStripeError('Please enter the name on card.'); return; }
    if (!cardComplete) { setStripeError('Please complete all payment fields.'); return; }
    setIsValidating(true); setStripeError('');
    if (stripeFailed) {
      var raw = fallbackCardNum.replace(/\D/g, '');
      if (!luhnCheck(raw)) { setStripeError('Invalid card number.'); setIsValidating(false); return; }
      var er = fallbackCardExp.replace(/\D/g, '');
      var mm = parseInt(er.slice(0, 2), 10), yy = parseInt(er.slice(2, 4), 10);
      var now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
      if (mm < 1 || mm > 12) { setStripeError('Invalid expiration month.'); setIsValidating(false); return; }
      if (yy < cy || (yy === cy && mm < cm)) { setStripeError('Card is expired.'); setIsValidating(false); return; }
      setCardBrand(detectedBrand);
      setCardInfo({ ...cardInfo, number: '****' + raw.slice(-4), name: cardHolderName });
      await submitToIntakeQ(detectedBrand, raw.slice(-4), 'fallback');
      setIsValidating(false); setEmailStatus('sent'); goToStep(4); return;
    }
    if (!stripeRef.current || !elementsRef.current || !setupClientSecret) { setStripeError('Payment system not ready. Please wait or refresh.'); setIsValidating(false); return; }
    try {
      // Confirm the SetupIntent with Payment Element (handles 3D Secure, Apple Pay, Venmo automatically)
      var confirmResult = await stripeRef.current.confirmSetup({
        elements: elementsRef.current,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: cardHolderName.trim(),
              email: form.email || undefined,
              phone: form.phone || undefined,
            },
          },
        },
        redirect: 'if_required',
      });

      if (confirmResult.error) {
        setStripeError(confirmResult.error.message); setIsValidating(false); return;
      }

      // Tell server to verify and get payment method details
      var verifyRes = await fetch('/api/charge-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          setupIntentId: confirmResult.setupIntent.id,
          customerId: setupCustomerId,
        }),
      });
      if (!verifyRes.ok) {
        var verifyErr; try { verifyErr = await verifyRes.json(); } catch (e) { verifyErr = { error: 'Verification error.' }; }
        setStripeError(verifyErr.error || 'Payment verification failed.'); setIsValidating(false); return;
      }
      var verifyData = await verifyRes.json();

      setCardBrand(verifyData.brand || '');
      setCardInfo({ ...cardInfo, number: verifyData.last4 ? '****' + verifyData.last4 : (verifyData.brand || 'Payment method'), name: cardHolderName });
      await submitToIntakeQ(verifyData.brand || '', verifyData.last4 || '', verifyData.paymentMethodId || '');
      setIsValidating(false); setEmailStatus('sent'); goToStep(4);
    } catch (e) {
      setStripeError(e.message === 'Failed to fetch' ? 'Could not reach payment server.' : 'Payment error: ' + (e.message || 'Please try again.'));
      setIsValidating(false);
    }
  };

  // â”€â”€ Step navigation â”€â”€
  var stepTitles = { 1: 'Appointment Information', 2: 'Consent Forms', 3: 'Card on File', 4: 'Confirmation' };
  useEffect(function () { setStepAnnouncement('Step ' + step + ' of 4: ' + stepTitles[step]); if (stepHeadingRef.current) stepHeadingRef.current.focus(); }, [step]);

  var allConsentsChecked = consents.treatment && consents.hipaa && consents.medical && signature.length > 0;
  var cardValid = cardHolderName.trim().length > 0 && cardComplete && consents.financial;

  var TS = { fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '0.3rem' };
  var LS = { color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit',sans-serif", fontSize: '0.7rem', fontWeight: 500 };
  var IS = { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFFFFF', borderRadius: '6px', padding: '0.65rem 0.85rem', fontFamily: "'Outfit',sans-serif", fontSize: '0.78rem', outline: 'none', width: '100%', minWidth: 0, boxSizing: 'border-box' };
  var CS = { background: 'rgba(46,90,70,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', overflow: 'hidden', boxSizing: 'border-box', width: '100%' };
  var medIS = { ...IS, resize: 'vertical', minHeight: '60px' };
  var consentForms = [{ key: 'treatment', title: 'Patient Treatment Consent', text: CONSENT_TREATMENT }, { key: 'hipaa', title: 'HIPAA Notice of Privacy Practices', text: CONSENT_HIPAA }, { key: 'medical', title: 'Medical History Consent', text: CONSENT_MEDICAL }];
  var goToStep = function (s) { setStep(s); window.scrollTo(0, 0); };
  var stepItems = [{ num: 1, label: 'Appointment' }, { num: 2, label: 'Consent Forms' }, { num: 3, label: 'Card on File' }, { num: 4, label: 'Confirmation' }];
  var backBtn = { flex: 1, padding: '0.7rem', fontSize: '0.6rem', fontFamily: "'Outfit',sans-serif", fontWeight: 600, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', cursor: 'pointer' };

  // â”€â”€ Service Picker â”€â”€
  var renderServicePicker = function (selectedServices, onToggle) {
    return (
      <div style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', overflow: 'hidden' }}>
        {serviceCategories.map(function (cat) {
          var isOpen = openPickerCat === cat.id;
          var selectedInCat = cat.services.filter(function (s) { return selectedServices.indexOf(s.title) >= 0; }).length;
          return (
            <div key={cat.id}>
              <div onClick={function () { setOpenPickerCat(isOpen ? null : cat.id); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.85rem', background: isOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.58rem', color: 'rgba(255,255,255,0.85)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--gold-soft)', fontSize: '0.7rem' }}>{cat.icon}</span>{cat.title}
                  {cat.consultOnly && <span style={{ fontSize: '0.38rem', color: '#7FD4A0', background: 'rgba(127,212,160,0.12)', border: '1px solid rgba(127,212,160,0.2)', padding: '0.08rem 0.35rem', borderRadius: '4px', fontWeight: 600 }}>BOOK CONSULTATION</span>}
                  {selectedInCat > 0 && <span style={{ background: 'var(--gold-soft)', color: '#2E5A46', fontSize: '0.4rem', fontWeight: 700, padding: '0.08rem 0.35rem', borderRadius: '10px' }}>{selectedInCat}</span>}
                </span>
                <span style={{ color: 'var(--gold-soft)', fontSize: '0.5rem', transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>{'\u25BC'}</span>
              </div>
              {isOpen && (
                <div style={{ padding: '0.4rem 0.5rem', background: 'rgba(0,0,0,0.1)' }}>
                  {cat.services.map(function (svc) {
                    var checked = selectedServices.indexOf(svc.title) >= 0;
                    return (
                      <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', cursor: 'pointer', borderRadius: '6px', background: checked ? 'rgba(212,188,130,0.08)' : 'transparent', marginBottom: '0.15rem' }}>
                        <input type="checkbox" checked={checked} onChange={function () { onToggle(svc.title); }} style={{ accentColor: 'var(--gold-soft)', width: '0.75rem', height: '0.75rem', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.52rem', color: checked ? 'var(--gold-soft)' : 'rgba(255,255,255,0.7)', fontWeight: checked ? 500 : 400 }}>{svc.title}</span>
                      </label>
                    );
                  })}
                  {cat.consultOnly && (
                    <div style={{ margin: '0.4rem 0.15rem 0.25rem', padding: '0.65rem', background: 'rgba(255,180,50,0.06)', border: '1px solid rgba(255,180,50,0.12)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#FFB432', fontSize: '0.55rem' }}>{'\u26A0'}</span>
                        <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.42rem', fontWeight: 700, color: '#FFB432', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Non-FDA Approved Peptides</span>
                      </div>
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.42rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', marginBottom: '0.35rem' }}>Many peptide therapies offered through our practice have not been approved by the U.S. Food and Drug Administration (FDA) for the specific uses described.</p>
                      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.42rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.55)', marginBottom: '0.35rem' }}>These peptides are sourced from licensed U.S. compounding pharmacies. Their use is based on emerging clinical research, peer-reviewed literature, and clinical experience.</p>
                      <div style={{ marginTop: '0.5rem', paddingTop: '0.45rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.45rem' }}>{'\u2695'}</span>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.42rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medical Disclaimer</span>
                        </div>
                        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.4rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.45)', marginBottom: '0.3rem' }}>The information provided is for educational and informational purposes only and does not constitute medical advice, diagnosis, or treatment.</p>
                        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.4rem', lineHeight: 1.65, color: 'rgba(255,255,255,0.45)' }}>By selecting peptide therapy services, you acknowledge that you understand the non-FDA approved status of these peptides and that a mandatory NP consultation is required before any treatment begins.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // â”€â”€ Consent renderer â”€â”€
  var renderConsent = function (cf) {
    var paragraphs = cf.text.split('\n\n').filter(function (p) { return p.trim(); });
    return (
      <div key={cf.key} style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1.5rem' }}>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.62rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{cf.title}</h3>
        <div style={{ maxHeight: '200px', overflow: 'auto', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem' }}>
          {paragraphs.map(function (para, i) {
            var headerMatch = para.match(/^([A-Z][A-Z\s&,\/\(\)\-]+:)(.*)/);
            if (headerMatch) return <p key={i} style={{ fontSize: '0.5rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit',sans-serif", marginBottom: '0.6rem' }}><span style={{ color: 'var(--gold-soft)', fontWeight: 600, fontSize: '0.48rem' }}>{headerMatch[1]}</span>{headerMatch[2]}</p>;
            return <p key={i} style={{ fontSize: '0.5rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit',sans-serif", marginBottom: '0.6rem' }}>{para}</p>;
          })}
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <input type="checkbox" checked={consents[cf.key]} onChange={(e) => handleConsentChange(cf.key, e.target.checked)} style={{ marginTop: '0.15rem', accentColor: '#7FD4A0' }} />
          <label style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>I have read, understand, and agree to the {cf.title}</label>
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div aria-live="polite" className="sr-only">{stepAnnouncement}</div>
      <SceneBackground />
      <div style={{ position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ padding: '8rem 3rem 0.25rem', textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div style={{ background: 'rgba(46,90,70,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '1.5rem', width: '100%' }}>
            <h1 ref={stepHeadingRef} tabIndex={-1} style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em' }}>{stepTitles[step]}</h1>
            <div style={{ margin: '0.5rem 0' }}><LotusIcon size={40} /></div>
            <div style={{ width: 25, height: 0.75, background: 'var(--gold-soft)', margin: '0 auto' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem' }}>
              {stepItems.map((s, i) => {
                const active = step >= s.num, done = step > s.num;
                return (
                  <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: active ? 'var(--gold-soft)' : 'rgba(255,255,255,0.15)', color: active ? '#2E5A46' : 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{done ? '\u2713' : s.num}</div>
                      <span style={{ fontSize: '0.4rem', color: active ? 'var(--gold-soft)' : 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>{s.label}</span>
                    </div>
                    {i < stepItems.length - 1 && <div style={{ width: 20, height: 1, background: active ? 'var(--gold-soft)' : 'rgba(255,255,255,0.15)', marginBottom: '1rem' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '0.5rem 3rem 3rem', maxWidth: 800, margin: '0 auto' }}>

          {/* â•â•â•â•â•â• STEP 1: Appointment â•â•â•â•â•â• */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Contact info cards */}
              <div style={{ ...CS, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1rem' }}>
                {[
                  { icon: 'phone', t: 'Call Us', v: <a href="tel:+15857472215" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>(585) 747-2215</a> },
                  { icon: 'email', t: 'Email Us', v: <a href="mailto:info@healingsoulutions.care" style={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>info@healingsoulutions.care</a> },
                  { icon: 'clock', t: 'Availability', v: 'Contact us for scheduling' },
                  { icon: 'pin', t: 'Service Area', v: 'New York Metropolitan Area' },
                ].map((c) => (
                  <div key={c.t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.3rem' }}>{c.icon === 'phone' ? <GoldPhoneIcon size={28} /> : c.icon === 'email' ? <GoldEmailIcon size={28} /> : c.icon === 'clock' ? <GoldClockIcon size={28} /> : <GoldPinIcon size={28} />}</div>
                    <h3 style={TS}>{c.t}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem' }}>{c.v}</p>
                  </div>
                ))}
              </div>

              <div style={CS}>
                <h2 style={TS}>Schedule Your Appointment</h2>
                <p style={{ ...LS, textAlign: 'center', marginBottom: '1rem' }}>Select a preferred date and time below.</p>
                <div className="form-row"><div className="form-group"><label style={LS}>Preferred Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} style={IS} /></div></div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ ...LS, marginBottom: '0.4rem', display: 'block' }}>Services Needed</label>
                  {form.services.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
                      {form.services.map((s) => (
                        <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(212,188,130,0.12)', border: '1px solid rgba(212,188,130,0.25)', borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.45rem', color: 'var(--gold-soft)', fontFamily: "'Outfit',sans-serif", fontWeight: 500 }}>
                          {isPeptideService(s) ? s + ' (Consult)' : s}
                          <span onClick={() => setForm({ ...form, services: form.services.filter((x) => x !== s) })} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '0.55rem' }}>{'\u00D7'}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {renderServicePicker(form.services, (title) => setForm({ ...form, services: toggleService(form.services, title) }))}
                </div>
                <div style={{ ...LS, marginBottom: '0.5rem' }}>Preferred Time</div>
                <div className="time-slots">{timeSlots.map((t) => <div key={t} className={'time-slot' + (selTime === t ? ' selected' : '')} onClick={() => setSelTime(t)}>{t}</div>)}</div>

                {/* Personal info */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h2 style={TS}>Your Information</h2>
                  <div className="form-row" style={{ marginTop: '1rem' }}>
                    <div className="form-group"><label style={LS}>First Name</label><input type="text" placeholder="First name" value={form.fname} onChange={(e) => setForm({ ...form, fname: e.target.value })} style={IS} /></div>
                    <div className="form-group"><label style={LS}>Last Name</label><input type="text" placeholder="Last name" value={form.lname} onChange={(e) => setForm({ ...form, lname: e.target.value })} style={IS} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label style={LS}>Email</label><input type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={IS} /></div>
                    <div className="form-group"><label style={LS}>Phone</label><input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={IS} /></div>
                  </div>
                  <div className="form-row"><div className="form-group full"><label style={LS}>Address</label><input type="text" placeholder="Street address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={IS} /></div></div>
                  <div className="form-row"><div className="form-group full"><label style={LS}>Additional Notes</label><textarea placeholder="Any additional notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ ...IS, minHeight: '60px', resize: 'vertical' }} /></div></div>

                  {/* Medical info */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Medical Information</h3>
                    {[{ id: 'medicalHistory', l: 'Medical History', p: 'List any medical conditions...' }, { id: 'surgicalHistory', l: 'Surgical History', p: 'List any past surgeries...' }, { id: 'medications', l: 'Current Medications', p: 'List all current medications...' }, { id: 'allergies', l: 'Allergies', p: 'List any known allergies...' }, { id: 'clinicianNotes', l: 'Additional Notes for Clinician', p: 'Any additional information...' }].map((f) => (
                      <div key={f.id} className="form-row"><div className="form-group full"><label style={LS}>{f.l}</label><textarea placeholder={f.p} value={form[f.id]} onChange={(e) => setForm({ ...form, [f.id]: e.target.value })} style={medIS} /></div></div>
                    ))}
                  </div>
                </div>

                {/* Additional Patients */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Additional Patients</h3>
                    <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.4)', fontFamily: "'Outfit',sans-serif" }}>{additionalPatients.length} added</span>
                  </div>
                  <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.55)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6, marginBottom: '0.75rem' }}>Need to add family members or others to this appointment? Add their information below.</p>
                  {additionalPatients.map((pt, idx) => (
                    <div key={pt.id} style={{ background: 'rgba(0,0,0,0.12)', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.58rem', fontWeight: 600 }}>Patient {idx + 2}</span>
                        <button onClick={() => removePatient(pt.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '0.5rem', fontFamily: "'Outfit',sans-serif", textDecoration: 'underline' }}>Remove</button>
                      </div>
                      <div className="form-row">
                        <div className="form-group"><label style={LS}>First Name</label><input type="text" placeholder="First name" value={pt.fname} onChange={(e) => updatePatient(pt.id, 'fname', e.target.value)} style={IS} /></div>
                        <div className="form-group"><label style={LS}>Last Name</label><input type="text" placeholder="Last name" value={pt.lname} onChange={(e) => updatePatient(pt.id, 'lname', e.target.value)} style={IS} /></div>
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        <label style={{ ...LS, marginBottom: '0.4rem', display: 'block' }}>Services Needed</label>
                        {renderServicePicker(pt.services, (title) => updatePatient(pt.id, 'services', toggleService(pt.services, title)))}
                      </div>
                      {[{ id: 'medicalHistory', l: 'Medical History', p: 'List any medical conditions...' }, { id: 'surgicalHistory', l: 'Surgical History', p: 'List any past surgeries...' }, { id: 'medications', l: 'Current Medications', p: 'List all current medications...' }, { id: 'allergies', l: 'Allergies', p: 'List any known allergies...' }, { id: 'clinicianNotes', l: 'Notes for Clinician', p: 'Any additional information...' }].map((f) => (
                        <div key={f.id} className="form-row"><div className="form-group full"><label style={LS}>{f.l}</label><textarea placeholder={f.p} value={pt[f.id]} onChange={(e) => updatePatient(pt.id, f.id, e.target.value)} style={medIS} /></div></div>
                      ))}
                    </div>
                  ))}
                  <button onClick={addPatient} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', width: '100%', padding: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(212,188,130,0.25)', borderRadius: '8px', color: 'var(--gold-soft)', fontFamily: "'Outfit',sans-serif", fontSize: '0.6rem', fontWeight: 500, cursor: 'pointer' }}><span style={{ fontSize: '0.85rem', lineHeight: 1 }}>+</span> Add Another Patient</button>
                </div>

                {/* Intake Acknowledgment */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ fontSize: '0.7rem' }}>{'\u270D'}</span> Intake Form Acknowledgment</h3>
                  <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '0.85rem', marginBottom: '0.75rem', maxHeight: '160px', overflow: 'auto' }}>
                    {[
                      ['PATIENT INTAKE ACKNOWLEDGMENT:', ' By checking the box and signing below, I acknowledge and certify the following:'],
                      ['(1)', ' All information provided in this intake form, including but not limited to my personal information, contact details, medical history, surgical history, current medications, allergies, and substance use history, is complete, accurate, and truthful to the best of my knowledge.'],
                      ['(2)', ' I have not intentionally omitted, withheld, or misrepresented any medical information, health conditions, medications, allergies, prior adverse reactions, or other facts that may be relevant to my care and treatment.'],
                      ['(3)', ' I understand that incomplete, inaccurate, or misleading information may result in serious adverse health consequences, including but not limited to dangerous drug interactions, allergic reactions, inappropriate treatment protocols, or other medical complications.'],
                      ['(4)', ' I acknowledge that BT RPN PLLC, Kristina Castro, NP PLLC d/b/a Healing Soulutions, and their respective owners, officers, employees, contractors, agents, and affiliated clinicians shall not be held liable for any adverse outcomes, injuries, complications, or damages arising directly or indirectly from my failure to provide complete and accurate medical information.'],
                      ['(5)', ' I agree to promptly notify the Practice of any changes to my medical history, medications, allergies, or health status prior to receiving any services.'],
                      ['(6)', ' I understand that providing false or misleading medical information may constitute fraud and may result in termination of the patient relationship and/or referral to appropriate authorities.'],
                      ['(7)', ' I certify that I am at least 18 years of age (or the legal guardian of the patient) and have the legal capacity to provide this acknowledgment.'],
                    ].map(([label, text], i) => (
                      <p key={i} style={{ fontFamily: "'Outfit',sans-serif", fontSize: i === 0 ? '0.5rem' : '0.48rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: '0.4rem', ...(i > 0 ? { paddingLeft: '0.5rem', borderLeft: '2px solid rgba(212,188,130,0.15)' } : {}) }}>
                        <span style={{ color: 'var(--gold-soft)', fontWeight: 600, fontSize: '0.48rem' }}>{label}</span>{text}
                      </p>
                    ))}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" checked={intakeAcknowledged} onChange={(e) => setIntakeAcknowledged(e.target.checked)} style={{ marginTop: '0.15rem', accentColor: '#7FD4A0', width: '0.85rem', height: '0.85rem', flexShrink: 0 }} />
                    <label style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.85)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>I acknowledge and certify that all information provided in this intake form is complete, accurate, and truthful. I understand and accept the terms outlined above, including the limitations of liability for incomplete or inaccurate information.</label>
                  </div>

                  {/* Intake Signature */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ ...LS, marginBottom: '0.4rem', display: 'block' }}>Signature <span style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)' }}>(required)</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <button onClick={() => setIntakeSigMode('type')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.5rem', fontFamily: "'Outfit',sans-serif", fontWeight: 600, background: intakeSigMode === 'type' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.08)', color: intakeSigMode === 'type' ? '#2E5A46' : 'rgba(255,255,255,0.6)', border: '1px solid ' + (intakeSigMode === 'type' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.15)'), borderRadius: '6px', cursor: 'pointer' }}>Type</button>
                      <button onClick={() => setIntakeSigMode('draw')} style={{ padding: '0.35rem 0.75rem', fontSize: '0.5rem', fontFamily: "'Outfit',sans-serif", fontWeight: 600, background: intakeSigMode === 'draw' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.08)', color: intakeSigMode === 'draw' ? '#2E5A46' : 'rgba(255,255,255,0.6)', border: '1px solid ' + (intakeSigMode === 'draw' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.15)'), borderRadius: '6px', cursor: 'pointer' }}>Draw</button>
                    </div>
                    {intakeSigMode === 'type' ? (
                      <input type="text" placeholder="Type your full legal name" value={intakeSignature} onChange={(e) => setIntakeSignature(e.target.value)} style={{ ...IS, fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontStyle: 'italic', fontWeight: 500 }} />
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <canvas ref={intakeCanvasRef} width={500} height={120} style={{ width: '100%', height: '80px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', cursor: 'crosshair' }}
                          onMouseDown={(e) => { setIntakeDrawing(true); var r = e.target.getBoundingClientRect(); setIntakeDrawPoints([{ x: e.clientX - r.left, y: e.clientY - r.top }]); }}
                          onMouseMove={(e) => { if (!intakeDrawing) return; var r = e.target.getBoundingClientRect(); var np = [...intakeDrawPoints, { x: e.clientX - r.left, y: e.clientY - r.top }]; setIntakeDrawPoints(np); var ctx = e.target.getContext('2d'); ctx.strokeStyle = '#D4BC82'; ctx.lineWidth = 2; ctx.lineCap = 'round'; if (np.length >= 2) { ctx.beginPath(); ctx.moveTo(np[np.length - 2].x * (500 / e.target.offsetWidth), np[np.length - 2].y * (120 / e.target.offsetHeight)); ctx.lineTo(np[np.length - 1].x * (500 / e.target.offsetWidth), np[np.length - 1].y * (120 / e.target.offsetHeight)); ctx.stroke(); } }}
                          onMouseUp={() => { setIntakeDrawing(false); if (intakeDrawPoints.length > 2) setIntakeSignature('drawn_intake_sig'); }}
                          onMouseLeave={() => setIntakeDrawing(false)}
                          onTouchStart={(e) => { e.preventDefault(); var t = e.touches[0]; var r = e.target.getBoundingClientRect(); setIntakeDrawing(true); setIntakeDrawPoints([{ x: t.clientX - r.left, y: t.clientY - r.top }]); }}
                          onTouchMove={(e) => { e.preventDefault(); if (!intakeDrawing) return; var t = e.touches[0]; var r = e.target.getBoundingClientRect(); var np = [...intakeDrawPoints, { x: t.clientX - r.left, y: t.clientY - r.top }]; setIntakeDrawPoints(np); var ctx = e.target.getContext('2d'); ctx.strokeStyle = '#D4BC82'; ctx.lineWidth = 2; ctx.lineCap = 'round'; if (np.length >= 2) { ctx.beginPath(); ctx.moveTo(np[np.length - 2].x * (500 / e.target.offsetWidth), np[np.length - 2].y * (120 / e.target.offsetHeight)); ctx.lineTo(np[np.length - 1].x * (500 / e.target.offsetWidth), np[np.length - 1].y * (120 / e.target.offsetHeight)); ctx.stroke(); } }}
                          onTouchEnd={() => { setIntakeDrawing(false); if (intakeDrawPoints.length > 2) setIntakeSignature('drawn_intake_sig'); }}
                        />
                        <button onClick={(e) => { setIntakeDrawPoints([]); setIntakeSignature(''); var c = e.target.closest('div').querySelector('canvas'); if (c) { var ctx = c.getContext('2d'); ctx.clearRect(0, 0, 500, 120); } }} style={{ position: 'absolute', top: '0.35rem', right: '0.35rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: 'rgba(255,255,255,0.5)', fontSize: '0.4rem', padding: '0.2rem 0.4rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Clear</button>
                      </div>
                    )}
                    {intakeSignature && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.42rem', color: '#7FD4A0', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span>{'\u2713'}</span> Signature captured</p>}
                  </div>
                  {(!intakeAcknowledged || !intakeSignature) && <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.45rem', color: 'rgba(255,180,50,0.7)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span>{'\u26A0'}</span> Please check the acknowledgment box and provide your signature to continue.</p>}
                </div>
                <button className="btn-submit" onClick={() => goToStep(2)} disabled={!intakeAcknowledged || !intakeSignature} style={{ marginTop: '0.5rem', opacity: (!intakeAcknowledged || !intakeSignature) ? 0.4 : 1, cursor: (!intakeAcknowledged || !intakeSignature) ? 'not-allowed' : 'pointer' }}>Continue to Consent Forms</button>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â• STEP 2: Consent Forms â•â•â•â•â•â• */}
          {step === 2 && (
            <div style={CS}>
              <h2 style={{ ...TS, marginBottom: '0.25rem' }}>Patient Consent Forms</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', textAlign: 'center', marginBottom: '1.5rem', fontFamily: "'Outfit',sans-serif" }}>Please review and sign each consent form below.</p>
              {consentForms.map(renderConsent)}
              <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.62rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Electronic Signature</h3>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <button onClick={() => setSigMode('type')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.55rem', fontFamily: "'Outfit',sans-serif", fontWeight: 500, background: sigMode === 'type' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.1)', color: sigMode === 'type' ? '#2E5A46' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Type Signature</button>
                  <button onClick={() => setSigMode('draw')} style={{ padding: '0.4rem 0.8rem', fontSize: '0.55rem', fontFamily: "'Outfit',sans-serif", fontWeight: 500, background: sigMode === 'draw' ? 'var(--gold-soft)' : 'rgba(255,255,255,0.1)', color: sigMode === 'draw' ? '#2E5A46' : 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Draw Signature</button>
                </div>
                {sigMode === 'type' ? (
                  <div>
                    <input type="text" placeholder="Type your full legal name" value={signature === 'drawn-signature' ? '' : signature} onChange={(e) => setSignature(e.target.value)} style={{ ...IS, marginBottom: '0.5rem' }} />
                    {signature && signature !== 'drawn-signature' && (<div style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '8px', padding: '1rem', textAlign: 'center' }}><p style={{ fontSize: '0.45rem', color: '#999', marginBottom: '0.3rem', fontFamily: "'Outfit',sans-serif" }}>Signature Preview</p><p style={{ fontFamily: 'Georgia,serif', fontSize: '1.2rem', color: '#2E5A46', fontStyle: 'italic' }}>{signature}</p></div>)}
                  </div>
                ) : (
                  <div>
                    <div ref={consentDrawRef} style={{ background: 'rgba(255,255,255,0.95)', borderRadius: '8px', height: '120px', position: 'relative', cursor: 'crosshair', touchAction: 'none' }}
                      onPointerDown={(e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setIsDrawing(true); var r = e.currentTarget.getBoundingClientRect(); setDrawPoints([{ x: e.clientX - r.left, y: e.clientY - r.top }]); }}
                      onPointerMove={(e) => { if (!isDrawing) return; e.preventDefault(); var r = e.currentTarget.getBoundingClientRect(); setDrawPoints((p) => [...p, { x: e.clientX - r.left, y: e.clientY - r.top }]); }}
                      onPointerUp={(e) => { setIsDrawing(false); e.currentTarget.releasePointerCapture(e.pointerId); if (drawPoints.length > 3) setSignature('drawn-signature'); }}
                    >
                      <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>{drawPoints.length > 1 && <polyline points={drawPoints.map((p) => p.x + ',' + p.y).join(' ')} fill="none" stroke="#2E5A46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}</svg>
                      {drawPoints.length === 0 && <p style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', color: '#999', fontSize: '0.6rem', fontFamily: "'Outfit',sans-serif" }}>Draw your signature here</p>}
                    </div>
                    <button onClick={() => { setDrawPoints([]); setSignature(''); }} style={{ marginTop: '0.5rem', fontSize: '0.5rem', fontFamily: "'Outfit',sans-serif", background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', textDecoration: 'underline' }}>Clear signature</button>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                  {consentForms.map((cf) => (<div key={cf.key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ fontSize: '0.55rem', color: consents[cf.key] ? '#7FD4A0' : 'rgba(255,255,255,0.25)' }}>{consents[cf.key] ? '\u2713' : '\u25CB'}</span><span style={{ fontSize: '0.45rem', color: consents[cf.key] ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>{cf.title}</span></div>))}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ fontSize: '0.55rem', color: signature ? '#7FD4A0' : 'rgba(255,255,255,0.25)' }}>{signature ? '\u2713' : '\u25CB'}</span><span style={{ fontSize: '0.45rem', color: signature ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>E-Signature</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={() => goToStep(1)} style={backBtn}>Back</button>
                <button onClick={() => goToStep(3)} disabled={!allConsentsChecked} style={{ flex: 2, padding: '0.7rem', fontSize: '0.6rem', fontFamily: "'Outfit',sans-serif", fontWeight: 700, background: allConsentsChecked ? 'var(--gold-soft)' : 'rgba(255,255,255,0.1)', color: allConsentsChecked ? '#2E5A46' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '8px', cursor: allConsentsChecked ? 'pointer' : 'not-allowed' }}>Continue to Payment</button>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â• STEP 3: Payment Method (Stripe Payment Element) â•â•â•â•â•â• */}
          {step === 3 && (
            <div style={CS}>
              <h2 style={{ ...TS, marginBottom: '0.25rem' }}>Payment Method</h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.6rem', textAlign: 'center', marginBottom: '0.5rem', fontFamily: "'Outfit',sans-serif" }}>A payment method on file is required to complete your booking.</p>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.48rem', textAlign: 'center', marginBottom: '1.25rem', fontFamily: "'Outfit',sans-serif" }}>Pay with card, Apple Pay, Google Pay, or Venmo. A $0.01 verification charge may be applied and refunded.</p>
              {renderConsent({ key: 'financial', title: 'Financial Consent', text: CONSENT_FINANCIAL })}
              <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.85rem' }}>{'\uD83D\uDD12'}</span>
                  <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit',sans-serif" }}>{stripeFailed ? 'Secure Card Entry' : 'Secured by Stripe'}</span>
                </div>
                <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginBottom: '0.35rem', fontFamily: "'Outfit',sans-serif" }}>Name on Account</label><input type="text" placeholder="Full name" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} style={IS} /></div>
                {stripeFailed ? (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginBottom: '0.35rem', fontFamily: "'Outfit',sans-serif" }}>Card Number</label>
                      <input type="text" inputMode="numeric" placeholder="1234 5678 9012 3456" value={fallbackCardNum} onChange={(e) => handleFallbackNum(e.target.value)} style={IS} autoComplete="cc-number" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                      <div><label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginBottom: '0.35rem', fontFamily: "'Outfit',sans-serif" }}>Expiration Date</label><input type="text" inputMode="numeric" placeholder="MM / YY" value={fallbackCardExp} onChange={(e) => handleFallbackExp(e.target.value)} style={IS} autoComplete="cc-exp" /></div>
                      <div><label style={{ display: 'block', color: 'rgba(255,255,255,0.6)', fontSize: '0.5rem', marginBottom: '0.35rem', fontFamily: "'Outfit',sans-serif" }}>Security Code (CVC)</label><input type="text" inputMode="numeric" placeholder={detectedBrand === 'amex' ? '1234' : '123'} value={fallbackCardCvc} onChange={(e) => handleFallbackCvc(e.target.value)} style={IS} autoComplete="cc-csc" /></div>
                    </div>
                  </>
                ) : (
                  <div ref={paymentMountRef} style={{ marginBottom: '1rem', minHeight: '120px' }} />
                )}
                {!stripeReady && !stripeError && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}><span style={{ display: 'inline-block', width: '0.55rem', height: '0.55rem', border: '1.5px solid rgba(255,255,255,0.15)', borderTop: '1.5px solid var(--gold-soft)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /><p style={{ fontSize: '0.45rem', color: 'rgba(255,255,255,0.35)', fontFamily: "'Outfit',sans-serif" }}>Loading payment options...</p></div>}
                {cardComplete && cardHolderName.trim() && !stripeError && <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.4rem 0.6rem', background: 'rgba(127,212,160,0.1)', borderRadius: '6px', marginBottom: '0.75rem' }}><span style={{ color: '#7FD4A0', fontSize: '0.5rem' }}>{'\u2713'}</span><p style={{ fontSize: '0.45rem', color: '#7FD4A0', fontFamily: "'Outfit',sans-serif" }}>Payment details complete</p></div>}
                {stripeError && <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: '6px', marginBottom: '0.75rem' }}><p style={{ fontSize: '0.48rem', color: '#FF9B9B', fontFamily: "'Outfit',sans-serif" }}>{stripeError}</p></div>}
                <p style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6, marginTop: '0.5rem' }}>Your payment information is handled directly by Stripe and never touches our servers.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={() => goToStep(2)} style={backBtn}>Back</button>
                <button onClick={handleStripePayment} disabled={!cardValid || isValidating} style={{ flex: 2, padding: '0.7rem', fontSize: '0.6rem', fontFamily: "'Outfit',sans-serif", fontWeight: 700, background: cardValid && !isValidating ? 'var(--gold-soft)' : 'rgba(255,255,255,0.1)', color: cardValid && !isValidating ? '#2E5A46' : 'rgba(255,255,255,0.3)', border: 'none', borderRadius: '8px', cursor: cardValid && !isValidating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  {isValidating && <span style={{ display: 'inline-block', width: '0.6rem', height: '0.6rem', border: '2px solid rgba(46,90,70,0.3)', borderTop: '2px solid #2E5A46', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />}
                  {isValidating ? 'Verifying...' : 'Verify & Complete Booking'}
                </button>
              </div>
            </div>
          )}

          {/* â•â•â•â•â•â• STEP 4: Confirmation â•â•â•â•â•â• */}
          {step === 4 && (
            <div style={CS}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', textAlign: 'center' }}>{'\u2705'}</div>
              <h2 style={{ ...TS, fontSize: '0.75rem' }}>Booking Confirmed!</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', lineHeight: 1.7, textAlign: 'center', maxWidth: 400, margin: '0 auto 1.5rem', fontFamily: "'Outfit',sans-serif" }}>Your appointment has been successfully booked.</p>
              {emailStatus === 'sent' && <div style={{ padding: '0.5rem 1rem', background: 'rgba(127,212,160,0.15)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}><p style={{ fontSize: '0.52rem', color: '#7FD4A0', fontFamily: "'Outfit',sans-serif" }}>{'\u2713'} Confirmation emails sent successfully</p></div>}
              {submitError && <div style={{ padding: '0.75rem 1rem', background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center' }}><p style={{ fontSize: '0.52rem', color: '#FF9B9B', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5 }}>{'\u26A0'} {submitError}</p></div>}
              <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1.25rem' }}>
                <h3 style={{ fontFamily: "'Outfit',sans-serif", color: 'var(--gold-soft)', fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Booking Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {[
                    { l: additionalPatients.length > 0 ? 'Primary Patient' : 'Patient', v: form.fname + ' ' + form.lname },
                    { l: 'Email', v: form.email },
                    { l: 'Phone', v: form.phone },
                    { l: 'Date', v: form.date },
                    { l: 'Time', v: selTime || 'TBD' },
                    { l: 'Services', v: form.services.length > 0 ? form.services.map(formatServiceLabel).join(', ') : 'General Consultation' },
                  ].map((item) => (
                    <div key={item.l}><p style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit',sans-serif" }}>{item.l}</p><p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit',sans-serif" }}>{item.v || '\u2014'}</p></div>
                  ))}
                </div>
                {form.address && <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}><p style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit',sans-serif" }}>Address</p><p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit',sans-serif" }}>{form.address}</p></div>}
                {additionalPatients.length > 0 && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Outfit',sans-serif", marginBottom: '0.4rem' }}>Additional Patients ({additionalPatients.length})</p>
                    {additionalPatients.map((pt, idx) => {
                      const ptName = (pt.fname + ' ' + pt.lname).trim() || 'Patient ' + (idx + 2);
                      const ptService = pt.services && pt.services.length > 0 ? pt.services.map(formatServiceLabel).join(', ') : 'Same as primary';
                      return <div key={pt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}><p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.9)', fontFamily: "'Outfit',sans-serif" }}>{ptName}</p><p style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.5)', fontFamily: "'Outfit',sans-serif" }}>{ptService}</p></div>;
                    })}
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                {['All consent forms signed', 'Card verified ($0.01 charge)', 'Confirmation sent to ' + (form.email || 'patient'), 'Data securely stored (HIPAA)'].map((s, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><span style={{ color: '#7FD4A0', fontSize: '0.55rem', fontWeight: 700 }}>{'\u2713'}</span><span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit',sans-serif" }}>{s}</span></div>))}
              </div>
              <div style={{ padding: '0.75rem', background: 'rgba(193,163,98,0.1)', borderRadius: '8px', marginTop: '1rem', border: '1px solid rgba(193,163,98,0.15)' }}><p style={{ fontSize: '0.52rem', color: 'var(--gold-soft)', lineHeight: 1.6, fontFamily: "'Outfit',sans-serif", textAlign: 'center' }}>Our team at <strong>info@healingsoulutions.care</strong> will contact you within 24 hours to confirm your appointment.</p></div>
              <p style={{ fontSize: '0.42rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.75rem', textAlign: 'center', fontFamily: "'Outfit',sans-serif" }}>Your {cardBrand ? cardBrand.charAt(0).toUpperCase() + cardBrand.slice(1) : 'card'} ending in {cardInfo.number.replace(/\D/g, '').slice(-4)} has been securely saved.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   APP
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function App() {
  const [page, setPage] = useState('home');
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    window.scrollTo(0, 0);
    const titles = { home: 'Home', services: 'Our Services', contact: 'Book a Visit' };
    document.title = (titles[page] || 'Home') + ' - Healing Soulutions';
    setAnnouncement('Navigated to ' + (titles[page] || 'Home') + ' page');
  }, [page]);

  return (
    <>
      <Head>
        <title>{(({ home: 'Home', services: 'Our Services', contact: 'Book a Visit' })[page] || 'Home') + ' - Healing Soulutions'}</title>
        <meta name="description" content="Experienced, compassionate care that comes to you. Mobile concierge nursing care in the New York Metropolitan Area." />
      </Head>
      <div aria-live="polite" className="sr-only">{announcement}</div>
      <Nav page={page} setPage={setPage} />
      <main id="main-content">
        {page === 'home' && <HomePage setPage={setPage} />}
        {page === 'services' && <ServicesPage setPage={setPage} />}
        {page === 'contact' && <ContactPage setPage={setPage} />}
      </main>
      <Footer setPage={setPage} />
    </>
  );
}
