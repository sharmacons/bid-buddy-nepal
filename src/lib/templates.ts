import { CompanyProfile, BidData, JVPartner } from './types';

// ==========================================
// PPMO STANDARD BIDDING DOCUMENT TEMPLATES
// Based on SBD for Procurement of Works (NCB)
// ==========================================

export function letterOfBidTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name / कम्पनीको नाम]';
  const addr = profile?.address || '[Address / ठेगाना]';
  const rep = profile?.authorizedRepresentative || '[Authorized Representative / अधिकृत प्रतिनिधि]';
  const designation = profile?.designation || '[Designation / पद]';
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
[On Bidder's Letterhead]

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
    Name: ${rep}

(q) We agree to permit the Employer or its representative to inspect our accounts and records and other documents relating to the bid submission.

If our Bid is accepted, we undertake to commence the Works within ${commence} days and to complete the whole of the Works within ${completion} days from the date of receipt of the Letter of Acceptance.

If our Bid is accepted, we will obtain the guarantee of a bank in a sum equivalent to ${perfSecurity}% of the Accepted Contract Amount for the due performance of the Contract.

Name: ${rep}
In the capacity of: ${designation}
Signed: ___________________________
Duly authorized to sign the Bid for and on behalf of: ${co}
Date: ${new Date().toLocaleDateString('en-GB')}

${co}
${addr}
PAN/VAT: ${pan}`;
}

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

export function powerOfAttorneyTemplate(profile: CompanyProfile | null, bid?: Partial<BidData>): string {
  const co = profile?.companyName || '[Company Name / कम्पनीको नाम]';
  const rep = profile?.authorizedRepresentative || '[Name of Representative]';
  const project = bid?.projectName || '[Project Name]';
  const employer = bid?.employer || '[Employer Name]';

  return `POWER OF ATTORNEY (अख्तियारनामा)

Know all men by these presents, We ${co} do hereby irrevocably constitute, nominate, appoint, and authorize ${rep} as our true and lawful attorney (hereinafter referred to as the "Attorney") to do in our name and on our behalf, all such acts, deeds, and things as are necessary or required in connection with or incidental to submission of our bid for the ${project} proposed by ${employer} including but not limited to:

1. Signing and submission of the Bid and all documents related thereto
2. Attending the bid opening
3. Providing clarifications and responding to queries
4. Submission of information/documents as may be required
5. Signing of the Contract Agreement upon award

IN WITNESS WHEREOF, we have executed this Power of Attorney on this _____ day of _________, 20___.

For ${co}

___________________________
[Signature]
[Name, Designation]
[Company Seal]

Accepted:
${rep}
[Signature of Attorney]`;
}

export function bidderInfoELI1Template(profile: CompanyProfile | null): string {
  const co = profile?.companyName || '[Bidder Legal Name]';
  const country = profile?.country || 'Nepal';
  const year = profile?.yearOfConstitution || '[Year]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Name]';
  const phone = profile?.contactPhone || '[Phone]';
  const email = profile?.contactEmail || '[Email]';

  return `FORM ELI-1: BIDDER'S INFORMATION SHEET
(बोलपत्रदाताको जानकारी)

Bidder's legal name:                    ${co}
Bidder's country of constitution:       ${country}
Bidder's year of constitution:          ${year}
Bidder's legal address:                 ${addr}

Bidder's authorized representative:
  Name:      ${rep}
  Address:   ${addr}
  Phone:     ${phone}
  Email:     ${email}

Attached are copies of the following original documents:

1. □ Articles of incorporation or constitution of the legal entity named above, in accordance with ITB 4.1 and 4.2.
2. □ Authorization to represent the firm named above, in accordance with ITB 17.2.
3. □ In case of JV, letter of intent to form JV or JV agreement, in accordance with ITB 4.1.
4. □ In case of a government-owned entity, any additional documents required to comply with ITB 4.5.`;
}

export function jvInfoELI2Template(partner: JVPartner, leadBidderName: string): string {
  return `FORM ELI-2: JV INFORMATION SHEET
(संयुक्त उपक्रम जानकारी)
Each member of a JV must fill in this form

Bidder's legal name:                          ${leadBidderName}

JV Partner's legal name:                      ${partner.legalName || '[Partner Name]'}
JV Partner's country of constitution:         ${partner.country || 'Nepal'}
JV Partner's year of constitution:            ${partner.yearOfConstitution || '[Year]'}
JV Partner's legal address:                   ${partner.address || '[Address]'}
JV Partner's share in JV:                     ${partner.sharePercentage || '___'}%

JV Partner's authorized representative:
  Name:      ${partner.authorizedRepresentative || '[Name]'}
  Phone:     ${partner.contactPhone || '[Phone]'}
  Email:     ${partner.contactEmail || '[Email]'}

Attached are copies of the following original documents:

1. □ Articles of incorporation or constitution of the legal entity named above
2. □ Authorization to represent the firm named above
3. □ In case of government-owned entity, documents establishing legal and financial autonomy`;
}

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

export function jvAgreementTemplate(profile: CompanyProfile | null, partners: JVPartner[], bid?: Partial<BidData>): string {
  const lead = profile?.companyName || '[Lead Partner Name]';
  const project = bid?.projectName || '[Project Name]';
  const employer = bid?.employer || '[Employer Name]';

  let partnersList = '';
  partners.forEach((p, i) => {
    partnersList += `
${i + 2}. Partner ${i + 2}: ${p.legalName || '[Partner Name]'}
   Address: ${p.address || '[Address]'}
   Share: ${p.sharePercentage || '___'}%`;
  });

  return `JOINT VENTURE AGREEMENT (संयुक्त उपक्रम सम्झौता)

This Joint Venture Agreement is entered into on this _____ day of _________, 20___

BETWEEN:

1. Lead Partner: ${lead}
   Address: ${profile?.address || '[Address]'}
   Share: ____%${partnersList}

(hereinafter collectively referred to as "the Joint Venture")

FOR THE PURPOSE OF:
Submitting a bid and, if successful, executing the contract for:
Project: ${project}
Employer: ${employer}

TERMS AND CONDITIONS:

1. The Joint Venture partners agree to be jointly and severally liable for the execution of the Contract.

2. ${lead} shall be the Lead Partner and shall have the authority to conduct all business for and on behalf of any and all the partners of the Joint Venture during the bidding process and, in the event the JV is awarded the Contract, during contract execution.

3. The Lead Partner shall be authorized to incur liabilities, receive instructions and payments, and accept responsibility for and on behalf of the Joint Venture.

4. All partners of the Joint Venture shall be liable jointly and severally for the execution of the Contract in accordance with the Contract terms.

5. This agreement shall be governed by the laws of Nepal.

6. Maximum number of JV partners: 3 (three) as per BDS.

SIGNED BY THE AUTHORIZED REPRESENTATIVES:

For ${lead} (Lead Partner):
Name: ${profile?.authorizedRepresentative || '[Name]'}
Signature: ___________________________
Date: _______________
[Seal]
${partners.map((p, i) => `
For ${p.legalName || `[Partner ${i + 2}]`}:
Name: ${p.authorizedRepresentative || '[Name]'}
Signature: ___________________________
Date: _______________
[Seal]`).join('\n')}`;
}

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

export function constructionScheduleTemplate(items: Array<{activity: string; duration: number; startWeek: number}>, totalWeeks: number): string {
  const maxWeek = totalWeeks || 24;
  
  let header = '| S.N. | Activity                              | Duration |';
  let separator = '|------|---------------------------------------|----------|';
  
  // Create week columns (grouped by month)
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
