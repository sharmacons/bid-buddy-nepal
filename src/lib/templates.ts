import { CompanyProfile, BidData, JVPartner, Gender } from './types';

// ==========================================
// PPMO STANDARD BIDDING DOCUMENT TEMPLATES
// Based on SBD for Procurement of Works (NCB)
// Matches real Nepal PPMO document formats
// ==========================================

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
// LETTER OF BID
// ==========================================
export function letterOfBidTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name / कम्पनीको नाम]';
  const addr = profile?.address || '[Address / ठेगाना]';
  const rep = profile?.authorizedRepresentative || '[Authorized Representative]';
  const title = honorific(profile?.gender);
  const desig = shortDesignation(profile?.designation || '');
  const pan = profile?.panVatNumber || '[PAN/VAT]';
  const project = bid?.projectName || '[Name of Contract / परियोजनाको नाम]';
  const employer = bid?.employer || '[Employer Name / नियोक्ताको नाम]';
  const employerAddr = bid?.employerAddress || '[Employer Address]';
  const ifb = bid?.ifbNumber || '[IFB Number]';
  const amount = bid?.bidAmount || '________________';
  const amountWords = bid?.bidAmountWords || '________________________________';
  const validity = bid?.bidValidity || '90';
  const commence = bid?.commencementDays || '______';
  const completion = bid?.completionPeriod || '______';
  const perfSecurity = bid?.performanceSecurityPercent || '____';

  return `LETTER OF BID (बोलपत्र पत्र)

Date: ${new Date().toLocaleDateString('en-GB')}

Name of the Contract: ${project}
Invitation for Bid No.: ${ifb}

To: ${employer}
    ${employerAddr}

We, the undersigned, declare that:

(a) We have examined and have no reservations to the Bidding Documents, including Addenda issued in accordance with Instructions to Bidders (ITB) Clause 8;

(b) We offer to execute in conformity with the Bidding Documents the following Works: ${project}

(c) The total price of our Bid, excluding any discounts offered in item (d) below is:
    NPR ${amount} (in figures)
    (Nepali Rupees ${amountWords} only) (in words)

(d) The discounts offered and the methodology for their application are: ______________________

(e) Our bid shall be valid for a period of ${validity} days from the date fixed for the bid submission deadline in accordance with the Bidding Documents, and it shall remain binding upon us and may be accepted at any time before the expiration of that period;

(f) If our bid is accepted, we commit to obtain a performance security in accordance with the Bidding Document;

(g) Our firm, including any subcontractors or suppliers for any part of the Contract, have nationalities from Nepal;

(h) We, including any subcontractors or suppliers for any part of the contract, do not have any conflict of interest in accordance with ITB 4.3;

(i) We are not participating, as a Bidder or as a subcontractor, in more than one bid in this bidding process in accordance with ITB 4.3;

(j) Our firm, its affiliates or subsidiaries, including any Subcontractors or Suppliers for any part of the contract, has not been declared ineligible;

(k) We are not a government owned entity;

(l) We understand that this bid, together with your written acceptance thereof included in your notification of award, shall constitute a binding contract between us, until a formal contract is prepared and executed;

(m) We declare that we have not been blacklisted as per ITB 3.4 and no conflict of interest in the proposed procurement proceedings;

(n) We declare that we have not running contracts more than five (5) in accordance with ITB 4.8;

(o) We understand that you are not bound to accept the lowest evaluated bid or any other bid that you may receive; and

(p) If awarded the contract, the person named below shall act as Contractor's Representative:
    Name: ${title} ${rep}

(q) We agree to permit the Employer or its representative to inspect our accounts and records and other documents relating to the bid submission.

If our Bid is accepted, we undertake to commence the Works within ${commence} days and to complete the whole of the Works within ${completion} days from the date of receipt of the Letter of Acceptance.

If our Bid is accepted, we will obtain the guarantee of a bank in a sum equivalent to ${perfSecurity}% of the Accepted Contract Amount for the due performance of the Contract.

Name: ${title} ${rep}
In the capacity of: ${desig}
Signed: ___________________________
Duly authorized to sign the Bid for and on behalf of: ${co}
Date: ${new Date().toLocaleDateString('en-GB')}

${co}
${addr}
PAN/VAT: ${pan}`;
}

// ==========================================
// BID SECURITY
// ==========================================
export function bidSecurityTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Bidder Name / बोलपत्रदाताको नाम]';
  const employer = bid?.employer || '[Employer Name and Address]';
  const project = bid?.projectName || '[Name of Contract]';
  const ifb = bid?.ifbNumber || '[IFB Number]';
  const amount = bid?.bidSecurityAmount || '____________';
  const validity = bid?.bidValidity || '90';

  return `BID SECURITY — BANK GUARANTEE (बोलपत्र जमानत)
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

___________________________
[Signature of Authorized Bank Representative]
[Name and Title]
[Bank Seal]`;
}

// ==========================================
// POWER OF ATTORNEY — Based on PPMO format
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

Date : ${new Date().toLocaleDateString('en-GB')}

POWER OF ATTORNEY (अख्तियारनामा)

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
E-mail : ${email}`;
}

// ==========================================
// DECLARATION OF UNDERTAKING — PPMO format
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

Date : ${new Date().toLocaleDateString('en-GB')}

Subject :- Declaration of Undertaking

We underscore the importance of a free, fair and competitive procurement process that precludes fraudulent use. In this respect we have neither offered nor granted, directly or indirectly, any inadmissible advantages to any public servants or other persons in connection with our tender nor will we offer or grant any such incentives or conditions in the present procurement process or, in the event that we are awarded the contract, in the subsequent execution of the contract. We are not ineligible to participate in the bid; have no conflict of interest in the proposed bid procurement proceedings and have not been punished for the profession or business related offence.

We also underscore the importance of adhering to minimum social standards ("core labour standard") in the implementation of the project. We undertake to comply with the Core Labour Standards ratified by the country of Nepal.

We will inform our staff about their respective obligations and about their obligation to fulfill this declaration of undertaking and to obey the laws of the country Nepal.

………………………..

${title} ${rep}

${desig}

For and on behalf of ${co}

Contact : ${phone}
E-mail : ${email}`;
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
(बोलपत्रदाताको जानकारी)

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
4. □ In case of a government-owned entity, any additional documents required to comply with ITB 4.5.`;
}

// ==========================================
// ELI-2: JV INFORMATION SHEET
// ==========================================
export function jvInfoELI2Template(partner: JVPartner, leadBidderName: string): string {
  const title = honorific(partner.gender);
  const desig = shortDesignation(partner.designation);

  return `FORM ELI-2: JV INFORMATION SHEET
(संयुक्त उपक्रम जानकारी)
Each member of a JV must fill in this form

Bidder's legal name:                          ${leadBidderName}

JV Partner's legal name:                      ${partner.legalName || '[Partner Name]'}
JV Partner's country of constitution:         ${partner.country || 'Nepal'}
JV Partner's year of constitution:            ${partner.yearOfConstitution || '[Year]'}
JV Partner's legal address:                   ${partner.address || '[Address]'}
JV Partner's PAN/VAT:                         ${partner.panVatNumber || '[PAN/VAT]'}
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
3. □ In case of government-owned entity, documents establishing legal and financial autonomy`;
}

// ==========================================
// ELI-3: RUNNING CONTRACTS
// ==========================================
export function runningContractsELI3Template(contracts: Array<{name: string; sourceOfFund: string; dateOfAcceptance: string; status: string; takingOverDate?: string}>): string {
  let table = `FORM ELI-3: BIDDER'S RUNNING CONTRACTS
(बोलपत्रदाताको चालु ठेक्काहरू)
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
c) Contracts running under all types of foreign assistance`;

  return table;
}

// ==========================================
// JV AGREEMENT — Based on uploaded reference
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
  const ifb = bid?.ifbNumber || '[IFB Number]';

  // Build JV name
  const partnerShortNames = [lead.split(' ')[0], ...partners.map(p => (p.legalName || 'Partner').split(' ')[0])];
  const jvName = `M/S ${partnerShortNames.join('-')} Joint Venture`;
  const jvEmail = partners[0]?.contactEmail || profile?.contactEmail || '[Email]';

  // Partner introductions
  let partnerIntros = `M/s ${lead} shortly known as "${lead.split(' ')[0]}" having its head office at ${leadAddr}, Nepal hereby called the first partner`;
  partners.forEach((p, i) => {
    const shortName = (p.legalName || 'Partner').split(' ')[0];
    partnerIntros += `, M/s ${p.legalName || '[Partner Name]'} shortly known as "${shortName}" having its head office at ${p.address || '[Address]'}, Nepal`;
  });
  partnerIntros += ` all duly organized and existing under the law of Nepal.`;

  // Share distribution
  let shareList = `- a) M/s ${lead} ____%`;
  partners.forEach((p, i) => {
    shareList += `\n- ${String.fromCharCode(98 + i)}) M/s ${p.legalName || '[Partner Name]'} ${p.sharePercentage || '____'}%`;
  });

  // Signature blocks
  let signatures = `…………………………\n\n${leadTitle} ${leadRep}\n\n${leadDesig}\n\n${lead}`;
  partners.forEach(p => {
    const pTitle = honorific(p.gender);
    const pDesig = shortDesignation(p.designation);
    signatures += `\n\n…………………………\n\n${pTitle} ${p.authorizedRepresentative || '[Name]'}\n\n${pDesig}\n\n${p.legalName || '[Partner Name]'}`;
  });

  return `JOINT VENTURE AGREEMENT (संयुक्त उपक्रम सम्झौता)

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
// JV POWER OF ATTORNEY — Based on uploaded reference
// ==========================================
export function jvPowerOfAttorneyTemplate(profile: CompanyProfile | null, partners: JVPartner[], bid?: Partial<BidData>): string {
  const lead = profile?.companyName || '[Lead Partner Name]';
  const leadAddr = profile?.address || '[Address]';

  // Build JV name
  const partnerShortNames = [lead.split(' ')[0], ...partners.map(p => (p.legalName || 'Partner').split(' ')[0])];
  const jvName = `${partnerShortNames.join('-')} Joint Venture`;
  const project = bid?.projectName || '[Project Name]';
  const contractId = bid?.contractId || '[Contract ID]';

  // Use partner-in-charge representative (first partner with highest share or lead)
  const allReps = [
    { name: profile?.authorizedRepresentative || '[Name]', gender: profile?.gender, father: profile?.fatherName, grandfather: profile?.grandfatherName, desig: profile?.designation, company: lead },
    ...partners.map(p => ({ name: p.authorizedRepresentative, gender: p.gender, father: p.fatherName, grandfather: p.grandfatherName, desig: p.designation, company: p.legalName })),
  ];

  // The POA is typically given to one person from the JV
  const attorney = allReps[0]; // Lead partner representative
  const attTitle = honorific(attorney.gender);
  const attDesig = shortDesignation(attorney.desig || '');

  // Signature blocks for all partners
  let signatureBlocks = '';
  signatureBlocks += `Name: ${honorific(profile?.gender)} ${profile?.authorizedRepresentative || '[Name]'}
Signature of Partner In-Charge
Designation: ${shortDesignation(profile?.designation || '')}
${lead}`;

  partners.forEach((p, i) => {
    const pTitle = honorific(p.gender);
    const pDesig = shortDesignation(p.designation);
    signatureBlocks += `\n\nName: ${pTitle} ${p.authorizedRepresentative || '[Name]'}
Signature of ${i === 0 ? 'Second' : 'Third'} Partner
Designation: ${pDesig}
${p.legalName || '[Partner Name]'}`;
  });

  return `${jvName}
${leadAddr}

POWER OF ATTORNEY (अख्तियारनामा)

Date: ${new Date().toLocaleDateString('en-GB')}

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

  return `METHOD STATEMENT (कार्यविधि विवरण)

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

  return `SITE ORGANIZATION (स्थलीय संगठन)

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
  
  let schedule = `CONSTRUCTION SCHEDULE / BAR CHART (कार्य तालिका)

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

  return `MOBILIZATION SCHEDULE (परिचालन तालिका)

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
