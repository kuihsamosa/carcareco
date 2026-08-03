using Carmasters.Core.Application.Configuration;
using System;
using System.Threading.Tasks;

namespace Carmasters.Core.Application.Services
{
    public class TenantConfigService : ITenantConfigService
    {
        private readonly ITenantConfigRepository repository;

        public TenantConfigService(ITenantConfigRepository repository)
        {
            this.repository = repository ?? throw new ArgumentNullException(nameof(repository));
        }

        public async Task<RequisitesOptions> GetRequisitesAsync()
        {
            var requisites = await repository.GetRequisitesAsync();

            return new RequisitesOptions(
                requisites.Name,
                requisites.Phone,
                requisites.Address,
                requisites.Email,
                requisites.BankAccount,
                requisites.RegNr,
                requisites.KMKR,
                requisites.Tagline,
                requisites.Website,
                requisites.Address2,
                requisites.City,
                requisites.Postcode,
                requisites.State,
                requisites.Country,
                requisites.Currency ?? "MYR",
                requisites.Logo != null ? Convert.ToBase64String(requisites.Logo) : null,
                requisites.LogoContentType
            );
        }

        public async Task<PricingOptions> GetPricingAsync()
        {
            var pricing = await repository.GetPricingAsync();

            var invoiceOptions = new InvoiceOptions(
                pricing.VatRate,
                pricing.SurCharge,
                pricing.Disclaimer,
                pricing.SignatureLine,
                pricing.InvoiceEmailContent,
                pricing.TermsAndConditions,
                pricing.WorkshopSignature != null ? Convert.ToBase64String(pricing.WorkshopSignature) : null,
                pricing.InvoiceNumberPrefix ?? "INV",
                pricing.DueDays > 0 ? pricing.DueDays : 30
            );

            var estimateOptions = new EstimateOptions(
                pricing.EstimateEmailContent
            );

            return new PricingOptions(invoiceOptions, estimateOptions);
        }

        public async Task<AppOptions> GetAppOptionsAsync()
        {
            var requisites = await GetRequisitesAsync();
            var pricing = await GetPricingAsync();

            return new AppOptions(requisites, pricing);
        }

        public async Task SaveRequisitesAsync(RequisitesOptions requisitesOptions)
        {
            var requisites = await repository.GetRequisitesAsync();

            byte[] logoBytes = null;
            if (!string.IsNullOrEmpty(requisitesOptions.LogoBase64))
                logoBytes = Convert.FromBase64String(requisitesOptions.LogoBase64);

            requisites.UpdateProfile(
                requisitesOptions.Name,
                requisitesOptions.Tagline,
                requisitesOptions.Phone,
                requisitesOptions.Email,
                requisitesOptions.Website,
                requisitesOptions.Address,
                requisitesOptions.Address2,
                requisitesOptions.City,
                requisitesOptions.Postcode,
                requisitesOptions.State,
                requisitesOptions.Country,
                requisitesOptions.BankAccount,
                requisitesOptions.RegNr,
                requisitesOptions.KMKR,
                requisitesOptions.Currency,
                logoBytes,
                requisitesOptions.LogoContentType
            );

            await repository.SaveRequisitesAsync(requisites);
        }

        public async Task SavePricingAsync(PricingOptions pricingOptions)
        {
            var pricing = await repository.GetPricingAsync();

            byte[] signatureBytes = null;
            if (!string.IsNullOrEmpty(pricingOptions.Invoice.WorkshopSignatureBase64))
                signatureBytes = Convert.FromBase64String(pricingOptions.Invoice.WorkshopSignatureBase64);

            pricing.UpdateFull(
                pricingOptions.Invoice.VatRate,
                pricingOptions.Invoice.SurCharge,
                pricingOptions.Invoice.Disclaimer,
                pricingOptions.Invoice.SignatureLine,
                pricingOptions.Invoice.EmailContent,
                pricingOptions.Estimate.EmailContent,
                pricingOptions.Invoice.TermsAndConditions,
                signatureBytes,
                pricingOptions.Invoice.InvoiceNumberPrefix,
                pricingOptions.Invoice.DueDays
            );

            await repository.SavePricingAsync(pricing);
        }

        public async Task SaveAppOptionsAsync(AppOptions appOptions)
        {
            await SaveRequisitesAsync(appOptions.Requisites);
            await SavePricingAsync(appOptions.Pricing);
        }
    }
}
