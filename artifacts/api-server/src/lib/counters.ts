let rfqCounter = 1000;
let poCounter = 1000;
let invoiceCounter = 1000;

export const nextRfqNumber = () => `RFQ-${++rfqCounter}`;
export const nextPoNumber = () => `PO-${++poCounter}`;
export const nextInvoiceNumber = () => `INV-${++invoiceCounter}`;
