import { CompanyProfile, BidData, JVPartner, Gender } from './types';

// ==========================================
// PPMO STANDARD BIDDING DOCUMENT TEMPLATES
// Based on SBD for Procurement of Works (NCB)
// ==========================================

const STAMP_SEAL = `
┌─────────────────────────────┐
│                             │
│     Company Stamp / Seal    │
│                             │
└─────────────────────────────┘`;

// Date helper - DD/MM/YYYY format
function formatDate(date?: Date): string {
  const d = date || new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function honorific(gender: Gender | undefined): string {
  if (gender === 'female') return 'Mrs.';
  if (gender === 'male') return 'Mr.';
  return 'Mr./Mrs.';
}

function shortDesignation(designation: string): string {
  if (designation.includes('Managing Director')) return 'M.D.';
  if (designation.includes('Proprietor')) return 'Proprietor';
  if (designation.includes('Partner')) return 'Partner';
  if (designation.includes('Director')) return 'Director';
  if (designation.includes('Chairman')) return 'Chairman';
  if (designation.includes('General Manager')) return 'G.M.';
  return designation || '[Designation]';
}

// ==========================================
// LETTER OF BID (Technical Envelope)
// PPMO SBD NCB Two-Envelope System
// ==========================================
export function letterOfBidTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Authorized Representative]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[PAN/VAT]';
  const project = bid?.projectName || '[Name of Contract]';
  const employer = bid?.employer || '[Employer Name]';
  const employerAddr = bid?.employerAddress || '[Employer Address]';
  const ifb = bid?.ifbNumber || '[IFB Number]';
  const validity = bid?.bidValidity || '90';
  const commence = bid?.commencementDays || '______';
  const completion = bid?.completionPeriod || '______';
  const perfSecurity = bid?.performanceSecurityPercent || '____';

  return `LETTER OF BID
(Technical Envelope)

Date: ${formatDate()}

Name of the Contract: ${project}
Invitation for Bid No.: ${ifb}

To: ${employer}
    ${employerAddr}

We, the undersigned, declare that:

(a) We have examined and have no reservations to the Bidding Documents, including Addenda issued in accordance with Instructions to Bidders (ITB) Clause 8;

(b) We offer to execute in conformity with the Bidding Documents the following Works: ${project};

(c) Our bid shall be valid for a period of ${validity} days from the date fixed for the bid submission deadline in accordance with the Bidding Documents, and it shall remain binding upon us and may be accepted at any time before the expiration of that period;

(d) If our bid is accepted, we commit to obtain a performance security in accordance with the Bidding Document;

(e) Our firm, including any subcontractors or suppliers for any part of the Contract, have nationalities from Nepal;

(f) We, including any subcontractors or suppliers for any part of the contract, do not have any conflict of interest in accordance with ITB 4.3;

(g) We are not participating, as a Bidder or as a subcontractor, in more than one bid in this bidding process in accordance with ITB 4.3(a) unless otherwise allowed under ITB 4.3(a);

(h) Our firm, its affiliates or subsidiaries, including any Subcontractors or Suppliers for any part of the contract, has not been declared ineligible under the Employer's country laws or official regulations or by an act of compliance with a decision of the United Nations Security Council;

(i) We are not a government owned entity;

(j) We understand that this bid, together with your written acceptance thereof included in your notification of award, shall constitute a binding contract between us, until a formal contract is prepared and executed;

(k) We declare that we have not been blacklisted as per ITB 3.4 and no conflict of interest in the proposed procurement proceedings;

(l) We declare that we have not running contracts more than five (5) in accordance with ITB 4.8;

(m) We understand that you are not bound to accept the lowest evaluated bid or any other bid that you may receive; and

(n) If awarded the contract, the person named below shall act as Contractor's Representative:
    Name: ${title} ${rep}

(o) We agree to permit the Employer or its representative to inspect our accounts and records and other documents relating to the bid submission.

If our Bid is accepted, we undertake to commence the Works within ${commence} days and to complete the whole of the Works within ${completion} days from the date of receipt of the Letter of Acceptance.

If our Bid is accepted, we will obtain the guarantee of a bank in a sum equivalent to ${perfSecurity}% of the Accepted Contract Amount for the due performance of the Contract.

Name: ${title} ${rep}
In the capacity of: ${desig}
Signed: ___________________________                ${STAMP_SEAL}
Duly authorized to sign the Bid for and on behalf of: ${co}
Date: ${formatDate()}

${co}
${addr}
PAN/VAT: ${pan}`;
}

// ==========================================
// LETTER OF PRICE BID (Financial Envelope)
// PPMO SBD NCB Two-Envelope System
// ==========================================
export function letterOfPriceBidTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Authorized Representative]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[PAN/VAT]';
  const project = bid?.projectName || '[Name of Contract]';
  const employer = bid?.employer || '[Employer Name]';
  const employerAddr = bid?.employerAddress || '[Employer Address]';
  const ifb = bid?.ifbNumber || '[IFB Number]';
  const amount = bid?.bidAmount || '________________';
  const amountWords = bid?.bidAmountWords || '________________________________';

  return `LETTER OF PRICE BID
(Financial Envelope)

Date: ${formatDate()}

Name of the Contract: ${project}
Invitation for Bid No.: ${ifb}

To: ${employer}
    ${employerAddr}

We, the undersigned, offer to execute the Works described above in the attached Letter of Bid in conformity with the Bidding Documents and the following amounts:

(a) The total price of our Bid, excluding any discounts offered in item (b) below is:

    NPR ${amount} (in figures)
    (Nepali Rupees ${amountWords} only) (in words)

    The above amounts are in accordance with the Price Schedules attached herewith and are made part of this Price Bid.

(b) The discounts offered and the methodology for their application are:
    ______________________

Name: ${title} ${rep}
In the capacity of: ${desig}
Signed: ___________________________                ${STAMP_SEAL}
Duly authorized to sign the Price Bid for and on behalf of: ${co}
Date: ${formatDate()}

${co}
${addr}
PAN/VAT: ${pan}`;
}

// ==========================================
// BID SECURITY
// ==========================================
export function bidSecurityTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Bidder Name]';
  const employer = bid?.employer || '[Employer Name and Address]';
  const project = bid?.projectName || '[Name of Contract]';
  const ifb = bid?.ifbNumber || '[IFB Number]';
  const amount = bid?.bidSecurityAmount || '____________';
  const validity = bid?.bidValidity || '90';

  return `BID SECURITY — BANK GUARANTEE
[On Bank's Letterhead]

Bank's Name and Address of Issuing Branch or Office:
[Bank Name]
[Bank Address]

Beneficiary: ${employer}

Date: _______________

BID SECURITY No.: _______________

We have been informed that ${co} (hereinafter called "the Bidder") intends to submit its bid (hereinafter called "the Bid") to you for the execution of ${project} under Invitation for Bids No. ${ifb} ("the IFB").

Furthermore, we understand that, according to your conditions, bids must be supported by a bid guarantee. At the request of the Bidder, we [Bank Name] hereby irrevocably undertake to pay you any sum or sums not exceeding in total an amount of NPR ${amount} (Nepali Rupees _________________________ only) upon receipt by us of your first demand in writing accompanied by a written statement stating that the Bidder is in breach of its obligation(s) under the bid conditions, because the Bidder:

(a) has withdrawn or modified its Bid:
    (i) during the period of bid validity specified by the Bidder on the Letter of Bid, in case of electronic submission
    (ii) from the period twenty-four hours prior to bid submission deadline up to the period of bid validity specified by the Bidder on the Letter of Bid, in case of hard copy submission; or

(b) does not accept the correction of errors in accordance with the Instructions to Bidders (hereinafter "the ITB"); or

(c) having been notified of the acceptance of its Bid by the Employer during the period of bid validity, (i) fails or refuses to execute the Contract Agreement, or (ii) fails or refuses to furnish the performance security, in accordance with the ITB.

(d) is involved in fraud and corruption in accordance with the ITB.

This guarantee will remain in force up to and including the date ${validity} days after the deadline for submission of Bids as stated in the Instructions to Bidders or as it may be extended by the Employer, notice of which extension(s) to the Bank is hereby waived. Any demand in respect of this guarantee should reach the Bank not later than the above date.

This Bank guarantee shall not be withdrawn or released merely upon return of the original guarantee by the Bidder unless notified by you for the release of the guarantee.

This guarantee is subject to the Uniform Rules for Demand Guarantees, ICC Publication No. 758.

___________________________                        ${STAMP_SEAL}
[Signature of Authorized Bank Representative]
[Name and Title]
[Bank Seal]`;
}

// ==========================================
// POWER OF ATTORNEY
// ==========================================
export function powerOfAttorneyTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Name of Representative]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';
  const employer = bid?.employer || '[Employer Name]';
  const employerAddr = bid?.employerAddress || '[Employer Address]';

  return `${co}
Vat : ${profile?.panVatNumber || '[PAN/VAT]'}
${addr}

Date : ${formatDate()}

POWER OF ATTORNEY

To,
Officer in chief
${employer}
${employerAddr}

Dear Sir,

We the undersigned lawfully authorized to act on behalf of ${co} hereby delegates this Power of Attorney to ${title} ${rep} for above mentioned contract to do and execute all or any of the acts and things mentioned below in connection with above reference projects.

Attorney to ${title} ${rep}

1. To purchase, fill, sign, modify, withdraw, substitute, submit pre-qualification (Technical & Financial) & along with other documents as may require time to time on behalf of ${co}.
2. To deal and correspond with the employer or its representative in all matters, connected with the construction and execution of the contracts.
3. To discuss, negotiate, finalize, sign the contracts agreement and execute the contract if contract is awarded for ${co}.
4. To submit Running / final bill claim and VO if any to the projects.
5. To receive advance/running/final bill / retention payments from the projects.

Specimen signature of ${title} ${rep}

${desig}

${co}

Contact : ${phone}
E-mail : ${email}
${STAMP_SEAL}`;
}

// ==========================================
// DECLARATION OF UNDERTAKING
// ==========================================
export function declarationTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Representative Name]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';

  return `${co}
${addr}

Date : ${formatDate()}

Subject :- Declaration of Undertaking

We underscore the importance of a free, fair and competitive procurement process that precludes fraudulent use. In this respect we have neither offered nor granted, directly or indirectly, any inadmissible advantages to any public servants or other persons in connection with our tender nor will we offer or grant any such incentives or conditions in the present procurement process or, in the event that we are awarded the contract, in the subsequent execution of the contract. We are not ineligible to participate in the bid; have no conflict of interest in the proposed bid procurement proceedings and have not been punished for the profession or business related offence.

We also underscore the importance of adhering to minimum social standards ("core labour standard") in the implementation of the project. We undertake to comply with the Core Labour Standards ratified by the country of Nepal.

We will inform our staff about their respective obligations and about their obligation to fulfill this declaration of undertaking and to obey the laws of the country Nepal.

………………………..

${title} ${rep}

${desig}

For and on behalf of ${co}

Contact : ${phone}
E-mail : ${email}
${STAMP_SEAL}`;
}

// ==========================================
// ELI-1: BIDDER INFORMATION
// ==========================================
export function bidderInfoELI1Template(profile: CompanyProfile | null): string {
  const co = profile?.companyName || '[Bidder Legal Name]';
  const country = profile?.country || 'Nepal';
  const year = profile?.yearOfConstitution || '[Year]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Name]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';

  return `FORM ELI-1: BIDDER'S INFORMATION SHEET

Bidder's legal name:                    ${co}
Bidder's country of constitution:       ${country}
Bidder's year of constitution:          ${year}
Bidder's legal address:                 ${addr}

Bidder's authorized representative:
  Name:         ${title} ${rep}
  Designation:  ${desig}
  Address:      ${addr}
  Phone:        ${phone}
  Email:        ${email}

Attached are copies of the following original documents:

1. □ Articles of incorporation or constitution of the legal entity named above, in accordance with ITB 4.1 and 4.2.
2. □ Authorization to represent the firm named above, in accordance with ITB 17.2.
3. □ In case of JV, letter of intent to form JV or JV agreement, in accordance with ITB 4.1.
4. □ In case of a government-owned entity, any additional documents required to comply with ITB 4.5.

Signature: ___________________________
${STAMP_SEAL}`;
}

// ==========================================
// ELI-2: JV INFORMATION SHEET
// ==========================================
export function jvInfoELI2Template(partner: JVPartner, leadBidderName: string): string {
  const title = honorific(partner.gender);
  const desig = shortDesignation(partner.designation);

  return `FORM ELI-2: JV INFORMATION SHEET
Each member of a JV must fill in this form

Bidder's legal name:                          ${leadBidderName}

JV Partner's legal name:                      ${partner.legalName || '[Partner Name]'}
JV Partner's country of constitution:         ${partner.country || 'Nepal'}
JV Partner's year of constitution:            ${partner.yearOfConstitution || '[Year]'}
JV Partner's legal address:                   ${partner.address || '[Address]'}
JV Partner's PAN/VAT (Company):               ${partner.panVatNumber || '[Individual Company PAN]'}
(Note: JV PAN/VAT is issued only after contract award)
JV Partner's Registration No:                 ${partner.registrationNumber || '[Reg. No.]'}
JV Partner's share in JV:                     ${partner.sharePercentage || '___'}%

JV Partner's authorized representative:
  Name:         ${title} ${partner.authorizedRepresentative || '[Name]'}
  Designation:  ${desig}
  Father:       ${partner.fatherName || '[Father Name]'}
  Grandfather:  ${partner.grandfatherName || '[Grandfather Name]'}
  Phone:        ${partner.contactPhone || '[Phone]'}
  Email:        ${partner.contactEmail || '[Email]'}

Attached are copies of the following original documents:

1. □ Articles of incorporation or constitution of the legal entity named above
2. □ Authorization to represent the firm named above
3. □ In case of government-owned entity, documents establishing legal and financial autonomy
${STAMP_SEAL}`;
}

// ==========================================
// ELI-3: RUNNING CONTRACTS
// ==========================================
export function runningContractsELI3Template(contracts: Array<{name: string; sourceOfFund: string; dateOfAcceptance: string; status: string; takingOverDate?: string}>): string {
  let table = `FORM ELI-3: BIDDER'S RUNNING CONTRACTS
Each member of a JV must fill in this form

| S.N. | Name of Contract | Source of Fund | Date of Letter of Acceptance | Status | Taking Over Date |
|------|-----------------|----------------|------------------------------|--------|-----------------|
`;
  if (contracts.length === 0) {
    table += '| 1    | NIL             | -              | -                            | -      | -               |\n';
  } else {
    contracts.forEach((c, i) => {
      table += `| ${i + 1}    | ${c.name} | ${c.sourceOfFund} | ${c.dateOfAcceptance} | ${c.status} | ${c.takingOverDate || '-'} |\n`;
    });
  }

  table += `
Notes:
* Mention GON funded or DP funded or Other PE funded
** Mention "Yet to sign", "Running", or "Substantially completed"
*** Insert date of taking over certificate if applicable

Following contracts shall not be counted:
a) Contracts invited/accepted before 2078-12-03 B.S (March 17, 2022)
b) Contracts invited after 2078-12-03 B.S and accepted but work acceptance report approved per Rule 117 of PPR
c) Contracts running under all types of foreign assistance

${STAMP_SEAL}`;

  return table;
}

// ==========================================
// JV AGREEMENT
// ==========================================
export function jvAgreementTemplate(profile: CompanyProfile | null, partners: JVPartner[], bid?: Partial<BidData>): string {
  const lead = profile?.companyName || '[Lead Partner Name]';
  const leadAddr = profile?.address || '[Address]';
  const leadRep = profile?.authorizedRepresentative || '[Name]';
  const leadTitle = honorific(profile?.gender);
  const leadDesig = shortDesignation(profile?.designation || '');
  const project = bid?.projectName || '[Project Name]';
  const employer = bid?.employer || '[Employer Name]';
  const employerAddr = bid?.employerAddress || '[Employer Address]';
  const contractId = bid?.contractId || '[Contract ID]';

  const partnerShortNames = [lead.split(' ')[0], ...partners.map(p => (p.legalName || 'Partner').split(' ')[0])];
  const jvName = `M/S ${partnerShortNames.join('-')} Joint Venture`;
  const jvEmail = partners[0]?.contactEmail || profile?.contactEmail || '[Email]';

  let partnerIntros = `M/s ${lead} shortly known as "${lead.split(' ')[0]}" having its head office at ${leadAddr}, Nepal hereby called the first partner`;
  partners.forEach((p) => {
    const shortName = (p.legalName || 'Partner').split(' ')[0];
    partnerIntros += `, M/s ${p.legalName || '[Partner Name]'} shortly known as "${shortName}" having its head office at ${p.address || '[Address]'}, Nepal`;
  });
  partnerIntros += ` all duly organized and existing under the law of Nepal.`;

  let shareList = `- a) M/s ${lead} ____%`;
  partners.forEach((p, i) => {
    shareList += `\n- ${String.fromCharCode(98 + i)}) M/s ${p.legalName || '[Partner Name]'} ${p.sharePercentage || '____'}%`;
  });

  let signatures = `…………………………                              ${STAMP_SEAL}

${leadTitle} ${leadRep}

${leadDesig}

${lead}`;
  partners.forEach(p => {
    const pTitle = honorific(p.gender);
    const pDesig = shortDesignation(p.designation);
    signatures += `


…………………………                              ${STAMP_SEAL}

${pTitle} ${p.authorizedRepresentative || '[Name]'}

${pDesig}

${p.legalName || '[Partner Name]'}`;
  });

  return `JOINT VENTURE AGREEMENT

The Agreement is made on the _____ day of _________, 20___ Between ${partnerIntros}

Whereas the Government of Nepal, ${employer}, ${employerAddr} hereby called the "Employer" has invited Bid for the

| SN | Work Description | Contract Identification Number |
|----|-----------------|-------------------------------|
| 1  | ${project} | ${contractId} |

Now, WE UNDERSIGNED, responsible and authority representatives of joint venture partners namely Partner in charge and first partner DO AGREE as Follows

1. The purpose of Joint Venture Agreement is to supplement and enhance the technical, financial and administrative capacity of the joint venturing partners in order to successfully participate in bidding process and to enter into contract agreement and execution of the works, in the case the contract is awarded.

2. The application of the Bid shall be submitted in the name of joint venture, which shall be as follows: ${jvName}, Nepal, Email ID: ${jvEmail}. All correspondence, documents shall be addressed in this name.

3. The ratio of the participation of each individual joint venturing partner expressed as percentage of total contract value shall be as follows:
${shareList}

Nevertheless, all partners shall be liable joint and severally for the executing the works under the contract.

4. M/S ${lead} is hereby designated as Partner In-Charge${partners.map((p, i) => `, ${p.legalName || '[Partner Name]'} hereby designated as ${i === 0 ? 'Second' : 'Third'} Partner`).join('')} of the Joint Venture. The Partner In-Charge shall have the exclusive authority to deal with the Employer and incur liabilities and receive instruction for and on behalf of any and all parties, including receive payment and incur expenses and shall be overall responsible for the entire execution of the contract.

5. This agreement will come into force from the date of signing of this agreement and shall be enforced till the date of issuance of Defect Liability Certificate, in case the contract is awarded to the Joint Venture.

IN WITNESS whereof, the parties thereto have caused this Agreement to be executed the day and years first before written.

SIGNED AND SEALED BY AUTHORIZED REPRESENTATIVES OF ALL JOINT VENTURING PARTIES

${signatures}`;
}

// ==========================================
// JV POWER OF ATTORNEY
// ==========================================
export function jvPowerOfAttorneyTemplate(profile: CompanyProfile | null, partners: JVPartner[], bid?: Partial<BidData>): string {
  const lead = profile?.companyName || '[Lead Partner Name]';
  const leadAddr = profile?.address || '[Address]';

  const partnerShortNames = [lead.split(' ')[0], ...partners.map(p => (p.legalName || 'Partner').split(' ')[0])];
  const jvName = `${partnerShortNames.join('-')} Joint Venture`;
  const project = bid?.projectName || '[Project Name]';
  const contractId = bid?.contractId || '[Contract ID]';

  const allReps = [
    { name: profile?.authorizedRepresentative || '[Name]', gender: profile?.gender, father: profile?.fatherName, grandfather: profile?.grandfatherName, desig: profile?.designation, company: lead },
    ...partners.map(p => ({ name: p.authorizedRepresentative, gender: p.gender, father: p.fatherName, grandfather: p.grandfatherName, desig: p.designation, company: p.legalName })),
  ];

  const attorney = allReps[0];
  const attTitle = honorific(attorney.gender);
  const attDesig = shortDesignation(attorney.desig || '');

  let signatureBlocks = '';
  signatureBlocks += `Name: ${honorific(profile?.gender)} ${profile?.authorizedRepresentative || '[Name]'}
Signature of Partner In-Charge
Designation: ${shortDesignation(profile?.designation || '')}
${lead}
${STAMP_SEAL}`;

  partners.forEach((p, i) => {
    const pTitle = honorific(p.gender);
    const pDesig = shortDesignation(p.designation);
    signatureBlocks += `

Name: ${pTitle} ${p.authorizedRepresentative || '[Name]'}
Signature of ${i === 0 ? 'Second' : 'Third'} Partner
Designation: ${pDesig}
${p.legalName || '[Partner Name]'}
${STAMP_SEAL}`;
  });

  return `${jvName}
${leadAddr}

POWER OF ATTORNEY

Date: ${formatDate()}

Sub: - To whom it may concern

Dear Sir,

We certify that Grand Son of ${attorney.grandfather || '[Grandfather Name]'}, Son of ${attorney.father || '[Father Name]'}, ${attTitle} ${attorney.name} is authorized to sign ${jvName} all the Contract Document after the award of contract.

We further certify that on behalf of our firm that the information provided by ${attorney.gender === 'female' ? 'her' : 'him'} is true and complete. Here project is termed as contract no: ${contractId} (${project}).

We hereby permit and authorize ${attorney.gender === 'female' ? 'her' : 'him'} for the following activity from start of project till the period of hand over of project:

- To sign contract document and all other kind of document of project on behalf of ${jvName}.
- To open bank account on behalf of ${jvName} and completely operate the account with Stamp and Signature.
- To negotiate to all the parties which are concerned with ${jvName}.
- Take all the decision of project on behalf of ${jvName}.
- To appoint all the staff members.
- To sign all the hire and purchase agreement.

All the action in regarded will be accepted by the M/S ${jvName}. Specimen signature of ${attTitle} ${attorney.name} is attested below.

Thanking you,

Sincerely Yours,

Specimen Signature of signatories

Name Of Signatories: ${attTitle} ${attorney.name}

${signatureBlocks}`;
}

// ==========================================
// METHOD STATEMENT
// ==========================================
export function methodStatementTemplate(bid?: Partial<BidData>): string {
  const project = bid?.projectName || '[Project Name]';
  const methodology = bid?.methodology || '[Describe the construction methodology, approach, and technical solutions to be adopted for this project]';

  return `METHOD STATEMENT

Project: ${project}

1. INTRODUCTION
   Brief description of the project and understanding of scope of work.

2. CONSTRUCTION METHODOLOGY
${methodology}

3. QUALITY CONTROL
   - Material testing procedures
   - Quality assurance measures
   - Laboratory testing schedule

4. SAFETY MEASURES
   - Safety equipment and procedures
   - Emergency response plan
   - Environmental protection measures

5. TRAFFIC MANAGEMENT (if applicable)
   - Traffic diversion plan
   - Signage and safety measures during construction

6. ENVIRONMENTAL MANAGEMENT
   - Dust control measures
   - Waste disposal plan
   - Environmental mitigation measures`;
}

// ==========================================
// SITE ORGANIZATION
// ==========================================
export function siteOrganizationTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name]';
  const project = bid?.projectName || '[Project Name]';

  return `SITE ORGANIZATION

Project: ${project}
Contractor: ${co}

ORGANIZATIONAL STRUCTURE:

Project Manager
├── Site Engineer
│   ├── Sub-Engineer (Earthwork)
│   ├── Sub-Engineer (Structures)
│   └── Surveyor
├── Quality Control Engineer
│   └── Lab Technician
├── Safety Officer
├── Store Keeper
└── Office Assistant

KEY PERSONNEL:
| S.N. | Position              | Name | Qualification | Experience |
|------|-----------------------|------|---------------|------------|
| 1    | Project Manager       |      |               |            |
| 2    | Site Engineer         |      |               |            |
| 3    | Quality Control Engr. |      |               |            |
| 4    | Surveyor              |      |               |            |
| 5    | Safety Officer        |      |               |            |

EQUIPMENT LIST:
| S.N. | Equipment          | Capacity | Qty | Owned/Leased |
|------|--------------------|----------|-----|--------------|
| 1    | Excavator          |          |     |              |
| 2    | Bulldozer          |          |     |              |
| 3    | Loader             |          |     |              |
| 4    | Tipper Truck       |          |     |              |
| 5    | Roller (Vibratory) |          |     |              |
| 6    | Water Tanker       |          |     |              |
| 7    | Concrete Mixer     |          |     |              |`;
}

// ==========================================
// CONSTRUCTION SCHEDULE (BAR CHART)
// ==========================================
export function constructionScheduleTemplate(items: Array<{activity: string; duration: number; startWeek: number}>, totalWeeks: number): string {
  const maxWeek = totalWeeks || 24;
  
  let header = '| S.N. | Activity                              | Duration |';
  let separator = '|------|---------------------------------------|----------|';
  
  const months = Math.ceil(maxWeek / 4);
  for (let m = 1; m <= months; m++) {
    header += ` Month ${m} |`;
    separator += '---------|';
  }
  
  let schedule = `CONSTRUCTION SCHEDULE / BAR CHART

${header}
${separator}
`;

  items.forEach((item, i) => {
    let row = `| ${i + 1}    | ${item.activity.padEnd(37)} | ${item.duration}w      |`;
    
    for (let m = 1; m <= months; m++) {
      const monthStart = (m - 1) * 4 + 1;
      const monthEnd = m * 4;
      const itemEnd = item.startWeek + item.duration - 1;
      
      if (item.startWeek <= monthEnd && itemEnd >= monthStart) {
        row += ' ██████  |';
      } else {
        row += '         |';
      }
    }
    schedule += row + '\n';
  });

  schedule += `
Total Project Duration: ${maxWeek} weeks (${Math.ceil(maxWeek / 4)} months)

Legend: ██████ = Active work period

Note: This schedule is indicative and subject to adjustment based on actual site conditions, weather, and material availability.`;

  return schedule;
}

// ==========================================
// MOBILIZATION SCHEDULE
// ==========================================
export function mobilizationScheduleTemplate(bid?: Partial<BidData>): string {
  const project = bid?.projectName || '[Project Name]';

  return `MOBILIZATION SCHEDULE

Project: ${project}

| S.N. | Item                          | Week 1 | Week 2 | Week 3 | Week 4 |
|------|-------------------------------|--------|--------|--------|--------|
| 1    | Site Office Setup             | ██████ |        |        |        |
| 2    | Survey & Setting Out          | ██████ | ██████ |        |        |
| 3    | Equipment Mobilization        |        | ██████ | ██████ |        |
| 4    | Material Procurement (Initial)|        | ██████ | ██████ | ██████ |
| 5    | Labor Camp Setup              | ██████ | ██████ |        |        |
| 6    | Lab Setup                     |        |        | ██████ | ██████ |
| 7    | Commencement of Main Works    |        |        |        | ██████ |

Note: Mobilization to be completed within the commencement period specified in the contract.`;
}

// ==========================================
// NEPALI निबेदन TEMPLATES
// ==========================================

// Date in Nepali format helper
function nepaliDateStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ==========================================
// Running Bill निबेदन
// ==========================================
export function runningBillNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>, billNumber?: string): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';
  const billNo = billNumber || '[बिल नं.]';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: Running Bill (चालु बिल) भुक्तानी सम्बन्धमा ।

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य सम्पन्न गरिरहेको व्यहोरा विदितै छ ।

उक्त योजनाको हालसम्म भएको कार्य प्रगतिको आधारमा Running Bill No. ${billNo} को भुक्तानी दिनु हुन अनुरोध गर्दछु ।

संलग्न कागजातहरू:
१. कार्य प्रगति विवरण (Work Progress Report)
२. नाप जाँच किताब (Measurement Book)
३. गुणस्तर परीक्षण प्रतिवेदन (Quality Test Reports)
४. फोटोग्राफ (Site Photographs)
५. Invoice / बिल

अतः उपरोक्त बमोजिम चालु बिलको भुक्तानी प्रक्रिया अगाडि बढाई दिनु हुन विनम्र अनुरोध गर्दछु ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Lab Test निबेदन
// ==========================================
export function labTestNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: प्रयोगशाला परीक्षण (Lab Test) सम्बन्धमा ।

सन्दर्भ: ठेक्का नं. ${contractId} — ${project}

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य गरिरहेको व्यहोरा विदितै छ ।

उक्त योजनामा प्रयोग हुने निर्माण सामग्रीहरूको गुणस्तर सुनिश्चित गर्नको लागि प्रयोगशाला परीक्षण (Lab Test) गराउनु पर्ने भएकोले सोको लागि आवश्यक व्यवस्था मिलाई दिनु हुन अनुरोध गर्दछु ।

परीक्षण गराउनु पर्ने सामग्रीहरू:

| क्र.सं. | सामग्री (Material)           | परीक्षण (Test Type)                  | नमूना सं. |
|---------|------------------------------|---------------------------------------|----------|
| १       | माटो (Soil)                   | CBR Test / Proctor Test               |          |
| २       | ढुङ्गा (Aggregate)           | Aggregate Crushing Value / LA Abrasion|          |
| ३       | बालुवा (Sand)                 | Sieve Analysis / FM                   |          |
| ४       | सिमेन्ट (Cement)              | Compressive Strength Test             |          |
| ५       | विटुमिन (Bitumen)             | Penetration / Softening Point         |          |
| ६       | कंक्रिट (Concrete)            | Cube Test (7/14/28 days)              |          |
| ७       | रड (Reinforcement Steel)      | Tensile Strength Test                 |          |

अतः उपरोक्त सामग्रीहरूको प्रयोगशाला परीक्षण गराउन स्वीकृति प्रदान गरी दिनु हुन विनम्र अनुरोध गर्दछु ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// धरौटी रकम फिर्ता निबेदन (Security Deposit Refund)
// ==========================================
export function dharautiRakamFirtaNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';
  const perfSecurity = bid?.performanceSecurityPercent || '५';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: धरौटी रकम (Performance Security / Retention Money) फिर्ता सम्बन्धमा ।

सन्दर्भ: ठेक्का नं. ${contractId} — ${project}

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य सम्पन्न गरिसकेको / सार्वजनिक खरिद नियमावली बमोजिम Defect Liability Period (त्रुटी सच्याउने अवधि) पूरा भइसकेको व्यहोरा विदितै छ ।

उक्त ठेक्का सम्झौता अनुसार ${perfSecurity}% Performance Security / Retention Money वापत रोकिएको धरौटी रकम फिर्ता दिनु हुन अनुरोध गर्दछु ।

धरौटी रकम विवरण:
┌──────────────────────────────────────────────────────┐
│ ठेक्का रकम (Contract Amount):  NPR ________________ │
│ धरौटी प्रतिशत:                 ${perfSecurity}%                │
│ धरौटी रकम (Security Amount):   NPR ________________ │
│ Retention Money:               NPR ________________ │
│ जम्मा फिर्ता माग रकम:          NPR ________________ │
└──────────────────────────────────────────────────────┘

संलग्न कागजातहरू:
१. कार्य सम्पन्न प्रमाणपत्र (Work Completion Certificate)
२. अन्तिम बिल (Final Bill) — स्वीकृत प्रतिलिपि
३. Defect Liability Period सम्पन्न प्रमाण
४. कर चुक्ता प्रमाणपत्र (Tax Clearance Certificate)
५. Bank Guarantee मूल प्रति (यदि लागू भएमा)

अतः सार्वजनिक खरिद ऐन, २०६३ तथा सार्वजनिक खरिद नियमावली, २०६४ को प्रावधान अनुसार उपरोक्त धरौटी रकम यथाशीघ्र फिर्ता गरी दिनु हुन विनम्र अनुरोध गर्दछु ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Mobilization Advance निबेदन
// ==========================================
export function mobilizationAdvanceNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: Mobilization Advance (परिचालन अग्रिम रकम) सम्बन्धमा ।

सन्दर्भ: ठेक्का नं. ${contractId} — ${project}

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य सुचारु रूपमा सञ्चालन गर्नको लागि ठेक्का सम्झौता बमोजिम Mobilization Advance (परिचालन अग्रिम रकम) उपलब्ध गराई दिनु हुन अनुरोध गर्दछु ।

परिचालन अग्रिम विवरण:
┌──────────────────────────────────────────────────────┐
│ ठेक्का रकम (Contract Amount):  NPR ________________ │
│ अग्रिम प्रतिशत:                 १०%               │
│ अग्रिम रकम (Advance Amount):   NPR ________________ │
│ Bank Guarantee No.:            ________________     │
│ Bank Guarantee रकम:            NPR ________________ │
└──────────────────────────────────────────────────────┘

संलग्न कागजातहरू:
१. ठेक्का सम्झौता पत्र (Contract Agreement) — प्रतिलिपि
२. Bank Guarantee (अग्रिम रकम बराबरको)
३. कार्य सञ्चालन योजना (Work Plan / Mobilization Schedule)
४. बीमा प्रमाणपत्र (Insurance Certificate)
५. कम्पनी दर्ता / नवीकरण प्रमाणपत्र

अतः सार्वजनिक खरिद ऐन, २०६३ तथा सार्वजनिक खरिद नियमावली, २०६४ को प्रावधान अनुसार उपरोक्त Mobilization Advance यथाशीघ्र उपलब्ध गराई दिनु हुन विनम्र अनुरोध गर्दछु ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Time Extension निबेदन (समय थप)
// ==========================================
export function timeExtensionNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: ठेक्का अवधि थप (Time Extension) सम्बन्धमा ।

सन्दर्भ: ठेक्का नं. ${contractId} — ${project}

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य गरिरहेको व्यहोरा विदितै छ ।

निम्न कारणहरूले गर्दा निर्माण कार्य समयमा सम्पन्न हुन नसकेकोले ठेक्का अवधि थप गरी दिनु हुन अनुरोध गर्दछु:

विलम्बका कारणहरू (Reasons for Delay):
१. अत्यधिक वर्षा / बाढी / प्राकृतिक प्रकोप (Force Majeure)
२. जग्गा अधिग्रहण / Right of Way समस्या
३. Design परिवर्तन / Variation Order
४. सामग्री आपूर्तिमा विलम्ब (Supply Chain Delay)
५. नियोजक तर्फबाट निर्देशन / Drawing प्राप्त नभएको

समय थप विवरण:
┌──────────────────────────────────────────────────────┐
│ मूल ठेक्का अवधि:              ________ दिन         │
│ ठेक्का सम्झौता मिति:           ________________     │
│ मूल सम्पन्न मिति:              ________________     │
│ थप माग अवधि:                  ________ दिन         │
│ प्रस्तावित नयाँ सम्पन्न मिति:   ________________     │
│ हालसम्मको कार्य प्रगति:         ________%            │
└──────────────────────────────────────────────────────┘

संलग्न कागजातहरू:
१. विस्तृत विलम्ब विश्लेषण (Delay Analysis Report)
२. Site Record / Log Book प्रतिलिपि
३. मौसम विवरण (Weather Record) — यदि लागू भएमा
४. Correspondence / पत्राचार प्रतिलिपिहरू
५. संशोधित कार्य तालिका (Revised Work Schedule)

अतः सार्वजनिक खरिद ऐन, २०६३ को दफा ५५ तथा सार्वजनिक खरिद नियमावली, २०६४ को नियम ११९ बमोजिम ठेक्का अवधि थप गरी दिनु हुन विनम्र अनुरोध गर्दछु ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Variation Order निबेदन (भेरिएशन अर्डर)
// ==========================================
export function variationOrderNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const pan = profile?.panVatNumber || '[प्यान/भ्याट नं.]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = profile?.designation || '[पदनाम]';
  const phone = profile?.contactPhone || '[फोन नं.]';
  const project = bid?.projectName || '[योजनाको नाम]';
  const employer = bid?.employer || '[नियोजकको नाम]';
  const employerAddr = bid?.employerAddress || '[नियोजकको ठेगाना]';
  const contractId = bid?.contractId || '[ठेक्का नं.]';

  return `मिति: ${nepaliDateStr()}

श्रीमान् कार्यालय प्रमुख ज्यू,
${employer},
${employerAddr}

विषय: Variation Order (भेरिएशन अर्डर) स्वीकृति सम्बन्धमा ।

सन्दर्भ: ठेक्का नं. ${contractId} — ${project}

महोदय,

उपरोक्त सम्बन्धमा यस ${co} ले ठेक्का नं. ${contractId} अन्तर्गत ${project} योजनाको निर्माण कार्य गरिरहेको व्यहोरा विदितै छ ।

निर्माण कार्यको क्रममा तल उल्लेखित कार्यहरूमा परिवर्तन (Variation) आवश्यक भएकोले सोको स्वीकृति प्रदान गरी दिनु हुन अनुरोध गर्दछु ।

Variation विवरण:
| क्र.सं. | कार्य विवरण (Description)    | मूल परिमाण | परिवर्तित परिमाण | एकाइ   | दर (Rate) | रकम (Amount) |
|---------|------------------------------|-----------|-----------------|--------|----------|-------------|
| १       |                              |           |                 |        |          |             |
| २       |                              |           |                 |        |          |             |
| ३       |                              |           |                 |        |          |             |
| ४       |                              |           |                 |        |          |             |
| ५       |                              |           |                 |        |          |             |

┌──────────────────────────────────────────────────────┐
│ मूल ठेक्का रकम:                NPR ________________ │
│ Variation रकम:                 NPR ________________ │
│ Variation प्रतिशत:              ________%            │
│ संशोधित ठेक्का रकम:            NPR ________________ │
└──────────────────────────────────────────────────────┘

Variation को कारण:
१. Site Condition अपेक्षा भन्दा फरक भएको
२. Design परिवर्तन / Engineer को निर्देशन
३. नयाँ कार्य थप भएको (Additional Work)
४. परिमाणमा वृद्धि / कमी (Quantity Variation)

संलग्न कागजातहरू:
१. Variation Order विस्तृत विवरण (Detailed Variation Statement)
२. तुलनात्मक दर विश्लेषण (Comparative Rate Analysis)
३. Site Instruction / Engineer को पत्र
४. Drawing / Sketch (संशोधित)
५. फोटोग्राफ (Site Photographs)

अतः सार्वजनिक खरिद ऐन, २०६३ को दफा ५४ तथा सार्वजनिक खरिद नियमावली, २०६४ को नियम ११७ बमोजिम उपरोक्त Variation Order स्वीकृत गरी दिनु हुन विनम्र अनुरोध गर्दछु ।

नोट: सार्वजनिक खरिद नियमावली अनुसार Variation को सीमा मूल ठेक्का रकमको अधिकतम १५% सम्म हुन सक्नेछ ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// EOT Claim निबेदन (Extension of Time दाबी)
// ==========================================
export function eotClaimNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[प्यान/भ्याट]';
  const phone = profile?.contactPhone || '[फोन]';
  const proj = bid?.projectName || '[आयोजनाको नाम]';
  const employer = bid?.employer || '[नियोजक]';
  const ifb = bid?.ifbNumber || '[IFB नं.]';
  const contract = bid?.contractId || '[ठेक्का नं.]';

  return `श्रीमान् ${employer}
${bid?.employerAddress || '[नियोजकको ठेगाना]'}

विषय: Extension of Time (EOT) Claim सम्बन्धमा ।

सन्दर्भ:
  ठेक्का नं.: ${contract}
  IFB नं.: ${ifb}
  आयोजना: ${proj}
  मूल ठेक्का अवधि: ${bid?.totalDurationWeeks ? Math.ceil((bid.totalDurationWeeks) / 4) + ' महिना (' + bid.totalDurationWeeks + ' हप्ता)' : '[___] महिना'}
  ठेक्का सम्झौता मिति: [___________]
  मूल सम्पन्न मिति: [___________]

महोदय,

उपरोक्त सन्दर्भित ठेक्कामा ठेकेदार ${co} ले कार्य सम्पादन गरिरहेको छ । तर निम्नलिखित कारणहरूले गर्दा ठेक्का अवधि भित्र कार्य सम्पन्न गर्न सम्भव नभएको हुँदा Extension of Time (EOT) को दाबी प्रस्तुत गर्दछु ।

═══════════════════════════════════════════════════
          विलम्बको कारण र विश्लेषण (Delay Analysis)
═══════════════════════════════════════════════════

क्र.सं. │ विलम्बको कारण                    │ अवधि (दिन) │ श्रेणी
────────┼───────────────────────────────────┼─────────────┼──────────────
  १    │ अत्यधिक वर्षात् / बाढी            │  [___]      │ Force Majeure
  २    │ Site Handover विलम्ब               │  [___]      │ Employer Risk
  ३    │ Drawing / Design स्वीकृति ढिलाई    │  [___]      │ Employer Risk
  ४    │ Variation Order कार्य              │  [___]      │ Employer Risk
  ५    │ Utility Shifting ढिलाई            │  [___]      │ Third Party
  ६    │ Right of Way समस्या               │  [___]      │ Employer Risk
  ७    │ अन्य [___________________]        │  [___]      │ [_________]
────────┴───────────────────────────────────┴─────────────┴──────────────
         कुल विलम्ब (Gross Delay):            [___] दिन
         Concurrent Delay कटौती:              [___] दिन
         Net Excusable Delay:                 [___] दिन

═══════════════════════════════════════════════════
             EOT दाबी विवरण (Claim Summary)
═══════════════════════════════════════════════════

विवरण                              │ मिति / अवधि
────────────────────────────────────┼─────────────────
मूल ठेक्का अवधि                    │ [___] महिना
मूल सम्पन्न मिति                    │ [___________]
अनुरोधित EOT अवधि                  │ [___] दिन
संशोधित सम्पन्न मिति                │ [___________]
────────────────────────────────────┴─────────────────

FIDIC / PPA Reference:
  - FIDIC Clause 8.4: Extension of Time for Completion
  - सार्वजनिक खरिद ऐन, २०६३ दफा ५५
  - सार्वजनिक खरिद नियमावली, २०६४ नियम ११९

संलग्न कागजातहरू:
  १. विलम्ब विश्लेषण प्रतिवेदन (Delay Analysis Report)
  २. Critical Path Method (CPM) अद्यावधिक कार्यक्रम
  ३. मौसम विभागको प्रमाणपत्र (यदि लागू)
  ४. Site Diary / Log Book Extracts
  ५. Engineer का पत्रहरू / Site Instructions
  ६. Progress Photographs
  ७. Updated Work Programme (Bar Chart)

अतः सार्वजनिक खरिद नियमावली बमोजिम उपरोक्त EOT दाबी स्वीकृत गरी ठेक्का अवधि थप गरिदिनु हुन विनम्र अनुरोध गर्दछु ।

नोट: यो दाबीमा Prolongation Cost / Idling Cost समावेश गरिएको छैन । सो सम्बन्धमा छुट्टै दाबी प्रस्तुत गरिनेछ ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Interim Payment Certificate (IPC) निबेदन
// ==========================================
export function interimPaymentNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[प्यान/भ्याट]';
  const phone = profile?.contactPhone || '[फोन]';
  const proj = bid?.projectName || '[आयोजनाको नाम]';
  const employer = bid?.employer || '[नियोजक]';
  const ifb = bid?.ifbNumber || '[IFB नं.]';
  const contract = bid?.contractId || '[ठेक्का नं.]';

  return `श्रीमान् ${employer}
${bid?.employerAddress || '[नियोजकको ठेगाना]'}

विषय: Interim Payment Certificate (IPC) जारी गरिदिन निवेदन ।

सन्दर्भ:
  ठेक्का नं.: ${contract}
  IFB नं.: ${ifb}
  आयोजना: ${proj}
  IPC नं.: [___] (${formatDate()} सम्मको)
  बिल अवधि: [मिति] देखि [मिति] सम्म

महोदय,

उपरोक्त सन्दर्भित ठेक्कामा ठेकेदार ${co} ले सम्पादन गरेको कार्यको Interim Payment Certificate (IPC) जारी गरिदिनु हुन यो निवेदन पेश गर्दछु ।

═══════════════════════════════════════════════════
         कार्य सम्पादन सारांश (Work Summary)
═══════════════════════════════════════════════════

क्र.सं. │ विवरण                        │ रकम (रु.)
────────┼───────────────────────────────┼──────────────
  १    │ मूल ठेक्का रकम                │ [___________]
  २    │ Variation (यदि भए)            │ [___________]
  ३    │ संशोधित ठेक्का रकम            │ [___________]
────────┼───────────────────────────────┼──────────────
  ४    │ यस अवधि सम्म कार्य सम्पादन   │ [___________]
  ५    │ अघिल्लो IPC सम्म भुक्तानी     │ [___________]
  ६    │ यस अवधिको कार्य (4 - 5)      │ [___________]
────────┼───────────────────────────────┼──────────────
  ७    │ कट्टी (Deductions):           │
       │   - Advance Recovery          │ [___________]
       │   - Retention Money (५%)      │ [___________]
       │   - अन्य कट्टी               │ [___________]
────────┼───────────────────────────────┼──────────────
  ८    │ कुल कट्टी                     │ [___________]
  ९    │ भुक्तानीयोग्य रकम (6 - 8)    │ [___________]
────────┴───────────────────────────────┴──────────────

═══════════════════════════════════════════════════
        कार्य प्रगति विवरण (Progress Summary)
═══════════════════════════════════════════════════

विवरण                              │ प्रतिशत / अवधि
────────────────────────────────────┼─────────────────
भौतिक प्रगति (Physical Progress)    │ [___] %
आर्थिक प्रगति (Financial Progress)  │ [___] %
समय प्रगति (Time Progress)          │ [___] %
────────────────────────────────────┴─────────────────

संलग्न कागजातहरू:
  १. Measurement Book (M-Book) प्रतिलिपि
  २. Joint Measurement Sheet (Engineer सँग)
  ३. कार्य सम्पादन विस्तृत विवरण (BOQ wise)
  ४. Quality Test Reports
  ५. Progress Photographs (Before & After)
  ६. Updated Work Programme
  ७. Invoice / Bill

अतः सार्वजनिक खरिद ऐन, २०६३ को दफा ४८ तथा ठेक्का सम्झौताको शर्त बमोजिम उपरोक्त IPC जारी गरी भुक्तानी प्रक्रिया अगाडि बढाइदिनु हुन विनम्र अनुरोध गर्दछु ।

नोट: Engineer ले कार्य प्रमाणित गरिसकेपछि नियोजकले ५६ दिन भित्र भुक्तानी गर्नुपर्नेछ (FIDIC Clause 14.7) ।

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}

// ==========================================
// Material Approval निबेदन (सामग्री स्वीकृति)
// ==========================================
export function materialApprovalNibedanTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[कम्पनीको नाम]';
  const addr = profile?.address || '[ठेगाना]';
  const rep = profile?.authorizedRepresentative || '[अधिकृत प्रतिनिधि]';
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[प्यान/भ्याट]';
  const phone = profile?.contactPhone || '[फोन]';
  const proj = bid?.projectName || '[आयोजनाको नाम]';
  const employer = bid?.employer || '[नियोजक]';
  const ifb = bid?.ifbNumber || '[IFB नं.]';
  const contract = bid?.contractId || '[ठेक्का नं.]';

  return `श्रीमान् इन्जिनियर / परामर्शदाता
${employer}
${bid?.employerAddress || '[नियोजकको ठेगाना]'}

विषय: निर्माण सामग्री स्वीकृति (Material Approval) सम्बन्धमा ।

सन्दर्भ:
  ठेक्का नं.: ${contract}
  IFB नं.: ${ifb}
  आयोजना: ${proj}
  Material Submission नं.: [___]

महोदय,

उपरोक्त सन्दर्भित ठेक्कामा प्रयोग गरिने निर्माण सामग्रीहरूको स्वीकृतिको लागि यो निवेदन पेश गर्दछु ।

═══════════════════════════════════════════════════
         सामग्री विवरण (Material Details)
═══════════════════════════════════════════════════

क्र.सं. │ सामग्रीको नाम     │ Specification  │ परिमाण   │ Brand/Source
────────┼────────────────────┼────────────────┼──────────┼─────────────
  १    │ [_____________]    │ [__________]   │ [______] │ [_________]
  २    │ [_____________]    │ [__________]   │ [______] │ [_________]
  ३    │ [_____________]    │ [__________]   │ [______] │ [_________]
  ४    │ [_____________]    │ [__________]   │ [______] │ [_________]
  ५    │ [_____________]    │ [__________]   │ [______] │ [_________]
────────┴────────────────────┴────────────────┴──────────┴─────────────

═══════════════════════════════════════════════════
         प्रयोग स्थान र उद्देश्य (Usage Details)
═══════════════════════════════════════════════════

BOQ Item नं.       │ कार्य विवरण              │ प्रयोग स्थान
────────────────────┼──────────────────────────┼──────────────
[_____________]     │ [____________________]   │ Ch. [___] - [___]
[_____________]     │ [____________________]   │ Ch. [___] - [___]
────────────────────┴──────────────────────────┴──────────────

गुणस्तर मानक (Quality Standards):
  - Nepal Standard (NS): [___________]
  - Indian Standard (IS): [___________]
  - ASTM / BS Standard: [___________]
  - Contract Specification Reference: Section [___]

संलग्न कागजातहरू:
  १. सामग्रीको नमूना (Physical Sample) — यदि लागू
  २. निर्माता को गुणस्तर प्रमाणपत्र (Manufacturer Certificate)
  ३. Test Report / Mill Certificate
  ४. Material Safety Data Sheet (MSDS) — यदि लागू
  ५. Technical Brochure / Catalogue
  ६. Compliance Statement (Specification अनुरूप)
  ७. Source / Quarry Approval (यदि लागू)

अतः ठेक्का सम्झौताको शर्त तथा Technical Specification अनुसार उपरोक्त सामग्रीहरू स्वीकृत गरिदिनु हुन विनम्र अनुरोध गर्दछु ।

नोट: 
  - Engineer ले १४ दिन भित्र स्वीकृति वा अस्वीकृति दिनुपर्नेछ (FIDIC Clause 7.2)
  - स्वीकृत सामग्री मात्र Site मा प्रयोग गरिनेछ
  - सामग्री परिवर्तन भएमा पुनः स्वीकृति लिइनेछ

धन्यवाद ।

भवदीय,


…………………………
${rep}
${desig}
${co}
${addr}
प्यान/भ्याट नं.: ${pan}
सम्पर्क: ${phone}`;
}
