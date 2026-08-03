using System;

namespace Carmasters.Core.Domain
{

    public class TenantPricing : GuidIdentityEntity
    {
        public virtual int VatRate { get; protected set; }
        public virtual string SurCharge { get; protected set; }
        public virtual string Disclaimer { get; protected set; }
        public virtual bool SignatureLine { get; protected set; }
        public virtual string InvoiceEmailContent { get; protected set; }
        public virtual string EstimateEmailContent { get; protected set; }
        public virtual string TermsAndConditions { get; protected set; }
        public virtual byte[] WorkshopSignature { get; protected set; }
        public virtual string InvoiceNumberPrefix { get; protected set; }
        public virtual int DueDays { get; protected set; }
        public virtual DateTime CreatedAt { get; protected set; }
        public virtual DateTime UpdatedAt { get; protected set; }

        protected TenantPricing() { }

        public TenantPricing(
            int vatRate,
            string surCharge,
            string disclaimer,
            bool signatureLine,
            string invoiceEmailContent,
            string estimateEmailContent,
            Guid? id = null)
        {
            Id = id.GetValueOrDefault();
            VatRate = vatRate;
            SurCharge = surCharge;
            Disclaimer = disclaimer;
            SignatureLine = signatureLine;
            InvoiceEmailContent = invoiceEmailContent;
            EstimateEmailContent = estimateEmailContent;
            InvoiceNumberPrefix = "INV";
            DueDays = 30;
            CreatedAt = DateTime.UtcNow;
            UpdatedAt = DateTime.UtcNow;
        }

        public virtual void Update(
            int vatRate,
            string surCharge,
            string disclaimer,
            bool signatureLine,
            string invoiceEmailContent,
            string estimateEmailContent)
        {
            VatRate = vatRate;
            SurCharge = surCharge;
            Disclaimer = disclaimer;
            SignatureLine = signatureLine;
            InvoiceEmailContent = invoiceEmailContent;
            EstimateEmailContent = estimateEmailContent;
            UpdatedAt = DateTime.UtcNow;
        }

        public virtual void UpdateFull(
            int vatRate,
            string surCharge,
            string disclaimer,
            bool signatureLine,
            string invoiceEmailContent,
            string estimateEmailContent,
            string termsAndConditions,
            byte[] workshopSignature,
            string invoiceNumberPrefix,
            int dueDays)
        {
            VatRate = vatRate;
            SurCharge = surCharge;
            Disclaimer = disclaimer;
            SignatureLine = signatureLine;
            InvoiceEmailContent = invoiceEmailContent;
            EstimateEmailContent = estimateEmailContent;
            TermsAndConditions = termsAndConditions;
            WorkshopSignature = workshopSignature;
            InvoiceNumberPrefix = invoiceNumberPrefix ?? "INV";
            DueDays = dueDays > 0 ? dueDays : 30;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
