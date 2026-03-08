import { CompanyProfile } from './types';

export function letterOfBidTemplate(profile: CompanyProfile | null, projectName?: string, employer?: string): string {
  const co = profile?.companyName || '[Company Name]';
  const addr = profile?.address || '[Address]';
  const rep = profile?.authorizedRepresentative || '[Authorized Representative]';
  return `LETTER OF BID (बोलपत्र पत्र)

Date: _______________

To: ${employer || '[Employer Name]'}
    [Address]

Subject: Bid for ${projectName || '[Project Name]'}

Dear Sir/Madam,

We, the undersigned, ${co}, having our registered office at ${addr}, having examined the Bidding Documents including Addenda Nos. [insert numbers], the receipt of which is hereby duly acknowledged, offer to execute the ${projectName || '[Project Name]'} in conformity with the said Bidding Documents for the sum of:

NPR _________________ (in figures)
(Nepali Rupees _________________________________ only) (in words)

or such other sums as may be ascertained in accordance with the Schedule of Prices attached herewith.

We undertake, if our Bid is accepted, to commence the Works within _____ days and to complete the whole of the Works within _____ days from the date of receipt of the Letter of Acceptance.

If our Bid is accepted, we will obtain the guarantee of a bank in a sum equivalent to ____% of the Accepted Contract Amount for the due performance of the Contract.

We agree to abide by this Bid for a period of _____ days from the date fixed for Bid opening.

Yours faithfully,

${rep}
Authorized Signatory
${co}
${addr}`;
}

export function bidSecurityTemplate(profile: CompanyProfile | null): string {
  const co = profile?.companyName || '[Contractor Name]';
  return `BANK GUARANTEE FOR BID SECURITY (बोलपत्र जमानत)

[Bank's Name and Address]

Beneficiary: [Employer Name and Address]

Date: _______________

BID GUARANTEE No.: _______________

We have been informed that ${co} (hereinafter called "the Bidder") intends to submit a bid for the execution of [Name of Contract] under Invitation for Bids No. [IFB Number].

At the request of the Bidder, we [Bank Name] hereby irrevocably undertake to pay you any sum or sums not exceeding in total an amount of NPR _____________ (Nepali Rupees ___________________________ only) upon receipt by us of your first written demand accompanied by a written statement stating that the Bidder is in breach of its obligation(s) under the bid conditions.

This guarantee shall expire on _______________. Any demand in respect of this guarantee must reach the Bank not later than the above date.

___________________________
[Signature of Authorized Bank Representative]
[Name and Title]
[Bank Seal]`;
}

export function powerOfAttorneyTemplate(profile: CompanyProfile | null): string {
  const co = profile?.companyName || '[Company Name]';
  const rep = profile?.authorizedRepresentative || '[Name of Representative]';
  return `POWER OF ATTORNEY (अख्तियारनामा)

Know all men by these presents, We ${co} do hereby irrevocably constitute, nominate, appoint, and authorize ${rep} as our true and lawful attorney (hereinafter referred to as the "Attorney") to do in our name and on our behalf, all such acts, deeds, and things as are necessary or required in connection with or incidental to submission of our bid for the [Project Name] proposed by [Employer Name] including but not limited to:

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
