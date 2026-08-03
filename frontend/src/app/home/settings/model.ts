export interface IUserOptions {
    requisites: Requisites;
    pricing:    Pricing;
}

export interface Pricing {
    invoice:  Invoice;
    estimate: Estimate;
}

export interface Estimate {
    emailContent: string;
}

export interface Invoice {
    vatRate:                number;
    surCharge:              string;
    disclaimer:             string;
    signatureLine:          boolean;
    emailContent:           string;
    termsAndConditions:     string;
    workshopSignatureBase64: string | null;
    invoiceNumberPrefix:    string;
    dueDays:                number;
}

export interface Requisites {
    name:            string;
    phone:           string;
    address:         string;
    email:           string;
    bankAccount:     string;
    regNr:           string;
    kmkr:            string;
    tagline:         string;
    website:         string;
    address2:        string;
    city:            string;
    postcode:        string;
    state:           string;
    country:         string;
    currency:        string;
    logoBase64:      string | null;
    logoContentType: string | null;
}
